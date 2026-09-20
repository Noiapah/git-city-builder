import { ref, watch } from "vue";
import { ARCHITECTURES, type Architecture } from "./buildingStyles";

const storageKey = "github-city-architecture";
function savedArchitecture(): Architecture {
  try {
    const saved = localStorage.getItem(storageKey);
    return ARCHITECTURES.find((item) => item.id === saved)?.id || "modern";
  } catch {
    return "modern";
  }
}
export const architecture = ref<Architecture>(savedArchitecture());
watch(architecture, (value) => {
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // Style switching still works when browser storage is unavailable.
  }
});
