import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

export default function Map({ clockIn }) {
  let lat = 0, lon = 0;
  if (clockIn.location && typeof clockIn.location === 'string') {
    [lat, lon] = clockIn.location.split(',').map(coord => parseFloat(coord.trim()));
  } else if (clockIn.latitude && clockIn.longitude) {
    lat = parseFloat(clockIn.latitude);
    lon = parseFloat(clockIn.longitude);
  }

  const isClockIn = clockIn.type === 'CLOCKED IN';
  const bgColor = isClockIn ? 'bg-green-100' : 'bg-red-100';
  const borderColor = isClockIn ? 'border-green-500' : 'border-red-500';
  const textColor = isClockIn ? 'text-green-700' : 'text-red-700';

  const isValidCoordinate = (coord) => !isNaN(coord) && isFinite(coord);
  const hasValidCoordinates = isValidCoordinate(lat) && isValidCoordinate(lon);

  return (
    <div className={`${bgColor} ${borderColor} border-l-4 rounded-lg p-4 mb-4 shadow-md flex`}>
      {hasValidCoordinates ? (
        <div className="w-1/2 h-48 mr-4">
          <MapContainer key={`${lat},${lon}`} center={[lat, lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lon]} />
          </MapContainer>
        </div>
      ) : (
        <div className="w-1/2 h-48 mr-4 bg-gray-200 flex items-center justify-center text-gray-500">
          No map available
        </div>
      )}
      <div className="w-1/2 flex flex-col justify-center">
        <p className={`font-bold text-lg ${textColor}`}>{clockIn.type}</p>
        <p className="text-md text-gray-600">{clockIn.timestamp.toLocaleString()}</p>
        <p className="text-sm text-gray-500 mt-2">
          {hasValidCoordinates ? `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}` : 'Location not available'}
        </p>
        {clockIn.locationName && (
          <p className="text-sm text-gray-500">Location: {clockIn.locationName}</p>
        )}
      </div>
    </div>
  );
}