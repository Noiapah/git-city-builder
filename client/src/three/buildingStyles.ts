export interface BuildingStyle {
  name: string;
  wall: string;
  frame: string;
  glass: string;
  roof: string;
  accent: string;
  pattern: "brick" | "curtain" | "stone" | "metal" | "timber";
  columns: number;
  form?: "flat" | "cornice" | "gable" | "battlement";
}

export type Architecture = "modern" | "new-york" | "medieval";

export const ARCHITECTURES: {
  id: Architecture;
  name: string;
  description: string;
}[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Glass, concrete & clean lines",
  },
  {
    id: "new-york",
    name: "New York",
    description: "Brownstones, lofts & skyline classics",
  },
  {
    id: "medieval",
    name: "Medieval",
    description: "Timber houses & stone towers",
  },
];

export const BUILDING_STYLES: BuildingStyle[] = [
  {
    name: "Brick loft",
    wall: "#ae6b51",
    frame: "#dfb390",
    glass: "#283e45",
    roof: "#594b45",
    accent: "#734b39",
    pattern: "brick",
    columns: 3,
  },
  {
    name: "Glass office",
    wall: "#517985",
    frame: "#a7bdba",
    glass: "#315564",
    roof: "#536b71",
    accent: "#d4d9cf",
    pattern: "curtain",
    columns: 4,
  },
  {
    name: "Limestone apartments",
    wall: "#d3c5a8",
    frame: "#ece0c4",
    glass: "#43585a",
    roof: "#797b70",
    accent: "#a28e71",
    pattern: "stone",
    columns: 3,
  },
  {
    name: "Garden studios",
    wall: "#6e876b",
    frame: "#a9b598",
    glass: "#2e4846",
    roof: "#455946",
    accent: "#ded3ae",
    pattern: "timber",
    columns: 2,
  },
  {
    name: "Industrial works",
    wall: "#88959a",
    frame: "#b7c2bf",
    glass: "#344951",
    roof: "#4c5c62",
    accent: "#c39354",
    pattern: "metal",
    columns: 3,
  },
];

const STYLE_COLLECTIONS: Record<Architecture, BuildingStyle[]> = {
  modern: [
    {
      ...BUILDING_STYLES[1],
      name: "Glass pavilion",
      wall: "#668b99",
      glass: "#315b70",
      accent: "#dce5df",
      columns: 4,
    },
    {
      ...BUILDING_STYLES[1],
      name: "White concrete residence",
      wall: "#e0ddd1",
      frame: "#e0ddd1",
      glass: "#3d5965",
      accent: "#f0eee5",
      pattern: "stone",
      columns: 2,
    },
    {
      ...BUILDING_STYLES[1],
      name: "Steel tower",
      wall: "#414f5b",
      frame: "#889da5",
      glass: "#294452",
      accent: "#71848e",
      columns: 5,
    },
  ],
  "new-york": [
    {
      ...BUILDING_STYLES[0],
      name: "Brooklyn brownstone",
      wall: "#945c46",
      accent: "#654131",
      form: "cornice",
    },
    {
      ...BUILDING_STYLES[0],
      name: "SoHo loft",
      wall: "#b57958",
      frame: "#d7b68c",
      accent: "#684d3c",
      columns: 4,
      form: "cornice",
    },
    {
      ...BUILDING_STYLES[2],
      name: "Manhattan limestone tower",
      wall: "#c9bba0",
      accent: "#aa9574",
      form: "cornice",
    },
  ],
  medieval: [
    {
      ...BUILDING_STYLES[3],
      name: "Timber guildhall",
      wall: "#e0cba0",
      frame: "#63452f",
      glass: "#3f3930",
      roof: "#884b36",
      accent: "#63452f",
      form: "gable",
    },
    {
      ...BUILDING_STYLES[3],
      name: "Merchant house",
      wall: "#cbb58b",
      frame: "#51422f",
      glass: "#393c32",
      roof: "#52645e",
      accent: "#51422f",
      form: "gable",
    },
    {
      ...BUILDING_STYLES[2],
      name: "Stone keep",
      wall: "#9e9b89",
      frame: "#b4ac96",
      glass: "#383c35",
      roof: "#767664",
      accent: "#b4ac96",
      columns: 2,
      form: "battlement",
    },
  ],
};

export function buildingStyles(architecture: Architecture = "modern") {
  return STYLE_COLLECTIONS[architecture];
}

/** Stable design identity. Can use a repository name when attribution is available. */
export function styleIndex(key: string, count = BUILDING_STYLES.length) {
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % count;
}
