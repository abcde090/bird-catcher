// Curated subset of Australian birds with silhouette SVG paths
// Each bird has: id, name, scientific, category, status, habitats, diet,
// funFact, size (cm), population, silhouette (svg path data), palette (main colors)

window.BIRDS_DATA = [
  // LEAST CONCERN — common, common spawns
  {
    id: "kookaburra", name: "Laughing Kookaburra", scientific: "Dacelo novaeguineae",
    category: "Kingfisher", status: "least_concern", habitats: ["forest","urban"],
    diet: "Carnivore — insects, lizards, mice",
    funFact: "Their dawn 'laughing' chorus marks their territory boundaries.",
    size: 43, population: "11.3M", palette: ["#c9a37a","#6b4a2b","#f4e1c1"],
    silhouette: "kookaburra"
  },
  {
    id: "magpie", name: "Australian Magpie", scientific: "Gymnorhina tibicen",
    category: "Songbird", status: "least_concern", habitats: ["urban","grassland"],
    diet: "Omnivore — insects, worms, small vertebrates",
    funFact: "Magpies can recognise up to 100 individual human faces.",
    size: 40, population: "12.4M", palette: ["#1a1a1a","#f5f5f5","#444"],
    silhouette: "magpie"
  },
  {
    id: "lorikeet", name: "Rainbow Lorikeet", scientific: "Trichoglossus moluccanus",
    category: "Parrot", status: "least_concern", habitats: ["urban","forest","coastal"],
    diet: "Nectarivore — nectar, pollen, fruits",
    funFact: "Their brush-tipped tongues are specially adapted for nectar.",
    size: 30, population: "5.2M", palette: ["#2a7f3e","#e84c1f","#1a54a8"],
    silhouette: "parrot"
  },
  {
    id: "galah", name: "Galah", scientific: "Eolophus roseicapilla",
    category: "Cockatoo", status: "least_concern", habitats: ["grassland","urban","desert"],
    diet: "Herbivore — seeds, grains, nuts",
    funFact: "'Galah' in Aussie slang means acting foolishly — from their playful antics.",
    size: 35, population: "5.8M", palette: ["#e8a8b8","#8a8a8a","#f0d0d8"],
    silhouette: "parrot"
  },
  {
    id: "wagtail", name: "Willie Wagtail", scientific: "Rhipidura leucophrys",
    category: "Songbird", status: "least_concern", habitats: ["urban","grassland","wetland"],
    diet: "Insectivore — flying insects, moths",
    funFact: "Rides on the backs of cattle to catch disturbed insects.",
    size: 20, population: "7.6M", palette: ["#1a1a1a","#ffffff","#555"],
    silhouette: "wagtail"
  },
  {
    id: "fairywren", name: "Superb Fairy-wren", scientific: "Malurus cyaneus",
    category: "Songbird", status: "least_concern", habitats: ["forest","urban"],
    diet: "Insectivore — insects, spiders",
    funFact: "Males pluck yellow petals as courtship gifts.",
    size: 14, population: "3.4M", palette: ["#2a5db8","#1a1a1a","#8b9bc7"],
    silhouette: "wren"
  },
  {
    id: "pelican", name: "Australian Pelican", scientific: "Pelecanus conspicillatus",
    category: "Waterbird", status: "least_concern", habitats: ["wetland","coastal"],
    diet: "Piscivore — fish, crustaceans",
    funFact: "Their bill pouch can hold up to 13 litres of water.",
    size: 170, population: "415K", palette: ["#f5f5f5","#1a1a1a","#e8a04a"],
    silhouette: "pelican"
  },
  {
    id: "emu", name: "Emu", scientific: "Dromaius novaehollandiae",
    category: "Ratite", status: "least_concern", habitats: ["grassland","desert"],
    diet: "Omnivore — seeds, fruits, insects",
    funFact: "Emus can sprint at 50 km/h and are excellent swimmers.",
    size: 180, population: "725K", palette: ["#5a3a25","#2a1a0f","#8a6a4a"],
    silhouette: "emu"
  },
  {
    id: "eagle", name: "Wedge-tailed Eagle", scientific: "Aquila audax",
    category: "Raptor", status: "least_concern", habitats: ["grassland","desert","alpine"],
    diet: "Carnivore — rabbits, wallabies, carrion",
    funFact: "Soars at altitudes over 2,000 metres with a 2.3m wingspan.",
    size: 100, population: "225K", palette: ["#3a2515","#8a6035","#1a0f08"],
    silhouette: "eagle"
  },
  {
    id: "cockatoo", name: "Sulphur-crested Cockatoo", scientific: "Cacatua galerita",
    category: "Cockatoo", status: "least_concern", habitats: ["forest","urban"],
    diet: "Herbivore — seeds, nuts, berries",
    funFact: "Can live over 80 years and teaches others to open bins.",
    size: 50, population: "920K", palette: ["#fafafa","#f5d14a","#888"],
    silhouette: "cockatoo"
  },

  // NEAR THREATENED
  {
    id: "mitchell", name: "Major Mitchell's Cockatoo", scientific: "Lophochroa leadbeateri",
    category: "Cockatoo", status: "near_threatened", habitats: ["desert","grassland"],
    diet: "Herbivore — seeds, nuts, roots",
    funFact: "Mates for life and can live over 75 years in captivity.",
    size: 36, population: "42K", palette: ["#f4c4d0","#e85d75","#fff2e0"],
    silhouette: "cockatoo"
  },
  {
    id: "blackcockatoo", name: "Red-tailed Black Cockatoo", scientific: "Calyptorhynchus banksii",
    category: "Cockatoo", status: "near_threatened", habitats: ["forest","desert"],
    diet: "Herbivore — seeds, nuts",
    funFact: "Males have brilliant red tail panels visible only in flight.",
    size: 60, population: "135K", palette: ["#1a1a1a","#c8352a","#3a3a3a"],
    silhouette: "cockatoo"
  },

  // VULNERABLE
  {
    id: "palm", name: "Palm Cockatoo", scientific: "Probosciger aterrimus",
    category: "Cockatoo", status: "vulnerable", habitats: ["rainforest"],
    diet: "Herbivore — pandanus nuts, seeds",
    funFact: "The only birds known to use tools as musical instruments, drumming sticks on trees.",
    size: 60, population: "3.1K", palette: ["#2a2a2e","#c8453a","#1a1a1e"],
    silhouette: "cockatoo"
  },
  {
    id: "owl", name: "Powerful Owl", scientific: "Ninox strenua",
    category: "Raptor", status: "vulnerable", habitats: ["forest","rainforest"],
    diet: "Carnivore — possums, gliders, bats",
    funFact: "Carries prey back to a favourite perch and holds it all day.",
    size: 60, population: "7.8K", palette: ["#6a5a3a","#e8c84a","#3a2a1a"],
    silhouette: "owl"
  },
  {
    id: "bustard", name: "Australian Bustard", scientific: "Ardeotis australis",
    category: "Ground Bird", status: "vulnerable", habitats: ["grassland","desert"],
    diet: "Omnivore — seeds, fruits, small animals",
    funFact: "Males perform elaborate booming courtship displays, inflating throat sacs.",
    size: 120, population: "48K", palette: ["#8a7558","#3a2e1f","#c4b090"],
    silhouette: "emu"
  },

  // ENDANGERED
  {
    id: "cassowary", name: "Southern Cassowary", scientific: "Casuarius casuarius",
    category: "Ratite", status: "endangered", habitats: ["rainforest"],
    diet: "Frugivore — fallen fruits, fungi",
    funFact: "Considered the most dangerous bird — kicks with dagger-like claws.",
    size: 170, population: "4.4K", palette: ["#1a1a22","#2a6db8","#c8352a"],
    silhouette: "cassowary"
  },
  {
    id: "parrot-eng", name: "Orange-bellied Parrot", scientific: "Neophema chrysogaster",
    category: "Parrot", status: "endangered", habitats: ["coastal","grassland"],
    diet: "Granivore — grass seeds, saltmarsh plants",
    funFact: "One of only three migratory parrot species in the world — fewer than 70 wild adults.",
    size: 21, population: "<100", palette: ["#3a8a3a","#e8a04a","#2a5db8"],
    silhouette: "parrot"
  },

  // CRITICALLY ENDANGERED
  {
    id: "regent", name: "Regent Honeyeater", scientific: "Anthochaera phrygia",
    category: "Honeyeater", status: "critically_endangered", habitats: ["forest"],
    diet: "Nectarivore — eucalyptus nectar",
    funFact: "So rare, young males have forgotten their own song and mimic other species.",
    size: 22, population: "<350", palette: ["#f4d830","#1a1a1a","#8a7035"],
    silhouette: "wren"
  },
  {
    id: "nightparrot", name: "Night Parrot", scientific: "Pezoporus occidentalis",
    category: "Parrot", status: "critically_endangered", habitats: ["desert","grassland"],
    diet: "Granivore — spinifex seeds",
    funFact: "Presumed extinct for a century — photographed alive only in 2013.",
    size: 23, population: "<250", palette: ["#4a6030","#c8b070","#2a3a1a"],
    silhouette: "parrot"
  },
];

