<template>
    <div class="dropdown">
      <button @click="toggleDropdown" class="dropdown-button" :class="{ dark: darkMode }">
        {{ selectedTarget ? selectedTarget.name : 'Select a Target' }}
        <span :class="{ rotated: isOpen }">&#9662;</span>
      </button>
      <div v-if="isOpen" class="dropdown-content" :class="{ dark: darkMode }">
        <input type="text" v-model="searchQuery" class="search-input" :class="{ dark: darkMode }" placeholder="Search" />
        <div class="options-list">
          <div
            v-for="target in filteredTargetList"
            :key="target.name"
            class="dropdown-item"
            @click="selectTarget(target)"
          >
            {{ target.name }} (RA: {{ target.ra }}, DEC: {{ target.dec }})
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { Body, Equator, MakeTime, Observer } from 'astronomy-engine';
  
  export default {
    props: ['darkMode', 'targetList'],
    data() {
      return {
        searchQuery: '',
        selectedTarget: null,
        isOpen: false,
        planetList: [],
        lastUpdate: null,
        latitude: 0,
        longitude: 0,
      };
    },
    computed: {
      filteredTargetList() {
        return this.completeTargetList.filter(target => {
          const query = this.searchQuery.toLowerCase();
          return target.name.toLowerCase().includes(query) ||
                 target.ra.toLowerCase().includes(query) ||
                 target.dec.toLowerCase().includes(query);
        }).filter(target => target.altitude > 0);
      },
      completeTargetList() {
        return [...this.targetList, ...this.planetList];
      }
    },
    methods: {
      toggleDropdown() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          const now = new Date();
          if (!this.lastUpdate || (now - this.lastUpdate) > 900000) { // 15 minutes in milliseconds
            this.updateCoordinates();
            this.lastUpdate = now;
          }
        }
      },
      selectTarget(target) {
        this.selectedTarget = target;
        this.$emit('update', this.selectedTarget);
        this.isOpen = false; // Close the dropdown after selection
      },
      updateCoordinates() {
        this.calculatePlanetsCoordinates();
        this.calculateTargetsAltitudes();
      },
      calculatePlanetsCoordinates() {
        const now = new Date();
        const observer = new Observer(this.$root.latitude, this.$root.longitude, 0);
        const time = MakeTime(now);
  
        const planets = [
          { name: 'Mercury', body: Body.Mercury },
          { name: 'Venus', body: Body.Venus },
          { name: 'Mars', body: Body.Mars },
          { name: 'Jupiter', body: Body.Jupiter },
          { name: 'Saturn', body: Body.Saturn },
          { name: 'Uranus', body: Body.Uranus },
          { name: 'Neptune', body: Body.Neptune }
        ];
  
        this.planetList = planets.map(planet => {
          const equator = Equator(planet.body, time, observer, true, true);
          // eslint-disable-next-line
          const [_azimuth, altitude] = this.raDecToAltAz(
            equator.ra * Math.PI / 12,
            equator.dec * Math.PI / 180,
            this.$root.latitude * Math.PI / 180,
            this.$root.longitude * Math.PI / 180,
            this.dateToJulianDate(now)
          );
  
          if (altitude > 0) {
            return {
              name: planet.name,
              ra: equator.ra.toFixed(2),
              dec: equator.dec.toFixed(2),
              altitude
            };
          }
          return null;
        }).filter(planet => planet !== null);
      },
      calculateTargetsAltitudes() {
        const now = new Date();
        const jd_ut = this.dateToJulianDate(now);
        this.targetList.forEach(target => {
          const ra = parseFloat(target.ra) * (Math.PI / 12); // convert hours to radians
          const dec = parseFloat(target.dec) * (Math.PI / 180); // convert degrees to radians
          // eslint-disable-next-line
          const [_azimuth, altitude] = this.raDecToAltAz(
            ra, dec,
            this.$root.latitude * Math.PI / 180,
            this.$root.longitude * Math.PI / 180,
            jd_ut
          );
          target.altitude = altitude;
        });
      },
      raDecToAltAz(ra, dec, lat, lon, jd_ut) {
        const gmst = this.greenwichMeanSiderealTime(jd_ut);
        let localSiderealTime = (gmst + lon) % (2 * Math.PI);
        let H = (localSiderealTime - ra + Math.PI) % (2 * Math.PI) - Math.PI;
        let az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) + Math.PI;
        let alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
        return [az % (2 * Math.PI), alt];
      },
      dateToJulianDate(date) {
        return date.valueOf() / 86400000 + 2440587.5;
      },
      greenwichMeanSiderealTime(jd) {
        const t = (jd - 2451545.0) / 36525.0;
        let gmst = this.earthRotationAngle(jd) + (0.014506 + 4612.156534 * t + 1.3915817 * t * t - 0.00000044 * t * t * t - 0.000029956 * t * t * t * t - 0.0000000368 * t * t * t * t * t) * Math.PI / 648000;
        return (gmst % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      },
      earthRotationAngle(jd) {
        const t = jd - 2451545.0;
        let theta = 2 * Math.PI * ((jd % 1.0) + 0.7790572732640 + 0.00273781191135448 * t);
        return (theta % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      },
    },
    created() {
      this.latitude = this.$root.latitude;
      this.longitude = this.$root.longitude;
    }
  };
  </script>
  
  <style scoped lang="scss">
  @import '../styles/main.scss';
  
  .dropdown {
    position: relative;
    display: inline-block;
    width: 80vw;
  
    .dropdown-button {
      width: 100%;
      padding: 10px;
      border: 2px solid #ccc;
      border-radius: 5px;
      background-color: #fff;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 1px 1px 5px $shadow-color;
      display: flex;
      justify-content: space-between;
      align-items: center;
  
      &.dark {
        background-color: #333;
        color: $dark-text;
        border: 2px solid $dark-text;
      }
  
      span {
        transition: transform 0.3s ease;
      }
  
      span.rotated {
        transform: rotate(180deg);
      }
    }
  
    .dropdown-content {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1;
      border: 1px solid #ccc;
      border-top: none;
      background-color: #fff;
      box-shadow: 1px 1px 5px $shadow-color;
      max-height: 200px;
      overflow-y: auto;
  
      &.dark {
        background-color: #333;
        color: $dark-text;
        border: 2px solid $dark-text;
      }
  
      .search-input {
        width: 100%;
        padding: 5px;
        border: none;
        border-bottom: 1px solid #ccc;
        font-size: 16px;
        box-shadow: none;
  
        &.dark {
          background-color: #333;
          color: $dark-text;
          border-bottom: 1px solid $dark-text;
        }
      }
  
      .options-list {
        width: 100%;
      }
  
      .dropdown-item {
        padding: 10px;
        cursor: pointer;
        &:hover {
          background-color: #f1f1f1;
        }
  
        &.dark:hover {
          background-color: #555;
        }
      }
    }
  }
  </style>
  