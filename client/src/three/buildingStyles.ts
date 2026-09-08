export interface BuildingStyle {
  name: string;
  wall: string;
  frame: string;
  glass: string;
  roof: string;
  accent: string;
  pattern: "brick" | "curtain" | "stone" | "metal" | "timber";
  columns: number;
}

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

/** Stable design identity. Can use a repository name when attribution is available. */
export function styleIndex(key: string) {
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) % BUILDING_STYLES.length;
}
