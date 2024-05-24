<!-- App.vue -->
<template>
  <div id="app" :class="[theme]">
    <div class="content-container">
      <div class="row">
        <GPSDisplay :latitude="latitude" :longitude="longitude" />
        <LocalTimeDisplay :local-time="localTime" />
      </div>

      <div class="row">
        <AltAzDisplay :altitude="altitude" :azimuth="azimuth" label="Alt/Az" />
        <AltAzDisplay :altitude="targetAltitude" :azimuth="targetAzimuth" label="Target Alt/Az" />
      </div>

      <PermissionButtons
        @gps-permission-granted="getCurrentPosition"
        @gyro-permission-granted="getDeviceOrientation"
        :dark-mode="darkMode"
      />

      <div class="row">
        <RADECInput
          v-model:ra-input="raInput"
          v-model:dec-input="decInput"
          :dark-mode="darkMode"
          @update-coordinates="updateTargetCoordinates"
          :latitude="latitude"
          :longitude="longitude"
        />
      </div>

      <CalibrationTracking :dark-mode="darkMode" @openCalibrationPopup="openCalibrationPopup" @startTracking="startTracking" />
    </div>

    <!-- Install button -->
    <button v-if="installBtnVisible" @click="installApp" class="styled-button install-button">
      Install App
    </button>

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
import RaDecToAltAz from 'radectoaltaz';
import GPSDisplay from './components/GPSDisplay.vue';
import LocalTimeDisplay from './components/LocalTimeDisplay.vue';
import AltAzDisplay from './components/AltAzDisplay.vue';
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
      beepIntervalId: null,
      currentInterval: null, // Track the current interval
      raInput: '',
      decInput: '',
      targetAltitude: 0, // Target Altitude
      targetAzimuth: 0, // Target Azimuth
      showCalibrationPopup: false,
      showTrackingOverlay: false,
      showSettingsPopup: false,
      darkMode: false,
      beepThreshold: 2,
      isContinuousBeeping: false, // Track if continuous beeping is active
      installBtnVisible: false
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
        alert('Unable to retrieve GPS position. Please ensure location services are enabled.');
      }
    },
    updateLocalTime() {
      this.localTime = new Date().toLocaleString('en-US', { hour12: false }).replace(',', '');
    },
    getDeviceOrientation() {
      this.handleOrientation = this.handleOrientation.bind(this);
      window.addEventListener('deviceorientation', this.handleOrientation, true);
      console.log('Listener for device orientation added.');
    },
    handleOrientation(event) {
      if (event.absolute) {
        console.log('Got absolute orientation.');
      } else {
        console.log('Orientation not absolute.');
      }
      let rawAltitude = event.beta;
      let rawAzimuth = event.alpha;
      if (rawAzimuth !== null) {
        rawAzimuth = 360 - rawAzimuth;
        this.rawAltitude = rawAltitude;
        this.rawAzimuth = rawAzimuth;
        this.applyCalibration(rawAltitude, rawAzimuth);
      } else {
        console.log('Orientation data not available.');
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
    async performCalibration() {
      if (!this.isCalibrating) {
        this.isCalibrating = true;
        const ra = parseFloat(this.raInput);
        const dec = parseFloat(this.decInput);
        const lat = this.latitude;
        const lng = this.longitude;

        const coordinates = new RaDecToAltAz(ra, dec, lat, lng);
        const expectedAzimuth = coordinates.getAz();
        const expectedAltitude = coordinates.getAlt();

        const azimuthCorrection = (expectedAzimuth - this.rawAzimuth + 360) % 360;
        const altitudeCorrection = expectedAltitude - this.rawAltitude;

        this.azimuthOffset = azimuthCorrection;
        this.altitudeOffset = altitudeCorrection;

        this.calibrationResult = {
          expectedAzimuth: expectedAzimuth,
          expectedAltitude: expectedAltitude,
          actualAzimuth: this.rawAzimuth,
          actualAltitude: this.rawAltitude,
          azimuthCorrection: azimuthCorrection,
          altitudeCorrection: altitudeCorrection
        };

        this.updateTargetCoordinates(ra, dec); // Ensure the target coordinates are updated immediately

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
    async calculateAngularDistance() {
      try {
        const targetAzimuth = this.targetAzimuth;
        const targetAltitude = this.targetAltitude;

        const az1 = this.azimuth * Math.PI / 180;
        const alt1 = this.altitude * Math.PI / 180;
        const az2 = targetAzimuth * Math.PI / 180;
        const alt2 = targetAltitude * Math.PI / 180;

        const cosAngularDistance = Math.sin(alt1) * Math.sin(alt2) +
                                   Math.cos(alt1) * Math.cos(alt2) * Math.cos(az1 - az2);
        this.angularDistance = Math.acos(cosAngularDistance) * 180 / Math.PI;

        this.updateBeepInterval();
      } catch (error) {
        console.error('Error calculating angular distance:', error);
      }
    },
    updateTargetCoordinates(ra, dec) {
      try {
        const coordinates = new RaDecToAltAz(ra, dec, this.latitude, this.longitude);
        this.targetAzimuth = coordinates.getAz();
        this.targetAltitude = coordinates.getAlt();
      } catch (error) {
        console.error('Error updating target coordinates:', error);
      }
    },
    updateBeepInterval() {
      if (this.angularDistance < this.beepThreshold) {
        this.switchToContinuousBeep();
      } else if (this.angularDistance <= this.beepThreshold + 30) {
        this.stopContinuousBeep();
        this.switchToIntervalBeep();
      } else {
        this.stopBeep();
        this.stopContinuousBeep();
      }
    },
    switchToContinuousBeep() {
      if (!this.isContinuousBeeping) {
        this.stopBeep();
        this.playContinuousBeep();
      }
    },
    switchToIntervalBeep() {
      const intervals = [200, 300, 400, 500, 600, 700, 800, 900, 1000];
      const distanceFromThreshold = this.angularDistance - this.beepThreshold;
      const intervalIndex = Math.min(Math.floor(distanceFromThreshold / 3), intervals.length - 1);

      if (intervalIndex >= 0 && intervalIndex < intervals.length) {
        this.startBeep(intervals[intervalIndex]);
      } else {
        this.stopBeep();
      }
    },
    playContinuousBeep() {
      if (!this.isContinuousBeeping) {
        this.isContinuousBeeping = true;
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
        }
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
        }
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        this.oscillator.connect(this.audioContext.destination);
        this.oscillator.start();
      }
    },
    stopContinuousBeep() {
      if (this.isContinuousBeeping) {
        this.isContinuousBeeping = false;
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
        }
      }
    },
    startBeep(interval) {
      if (this.currentInterval !== interval) {
        if (this.beepIntervalId) {
          clearInterval(this.beepIntervalId);
        }
        this.currentInterval = interval;
        this.isBeeping = true;
        this.playBeep(); // Play beep immediately when the interval changes
        this.beepIntervalId = setInterval(() => {
          this.playBeep();
        }, interval);
      }
    },
    playBeep() {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
      }
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      this.oscillator.connect(this.audioContext.destination);
      this.oscillator.start();
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
        }
      }, 100);
    },
    stopBeep() {
      if (this.isBeeping) {
        this.isBeeping = false;
        clearInterval(this.beepIntervalId);
        this.beepIntervalId = null;
        this.currentInterval = null;
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
        }
      }
    },
    openCalibrationPopup() {
      if (this.validateRADECInput()) {
        this.calibrationResult = null;
        this.showCalibrationPopup = true;
      } else {
        alert('Please select a target from the list or manually enter RA/DEC coordinates.');
      }
    },
    closeModal() {
      this.showCalibrationPopup = false;
    },
    initiateCalibration() {
      this.performCalibration();
    },
    startTracking() {
      if (this.validateRADECInput()) {
        this.calculateAngularDistance();
        this.angularDistanceIntervalId = setInterval(() => {
          this.calculateAngularDistance();
        }, 50);
        this.showTrackingOverlay = true;
      } else {
        alert('Please select a target from the list or manually enter RA/DEC coordinates.');
      }
    },
    stopTracking() {
      clearInterval(this.angularDistanceIntervalId);
      this.angularDistanceIntervalId = null;
      this.stopBeep();
      this.stopContinuousBeep();
      this.showTrackingOverlay = false;
    },
    closeTrackingOverlay() {
      this.showTrackingOverlay = false;
      this.stopTracking();
    },
    validateRADECInput() {
      return this.raInput !== '' && this.decInput !== '';
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
    window.removeEventListener('deviceorientation', this.handleOrientation, true);
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
