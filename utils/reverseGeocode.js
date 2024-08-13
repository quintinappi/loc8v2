export async function reverseGeocode(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.address.city || data.address.town || data.address.village || 'Unknown location';
}