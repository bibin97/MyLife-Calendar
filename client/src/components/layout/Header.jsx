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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200/80 px-4 sm:px-8 py-3 shadow-xs font-sans transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3 group cursor-default">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-900/20 ring-2 ring-teal-100 group-hover:scale-105 transition-transform duration-200">
            <Calendar className="w-5 h-5 drop-shadow-xs" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-extrabold text-stone-900 tracking-tight leading-tight">
              MyLife <span className="bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">Calendar</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-stone-500 font-semibold font-malayalam tracking-wide">
              {t('app.tagline')}
            </p>
          </div>
        </div>

        {/* Right side controls: Language switcher, Settings & User info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher Buttons (English | മലയാളം) */}
          <div className="flex items-center bg-stone-100/90 backdrop-blur-md p-1 rounded-2xl border border-stone-200 text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => handleSwitch('en')}
              className={`
                px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all duration-200 cursor-pointer
                ${currentLang === 'en'
                  ? 'bg-white text-teal-900 shadow-sm font-bold scale-[1.02]'
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
                px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all duration-200 font-malayalam cursor-pointer
                ${currentLang === 'ml'
                  ? 'bg-white text-teal-900 shadow-sm font-bold scale-[1.02]'
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
              className="p-2 sm:p-2.5 rounded-2xl text-stone-600 hover:text-teal-800 hover:bg-teal-50/80 border border-stone-200/80 hover:border-teal-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
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
