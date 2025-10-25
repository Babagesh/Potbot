'use client';

import { useState, useEffect } from 'react';

interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  metadata: {
    location?: {
      latitude: number;
      longitude: number;
      altitude?: number;
    };
    dimensions?: {
      width: number;
      height: number;
    };
    camera?: {
      make?: string;
      model?: string;
    };
  };
}

export default function ImageHistory() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real application, you would fetch this from your backend
    // For now, we'll just show a placeholder
    const mockImages: UploadedImage[] = [];
    setImages(mockImages);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (images.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Upload History
        </h2>
        <div className="text-center py-8">
          <div className="text-zinc-400 dark:text-zinc-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">No images uploaded yet</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            Upload your first infrastructure damage image to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Upload History ({images.length})
      </h2>
      
      <div className="space-y-4">
        {images.map((image) => (
          <div key={image.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {image.originalName}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(image.uploadedAt).toLocaleString()}
                </p>
              </div>
              <span className="text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded">
                {formatFileSize(image.size)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {image.metadata.location && (
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Location:</span>
                  <div className="text-zinc-900 dark:text-zinc-100 font-mono">
                    {image.metadata.location.latitude.toFixed(6)}°, {image.metadata.location.longitude.toFixed(6)}°
                  </div>
                </div>
              )}
              
              {image.metadata.dimensions && (
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Dimensions:</span>
                  <div className="text-zinc-900 dark:text-zinc-100">
                    {image.metadata.dimensions.width} × {image.metadata.dimensions.height}
                  </div>
                </div>
              )}
              
              {image.metadata.camera && (
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Camera:</span>
                  <div className="text-zinc-900 dark:text-zinc-100">
                    {image.metadata.camera.make} {image.metadata.camera.model}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Ready for CV Processing
                </span>
                {image.metadata.location ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    GPS Data Available
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    No GPS Data
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}