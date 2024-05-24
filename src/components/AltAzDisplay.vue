<!-- AltAzDisplay.vue -->
<template>
  <div class="altaz-display">
    <h2 :class="{ dark: darkMode }">{{ displayLabel }}</h2>
    <p :class="{ dark: darkMode }">Alt: {{ formattedAltitude }}</p>
    <p :class="{ dark: darkMode }">Az: {{ formattedAzimuth }}</p>
  </div>
</template>

<script>
export default {
  props: {
    altitude: {
      type: Number,
      required: true
    },
    azimuth: {
      type: Number,
      required: true
    },
    label: {
      type: String,
      default: 'Alt/Az'
    },
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    formattedAltitude() {
      return this.altitude.toFixed(2);
    },
    formattedAzimuth() {
      return this.azimuth.toFixed(2);
    },
    displayLabel() {
      return this.label || 'Alt/Az';
    }
  }
};
</script>

<style scoped lang="scss">
.altaz-display {
  text-align: center;
  margin: 10px;
}

.dark {
  color: #fff;
}

p {
  margin: 5px 0;
}

.dark p {
  color: #fff;
}
</style>
