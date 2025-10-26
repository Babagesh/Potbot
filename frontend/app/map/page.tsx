'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the Map component to avoid SSR issues with Google Maps
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-lg" />
});

// Define types to match the Map component props
type MarkerStatus = 'pending' | 'in_progress' | 'completed';

interface PipelineMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  status: MarkerStatus;
  info: string;
}

// Mock data for demonstration - replace with your actual pipeline data
const mockPipelineData: PipelineMarker[] = [
  {
    id: '1',
    position: { lat: 37.7749, lng: -122.4194 },
    title: 'San Francisco Pipeline',
    status: 'completed',
    info: 'Image processing completed successfully. Identified 3 damage points.'
  },
  {
    id: '2',
    position: { lat: 37.8044, lng: -122.2711 },
    title: 'Oakland Pipeline',
    status: 'in_progress',
    info: 'Image analysis in progress. 45% complete.'
  },
  {
    id: '3',
    position: { lat: 37.3352, lng: -121.8811 },
    title: 'San Jose Pipeline',
    status: 'pending',
    info: 'Waiting for analysis to begin.'
  }
];

export default function MapPage() {
  const [pipelineMarkers, setPipelineMarkers] = useState(mockPipelineData);
  
  // In a real app, you would fetch your pipeline data here
  useEffect(() => {
    // Example of how you might fetch real pipeline data
    // async function fetchPipelineData() {
    //   const response = await fetch('/api/pipelines');
    //   const data = await response.json();
    //   setPipelineMarkers(data);
    // }
    // fetchPipelineData();

    // For demo, we're using the mock data directly
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Pipeline Progress Map
          </h1>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">Pending</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">In Progress</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">Completed</span>
            </div>
          </div>
          
          <Map 
            markers={pipelineMarkers} 
            zoom={6}
          />
        </div>
        
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Pipeline Status</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pipelineMarkers.map((marker) => (
                  <tr key={marker.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {marker.title}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        marker.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        marker.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {marker.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {marker.info}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
