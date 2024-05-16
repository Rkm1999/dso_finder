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
  
  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  h2 {
    margin: 10px 0;
  }
  
  .angular-distance {
    margin: 10px 0;
  }
  </style>
  