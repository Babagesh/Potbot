// Backend server for Infrastructure Damage Reporter
// This is a placeholder - implement your team's backend here

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Upload endpoint - matches the frontend expectation
app.post('/api/v1/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const metadata = JSON.parse(req.body.metadata || '{}');
    const imageId = uuidv4();

    // Simulate response format expected by frontend
    const response = {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: imageId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        type: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
        metadata: metadata,
        processingStatus: 'pending'
      }
    };

    console.log('Image uploaded:', {
      id: imageId,
      filename: req.file.filename,
      hasGPS: !!metadata.location,
      location: metadata.location
    });

    // TODO: Add to processing queue for computer vision
    // TODO: Store metadata in database
    // TODO: Trigger CV processing

    res.status(201).json(response);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Computer Vision Processing endpoint
app.post('/api/v1/process', (req, res) => {
  const { imageId } = req.body;
  
  // TODO: Implement CV processing
  // This would trigger your computer vision models
  
  res.json({
    success: true,
    message: 'Processing started',
    imageId: imageId,
    status: 'processing'
  });
});

// Get processing results
app.get('/api/v1/results/:imageId', (req, res) => {
  const { imageId } = req.params;
  
  // TODO: Fetch results from database
  
  res.json({
    id: imageId,
    status: 'completed',
    damageType: 'pothole', // Example result
    severity: 'moderate',
    confidence: 0.89,
    analysis: {
      description: 'Medium-sized pothole detected',
      recommendations: ['Schedule repair within 30 days']
    },
    processedAt: new Date().toISOString()
  });
});

// Get upload history
app.get('/api/v1/history', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  // TODO: Fetch from database
  
  res.json({
    data: [],
    total: 0,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/v1/`);
  console.log(`💡 This is a basic implementation - customize for your needs`);
});

module.exports = app;