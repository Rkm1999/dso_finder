<template>
  <div id="app" :class="theme">
    <div class="content-container">
      <!-- Existing content -->
      <div class="row">
        <div class="column">
          <h2>GPS Coordinate</h2>
          <div>{{ latitude.toFixed(2) }}, {{ longitude.toFixed(2) }}</div>
        </div>
        <div class="column">
          <h2>Local Time</h2>
          <div>{{ localTime }}</div>
        </div>
      </div>

      <div class="row">
        <div class="column">
          <h2>Altitude and Azimuth</h2>
          <div>Alt: {{ altitude.toFixed(2) }}</div>
          <div>Az: {{ azimuth.toFixed(2) }}</div>
        </div>
        <div class="column">
          <h2>RA/DEC Coordinates</h2>
          <div v-if="results">
            <div>RA: {{ results.j2000_ra.toFixed(2) }}</div>
            <div>DEC: {{ results.j2000_dec.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="column full-width">
          <button class="styled-button" @click="requestGPSPermission">Request GPS Permission</button>
          <button class="styled-button" @click="requestOrientationPermission">Request Gyro Permission</button>
        </div>
      </div>

      <div class="row">
        <div class="column full-width">
          <h2>RA/DEC Input</h2>
          <input class="styled-input" v-model="raInput" placeholder="RA (hours)">
          <input class="styled-input" v-model="decInput" placeholder="DEC (degrees)">
        </div>
      </div>

      <div class="row">
        <div class="column full-width">
          <h2>Calibration and Tracking</h2>
          <button class="styled-button" @click="openCalibrationPopup">Calibrate Gyro</button>
          <button class="styled-button" @click="startTracking">Track Target</button>
        </div>
      </div>
    </div>

    <div class="settings-button-container">
      <button class="styled-button" @click="openSettingsPopup">Settings</button>
    </div>

    <!-- Settings Modal Popup -->
    <div v-if="showSettingsPopup" class="modal-overlay" @click="closeSettingsPopup">
      <div :class="['modal-content', darkMode ? 'dark' : '']" @click.stop>
        <button class="close-button" @click="closeSettingsPopup">×</button>
        <h2>Settings</h2>
        <div>
          <label for="threshold">Beep Distance Threshold (degrees):</label>
          <input id="threshold" v-model.number="beepThreshold" type="number" class="styled-input">
        </div>
        <div>
          <label for="themeToggle">Theme:</label>
          <input id="themeToggle" type="checkbox" v-model="darkMode" @change="toggleTheme">
          <label for="themeToggle">{{ darkMode ? 'Dark Mode' : 'Light Mode' }}</label>
        </div>
        <button class="styled-button" @click="saveSettings">Save Settings</button>
        <button class="styled-button" @click="clearCache">Clear Cache</button>
      </div>
    </div>

    <!-- Modal Popup for Calibration -->
    <div v-if="showCalibrationPopup" class="modal-overlay" @click="initiateCalibration">
      <button class="close-button" @click.stop="closeModal">×</button>
      <h2 v-if="!calibrationResult">Tap anywhere to calibrate the gyro.</h2>
      <div v-if="calibrationResult">
        <h2>Calibration Results</h2>
        <p>
          Expected AZ: {{ calibrationResult.expectedAzimuth.toFixed(2) }}<br>
          Expected ALT: {{ calibrationResult.expectedAltitude.toFixed(2) }}<br>
          Actual AZ: {{ calibrationResult.actualAzimuth.toFixed(2) }}<br>
          Actual ALT: {{ calibrationResult.actualAltitude.toFixed(2) }}<br>
          AZ Correction: {{ calibrationResult.azimuthCorrection.toFixed(2) }}<br>
          ALT Correction: {{ calibrationResult.altitudeCorrection.toFixed(2) }}
        </p>
        <button class="styled-button" @click.stop="openCalibrationPopup(true)">Recalibrate</button>
      </div>
    </div>
    <!-- Tracking Overlay -->
    <div v-if="showTrackingOverlay" class="modal-overlay" @click="stopTracking">
      <button class="close-button" @click.stop="closeTrackingOverlay">×</button>
      <h2>Tracking Target</h2>
      <p>Angular Distance: {{ angularDistance.toFixed(2) }} degrees</p>
    </div>
  </div>
</template>

<style>
/* Global styles */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Optional: prevent scrolling */
}

/* Scoped styles */
#app {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%; /* Ensure the #app element occupies the full height */
  overflow-y: auto; /* Enable scrolling if content overflows */
}
.content-container {
  flex: 1; /* Allows it to take remaining space */
  display: flex;
  flex-direction: column;
  justify-content: space-around; /* Distributes space evenly */
}
.settings-button-container {
  margin-top: auto; /* Push to the bottom */
  padding: 10px; /* Optional padding */
}

