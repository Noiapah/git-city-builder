import { test } from "node:test";
import assert from "node:assert/strict";
import { Box3, BoxGeometry, Group, MeshStandardMaterial } from "three";
import { createBuildingFactory } from "./createBuilding";
import { BUILDING_STYLES, styleIndex } from "./buildingStyles";
import { FLOOR_HEIGHT, PLOT_HEIGHT } from "./constants";

test("all architectural styles keep decorations inside the exact floor-height envelope", () => {
  for (let index = 0; index < BUILDING_STYLES.length; index++) {
    let key = "design";
    while (styleIndex(key) !== index) key += "x";
    for (const floors of [1, 5, 1000]) {
      const box = new BoxGeometry(1, 1, 1);
      const factory = createBuildingFactory(box);
      const group = new Group();
      const building = factory.create(
        { date: "2026-01-01", weekday: 4, week: 0, contributions: floors },
        key,
        0,
        0,
        group,
      );
      factory.finish(group);
      const bounds = new Box3().setFromObject(group);
      assert.ok(
        Math.abs(bounds.max.y - (PLOT_HEIGHT / 2 + floors * FLOOR_HEIGHT)) <
          0.0001,
      );
      assert.ok(Math.abs(bounds.min.y - PLOT_HEIGHT / 2) < 0.0001);
      assert.equal(building.userData.styleName, BUILDING_STYLES[index].name);
      assert.equal(building.geometry.getAttribute("uv").getY(0), floors);
      assert.ok(
        group.children.length <= 3,
        "Small details are batched into two materials",
      );
      factory.dispose();
      box.dispose();
    }
  }
});

test("designs are stable, reuse materials and geometry, and release textures", () => {
  const box = new BoxGeometry(1, 1, 1);
  const factory = createBuildingFactory(box);
  const group = new Group();
  const day = { date: "2026-01-01", weekday: 4, week: 0, contributions: 5 };
  const first = factory.create(day, "same-design", 0, 0, group);
  const second = factory.create(day, "same-design", 2, 0, group);
  factory.finish(group);
  assert.equal(first.geometry, second.geometry);
  assert.equal(first.material, second.material);
  const material = (first.material as MeshStandardMaterial[])[0];
  assert.ok(material.map);
  let disposed = 0;
  material.map.addEventListener("dispose", () => disposed++);
  factory.dispose();
  box.dispose();
  assert.equal(disposed, 1);
});
