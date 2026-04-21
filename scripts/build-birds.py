#!/usr/bin/env python3
"""Build public/data/birds.json and populate public/birds/*.jpg.

For each entry in BIRDS, hits Wikipedia's summary REST endpoint to find the
canonical thumbnail, downloads it, resizes to 320 px max with `sips`, and writes
the final BirdSpecies record. Entries whose image can't be fetched are dropped.
"""
from __future__ import annotations
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "birds")
OUT_JSON = os.path.join(ROOT, "public", "data", "birds.json")
UA = "bird-catcher/1.0 (local dev build)"

# (id, name, scientific, category, status, habitats, diet, funFact, size_cm, pop, wiki_title)
BIRDS: list[tuple] = [
    # ===== LEAST CONCERN (Common) =====
    ("kookaburra", "Laughing Kookaburra", "Dacelo novaeguineae", "Kingfisher",
     "least_concern", ["forest","urban"], "Carnivore — insects, lizards, mice",
     "Their dawn 'laughing' chorus marks territory boundaries.",
     43, "11.3M", "Laughing kookaburra"),
    ("magpie", "Australian Magpie", "Gymnorhina tibicen", "Songbird",
     "least_concern", ["urban","grassland"], "Omnivore — insects, worms, small vertebrates",
     "Magpies can recognise up to 100 individual human faces.",
     40, "12.4M", "Australian magpie"),
    ("lorikeet", "Rainbow Lorikeet", "Trichoglossus moluccanus", "Parrot",
     "least_concern", ["urban","forest","coastal"], "Nectarivore — nectar, pollen, fruits",
     "Their brush-tipped tongues are specially adapted for nectar.",
     30, "5.2M", "Rainbow lorikeet"),
    ("galah", "Galah", "Eolophus roseicapilla", "Cockatoo",
     "least_concern", ["grassland","urban","desert"], "Herbivore — seeds, grains, nuts",
     "'Galah' in Aussie slang means acting foolishly — from their playful antics.",
     35, "5.8M", "Galah"),
    ("wagtail", "Willie Wagtail", "Rhipidura leucophrys", "Songbird",
     "least_concern", ["urban","grassland","wetland"], "Insectivore — flying insects, moths",
     "Rides on the backs of cattle to catch disturbed insects.",
     20, "7.6M", "Willie wagtail"),
    ("fairywren", "Superb Fairy-wren", "Malurus cyaneus", "Songbird",
     "least_concern", ["forest","urban"], "Insectivore — insects, spiders",
     "Males pluck yellow petals as courtship gifts.",
     14, "3.4M", "Superb fairywren"),
    ("pelican", "Australian Pelican", "Pelecanus conspicillatus", "Waterbird",
     "least_concern", ["wetland","coastal"], "Piscivore — fish, crustaceans",
     "Their bill pouch can hold up to 13 litres of water.",
     170, "415K", "Australian pelican"),
    ("emu", "Emu", "Dromaius novaehollandiae", "Ratite",
     "least_concern", ["grassland","desert"], "Omnivore — seeds, fruits, insects",
     "Emus can sprint at 50 km/h and are excellent swimmers.",
     180, "725K", "Emu"),
    ("eagle", "Wedge-tailed Eagle", "Aquila audax", "Raptor",
     "least_concern", ["grassland","desert","alpine"], "Carnivore — rabbits, wallabies, carrion",
     "Soars at altitudes over 2,000 metres with a 2.3m wingspan.",
     100, "225K", "Wedge-tailed eagle"),
    ("cockatoo", "Sulphur-crested Cockatoo", "Cacatua galerita", "Cockatoo",
     "least_concern", ["forest","urban"], "Herbivore — seeds, nuts, berries",
     "Can live over 80 years and teaches others to open bins.",
     50, "920K", "Sulphur-crested cockatoo"),
    ("noisy-miner", "Noisy Miner", "Manorina melanocephala", "Honeyeater",
     "least_concern", ["urban","forest"], "Omnivore — nectar, insects, fruit",
     "Forms aggressive colonies that drive out smaller birds.",
     26, "5M", "Noisy miner"),
    ("white-ibis", "Australian White Ibis", "Threskiornis molucca", "Waterbird",
     "least_concern", ["urban","wetland"], "Omnivore — insects, scraps, crustaceans",
     "Nicknamed 'bin chicken' for its urban bin-raiding habits.",
     70, "330K", "Australian white ibis"),
    ("silvereye", "Silvereye", "Zosterops lateralis", "Songbird",
     "least_concern", ["forest","urban"], "Omnivore — fruit, nectar, insects",
     "Migrates in large flocks along the east coast each autumn.",
     12, "4M", "Silvereye"),
    ("crimson-rosella", "Crimson Rosella", "Platycercus elegans", "Parrot",
     "least_concern", ["forest","urban"], "Herbivore — seeds, fruit, blossoms",
     "Young birds are olive-green for their first two years.",
     36, "1.2M", "Crimson rosella"),
    ("eastern-rosella", "Eastern Rosella", "Platycercus eximius", "Parrot",
     "least_concern", ["grassland","urban"], "Herbivore — seeds, fruit, insects",
     "One of the most brightly-coloured parrots in the world.",
     30, "1.5M", "Eastern rosella"),
    ("pied-butcherbird", "Pied Butcherbird", "Cracticus nigrogularis", "Songbird",
     "least_concern", ["forest","grassland"], "Carnivore — insects, reptiles, small birds",
     "Considered one of Australia's finest songbirds — melodic flute-like calls.",
     35, "880K", "Pied butcherbird"),
    ("grey-butcherbird", "Grey Butcherbird", "Cracticus torquatus", "Songbird",
     "least_concern", ["forest","urban"], "Carnivore — insects, lizards, small birds",
     "Wedges prey in tree forks to 'butcher' it — hence the name.",
     30, "1.1M", "Grey butcherbird"),
    ("raven", "Australian Raven", "Corvus coronoides", "Songbird",
     "least_concern", ["urban","grassland","forest"], "Omnivore — carrion, insects, eggs",
     "Their slow, drawn-out 'aah-aah-aaaah' call is unmistakable.",
     51, "2.2M", "Australian raven"),
    ("pied-currawong", "Pied Currawong", "Strepera graculina", "Songbird",
     "least_concern", ["forest","urban"], "Omnivore — fruit, insects, nestlings",
     "Famous for their loud 'curra-wong' call echoing through forests.",
     48, "1.8M", "Pied currawong"),
    ("welcome-swallow", "Welcome Swallow", "Hirundo neoxena", "Songbird",
     "least_concern", ["urban","grassland","coastal"], "Insectivore — flying insects",
     "Named for their arrival at the start of spring.",
     15, "2.4M", "Welcome swallow"),
    ("masked-lapwing", "Masked Lapwing", "Vanellus miles", "Shorebird",
     "least_concern", ["grassland","wetland","urban"], "Insectivore — worms, insects",
     "Known for dive-bombing anyone who ventures too near their ground nests.",
     36, "1.6M", "Masked lapwing"),
    ("straw-necked-ibis", "Straw-necked Ibis", "Threskiornis spinicollis", "Waterbird",
     "least_concern", ["wetland","grassland"], "Insectivore — locusts, grasshoppers",
     "Nicknamed 'farmer's friend' for eating swarming locusts.",
     70, "250K", "Straw-necked ibis"),
    ("royal-spoonbill", "Royal Spoonbill", "Platalea regia", "Waterbird",
     "least_concern", ["wetland","coastal"], "Piscivore — fish, crustaceans",
     "Sweeps its spoon-shaped bill side-to-side through water to feed.",
     80, "45K", "Royal spoonbill"),
    ("wood-duck", "Australian Wood Duck", "Chenonetta jubata", "Waterbird",
     "least_concern", ["grassland","wetland","urban"], "Herbivore — grasses, herbs, grain",
     "One of the few ducks that nests in tree hollows.",
     48, "775K", "Australian wood duck"),
    ("black-duck", "Pacific Black Duck", "Anas superciliosa", "Waterbird",
     "least_concern", ["wetland","coastal"], "Omnivore — aquatic plants, insects",
     "Hybridises freely with introduced Mallards, threatening pure populations.",
     55, "1.2M", "Pacific black duck"),
    ("chestnut-teal", "Chestnut Teal", "Anas castanea", "Waterbird",
     "least_concern", ["wetland","coastal"], "Omnivore — plants, insects, seeds",
     "Males are iridescent green-headed; females plain speckled brown.",
     42, "240K", "Chestnut teal"),
    ("grey-teal", "Grey Teal", "Anas gracilis", "Waterbird",
     "least_concern", ["wetland"], "Omnivore — seeds, aquatic invertebrates",
     "Nomadic — follows rains across the continent to ephemeral lakes.",
     43, "1.3M", "Grey teal"),
    ("black-swan", "Black Swan", "Cygnus atratus", "Waterbird",
     "least_concern", ["wetland","coastal"], "Herbivore — algae, aquatic plants",
     "The floral emblem of Western Australia.",
     140, "500K", "Black swan"),
    ("little-pied-cormorant", "Little Pied Cormorant", "Microcarbo melanoleucos", "Waterbird",
     "least_concern", ["wetland","coastal"], "Piscivore — small fish, yabbies",
     "Dives underwater and swims using webbed feet to chase fish.",
     60, "475K", "Little pied cormorant"),
    ("great-cormorant", "Great Cormorant", "Phalacrocorax carbo", "Waterbird",
     "least_concern", ["wetland","coastal"], "Piscivore — fish, eels",
     "Its feathers are not fully waterproof — often seen drying wings outstretched.",
     85, "210K", "Great cormorant"),
    ("darter", "Australasian Darter", "Anhinga novaehollandiae", "Waterbird",
     "least_concern", ["wetland"], "Piscivore — fish spearing",
     "Swims with only its snake-like neck above water — hence 'snakebird'.",
     90, "135K", "Australasian darter"),
    ("white-faced-heron", "White-faced Heron", "Egretta novaehollandiae", "Waterbird",
     "least_concern", ["wetland","coastal","urban"], "Carnivore — fish, frogs, insects",
     "The most commonly seen heron in Australia.",
     68, "880K", "White-faced heron"),
    ("cattle-egret", "Cattle Egret", "Bubulcus ibis", "Waterbird",
     "least_concern", ["grassland","wetland"], "Insectivore — insects flushed by livestock",
     "Self-introduced to Australia in the 1940s from Asia.",
     51, "660K", "Cattle egret"),
    ("tawny-frogmouth", "Tawny Frogmouth", "Podargus strigoides", "Nocturnal",
     "least_concern", ["forest","urban"], "Carnivore — moths, beetles, small vertebrates",
     "Often mistaken for owls — they're actually related to nightjars.",
     45, "1.1M", "Tawny frogmouth"),
    ("crested-pigeon", "Crested Pigeon", "Ocyphaps lophotes", "Dove",
     "least_concern", ["grassland","urban"], "Granivore — seeds, grains",
     "Wings produce a whistling sound in flight — a built-in alarm.",
     34, "2.8M", "Crested pigeon"),
    ("spotted-dove", "Spotted Dove", "Spilopelia chinensis", "Dove",
     "least_concern", ["urban"], "Granivore — seeds, grains",
     "Introduced in the 1800s; now common across eastern cities.",
     30, "1.5M", "Spotted dove"),
    ("common-bronzewing", "Common Bronzewing", "Phaps chalcoptera", "Dove",
     "least_concern", ["forest","grassland"], "Granivore — seeds, fruit",
     "Iridescent bronze wing-patches flash in sunlight.",
     33, "3.2M", "Common bronzewing"),
    ("bee-eater", "Rainbow Bee-eater", "Merops ornatus", "Insectivore",
     "least_concern", ["grassland","forest"], "Insectivore — bees, wasps, dragonflies",
     "Whacks stinging insects against a branch to remove the stinger before eating.",
     25, "1M", "Rainbow bee-eater"),
    ("sacred-kingfisher", "Sacred Kingfisher", "Todiramphus sanctus", "Kingfisher",
     "least_concern", ["forest","coastal"], "Carnivore — insects, lizards, crabs",
     "Revered in Polynesian mythology as having control over the seas.",
     22, "890K", "Sacred kingfisher"),
    ("blue-winged-kookaburra", "Blue-winged Kookaburra", "Dacelo leachii", "Kingfisher",
     "least_concern", ["forest","grassland"], "Carnivore — reptiles, insects, small mammals",
     "Has an eerie cackling call very different from its laughing cousin.",
     40, "720K", "Blue-winged kookaburra"),
    ("red-wattlebird", "Red Wattlebird", "Anthochaera carunculata", "Honeyeater",
     "least_concern", ["forest","urban"], "Nectarivore — nectar, insects, fruit",
     "Named for the bright red fleshy wattles beside its eyes.",
     36, "2.3M", "Red wattlebird"),
    ("little-wattlebird", "Little Wattlebird", "Anthochaera chrysoptera", "Honeyeater",
     "least_concern", ["coastal","forest"], "Nectarivore — nectar, insects",
     "Despite its name, actually lacks wattles entirely.",
     30, "680K", "Little wattlebird"),
    ("noisy-friarbird", "Noisy Friarbird", "Philemon corniculatus", "Honeyeater",
     "least_concern", ["forest","urban"], "Omnivore — nectar, fruit, insects",
     "Named for its bald black head, said to resemble a friar's tonsure.",
     32, "520K", "Noisy friarbird"),
    ("new-holland-honeyeater", "New Holland Honeyeater", "Phylidonyris novaehollandiae", "Honeyeater",
     "least_concern", ["forest","urban","coastal"], "Nectarivore — nectar, insects",
     "One of the first Australian birds described by European scientists.",
     18, "1.8M", "New Holland honeyeater"),
    ("white-plumed-honeyeater", "White-plumed Honeyeater", "Ptilotula penicillata", "Honeyeater",
     "least_concern", ["forest","grassland"], "Nectarivore — nectar, insects",
     "The distinctive white neck plume lights up like a paint stroke.",
     18, "2.6M", "White-plumed honeyeater"),
    ("eastern-spinebill", "Eastern Spinebill", "Acanthorhynchus tenuirostris", "Honeyeater",
     "least_concern", ["forest"], "Nectarivore — nectar, insects",
     "One of the few Australian birds that hovers like a hummingbird.",
     15, "760K", "Eastern spinebill"),
    ("satin-bowerbird", "Satin Bowerbird", "Ptilonorhynchus violaceus", "Songbird",
     "least_concern", ["forest"], "Omnivore — fruit, leaves, insects",
     "Males collect blue objects — pegs, straws, bottle caps — to decorate bowers.",
     32, "140K", "Satin bowerbird"),
    ("regent-bowerbird", "Regent Bowerbird", "Sericulus chrysocephalus", "Songbird",
     "least_concern", ["rainforest"], "Omnivore — fruit, insects",
     "Males are black with brilliant gold head and wing bands.",
     25, "55K", "Regent bowerbird"),
    ("great-bowerbird", "Great Bowerbird", "Chlamydera nuchalis", "Songbird",
     "least_concern", ["forest","grassland"], "Omnivore — fruit, seeds, insects",
     "Builds the largest bower of any species — up to a metre tall.",
     35, "180K", "Great bowerbird"),
    ("brush-turkey", "Australian Brush-turkey", "Alectura lathami", "Ground Bird",
     "least_concern", ["rainforest","forest"], "Omnivore — fruit, seeds, insects",
     "Males build huge compost-mound nests and control the temperature with their beak.",
     70, "530K", "Australian brushturkey"),
    ("magpie-lark", "Magpie-lark", "Grallina cyanoleuca", "Songbird",
     "least_concern", ["urban","grassland","wetland"], "Insectivore — insects, small crustaceans",
     "Not a true magpie or lark — builds a unique mud-cup nest.",
     27, "3.6M", "Magpie-lark"),
    ("grey-fantail", "Grey Fantail", "Rhipidura albiscapa", "Songbird",
     "least_concern", ["forest","urban"], "Insectivore — flying insects",
     "Constantly fans its tail to flush insects from foliage.",
     16, "2M", "Grey fantail"),
    ("rufous-fantail", "Rufous Fantail", "Rhipidura rufifrons", "Songbird",
     "least_concern", ["rainforest","forest"], "Insectivore — flying insects",
     "Migrates thousands of kilometres between summer and winter ranges.",
     16, "460K", "Rufous fantail"),
    ("golden-whistler", "Golden Whistler", "Pachycephala pectoralis", "Songbird",
     "least_concern", ["forest"], "Insectivore — insects, spiders",
     "Males have one of the most beautiful whistled songs in Australia.",
     17, "1.4M", "Golden whistler"),
    ("rufous-whistler", "Rufous Whistler", "Pachycephala rufiventris", "Songbird",
     "least_concern", ["forest","grassland"], "Insectivore — insects",
     "Sings its rich 'ee-chong' call throughout the day, even in summer heat.",
     17, "1.1M", "Rufous whistler"),
    ("shrike-thrush", "Grey Shrike-thrush", "Colluricincla harmonica", "Songbird",
     "least_concern", ["forest","grassland"], "Omnivore — insects, small vertebrates",
     "Considered one of Australia's most accomplished songsters.",
     24, "950K", "Grey shrikethrush"),
    ("scrubwren", "White-browed Scrubwren", "Sericornis frontalis", "Songbird",
     "least_concern", ["forest"], "Insectivore — insects, spiders",
     "A tiny bird that lurks in dense undergrowth with harsh scolding calls.",
     12, "780K", "White-browed scrubwren"),
    ("brown-thornbill", "Brown Thornbill", "Acanthiza pusilla", "Songbird",
     "least_concern", ["forest","urban"], "Insectivore — insects",
     "Can mimic the alarm calls of larger birds to scare off predators.",
     10, "620K", "Brown thornbill"),
    ("splendid-fairywren", "Splendid Fairy-wren", "Malurus splendens", "Songbird",
     "least_concern", ["grassland","desert"], "Insectivore — insects",
     "Males turn deep cobalt blue only during the breeding season.",
     14, "380K", "Splendid fairywren"),
    ("variegated-fairywren", "Variegated Fairy-wren", "Malurus lamberti", "Songbird",
     "least_concern", ["forest","grassland"], "Insectivore — insects",
     "The most widespread fairy-wren — found across most of the continent.",
     14, "940K", "Variegated fairywren"),
    ("red-backed-fairywren", "Red-backed Fairy-wren", "Malurus melanocephalus", "Songbird",
     "least_concern", ["grassland"], "Insectivore — insects",
     "Breeding males are jet black with a flame-red saddle.",
     13, "620K", "Red-backed fairywren"),
    ("king-parrot", "Australian King-Parrot", "Alisterus scapularis", "Parrot",
     "least_concern", ["rainforest","forest"], "Herbivore — seeds, nuts, fruit",
     "Males have scarlet heads; females have all-green heads.",
     42, "220K", "Australian king parrot"),
    ("koel", "Eastern Koel", "Eudynamys orientalis", "Cuckoo",
     "least_concern", ["forest","urban"], "Frugivore — fruit, occasional insects",
     "A brood parasite — lays eggs in other birds' nests.",
     42, "165K", "Eastern koel"),
    ("cuckoo-shrike", "Black-faced Cuckoo-shrike", "Coracina novaehollandiae", "Songbird",
     "least_concern", ["forest","urban","grassland"], "Omnivore — insects, fruit",
     "After landing, shuffles its wings in a distinctive 'rearranging' motion.",
     33, "930K", "Black-faced cuckooshrike"),
    ("yellow-robin", "Eastern Yellow Robin", "Eopsaltria australis", "Songbird",
     "least_concern", ["forest"], "Insectivore — insects, spiders",
     "Perches sideways on tree trunks, waiting to pounce on prey below.",
     16, "520K", "Eastern yellow robin"),
    ("jacky-winter", "Jacky Winter", "Microeca fascinans", "Songbird",
     "least_concern", ["grassland","forest"], "Insectivore — insects",
     "Sings its namesake 'jacky-jacky-jacky' on cold winter mornings.",
     13, "610K", "Jacky winter"),
    ("superb-lyrebird", "Superb Lyrebird", "Menura novaehollandiae", "Songbird",
     "least_concern", ["forest","rainforest"], "Omnivore — insects, seeds, fungi",
     "Can mimic chainsaws, camera shutters, and car alarms with uncanny accuracy.",
     100, "185K", "Superb lyrebird"),
    ("budgerigar", "Budgerigar", "Melopsittacus undulatus", "Parrot",
     "least_concern", ["grassland","desert"], "Granivore — grass seeds",
     "Forms vast nomadic flocks of thousands across the inland.",
     18, "5M", "Budgerigar"),
    ("cockatiel", "Cockatiel", "Nymphicus hollandicus", "Cockatoo",
     "least_concern", ["grassland","desert"], "Granivore — seeds, grains",
     "The smallest of Australia's cockatoos.",
     32, "1.2M", "Cockatiel"),
    ("nankeen-kestrel", "Nankeen Kestrel", "Falco cenchroides", "Raptor",
     "least_concern", ["grassland","urban"], "Carnivore — mice, lizards, insects",
     "Hovers motionless in mid-air while scanning for prey below.",
     33, "340K", "Nankeen kestrel"),
    ("peregrine-falcon", "Peregrine Falcon", "Falco peregrinus", "Raptor",
     "least_concern", ["coastal","urban","alpine"], "Carnivore — birds in flight",
     "The fastest animal on Earth — dives at over 300 km/h.",
     44, "9K", "Peregrine falcon"),
    ("brown-falcon", "Brown Falcon", "Falco berigora", "Raptor",
     "least_concern", ["grassland","desert"], "Carnivore — rodents, reptiles, insects",
     "Often hunts at grass fires, snatching escaping prey.",
     50, "315K", "Brown falcon"),
    ("whistling-kite", "Whistling Kite", "Haliastur sphenurus", "Raptor",
     "least_concern", ["wetland","grassland"], "Carnivore — carrion, fish, reptiles",
     "Named for its loud whistling call given in flight.",
     55, "240K", "Whistling kite"),
    ("black-kite", "Black Kite", "Milvus migrans", "Raptor",
     "least_concern", ["grassland","urban"], "Carnivore — carrion, small animals",
     "Known to pick up burning sticks to spread fires and flush prey.",
     55, "580K", "Black kite"),
    ("silver-gull", "Silver Gull", "Chroicocephalus novaehollandiae", "Waterbird",
     "least_concern", ["coastal","urban"], "Omnivore — scraps, crustaceans, fish",
     "Australia's most familiar gull — the classic beach 'seagull'.",
     40, "2.4M", "Silver gull"),
    ("azure-kingfisher", "Azure Kingfisher", "Ceyx azureus", "Kingfisher",
     "least_concern", ["wetland","rainforest"], "Piscivore — fish, yabbies",
     "A jewel-bright bird the size of a sparrow, rarely seen perched.",
     18, "135K", "Azure kingfisher"),
    ("forest-kingfisher", "Forest Kingfisher", "Todiramphus macleayii", "Kingfisher",
     "least_concern", ["forest","wetland"], "Carnivore — insects, lizards",
     "Perches prominently then plunges to the ground for prey.",
     20, "210K", "Forest kingfisher"),
    ("dusky-moorhen", "Dusky Moorhen", "Gallinula tenebrosa", "Waterbird",
     "least_concern", ["wetland","urban"], "Omnivore — plants, snails, insects",
     "Cooperatively breeds — multiple adults help raise a single brood.",
     38, "410K", "Dusky moorhen"),
    ("purple-swamphen", "Australasian Swamphen", "Porphyrio melanotus", "Waterbird",
     "least_concern", ["wetland","urban"], "Omnivore — plants, insects, eggs",
     "Grasps food with one giant red foot while feeding — like a hand.",
     46, "340K", "Australasian swamphen"),
    ("eurasian-coot", "Eurasian Coot", "Fulica atra", "Waterbird",
     "least_concern", ["wetland","urban"], "Omnivore — plants, insects",
     "Its toes are lobed rather than webbed — a unique adaptation for swimming.",
     38, "640K", "Eurasian coot"),
    ("red-capped-plover", "Red-capped Plover", "Charadrius ruficapillus", "Shorebird",
     "least_concern", ["coastal","wetland"], "Insectivore — small invertebrates",
     "Fakes a broken wing to lure predators away from its nest.",
     16, "93K", "Red-capped plover"),
    ("australasian-grebe", "Australasian Grebe", "Tachybaptus novaehollandiae", "Waterbird",
     "least_concern", ["wetland"], "Carnivore — small fish, insects",
     "Carries chicks on its back while swimming between waterways.",
     25, "480K", "Australasian grebe"),
    ("striated-thornbill", "Striated Thornbill", "Acanthiza lineata", "Songbird",
     "least_concern", ["forest"], "Insectivore — insects",
     "Frequently joins mixed-species feeding flocks in winter.",
     10, "380K", "Striated thornbill"),

    # ===== NEAR THREATENED (Uncommon) =====
    ("mitchell", "Major Mitchell's Cockatoo", "Lophochroa leadbeateri", "Cockatoo",
     "near_threatened", ["desert","grassland"], "Herbivore — seeds, nuts, roots",
     "Mates for life and can live over 75 years in captivity.",
     36, "42K", "Pink cockatoo"),
    ("blackcockatoo", "Red-tailed Black Cockatoo", "Calyptorhynchus banksii", "Cockatoo",
     "near_threatened", ["forest","desert"], "Herbivore — seeds, nuts",
     "Males have brilliant red tail panels visible only in flight.",
     60, "135K", "Red-tailed black cockatoo"),
    ("yellow-tailed-blackcockatoo", "Yellow-tailed Black Cockatoo", "Zanda funerea", "Cockatoo",
     "near_threatened", ["forest"], "Herbivore — pine seeds, wood-boring grubs",
     "Rips apart banksia cones and wood with enormous force.",
     65, "105K", "Yellow-tailed black cockatoo"),
    ("glossy-blackcockatoo", "Glossy Black Cockatoo", "Calyptorhynchus lathami", "Cockatoo",
     "near_threatened", ["forest"], "Herbivore — she-oak seeds only",
     "Feeds almost exclusively on casuarina cones — critically habitat-dependent.",
     50, "11K", "Glossy black cockatoo"),
    ("bush-stone-curlew", "Bush Stone-curlew", "Burhinus grallarius", "Ground Bird",
     "near_threatened", ["grassland","forest"], "Insectivore — insects, small reptiles",
     "Unnerving night-time wailing calls have earned it ghostly folklore.",
     55, "70K", "Bush stone-curlew"),
    ("brolga", "Brolga", "Antigone rubicunda", "Ground Bird",
     "near_threatened", ["wetland","grassland"], "Omnivore — tubers, insects, frogs",
     "Famous for its elegant leaping courtship dance.",
     125, "23K", "Brolga"),
    ("plumed-whistling-duck", "Plumed Whistling Duck", "Dendrocygna eytoni", "Waterbird",
     "near_threatened", ["wetland","grassland"], "Herbivore — grass, aquatic plants",
     "Forms nomadic flocks of thousands in the tropical north.",
     55, "180K", "Plumed whistling duck"),
    ("musk-duck", "Musk Duck", "Biziura lobata", "Waterbird",
     "near_threatened", ["wetland"], "Carnivore — mussels, crustaceans, fish",
     "Males have a fleshy black lobe under the bill and a musky odour.",
     70, "45K", "Musk duck"),
    ("barking-owl", "Barking Owl", "Ninox connivens", "Raptor",
     "near_threatened", ["forest","grassland"], "Carnivore — small mammals, birds, insects",
     "Its eerie 'screaming-woman' call has terrified bush travellers for centuries.",
     45, "16K", "Barking owl"),
    ("masked-owl", "Australian Masked Owl", "Tyto novaehollandiae", "Raptor",
     "near_threatened", ["forest"], "Carnivore — rats, rabbits, possums",
     "Tasmanian subspecies is the world's largest Tyto owl.",
     50, "8K", "Australian masked owl"),
    ("hooded-plover", "Hooded Plover", "Thinornis cucullatus", "Shorebird",
     "near_threatened", ["coastal"], "Insectivore — beach invertebrates",
     "Nests on sand above the high-tide line — extremely vulnerable to disturbance.",
     22, "7K", "Hooded plover"),
    ("rockwarbler", "Rockwarbler", "Origma solitaria", "Songbird",
     "near_threatened", ["forest"], "Insectivore — insects, spiders",
     "New South Wales' only endemic bird — restricted to sandstone country.",
     14, "35K", "Rockwarbler"),

    # ===== VULNERABLE (Rare) =====
    ("palm", "Palm Cockatoo", "Probosciger aterrimus", "Cockatoo",
     "vulnerable", ["rainforest"], "Herbivore — pandanus nuts, seeds",
     "The only birds known to use tools as musical instruments, drumming sticks on trees.",
     60, "3.1K", "Palm cockatoo"),
    ("owl", "Powerful Owl", "Ninox strenua", "Raptor",
     "vulnerable", ["forest","rainforest"], "Carnivore — possums, gliders, bats",
     "Carries prey back to a favourite perch and holds it all day.",
     60, "7.8K", "Powerful owl"),
    ("bustard", "Australian Bustard", "Ardeotis australis", "Ground Bird",
     "vulnerable", ["grassland","desert"], "Omnivore — seeds, fruits, small animals",
     "Males perform booming courtship displays, inflating throat sacs.",
     120, "48K", "Australian bustard"),
    ("gang-gang", "Gang-gang Cockatoo", "Callocephalon fimbriatum", "Cockatoo",
     "vulnerable", ["forest","alpine"], "Herbivore — seeds, berries",
     "Makes a creaking sound like a rusty hinge when flying.",
     35, "20K", "Gang-gang cockatoo"),
    ("superb-parrot", "Superb Parrot", "Polytelis swainsonii", "Parrot",
     "vulnerable", ["forest","grassland"], "Herbivore — seeds, grains, fruit",
     "Restricted to river-red-gum woodlands of the Murray-Murrumbidgee.",
     40, "6K", "Superb parrot"),
    ("malleefowl", "Malleefowl", "Leipoa ocellata", "Ground Bird",
     "vulnerable", ["desert","grassland"], "Omnivore — seeds, insects, fruit",
     "Male tends a compost nest-mound year-round, keeping it at a constant 33°C.",
     60, "75K", "Malleefowl"),
    ("grey-falcon", "Grey Falcon", "Falco hypoleucos", "Raptor",
     "vulnerable", ["desert","grassland"], "Carnivore — birds, reptiles, mammals",
     "One of Australia's rarest birds of prey — possibly fewer than 1,000 pairs.",
     43, "2K", "Grey falcon"),
    ("princess-parrot", "Princess Parrot", "Polytelis alexandrae", "Parrot",
     "vulnerable", ["desert"], "Herbivore — seeds, flowers",
     "Named after Princess Alexandra — an elusive nomad of the Western Deserts.",
     46, "5K", "Princess parrot"),
    ("black-breasted-buzzard", "Black-breasted Buzzard", "Hamirostra melanosternon", "Raptor",
     "vulnerable", ["grassland","desert"], "Carnivore — reptiles, small mammals",
     "Drops stones on emu eggs to crack them open — rare tool use in raptors.",
     55, "5K", "Black-breasted buzzard"),
    ("letter-winged-kite", "Letter-winged Kite", "Elanus scriptus", "Raptor",
     "vulnerable", ["grassland","desert"], "Carnivore — long-haired rats, rodents",
     "Unique among raptors for being strictly nocturnal.",
     36, "1K", "Letter-winged kite"),

    # ===== ENDANGERED (Epic) =====
    ("cassowary", "Southern Cassowary", "Casuarius casuarius", "Ratite",
     "endangered", ["rainforest"], "Frugivore — fallen fruits, fungi",
     "Considered the most dangerous bird — kicks with dagger-like claws.",
     170, "4.4K", "Southern cassowary"),
    ("red-goshawk", "Red Goshawk", "Erythrotriorchis radiatus", "Raptor",
     "endangered", ["forest","grassland"], "Carnivore — birds up to parrot-size",
     "One of the world's rarest raptors — only a few hundred pairs remain.",
     55, "1K", "Red goshawk"),
    ("helmeted-honeyeater", "Helmeted Honeyeater", "Lichenostomus melanops cassidix", "Honeyeater",
     "endangered", ["forest"], "Nectarivore — nectar, insects, manna",
     "Victoria's faunal emblem — fewer than 250 wild birds remain.",
     23, "230", "Helmeted honeyeater"),
    ("bristlebird", "Eastern Bristlebird", "Dasyornis brachypterus", "Songbird",
     "endangered", ["forest","grassland"], "Insectivore — insects",
     "Prefers running through undergrowth to flying — critically fire-sensitive.",
     22, "2.5K", "Eastern bristlebird"),
    ("mallee-emu-wren", "Mallee Emu-wren", "Stipiturus mallee", "Songbird",
     "endangered", ["desert"], "Insectivore — tiny insects",
     "A feather-weight 4-gram bird — one of Australia's smallest.",
     15, "10K", "Mallee emu-wren"),
    ("black-eared-miner", "Black-eared Miner", "Manorina melanotis", "Honeyeater",
     "endangered", ["desert"], "Omnivore — nectar, insects, sap",
     "Hybridises with Yellow-throated Miners — threatening genetic identity.",
     25, "3K", "Black-eared miner"),
    ("golden-shouldered-parrot", "Golden-shouldered Parrot", "Psephotellus chrysopterygius", "Parrot",
     "endangered", ["grassland"], "Granivore — grass seeds",
     "Nests only in termite mounds on Cape York savannah.",
     26, "2K", "Golden-shouldered parrot"),

    # ===== CRITICALLY ENDANGERED (Legendary) =====
    ("regent", "Regent Honeyeater", "Anthochaera phrygia", "Honeyeater",
     "critically_endangered", ["forest"], "Nectarivore — eucalyptus nectar",
     "So rare, young males have forgotten their song and mimic other species.",
     22, "<350", "Regent honeyeater"),
    ("nightparrot", "Night Parrot", "Pezoporus occidentalis", "Parrot",
     "critically_endangered", ["desert","grassland"], "Granivore — spinifex seeds",
     "Presumed extinct for a century — photographed alive only in 2013.",
     23, "<250", "Night parrot"),
    ("parrot-eng", "Orange-bellied Parrot", "Neophema chrysogaster", "Parrot",
     "critically_endangered", ["coastal","grassland"], "Granivore — grass seeds, saltmarsh plants",
     "One of only three migratory parrot species — fewer than 70 wild adults.",
     21, "<100", "Orange-bellied parrot"),
    ("swift-parrot", "Swift Parrot", "Lathamus discolor", "Parrot",
     "critically_endangered", ["forest"], "Nectarivore — blue gum nectar",
     "Flies the Bass Strait each year — predated heavily by sugar gliders.",
     25, "750", "Swift parrot"),
    ("plains-wanderer", "Plains-wanderer", "Pedionomus torquatus", "Ground Bird",
     "critically_endangered", ["grassland"], "Insectivore — insects, seeds",
     "A living fossil — the sole member of its ancient family.",
     18, "1K", "Plains-wanderer"),
    ("western-ground-parrot", "Western Ground Parrot", "Pezoporus flaviventris", "Parrot",
     "critically_endangered", ["coastal","grassland"], "Herbivore — seeds, flowers",
     "Only around 150 remain in a single Western Australian reserve.",
     30, "<150", "Western ground parrot"),
    ("australasian-bittern", "Australasian Bittern", "Botaurus poiciloptilus", "Waterbird",
     "endangered", ["wetland"], "Carnivore — fish, frogs, crustaceans",
     "Males produce a deep 'booming' call that travels kilometres at dusk.",
     75, "1.5K", "Australasian bittern"),
]


