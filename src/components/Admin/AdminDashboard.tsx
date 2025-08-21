import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { App } from '../../types/app';
import { 
  Plus, Edit2, Trash2, X, Save, Image, ExternalLink, 
  BarChart3, Users, Download, Star, Eye, Search,
  Filter, Calendar, TrendingUp, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onClose: () => void;
}

interface Analytics {
  totalApps: number;
  totalDownloads: number;
  totalViews: number;
  avgRating: number;
  recentDownloads: number;
  featuredApps: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [analytics, setAnalytics] = useState<Analytics>({
    totalApps: 0,
    totalDownloads: 0,
    totalViews: 0,
    avgRating: 0,
    recentDownloads: 0,
    featuredApps: 0
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    apkLink: '',
    websiteLink: '',
    logoUrl: '',
    logoUrls: [''], // Multiple logo URLs
    screenshotUrls: [''], // Multiple screenshot URLs
    category: '',
    version: '',
    size: '',
    tags: [] as string[],
    featured: false,
    rating: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'apps' | 'analytics' | 'categories'>('apps');

  // Categories for filtering
  const categories = [
    'Games', 'Social', 'Productivity', 'Entertainment', 'Education',
    'Business', 'Tools', 'Finance', 'Health', 'Shopping', 'Music',
    'Photography', 'Travel', 'News', 'Sports', 'Weather', 'Other'
  ];

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
      calculateAnalytics(appsData);
    });