// Silhouette SVG paths — stylized birds (outlined, filled). Coordinate space 100x60.
window.BIRD_SILHOUETTES = {
  // classic flying bird with one wing up, one down
  wren: "M12 32 C18 28, 25 26, 34 27 L40 22 Q44 18, 48 20 L52 27 C62 26, 72 30, 85 32 L88 30 L86 35 C80 38, 70 40, 58 39 C50 45, 40 45, 32 42 C24 42, 16 38, 12 32 Z M22 20 C26 14, 32 12, 38 16 L36 22 C30 22, 25 22, 22 20 Z",
  magpie: "M10 33 C16 29, 24 27, 34 28 L42 22 Q46 17, 51 19 L56 28 C66 28, 78 32, 90 34 L93 31 L91 37 C82 40, 70 42, 56 41 C48 47, 36 46, 28 43 C20 42, 12 38, 10 33 Z M24 18 C28 10, 36 8, 43 14 L40 22 C33 22, 27 21, 24 18 Z",
  parrot: "M10 34 C16 30, 26 28, 36 29 L44 22 Q48 16, 54 19 L59 29 C70 29, 84 34, 94 35 L92 40 C82 42, 70 42, 58 40 C50 46, 38 46, 30 43 C22 41, 14 38, 10 34 Z M26 18 C32 10, 40 8, 46 14 L44 22 C36 22, 30 22, 26 18 Z",
  cockatoo: "M8 34 C16 28, 28 26, 38 27 L48 20 Q54 14, 60 18 L64 28 C76 28, 90 34, 95 35 L92 42 C80 44, 66 42, 56 40 C48 48, 34 46, 26 42 C18 40, 10 38, 8 34 Z M30 14 C36 4, 46 4, 52 12 L58 8 L54 16 C46 20, 38 20, 30 14 Z",
  kookaburra: "M12 34 C18 30, 26 28, 38 30 L42 24 Q46 18, 52 22 L58 30 C70 32, 84 34, 92 34 L95 30 L93 38 C82 42, 70 42, 58 40 C50 46, 40 46, 32 43 C24 42, 14 40, 12 34 Z M24 22 C30 16, 38 14, 44 20 L42 26 C34 26, 28 26, 24 22 Z",
  wagtail: "M14 32 C20 28, 28 26, 36 28 L42 22 Q45 17, 50 20 L54 28 C64 30, 78 32, 90 31 L92 29 L94 38 L86 36 C78 38, 68 40, 58 38 C50 44, 40 45, 32 42 C24 41, 16 36, 14 32 Z",
  pelican: "M8 30 C14 24, 26 20, 40 22 L50 14 Q56 8, 62 12 L66 22 C76 24, 90 28, 96 30 L94 38 C82 40, 70 40, 60 38 L50 48 L56 38 C48 46, 36 44, 26 40 C18 38, 10 34, 8 30 Z",
  emu: "M20 50 L22 38 C20 34, 20 28, 24 24 L30 22 C32 18, 36 16, 40 18 L44 22 C48 22, 52 24, 54 28 L50 36 C48 44, 50 52, 48 56 L44 56 L45 42 L35 44 L36 56 L32 56 L30 42 C28 46, 24 50, 22 52 Z",
  eagle: "M8 32 C14 26, 22 22, 32 24 L44 18 Q50 12, 56 18 L60 26 C72 26, 88 32, 96 32 L92 40 C80 44, 66 42, 54 40 L52 46 C50 48, 48 48, 46 46 C38 48, 28 46, 20 42 C14 40, 8 36, 8 32 Z M30 14 C36 6, 46 6, 52 14 L50 22 C42 22, 34 20, 30 14 Z",
  owl: "M24 42 C20 36, 20 28, 26 24 C30 18, 44 16, 52 20 C60 16, 74 18, 78 24 C84 28, 84 36, 80 42 C76 48, 64 52, 52 50 C40 52, 28 48, 24 42 Z M30 30 A3 3 0 0 0 36 30 A3 3 0 0 0 30 30 Z M68 30 A3 3 0 0 0 74 30 A3 3 0 0 0 68 30 Z",
  cassowary: "M22 50 L26 40 L24 32 C22 24, 26 16, 34 14 L38 8 L42 14 L44 18 L48 22 C54 24, 58 30, 56 36 L52 42 L54 56 L48 56 L46 44 L40 46 L42 56 L36 56 L34 44 C28 48, 24 50, 22 50 Z",
};
