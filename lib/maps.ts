type MappableBuilding = {
  latitude?: number | string | null;
  longitude?: number | string | null;
  google_maps_url?: string | null;
};

function coordinate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildGoogleMapsUrl(building: MappableBuilding) {
  const latitude = coordinate(building.latitude);
  const longitude = coordinate(building.longitude);

  if (latitude !== null && longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return building.google_maps_url?.trim() || null;
}

// TODO(module-google-geocoding): when Google Maps Geocoding API is enabled,
// call it after landlord address input to save latitude, longitude,
// formatted_address, and google_place_id into public.buildings.
