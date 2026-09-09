import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
  PCFSoftShadowMap,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { ContributionDay, ContributionYear } from "../../../shared/github";
import { createCity } from "./createCity";
import { frameCity } from "./camera";
import { COLORS } from "./constants";
import { createRenderScheduler } from "./renderScheduler";
export interface Inspection {
  day: ContributionDay;
  styleName?: string;
  x: number;
  y: number;
}
export function createScene(
  host: HTMLElement,
  initial: ContributionYear,
  onHover: (hit: Inspection | null) => void,
  onSelect: (hit: Inspection | null) => void,
) {
  const scene = new Scene();
  scene.background = new Color(COLORS.background);
  const camera = new PerspectiveCamera(35, 1, 0.1, 2000);
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute(
    "aria-label",
    "Interactive contribution city. Drag to rotate, scroll to zoom, right-drag to pan.",
  );
  host.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.listenToKeyEvents(renderer.domElement);
  const scheduler = createRenderScheduler({
    update: () => controls.update(),
    render: () => renderer.render(scene, camera),
  });
  controls.addEventListener("change", scheduler.invalidate);
  scene.add(new AmbientLight("#ffffff", 2));
  const sun = new DirectionalLight("#fff9e9", 3);
  sun.position.set(-20, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -45,
    right: 45,
    top: 45,
    bottom: -45,
    far: 200,
  });
  sun.shadow.bias = -0.001;
  scene.add(sun);
  let city = createCity(initial);
  scene.add(city.group);
  const highlight = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshBasicMaterial({ color: COLORS.highlight, wireframe: true }),
  );
  highlight.visible = false;
  scene.add(highlight);
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    camera.aspect = Math.max(width, 1) / Math.max(height, 1);
    renderer.setSize(width, height);
    camera.updateProjectionMatrix();
    frameCity(camera, controls, city.group);
    scheduler.invalidate();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  let inViewport = true;
  let pageVisible = !document.hidden;
  const updateRendering = () => scheduler.setEnabled(inViewport && pageVisible);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting;
    updateRendering();
  });
  intersectionObserver.observe(host);
  const visibilityChange = () => {
    pageVisible = !document.hidden;
    updateRendering();
  };
  document.addEventListener("visibilitychange", visibilityChange);
  resize();
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  function hit(event: PointerEvent): Inspection | null {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const mesh = raycaster.intersectObjects(city.targets, false)[0]?.object;
    highlight.visible = !!mesh;
    if (!mesh) {
      scheduler.invalidate();
      return null;
    }
    highlight.position.copy(mesh.position);
    highlight.scale.copy(mesh.scale).multiplyScalar(1.025);
    scheduler.invalidate();
    return {
      day: mesh.userData as ContributionDay,
      styleName: mesh.userData.styleName,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
  let down = new Vector2();
  const pointerDown = (event: PointerEvent) => {
    down.set(event.clientX, event.clientY);
  };
  const pointerMove = (event: PointerEvent) => {
    if (!event.buttons) onHover(hit(event));
    else {
      highlight.visible = false;
      scheduler.invalidate();
      onHover(null);
    }
  };
  const pointerUp = (event: PointerEvent) => {
    if (
      event.button === 0 &&
      down.distanceTo(new Vector2(event.clientX, event.clientY)) < 5
    )
      onSelect(hit(event));
  };
  const leave = () => {
    highlight.visible = false;
    scheduler.invalidate();
    onHover(null);
  };
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointerleave", leave);
  scheduler.invalidate();
  return {
    update(data: ContributionYear) {
      scene.remove(city.group);
      city.dispose();
      city = createCity(data);
      scene.add(city.group);
      renderer.shadowMap.needsUpdate = true;
      leave();
      onSelect(null);
      frameCity(camera, controls, city.group);
      scheduler.invalidate();
    },
    reset() {
      frameCity(camera, controls, city.group);
      scheduler.invalidate();
    },
    zoom(factor: number) {
      camera.position
        .sub(controls.target)
        .multiplyScalar(factor)
        .add(controls.target);
      controls.update();
      scheduler.invalidate();
    },
    dispose() {
      scheduler.dispose();
      observer.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", visibilityChange);
      controls.removeEventListener("change", scheduler.invalidate);
      controls.dispose();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointerleave", leave);
      city.dispose();
      highlight.geometry.dispose();
      highlight.material.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      canvas.remove();
      scene.clear();
    },
  };
}
