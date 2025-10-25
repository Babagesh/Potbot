# Infrastructure Damage Reporter - Frontend

React/Next.js application for uploading and managing infrastructure damage images with automatic metadata extraction.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Project Structure

```
frontend/
├── app/
│   ├── components/           # React components
│   │   ├── ImageUpload.tsx   # Main upload component
│   │   ├── ImageHistory.tsx  # Upload history display
│   │   └── DamageTypesInfo.tsx # Damage classification info
│   ├── config/
│   │   └── backend.ts        # Backend endpoint configuration
│   ├── services/
│   │   └── backendService.ts # API service layer
│   ├── utils/
│   │   └── imageMetadata.ts  # Metadata extraction utilities
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── public/                   # Static assets
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## 🔧 Backend Integration

### Current Setup
- **Local API**: Uses Next.js API routes at `/api/upload`
- **Configuration**: Managed in `app/config/backend.ts`
- **Service Layer**: `app/services/backendService.ts` handles all API calls

### Switch to External Backend
1. Update `CURRENT_ENV` in `app/config/backend.ts`
2. Set your backend URL in the `PRODUCTION` config
3. Frontend automatically uses your backend API

See `../BACKEND_INTEGRATION.md` for detailed integration guide.

## 📊 Features

### Image Upload
- Drag-and-drop interface
- File type validation (PNG, JPG, JPEG)
- Size limit (10MB)
- Real-time preview

### Metadata Extraction
- **GPS Data**: Latitude, longitude, altitude from EXIF
- **Camera Info**: Device make, model, software
- **Timestamps**: Capture time and modification time
- **Image Properties**: Dimensions, file size, format

### User Interface
- Responsive design (mobile-friendly)
- Dark mode support
- Loading states and error handling
- Damage type information guide

## 🛠️ Key Components

### `ImageUpload.tsx`
Main component handling file upload, metadata extraction, and backend communication.

### `ImageHistory.tsx`
Displays previously uploaded images (currently placeholder - will connect to backend).

### `DamageTypesInfo.tsx`
Educational component showing supported damage types and severity levels.

### `backendService.ts`
Service layer managing all API communications with configurable endpoints.

## 🎨 Styling

- **TailwindCSS**: Utility-first CSS framework
- **Dark Mode**: Automatic theme switching support
- **Responsive**: Mobile-first responsive design
- **Components**: Reusable styled components

## 📝 Configuration

### Environment Variables
Create `.env.local` for configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### Backend Endpoints
Configured in `app/config/backend.ts`:
- Upload endpoint
- Processing endpoints
- Results endpoints
- History endpoints

## 🔍 Development

### Adding New Features
1. **New Components**: Add to `app/components/`
2. **API Integration**: Update `app/services/backendService.ts`
3. **Styling**: Use Tailwind classes
4. **Types**: Add to component interfaces

### Debugging
- Check browser console for metadata extraction logs
- Monitor network tab for API calls
- Use React Developer Tools for component state

## 📱 Mobile Support

- Responsive design works on all screen sizes
- Touch-friendly drag-and-drop
- Camera access for mobile image capture
- GPS metadata extraction from mobile photos

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy Options
- **Vercel**: Automatic deployment from Git
- **Netlify**: Static site deployment
- **Docker**: Container deployment
- **Traditional Hosting**: Upload build files

### Environment Setup
- Set production API URLs
- Configure environment variables
- Enable HTTPS for security
- Set up proper CORS origins

---

This frontend is production-ready and will seamlessly integrate with your backend once configured! 🎉