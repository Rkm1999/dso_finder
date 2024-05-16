<!-- RADECInput.vue -->
<template>
    <div class="column full-width">
      <h2 class="heading" :class="{ dark: darkMode }">RA/DEC Input</h2>
      <input class="styled-input" :class="{ dark: darkMode }" :value="raInput" @input="updateRaInput" placeholder="RA (hours)">
      <input class="styled-input" :class="{ dark: darkMode }" :value="decInput" @input="updateDecInput" placeholder="DEC (degrees)">
    </div>
  </template>
  
  <script>
  export default {
    props: ['raInput', 'decInput', 'darkMode'],
    methods: {
      updateRaInput(event) {
        this.$emit('update:ra-input', event.target.value);
      },
      updateDecInput(event) {
        this.$emit('update:dec-input', event.target.value);
      }
    }
  };
  </script>
  
  <style lang="scss">
  @import '../styles/main.scss';
  
  .column {
    @include column-styles;
  }
  
  .styled-input {
    @include input-styles;
  
    &.dark {
      background-color: #333;
      color: $dark-text;
      border: 2px solid $dark-text;
    }
  }
  </style>
  