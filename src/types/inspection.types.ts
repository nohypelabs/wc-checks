// src/types/inspection.types.ts
export type InspectionComponent = 
  | 'aroma'
  | 'floor_cleanliness'
  | 'wall_condition'
  | 'sink_condition'
  | 'mirror_condition'
  | 'toilet_condition'
  | 'urinal_condition'
  | 'soap_availability'
  | 'tissue_availability'
  | 'air_freshener'
  | 'trash_bin_condition';

// NEW: 5-star rating system (1-5)
// Backward compatibility: Also support old format for display
export type RatingChoice = 1 | 2 | 3 | 4 | 5 | 'good' | 'normal' | 'bad' | 'other';

export interface ComponentRating {
  component: InspectionComponent;
  isAvailable: boolean; // NEW: Track if component exists at this location
  choice: RatingChoice;
  notes?: string; // Required when choice === 'other'
  photo?: string;
}

export type ComponentCategory = 'aroma' | 'visual' | 'availability' | 'functional';

export interface InspectionComponentConfig {
  id: InspectionComponent;
  category: ComponentCategory;
  label: string;
  labelGenZ: string;
  weight: number;
  icon: string; // Lucide icon name for professional mode
  iconGenZ: string; // Emoji for GenZ mode
  required: boolean;
  allowPhoto: boolean;
  choices: {
    professional: {
      good: string;
      normal: string;
      bad: string;
      other: string;
    };
    genZ: {
      good: string;
      normal: string;
      bad: string;
      other: string;
    };
  };
}

// ============================================
// INSPECTION COMPONENTS CONFIGURATION
// ============================================

export const INSPECTION_COMPONENTS: InspectionComponentConfig[] = [
  // AROMA CATEGORY
  {
    id: 'aroma',
    category: 'aroma',
    label: 'Aroma/Odor Level',
    labelGenZ: 'Bau-bauan',
    weight: 0.15,
    icon: 'Nose',
    iconGenZ: '👃',
    required: true,
    allowPhoto: false,
    choices: {
      professional: {
        good: 'Fresh/Pleasant',
        normal: 'Neutral',
        bad: 'Unpleasant Odor',
        other: 'Other (specify)',
      },
      genZ: {
        good: '🌸 Wangi',
        normal: '😐 Normal',
        bad: '🤢 Bau',
        other: '💬 Lainnya',
      },
    },
  },

  // VISUAL CLEANLINESS CATEGORY
  {
    id: 'floor_cleanliness',
    category: 'visual',
    label: 'Floor Cleanliness',
    labelGenZ: 'Kebersihan Lantai',
    weight: 0.12,
    icon: 'Droplets',
    iconGenZ: '✨',
    required: true,
    allowPhoto: true,
    choices: {
      professional: {
        good: 'Clean',
        normal: 'Acceptable',
        bad: 'Dirty',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✨ Bersih',
        normal: '😐 Cukup',
        bad: '💩 Kotor',
        other: '💬 Lainnya',
      },
    },
  },
  {
    id: 'wall_condition',
    category: 'visual',
    label: 'Wall & Tile Condition',
    labelGenZ: 'Kondisi Dinding',
    weight: 0.08,
    icon: 'Square',
    iconGenZ: '🎨',
    required: true,
    allowPhoto: true,
    choices: {
      professional: {
        good: 'Clean',
        normal: 'Acceptable',
        bad: 'Dirty/Damaged',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✨ Bersih',
        normal: '😐 Cukup',
        bad: '💩 Kotor',
        other: '💬 Lainnya',
      },
    },
  },
  {
    id: 'mirror_condition',
    category: 'visual',
    label: 'Mirror Cleanliness',
    labelGenZ: 'Kebersihan Cermin',
    weight: 0.06,
    icon: 'Mirror',
    iconGenZ: '🪞',
    required: true,
    allowPhoto: false,
    choices: {
      professional: {
        good: 'Clean',
        normal: 'Acceptable',
        bad: 'Dirty/Spotted',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✨ Bersih',
        normal: '😐 Cukup',
        bad: '💩 Kotor',
        other: '💬 Lainnya',
      },
    },
  },
  {
    id: 'toilet_condition',
    category: 'visual',
    label: 'Toilet Bowl Condition',
    labelGenZ: 'Kondisi Kloset',
    weight: 0.15,
    icon: 'Droplet', // Using Droplet as placeholder for toilet
    iconGenZ: '🚽',
    required: true,
    allowPhoto: true,
    choices: {
      professional: {
        good: 'Clean',
        normal: 'Acceptable',
        bad: 'Dirty',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✨ Bersih',
        normal: '😐 Cukup',
        bad: '💩 Kotor',
        other: '💬 Lainnya',
      },
    },
  },
  {
    id: 'trash_bin_condition',
    category: 'visual',
    label: 'Trash Bin Condition',
    labelGenZ: 'Kondisi Tempat Sampah',
    weight: 0.06,
    icon: 'Trash2',
    iconGenZ: '🗑️',
    required: true,
    allowPhoto: false,
    choices: {
      professional: {
        good: 'Clean/Not Full',
        normal: 'Half Full',
        bad: 'Overflowing',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✨ Bersih',
        normal: '😐 Setengah',
        bad: '😫 Penuh',
        other: '💬 Lainnya',
      },
    },
  },

  // FUNCTIONAL CATEGORY
  {
    id: 'sink_condition',
    category: 'functional',
    label: 'Sink & Faucet Condition',
    labelGenZ: 'Kondisi Wastafel',
    weight: 0.10,
    icon: 'Droplet',
    iconGenZ: '💧',
    required: true,
    allowPhoto: true,
    choices: {
      professional: {
        good: 'Functioning Properly',
        normal: 'Minor Issues',
        bad: 'Not Functional',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✅ Normal',
        normal: '⚠️ Agak Bermasalah',
        bad: '❌ Rusak',
        other: '💬 Lainnya',
      },
    },
  },
  {
    id: 'urinal_condition',
    category: 'functional',
    label: 'Urinal Condition',
    labelGenZ: 'Kondisi Urinoir',
    weight: 0.08,
    icon: 'Droplets',
    iconGenZ: '🚿',
    required: false, // Not all toilets have urinals
    allowPhoto: true,
    choices: {
      professional: {
        good: 'Functioning Properly',
        normal: 'Minor Issues',
        bad: 'Not Functional',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✅ Normal',
        normal: '⚠️ Agak Bermasalah',
        bad: '❌ Rusak',
        other: '💬 Lainnya',
      },
    },
  },

  // AVAILABILITY CATEGORY
  {
    id: 'soap_availability',
    category: 'availability',
    label: 'Soap Availability',
    labelGenZ: 'Ketersediaan Sabun',
    weight: 0.08,
    icon: 'Droplets',
    iconGenZ: '🧴',
    required: true,
    allowPhoto: false,
    choices: {
      professional: {
        good: 'Available',
        normal: 'Low Stock',
        bad: 'Empty',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✅ Ada',
        normal: '⚠️ Hampir Habis',
        bad: '❌ Habis',
        other: '💬 Lainnya',
      },
    },
  },
  {
    id: 'tissue_availability',
    category: 'availability',
    label: 'Tissue Availability',
    labelGenZ: 'Ketersediaan Tissue',
    weight: 0.08,
    icon: 'FileText',
    iconGenZ: '🧻',
    required: true,
    allowPhoto: false,
    choices: {
      professional: {
        good: 'Available',
        normal: 'Low Stock',
        bad: 'Empty',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✅ Ada',
        normal: '⚠️ Hampir Habis',
        bad: '❌ Habis',
        other: '💬 Lainnya',
      },
    },
  },
  {
    id: 'air_freshener',
    category: 'availability',
    label: 'Air Freshener',
    labelGenZ: 'Pengharum Ruangan',
    weight: 0.04,
    icon: 'Wind',
    iconGenZ: '🌬️',
    required: true,
    allowPhoto: false,
    choices: {
      professional: {
        good: 'Available',
        normal: 'Low Stock',
        bad: 'Empty',
        other: 'Other (specify)',
      },
      genZ: {
        good: '✅ Ada',
        normal: '⚠️ Hampir Habis',
        bad: '❌ Habis',
        other: '💬 Lainnya',
      },
    },
  },
];

