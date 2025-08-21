import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { App } from '../../types/app';
import { Plus, Edit2, Trash2, X, Upload, Save, Image, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    apkLink: '',
    websiteLink: '',
    logoFile: null as File | null,
    logoUrl: '',
    screenshotFiles: [] as File[],
    screenshots: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, logoFile: file }));
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error('Please select only image files');
    }
    
    setFormData(prev => ({ ...prev, screenshotFiles: imageFiles }));
  };
  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `logos/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const uploadScreenshots = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `screenshots/${Date.now()}_${index}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    });
    
    return await Promise.all(uploadPromises);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.apkLink) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      let logoUrl = formData.logoUrl;
      let screenshots = formData.screenshots;

      if (formData.logoFile) {
        logoUrl = await uploadImage(formData.logoFile);
      }

      if (formData.screenshotFiles.length > 0) {
        screenshots = await uploadScreenshots(formData.screenshotFiles);
      }
      const appData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        apkLink: formData.apkLink.trim(),
        websiteLink: formData.websiteLink.trim() || undefined,
        logoUrl,
        screenshots,
        updatedAt: new Date()
      };

      if (editingApp) {
        await updateDoc(doc(db, 'apps', editingApp.id), appData);
        toast.success('App updated successfully!');
      } else {
        await addDoc(collection(db, 'apps'), {
          ...appData,
          downloads: 0,
          createdAt: new Date()
        });
        toast.success('App added successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving app:', error);
      toast.error('Failed to save app');
    }
    setLoading(false);
  };

  const handleEdit = (app: App) => {
    setEditingApp(app);
    setFormData({
      title: app.title,
      description: app.description,
      apkLink: app.apkLink,
      websiteLink: app.websiteLink || '',
      logoFile: null,
      logoUrl: app.logoUrl,
      screenshotFiles: [],
      screenshots: app.screenshots || []
    });
    setShowForm(true);
  };

  const handleDelete = async (app: App) => {
    if (window.confirm(`Are you sure you want to delete "${app.title}"?`)) {
      try {
        await deleteDoc(doc(db, 'apps', app.id));
        
        // Delete logo from storage if it exists
        if (app.logoUrl) {
          try {
            const logoRef = ref(storage, app.logoUrl);
            await deleteObject(logoRef);
          } catch (error) {
            console.warn('Failed to delete logo from storage:', error);
          }
        }
        
        // Delete screenshots from storage
        if (app.screenshots && app.screenshots.length > 0) {
          try {
            const deletePromises = app.screenshots.map(async (screenshotUrl) => {
              const screenshotRef = ref(storage, screenshotUrl);
              return deleteObject(screenshotRef);
            });
            await Promise.all(deletePromises);
          } catch (error) {
            console.warn('Failed to delete screenshots from storage:', error);
          }
        }
        
        toast.success('App deleted successfully!');
      } catch (error) {
        console.error('Error deleting app:', error);
        toast.error('Failed to delete app');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      apkLink: '',
      websiteLink: '',
      logoFile: null,
      logoUrl: '',
      screenshotFiles: [],
      screenshots: []
    });
    setEditingApp(null);
    setShowForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Manage Apps ({apps.length})
            </h3>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-2xl flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span>Add App</span>
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-600">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingApp ? 'Edit App' : 'Add New App'}
              </h4>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    App Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    APK Download Link *
                  </label>
                  <input
                    type="url"
                    value={formData.apkLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, apkLink: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.websiteLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteLink: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    App Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Choose Image</span>
                    </label>
                    {(formData.logoFile || formData.logoUrl) && (
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {formData.logoFile ? formData.logoFile.name : 'Current logo'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    App Screenshots
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleScreenshotChange}
                      className="hidden"
                      id="screenshots-upload"
                    />
                    <label
                      htmlFor="screenshots-upload"
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl flex items-center space-x-2 cursor-pointer transition-colors duration-200"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Choose Screenshots</span>
                    </label>
                    {(formData.screenshotFiles.length > 0 || formData.screenshots.length > 0) && (
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {formData.screenshotFiles.length > 0 
                            ? `${formData.screenshotFiles.length} new screenshots`
                            : `${formData.screenshots.length} current screenshots`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : editingApp ? 'Update App' : 'Add App'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center space-x-3 mb-3">
                  {app.logoUrl ? (
                    <img
                      src={app.logoUrl}
                      alt={app.title}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {app.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {app.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {app.downloads} downloads
                    </p>
                    {app.websiteLink && (
                      <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                        <ExternalLink className="h-3 w-3" />
                        <span>Has website</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {app.description}
                </p>
                
                {app.screenshots && app.screenshots.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {app.screenshots.length} screenshot{app.screenshots.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {app.screenshots.slice(0, 3).map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-12 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(app)}
                    className="flex-1 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors duration-200"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => handleDelete(app)}
                    className="flex-1 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1 text-sm transition-colors duration-200"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {apps.length === 0 && (
            <div className="text-center py-12">
              <Plus className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No apps yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by adding your first app to the store
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl transition-all duration-200 transform hover:scale-105"
              >
                Add Your First App
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
