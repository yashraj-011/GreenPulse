// src/services/geocodeService.js
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const geocodeService = {
  // Geocode a location name to coordinates
  geocode: async (locationName) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&region=in&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
          placeId: result.place_id
        };
      }

      console.warn('Geocoding failed:', data.status);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },

  // Reverse geocode coordinates to location name
  reverseGeocode: async (lat, lng) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        // Find the most specific address (usually the first one)
        const result = data.results[0];
        return {
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
          components: result.address_components
        };
      }

      console.warn('Reverse geocoding failed:', data.status);
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  },

  // Get autocomplete suggestions for places
  getPlaceSuggestions: async (input, sessionToken) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&location=28.6139,77.2090&radius=50000&components=country:in&key=${GOOGLE_MAPS_API_KEY}&sessiontoken=${sessionToken}`
      );

      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions.map(prediction => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text
        }));
      }

      return [];
    } catch (error) {
      console.error('Places autocomplete error:', error);
      return [];
    }
  },

  // Get place details by place ID
  getPlaceDetails: async (placeId) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
          placeId: placeId
        };
      }

      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }
};