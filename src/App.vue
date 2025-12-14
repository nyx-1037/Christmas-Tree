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
  cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMjAgMjJINEMxMiAyMiAxMiAyIDEyIDJaIiBmaWxsPSIjRkY0NjQ2Ii8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iOCIgcj0iMyIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4=') 12 12, auto;
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
