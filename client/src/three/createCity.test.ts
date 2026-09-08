import { test } from "node:test";
import assert from "node:assert/strict";
import { Vector3, PerspectiveCamera } from "three";
import { createCity } from "./createCity";
import { frameCity } from "./camera";
import { calendarDays } from "../../../shared/github";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
test("every day has a plot and exact building heights are preserved", () => {
  const days = calendarDays(2024);
  days[0].contributions = 1;
  days[1].contributions = 20;
  const city = createCity({
    username: "test",
    year: 2024,
    totalContributions: 21,
    days,
  });
  assert.equal(city.targets.length, 368);
  assert.equal(city.targets[1].scale.y, 0.35);
  assert.equal(city.targets[3].scale.y, 7);
  assert.equal(city.targets[1].userData.date, "2024-01-01");
  assert.equal(city.targets[1].position.x, city.targets[0].position.x);
  city.dispose();
  assert.equal(city.group.children.length, 0);
});
test("camera frames the full city in landscape and portrait, even with tall buildings", () => {
  const days = calendarDays(2026);
  days[180].contributions = 1000;
  const city = createCity({
    username: "test",
    year: 2026,
    totalContributions: 1000,
    days,
  });
  for (const aspect of [0.6, 2.5]) {
    const camera = new PerspectiveCamera(35, aspect, 0.1, 2000);
    const target = new Vector3();
    const controls = {
      target,
      update() {
        camera.lookAt(target);
        camera.updateMatrixWorld();
      },
      saveState() {},
    } as unknown as OrbitControls;
    frameCity(camera, controls, city.group);
    for (const mesh of city.targets) {
      const top = mesh.position
        .clone()
        .add(new Vector3(0, mesh.scale.y / 2, 0))
        .project(camera);
      assert.ok(Math.abs(top.x) < 1 && Math.abs(top.y) < 1 && top.z < 1);
    }
  }
  city.dispose();
});
