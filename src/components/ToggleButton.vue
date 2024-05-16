<!-- ToggleButton.vue -->
<template>
    <div class="toggle-button" :class="{ dark: isDarkMode }">
      <button
        v-for="option in options"
        :key="option.value"
        @click="$emit('input', option.value)"
        :class="{
          active: value === option.value,
          inactive: value !== option.value,
          dark: isDarkMode,
        }"
      >
        {{ option.text }}
      </button>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      value: String,
      options: Array,
      isDarkMode: Boolean,
    },
  };
  </script>
  
  <style scoped lang="scss">
  @import '../styles/main.scss';
  
  .toggle-button {
    @extend .toggle-button;
  }
  </style>
  