# SnapDev/Cofoundry.AI Deployment Guide

## 1. Overview

This guide provides comprehensive instructions for deploying the application, which consists of two main services that must be deployed separately on SnapDev:

- **Frontend Service**: A Next.js application responsible for the user interface.
- **Backend Service**: A Python FastAPI application that handles the core business logic.

Both services must be deployed and configured correctly for the application to function as expected.

---

## 2. Backend Service Configuration

The backend is a Python application built with the FastAPI framework. It requires a Python environment and several dependencies to run.

- **Service Type**: `Web Service`
- **Runtime**: `Python`
- **Root Directory**: `backend`

### Build and Start Commands

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8081`

### Port Configuration

The backend service must be configured to listen on port `8081`. Ensure that this port is exposed and accessible for the frontend service to communicate with it.

### Environment Variables

The following environment variables must be set in the deployment environment:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | API key for Groq Vision API. | `your_groq_api_key_here` |
| `CONFIDENCE_THRESHOLD` | Minimum confidence level for issue reporting (0.0 to 1.0). | `0.6` |
| `BRIGHTDATA_API_KEY` | API key for BrightData services. | `your_brightdata_api_key_here` |
| `BRIGHTDATA_DATASET_ID` | Dataset ID for Google SERP (optional). | `gd_mfz5x93lmsjjjylob` |

---

## 3. Frontend Service Configuration

The frontend is a modern web application built with Next.js. It requires a Node.js environment to build and run.

- **Service Type**: `Web Service`
- **Runtime**: `Node.js`
- **Root Directory**: `frontend`

### Build and Start Commands

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### Port Configuration

The frontend service runs on the default Next.js port `3000`.

### Environment Variables

The following environment variables must be set in the deployment environment. Remember to prefix all variables with `NEXT_PUBLIC_` to make them accessible in the browser.

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL for the Supabase project. | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| The anonymous key for the Supabase project. | `your_supabase_anon_key` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`| API key for Google Maps. | `your_google_maps_api_key` |
| `NEXT_PUBLIC_BACKEND_URL` | The public URL of the deployed backend service. | `http://your-backend-service-url` |
| `NEXT_PUBLIC_ENV` | The deployment environment. | `production` |
| `NEXT_PUBLIC_ENABLE_MAP_VIEW` | Feature flag to enable the map view. | `true` |
| `NEXT_PUBLIC_ENABLE_STATUS_TRACKING`| Feature flag to enable status tracking. | `true` |
| `NEXT_PUBLIC_ENABLE_SOCIAL_SHARING`| Feature flag to enable social sharing. | `false` |

---

## 4. Post-Deployment Verification

After deploying both services, follow these steps to ensure the application is running correctly:

1. **Health Checks**:
   - Access the backend's health check endpoint at `{BACKEND_URL}/health` to verify it returns a `{"status": "OK"}` response.
   - Open the frontend URL in a browser to confirm the application loads without errors.

2. **Functionality Testing**:
   - Upload an image and submit a report to test the end-to-end pipeline.
   - Verify that the report appears on the map and in the reports list.
   - Check the service logs for any errors or unexpected behavior.

---

## 5. Common Troubleshooting Tips

- **CORS Errors**: If the frontend cannot communicate with the backend, check that the `NEXT_PUBLIC_BACKEND_URL` is correctly configured and that the backend service is running.
- **502 Bad Gateway**: This error usually indicates a problem with the backend service. Check its logs to diagnose the issue.
- **Missing Environment Variables**: If parts of the application are not working, verify that all required environment variables are set for both services.