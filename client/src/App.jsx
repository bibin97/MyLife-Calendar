import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/layout/Header.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SettingsModal from './features/settings/SettingsModal.jsx';
import Toast from './components/common/Toast.jsx';
import OfflineBanner from './components/common/OfflineBanner.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { categoryService } from './services/categoryService.js';
import { useOnlineStatus } from './hooks/useOnlineStatus.js';
import { Loader2 } from 'lucide-react';
import { changeAppLanguage } from './i18n.js';

function AppContent() {
  const { user, loading, logout, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const { isOffline, wasOffline, clearReconnectedFlag, checkBackendHealth } = useOnlineStatus();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadCategories = useCallback(async () => {
    if (!user) return;
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.warn('Failed to load categories over network:', err.message);
    }
  }, [user]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle reconnect & auto-sync
  const handleReconnectSync = async () => {
    setIsSyncing(true);
    await checkBackendHealth();
    await loadCategories();
    clearReconnectedFlag();
    setIsSyncing(false);
    showToast(t('offline.reconnectedMessage'), 'success');
  };

  const handleLanguageChange = (lang) => {
    changeAppLanguage(lang);
    if (user && user.preferredLanguage !== lang && !isOffline) {
      updateProfile({ preferredLanguage: lang }).catch(() => {});
    }
  };

  useEffect(() => {
    document.documentElement.lang = i18n.language || 'en';
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-700 mb-3" />
        <p className="text-sm font-semibold text-stone-600 font-malayalam">
          {t('app.loading')}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        language={i18n.language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col font-sans">
      <OfflineBanner
        isOffline={isOffline}
        wasOffline={wasOffline}
        onReconnectRefresh={handleReconnectSync}
        isRefreshing={isSyncing}
      />

      <Header
        language={i18n.language}
        onLanguageChange={handleLanguageChange}
        user={user}
        onLogout={logout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-1 pb-16">
        <DashboardPage
          language={i18n.language}
          timezone={user.timezone || 'Asia/Kolkata'}
          categories={categories}
          onCategoriesRefresh={loadCategories}
          isOffline={isOffline}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUpdateProfile={updateProfile}
        categories={categories}
        onCategoriesChanged={loadCategories}
        onShowToast={showToast}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <footer className="py-4 text-center text-xs text-stone-500 border-t border-stone-200/60 bg-white/40 font-malayalam">
        <p>{t('app.footer')}</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
