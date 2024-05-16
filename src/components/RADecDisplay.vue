<!-- RADecDisplay.vue -->
<template>
    <div class="column">
      <h2>RA/DEC</h2>
      <div v-if="results">
        <div>RA: {{ results.j2000_ra.toFixed(2) }}</div>
        <div>DEC: {{ results.j2000_dec.toFixed(2) }}</div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['results']
  };
  </script>
  
  <style lang="scss">
  @import '../styles/main.scss';
  
  .column {
    @include column-styles;
  }
  </style>
  