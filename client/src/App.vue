<template>
  <header class="header">
    <RouterLink class="brand" to="/" aria-label="GitHub City home"
      ><span class="brand-icon">▥</span> GitHub City<span class="version"
        >BETA</span
      ></RouterLink
    ><a
      class="github-link"
      href="https://github.com"
      target="_blank"
      rel="noreferrer"
      >Built on your contributions <span>↗</span></a
    >
  </header>
  <RouterView />
  <footer class="footer">
    <span>A little code. A little progress. A city of your own.</span
    ><span>365 days. Endless possibilities.</span>
  </footer>
</template>
