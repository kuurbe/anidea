import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function MapView() {
  return (
    <div className='w-full h-full'>
      <MapContainer
        center={[32.7364, -96.8286]}
        zoom={13}
        className='w-full h-full'
      >
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

        <Marker position={[32.7364, -96.8286]} icon={markerIcon}>
          <Popup>Oak Cliff — Test Marker</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
