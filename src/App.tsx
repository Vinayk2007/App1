import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Layout/Header';
import { LoginForm } from './components/Auth/LoginForm';
import { AppsList } from './components/Apps/AppsList';
import { AdminDashboard } from './components/Admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin && !currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen">
      <Header 
        onAdminClick={currentUser?.isAdmin ? () => setShowAdminDashboard(true) : undefined}
        onLoginClick={() => setShowLogin(true)}
      />
      <AppsList />
      
      {showAdminDashboard && currentUser.isAdmin && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}
      
      {showLogin && !currentUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
            >
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <LoginForm />
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="transition-colors duration-300">
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;