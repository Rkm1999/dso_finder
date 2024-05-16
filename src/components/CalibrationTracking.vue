<!-- CalibrationTracking.vue -->
<template>
    <div class="column full-width">
      <h2 class="heading" :class="{ dark: darkMode }">Calibration and Tracking</h2>
      <div class="row">
        <button class="styled-button" :class="{ dark: darkMode }" @click="openCalibrationPopup">Calibrate Gyro</button>
        <button class="styled-button" :class="{ dark: darkMode }" @click="startTracking">Track Target</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['darkMode'],
    methods: {
      openCalibrationPopup() {
        this.$emit('openCalibrationPopup');
      },
      startTracking() {
        this.$emit('startTracking');
      }
    }
  };
  </script>
  
  <style lang="scss">
  @import '../styles/main.scss';
  
  .column {
    @include column-styles;
  }
  
  .row {
    display: flex;
    justify-content: space-around;
    width: 100%;
  }
  
  .styled-button {
    @include button-styles($primary-color, $primary-dark-color);
  
    &.dark {
      @include button-styles($secondary-color, $secondary-dark-color, $dark-text);
    }
  }
  </style>
  