// Backend Configuration Guide
// File: app/config/backend.ts

interface BackendEndpoints {
  baseUrl: string;
  uploadEndpoint: string;
  processEndpoint?: string;
  resultsEndpoint?: string;
  historyEndpoint?: string;
  damageClassifyEndpoint?: string;
  severityEndpoint?: string;
  locationEndpoint?: string;
}

export const BACKEND_CONFIG = {
  // Current setup (local Next.js API)
  CURRENT: {
    uploadEndpoint: '/api/upload',
    baseUrl: 'http://localhost:3000',
  } as BackendEndpoints,
  
  // Your future backend endpoints - Update these when ready
  PRODUCTION: {
    // Replace with your actual backend URL
    baseUrl: 'https://your-backend-api.com',
    
    // Computer Vision Processing Endpoints
    uploadEndpoint: '/api/v1/upload',           // Image upload with metadata
    processEndpoint: '/api/v1/process',         // Trigger CV processing
    resultsEndpoint: '/api/v1/results',         // Get processing results
    historyEndpoint: '/api/v1/history',         // Get upload history
    
    // Optional: Specialized endpoints
    damageClassifyEndpoint: '/api/v1/classify', // Damage classification
    severityEndpoint: '/api/v1/severity',       // Severity assessment
    locationEndpoint: '/api/v1/locations',      // Location-based queries
  } as BackendEndpoints,
  
  // Development/Staging
  STAGING: {
    baseUrl: 'https://staging-api.your-domain.com',
    uploadEndpoint: '/api/v1/upload',
    processEndpoint: '/api/v1/process',
    resultsEndpoint: '/api/v1/results',
    historyEndpoint: '/api/v1/history',
  } as BackendEndpoints
};

// Current environment - change this when switching backends
export const CURRENT_ENV: keyof typeof BACKEND_CONFIG = 'CURRENT'; // Change to 'PRODUCTION' or 'STAGING'

export const getCurrentConfig = (): BackendEndpoints => {
  return BACKEND_CONFIG[CURRENT_ENV];
};

export const getEndpoint = (endpoint: keyof BackendEndpoints): string => {
  const config = getCurrentConfig();
  const endpointPath = config[endpoint];
  
  if (!endpointPath) {
    throw new Error(`Endpoint '${endpoint}' not configured for environment '${CURRENT_ENV}'`);
  }
  
  return endpoint === 'baseUrl' ? endpointPath : `${config.baseUrl}${endpointPath}`;
};