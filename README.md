# Infrastructure Damage Reporter

A full-stack application for uploading and processing images of infrastructure damage (potholes, cracks, etc.) with automatic metadata extraction, GPS location data, and computer vision processing.

## 🏗️ Project Structure

```
infrastructure-damage-reporter/
├── frontend/                 # Next.js React application
│   ├── app/                 # App router pages and components
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── next.config.ts       # Next.js configuration
├── backend/                 # Express.js API server
│   ├── src/                 # Backend source code
│   ├── package.json         # Backend dependencies
│   └── README.md            # Backend documentation
├── package.json             # Root workspace configuration
└── BACKEND_INTEGRATION.md   # Integration guide
```

## 🚀 Quick Start

### Option 1: Run Frontend Only (Current Setup)
```bash
# Install and run frontend
npm run dev:frontend
```
Navigate to [http://localhost:3000](http://localhost:3000)

### Option 2: Run Both Frontend and Backend
```bash
# Install all dependencies
npm install

# Run frontend (port 3000)
npm run dev:frontend

# In another terminal, run backend (port 3001)
npm run dev:backend
```

### Option 3: Full Development Setup
```bash
# Install frontend dependencies
npm run install:frontend

# Install backend dependencies  
npm run install:backend

# Run both simultaneously
npm run dev:frontend & npm run dev:backend
```

## ✨ Features

### Frontend (Next.js)
- **Image Upload**: Drag-and-drop or click to upload infrastructure damage images
- **Metadata Extraction**: Automatically extracts EXIF data including:
  - GPS coordinates (latitude, longitude, altitude)
  - Camera information (make, model, software) 
  - Image dimensions and file information
  - Timestamp data
- **Real-time Preview**: Live preview of uploaded images
- **Damage Type Guide**: Information about supported damage categories
- **Responsive Design**: Works on desktop and mobile devices

### Backend (Express.js)
- **REST API**: Complete API for image upload and processing
- **File Upload**: Secure image upload with validation
- **Metadata Processing**: Parse and store image metadata
- **Computer Vision Ready**: Framework for CV model integration
- **Queue System**: Ready for processing pipeline integration

## 🛠️ Technologies Used

### Frontend
- **Next.js 16.0**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **exifr**: EXIF metadata extraction library

### Backend
- **Express.js**: Web framework for Node.js
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **UUID**: Unique identifier generation

## 📋 Available Scripts

```bash
# Frontend commands
npm run dev:frontend          # Start frontend development server
npm run build:frontend        # Build frontend for production
npm run start:frontend        # Start frontend production server
npm run lint:frontend         # Lint frontend code

# Backend commands  
npm run dev:backend           # Start backend development server
npm run build:backend         # Build backend for production
npm run start:backend         # Start backend production server
npm run lint:backend          # Lint backend code

# Combined commands
npm run dev                   # Start frontend only (default)
npm run build                 # Build frontend
npm run lint                  # Lint both frontend and backend
npm run clean                 # Clean all build artifacts and node_modules
```

## Usage

1. **Upload an Image**: 
   - Click the upload area or drag and drop an image
   - Supported formats: PNG, JPG, JPEG (max 10MB)

2. **View Metadata**: 
   - GPS location data (if available in EXIF)
   - Camera information
   - Image dimensions and file details
   - Timestamps

3. **Send to Backend**: 
   - Click "Send to Backend" to process the image
   - Data is saved locally and prepared for CV analysis

## API Endpoints

### POST `/api/upload`
Uploads an image with metadata extraction.

**Request:**
- `image`: File (multipart/form-data)
- `metadata`: JSON string with extracted metadata

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": "unique-id",
    "filename": "processed-filename.jpg",
    "originalName": "original-filename.jpg",
    "path": "/path/to/file",
    "size": 1234567,
    "type": "image/jpeg",
    "uploadedAt": "2025-01-01T00:00:00.000Z",
    "metadata": {
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "camera": {
        "make": "Apple",
        "model": "iPhone 15 Pro"
      }
    }
  }
}
```

## File Structure

```
app/
├── components/
│   ├── ImageUpload.tsx      # Main upload component
│   └── ImageHistory.tsx     # Upload history display
├── utils/
│   └── imageMetadata.ts     # Metadata extraction utilities
├── api/
│   └── upload/
│       └── route.ts         # Upload API endpoint
├── globals.css              # Global styles
├── layout.tsx               # Root layout
└── page.tsx                 # Home page
```

## Key Features Explained

### GPS Data Extraction
The app automatically extracts GPS coordinates from image EXIF data when available. This is crucial for:
- Mapping damage locations
- Creating geographic damage reports
- Routing repair crews efficiently

### Computer Vision Preparation
Images are processed and stored in a format ready for CV analysis:
- Standardized metadata format
- Unique file identification
- Location correlation for training data

### Metadata Utilities
The `imageMetadata.ts` utility provides:
- EXIF data parsing
- GPS coordinate conversion
- Distance calculations between coordinates
- Coordinate formatting functions

## Next Steps for Computer Vision Integration

1. **Add Image Classification API**: Create endpoints for damage type classification
2. **Severity Assessment**: Implement severity rating algorithms
3. **Batch Processing**: Add queue system for processing multiple images
4. **Database Integration**: Store metadata and classifications in a database
5. **Map Integration**: Display damage locations on interactive maps
6. **Reporting Dashboard**: Create admin dashboard for damage reports

## Environment Variables

Create a `.env.local` file for configuration:
```env
# Optional: Configure upload directory
UPLOAD_DIR=./uploads

# Optional: Configure maximum file size (bytes)
MAX_FILE_SIZE=10485760

# Optional: Database connection for storing metadata
DATABASE_URL=your_database_url
```

## Development

- **Linting**: `npm run lint`
- **Building**: `npm run build`
- **Type checking**: Built-in with TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.
