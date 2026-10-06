// components/giftsData.ts

export const RARITY = {
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
  MYTHIC: "mythic",
} as const;

export enum GiftAnimation {
  FLOAT = "float",
  BOUNCE = "bounce",
  PULSE = "pulse",
  SPIN = "spin",
  DROP = "drop",
  DRIVE = "drive",
  FLY = "fly",
  SAIL = "sail",
  ROCKET = "rocket",
  SHAKE = "shake",
  SPARKLE = "sparkle",
  RAIN = "rain",
  MAGIC = "magic",
  FIRE = "fire",
  EXPLODE = "explode",
  COSMIC = "cosmic",
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  coins: number;
  rarity: string;
  animation: GiftAnimation;
}

export const GIFTS: Gift[] = [
  // ==================== COMMON ====================

  {
    id: "rose",
    name: "Rose",
    icon: "🌹",
    coins: 1,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.FLOAT,
  },

  {
    id: "heart",
    name: "Heart",
    icon: "💗",
    coins: 5,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.PULSE,
  },

  {
    id: "finger_heart",
    name: "Finger Heart",
    icon: "🫰",
    coins: 8,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.BOUNCE,
  },

  {
    id: "gg",
    name: "Good Game",
    icon: "🎮",
    coins: 10,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.SHAKE,
  },

  {
    id: "clap",
    name: "Applause",
    icon: "👏",
    coins: 2,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.BOUNCE,
  },

  {
    id: "fire",
    name: "Lit / Fire",
    icon: "🔥",
    coins: 3,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.FIRE,
  },

  {
    id: "chili",
    name: "Spicy Hot",
    icon: "🌶️",
    coins: 4,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.FIRE,
  },

  {
    id: "like",
    name: "Thumbs Up",
    icon: "👍",
    coins: 1,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.BOUNCE,
  },

  {
    id: "star",
    name: "Little Star",
    icon: "⭐",
    coins: 6,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.SPARKLE,
  },

  {
    id: "balloon",
    name: "Party Balloon",
    icon: "🎈",
    coins: 7,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.FLOAT,
  },

  {
    id: "lollipop",
    name: "Sweet Pop",
    icon: "🍭",
    coins: 9,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.SPIN,
  },

  {
    id: "crown_mini",
    name: "Paper Tiara",
    icon: "👑",
    coins: 12,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.DROP,
  },

  {
    id: "tea",
    name: "Spill the Tea",
    icon: "🍵",
    coins: 15,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.FLOAT,
  },

  {
    id: "coffee",
    name: "Morning Coffee",
    icon: "☕",
    coins: 18,
    rarity: RARITY.COMMON,
    animation: GiftAnimation.FLOAT,
  },

  // ==================== RARE ====================

  {
    id: "ice_cream",
    name: "Ice Cream Cone",
    icon: "🍦",
    coins: 20,
    rarity: RARITY.RARE,
    animation: GiftAnimation.SPIN,
  },

  {
    id: "perfume",
    name: "Designer Scent",
    icon: "🧴",
    coins: 50,
    rarity: RARITY.RARE,
    animation: GiftAnimation.SPARKLE,
  },

  {
    id: "sunglasses",
    name: "Clout Goggles",
    icon: "😎",
    coins: 75,
    rarity: RARITY.RARE,
    animation: GiftAnimation.BOUNCE,
  },

  {
    id: "gold_mic",
    name: "Golden Mic",
    icon: "🎤",
    coins: 150,
    rarity: RARITY.RARE,
    animation: GiftAnimation.SPARKLE,
  },

  {
    id: "donut",
    name: "Galaxy Donut",
    icon: "🍩",
    coins: 25,
    rarity: RARITY.RARE,
    animation: GiftAnimation.SPIN,
  },

  {
    id: "boba",
    name: "Boba Milk Tea",
    icon: "🧋",
    coins: 30,
    rarity: RARITY.RARE,
    animation: GiftAnimation.FLOAT,
  },

  {
    id: "pizza",
    name: "Pizza Party",
    icon: "🍕",
    coins: 35,
    rarity: RARITY.RARE,
    animation: GiftAnimation.DROP,
  },

  {
    id: "cat_paw",
    name: "Cat Paw",
    icon: "🐾",
    coins: 40,
    rarity: RARITY.RARE,
    animation: GiftAnimation.BOUNCE,
  },

  {
    id: "sneaker",
    name: "Hypebeast Kick",
    icon: "👟",
    coins: 60,
    rarity: RARITY.RARE,
    animation: GiftAnimation.DRIVE,
  },

  {
    id: "gamepad",
    name: "Pro Controller",
    icon: "🕹️",
    coins: 80,
    rarity: RARITY.RARE,
    animation: GiftAnimation.SHAKE,
  },

  {
    id: "neon_heart",
    name: "Neon Glow",
    icon: "💖",
    coins: 95,
    rarity: RARITY.RARE,
    animation: GiftAnimation.PULSE,
  },

  {
    id: "disco_ball",
    name: "Groove Ball",
    icon: "🪩",
    coins: 110,
    rarity: RARITY.RARE,
    animation: GiftAnimation.SPIN,
  },

  {
    id: "magic_wand",
    name: "Spellcast",
    icon: "🪄",
    coins: 130,
    rarity: RARITY.RARE,
    animation: GiftAnimation.MAGIC,
  },

  {
    id: "skateboard",
    name: "Kickflip",
    icon: "🛹",
    coins: 140,
    rarity: RARITY.RARE,
    animation: GiftAnimation.DRIVE,
  },

  {
    id: "teddy",
    name: "Giant Teddy",
    icon: "🧸",
    coins: 160,
    rarity: RARITY.RARE,
    animation: GiftAnimation.DROP,
  },

  {
    id: "champagne",
    name: "Bubbly Pop",
    icon: "🍾",
    coins: 188,
    rarity: RARITY.RARE,
    animation: GiftAnimation.EXPLODE,
  },

    // ==================== EPIC ====================

  {
    id: "sports_car",
    name: "V10 Supercar",
    icon: "🏎️",
    coins: 500,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.DRIVE,
  },

  {
    id: "jetpack",
    name: "Rocket Rush",
    icon: "🚀",
    coins: 800,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.ROCKET,
  },

  {
    id: "diamond",
    name: "Raw Diamond",
    icon: "💎",
    coins: 1000,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.SPARKLE,
  },

  {
    id: "dj_deck",
    name: "Club DJ Night",
    icon: "🎧",
    coins: 1200,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.SHAKE,
  },

  {
    id: "money_gun",
    name: "Cash Rain",
    icon: "💸",
    coins: 250,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.RAIN,
  },

  {
    id: "koi_fish",
    name: "Lucky Zen Koi",
    icon: "🎏",
    coins: 300,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.FLOAT,
  },

  {
    id: "guitar",
    name: "Rock Shredder",
    icon: "🎸",
    coins: 400,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.SHAKE,
  },

  {
    id: "hot_air_balloon",
    name: "Sky Wanderer",
    icon: "🎈",
    coins: 450,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.FLOAT,
  },

  {
    id: "motorcycle",
    name: "Cyber Chopper",
    icon: "🏍️",
    coins: 600,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.DRIVE,
  },

  {
    id: "lucky_cat",
    name: "Maneki Neko",
    icon: "🐱",
    coins: 700,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.MAGIC,
  },

  {
    id: "crown_royal",
    name: "Emperor Crown",
    icon: "👑",
    coins: 900,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.DROP,
  },

  {
    id: "unicorn",
    name: "Stardust Horn",
    icon: "🦄",
    coins: 1100,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.FLY,
  },

  {
    id: "submarine",
    name: "Deep Sea Dive",
    icon: "🦭",
    coins: 1300,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.SAIL,
  },

  {
    id: "ring",
    name: "Flawless Ring",
    icon: "💍",
    coins: 1450,
    rarity: RARITY.EPIC,
    animation: GiftAnimation.SPIN,
  },

  // ==================== LEGENDARY ====================

  {
    id: "yacht",
    name: "Hyper Yacht",
    icon: "🚢",
    coins: 3000,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.SAIL,
  },

  {
    id: "lion",
    name: "The TikTok Lion",
    icon: "🦁",
    coins: 5000,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.SHAKE,
  },

  {
    id: "castle",
    name: "Sky High Palace",
    icon: "🏰",
    coins: 7000,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.DROP,
  },

  {
    id: "dragon",
    name: "Ancient Dragon",
    icon: "🐉",
    coins: 8888,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.FLY,
  },

  {
    id: "private_jet",
    name: "Gulfstream Jet",
    icon: "🛩️",
    coins: 2000,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.FLY,
  },

  {
    id: "cruise",
    name: "Ocean Titan",
    icon: "🛳️",
    coins: 2500,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.SAIL,
  },

  {
    id: "pegasus",
    name: "Astral Pegasus",
    icon: "🦄",
    coins: 3500,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.FLY,
  },

  {
    id: "helicopter",
    name: "Apex Chopper",
    icon: "🚁",
    coins: 4000,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.FLY,
  },

  {
    id: "whale",
    name: "Deep Blue Splash",
    icon: "🐋",
    coins: 4500,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.FLOAT,
  },

  {
    id: "golden_buddha",
    name: "Imperial Statue",
    icon: "🏆",
    coins: 5500,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.DROP,
  },

  {
    id: "sphinx",
    name: "Desert Riddle",
    icon: "🗿",
    coins: 6000,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.DROP,
  },

  {
    id: "volcano",
    name: "Lava Eruption",
    icon: "🌋",
    coins: 6666,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.EXPLODE,
  },

  {
    id: "phoenix_nest",
    name: "Firebirds Return",
    icon: "🔥",
    coins: 8000,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.FIRE,
  },

  {
    id: "zeus_lightning",
    name: "Olympus Shock",
    icon: "⚡",
    coins: 9500,
    rarity: RARITY.LEGENDARY,
    animation: GiftAnimation.MAGIC,
  },

  // ==================== MYTHIC ====================

  {
    id: "galaxy",
    name: "Supernova Galaxy",
    icon: "🌌",
    coins: 10000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.COSMIC,
  },

  {
    id: "phoenix",
    name: "Golden Phoenix",
    icon: "🦅",
    coins: 15000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.FIRE,
  },

  {
    id: "universe_portal",
    name: "Wormhole Portal",
    icon: "🪐",
    coins: 20000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.COSMIC,
  },

  {
    id: "cyber_city",
    name: "Neo-Tokyo City",
    icon: "🏙️",
    coins: 25000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.MAGIC,
  },

  {
    id: "black_hole",
    name: "Cosmic Singularity",
    icon: "🕳️",
    coins: 30000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.COSMIC,
  },

  {
    id: "aurora",
    name: "Solar Storm Lights",
    icon: "✨",
    coins: 35000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.SPARKLE,
  },

  {
    id: "time_machine",
    name: "Chronos Drive",
    icon: "⏳",
    coins: 40000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.MAGIC,
  },

  {
    id: "matrix_core",
    name: "Digital Rebirth",
    icon: "💾",
    coins: 45000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.MAGIC,
  },

  {
    id: "atlantis",
    name: "Sunken Continent",
    icon: "🔱",
    coins: 50000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.SAIL,
  },

  {
    id: "constellation",
    name: "Zodiac Alignment",
    icon: "☄️",
    coins: 60000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.COSMIC,
  },

  {
    id: "supernova",
    name: "Star Destroyer",
    icon: "💥",
    coins: 75000,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.EXPLODE,
  },

  {
    id: "big_bang",
    name: "Cosmic Origin",
    icon: "⚛️",
    coins: 99999,
    rarity: RARITY.MYTHIC,
    animation: GiftAnimation.COSMIC,
  },

];