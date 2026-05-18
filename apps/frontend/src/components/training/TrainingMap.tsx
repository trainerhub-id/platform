import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from '@iconify/react'

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
  const isOnline =
    !selectedTraining.location ||
    selectedTraining.location.toLowerCase() === 'online'

  if (isOnline) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center bg-[#FBF9F5]"
        style={{ minHeight: '280px' }}
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-[#F5EBDD] flex items-center justify-center">
            <Icon icon="solar:monitor-bold" className="text-[#B8863B]" height={28} />
          </div>
          <p className="text-[15px] font-semibold text-[#1F2937]">Training Online</p>
          <p className="text-[13px] text-[#9CA3AF]">
            Lokasi tidak tersedia untuk training online.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full" style={{ minHeight: '280px' }}>
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
            <div className="w-[280px] overflow-hidden rounded-xl flex flex-col">
              {/* Top Image */}
              <div className="h-28 w-full relative">
                <img
                  src={selectedTraining.image}
                  alt={selectedTraining.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="bg-[#B8863B] p-4 pt-9 relative">
                {/* Overlapping Avatar */}
                <div className="absolute -top-6 left-4">
                  <img
                    src={selectedTraining.participant.avatar}
                    alt={selectedTraining.participant.name}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-white"
                  />
                </div>

                {/* Name Badge */}
                <div className="bg-white/20 text-white px-3 py-1 rounded-lg text-xs font-semibold mb-3 w-fit">
                  {selectedTraining.participant.name}
                </div>

                {/* Title */}
                <h6 className="text-white text-sm font-bold leading-snug mb-3">
                  {selectedTraining.title}, {selectedTraining.location}.
                </h6>

                {/* Stats */}
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1">
                    <Icon icon="solar:users-group-rounded-bold" height={18} />
                    <span className="text-sm font-bold">
                      {selectedTraining.stats?.participants || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 border-l border-white/20 pl-4">
                    <Icon icon="solar:clock-circle-bold" height={18} />
                    <span className="text-xs font-semibold">
                      {selectedTraining.dateStart} - {selectedTraining.dateEnd}
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