def fetch_wiki_image(title: str) -> str | None:
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title)}"
    try:
        result = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "15",
             "-H", f"User-Agent: {UA}", url],
            check=True, capture_output=True,
        )
        data = json.loads(result.stdout)
        return (
            (data.get("originalimage") or {}).get("source")
            or (data.get("thumbnail") or {}).get("source")
        )
    except Exception as e:
        print(f"[wiki-fail] {title}: {e}", file=sys.stderr)
        return None


def download(url: str, path: str) -> bool:
    try:
        subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "30",
             "-H", "User-Agent: Mozilla/5.0",
             "-o", path, url],
            check=True, capture_output=True,
        )
        return os.path.exists(path) and os.path.getsize(path) > 1000
    except Exception as e:
        print(f"[dl-fail] {url}: {e}", file=sys.stderr)
        return False


def resize(path: str) -> None:
    subprocess.run(
        ["sips", "-Z", "320", path, "--out", path],
        check=False, capture_output=True,
    )


def ensure_image(bird_id: str, wiki_title: str) -> bool:
    path = os.path.join(OUT_DIR, f"{bird_id}.jpg")
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return True
    img_url = fetch_wiki_image(wiki_title)
    if not img_url:
        return False
    if not download(img_url, path):
        return False
    resize(path)
    return os.path.exists(path) and os.path.getsize(path) > 500


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    # dedupe by id, keeping first
    seen = set()
    unique: list[tuple] = []
    for row in BIRDS:
        if row[0] in seen:
            continue
        seen.add(row[0])
        unique.append(row)

    results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        future_to_row = {
            pool.submit(ensure_image, row[0], row[10]): row for row in unique
        }
        for fut in as_completed(future_to_row):
            row = future_to_row[fut]
            ok = False
            try:
                ok = fut.result()
            except Exception as e:
                print(f"[task-fail] {row[0]}: {e}", file=sys.stderr)
            if not ok:
                print(f"[drop] {row[0]}: no image", file=sys.stderr)
                continue
            bid, name, sci, cat, status, habitats, diet, fact, size, pop, _ = row
            results[bid] = {
                "id": bid,
                "name": name,
                "scientific": sci,
                "category": cat,
                "status": status,
                "habitats": habitats,
                "diet": diet,
                "funFact": fact,
                "size": size,
                "population": pop,
                "imageUrl": f"/birds/{bid}.jpg",
            }

    # preserve order of input list
    final = [results[row[0]] for row in unique if row[0] in results]

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(final, f, indent=2, ensure_ascii=False)
        f.write("\n")

    by_status: dict[str, int] = {}
    for b in final:
        by_status[b["status"]] = by_status.get(b["status"], 0) + 1
    print(f"[done] wrote {len(final)} birds:", file=sys.stderr)
    for s, n in by_status.items():
        print(f"  {s}: {n}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
