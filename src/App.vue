<script setup lang="ts">
import ChristmasTree from './components/ChristmasTree.vue';
</script>

<template>
  <ChristmasTree />
</template>

<style>
/* Global Styles */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #0a0a1a;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 32 32'><path d='M16 2 L26 22 H6 Z' fill='%23D42426'/><circle cx='16' cy='8' r='4' fill='white'/><rect x='4' y='20' width='24' height='6' rx='2' fill='white'/></svg>") 16 16, auto;
}

a,
button {
  cursor: pointer !important;
}

#app {
  width: 100vw;
  height: 100vh;
}
</style>
