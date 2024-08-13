import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

export default function Map({ clockIn }) {
  if (!clockIn || !clockIn.latitude || !clockIn.longitude) {
    return <div>No location data available</div>;
  }

  const position = [clockIn.latitude, clockIn.longitude];

  return (
    <div className="w-full h-full">
      <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>
            {clockIn.timestamp.toLocaleString()} - {clockIn.type}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}