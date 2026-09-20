import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from "three";
import type { ContributionYear } from "../../../shared/github";
import { COLORS, PLOT_GAP, PLOT_HEIGHT, PLOT_SIZE } from "./constants";
import { createBuildingFactory } from "./createBuilding";
import type { Architecture } from "./buildingStyles";
export function createCity(
  data: ContributionYear,
  architecture: Architecture = "modern",
) {
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
  const buildings = createBuildingFactory(geometry, architecture);
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
      targets.push(
        buildings.create(
          day,
          `${data.username.toLowerCase()}/${day.date}`,
          x,
          z,
          group,
        ),
      );
    }
  }
  buildings.finish(group);
  return {
    group,
    targets,
    dispose() {
      geometry.dispose();
      plotMaterial.dispose();
      groundMaterial.dispose();
      buildings.dispose();
      group.clear();
    },
  };
}
