import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const metadataString = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Parse metadata
    let metadata;
    try {
      metadata = JSON.parse(metadataString);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid metadata format' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file to disk
    const filePath = path.join(uploadsDir, uniqueFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create response data
    const responseData = {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: uuidv4(),
        filename: uniqueFilename,
        originalName: file.name,
        path: filePath,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        metadata: metadata,
      }
    };

    // Log the upload for monitoring
    console.log('Image uploaded:', {
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      hasLocation: !!metadata.location,
      location: metadata.location,
      uploadedAt: responseData.data.uploadedAt,
    });

    // In a real application, you might want to:
    // 1. Save the metadata to a database
    // 2. Add the image to a processing queue for computer vision analysis
    // 3. Send notifications to relevant services
    // 4. Validate the GPS coordinates
    // 5. Store the image in cloud storage (AWS S3, Google Cloud, etc.)

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}