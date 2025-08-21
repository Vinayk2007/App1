import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { App } from '../../types/app';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Image, 
  ExternalLink, 
  Link2, 
  Camera, 
  Monitor,
  Smartphone,
  Download,
  Calendar,
  Eye,
  AlertCircle,
  Check,
  Globe,
  Star,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    apkLink: '',
    websiteLink: '',
    logoUrl: '',
    screenshots: [] as string[],
    category: '',
    version: '',
    size: '',
    featured: false,
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [newTag, setNewTag] = useState('');

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

  const addScreenshot = () => {
    if (newScreenshotUrl.trim() && formData.screenshots.length < 10) {
      if (newScreenshotUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
        setFormData(prev => ({
          ...prev,
          screenshots: [...prev.screenshots, newScreenshotUrl.trim()]
        }));
        setNewScreenshotUrl('');
      } else {
        toast.error('Please enter a valid image URL');
      }
    } else if (formData.screenshots.length >= 10) {
      toast.error('Maximum 10 screenshots allowed');
    }
  };

  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && formData.tags.length < 10 && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    } else if (formData.tags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
    } else if (formData.tags.includes(newTag.trim())) {
      toast.error('Tag already exists');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('App title is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('App description is required');
      return false;
    }
    if (!formData.apkLink.trim() || !isValidUrl(formData.apkLink)) {
      toast.error('Valid APK download link is required');
      return false;
    }
    if (formData.websiteLink && !isValidUrl(formData.websiteLink)) {
      toast.error('Website link must be a valid URL');
      return false;
    }
    if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
      toast.error('Logo URL must be a valid URL');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const appData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        apkLink: formData.apkLink.trim(),
        websiteLink: formData.websiteLink.trim() || null,
        logoUrl: formData.logoUrl.trim() || null,
        screenshots: formData.screenshots,
        category: formData.category.trim() || null,
        version: formData.version.trim() || null,
        size: formData.size.trim() || null,
        featured: formData.featured,
        tags: formData.tags,
        updatedAt: new Date()
      };

      if (editingApp) {
        await updateDoc(doc(db, 'apps', editingApp.id), appData);
        toast.success('App updated successfully!');
      } else {
        await addDoc(collection(db, 'apps'), {
          ...appData,
          downloads: 0,
          rating: 0,
          createdAt: new Date()
        });
        toast.success('App added successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving app:', error);
      toast.error('Failed to save app. Please try again.');
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
      logoUrl: app.logoUrl || '',
      screenshots: app.screenshots || [],
      category: (app as any).category || '',
      version: (app as any).version || '',
      size: (app as any).size || '',
      featured: (app as any).featured || false,
      tags: (app as any).tags || []
    });
    setShowForm(true);
  };

  const handleDelete = async (app: App) => {
    if (window.confirm(`Are you sure you want to delete "${app.title}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'apps', app.id));
        toast.success('App deleted successfully!');
      } catch (error) {
        console.error('Error deleting app:', error);
        toast.error('Failed to delete app. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      apkLink: '',
      websiteLink: '',
      logoUrl: '',
      screenshots: [],
      category: '',
      version: '',
      size: '',
      featured: false,
      tags: []
    });
    setEditingApp(null);
    setShowForm(false);
    setNewScreenshotUrl('');
    setNewTag('');
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getTotalDownloads = () => {
    return apps.reduce((sum, app) => sum + app.downloads, 0);
  };

  const getFeaturedAppsCount = () => {
    return apps.filter(app => (app as any).featured).length;
  };

  const getAppsWithScreenshots = () => {
    return apps.filter(app => app.screenshots && app.screenshots.length > 0).length;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/40 to-purple-900/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Monitor className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                <p className="text-blue-100 text-sm">Manage your app store</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Apps</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{apps.length}</p>
                </div>
                <Smartphone className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Downloads</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                    {getTotalDownloads().toLocaleString()}
                  </p>
                </div>
                <Download className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Featured Apps</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {getFeaturedAppsCount()}
                  </p>
                </div>
                <Star className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">With Screenshots</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {getAppsWithScreenshots()}
                  </p>
                </div>
                <Camera className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manage Applications
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Add, edit, and manage your app store inventory
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Add New App</span>
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-gray-200/50 dark:border-slate-600/50 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingApp ? 'Edit Application' : 'Add New Application'}
                </h4>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Application Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter app title"
                      required
                    />
                  </div>
    try {
      let logoUrl = formData.logoUrl;
      let screenshots = formData.screenshots;

      if (logoInputType === 'upload' && formData.logoFile) {
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
    setLogoInputType(app.logoUrl ? 'url' : 'upload');
    setShowForm(true);
  };

  const handleDelete = async (app: App) => {
    if (window.confirm(`Are you sure you want to delete "${app.title}"?`)) {
      try {
        await deleteDoc(doc(db, 'apps', app.id));
        
        // Delete logo from storage if it exists and is a storage URL
        if (app.logoUrl && app.logoUrl.includes('firebase')) {
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
            const deletePromises = app.screenshots
              .filter(url => url.includes('firebase'))
              .map(async (screenshotUrl) => {
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
    setLogoInputType('upload');
    setPreviewScreenshots([]);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/40 to-purple-900/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Monitor className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                <p className="text-blue-100 text-sm">Manage your app store</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Apps</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{apps.length}</p>
                </div>
                <Smartphone className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Downloads</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                    {apps.reduce((sum, app) => sum + app.downloads, 0).toLocaleString()}
                  </p>
                </div>
                <Download className="h-10 w-10 text-emerald-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">With Screenshots</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {apps.filter(app => app.screenshots && app.screenshots.length > 0).length}
                  </p>
                </div>
                <Camera className="h-10 w-10 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Manage Applications
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Add, edit, and manage your app store inventory
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Add New App</span>
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-gray-200/50 dark:border-slate-600/50 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingApp ? 'Edit Application' : 'Add New Application'}
                </h4>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Application Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter app title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      APK Download Link *
                    </label>
                    <input
                      type="url"
                      value={formData.apkLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, apkLink: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://example.com/app.apk"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Website Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.websiteLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, websiteLink: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://example.com"
                    />
                  </div>

                  {/* Logo Input Type Toggle */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      App Logo
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setLogoInputType('upload')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          logoInputType === 'upload'
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Upload className="h-4 w-4 inline mr-2" />
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoInputType('url')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          logoInputType === 'url'
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Link2 className="h-4 w-4 inline mr-2" />
                        Use URL
                      </button>
                    </div>

                    {logoInputType === 'upload' ? (
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
                          className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-500 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl flex items-center space-x-2 cursor-pointer transition-all duration-200 border border-gray-200 dark:border-slate-600"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Choose Image File</span>
                        </label>
                        {formData.logoFile && (
                          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-medium">{formData.logoFile.name}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="https://example.com/logo.png"
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Application Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe your application features and benefits..."
                    required
                  />
                </div>

                {/* Screenshots */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                      className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-slate-600 dark:hover:to-slate-500 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl flex items-center space-x-2 cursor-pointer transition-all duration-200 border border-gray-200 dark:border-slate-600"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Choose Screenshots</span>
                    </label>
                    {(formData.screenshotFiles.length > 0 || formData.screenshots.length > 0) && (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formData.screenshotFiles.length > 0 
                            ? `${formData.screenshotFiles.length} new screenshots selected`
                            : `${formData.screenshots.length} screenshots available`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Screenshot Preview */}
                  {(previewScreenshots.length > 0 || formData.screenshots.length > 0) && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-600">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Screenshot Preview:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(previewScreenshots.length > 0 ? previewScreenshots : formData.screenshots).map((screenshot, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={screenshot}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : editingApp ? 'Update App' : 'Add App'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Apps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
              >
                {/* App Header */}
                <div className="flex items-center space-x-4 mb-4">
                  {app.logoUrl ? (
                    <img
                      src={app.logoUrl}
                      alt={app.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-slate-600 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xl">
                        {app.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                      {app.title}
                    </h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center space-x-1 text-sm text-emerald-600 dark:text-emerald-400">
                        <Download className="h-3 w-3" />
                        <span>{app.downloads.toLocaleString()}</span>
                      </div>
                      {app.websiteLink && (
                        <div className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400">
                          <ExternalLink className="h-3 w-3" />
                          <span>Website</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                  {app.description}
                </p>
                
                {/* Screenshots Preview */}
                {app.screenshots && app.screenshots.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Screenshots ({app.screenshots.length})
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {app.screenshots.slice(0, 4).map((screenshot, index) => (
                        <div key={index} className="relative group/screenshot">
                          <img
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-16 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                          />
                          {index === 3 && app.screenshots!.length > 4 && (
                            <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                +{app.screenshots!.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* App Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Added {formatDate(app.createdAt)}</span>
                  </div>
                  {app.updatedAt && app.updatedAt.getTime() !== app.createdAt?.getTime() && (
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Updated {formatDate(app.updatedAt)}</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(app)}
                    className="flex-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1 text-sm font-medium transition-all duration-200 border border-blue-200 dark:border-blue-700"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => handleDelete(app)}
                    className="flex-1 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1 text-sm font-medium transition-all duration-200 border border-red-200 dark:border-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {apps.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-12 w-12 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No applications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Start building your app store by adding your first application with logos and screenshots
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
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
