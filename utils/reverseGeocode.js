export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    const data = await response.json();
    
    if (data.address) {
      return data.address.town || data.address.city || data.address.village || 'Unknown location';
    } else {
      return 'Unknown location';
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error; // Propagate the error to be handled in the component
  }
}