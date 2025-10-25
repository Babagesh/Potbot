import ImageUpload from './components/ImageUpload';
import ImageHistory from './components/ImageHistory';
import DamageTypesInfo from './components/DamageTypesInfo';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Infrastructure Damage Reporter
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Upload images of infrastructure damage like potholes, cracks, or other issues. 
            We'll extract location data and prepare it for computer vision analysis.
          </p>
        </div>
        
        <div className="space-y-8">
          <ImageUpload />
          <DamageTypesInfo />
          <ImageHistory />
        </div>
      </div>
    </div>
  );
}
