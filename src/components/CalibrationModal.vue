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
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;
    box-sizing: border-box;
    text-align: center;
    z-index: 1000;
    color: #aaa;
  }
  
  .modal-overlay.dark {
    color: red;
  }
  
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: none;
    font-size: 30px;
    color: #fff;
    cursor: pointer;
  }
  
  .styled-button {
    width: calc(100% - 20px);
    margin: 10px;
    padding: 10px;
    border: none;
    border-radius: 5px;
    background-color: #007BFF;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
    display: flex;
    justify-content: center;
  }
  
  .styled-button:hover {
    background-color: #0056b3;
  }
  
  .styled-button.dark {
    background-color: #4CAF50;
    color: red;
  }
  
  .styled-button.dark:hover {
    background-color: #45a049;
  }
  
  h2 {
    margin-top: 20px;
  }
  </style>
  