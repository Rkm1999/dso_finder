<!-- app.vue -->
<template>
  <div>
    <h1>DSO Finder</h1>
    <div>Latitude: {{ latitude.toFixed(2) }}</div>
    <div>Longitude: {{ longitude.toFixed(2) }}</div>
    <button @click="requestGPSPermission">Request GPS Permission</button>
    
    <h2>Raw Gyro Data</h2>
    <div>Raw Azimuth: {{ rawAzimuth.toFixed(2) }}</div>
    <div>Raw Altitude: {{ rawAltitude.toFixed(2) }}</div>

    <h2>Calibrated Gyro Data</h2>
    <div>Calibrated Azimuth: {{ azimuth.toFixed(2) }}</div>
    <div>Calibrated Altitude: {{ altitude.toFixed(2) }}</div>

    <button @click="requestOrientationPermission">Request Orientation Permission</button>

    <h2>Time</h2>
    <div>Local Time: {{ localTime }}</div>
    <div v-if="results">
      <h2>RA/DEC Coordinates</h2>
      <div>J2000 RA: {{ results.j2000_ra.toFixed(2) }}</div>
      <div>J2000 DEC: {{ results.j2000_dec.toFixed(2) }}</div>
    </div>
    <div>
      <h2>Target Coordinates</h2>
      <input v-model="target_ra" placeholder="Target RA (hours)">
      <input v-model="target_dec" placeholder="Target DEC (degrees)">
      <button @click="startCalculatingDistance">Calculate Distance</button>
      <button @click="stopCalculatingDistance">Stop</button>
      <div v-if="angularDistance != null">
        <h3>Angular Distance to Target</h3>
        <div>{{ angularDistance.toFixed(2) }} degrees</div>
      </div>
    </div>
    <div>
      <h2>Calibrate Gyro</h2>
      <input v-model="star_ra" placeholder="Enter RA (hours)">
      <input v-model="star_dec" placeholder="Enter DEC (degrees)">
      <button @click="calibrateGyro">Calibrate</button>
    </div>
    <div v-if="calibrationResult">
      <h2>Calibration Results</h2>
      <div>Expected AZ: {{ calibrationResult.expectedAzimuth.toFixed(2) }}</div>
      <div>Expected ALT: {{ calibrationResult.expectedAltitude.toFixed(2) }}</div>
      <div>Actual AZ: {{ calibrationResult.actualAzimuth.toFixed(2) }}</div>
      <div>Actual ALT: {{ calibrationResult.actualAltitude.toFixed(2) }}</div>
      <div>AZ Correction: {{ calibrationResult.azimuthCorrection.toFixed(2) }}</div>
      <div>ALT Correction: {{ calibrationResult.altitudeCorrection.toFixed(2) }}</div>
    </div>
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

