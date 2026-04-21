#!/usr/bin/env python3
"""Fetch per-species range maps from Wikipedia/Wikimedia Commons.

For each bird in public/data/birds.json:
  1. Query the species' Wikipedia article for all attached images.
  2. Pick the image whose filename best matches a distribution-map heuristic
     (contains "distribution" / "range" / "map").
  3. Resolve the file to a CDN URL, download it, resize rasters to 400 px.
  4. Save to public/birds/maps/{id}.{ext}.
  5. Rewrite birds.json to add/update `rangeMapUrl`. Drop the key for
     species with no detected map.

Idempotent: re-runs skip species whose local file already exists unless
--force is passed. Run after editing scripts/build-birds.py's BIRDS list
or adding new species.
"""
from __future__ import annotations
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIRDS_JSON = os.path.join(ROOT, "public", "data", "birds.json")
MAPS_DIR = os.path.join(ROOT, "public", "birds", "maps")
UA = "bird-catcher/1.0 (range-map fetcher)"

# Wikipedia page title lookups (same as build-birds.py)
WIKI_TITLES = {
    # Only override entries where the `scientific` name isn't the best page title.
    # Most birds resolve via title = common name from birds.json. If a fetch fails,
    # add an override here.
}


def wiki_api(params: dict) -> dict:
    params = {**params, "format": "json", "formatversion": "2"}
    qs = urllib.parse.urlencode(params)
    url = f"https://en.wikipedia.org/w/api.php?{qs}"
    result = subprocess.run(
        ["curl", "-sS", "-L", "--max-time", "15",
         "-H", f"User-Agent: {UA}", url],
        check=True, capture_output=True,
    )
    return json.loads(result.stdout)


def list_images(title: str) -> list[str]:
    """Return File: titles of all images on a given Wikipedia page."""
    data = wiki_api({
        "action": "query",
        "titles": title,
        "prop": "images",
        "imlimit": "100",
        "redirects": "1",
    })
    pages = data.get("query", {}).get("pages", [])
    if not pages:
        return []
    page = pages[0]
    if page.get("missing"):
        return []
    return [img["title"] for img in page.get("images", [])]


def extract_taxobox_range_map(title: str) -> str | None:
    """Grab the `range_map = ...` field from the article's lead wikitext.

    Many species-article range maps live in the Taxobox template and don't
    always surface via the `images` API (e.g. when transcluded through
    complex template chains). Parsing the wikitext is the most reliable
    way to recover them.
    """
    endpoint = (
        f"https://en.wikipedia.org/w/api.php?action=parse"
        f"&page={urllib.parse.quote(title)}"
        f"&prop=wikitext&section=0&redirects=1&format=json&formatversion=2"
    )
    try:
        result = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "15",
             "-H", f"User-Agent: {UA}", endpoint],
            check=True, capture_output=True,
        )
        data = json.loads(result.stdout)
        wt = data.get("parse", {}).get("wikitext", "")
    except Exception:
        return None

    # range_map = Foo.svg    (may have spaces / underscores, case-insensitive)
    match = re.search(
        r"range[_ ]?map\s*=\s*([^\n|}]+)",
        wt,
        re.IGNORECASE,
    )
    if not match:
        return None
    filename = match.group(1).strip()
    # Strip comments and stray markup
    filename = re.sub(r"<!--.*?-->", "", filename).strip()
    if not filename:
        return None
    # Normalize to "File:..." form
    if not filename.lower().startswith("file:"):
        filename = f"File:{filename}"
    return filename


def pick_range_map(image_titles: list[str]) -> str | None:
    """Score candidates; return the best-matching File: title or None."""
    best_score = 0
    best: str | None = None
    for t in image_titles:
        tl = t.lower()
        normalized = tl.replace(" ", "_").replace("-", "_")
        score = 0
        if "distribution" in tl:
            score += 10
        if "range" in tl:
            score += 8
        # "dist" catches hyphenated suffixes like "Night-Parrot-dist.svg"
        if "_dist" in normalized or "dist_" in normalized or normalized.endswith("dist.svg"):
            score += 8
        if "cypron" in tl:  # many Wikipedia species maps are authored by Cypron
            score += 5
        if "_map" in normalized or "map_" in normalized:
            score += 3
        # Exclude non-map noise
        if "iucn" in tl or "status" in tl:
            score -= 20
        if "logo" in tl or "icon" in tl:
            score -= 20
        if tl.endswith((".ogg", ".ogv", ".webm", ".mp3", ".wav")):
            score -= 100
        if score > best_score:
            best_score = score
            best = t
    return best if best_score >= 3 else None


def resolve_image_url(file_title: str) -> tuple[str, str] | None:
    """Return (url, extension) for a File: title, or None."""
    data = wiki_api({
        "action": "query",
        "titles": file_title,
        "prop": "imageinfo",
        "iiprop": "url",
    })
    pages = data.get("query", {}).get("pages", [])
    if not pages:
        return None
    infos = pages[0].get("imageinfo", [])
    if not infos:
        return None
    url = infos[0]["url"]
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower() or ".jpg"
    return url, ext


