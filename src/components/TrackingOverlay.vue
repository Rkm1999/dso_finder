<!-- TrackingOverlay.vue -->
<template>
    <div :class="['modal-overlay', { dark: darkMode }]" @click="closeTrackingOverlay">
      <button class="close-button" @click.stop="closeTrackingOverlay">×</button>
      <div class="content">
        <h2>Tracking Target</h2>
        <p class="angular-distance">Angular Distance: {{ angularDistance.toFixed(2) }} degrees</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['angularDistance', 'darkMode'],
    methods: {
      closeTrackingOverlay() {
        this.$emit('close');
      }
    }
  };
  </script>
  
  <style lang="scss">
  @import '../styles/main.scss';
  </style>
  