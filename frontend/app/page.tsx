import ImageUpload from './components/ImageUpload';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
            Infrastructure Damage Reporter
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed">
            Upload any infrastructure damage image for automated analysis and reporting. 
            Our system extracts location data and prepares your images for computer vision processing.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ImageUpload />
          
          {/* Floating help text */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-full px-6 py-3 shadow-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Upload any infrastructure damage image • GPS data extracted automatically</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
