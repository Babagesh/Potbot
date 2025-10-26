export interface PhotoIageRecord {
  id?: number;
  created_at?: string;
  tracking_id: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  location_address?: string;
  image_url?: string;
  twitter_url?: string;
}

export type MarkerStatus = 'pending' | 'in_progress' | 'completed';

export interface PipelineMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  status: MarkerStatus;
  info: string;
  imageUrl?: string;
}

// Map database records to map markers
export function mapRecordToMarker(record: PhotoIageRecord): PipelineMarker {
  // Derive status based on various fields - customize based on your logic
  let status: MarkerStatus = 'pending';
  
  // This is just an example - you might want to determine status differently
  if (record.twitter_url) {
    status = 'completed';
  } else if (record.location_address) {
    status = 'in_progress';
  }
  
  return {
    id: record.tracking_id,
    position: { lat: record.latitude, lng: record.longitude },
    title: record.category || 'Infrastructure Issue',
    status: status,
    info: record.description || '',
    imageUrl: record.image_url
  };
}
