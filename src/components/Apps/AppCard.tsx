import React from 'react';
import { Download, Smartphone, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { App } from '../../types/app';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

interface AppCardProps {
  app: App;
  onDownloadUpdate?: (appId: string, newCount: number) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onDownloadUpdate }) => {
  const [showScreenshots, setShowScreenshots] = React.useState(false);

  const handleDownload = async () => {
    try {
      const appRef = doc(db, 'apps', app.id);
      await updateDoc(appRef, {
        downloads: increment(1)
      });
      
      if (onDownloadUpdate) {
        onDownloadUpdate(app.id, app.downloads + 1);
      }
      
      // Open the APK link
      window.open(app.apkLink, '_blank');
      toast.success('Download started!');
    } catch (error) {
      console.error('Error updating download count:', error);
      toast.error('Failed to track download');
      // Still allow the download even if tracking fails
      window.open(app.apkLink, '_blank');
    }
  };

  const handleWebsiteClick = () => {
    if (app.websiteLink) {
      window.open(app.websiteLink, '_blank');
    }
  };
  return (
    <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl border border-white/20 dark:border-gray-700/20 p-6 transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 hover:rotate-1">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
      
      <div className="relative z-10">
        <div className="flex items-center space-x-4 mb-4">
          {app.logoUrl ? (
            <img
              src={app.logoUrl}
              alt={app.title}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-500">
              {app.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Download className="h-4 w-4" />
              <span>{app.downloads.toLocaleString()} downloads</span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
          {app.description}
        </p>

        {app.screenshots && app.screenshots.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowScreenshots(!showScreenshots)}
              className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
            >
              <ImageIcon className="h-4 w-4" />
              <span>{showScreenshots ? 'Hide' : 'View'} Screenshots ({app.screenshots.length})</span>
            </button>
            
            {showScreenshots && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {app.screenshots.slice(0, 4).map((screenshot, index) => (
                  <img
                    key={index}
                    src={screenshot}
                    alt={`${app.title} screenshot ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => window.open(screenshot, '_blank')}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <div className="flex items-center justify-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Download APK</span>
            </div>
          </button>
          
          {app.websiteLink && (
            <button
              onClick={handleWebsiteClick}
              className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <div className="flex items-center justify-center space-x-2">
                <ExternalLink className="h-4 w-4" />
                <span>Visit Website</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};