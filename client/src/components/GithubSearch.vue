<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{
  username?: string;
  year?: number;
  loading?: boolean;
}>();
const emit = defineEmits<{ build: [username: string, year: number] }>();
const name = ref(props.username || "");
const selectedYear = ref(props.year || new Date().getFullYear());
const error = ref("");
const years = Array.from(
  { length: new Date().getFullYear() - 2007 },
  (_, i) => new Date().getFullYear() - i,
);
watch(
  () => props.username,
  (value) => {
    name.value = value || "";
  },
);
watch(
  () => props.year,
  (value) => {
    if (value) selectedYear.value = value;
  },
);
function submit() {
  error.value = "";
  const value = name.value.trim();
  if (!value) {
    error.value = "Enter a GitHub username to start building.";
    return;
  }
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value)) {
    error.value = "Please enter a valid GitHub username.";
    return;
  }
  emit("build", value, selectedYear.value);
}
function changeYear() {
  if (props.username && !props.loading) submit();
}
</script>
<template>
  <form class="search-form" @submit.prevent="submit">
    <div class="search-fields">
      <div class="username-field">
        <span aria-hidden="true">@</span
        ><input
          v-model="name"
          aria-label="GitHub username"
          :aria-invalid="!!error"
          aria-describedby="search-error"
          placeholder="GitHub username"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          :disabled="loading"
        />
      </div>
      <select
        v-model="selectedYear"
        aria-label="Contribution year"
        :disabled="loading"
        @change="changeYear"
      >
        <option v-for="year in years" :key="year" :value="year">
          {{ year }}
        </option></select
      ><button class="primary" :disabled="loading" type="submit">
        {{ loading ? "Building city…" : "Build City" }}
        <span aria-hidden="true">↗</span>
      </button>
    </div>
    <p v-if="error" id="search-error" class="form-error" role="alert">
      {{ error }}
    </p>
  </form>
</template>
