<!-- CalibrationTracking.vue -->
<template>
  <div class="column full-width">
    <h2 class="heading" :class="{ dark: darkMode }">Calibration and Tracking</h2>
    <div class="row">
      <button class="styled-button" :class="{ dark: darkMode }" @click="handleCalibration">Calibrate Gyro</button>
      <button class="styled-button" :class="{ dark: darkMode }" @click="handleTracking">Track Target</button>
    </div>
  </div>
</template>

<script>
export default {
  props: ['darkMode', 'raInput', 'decInput'],
  methods: {
    handleCalibration() {
      if (this.validateInputs()) {
        this.$emit('openCalibrationPopup');
      } else {
        alert('Please provide valid RA and DEC values.');
      }
    },
    handleTracking() {
      if (this.validateInputs()) {
        this.$emit('startTracking');
      } else {
        alert('Please provide valid RA and DEC values.');
      }
    },
    validateInputs() {
      return this.raInput !== '' && this.decInput !== '';
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
