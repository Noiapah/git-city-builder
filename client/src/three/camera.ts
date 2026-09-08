import {
  Box3,
  MathUtils,
  PerspectiveCamera,
  Vector3,
  type Object3D,
} from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function frameCity(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  city: Object3D,
) {
  const bounds = new Box3().setFromObject(city);
  const center = bounds.getCenter(new Vector3());
  const direction = new Vector3(0.55, 0.85, 1).normalize();
  camera.position.copy(center).add(direction);
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const tanVertical = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const tanHorizontal = tanVertical * camera.aspect;
  let distance = 1;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new Vector3(x, y, z).sub(center);
        distance = Math.max(
          distance,
          corner.dot(direction) +
            Math.max(
              Math.abs(corner.dot(right)) / tanHorizontal,
              Math.abs(corner.dot(up)) / tanVertical,
            ) *
              1.2,
        );
      }
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.far = Math.max(2000, distance * 20);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.maxDistance = distance * 5;
  controls.minDistance = 2;
  controls.update();
  controls.saveState();
}
