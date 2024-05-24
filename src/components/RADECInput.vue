<!-- RADECInput.vue -->
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
      <CustomTabs :darkMode="darkMode">
        <CustomTab title="Planets">
          <CustomSearchableDropdown
            :objects="planets"
            :dark-mode="darkMode"
            @select="selectObject"
          />
        </CustomTab>
        <CustomTab title="DSOs">
          <CustomSearchableDropdown
            :objects="dso"
            :dark-mode="darkMode"
            @select="selectObject"
          />
        </CustomTab>
        <CustomTab title="Align Stars">
          <CustomSearchableDropdown
            :objects="align"
            :dark-mode="darkMode"
            @select="selectObject"
          />
        </CustomTab>

      </CustomTabs>
    </div>
  </div>
</template>

<script>
import ToggleButton from './ToggleButton.vue';
import dso from '../object_list/dso_list.csv';
import align from '../object_list/AlignmentStarList.csv';
import CustomSearchableDropdown from './CustomSearchableDropdown.vue';
import CustomTabs from './CustomTabs.vue';
import CustomTab from './CustomTab.vue';
import { Observer, Equator } from 'astronomy-engine';

export default {
  components: { ToggleButton, CustomSearchableDropdown, CustomTabs, CustomTab },
  props: ['raInput', 'decInput', 'darkMode', 'latitude', 'longitude'],
  data() {
    return {
      inputMode: 'list',  // Default to list mode
      inputModeOptions: [
        { value: 'list', text: 'Select from List' },
        { value: 'manual', text: 'Manual Input' }
      ],
      dso: dso,
      align: align,
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
        const hours = Math.floor(raHours);
        const minutes = ((raHours - hours) * 60).toFixed(2).padStart(5, '0'); // Ensure minutes are always two digits

        const decDegrees = equator.dec;
        const decDegreesInteger = Math.trunc(decDegrees);
        const decMinutes = ((Math.abs(decDegrees) - Math.abs(decDegreesInteger)) * 60).toFixed(2).padStart(5, '0'); // Ensure minutes are always two digits

        return {
          NAME: name,
          RA: `${hours}.${minutes}`,
          DEC: `${decDegreesInteger}.${decMinutes}`,
          display: `${name} - RA: ${hours}.${minutes} DEC: ${decDegreesInteger}.${decMinutes}`
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
