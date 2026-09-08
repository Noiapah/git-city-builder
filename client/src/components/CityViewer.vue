<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import type { ContributionYear } from "../../../shared/github";
import { createScene, type Inspection } from "../three/createScene";
import BuildingTooltip from "./BuildingTooltip.vue";
import { BUILDING_STYLES } from "../three/buildingStyles";
const props = defineProps<{ data: ContributionYear; sample?: boolean }>();
const host = ref<HTMLDivElement>();
const hover = shallowRef<Inspection | null>(null);
const selected = shallowRef<Inspection | null>(null);
const error = ref("");
let scene: ReturnType<typeof createScene> | undefined;
onMounted(() => {
  try {
    scene = createScene(
      host.value!,
      props.data,
      (hit) => {
        hover.value = hit;
      },
      (hit) => {
        selected.value = hit;
      },
    );
  } catch {
    error.value =
      "The 3D view requires WebGL. Enable hardware acceleration or try another browser.";
  }
});
watch(
  () => props.data,
  (data) => scene?.update(data),
);
onBeforeUnmount(() => scene?.dispose());
</script>
<template>
  <section class="city-viewer" aria-label="3D contribution city">
    <div ref="host" class="canvas-host"></div>
    <div class="viewer-label">
      <span class="live-dot"></span
      >{{ sample ? "SAMPLE CITY" : `${data.username} / ${data.year}`
      }}<span class="viewer-label-sub">{{
        sample ? "Illustrative contribution data" : "One year. Built by you."
      }}</span>
    </div>
    <div class="view-controls">
      <button aria-label="Zoom in" title="Zoom in" @click="scene?.zoom(0.8)">
        +</button
      ><button
        aria-label="Zoom out"
        title="Zoom out"
        @click="scene?.zoom(1.25)"
      >
        −</button
      ><span></span
      ><button
        aria-label="Reset view"
        title="Reset view"
        @click="scene?.reset()"
      >
        ⌖
      </button>
    </div>
    <div
      v-if="hover && !selected"
      class="hover-tooltip"
      :style="{
        left: `${Math.max(8, Math.min(hover.x + 15, (host?.clientWidth || 300) - 245))}px`,
        top: `${Math.max(80, hover.y - 98)}px`,
      }"
    >
      <BuildingTooltip :day="hover.day" :style-name="hover.styleName" />
    </div>
    <div v-if="selected" class="selected-tooltip">
      <button
        class="close"
        aria-label="Close day details"
        @click="selected = null"
      >
        ×</button
      ><BuildingTooltip :day="selected.day" :style-name="selected.styleName" />
    </div>
    <div v-if="error" class="canvas-error" role="alert">{{ error }}</div>
    <div class="viewer-bottom">
      <div class="gesture-hints">
        <span>↔ <b>Drag</b> to rotate</span><span>↕ <b>Scroll</b> to zoom</span
        ><span>⌘ <b>Right-drag / Ctrl-drag</b> to pan</span>
      </div>
      <div class="legend">
        <span>Building styles</span
        ><i
          v-for="style in BUILDING_STYLES"
          :key="style.name"
          :title="style.name"
          :style="{ background: style.wall }"
        ></i
        ><span>Height = contributions</span>
      </div>
    </div>
  </section>
</template>
