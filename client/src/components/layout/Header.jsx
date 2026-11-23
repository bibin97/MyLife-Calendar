import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Settings } from 'lucide-react';

export default function Header({
  language,
  onLanguageChange,
  user,
  onLogout,
  onOpenSettings
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';

  const handleSwitch = (lang) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    } else {
      i18n.changeLanguage(lang);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 shadow-2xs font-sans">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
              MyLife <span className="text-teal-700">Calendar</span>
            </h1>
            <p className="text-[11px] text-stone-500 font-medium font-malayalam">
              {t('app.tagline')}
            </p>
          </div>
        </div>

        {/* Right side controls: Language switcher, Settings & User info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher Buttons (English | മലയാളം) */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => handleSwitch('en')}
              className={`
                px-2.5 py-1 rounded-lg transition-all cursor-pointer
                ${currentLang === 'en'
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
                }
              `}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleSwitch('ml')}
              className={`
                px-2.5 py-1 rounded-lg transition-all font-malayalam cursor-pointer
                ${currentLang === 'ml'
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
                }
              `}
            >
              മലയാളം
            </button>
          </div>

          {/* Settings Button */}
          {user && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title={t('settings.openSettings')}
              className="p-2 rounded-xl text-stone-600 hover:text-teal-800 hover:bg-stone-100 border border-stone-200/80 transition-colors cursor-pointer shadow-2xs"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600">
              <span className="font-bold text-stone-800">{user.displayName || user.phoneNumber}</span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer font-malayalam font-semibold"
                >
                  {t('auth.logout')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
