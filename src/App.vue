<!-- App.vue -->
<template>
  <div id="app" :class="[theme]">
    <div class="content-container">
      <div class="row">
        <GPSDisplay :latitude="latitude" :longitude="longitude" />
        <LocalTimeDisplay :local-time="localTime" />
      </div>

      <div class="row">
        <AltAzDisplay :altitude="altitude" :azimuth="azimuth" />
        <RADecDisplay :results="results" />
      </div>

      <PermissionButtons
        @gps-permission-granted="getCurrentPosition"
        @gyro-permission-granted="getDeviceOrientation"
        :dark-mode="darkMode"
      />

      <div class="row">
        <RADECInput v-model:ra-input="raInput" v-model:dec-input="decInput" :dark-mode="darkMode" />
      </div>

      <CalibrationTracking :dark-mode="darkMode" @openCalibrationPopup="openCalibrationPopup" @startTracking="startTracking" />
    </div>

    <div class="settings-button-container">
      <button class="styled-button" :class="{ dark: darkMode }" @click="openSettingsPopup">Settings</button>
    </div>

    <SettingsModal
      v-if="showSettingsPopup"
      :dark-mode="darkMode"
      :beep-threshold="beepThreshold"
      @close="closeSettingsPopup"
      @save="saveSettings"
      @clear="clearCache"
      @toggle-theme="toggleTheme"
    />

    <CalibrationModal
      v-if="showCalibrationPopup"
      :calibration-result="calibrationResult"
      :dark-mode="darkMode"
      @close="closeModal"
      @initiate="initiateCalibration"
      @recalibrate="resetCalibration"
    />

    <TrackingOverlay
      v-if="showTrackingOverlay"
      :angular-distance="angularDistance"
      :dark-mode="darkMode"
      @close="closeTrackingOverlay"
    />
  </div>
</template>

<script>
import { Geolocation } from '@capacitor/geolocation';
import {
  Observer,
  MakeTime,
  Spherical,
  VectorFromHorizon,
  Rotation_HOR_EQJ,
  RotateVector,
  EquatorFromVector,
  AngleBetween
} from 'astronomy-engine';
import GPSDisplay from './components/GPSDisplay.vue';
import LocalTimeDisplay from './components/LocalTimeDisplay.vue';
import AltAzDisplay from './components/AltAzDisplay.vue';
import RADecDisplay from './components/RADecDisplay.vue';
import RADECInput from './components/RADECInput.vue';
import PermissionButtons from './components/PermissionButtons.vue';
import CalibrationTracking from './components/CalibrationTracking.vue';
import SettingsModal from './components/SettingsModal.vue';
import CalibrationModal from './components/CalibrationModal.vue';
import TrackingOverlay from './components/TrackingOverlay.vue';

