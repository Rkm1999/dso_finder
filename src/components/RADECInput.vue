<template>
  <div class="column full-width">
    <h2 class="heading" :class="{ dark: darkMode }">RA/DEC Input</h2>
    <ToggleButton
      :value="inputMode"
      :options="inputModeOptions"
      :is-dark-mode="darkMode"
      @input="toggleInputMode"
      class="toggle-button-spacing"
    />
    <div v-if="inputMode === 'manual'">
      <input
        class="styled-input"
        :class="{ dark: darkMode }"
        v-model="localRaInput"
        @input="emitUpdateCoordinates"
        placeholder="RA (hours)"
      />
      <input
        class="styled-input"
        :class="{ dark: darkMode }"
        v-model="localDecInput"
        @input="emitUpdateCoordinates"
        placeholder="DEC (degrees)"
      />
    </div>
    <div v-else>
      <CustomSearchableDropdown
        :objects="objects"
        :dark-mode="darkMode"
        @select="selectObject"
      />
    </div>
  </div>
</template>

<script>
import ToggleButton from './ToggleButton.vue';
import objects from '../object_list/dso_list.csv';
import CustomSearchableDropdown from './CustomSearchableDropdown.vue';

export default {
  components: { ToggleButton, CustomSearchableDropdown },
  props: ['raInput', 'decInput', 'darkMode'],
  data() {
    return {
      inputMode: 'list',  // Default to list mode
      inputModeOptions: [
        { value: 'list', text: 'Select from List' },
        { value: 'manual', text: 'Manual Input' }
      ],
      objects: objects,
      localRaInput: this.raInput,
      localDecInput: this.decInput
    };
  },
  watch: {
    raInput(newVal) {
      this.localRaInput = newVal;
    },
    decInput(newVal) {
      this.localDecInput = newVal;
    }
  },
  methods: {
    emitUpdateCoordinates() {
      this.$emit('update:ra-input', this.localRaInput);
      this.$emit('update:dec-input', this.localDecInput);
      this.$emit('update-coordinates', parseFloat(this.localRaInput), parseFloat(this.localDecInput));
    },
    toggleInputMode(value) {
      this.inputMode = value;
    },
    selectObject(selectedObject) {
      if (selectedObject) {
        this.localRaInput = selectedObject.RA;
        this.localDecInput = selectedObject.DEC;
        this.emitUpdateCoordinates();
      }
    }
  }
};
</script>

<style lang="scss">
@import '../styles/main.scss';

.column {
  @include column-styles;
}

.styled-input,
.styled-select {
  @include input-styles;

  &.dark {
    background-color: #333;
    color: $dark-text;
    border: 2px solid $dark-text;
  }
}

.toggle-button-spacing {
  margin-bottom: 20px;
}

.styled-select {
  width: 80vw;  /* Set the width to 80% of the viewport */
  margin: 0 auto;  /* Center the select element */
}
</style>
