// Game components — Golden Hour Field Journal aesthetic
// Relies on window.BIRDS_DATA and window.BIRD_SILHOUETTES

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ============ CONFIG ============
const ROUND_DURATION = 90; // seconds
const MAX_MISSES = 10; // more forgiving
const MAX_ACTIVE = 6;

const RARITY = {
  least_concern: { label: "Common", points: 50, weight: 10, sizeScale: 1.1, speed: 0.85, color: "#6a8a3c", ring: "#9cb662" },
  near_threatened: { label: "Uncommon", points: 100, weight: 5, sizeScale: 1.0, speed: 1.0, color: "#d4a43a", ring: "#e8c260" },
  vulnerable: { label: "Rare", points: 150, weight: 3, sizeScale: 0.95, speed: 1.2, color: "#e08a3a", ring: "#f2a860" },
  endangered: { label: "Epic", points: 250, weight: 1, sizeScale: 0.9, speed: 1.4, color: "#c85530", ring: "#e87860" },
  critically_endangered: { label: "Legendary", points: 400, weight: 0.6, sizeScale: 0.85, speed: 1.6, color: "#9c3a70", ring: "#c85d96" },
};

const PHASES = [
  { id: "dawn", label: "Dawn", start: 90, end: 67,
    sky: ["#f5d6a0","#f0a86a","#d8785a","#6a4a5a"],
    sun: "#f5a85a", horizon: "#2a3138",
    allowed: ["least_concern"], spawn: 1.6 },
  { id: "noon", label: "Midday", start: 67, end: 45,
    sky: ["#a8d4e8","#7fb8d4","#c8e0e8","#e8d4b0"],
    sun: "#f5f0d8", horizon: "#4a5a48",
    allowed: ["least_concern","near_threatened"], spawn: 1.2 },
  { id: "dusk", label: "Dusk", start: 45, end: 22,
    sky: ["#d87030","#b8452a","#6a2840","#2a1a3a"],
    sun: "#e85a30", horizon: "#1a1018",
    allowed: ["least_concern","near_threatened","vulnerable","endangered"], spawn: 0.9 },
  { id: "night", label: "Night", start: 22, end: 0,
    sky: ["#1a1a2e","#0f0f22","#2a2040","#050510"],
    sun: "#e8d4a0", horizon: "#000000",
    allowed: ["least_concern","near_threatened","vulnerable","endangered","critically_endangered"], spawn: 0.7 },
];

const getPhase = (t) => PHASES.find(p => t <= p.start && t > p.end) || PHASES[PHASES.length-1];
const getComboMult = (c) => c >= 8 ? 4 : c >= 5 ? 3 : c >= 3 ? 2 : c >= 2 ? 1.5 : 1;

// ============ HELPERS ============
function weightedPick(items, getW) {
  const total = items.reduce((s,i) => s + getW(i), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= getW(it);
    if (r <= 0) return it;
  }
  return items[items.length-1];
}

function BirdSVG({ bird, size, facing }) {
  const path = window.BIRD_SILHOUETTES[bird.silhouette] || window.BIRD_SILHOUETTES.wren;
  const [body, accent, belly] = bird.palette;
  return (
    <svg viewBox="0 0 100 60" width={size} height={size*0.6}
         style={{transform: facing<0 ? "scaleX(-1)" : "none", display:"block", filter:"drop-shadow(0 3px 6px rgba(0,0,0,0.35))"}}>
      <path d={path} fill={body} stroke={accent} strokeWidth="1.2" strokeLinejoin="round"/>
      {/* highlight belly */}
      <path d={path} fill={belly} opacity="0.35" transform="translate(0 2)"/>
      {/* eye */}
      <circle cx="48" cy="22" r="1.6" fill="#0a0a0a"/>
      <circle cx="48.3" cy="21.6" r="0.5" fill="#fff"/>
      {/* beak */}
      <path d="M54 22 L60 23 L54 25 Z" fill="#d8a04a" stroke="#8a5e20" strokeWidth="0.4"/>
    </svg>
  );
}

Object.assign(window, { BirdSVG, RARITY, PHASES, ROUND_DURATION, MAX_MISSES, MAX_ACTIVE, getPhase, getComboMult, weightedPick });