def download(url: str, path: str) -> bool:
    try:
        subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "30",
             "-H", "User-Agent: Mozilla/5.0",
             "-o", path, url],
            check=True, capture_output=True,
        )
        return os.path.exists(path) and os.path.getsize(path) > 500
    except Exception as e:
        print(f"[dl-fail] {url}: {e}", file=sys.stderr)
        return False


def resize_or_rasterize(path: str) -> str:
    """Resize raster images via sips; rasterize SVG to PNG via rsvg-convert.

    Returns the final path (may change extension if SVG → PNG).
    """
    if path.endswith(".svg"):
        png_path = path[:-4] + ".png"
        result = subprocess.run(
            ["rsvg-convert", "-w", "400", "-o", png_path, path],
            check=False, capture_output=True,
        )
        if result.returncode == 0 and os.path.exists(png_path):
            os.remove(path)
            return png_path
        # fallback: leave SVG as-is
        return path
    subprocess.run(
        ["sips", "-Z", "400", path, "--out", path],
        check=False, capture_output=True,
    )
    return path


def fetch_one(bird_id: str, wiki_title: str, force: bool) -> dict:
    """Return dict with id, status, ext (on success)."""
    # Any prior file for this bird, regardless of extension
    for existing_ext in (".jpg", ".jpeg", ".png", ".svg", ".gif"):
        existing = os.path.join(MAPS_DIR, f"{bird_id}{existing_ext}")
        if os.path.exists(existing) and not force:
            return {"id": bird_id, "status": "cached", "ext": existing_ext}

    # First try the Taxobox range_map field via wikitext — most reliable
    taxobox_match = extract_taxobox_range_map(wiki_title)
    match = taxobox_match

    # Fall back to scanning all images on the page with heuristics
    if not match:
        try:
            images = list_images(wiki_title)
        except Exception as e:
            return {"id": bird_id, "status": "err-list", "error": str(e)}
        if not images:
            return {"id": bird_id, "status": "no-page"}
        match = pick_range_map(images)
    if not match:
        return {"id": bird_id, "status": "no-match"}

    try:
        resolved = resolve_image_url(match)
    except Exception as e:
        return {"id": bird_id, "status": "err-resolve", "error": str(e)}

    if not resolved:
        return {"id": bird_id, "status": "no-url"}

    url, ext = resolved
    path = os.path.join(MAPS_DIR, f"{bird_id}{ext}")

    if not download(url, path):
        return {"id": bird_id, "status": "err-download"}

    final_path = resize_or_rasterize(path)
    final_ext = os.path.splitext(final_path)[1].lower()

    return {"id": bird_id, "status": "fetched", "ext": final_ext, "match": match}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="re-fetch even if file exists")
    parser.add_argument("--only", help="comma-separated bird IDs to fetch")
    args = parser.parse_args()

    with open(BIRDS_JSON) as f:
        birds = json.load(f)

    only = set(args.only.split(",")) if args.only else None

    os.makedirs(MAPS_DIR, exist_ok=True)

    # Resolve wiki title per bird — prefer common name
    def title_for(b: dict) -> str:
        return WIKI_TITLES.get(b["id"], b["name"])

    targets = [
        (b["id"], title_for(b))
        for b in birds
        if only is None or b["id"] in only
    ]

    results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_one, bid, t, args.force): bid for bid, t in targets}
        for fut in as_completed(futures):
            bid = futures[fut]
            try:
                r = fut.result()
            except Exception as e:
                r = {"id": bid, "status": "err-task", "error": str(e)}
            results[bid] = r
            status = r["status"]
            if status in ("fetched", "cached"):
                print(f"[{status:>8}] {bid}{r.get('ext','')}", file=sys.stderr)
            else:
                print(f"[{status:>8}] {bid}", file=sys.stderr)

    # Update birds.json with rangeMapUrl for successful fetches; drop key otherwise
    updated = []
    for b in birds:
        r = results.get(b["id"], {"status": "skipped"})
        if r["status"] in ("fetched", "cached"):
            # Find existing ext on disk (covers re-runs where ext might differ)
            ext = r.get("ext") or ""
            if not ext:
                for maybe in (".jpg", ".jpeg", ".png", ".svg", ".gif"):
                    if os.path.exists(os.path.join(MAPS_DIR, f"{b['id']}{maybe}")):
                        ext = maybe
                        break
            if ext:
                b["rangeMapUrl"] = f"/birds/maps/{b['id']}{ext}"
            else:
                b.pop("rangeMapUrl", None)
        else:
            b.pop("rangeMapUrl", None)
        updated.append(b)

    with open(BIRDS_JSON, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # Summary
    summary: dict[str, int] = {}
    for r in results.values():
        summary[r["status"]] = summary.get(r["status"], 0) + 1
    print("\n[summary]", file=sys.stderr)
    for k, v in sorted(summary.items()):
        print(f"  {k}: {v}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
