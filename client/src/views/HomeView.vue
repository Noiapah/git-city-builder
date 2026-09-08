<script setup lang="ts">
import { useRouter } from "vue-router";
import GithubSearch from "../components/GithubSearch.vue";
import CityViewer from "../components/CityViewer.vue";
import { sampleCity } from "../services/sample";
const router = useRouter();
const sample = sampleCity();
function build(username: string, year: number) {
  router.push(`/${username}/${year}`);
}
</script>
<template>
  <main class="home">
    <section class="hero">
      <div class="eyebrow">
        <span class="live-dot"></span> YOUR CODE HAS A SKYLINE
      </div>
      <h1>GitHub <em>City</em></h1>
      <p>
        Turn your GitHub contributions into a 3D city.<br />Every day a plot.
        Every contribution a new floor.
      </p>
      <GithubSearch @build="build" />
      <div class="search-note">
        Just a username. No token or sign-in needed.
      </div>
    </section>
    <CityViewer :data="sample" sample />
    <section class="how-it-works">
      <div class="section-intro">
        <span class="eyebrow">FROM COMMITS TO CITY BLOCKS</span>
        <h2>Small contributions.<br />A bigger picture.</h2>
      </div>
      <div class="concept">
        <span class="concept-icon">▦</span>
        <div>
          <h3>One day, one plot</h3>
          <p>
            Your contribution calendar becomes<br />the blueprint for your city.
          </p>
        </div>
      </div>
      <div class="concept">
        <span class="concept-icon">▥</span>
        <div>
          <h3>Every contribution counts</h3>
          <p>
            One contribution adds one floor.<br />Watch your busiest days stand
            tall.
          </p>
        </div>
      </div>
      <div class="concept">
        <span class="concept-icon">⌘</span>
        <div>
          <h3>A new perspective</h3>
          <p>
            Explore, rotate, and look closer.<br />There’s a story in every
            building.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
