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
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slideUp max-w-md';
      notification.innerHTML = `
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-green-200 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <h4 class="font-semibold">Upload Successful!</h4>
            <p class="text-sm text-green-100 mt-1">
              ${metadata.location ? `📍 GPS: ${metadata.location.latitude.toFixed(4)}, ${metadata.location.longitude.toFixed(4)}` : '📍 No GPS data found'}
            </p>
            <p class="text-xs text-green-200 mt-1">Ready for AI analysis</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 5000);
      
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
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Upload Section */}
        <div className="p-8 lg:p-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Upload Damage Image
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Drag and drop your image or click to browse
            </p>
          </div>
          
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="group border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 cursor-pointer relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%236366f1' fill-opacity='0.4'%3e%3ccircle cx='7' cy='7' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
              }}></div>
            </div>

            {loading ? (
              <div className="relative flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-200 border-t-blue-600 mb-4"></div>
                <span className="text-lg font-medium text-blue-600 dark:text-blue-400">Processing image...</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Extracting metadata and GPS data</span>
              </div>
            ) : (
              <div className="relative">
                <div className="mb-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Upload Your Image
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  Support for PNG, JPG, JPEG files up to 10MB
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span>📍 GPS data</span>
                  <span>•</span>
                  <span>📷 Camera info</span>
                  <span>•</span>
                  <span>🤖 AI ready</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {selectedImage && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4 flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Image processed successfully
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Ready for analysis and reporting
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !metadata}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit for Analysis</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 py-3 px-6 rounded-xl font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview and Metadata Section */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 lg:p-12">
          {previewUrl && (
            <>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Preview & Analysis
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Image processed with metadata extraction
                </p>
              </div>
              <div className="relative aspect-video bg-white dark:bg-zinc-800 rounded-xl overflow-hidden shadow-lg border border-zinc-200/50 dark:border-zinc-700/50 mb-6">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4">
                  <div className="bg-black/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                    Ready for AI
                  </div>
                </div>
              </div>
            </>
          )}

          {metadata && (
            <>
              <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-700/50">
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Extracted Metadata</span>
                  </h4>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Basic Info */}
                  <div>
                    <h5 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">File Information</h5>
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
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center space-x-2 mb-3">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span>GPS Location Found</span>
                      </h5>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Latitude:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-100">
                            {metadata.location.latitude.toFixed(6)}°
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Longitude:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-100">
                            {metadata.location.longitude.toFixed(6)}°
                          </span>
                        </div>
                        {metadata.location.altitude && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Altitude:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">
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
                      <h5 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Camera Information</h5>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {metadata.camera.make && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Make:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{metadata.camera.make}</span>
                          </div>
                        )}
                        {metadata.camera.model && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Model:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{metadata.camera.model}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp Info */}
                  {metadata.timestamp && (
                    <div>
                      <h5 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">Timestamps</h5>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {metadata.timestamp.dateTimeOriginal && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Captured:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">
                              {new Date(metadata.timestamp.dateTimeOriginal).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Modified:</span>
                          <span className="text-zinc-900 dark:text-zinc-100">
                            {metadata.lastModified.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!metadata.location && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <h6 className="text-sm font-medium text-amber-800 dark:text-amber-300">No GPS Data</h6>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Location data requires GPS-enabled device during capture
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}