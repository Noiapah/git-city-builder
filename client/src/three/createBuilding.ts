import {
  BoxGeometry,
  Group,
  Mesh,
  InstancedMesh,
  Matrix4,
  type MeshStandardMaterial,
} from "three";
import type { ContributionDay } from "../../../shared/github";
import { FLOOR_HEIGHT, PLOT_HEIGHT, PLOT_SIZE } from "./constants";
import { BUILDING_STYLES, styleIndex } from "./buildingStyles";
import { createBuildingMaterials } from "./buildingMaterials";

export function createBuildingFactory(unitBox: BoxGeometry) {
  const materials = createBuildingMaterials();
  const geometries = new Map<number, BoxGeometry>();
  const detailTransforms = new Map<MeshStandardMaterial, Matrix4[]>();
  const detailMeshes: InstancedMesh[] = [];
  function geometryFor(floors: number) {
    let geometry = geometries.get(floors);
    if (!geometry) {
      geometry = new BoxGeometry(1, 1, 1);
      const uv = geometry.getAttribute("uv");
      const position = geometry.getAttribute("position");
      const height = floors * FLOOR_HEIGHT;
      const recess = Math.min(0.09, height * 0.2) / height;
      for (let i = 8; i < 12; i++) position.setY(i, 0.5 - recess);
      // BoxGeometry has four UV vertices per face: ±X, ±Y, ±Z.
      for (const face of [0, 1, 4, 5])
        for (let i = face * 4; i < face * 4 + 4; i++)
          uv.setY(i, uv.getY(i) * floors);
      const indices = Array.from(geometry.getIndex()!.array);
      geometry.setIndex([
        ...indices.slice(0, 12),
        ...indices.slice(24),
        ...indices.slice(12, 24),
      ]);
      geometry.clearGroups();
      geometry.addGroup(0, 24, 0);
      geometry.addGroup(24, 12, 1);
      geometries.set(floors, geometry);
    }
    return geometry;
  }
  function create(
    day: ContributionDay,
    identity: string,
    x: number,
    z: number,
    group: Group,
  ) {
    const index = styleIndex(identity);
    const style = BUILDING_STYLES[index];
    const palette = materials.palettes[index];
    const height = day.contributions * FLOOR_HEIGHT;
    const width = PLOT_SIZE * (index === 1 ? 0.74 : 0.84);
    const depth = PLOT_SIZE * (index === 3 ? 0.74 : 0.84);
    const base = PLOT_HEIGHT / 2;
    const building = new Mesh(geometryFor(day.contributions), palette.faces);
    building.scale.set(width, height, depth);
    building.position.set(x, base + height / 2, z);
    building.castShadow = building.receiveShadow = true;
    building.userData = { ...day, styleName: style.name };
    group.add(building);

    function box(
      w: number,
      h: number,
      d: number,
      px: number,
      py: number,
      pz: number,
      material: MeshStandardMaterial,
    ) {
      const transforms = detailTransforms.get(material) || [];
      transforms.push(
        new Matrix4().makeScale(w, h, d).setPosition(x + px, base + py, z + pz),
      );
      detailTransforms.set(material, transforms);
    }
    // The parapet ends at the exact contribution height; decorations never add floors.
    const parapet = Math.min(0.09, height * 0.2);
    box(
      width + 0.025,
      parapet,
      0.035,
      0,
      height - parapet / 2,
      depth / 2,
      palette.trim,
    );
    box(
      width + 0.025,
      parapet,
      0.035,
      0,
      height - parapet / 2,
      -depth / 2,
      palette.trim,
    );
    box(
      0.035,
      parapet,
      depth,
      width / 2,
      height - parapet / 2,
      0,
      palette.trim,
    );
    box(
      0.035,
      parapet,
      depth,
      -width / 2,
      height - parapet / 2,
      0,
      palette.trim,
    );
    // Raised skylight and rooftop ventilation, kept inside the top floor envelope.
    box(
      width * 0.38,
      parapet * 0.7,
      depth * 0.3,
      -width * 0.15,
      height - parapet * 0.45,
      0,
      palette.glass,
    );
    box(
      width * 0.18,
      parapet * 0.8,
      depth * 0.2,
      width * 0.25,
      height - parapet * 0.5,
      -depth * 0.18,
      palette.trim,
    );
    const doorHeight = Math.min(0.24, height * 0.6);
    box(
      0.16,
      doorHeight,
      0.018,
      0,
      doorHeight / 2,
      depth / 2 + 0.01,
      palette.glass,
    );
    box(
      0.23,
      0.035,
      0.12,
      0,
      doorHeight + 0.025,
      depth / 2 + 0.04,
      palette.trim,
    );
    return building;
  }
  return {
    create,
    finish(group: Group) {
      for (const [material, transforms] of detailTransforms) {
        const mesh = new InstancedMesh(unitBox, material, transforms.length);
        mesh.name = "building-details";
        transforms.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        detailMeshes.push(mesh);
        group.add(mesh);
      }
      detailTransforms.clear();
    },
    dispose() {
      detailMeshes.forEach((mesh) => mesh.dispose());
      detailMeshes.length = 0;
      detailTransforms.clear();
      materials.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      geometries.clear();
    },
  };
}
