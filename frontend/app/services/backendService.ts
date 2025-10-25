// Backend API Service
// File: app/services/backendService.ts

import { getCurrentConfig } from '../config/backend';

export interface ImageMetadata {
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
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    filename: string;
    originalName: string;
    path?: string;
    size: number;
    type: string;
    uploadedAt: string;
    metadata: ImageMetadata;
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

export interface ProcessingResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  damageType?: string;
  severity?: string;
  confidence?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  analysis?: {
    description: string;
    recommendations?: string[];
    estimatedCost?: number;
  };
  processedAt?: string;
}

class BackendService {
  private config = getCurrentConfig();

  /**
   * Upload image with metadata to backend
   */
  async uploadImage(file: File, metadata: ImageMetadata): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${this.config.baseUrl}${this.config.uploadEndpoint}`, {
      method: 'POST',
      body: formData,
      // Add headers if needed for your backend
      // headers: {
      //   'Authorization': 'Bearer your-token',
      //   'X-API-Key': 'your-api-key',
      // },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Trigger computer vision processing for an uploaded image
   */
  async processImage(imageId: string): Promise<ProcessingResult> {
    if (!this.config.processEndpoint) {
      throw new Error('Process endpoint not configured');
    }

    const response = await fetch(`${this.config.baseUrl}${this.config.processEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers as needed
      },
      body: JSON.stringify({ imageId }),
    });

    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get processing results for an image
   */
  async getResults(imageId: string): Promise<ProcessingResult> {
    if (!this.config.resultsEndpoint) {
      throw new Error('Results endpoint not configured');
    }

    const response = await fetch(
      `${this.config.baseUrl}${this.config.resultsEndpoint}/${imageId}`,
      {
        headers: {
          // Add authentication headers as needed
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get upload history
   */
  async getHistory(limit = 50, offset = 0): Promise<UploadResponse[]> {
    if (!this.config.historyEndpoint) {
      throw new Error('History endpoint not configured');
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(
      `${this.config.baseUrl}${this.config.historyEndpoint}?${params}`,
      {
        headers: {
          // Add authentication headers as needed
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Classify damage type using specialized endpoint
   */
  async classifyDamage(imageId: string): Promise<{ type: string; confidence: number }> {
    if (!this.config.damageClassifyEndpoint) {
      throw new Error('Damage classification endpoint not configured');
    }

    const response = await fetch(
      `${this.config.baseUrl}${this.config.damageClassifyEndpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId }),
      }
    );

    if (!response.ok) {
      throw new Error(`Classification failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Assess damage severity
   */
  async assessSeverity(imageId: string): Promise<{ severity: string; score: number }> {
    if (!this.config.severityEndpoint) {
      throw new Error('Severity assessment endpoint not configured');
    }

    const response = await fetch(
      `${this.config.baseUrl}${this.config.severityEndpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageId }),
      }
    );

    if (!response.ok) {
      throw new Error(`Severity assessment failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get damage reports by location
   */
  async getLocationReports(
    latitude: number,
    longitude: number,
    radius = 1000 // meters
  ): Promise<ProcessingResult[]> {
    if (!this.config.locationEndpoint) {
      throw new Error('Location endpoint not configured');
    }

    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      radius: radius.toString(),
    });

    const response = await fetch(
      `${this.config.baseUrl}${this.config.locationEndpoint}?${params}`,
      {
        headers: {
          // Add authentication headers as needed
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch location reports: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }
}

// Export singleton instance
export const backendService = new BackendService();

// Export helper functions for easy endpoint switching
export const switchToProduction = () => {
  // You would update the config here or reload the service
  console.log('Switching to production backend...');
  // In a real app, you might want to reload the page or reinitialize the service
};

export const switchToStaging = () => {
  console.log('Switching to staging backend...');
  // Similar implementation
};