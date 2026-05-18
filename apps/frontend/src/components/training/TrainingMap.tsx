import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
// import "src/views/training/training-map.css"; // Ensure this css is importable or move it
import { Icon } from '@iconify/react'

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface TrainingMapProps {
  selectedTraining: {
    coordinates: [number, number]
    image: string
    title: string
    location: string
    participant: {
      name: string
      avatar: string
    }
    stats?: {
      participants: number
      comments: number
    }
    dateStart: string
    dateEnd: string
  }
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

const TrainingMap = ({ selectedTraining }: TrainingMapProps) => {
  const coordinates = selectedTraining.coordinates || [-6.2088, 106.8456]

  return (
    <div className="h-[300px] relative z-0">
      <MapContainer
        center={coordinates}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={coordinates} />
        <Marker position={coordinates}>
          <Popup>
            <div className="w-[320px] overflow-hidden rounded-2xl flex flex-col">
              {/* Top Image */}
              <div className="h-36 w-full relative">
                <img
                  src={selectedTraining.image}
                  alt={selectedTraining.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content Area with Gold Background */}
              <div className="bg-[#AA8D55] p-5 pt-10 relative">
                {/* Overlapping Avatar */}
                <div className="absolute -top-8 left-5">
                  <img
                    src={selectedTraining.participant.avatar}
                    alt={selectedTraining.participant.name}
                    className="w-16 h-16 rounded-full border-[3px] border-white shadow-md bg-white"
                  />
                </div>

                {/* Name Badge */}
                <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-xl text-sm font-semibold mb-4 w-fit">
                  {selectedTraining.participant.name}
                </div>

                {/* Training Title & Location */}
                <h6 className="text-white text-lg font-bold leading-tight mb-5">
                  {selectedTraining.title}, {selectedTraining.location}.
                </h6>

                {/* Stats Icons - Dynamic Data */}
                <div className="flex items-center gap-6 text-white/90">
                  <div className="flex items-center gap-1.5">
                    <Icon icon="solar:users-group-rounded-bold" height={22} />
                    <span className="text-base font-bold">
                      {selectedTraining.stats?.participants || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon icon="solar:chat-line-bold" height={22} />
                    <span className="text-base font-bold">
                      {selectedTraining.stats?.comments || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-l border-white/20 pl-6">
                    <Icon icon="solar:clock-circle-bold" height={22} />
                    <span className="text-sm font-bold">
                      {selectedTraining.dateStart} - {selectedTraining.dateEnd} | 15.30 WIB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export default TrainingMap
