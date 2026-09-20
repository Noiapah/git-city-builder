<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
} from "vue";
import type { ContributionYear } from "../../../shared/github";
import { createScene, type Inspection } from "../three/createScene";
import BuildingTooltip from "./BuildingTooltip.vue";
import {
  ARCHITECTURES,
  buildingStyles,
  type Architecture,
} from "../three/buildingStyles";
// Shared across viewers so a choice on the sample carries into a personal city.
import { architecture } from "../three/architecturePreference";
const props = defineProps<{ data: ContributionYear; sample?: boolean }>();
const host = ref<HTMLDivElement>();
const hover = shallowRef<Inspection | null>(null);
const selected = shallowRef<Inspection | null>(null);
const error = ref("");
const styles = computed(() => buildingStyles(architecture.value));
const activeArchitecture = computed(() =>
  ARCHITECTURES.find((item) => item.id === architecture.value)!,
);
function chooseArchitecture(value: Architecture) {
  architecture.value = value;
}
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
      architecture.value,
    );
  } catch {
    error.value =
      "The 3D view requires WebGL. Enable hardware acceleration or try another browser.";
  }
});
watch(
  () => props.data,
  (data) => scene?.update(data, architecture.value),
);
watch(architecture, (value) => scene?.update(props.data, value, true));
onBeforeUnmount(() => scene?.dispose());
</script>
<template>
  <div class="architecture-picker" role="group" aria-label="Architecture style">
    <div class="architecture-heading">
      <span>ARCHITECTURE</span>
      <p>{{ activeArchitecture.description }}</p>
    </div>
    <div class="architecture-options">
      <button
        v-for="option in ARCHITECTURES"
        :key="option.id"
        :aria-pressed="architecture === option.id"
        @click="chooseArchitecture(option.id)"
      >
        <svg viewBox="0 0 32 28" aria-hidden="true">
          <path
            v-if="option.id === 'modern'"
            d="M4 25V10h10v15M14 25V3h13v22M18 8h5M18 13h5M18 18h5M7 15h4M7 20h4M2 25h28"
          />
          <path
            v-else-if="option.id === 'new-york'"
            d="M3 25V12h8v13M11 25V8h5V4h7v4h5v17M17 4V1M15 12h3m4 0h2M15 17h3m4 0h2M15 22h3m4 0h2M6 16h2m-2 5h2M1 25h30"
          />
          <path
            v-else
            d="M3 25V11L10 3l7 8v14M3 12h14M10 12v13M20 25V7h3v4h3V7h3v18M7 17h6M23 17h3M1 25h30"
          />
        </svg>
        {{ option.name }}
      </button>
    </div>
  </div>
  <section
    class="city-viewer"
    aria-label="3D contribution city"
    :data-architecture="architecture"
  >
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
          v-for="style in styles"
          :key="style.name"
          :title="style.name"
          :style="{ background: style.wall }"
        ></i
        ><span>Height = contributions</span>
      </div>
    </div>
  </section>
</template>
