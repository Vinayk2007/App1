import React from 'react';
import { Moon, Sun, LogOut, Settings, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface HeaderProps {
  onAdminClick?: () => void;
  onLoginClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAdminClick, onLoginClick }) => {
  const { isDark, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/20 dark:border-gray-800/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              App Store
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            {!currentUser && (
              <button
                onClick={onLoginClick}
                className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 transform hover:scale-110"
                title="Admin Login"
              >
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </button>
            )}
            
            {currentUser?.isAdmin && (
              <button
                onClick={onAdminClick}
                className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-200 transform hover:scale-110"
                title="Admin Dashboard"
              >
                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </button>
            )}
            
            {currentUser && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200 transform hover:scale-110"
                title="Logout"
              >
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};