// ============================================
// 5-STAR RATING CONFIGURATION
// ============================================

export interface StarRatingConfig {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  description: string;
  color: string;
  emoji: string;
}

export const STAR_RATINGS: StarRatingConfig[] = [
  {
    value: 5,
    label: 'Sempurna',
    description: 'Tidak ada noda, wangi, semua supplies full',
    color: 'green',
    emoji: '🌟',
  },
  {
    value: 4,
    label: 'Baik',
    description: 'Bersih, minor imperfections, supplies cukup',
    color: 'blue',
    emoji: '😊',
  },
  {
    value: 3,
    label: 'Cukup',
    description: 'Cukup bersih, ada noda kecil, supplies menipis',
    color: 'yellow',
    emoji: '😐',
  },
  {
    value: 2,
    label: 'Buruk',
    description: 'Kurang bersih, noda terlihat, supplies hampir habis',
    color: 'orange',
    emoji: '😟',
  },
  {
    value: 1,
    label: 'Kritis',
    description: 'Kotor, bau, supplies habis, perlu action immediate',
    color: 'red',
    emoji: '😨',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize old rating format to new 1-5 star format
 * For backward compatibility with existing data
 */
export const normalizeRating = (choice: RatingChoice): 1 | 2 | 3 | 4 | 5 => {
  if (typeof choice === 'number') return choice;

  // Convert old format to new
  switch(choice) {
    case 'good': return 5;
    case 'normal': return 3;
    case 'bad': return 1;
    case 'other': return 2;
    default: return 3; // fallback
  }
};

/**
 * Get star rating config by value
 */
export const getStarRating = (choice: RatingChoice): StarRatingConfig => {
  const normalized = normalizeRating(choice);
  return STAR_RATINGS.find(r => r.value === normalized) || STAR_RATINGS[2]; // default to 3★
};

export const calculateWeightedScore = (ratings: ComponentRating[]): number => {
  let totalWeight = 0;
  let weightedSum = 0;

  ratings.forEach((rating) => {
    // Skip unavailable components from scoring
    if (!rating.isAvailable) return;

    const component = INSPECTION_COMPONENTS.find((c) => c.id === rating.component);
    if (!component) return;

    totalWeight += component.weight;

    // Normalize rating to 1-5 (handles both old and new format)
    const normalizedChoice = normalizeRating(rating.choice);

    // Scoring: 1★=20, 2★=40, 3★=60, 4★=80, 5★=100
    const score = normalizedChoice * 20;

    weightedSum += score * component.weight;
  });

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

export const getScoreStatus = (
  score: number
): { label: string; color: string; emoji: string } => {
  if (score >= 85) {
    return { label: 'Excellent', color: 'green', emoji: '🌟' };
  } else if (score >= 70) {
    return { label: 'Good', color: 'blue', emoji: '😊' };
  } else if (score >= 50) {
    return { label: 'Fair', color: 'yellow', emoji: '😐' };
  } else if (score >= 30) {
    return { label: 'Poor', color: 'orange', emoji: '😟' };
  } else {
    return { label: 'Critical', color: 'red', emoji: '😨' };
  }
};

export interface PhotoWithMetadata {
  file: File;
  preview: string;
  componentId: InspectionComponent;
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}