'use client';

export default function DamageTypesInfo() {
  const damageTypes = [
    {
      name: "Potholes",
      description: "Circular or oval-shaped holes in road surfaces",
      severity: ["Minor", "Moderate", "Severe"],
      icon: "🕳️"
    },
    {
      name: "Cracks",
      description: "Linear fractures in pavement or building surfaces",
      severity: ["Hairline", "Wide", "Structural"],
      icon: "⚡"
    },
    {
      name: "Surface Damage",
      description: "General wear, erosion, or surface deterioration",
      severity: ["Light", "Moderate", "Heavy"],
      icon: "🔨"
    },
    {
      name: "Water Damage",
      description: "Flooding, drainage issues, or water-related damage",
      severity: ["Minor", "Moderate", "Major"],
      icon: "💧"
    },
    {
      name: "Structural Issues",
      description: "Building damage, foundation problems, or structural defects",
      severity: ["Cosmetic", "Moderate", "Critical"],
      icon: "🏗️"
    },
    {
      name: "Utility Damage",
      description: "Damaged manholes, utility covers, or infrastructure",
      severity: ["Functional", "Damaged", "Hazardous"],
      icon: "⚙️"
    }
  ];

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Supported Damage Types
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        Our computer vision system is designed to identify and classify various types of infrastructure damage. 
        Upload images of any of the following damage types for automated analysis:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {damageTypes.map((damage) => (
          <div key={damage.name} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">{damage.icon}</span>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {damage.name}
              </h3>
            </div>
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              {damage.description}
            </p>
            
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Severity Levels:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {damage.severity.map((level) => (
                  <span
                    key={level}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Computer Vision Processing
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Images with GPS data will be prioritized for processing. Clear, well-lit images produce the best classification results. 
              The system analyzes damage type, severity, and provides location-based reporting for maintenance teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}