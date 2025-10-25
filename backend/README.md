# Infrastructure Damage Reporter - Backend

This is the backend API for the Infrastructure Damage Reporter application. It handles image uploads, metadata processing, and computer vision integration.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Server will run on:** `http://localhost:3001`

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/health` | Health check | ✅ Implemented |
| POST | `/api/v1/upload` | Upload image + metadata | ✅ Basic Implementation |
| POST | `/api/v1/process` | Trigger CV processing | 🔄 Placeholder |
| GET | `/api/v1/results/:id` | Get processing results | 🔄 Placeholder |
| GET | `/api/v1/history` | Get upload history | 🔄 Placeholder |

### Specialized Endpoints (TODO)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/v1/classify` | Damage classification | ⏳ Not Implemented |
| POST | `/api/v1/severity` | Severity assessment | ⏳ Not Implemented |
| GET | `/api/v1/locations` | Location-based queries | ⏳ Not Implemented |

## 📋 Current Implementation

### What's Working
- ✅ Basic Express server setup
- ✅ File upload handling with multer
- ✅ Image validation (type, size)
- ✅ Metadata parsing from frontend
- ✅ Proper response format matching frontend expectations
- ✅ Error handling and logging

### What Needs Implementation
- 🔄 Database integration for metadata storage
- 🔄 Computer vision model integration
- 🔄 Image processing pipeline
- 🔄 Queue system for CV processing
- 🔄 Authentication and authorization
- 🔄 Rate limiting and security
- 🔄 Logging and monitoring
- 🔄 Testing suite

## 🔧 Configuration

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development

# Database (add your database connection)
DATABASE_URL=your_database_connection_string

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Computer Vision API (if using external service)
CV_API_KEY=your_cv_api_key
CV_API_URL=your_cv_service_url

# Optional: Cloud Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_s3_bucket
```

## 🗃️ Database Schema (Suggested)

```sql
-- Images table
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    -- Metadata
    width INTEGER,
    height INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude DECIMAL(10, 2),
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    captured_at TIMESTAMP,
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    
    -- CV Results
    damage_type VARCHAR(50),
    severity VARCHAR(20),
    confidence DECIMAL(4, 3),
    analysis_results JSONB
);

-- Processing queue table
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID REFERENCES images(id),
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);
```

## 🤖 Computer Vision Integration

### Suggested Workflow

1. **Image Upload** → Store in database with status 'pending'
2. **Queue Processing** → Add to processing queue
3. **CV Analysis** → Process image with your ML models
4. **Store Results** → Update database with results
5. **Notify Frontend** → WebSocket or polling for results

### CV Processing Example

```javascript
// Example CV processing function
async function processImage(imageId, imagePath) {
  try {
    // 1. Load and preprocess image
    const image = await loadImage(imagePath);
    const preprocessed = await preprocessImage(image);
    
    // 2. Run damage detection model
    const damageDetection = await detectDamage(preprocessed);
    
    // 3. Run severity assessment
    const severityAssessment = await assessSeverity(preprocessed, damageDetection);
    
    // 4. Store results
    await storeResults(imageId, {
      damageType: damageDetection.type,
      severity: severityAssessment.level,
      confidence: damageDetection.confidence,
      boundingBoxes: damageDetection.boxes,
      analysis: {
        description: generateDescription(damageDetection, severityAssessment),
        recommendations: generateRecommendations(severityAssessment)
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('CV processing failed:', error);
    await markProcessingFailed(imageId, error.message);
    return { success: false, error: error.message };
  }
}
```

## 📦 Dependencies

### Core Dependencies
- **express**: Web framework
- **multer**: File upload handling
- **cors**: CORS middleware
- **uuid**: Unique ID generation

### Recommended Additions
- **pg/mongoose**: Database ORM
- **bull**: Job queue for processing
- **winston**: Logging
- **helmet**: Security middleware
- **rate-limiter-flexible**: Rate limiting
- **joi**: Request validation
- **jsonwebtoken**: Authentication

## 🔒 Security Considerations

1. **File Validation**: Check file type, size, content
2. **Virus Scanning**: Scan uploads for malware
3. **Rate Limiting**: Prevent abuse
4. **Authentication**: Secure API access
5. **Input Sanitization**: Validate all inputs
6. **HTTPS**: Use SSL in production
7. **File Storage**: Secure file access permissions

## 🚀 Deployment

### Docker Setup
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure proper database connection
- Set up cloud storage (S3, GCS, etc.)
- Configure logging and monitoring
- Set up proper CORS origins

## 📈 Next Steps

1. **Choose Database**: PostgreSQL, MongoDB, etc.
2. **Implement CV Models**: Integrate your damage detection models
3. **Add Authentication**: JWT, OAuth, or API keys
4. **Set up Queue System**: Redis + Bull for processing
5. **Add Monitoring**: Logging, metrics, health checks
6. **Write Tests**: Unit and integration tests
7. **Deploy**: Docker, AWS, GCP, or Azure

---

This backend is ready to be customized for your specific computer vision models and infrastructure requirements! 🚀