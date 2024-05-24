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
        :objects="planets.concat(objects)"
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
import { Observer, Equator } from 'astronomy-engine';

export default {
  components: { ToggleButton, CustomSearchableDropdown },
  props: ['raInput', 'decInput', 'darkMode', 'latitude', 'longitude'],
  data() {
    return {
      inputMode: 'list',  // Default to list mode
      inputModeOptions: [
        { value: 'list', text: 'Select from List' },
        { value: 'manual', text: 'Manual Input' }
      ],
      objects: objects,
      planets: [],
      localRaInput: this.raInput,
      localDecInput: this.decInput

    };
  },
  methods: {
    emitUpdateCoordinates() {
      this.$emit('update:ra-input', this.localRaInput);
      this.$emit('update:dec-input', this.localDecInput);
      this.$emit('update-coordinates', parseFloat(this.localRaInput), parseFloat(this.localDecInput));
    },

    async calculatePlanetPositions() {
      const planetNames = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon'];
      const now = new Date();
      const observer = new Observer(this.latitude, this.longitude, 0);

      this.planets = await Promise.all(planetNames.map(async (name) => {
        const equator = Equator(name, now, observer, true, true);
        const raHours = equator.ra;
        const raHoursPart = Math.floor(raHours);
        const raMinutesPart = ((raHours - raHoursPart) * 60).toFixed(2).padStart(5, '0');

        const decDegrees = equator.dec;
        const decDegreesPart = Math.trunc(decDegrees);
        const decMinutesPart = Math.abs(((decDegrees - decDegreesPart) * 60)).toFixed(2).padStart(5, '0');

        return {
          NAME: name,
          RA: `${raHoursPart}.${raMinutesPart}`,
          DEC: `${decDegreesPart}.${decMinutesPart}`,
          display: `${name} - RA: ${raHoursPart}.${raMinutesPart} DEC: ${decDegreesPart}.${decMinutesPart}`
        };
      }));
    },
    updateRaInput(event) {
      this.$emit('update:ra-input', event.target.value);
    },
    updateDecInput(event) {
      this.$emit('update:dec-input', event.target.value);
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
  },
  created() {
    this.calculatePlanetPositions();
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
