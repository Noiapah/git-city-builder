import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  CylinderGeometry,
  Group,
  Mesh,
  InstancedMesh,
  Matrix4,
  type MeshStandardMaterial,
} from "three";
import type { ContributionDay } from "../../../shared/github";
import { FLOOR_HEIGHT, PLOT_HEIGHT, PLOT_SIZE } from "./constants";
import {
  buildingStyles,
  styleIndex,
  type Architecture,
} from "./buildingStyles";
import { createBuildingMaterials } from "./buildingMaterials";

function gableGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      [
        -0.5, 0, -0.5, 0, 1, -0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0,
        1, 0.5, -0.5, 0, -0.5, -0.5, 0, 0.5, 0, 1, 0.5, -0.5, 0, -0.5, 0, 1,
        0.5, 0, 1, -0.5, 0.5, 0, -0.5, 0, 1, -0.5, 0, 1, 0.5, 0.5, 0, -0.5, 0,
        1, 0.5, 0.5, 0, 0.5,
      ],
      3,
    ),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function createBuildingFactory(
  unitBox: BoxGeometry,
  architecture: Architecture = "modern",
) {
  const styles = buildingStyles(architecture);
  const materials = createBuildingMaterials(styles);
  const gable = gableGeometry();
  const cylinder = new CylinderGeometry(0.5, 0.5, 1, 10);
  const cone = new CylinderGeometry(0, 0.5, 1, 10);
  const geometries = new Map<string, BoxGeometry>();
  const batches = new Map<
    BufferGeometry,
    Map<MeshStandardMaterial, Matrix4[]>
  >();
  const detailMeshes: InstancedMesh[] = [];

  function geometryFor(floors: number, roofSpace: number) {
    const key = `${floors}/${roofSpace}`;
    let geometry = geometries.get(key);
    if (!geometry) {
      geometry = new BoxGeometry(1, 1, 1);
      const uv = geometry.getAttribute("uv");
      const position = geometry.getAttribute("position");
      const ratio = 1 - roofSpace / (floors * FLOOR_HEIGHT);
      for (let i = 0; i < position.count; i++) {
        if (position.getY(i) > 0) position.setY(i, ratio - 0.5);
      }
      // Side textures repeat once per floor, including the partial top floor.
      for (const face of [0, 1, 4, 5])
        for (let i = face * 4; i < face * 4 + 4; i++)
          uv.setY(i, uv.getY(i) * floors * ratio);
      const indices = Array.from(geometry.getIndex()!.array);
      geometry.setIndex([
        ...indices.slice(0, 12),
        ...indices.slice(24),
        ...indices.slice(12, 24),
      ]);
      geometry.clearGroups();
      geometry.addGroup(0, 24, 0);
      geometry.addGroup(24, 12, 1);
      geometries.set(key, geometry);
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
    const index = styleIndex(identity, styles.length);
    const style = styles[index];
    const palette = materials.palettes[index];
    const height = day.contributions * FLOOR_HEIGHT;
    const width =
      PLOT_SIZE * (architecture === "modern" && index !== 1 ? 0.74 : 0.84);
    const depth = PLOT_SIZE * (architecture === "medieval" ? 0.78 : 0.84);
    const base = PLOT_HEIGHT / 2;
    const roofSpace =
      style.form === "gable"
        ? Math.min(0.36, height * 0.4)
        : style.form === "cornice"
          ? Math.min(0.32, height * 0.25)
          : Math.min(0.09, height * 0.2);
    const wallTop = height - roofSpace;
    const building = new Mesh(
      geometryFor(day.contributions, roofSpace),
      palette.faces,
    );
    building.scale.set(width, height, depth);
    building.position.set(x, base + height / 2, z);
    building.castShadow = building.receiveShadow = true;
    building.userData = { ...day, styleName: style.name, architecture };
    group.add(building);

    function detail(
      geometry: BufferGeometry,
      w: number,
      h: number,
      d: number,
      px: number,
      py: number,
      pz: number,
      material: MeshStandardMaterial,
    ) {
      let byMaterial = batches.get(geometry);
      if (!byMaterial) batches.set(geometry, (byMaterial = new Map()));
      const transforms = byMaterial.get(material) || [];
      transforms.push(
        new Matrix4().makeScale(w, h, d).setPosition(x + px, base + py, z + pz),
      );
      byMaterial.set(material, transforms);
    }
    function box(
      w: number,
      h: number,
      d: number,
      px: number,
      py: number,
      pz: number,
      material = palette.trim,
    ) {
      detail(unitBox, w, h, d, px, py, pz, material);
    }

    // Every roof ends at contributions × FLOOR_HEIGHT, including one-floor houses.
    if (style.form === "gable") {
      detail(
        gable,
        width + 0.07,
        roofSpace,
        depth + 0.07,
        0,
        wallTop,
        0,
        palette.roof,
      );
      box(width + 0.07, 0.025, depth + 0.07, 0, wallTop - 0.0125, 0);
      for (const px of [-width / 2, width / 2])
        for (const pz of [-depth / 2, depth / 2])
          box(0.045, wallTop, 0.045, px, wallTop / 2, pz);
    } else if (style.form === "battlement") {
      // Low connecting walls and raised merlons form a castle silhouette.
      for (const side of [-1, 1]) {
        box(
          width,
          roofSpace * 0.35,
          0.06,
          0,
          wallTop + roofSpace * 0.175,
          (side * depth) / 2,
        );
        box(
          0.06,
          roofSpace * 0.35,
          depth,
          (side * width) / 2,
          wallTop + roofSpace * 0.175,
          0,
        );
        for (const fraction of [-0.5, 0, 0.5]) {
          box(
            width * 0.22,
            roofSpace,
            0.085,
            width * fraction,
            height - roofSpace / 2,
            (side * depth) / 2,
          );
          box(
            0.085,
            roofSpace,
            depth * 0.22,
            (side * width) / 2,
            height - roofSpace / 2,
            depth * fraction,
          );
        }
      }
    } else if (style.form === "cornice") {
      box(width + 0.06, 0.035, depth + 0.06, 0, wallTop - 0.0175, 0);
      box(width + 0.025, 0.03, depth + 0.025, 0, wallTop - 0.055, 0);
      // A water tank on legs, with its cap at the exact contribution height.
      for (const px of [-0.075, 0.075])
        box(
          0.025,
          roofSpace * 0.25,
          0.14,
          px,
          wallTop + roofSpace * 0.125,
          -depth * 0.16,
        );
      detail(
        cylinder,
        width * 0.32,
        roofSpace * 0.55,
        width * 0.32,
        0,
        wallTop + roofSpace * 0.525,
        -depth * 0.16,
        palette.trim,
      );
      detail(
        cone,
        width * 0.37,
        roofSpace * 0.2,
        width * 0.37,
        0,
        height - roofSpace * 0.1,
        -depth * 0.16,
        palette.roof,
      );
      // Bound detail counts even for unusually tall buildings.
      const landingStep = Math.max(1, Math.ceil(day.contributions / 80));
      for (let floor = 1; floor < day.contributions; floor += landingStep)
        box(
          width * 0.32,
          0.025,
          0.11,
          width * 0.18,
          floor * FLOOR_HEIGHT,
          depth / 2 + 0.04,
        );
      for (const px of [width * 0.06, width * 0.3])
        box(0.018, wallTop, 0.025, px, wallTop / 2, depth / 2 + 0.085);
    } else {
      for (const side of [-1, 1]) {
        box(
          width + 0.025,
          roofSpace,
          0.035,
          0,
          height - roofSpace / 2,
          (side * depth) / 2,
        );
        box(
          0.035,
          roofSpace,
          depth,
          (side * width) / 2,
          height - roofSpace / 2,
          0,
        );
      }
      box(
        width * 0.38,
        roofSpace * 0.7,
        depth * 0.3,
        -width * 0.15,
        wallTop + roofSpace * 0.35,
        0,
        palette.glass,
      );
      box(
        width * 0.18,
        roofSpace * 0.8,
        depth * 0.2,
        width * 0.25,
        wallTop + roofSpace * 0.4,
        -depth * 0.18,
      );
      for (const px of [-width / 2, width / 2])
        box(0.025, wallTop, 0.025, px, wallTop / 2, depth / 2 + 0.015);
    }
    const doorHeight = Math.min(0.24, wallTop * 0.65);
    box(
      0.16,
      doorHeight,
      0.018,
      0,
      doorHeight / 2,
      depth / 2 + 0.01,
      palette.glass,
    );
    box(0.23, 0.025, 0.1, 0, doorHeight + 0.0125, depth / 2 + 0.035);
    return building;
  }
  return {
    create,
    finish(group: Group) {
      for (const [geometry, byMaterial] of batches)
        for (const [material, transforms] of byMaterial) {
          const mesh = new InstancedMesh(geometry, material, transforms.length);
          mesh.name = "building-details";
          transforms.forEach((matrix, index) =>
            mesh.setMatrixAt(index, matrix),
          );
          mesh.instanceMatrix.needsUpdate = true;
          mesh.castShadow = mesh.receiveShadow = true;
          mesh.computeBoundingSphere();
          detailMeshes.push(mesh);
          group.add(mesh);
        }
      batches.clear();
    },
    dispose() {
      detailMeshes.forEach((mesh) => mesh.dispose());
      detailMeshes.length = 0;
      batches.clear();
      materials.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      geometries.clear();
      gable.dispose();
      cylinder.dispose();
      cone.dispose();
    },
  };
}
