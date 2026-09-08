export const PLOT_SIZE = 1;
export const PLOT_GAP = 0.15;
export const FLOOR_HEIGHT = 0.35;
export const PLOT_HEIGHT = 0.12;
export const COLORS = {
  background: "#edf1e8",
  ground: "#dce4d5",
  plot: "#c9d6be",
  buildings: ["#a3cc85", "#74ad63", "#43864b", "#245a37"],
  highlight: "#e4be59",
};
export function intensity(count: number) {
  return count <= 2 ? 0 : count <= 5 ? 1 : count <= 10 ? 2 : 3;
}
