'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { PhotoIageRecord, PipelineMarker, mapRecordToMarker } from '../types/database';

// Dynamically import the Map component to avoid SSR issues with Google Maps
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-lg" />
});

// MarkerStatus is already defined in our database types file

// San Francisco geographic boundaries - for filtering data
const SF_MIN_LAT = 37.70;
const SF_MAX_LAT = 37.84;
const SF_MIN_LNG = -122.52;
const SF_MAX_LNG = -122.35;

// Fallback data in case no records are found in Supabase
const fallbackData: PipelineMarker[] = [
  {
    id: 'example-1',
    position: { lat: 37.7749, lng: -122.4194 },
    title: 'Example Road Crack',
    status: 'completed',
    info: 'This is an example marker showing how reports appear on the map.'
  }
];

export default function MapPage() {
  const [pipelineMarkers, setPipelineMarkers] = useState<PipelineMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchPipelineData() {
      try {
        setLoading(true);
        
        // Fetch data from Supabase
        const { data, error } = await supabase
          .from('PhotoIage')
          .select('*')
          // Filter to only include records in San Francisco area
          .gte('latitude', SF_MIN_LAT)
          .lte('latitude', SF_MAX_LAT)
          .gte('longitude', SF_MIN_LNG)
          .lte('longitude', SF_MAX_LNG);
        
        if (error) {
          console.error('Error fetching data:', error);
          setError('Failed to load map data');
          // Use fallback data if there's an error
          setPipelineMarkers(fallbackData);
          return;
        }
        
        if (data && data.length > 0) {
          // Map database records to map markers
          const markers: PipelineMarker[] = data.map((record: PhotoIageRecord) => 
            mapRecordToMarker(record)
          );
          setPipelineMarkers(markers);
        } else {
          console.log('No data found in Supabase, using fallback data');
          setPipelineMarkers(fallbackData);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
        setPipelineMarkers(fallbackData);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPipelineData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            San Francisco Infrastructure Map
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
          
          {loading ? (
            <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <p className="text-lg font-medium text-gray-500">Loading map data...</p>
            </div>
          ) : error ? (
            <div className="w-full h-[600px] bg-red-50 rounded-lg flex items-center justify-center">
              <p className="text-lg font-medium text-red-500">{error}</p>
            </div>
          ) : (
            <Map 
              markers={pipelineMarkers} 
              zoom={13} // Higher zoom level for San Francisco
            />
          )}
        </div>
        
        <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Infrastructure Issues in San Francisco</h2>
          
          {loading ? (
            <div className="py-8 text-center">
              <p>Loading data...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : pipelineMarkers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No infrastructure issues found in the database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issue Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
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
                      <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        ({marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
