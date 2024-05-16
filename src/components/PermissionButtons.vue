<!-- PremissionButtons.vue -->
<template>
  <div class="row">
    <button class="styled-button" :class="{ dark: darkMode }" @click="requestGPSPermission">Request GPS Permission</button>
    <button class="styled-button" :class="{ dark: darkMode }" @click="requestOrientationPermission">Request Gyro Permission</button>
  </div>
</template>

<script>
export default {
  props: ['darkMode'],
  methods: {
    requestGPSPermission() {
      this.$emit('gps-permission-granted');
    },
    requestOrientationPermission() {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ devices
        DeviceMotionEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              this.$emit('gyro-permission-granted');
            } else {
              alert('Gyroscope permission denied');
            }
          })
          .catch(console.error);
      } else {
        // Non iOS 13+ devices
        this.$emit('gyro-permission-granted');
      }
    }
  }
};
</script>

<style lang="scss">
@import '../styles/main.scss';

.row {
  display: flex;
  justify-content: space-between;
  width: 100%; /* Ensure full width for buttons to distribute evenly */
  margin-bottom: 0px;
}

.styled-button {
  @include button-styles($primary-color, $primary-dark-color);

  &.dark {
    @include button-styles($secondary-color, $secondary-dark-color, $dark-text);
  }

  width: 48%; /* Ensure the buttons fit side by side */
}
</style>
