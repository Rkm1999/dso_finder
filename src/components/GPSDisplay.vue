<!-- GPSDisplay.vue -->
<template>
    <div class="column">
      <h2>Coordinate</h2>
      <div>{{ latitude.toFixed(2) }}, {{ longitude.toFixed(2) }}</div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['latitude', 'longitude']
  };
  </script>
  
  <style scoped lang="scss">
  @import '../styles/main.scss';
  
  .column {
    @include column-styles;
  }
  </style>
  