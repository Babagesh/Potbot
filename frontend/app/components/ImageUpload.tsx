'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { extractMetadata } from '../utils/imageMetadata';

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

export default function ImageUpload() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      setSelectedImage(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Extract metadata
      const extractedMetadata = await extractMetadata(file);
      setMetadata(extractedMetadata);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the image');
      setSelectedImage(null);
      setPreviewUrl(null);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!selectedImage || !metadata) return;

    setLoading(true);
    try {
      // Direct upload to FastAPI backend
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      // Add GPS coordinates if available
      if (metadata.location) {
        formData.append('latitude', metadata.location.latitude.toString());
        formData.append('longitude', metadata.location.longitude.toString());
      } else {
        formData.append('latitude', '0');
        formData.append('longitude', '0');
      }

      const response = await fetch('http://127.0.0.1:8000/api/submit-civic-issue', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      alert(`Image uploaded successfully! 
        ${result.message}
        ${metadata.location ? `Location: ${metadata.location.latitude.toFixed(6)}, ${metadata.location.longitude.toFixed(6)}` : 'No location data'}`);
      
      // Reset form after successful upload
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setMetadata(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Upload Image
          </h2>
          
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-zinc-600 dark:text-zinc-400">Processing...</span>
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  PNG, JPG, JPEG up to 10MB
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {selectedImage && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Image uploaded successfully
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !metadata}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  {loading ? 'Processing...' : 'Send to Backend'}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview and Metadata Section */}
        <div className="space-y-4">
          {previewUrl && (
            <>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Image Preview
              </h3>
              <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-700 rounded-lg overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            </>
          )}

          {metadata && (
            <>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Image Metadata
              </h3>
              <div className="bg-zinc-50 dark:bg-zinc-700 rounded-lg p-4 space-y-3">
                {/* Basic Info */}
                <div>
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Filename:</span>
                      <span className="ml-1 text-zinc-900 dark:text-zinc-100">{metadata.filename}</span>
                    </div>
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Size:</span>
                      <span className="ml-1 text-zinc-900 dark:text-zinc-100">
                        {(metadata.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 dark:text-zinc-400">Type:</span>
                      <span className="ml-1 text-zinc-900 dark:text-zinc-100">{metadata.type}</span>
                    </div>
                    {metadata.dimensions && (
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Dimensions:</span>
                        <span className="ml-1 text-zinc-900 dark:text-zinc-100">
                          {metadata.dimensions.width} × {metadata.dimensions.height}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Info */}
                {metadata.location && (
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">📍 Location Data</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Latitude:</span>
                        <span className="ml-1 text-zinc-900 dark:text-zinc-100 font-mono">
                          {metadata.location.latitude.toFixed(6)}°
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Longitude:</span>
                        <span className="ml-1 text-zinc-900 dark:text-zinc-100 font-mono">
                          {metadata.location.longitude.toFixed(6)}°
                        </span>
                      </div>
                      {metadata.location.altitude && (
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">Altitude:</span>
                          <span className="ml-1 text-zinc-900 dark:text-zinc-100">
                            {metadata.location.altitude.toFixed(1)}m
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Camera Info */}
                {metadata.camera && Object.keys(metadata.camera).length > 0 && (
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">📷 Camera Information</h4>
                    <div className="space-y-1 text-sm">
                      {metadata.camera.make && (
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">Make:</span>
                          <span className="ml-1 text-zinc-900 dark:text-zinc-100">{metadata.camera.make}</span>
                        </div>
                      )}
                      {metadata.camera.model && (
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">Model:</span>
                          <span className="ml-1 text-zinc-900 dark:text-zinc-100">{metadata.camera.model}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamp Info */}
                {metadata.timestamp && (
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">🕒 Timestamp</h4>
                    <div className="space-y-1 text-sm">
                      {metadata.timestamp.dateTimeOriginal && (
                        <div>
                          <span className="text-zinc-600 dark:text-zinc-400">Date Taken:</span>
                          <span className="ml-1 text-zinc-900 dark:text-zinc-100">
                            {new Date(metadata.timestamp.dateTimeOriginal).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-zinc-600 dark:text-zinc-400">Last Modified:</span>
                        <span className="ml-1 text-zinc-900 dark:text-zinc-100">
                          {metadata.lastModified.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!metadata.location && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ No GPS location data found in this image. Location data is only available if the camera had GPS enabled when the photo was taken.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}