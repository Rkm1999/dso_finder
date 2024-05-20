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
        :value="raInput"
        @input="updateRaInput"
        placeholder="RA (hours)"
      />
      <input
        class="styled-input"
        :class="{ dark: darkMode }"
        :value="decInput"
        @input="updateDecInput"
        placeholder="DEC (degrees)"
      />
    </div>
    <div v-else>
      <select class="styled-select" :class="{ dark: darkMode }" @change="selectObject">
        <option v-for="object in objects" :key="object.NAME" :value="object">{{ object.NAME }}</option>
      </select>
    </div>
  </div>
</template>

<script>
import ToggleButton from './ToggleButton.vue';
import objects from '../object_list/dso_list.csv';

export default {
  components: { ToggleButton },
  props: ['raInput', 'decInput', 'darkMode'],
  data() {
    return {
      inputMode: 'list',  // Default to list mode
      inputModeOptions: [
        { value: 'list', text: 'Select from List' },
        { value: 'manual', text: 'Manual Input' }
      ],
      objects: objects
    };
  },
  methods: {
    updateRaInput(event) {
      this.$emit('update:ra-input', event.target.value);
    },
    updateDecInput(event) {
      this.$emit('update:dec-input', event.target.value);
    },
    toggleInputMode(value) {
      this.inputMode = value;
    },
    selectObject(event) {
      const selectedObject = JSON.parse(event.target.value);
      this.$emit('update:ra-input', selectedObject.RA);
      this.$emit('update:dec-input', selectedObject.DEC);
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
</style>
