<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import GithubSearch from "../components/GithubSearch.vue";
import CityViewer from "../components/CityViewer.vue";
import { fetchContributions } from "../services/githubService";
import type { ContributionYear } from "../../../shared/github";
const route = useRoute();
const router = useRouter();
const data = shallowRef<ContributionYear | null>(null);
const loading = ref(false);
const error = ref("");
const username = computed(() => String(route.params.username || ""));
const year = computed(() => Number(route.params.year));
let controller: AbortController | undefined;
async function load() {
  controller?.abort();
  const request = new AbortController();
  controller = request;
  data.value = null;
  error.value = "";
  loading.value = true;
  try {
    data.value = await fetchContributions(
      username.value,
      year.value,
      request.signal,
    );
  } catch (cause) {
    if (!request.signal.aborted)
      error.value =
        cause instanceof Error ? cause.message : "Unable to build this city.";
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
}
function build(name: string, selectedYear: number) {
  if (loading.value) return;
  if (name === username.value && selectedYear === year.value) void load();
  else void router.push(`/${name}/${selectedYear}`);
}
watch(() => route.fullPath, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());
</script>
<template>
  <main class="city-page">
    <div class="city-toolbar">
      <div>
        <RouterLink class="back-link" to="/">← Back to the overview</RouterLink>
        <h1>
          {{ data?.username || username
          }}<span class="year-title"> / {{ year }}</span>
        </h1>
        <p v-if="data">
          {{ data.totalContributions.toLocaleString() }} contributions ·
          {{ data.days.length }} days of possibility
        </p>
        <p v-else>A year of contributions, a city of your own.</p>
      </div>
      <GithubSearch
        :username="username"
        :year="year"
        :loading="loading"
        @build="build"
      />
    </div>
    <div v-if="loading" class="status-panel" role="status">
      <div class="loading-buildings"><i></i><i></i><i></i></div>
      <h2>Building city...</h2>
      <p>Gathering a year of your GitHub contributions.</p>
    </div>
    <div v-else-if="error" class="status-panel error-panel" role="alert">
      <span class="error-icon">!</span>
      <h2>We couldn’t build this city.</h2>
      <p>{{ error }}</p>
      <button class="secondary" @click="load">Try again ↗</button>
    </div>
    <template v-else-if="data"
      ><p v-if="!data.totalContributions" class="empty-notice" role="status">
        No contributions in {{ data.year }}. Your city’s
        {{ data.days.length }} empty plots are ready for a fresh start.
      </p>
      <CityViewer :data="data" />
      <div class="city-caption">
        <span>One plot per day. One floor per contribution.</span
        ><span>Share this city by copying the page URL. ↗</span>
      </div></template
    >
  </main>
</template>
