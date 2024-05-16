<!-- AltAzDisplay.vue -->
<template>
    <div class="column">
      <h2>Alt/AZ</h2>
      <div>Alt: {{ altitude.toFixed(2) }}</div>
      <div>Az: {{ azimuth.toFixed(2) }}</div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['altitude', 'azimuth']
  };
  </script>
  
  <style scoped lang="scss">
  @import '../styles/main.scss';
  
  .column {
    @include column-styles;
  }
  </style>
  