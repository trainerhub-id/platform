import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Icon } from '@iconify/react';
import api from 'src/api/axios';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const parseGoogleMapsUrl = (url: string) => {
    // Priority 1: Pin coordinates in data (3d/4d)
    const pinMatch = url.match(/3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    let coords = null;
    if (pinMatch) {
        coords = { lat: parseFloat(pinMatch[1]), lng: parseFloat(pinMatch[2]) };
    } else {
        // Priority 2: @lat,lng
        const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            coords = { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        } else {
            // Priority 3: q=lat,lng
            const qMatch = url.match(/[?&]q=(?:loc:)?(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (qMatch) {
                coords = { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
            }
        }
    }

    // Extract name if available in the /place/Segment/ format or similar
    // https://www.google.com/maps/place/Gedung+Pertemuan+Prasetya/@...
    const nameMatch = url.match(/\/maps\/place\/([^/@]+)/);
    const extractedName = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : null;

    return coords ? { ...coords, name: extractedName } : (extractedName ? { name: extractedName } : null);
};

interface LocationPickerProps {
    value?: { lat: number; lng: number };
    onChange: (lat: number, lng: number) => void;
    onNameSelect?: (name: string) => void;
    onAddressSelect?: (address: string) => void;
    initialCenter?: [number, number];
    children?: React.ReactNode;
}

function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export const LocationPicker = ({ value, onChange, onNameSelect, onAddressSelect, initialCenter = [-6.2088, 106.8456], children }: LocationPickerProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        value ? [value.lat, value.lng] : initialCenter
    );

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            if (data && data.display_name && onAddressSelect) {
                onAddressSelect(data.display_name);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    };

    const markerPosition = useMemo(() => {
        if (value) return [value.lat, value.lng] as [number, number];
        return null;
    }, [value]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            let finalUrl = searchQuery;

            // If it's a short URL, resolve it via backend
            if (searchQuery.includes('maps.app.goo.gl') || searchQuery.includes('goo.gl/maps')) {
                try {
                    const res = await api.post('/batch/resolve-map-url', { url: searchQuery });
                    finalUrl = res.data.finalUrl;
                } catch (err) {
                    console.error('Error resolving short URL:', err);
                }
            }

            // Priority 1: Check if it's a Google Maps URL (pasted directly or resolved)
            const coordsFromUrl = parseGoogleMapsUrl(finalUrl);
            if (coordsFromUrl) {
                if ('lat' in coordsFromUrl && 'lng' in coordsFromUrl) {
                    setMapCenter([coordsFromUrl.lat, coordsFromUrl.lng]);
                    onChange(coordsFromUrl.lat, coordsFromUrl.lng);
                    // Also fetch full address
                    await reverseGeocode(coordsFromUrl.lat, coordsFromUrl.lng);
                }
                if (coordsFromUrl.name && onNameSelect) {
                    onNameSelect(coordsFromUrl.name);
                }
                setIsSearching(false);
                return;
            }

            // Priority 2: Fallback to Geocoding (Nominatim)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
            );
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                setMapCenter([newLat, newLng]);
                onChange(newLat, newLng);
            } else {
                alert('Lokasi tidak ditemukan');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Terjadi kesalahan saat mencari lokasi');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    placeholder="https://maps.app.goo.gl/8qZUDdCpu7LCjH3H7"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                />
                <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="shrink-0"
                >
                    {isSearching ? <Icon icon="eos-icons:loading" height={18} /> : <Icon icon="solar:magnifer-linear" height={18} />}
                </Button>
            </div>

            {children}

            <div className="h-[300px] rounded-lg overflow-hidden border border-gray-200 relative z-0">
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEvents onClick={(lat, lng) => {
                        onChange(lat, lng);
                        reverseGeocode(lat, lng);
                    }} />
                    <ChangeView center={mapCenter} />
                    {markerPosition && (
                        <Marker
                            position={markerPosition}
                            icon={DefaultIcon}
                            draggable={true}
                            eventHandlers={{
                                dragend: (e) => {
                                    const marker = e.target;
                                    const position = marker.getLatLng();
                                    onChange(position.lat, position.lng);
                                    reverseGeocode(position.lat, position.lng);
                                },
                            }}
                        />
                    )}
                </MapContainer>
            </div>
            <p className="text-[10px] text-gray-400 italic">
                * Klik pada peta atau geser marker untuk menentukan koordinat yang akurat.
            </p>
        </div>
    );
};
