import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { App } from '../../types/app';
import { AppCard } from './AppCard';
import { SearchBar } from '../Search/SearchBar';
import { Smartphone, Search as SearchIcon } from 'lucide-react';

export const AppsList: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appsData: App[] = [];
      snapshot.forEach((doc) => {
        appsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as App);
      });
      
      setApps(appsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = apps.filter(app =>
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredApps(filtered);
  }, [apps, searchTerm]);

  const handleDownloadUpdate = (appId: string, newCount: number) => {
    setApps(prevApps =>
      prevApps.map(app =>
        app.id === appId ? { ...app, downloads: newCount } : app
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              App Store
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Discover and download amazing apps. All apps are carefully curated and safe to use.
          </p>
          
          <div className="flex justify-center mb-8">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search apps..."
            />
          </div>
        </div>

        {filteredApps.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon className="h-24 w-24 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {searchTerm ? 'No apps found' : 'No apps available yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm 
                ? `Try searching for something else. We couldn't find any apps matching "${searchTerm}"`
                : 'The admin hasn\'t added any apps yet. Check back later for amazing apps!'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onDownloadUpdate={handleDownloadUpdate}
              />
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredApps.length} of {apps.length} apps
          </p>
        </div>
      </div>
    </div>
  );
};