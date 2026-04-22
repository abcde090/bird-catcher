---
name: add-bird
description: Add one bird species to birds.json with all required fields and a real photo
allowed-tools: Read Edit Write Bash(curl*) Bash(sips*) Bash(python3*) Bash(npx tsc*) Bash(jq*)
argument-hint: "<bird-common-name>"
---

# Add Bird Species

Add a single bird to the dataset. For bulk additions (many birds at once), edit the `BIRDS` list in [scripts/build-birds.py](../../../scripts/build-birds.py) and re-run it instead — that's the authoritative generator.

## Schema

The current `BirdSpecies` interface lives in [src/types/bird.ts](../../../src/types/bird.ts):

```ts
interface BirdSpecies {
  id: string;                      // kebab-case, unique
  name: string;                    // display name, e.g. "Rainbow Lorikeet"
  scientific: string;              // "Trichoglossus moluccanus"
  category: string;                // loose grouping: Parrot, Songbird, Raptor, Waterbird, Cockatoo, Kingfisher, Honeyeater, Shorebird, Nocturnal, Dove, Ratite, Ground Bird, Insectivore
  status: ConservationStatus;      // "least_concern" | "near_threatened" | "vulnerable" | "endangered" | "critically_endangered"
  habitats: string[];              // free-form tags, e.g. ["forest","urban","coastal"]
  regions: AustralianStateId[];    // ["nsw","vic","qld","wa","sa","tas","nt","act"] subset
  diet: string;                    // "Nectarivore — nectar, pollen, fruits"
  funFact: string;                 // one sentence
  size: number;                    // length in cm
  population: string;              // display string, e.g. "5.2M", "42K", "<350"
  imageUrl: string;                // "/birds/{id}.jpg" — local path; rendered via asset() helper
  rangeMapUrl?: string;            // optional "/birds/maps/{id}.{png|jpg}" — fetched by fetch-range-maps.py
}
```

Status → rarity tier mapping (see `RARITY` and `TIER_SPAWN_WEIGHT` in [src/lib/game-config.ts](../../../src/lib/game-config.ts)):

| Status | Tier | Points | Tier spawn weight |
|---|---|---|---|
| `least_concern` | Common | 50 | 60 |
| `near_threatened` | Uncommon | 100 | 26 |
| `vulnerable` | Rare | 150 | 11 |
| `endangered` | Epic | 250 | 5 |
| `critically_endangered` | Legendary | 400 | 3 |

**The spawner picks a tier first**, then a species uniformly within that tier. Adding more species to a tier does NOT inflate how often that tier appears — so you can add as many Commons as you like without drowning out Legendaries. Still worth preserving a realistic Aussie distribution (many commons, a handful of endangered endemics).

## Process

Given `$ARGUMENTS` (a common name like "Eastern Whipbird"):

1. **Read** [src/types/bird.ts](../../../src/types/bird.ts) to confirm the schema hasn't changed.

2. **Check for duplicate ID** — `jq '[.[] | .id]' public/data/birds.json | grep -i "<proposed-id>"`. Pick a kebab-case `id` like `eastern-whipbird`.

3. **Fetch a real photo** using Wikipedia's REST summary endpoint — this is how the batch script works and it's reliable:
   ```bash
   curl -sS -L --max-time 15 \
     -H "User-Agent: bird-catcher/1.0" \
     "https://en.wikipedia.org/api/rest_v1/page/summary/Eastern_whipbird" \
     | jq -r '.originalimage.source // .thumbnail.source'
   ```
   Verify the URL returns a real bird photo. If Wikipedia returns nothing, try a different article title (Latin binomial, subspecies, regional name).

4. **Download and resize** to local storage:
   ```bash
   curl -sS -L --max-time 30 -H "User-Agent: Mozilla/5.0" \
     -o "public/birds/<id>.jpg" "<image-url>"
   sips -Z 320 "public/birds/<id>.jpg" --out "public/birds/<id>.jpg"
   ```
   Target ≤40 KB per file. If the result is still huge, the source was a massive original — rerun `sips -Z 320` (it's idempotent).

5. **Populate the remaining fields** from general knowledge: scientific name, category, conservation status (IUCN or EPBC Act), habitats, diet, size in cm, rough population, one fun fact.

6. **Regions** — pick the Australian states/territories where the bird is native or established. Subset of `["nsw","vic","qld","wa","sa","tas","nt","act"]`. Hand-curated per-species, even approximate is fine (used to highlight states on the fallback Australia map when no Wikipedia distribution image is available). See the `REGIONS` dict in [scripts/build-birds.py](../../../scripts/build-birds.py) for reference examples.

7. **Optional: range map** — if Wikipedia's article for the species has a distribution map, run `python3 scripts/fetch-range-maps.py --only <id>` to download and rasterize it into `public/birds/maps/`. The script adds `rangeMapUrl` to birds.json automatically. Skip if Wikipedia has no map — the Field Guide falls back to the stylized Australia silhouette with your `regions` highlighted.

8. **Append to [public/data/birds.json](../../../public/data/birds.json)** — add a new object at the end. Keep existing entries untouched (IDs are used as localStorage keys for `bc_discovered`, so changing them resets user progress).

9. **Verify**: `npx tsc --noEmit` and `npm run build` must pass. Open the dev server and check the bird appears in the Field Journal grid.

## Field-level guidance

- **`id`**: kebab-case, unique, short. Match the existing naming style — `kookaburra`, `red-backed-fairywren`, `swift-parrot`.
- **`category`**: keep it to one or two words. Look at existing entries for the vocabulary.
- **`habitats`**: free-form tags; common values are `forest`, `rainforest`, `urban`, `grassland`, `desert`, `coastal`, `wetland`, `alpine`. Don't introduce a new token unless necessary.
- **`funFact`**: punchy, one sentence, ideally something visually or behaviourally memorable — this is what the Card Reveal toast shows.
- **`population`**: display string. Use `M`/`K` for magnitude, `<` for rarities, `?` or `unknown` if you don't have a number.

## When to use the batch script instead

If the user is asking you to add more than about three birds at once, stop and edit [scripts/build-birds.py](../../../scripts/build-birds.py) — append tuples to the `BIRDS` list, run `python3 scripts/build-birds.py`, and let it handle the fetching + resizing + JSON write for you. That script is the source of truth for the dataset; maintaining parity with it is easier than hand-editing JSON.
