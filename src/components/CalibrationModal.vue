<!-- CalibrationModal.vue -->
<template>
    <div :class="['modal-overlay', { dark: darkMode }]" @click="handleOverlayClick">
      <button class="close-button" @click.stop="closeModal">×</button>
      <h2 v-if="!isCalibrating && !calibrationResult">Tap anywhere to calibrate the gyro.</h2>
      <div v-if="calibrationResult && !isCalibrating">
        <h2>Calibration Results</h2>
        <p>
          Expected AZ: {{ calibrationResult.expectedAzimuth.toFixed(2) }}<br>
          Expected ALT: {{ calibrationResult.expectedAltitude.toFixed(2) }}<br>
          Actual AZ: {{ calibrationResult.actualAzimuth.toFixed(2) }}<br>
          Actual ALT: {{ calibrationResult.actualAltitude.toFixed(2) }}<br>
          AZ Correction: {{ calibrationResult.azimuthCorrection.toFixed(2) }}<br>
          ALT Correction: {{ calibrationResult.altitudeCorrection.toFixed(2) }}
        </p>
        <button class="styled-button" :class="{ dark: darkMode }" @click.stop="recalibrate">Recalibrate</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['calibrationResult', 'darkMode'],
    data() {
      return {
        isCalibrating: false
      };
    },
    methods: {
      closeModal() {
        this.isCalibrating = false;
        this.$emit('close');
      },
      handleOverlayClick() {
        if (!this.isCalibrating && !this.calibrationResult) {
          this.isCalibrating = true;
          this.$emit('initiate');
        }
      },
      recalibrate() {
        this.isCalibrating = false;
        this.$emit('recalibrate');
      }
    },
    watch: {
      calibrationResult() {
        this.isCalibrating = false;
      }
    }
  };
  </script>
  
  <style lang="scss">
  @import '../styles/main.scss';
  </style>
  