.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0px;
}
.column {
  flex: 1;
  padding: 5px;
  box-sizing: border-box;
}
.full-width {
  flex: 100%;
}
input.styled-input {
  margin-bottom: 5px;
  width: 90%;
  padding: 5px;
  border: 2px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.1);
}
input.styled-input.dark {
  background-color: #333;
  color: #ff0000;
  border: 2px solid #ff0000;
}
button.styled-button {
  width: 100%;
  margin-top: 5px;
  padding: 5px;
  border: none;
  border-radius: 5px;
  background-color: #007BFF;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
}
button.styled-button:hover {
  background-color: #0056b3;
}
button.styled-button.dark {
  background-color: #4CAF50;
  color: red; /* Change text color to red in dark mode */
}
button.styled-button.dark:hover {
  background-color: #45a049;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;
  z-index: 1000;
  color: #aaa;
}
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  background: none;
  font-size: 30px;
  color: #fff;
  cursor: pointer;
}

.modal-overlay h2, .modal-overlay p {
  color: inherit;
}
.modal-content {
  background-color: #fff;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: #000;
  width: 30vh;  /* Set a fixed width */
  height: 50vh; /* Set a max height to prevent overflow */
  overflow-y: auto; /* Enable vertical scrolling if content overflows */
}

.modal-content.dark {
  background-color: #333;
  color: #ff0000;
  width: 30vh;  /* Set a fixed width */
  height: 50vh; /* Set a max height to prevent overflow */
  overflow-y: auto; /* Enable vertical scrolling if content overflows */
  padding: 10px;

}

.modal-content label {
  display: block;
  margin-top: 5px;
  margin-bottom: 2px;
}

.dark {
  background-color: #000;
  color: #ff0000;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%; /* Ensure the .dark element occupies the full height */
}

.dark input.styled-input {
  background-color: #333;
  color: #ff0000;
  border: 2px solid #ff0000;
}

.dark button.styled-button {
  background-color: #4CAF50;
  color: red; /* Change text color to red in dark mode */
}

.dark button.styled-button:hover {
  background-color: #45a049;
}
</style>

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

export default {
  data() {
    return {
      latitude: '',
      longitude: '',
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
      beepThreshold: 2, // Default threshold
    };
  },
  computed: {
    theme() {
      return this.darkMode ? 'dark' : 'light';
    }
  },
  methods: {
    async requestGPSPermission() {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'granted' || permission.state === 'prompt') {
        this.getCurrentPosition();
      }
    },
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
    requestOrientationPermission() {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              this.getDeviceOrientation();
            } else {
              console.error('Orientation permission denied');
            }
          })
          .catch(console.error);
      } else {
        console.warn('Orientation permission is not explicitly required by this browser.');
        this.getDeviceOrientation();
      }
    },
    getDeviceOrientation() {
      window.addEventListener("deviceorientation", (event) => {
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
      }, true);
      console.log("Listener for device orientation added.");
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
    openCalibrationPopup(recalibrate = false) {
      this.showCalibrationPopup = true;
      if (recalibrate) {
        this.calibrationResult = null;
      }
    },
    closeModal() {
      this.showCalibrationPopup = false;
    },
    initiateCalibration() {
      if (!this.calibrationResult) {
        this.performCalibration();
      }
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
    saveSettings() {
      console.log("Settings saved:", this.beepThreshold, this.darkMode);
      localStorage.setItem('beepThreshold', this.beepThreshold);
      localStorage.setItem('darkMode', this.darkMode);
      this.closeSettingsPopup();
    },
    loadSettings() {
      this.beepThreshold = parseFloat(localStorage.getItem('beepThreshold')) || 2;
      this.darkMode = localStorage.getItem('darkMode') === 'true';
    },
    toggleTheme() {
      this.theme = this.darkMode ? 'dark' : 'light';
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
