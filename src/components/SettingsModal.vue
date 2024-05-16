<!-- SettingsModal.vue -->
<template>
    <div class="modal-overlay" @click="closeSettingsPopup">
      <div class="modal-content" :class="{ dark: darkMode }" @click.stop>
        <button class="close-button" @click="closeSettingsPopup">×</button>
        <h2 class="heading" :class="{ dark: darkMode }">Settings</h2>
        <div class="settings-input-group">
          <label :class="{ dark: darkMode }" for="threshold">Beep Distance Threshold (degrees):</label>
          <input id="threshold" v-model.number="localBeepThreshold" type="number" class="styled-input" :class="{ dark: darkMode }">
        </div>
        <div class="settings-input-group">
          <label :class="{ dark: darkMode }" for="themeToggle">Theme:</label>
          <ToggleButton :value="localDarkMode ? 'dark' : 'light'" :options="themeOptions" :is-dark-mode="localDarkMode" @input="emitToggleTheme" />
        </div>
        <button class="styled-button" :class="{ dark: darkMode }" @click="saveSettings">Save Settings</button>
        <button class="styled-button" :class="{ dark: darkMode }" @click="clearCache">Clear Cache</button>
      </div>
    </div>
  </template>
  
  <script>
  import ToggleButton from './ToggleButton.vue';
  
  export default {
    components: { ToggleButton },
    props: ['darkMode', 'beepThreshold'],
    data() {
      return {
        localBeepThreshold: this.beepThreshold,
        localDarkMode: this.darkMode,
        themeOptions: [
          { value: 'light', text: 'Light Mode' },
          { value: 'dark', text: 'Dark Mode' }
        ]
      };
    },
    methods: {
      closeSettingsPopup() {
        this.$emit('close');
      },
      saveSettings() {
        this.$emit('save', {
          beepThreshold: this.localBeepThreshold,
          darkMode: this.localDarkMode
        });
      },
      clearCache() {
        this.$emit('clear');
      },
      emitToggleTheme(value) {
        this.localDarkMode = value === 'dark';
        this.$emit('toggle-theme', this.localDarkMode);
      }
    },
    watch: {
      darkMode(newValue) {
        this.localDarkMode = newValue;
      }
    }
  };
  </script>
  
  <style lang="scss">
  @import '../styles/main.scss';
  
  .modal-overlay {
    @extend .modal-overlay;
  }
  
  .modal-content {
    @extend .modal-content;
    margin: 20px;  // Add margin to create spacing from the sides
  }
  
  .close-button {
    @extend .close-button;
  }
  
  .styled-button {
    @include button-styles($primary-color, $primary-dark-color);
  
    &.dark {
      @include button-styles($secondary-color, $secondary-dark-color, $dark-text);
    }
  }
  
  .heading {
    &.dark {
      color: $dark-text;
    }
  }
  
  .settings-input-group {
    margin-bottom: 15px; // Add some margin between input groups
  }
  
  .styled-input {
    margin-bottom: 5px;
    width: 90%;
    padding: 5px;
    border: 2px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    box-shadow: 1px 1px 5px $shadow-color;
  
    &.dark {
      background-color: #333;
      color: $dark-text;
      border: 2px solid $dark-text;
    }
  }
  </style>
  