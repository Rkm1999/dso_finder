<!-- LocalTimeDisplay.vue -->
<template>
    <div class="column">
      <h2>Local Time</h2>
      <div>{{ localTime }}</div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['localTime']
  };
  </script>
  
  <style scoped lang="scss">
  @import '../styles/main.scss';
  
  .column {
    @include column-styles;
  }
  </style>
  