export default {
  components: {
    GPSDisplay,
    LocalTimeDisplay,
    AltAzDisplay,
    RADecDisplay,
    RADECInput,
    PermissionButtons,
    CalibrationTracking,
    SettingsModal,
    CalibrationModal,
    TrackingOverlay,
  },
  data() {
    return {
      latitude: 0,
      longitude: 0,
      rawAzimuth: 0,
      rawAltitude: 0,
      azimuth: 0,
      altitude: 0,
      localTime: '',
      results: null,
      calibrationResult: null,
      azimuthOffset: 0,
      altitudeOffset: 0,
      angularDistance: null,
      angularDistanceIntervalId: null,
      audioContext: null,
      oscillator: null,
      isBeeping: false,
      raInput: '',
      decInput: '',
      showCalibrationPopup: false,
      showTrackingOverlay: false,
      showSettingsPopup: false,
      setting1: '',
      setting2: '',
      darkMode: false,
      beepThreshold: 2,
    };
  },
  computed: {
    theme() {
      return this.darkMode ? 'dark' : 'light';
    }
  },
  methods: {
    async getCurrentPosition() {
      try {
        const coordinates = await Geolocation.getCurrentPosition();
        this.latitude = coordinates.coords.latitude;
        this.longitude = coordinates.coords.longitude;
      } catch (error) {
        console.error('Error getting GPS position:', error);
      }
    },
    updateLocalTime() {
      this.localTime = new Date().toLocaleString('en-US', { hour12: false }).replace(',', '');
    },
    getDeviceOrientation() {
      this.handleOrientation = this.handleOrientation.bind(this);
      window.addEventListener("deviceorientation", this.handleOrientation, true);
      console.log("Listener for device orientation added.");
    },
    handleOrientation(event) {
      if (event.absolute) {
        console.log("Got absolute orientation.");
      } else {
        console.log("Orientation not absolute.");
      }
      let rawAltitude = event.beta;
      let rawAzimuth = event.alpha;
      if (rawAzimuth !== null) {
        rawAzimuth = 360 - rawAzimuth;
        this.rawAltitude = rawAltitude;
        this.rawAzimuth = rawAzimuth;
        this.applyCalibration(rawAltitude, rawAzimuth);
      } else {
        console.log("Orientation data not available.");
      }
    },
    applyCalibration(rawAltitude, rawAzimuth) {
      let adjustedAltitude = rawAltitude + this.altitudeOffset;
      let calibratedAzimuth = (rawAzimuth + this.azimuthOffset + 360) % 360;
      if (adjustedAltitude > 90) {
        adjustedAltitude = 180 - adjustedAltitude;
      } else if (adjustedAltitude < -90) {
        adjustedAltitude = -180 - adjustedAltitude;
      }
      this.altitude = adjustedAltitude;
      this.azimuth = calibratedAzimuth;
      console.log(`Calibrated Azimuth: ${calibratedAzimuth}, Calibrated Altitude: ${adjustedAltitude}`);
    },
    calculateCoordinates() {
      this.updateLocalTime();
      this.getCurrentPosition().then(() => {
        const observer = new Observer(this.latitude, this.longitude, 0);
        let time = MakeTime(new Date(this.localTime));
        const correctedAzimuth = this.azimuth;
        const correctedAltitude = this.altitude;
        if (time) {
          const result = this.solveCoordinates(observer, time, correctedAzimuth, correctedAltitude);
          this.results = { j2000_ra: result.ra, j2000_dec: result.dec };
        }
      });
    },
    solveCoordinates(observer, time, azimuth, altitude, refract = false) {
      const hor_sphere = new Spherical(altitude, azimuth, 1);
      const hor_vec = VectorFromHorizon(hor_sphere, time, refract ? 'normal' : null);
      const eqj_vec = RotateVector(Rotation_HOR_EQJ(time, observer), hor_vec);
      return EquatorFromVector(eqj_vec);
    },
    async performCalibration() {
      if (!this.isCalibrating) {
        this.isCalibrating = true;
        const jd_ut = this.dateToJulianDate(new Date(this.localTime));
        const ra = parseFloat(this.raInput) * Math.PI / 12;
        const dec = parseFloat(this.decInput) * Math.PI / 180;
        const [expectedAzimuth, expectedAltitude] = this.raDecToAltAz(ra, dec, this.latitude * Math.PI / 180, this.longitude * Math.PI / 180, jd_ut);
        const azimuthCorrection = (expectedAzimuth * 180 / Math.PI - this.rawAzimuth + 360) % 360;
        const altitudeCorrection = expectedAltitude * 180 / Math.PI - this.rawAltitude;
        this.azimuthOffset = azimuthCorrection;
        this.altitudeOffset = altitudeCorrection;
        this.calibrationResult = {
          expectedAzimuth: expectedAzimuth * 180 / Math.PI,
          expectedAltitude: expectedAltitude * 180 / Math.PI,
          actualAzimuth: this.rawAzimuth,
          actualAltitude: this.rawAltitude,
          azimuthCorrection: azimuthCorrection,
          altitudeCorrection: altitudeCorrection
        };
        this.isCalibrating = false;
      }
    },
    resetCalibration() {
      this.calibrationResult = null;
      this.showCalibrationPopup = false;
      this.$nextTick(() => {
        this.showCalibrationPopup = true;
      });
    },
    dateToJulianDate(date) {
      return date.valueOf() / 86400000 + 2440587.5;
    },
    raDecToAltAz(ra, dec, lat, lon, jd_ut) {
      const gmst = this.greenwichMeanSiderealTime(jd_ut);
      let localSiderealTime = (gmst + lon) % (2 * Math.PI);
      let H = (localSiderealTime - ra + Math.PI) % (2 * Math.PI) - Math.PI;
      let az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) + Math.PI;
      let alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
      return [az % (2 * Math.PI), alt];
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
    startCalculatingDistance() {
      if (this.angularDistanceIntervalId !== null) {
        clearInterval(this.angularDistanceIntervalId);
      }
      this.calculateAngularDistance();
      this.angularDistanceIntervalId = setInterval(() => {
        this.calculateAngularDistance();
      }, 50);
    },
    stopCalculatingDistance() {
      if (this.angularDistanceIntervalId !== null) {
        clearInterval(this.angularDistanceIntervalId);
        this.angularDistanceIntervalId = null;
      }
    },
    calculateAngularDistance() {
      const jd_ut = this.dateToJulianDate(new Date(this.localTime));
      const observerLatRadians = this.latitude * Math.PI / 180;
      const observerLonRadians = this.longitude * Math.PI / 180;
      const targetRaRadians = parseFloat(this.raInput) * Math.PI / 12;
      const targetDecRadians = parseFloat(this.decInput) * Math.PI / 180;
      const [targetAzimuth, targetAltitude] = this.raDecToAltAz(targetRaRadians, targetDecRadians, observerLatRadians, observerLonRadians, jd_ut);
      const pointingAzimuthRadians = this.azimuth * Math.PI / 180;
      const pointingAltitudeRadians = this.altitude * Math.PI / 180;
      const pointingVector = VectorFromHorizon(new Spherical(pointingAltitudeRadians, pointingAzimuthRadians, 1), new Date(this.localTime), null);
      const targetVector = VectorFromHorizon(new Spherical(targetAltitude, targetAzimuth, 1), new Date(this.localTime), null);
      let vectorDistance = AngleBetween(pointingVector, targetVector) * 180 / Math.PI;
      this.angularDistance = vectorDistance > 180 ? 360 - vectorDistance : vectorDistance;
      if (this.angularDistance < this.beepThreshold) {
        this.startBeep();
      } else {
        this.stopBeep();
      }
    },
    startBeep() {
      if (!this.isBeeping) {
        this.isBeeping = true;
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
        }
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        this.oscillator.connect(this.audioContext.destination);
        this.oscillator.start();
      }
    },
    stopBeep() {
      if (this.isBeeping) {
        this.isBeeping = false;
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
        }
      }
    },
    openCalibrationPopup() {
      this.calibrationResult = null;
      this.showCalibrationPopup = true;
    },
    closeModal() {
      this.showCalibrationPopup = false;
    },
    initiateCalibration() {
      this.performCalibration();
    },
    startTracking() {
      this.calculateAngularDistance();
      this.angularDistanceIntervalId = setInterval(() => {
        this.calculateAngularDistance();
      }, 50);
      this.showTrackingOverlay = true;
    },
    stopTracking() {
      clearInterval(this.angularDistanceIntervalId);
      this.angularDistanceIntervalId = null;
      this.stopBeep();
      this.showTrackingOverlay = false;
    },
    closeTrackingOverlay() {
      this.showTrackingOverlay = false;
      this.stopTracking();
    },
    openSettingsPopup() {
      this.showSettingsPopup = true;
    },
    closeSettingsPopup() {
      this.showSettingsPopup = false;
    },
    saveSettings({ beepThreshold, darkMode }) {
      this.beepThreshold = beepThreshold;
      this.darkMode = darkMode;
      localStorage.setItem('beepThreshold', beepThreshold);
      localStorage.setItem('darkMode', darkMode);
    },
    loadSettings() {
      this.beepThreshold = parseFloat(localStorage.getItem('beepThreshold')) || 2;
      this.darkMode = localStorage.getItem('darkMode') === 'true';
    },
    toggleTheme(value) {
      this.darkMode = value;
      localStorage.setItem('darkMode', this.darkMode);
    },
    clearCache() {
      if ('caches' in window) {
        caches.keys().then(function (names) {
          for (let name of names) {
            caches.delete(name);
          }
        });
      }
      window.location.reload(true); // Force reload to get the latest version
    },
  },
  created() {
    this.loadSettings();
    this.getCurrentPosition();
    this.getDeviceOrientation();
    this.updateLocalTime();
    setInterval(this.updateLocalTime, 1000);
  },
  mounted() {
    this.intervalId = setInterval(this.calculateCoordinates, 50);
  },
  beforeUnmount() {
    clearInterval(this.intervalId);
    window.removeEventListener("deviceorientation", this.handleOrientation, true);
    this.stopCalculatingDistance();
  },
};
</script>

<style lang="scss">
@import './styles/main.scss';

#app {
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Ensure the content is spaced between the top and bottom */
  height: 100vh;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.settings-button-container {
  padding: 10px;
  display: flex;
  justify-content: center;
}
</style>
