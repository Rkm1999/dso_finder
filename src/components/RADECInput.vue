<template>
  <div class="column full-width">
    <h2 class="heading" :class="{ dark: darkMode }">RA/DEC Input</h2>
    <ToggleButton
      :value="inputMode"
      :options="modeOptions"
      :is-dark-mode="darkMode"
      @input="toggleInputMode"
    />
    <div class="input-container">
      <div v-if="inputMode === 'list'">
        <SearchableDropdown
          :dark-mode="darkMode"
          :target-list="targetList"
          @update="updateFromList"
        />
      </div>
      <div v-if="inputMode === 'manual'">
        <input class="styled-input" :class="{ dark: darkMode }" :value="raInput" @input="updateRaInput" placeholder="RA (hours)">
        <input class="styled-input" :class="{ dark: darkMode }" :value="decInput" @input="updateDecInput" placeholder="DEC (degrees)">
      </div>
    </div>
  </div>
</template>

<script>
import ToggleButton from './ToggleButton.vue';
import SearchableDropdown from './SearchableDropdown.vue';
import Papa from 'papaparse';
import dsoList from '../dso_list.csv';

export default {
  components: {
    ToggleButton,
    SearchableDropdown,
  },
  props: ['raInput', 'decInput', 'darkMode'],
  data() {
    return {
      inputMode: 'list', // Set default to 'list'
      modeOptions: [
        { value: 'list', text: 'Select from List' },
        { value: 'manual', text: 'Manual Input' },
      ],
      selectedTarget: null,
      targetList: [],
    };
  },
  methods: {
    toggleInputMode(value) {
      this.inputMode = value;
      this.resetInputs();
    },
    updateRaInput(event) {
      this.$emit('update:ra-input', event.target.value);
    },
    updateDecInput(event) {
      this.$emit('update:dec-input', event.target.value);
    },
    updateFromList(target) {
      this.$emit('update:ra-input', target.ra);
      this.$emit('update:dec-input', target.dec);
    },
    resetInputs() {
      this.$emit('update:ra-input', '');
      this.$emit('update:dec-input', '');
      this.selectedTarget = null;
    },
    fetchTargetList() {
      Papa.parse(dsoList, {
        header: true,
        complete: (results) => {
          this.targetList = results.data.map(row => ({
            name: row.NAME,
            ra: this.convertRA(row.RA),
            dec: this.convertDEC(row.DEC),
          }));
        },
      });
    },
    convertRA(ra) {
      const parts = ra.split(' ');
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1]) / 60;
      return (hours + minutes).toFixed(2);
    },
    convertDEC(dec) {
      const parts = dec.split(' ');
      const degrees = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1]) / 60;
      return (degrees + minutes).toFixed(2);
    },
  },
  created() {
    this.fetchTargetList();
  }
};
</script>

<style scoped lang="scss">
@import '../styles/main.scss';

.column {
  @include column-styles;
}

.styled-input {
  @include input-styles;
}

.input-container {
  margin-top: 10px; /* Add margin to create spacing */
  display: flex;
  flex-direction: column; /* Change to column direction */
}
</style>
