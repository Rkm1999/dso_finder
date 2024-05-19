// src/utils.js
export function raDecToAltAz(ra, dec, lat, lon, jd_ut) {
    const gmst = greenwichMeanSiderealTime(jd_ut);
    let localSiderealTime = (gmst + lon) % (2 * Math.PI);
    let H = (localSiderealTime - ra + Math.PI) % (2 * Math.PI) - Math.PI;
    let az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) + Math.PI;
    let alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
    return [az % (2 * Math.PI), alt];
  }
  
  function greenwichMeanSiderealTime(jd) {
    const t = (jd - 2451545.0) / 36525.0;
    let gmst = earthRotationAngle(jd) + (0.014506 + 4612.156534 * t + 1.3915817 * t * t - 0.00000044 * t * t * t - 0.000029956 * t * t * t * t - 0.0000000368 * t * t * t * t * t) * Math.PI / 648000;
    return (gmst % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  }
  
  function earthRotationAngle(jd) {
    const t = jd - 2451545.0;
    let theta = 2 * Math.PI * ((jd % 1.0) + 0.7790572732640 + 0.00273781191135448 * t);
    return (theta % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  }
  