import { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

// San Francisco boundaries (approximate)
const SF_BOUNDS = {
  north: 37.84,   // North boundary (Marin County line)
  south: 37.70,   // South boundary (San Mateo County line)
  west: -122.52,  // West boundary (Pacific Ocean)
  east: -122.35,  // East boundary (San Francisco Bay)
};

// San Francisco center coordinates
const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

interface MapProps {
  // Default center location (can be overridden by markers)
  defaultCenter?: { lat: number; lng: number };
  // Map zoom level
  zoom?: number;
  // Optional markers to show on the map
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    status?: 'pending' | 'in_progress' | 'completed';
    info?: string;
    imageUrl?: string;
  }>;
}

// Default map container style
const containerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '12px',
};

// Map component using Google Maps API
export default function Map({
  defaultCenter = SF_CENTER, // Default to San Francisco
  zoom = 13, // Higher zoom level for San Francisco
  markers = [],
}: MapProps) {
  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Handle map load
  const onLoad = useCallback(function callback(map: google.maps.Map) {
    // Restrict the map to San Francisco bounds
    map.setOptions({
      restriction: {
        latLngBounds: SF_BOUNDS,
        strictBounds: false, // Allow slight panning outside bounds
      }
    });
    
    setMap(map);
  }, []);

  // Handle map unmount
  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Define marker colors based on status
  const getMarkerIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
      case 'in_progress':
        return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
      case 'pending':
      default:
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  };

  if (!isLoaded) {
    return <div className="p-12 text-center">Loading Maps...</div>;
  }

  return (
    <div className="map-container w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          // San Francisco style options
          styles: [
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }, { lightness: 20 }]
            },
            {
              featureType: "road.highway",
              elementType: "geometry.fill",
              stylers: [{ color: "#ffffff" }, { lightness: 17 }]
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#3273dc" }, { lightness: 50 }, { weight: 1.2 }]
            }
          ],
          // Restrict to San Francisco
          restriction: {
            latLngBounds: SF_BOUNDS,
            strictBounds: false
          },
        }}
      >
        {/* Render markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            title={marker.title}
            icon={getMarkerIcon(marker.status)}
            onClick={() => setSelectedMarker(marker.id)}
          />
        ))}

        {/* Render info windows for selected marker */}
        {selectedMarker && markers.find(m => m.id === selectedMarker)?.info && (
          <InfoWindow
            position={markers.find(m => m.id === selectedMarker)!.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-gray-900">
                {markers.find(m => m.id === selectedMarker)?.title}
              </h3>
              
              {/* Display the image if available */}
              {markers.find(m => m.id === selectedMarker)?.imageUrl && (
                <div className="my-2">
                  <img 
                    src={markers.find(m => m.id === selectedMarker)?.imageUrl} 
                    alt="Issue Image" 
                    className="w-full h-24 object-cover rounded-md mb-2" 
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-700">
                {markers.find(m => m.id === selectedMarker)?.info}
              </p>
              <div className="mt-2 text-xs inline-block px-2 py-1 rounded-full" 
                   style={{
                     backgroundColor: 
                       markers.find(m => m.id === selectedMarker)?.status === 'completed' ? 'rgb(34, 197, 94)' :
                       markers.find(m => m.id === selectedMarker)?.status === 'in_progress' ? 'rgb(234, 179, 8)' :
                       'rgb(239, 68, 68)',
                     color: 'white'
                   }}>
                {markers.find(m => m.id === selectedMarker)?.status || 'pending'}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
