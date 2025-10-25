import { parse } from 'exifr';

interface ImageMetadata {
  filename: string;
  size: number;
  type: string;
  lastModified: Date;
  dimensions?: {
    width: number;
    height: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  camera?: {
    make?: string;
    model?: string;
    software?: string;
  };
  timestamp?: {
    dateTime?: string;
    dateTimeOriginal?: string;
  };
  exif?: any;
}

export async function extractMetadata(file: File): Promise<ImageMetadata> {
  const metadata: ImageMetadata = {
    filename: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
  };

  try {
    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      metadata.dimensions = dimensions;
    }

    // Extract EXIF data
    const exifData = await parse(file, {
      gps: true,
      pick: [
        'latitude', 'longitude', 'altitude',
        'Make', 'Model', 'Software',
        'DateTime', 'DateTimeOriginal', 'CreateDate',
        'ExifImageWidth', 'ExifImageHeight',
        'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
        'GPSLatitudeRef', 'GPSLongitudeRef'
      ]
    });

    if (exifData) {
      metadata.exif = exifData;

      // Extract location data
      if (exifData.latitude && exifData.longitude) {
        metadata.location = {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          altitude: exifData.altitude || undefined,
        };
      }

      // Extract camera information
      if (exifData.Make || exifData.Model || exifData.Software) {
        metadata.camera = {
          make: exifData.Make,
          model: exifData.Model,
          software: exifData.Software,
        };
      }

      // Extract timestamp information
      if (exifData.DateTimeOriginal || exifData.DateTime || exifData.CreateDate) {
        metadata.timestamp = {
          dateTimeOriginal: exifData.DateTimeOriginal || exifData.CreateDate,
          dateTime: exifData.DateTime,
        };
      }

      // Override dimensions from EXIF if available and more accurate
      if (exifData.ExifImageWidth && exifData.ExifImageHeight) {
        metadata.dimensions = {
          width: exifData.ExifImageWidth,
          height: exifData.ExifImageHeight,
        };
      }
    }
  } catch (error) {
    console.warn('Could not extract EXIF data:', error);
    // Continue without EXIF data - we still have basic file metadata
  }

  return metadata;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert GPS coordinates from degrees, minutes, seconds to decimal degrees
 */
export function convertDMSToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: 'N' | 'S' | 'E' | 'W'
): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
}

/**
 * Format coordinates for display
 */
export function formatCoordinate(coordinate: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat' 
    ? (coordinate >= 0 ? 'N' : 'S')
    : (coordinate >= 0 ? 'E' : 'W');
  
  const abs = Math.abs(coordinate);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = ((abs - degrees) * 60 - minutes) * 60;
  
  return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}