export default {
  data() {
    return {
      latitude: '',
      longitude: '',
      rawAzimuth: 0,
      rawAltitude: 0,
      azimuth: 0, // Initialize as a numeric value
    altitude: 0, // Initialize as a numeric value
      localTime: '',
      results: null,
      star_ra: '',
      star_dec: '',
      calibrationResult: null,
      azimuthOffset: 0,
      altitudeOffset: 0,
      target_ra: '',
      target_dec: '',
      angularDistance: null,
      angularDistanceIntervalId: null,
      audioContext: null,
      oscillator: null,
      isBeeping: false,


    };
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
        this.getDeviceOrientation(); // Attempt to add event listener regardless
      }
    },

    getDeviceOrientation() {
      window.addEventListener("deviceorientation", (event) => {
        if (event.absolute) {
          console.log("Got absolute orientation.");
        } else {
          console.log("Orientation not absolute.");
        }

        let rawAltitude = event.beta;  // Raw X axis
        let rawAzimuth = event.alpha;  // Raw Z axis
        if (rawAzimuth !== null) {
          rawAzimuth = 360 - rawAzimuth; // Invert and normalize raw azimuth to 0-360
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

      // Normalize the azimuth with the offset applied and wrap it properly
      let calibratedAzimuth = (rawAzimuth + this.azimuthOffset + 360) % 360;

      // Check if adjustment crosses the typical -90/90 boundary for altitude
      if (adjustedAltitude > 90) {
        adjustedAltitude = 180 - adjustedAltitude;  // Correct inversion above 90
      } else if (adjustedAltitude < -90) {
        adjustedAltitude = -180 - adjustedAltitude;  // Correct inversion below -90
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

        // Use directly calibrated data
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
    async calibrateGyro() {
      // Ensure the current positions and local sidereal time are correct
      const jd_ut = this.dateToJulianDate(new Date(this.localTime));
      const ra = parseFloat(this.star_ra) * Math.PI / 12; // hours to radians
      const dec = parseFloat(this.star_dec) * Math.PI / 180; // degrees to radians

      // Get expected azimuth and altitude from astronomical calculations
      const [expectedAzimuth, expectedAltitude] = this.raDecToAltAz(ra, dec, this.latitude * Math.PI / 180, this.longitude * Math.PI / 180, jd_ut);

      // Calculate corrections based on raw sensor readings
      const azimuthCorrection = (expectedAzimuth * 180 / Math.PI - this.rawAzimuth + 360) % 360;
      const altitudeCorrection = expectedAltitude * 180 / Math.PI - this.rawAltitude;

      // Apply these corrections to the stored offsets
      this.azimuthOffset = azimuthCorrection;
      this.altitudeOffset = altitudeCorrection;

      // Update calibration results
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
      let gmst = this.earthRotationAngle(jd) + (0.014506 + 4612.156534 * t + 1.3915817 * t * t - 0.00000044 * t * t * t - 0.000029956 * t * t * t * t - 0.0000000368 * t * t * t * t * t) * Math.PI / 648000; // degrees to radians
      return (gmst % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    },
    earthRotationAngle(jd) {
      const t = jd - 2451545.0;
      let theta = 2 * Math.PI * ((jd % 1.0) + 0.7790572732640 + 0.00273781191135448 * t);
      return (theta % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    },
    startCalculatingDistance() {
      if (this.angularDistanceIntervalId !== null) {
        // If there's already an interval running, clear it first
        clearInterval(this.angularDistanceIntervalId);
      }
      this.calculateAngularDistance(); // Calculate initially before setting the interval
      this.angularDistanceIntervalId = setInterval(() => {
        this.calculateAngularDistance();
      }, 50); // Recalculate every second
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

      // Convert target RA/Dec from hours and degrees to radians
      const targetRaRadians = parseFloat(this.target_ra) * Math.PI / 12;
      const targetDecRadians = parseFloat(this.target_dec) * Math.PI / 180;

      // Get Alt/Az for the target
      const [targetAzimuth, targetAltitude] = this.raDecToAltAz(targetRaRadians, targetDecRadians, observerLatRadians, observerLonRadians, jd_ut);
      
      // Convert pointing Alt/Az to radians
      const pointingAzimuthRadians = this.azimuth * Math.PI / 180;
      const pointingAltitudeRadians = this.altitude * Math.PI / 180;

      // Convert Alt/Az to vectors
      const pointingVector = VectorFromHorizon(new Spherical(pointingAltitudeRadians, pointingAzimuthRadians, 1), new Date(this.localTime), null);
      const targetVector = VectorFromHorizon(new Spherical(targetAltitude, targetAzimuth, 1), new Date(this.localTime), null);

      // Calculate angular distance between the two vectors
      let vectorDistance = AngleBetween(pointingVector, targetVector) * 180 / Math.PI;

      // Correcting distance to not exceed 180 degrees
      this.angularDistance = vectorDistance > 180 ? 360 - vectorDistance : vectorDistance;
      if (this.angularDistance < 0.5) {
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
        // Always create a new oscillator when starting the beep
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'sine'; // Sine wave — other types are 'square', 'sawtooth', 'triangle'
        this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // Frequency in hertz
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
        // Optionally close the audio context if not planning to use it soon again
        // this.audioContext.close();
        // this.audioContext = null;
      }
    },

  },
  created() {
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
