import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import type { ContributionYear } from "../../../shared/github";
import {
  COLORS,
  FLOOR_HEIGHT,
  PLOT_GAP,
  PLOT_HEIGHT,
  PLOT_SIZE,
  intensity,
} from "./constants";
export function createCity(data: ContributionYear) {
  const group = new Group();
  const geometry = new BoxGeometry(1, 1, 1);
  const plotMaterial = new MeshStandardMaterial({
    color: COLORS.plot,
    roughness: 1,
  });
  const groundMaterial = new MeshStandardMaterial({
    color: COLORS.ground,
    roughness: 1,
  });
  const materials = COLORS.buildings.map(
    (color) => new MeshStandardMaterial({ color, roughness: 0.85 }),
  );
  const columns = Math.max(...data.days.map((day) => day.week), 0) + 1;
  const step = PLOT_SIZE + PLOT_GAP;
  const ground = new Mesh(geometry, groundMaterial);
  ground.scale.set(columns * step + 1.3, 0.3, 7 * step + 1.3);
  ground.position.y = -0.22;
  ground.receiveShadow = true;
  group.add(ground);
  const targets: Mesh[] = [];
  for (const day of data.days) {
    const x = (day.week - (columns - 1) / 2) * step;
    const z = (day.weekday - 3) * step;
    const plot = new Mesh(geometry, plotMaterial);
    plot.scale.set(PLOT_SIZE, PLOT_HEIGHT, PLOT_SIZE);
    plot.position.set(x, 0, z);
    plot.receiveShadow = true;
    plot.userData = { ...day };
    group.add(plot);
    targets.push(plot);
    if (day.contributions > 0) {
      const height = day.contributions * FLOOR_HEIGHT;
      const building = new Mesh(
        geometry,
        materials[intensity(day.contributions)],
      );
      building.scale.set(0.82 * PLOT_SIZE, height, 0.82 * PLOT_SIZE);
      building.position.set(x, (height + PLOT_HEIGHT) / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      building.userData = { ...day };
      group.add(building);
      targets.push(building);
    }
  }
  return {
    group,
    targets,
    dispose() {
      geometry.dispose();
      plotMaterial.dispose();
      groundMaterial.dispose();
      materials.forEach((material) => material.dispose());
      group.clear();
    },
  };
}
