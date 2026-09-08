<script setup lang="ts">
import type { ContributionDay } from "../../../shared/github";
defineProps<{ day: ContributionDay }>();
const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
</script>
<template>
  <div class="day-detail">
    <span>{{ formatDate(day.date) }}</span
    ><strong
      >{{ day.contributions.toLocaleString() }}
      {{ day.contributions === 1 ? "contribution" : "contributions" }}</strong
    ><small>{{
      day.contributions
        ? `${day.contributions} floors · Week ${day.week + 1}`
        : "An empty plot · A little room to grow"
    }}</small>
  </div>
</template>
