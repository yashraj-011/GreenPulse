// backend/src/db/stations.js

export const stations = [
  {
    id: 1,
    name: "Delhi (City Average)",
    code: "DELHI_CITY",
    lat: 28.6139,
    lng: 77.2090,
  },
  {
    id: 2,
    name: "AQICN Median Station",
    code: "AQICN_MEDIAN",
    lat: 28.6,
    lng: 77.2,
  },
  {
    id: 3,
    name: "Nearest Station (GPS)",
    code: "NEAREST_STATION",
    lat: null,   // GPS based
    lng: null
  }
];