    return () => unsubscribe();
  }, []);

  // Filter apps based on search and category
  useEffect(() => {
    let filtered = apps;

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    setFilteredApps(filtered);
  }, [apps, searchTerm, selectedCategory]);

  const calculateAnalytics = (appsData: App[]) => {
    const totalDownloads = appsData.reduce((sum, app) => sum + (app.downloads || 0), 0);
    const totalViews = appsData.reduce((sum, app) => sum + (app.views || 0), 0);
    const ratingsSum = appsData.reduce((sum, app) => sum + (app.rating || 0), 0);
    const avgRating = appsData.length > 0 ? ratingsSum / appsData.length : 0;
    const featuredApps = appsData.filter(app => app.featured).length;
    const recentDownloads = appsData.reduce((sum, app) => {
      const createdAt = app.createdAt || new Date();
      const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 ? sum + (app.downloads || 0) : sum;
    }, 0);

    setAnalytics({
      totalApps: appsData.length,
      totalDownloads,
      totalViews,
      avgRating,
      recentDownloads,
      featuredApps
    });
  };

  const validateImageUrl = (url: string): boolean => {
    if (!url) return true; // Empty URLs are allowed
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
    } catch {
      return false;
    }
  };

  const addLogoUrl = () => {
    setFormData(prev => ({
      ...prev,
      logoUrls: [...prev.logoUrls, '']
    }));
  };

  const removeLogoUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      logoUrls: prev.logoUrls.filter((_, i) => i !== index)
    }));
  };

  const updateLogoUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      logoUrls: prev.logoUrls.map((url, i) => i === index ? value : url)
    }));
  };

  const addScreenshotUrl = () => {
    setFormData(prev => ({
      ...prev,
      screenshotUrls: [...prev.screenshotUrls, '']
    }));
  };

  const removeScreenshotUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshotUrls: prev.screenshotUrls.filter((_, i) => i !== index)
    }));
  };

  const updateScreenshotUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      screenshotUrls: prev.screenshotUrls.map((url, i) => i === index ? value : url)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.apkLink) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate image URLs
    const validLogoUrls = formData.logoUrls.filter(url => url.trim());
    const validScreenshotUrls = formData.screenshotUrls.filter(url => url.trim());

    for (const url of validLogoUrls) {
      if (!validateImageUrl(url)) {
        toast.error(`Invalid logo image URL: ${url}`);
        return;
      }
    }

    for (const url of validScreenshotUrls) {
      if (!validateImageUrl(url)) {
        toast.error(`Invalid screenshot image URL: ${url}`);
        return;
      }
    }

    setLoading(true);
    try {
      const appData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        apkLink: formData.apkLink.trim(),
        websiteLink: formData.websiteLink.trim() || null,
        logoUrl: validLogoUrls[0] || null, // Primary logo
        logoUrls: validLogoUrls, // All logos
        screenshots: validScreenshotUrls, // All screenshots
        category: formData.category || 'Other',
        version: formData.version.trim() || '1.0.0',
        size: formData.size.trim() || 'Unknown',
        tags: formData.tags.filter(tag => tag.trim()),
        featured: formData.featured,
        rating: formData.rating || 0,
        views: editingApp?.views || 0,
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
      logoUrl: app.logoUrl || '',
      logoUrls: (app as any).logoUrls || [app.logoUrl || ''].filter(Boolean),
      screenshotUrls: app.screenshots || [''],
      category: app.category || 'Other',
      version: app.version || '1.0.0',
      size: app.size || '',
      tags: app.tags || [],
      featured: app.featured || false,
      rating: app.rating || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (app: App) => {
    if (window.confirm(`Are you sure you want to delete "${app.title}"?`)) {
      try {
        await deleteDoc(doc(db, 'apps', app.id));
        toast.success('App deleted successfully!');
      } catch (error) {
        console.error('Error deleting app:', error);
        toast.error('Failed to delete app');
      }
    }
  };

  const toggleFeatured = async (app: App) => {
    try {
      await updateDoc(doc(db, 'apps', app.id), {
        featured: !app.featured,
        updatedAt: new Date()
      });
      toast.success(`App ${!app.featured ? 'featured' : 'unfeatured'} successfully!`);
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      apkLink: '',
      websiteLink: '',
      logoUrl: '',
      logoUrls: [''],
      screenshotUrls: [''],
      category: '',
      version: '',
      size: '',
      tags: [],
      featured: false,
      rating: 0
    });
    setEditingApp(null);
    setShowForm(false);
  };

  const AnalyticsCard = ({ icon: Icon, title, value, subtitle, trend, color }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle: string;
    trend?: number;
    color: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
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
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {[
              { key: 'apps', label: 'Apps', icon: Activity },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 },
              { key: 'categories', label: 'Categories', icon: Filter }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Analytics Overview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <AnalyticsCard
                  icon={Activity}
                  title="Total Apps"
                  value={analytics.totalApps}
                  subtitle="Apps in store"
                  color="bg-blue-500"
                />
                <AnalyticsCard
                  icon={Download}
                  title="Total Downloads"
                  value={analytics.totalDownloads.toLocaleString()}
                  subtitle="All time downloads"
                  color="bg-green-500"
                />
                <AnalyticsCard
                  icon={Eye}
                  title="Total Views"
                  value={analytics.totalViews.toLocaleString()}
                  subtitle="App page views"
                  color="bg-purple-500"
                />
                <AnalyticsCard
                  icon={Star}
                  title="Average Rating"
                  value={analytics.avgRating.toFixed(1)}
                  subtitle="Overall app rating"
                  color="bg-yellow-500"
                />
                <AnalyticsCard
                  icon={TrendingUp}
                  title="Recent Downloads"
                  value={analytics.recentDownloads.toLocaleString()}
                  subtitle="Last 7 days"
                  color="bg-indigo-500"
                />
                <AnalyticsCard
                  icon={Star}
                  title="Featured Apps"
                  value={analytics.featuredApps}
                  subtitle="Currently featured"
                  color="bg-pink-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Manage Apps ({filteredApps.length})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Add, edit, and manage your app store applications
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-2xl flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add App</span>
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {showForm && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {editingApp ? 'Edit App' : 'Add New App'}
                  </h4>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Version
                        </label>
                        <input
                          type="text"
                          value={formData.version}
                          onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1.0.0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          App Size
                        </label>
                        <input
                          type="text"
                          value={formData.size}
                          onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="25 MB"
                        />
                      </div>
                    </div>

                    <div>
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

                    {/* Logo URLs */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Logo Image URLs
                      </label>
                      {formData.logoUrls.map((url, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateLogoUrl(index, e.target.value)}
                            placeholder="https://example.com/logo.png"
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {formData.logoUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLogoUrl(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addLogoUrl}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add another logo URL</span>
                      </button>
                    </div>

                    {/* Screenshot URLs */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Screenshot Image URLs
                      </label>
                      {formData.screenshotUrls.map((url, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateScreenshotUrl(index, e.target.value)}
                            placeholder="https://example.com/screenshot.png"
                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {formData.screenshotUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeScreenshotUrl(index)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addScreenshotUrl}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add another screenshot URL</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={formData.featured}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="featured" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Featured App
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rating (0-5)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={formData.rating}
                          onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                          className="w-20 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
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
                {filteredApps.map((app) => (
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
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMTIiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiIHJ5PSIyIi8+CjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIi8+CjxwYXRoIGQ9Im0yMSAxNS00LjM1NC00LjM1NGEyIDIgMCAwIDAtMi44MjggMEwxMCAxNSIvPgo8L3N2Zz4KPC9zdmc+';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {app.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {app.title}
                          </h4>
                          {app.featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{app.downloads || 0} downloads</span>
                          <span>{app.views || 0} views</span>
                        </div>
                        {app.websiteLink && (
                          <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                            <ExternalLink className="h-3 w-3" />
                            <span>Has website</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
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
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(app)}
                        className="flex-1 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1 text-xs transition-colors duration-200"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={() => toggleFeatured(app)}
                        className={`flex-1 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1 text-xs transition-colors duration-200 ${
                          app.featured
                            ? 'bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        <span>{app.featured ? 'Unfeature' : 'Feature'}</span>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(app)}
                        className="flex-1 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1 text-xs transition-colors duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredApps.length === 0 && apps.length > 0 && (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No apps found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}

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
          )}

          {activeTab === 'categories' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                App Categories
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(category => {
                  const categoryApps = apps.filter(app => app.category === category);
                  return (
                    <div
                      key={category}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 text-center"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white">{category}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {categoryApps.length} app{categoryApps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
