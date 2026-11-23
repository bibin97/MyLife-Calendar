import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export default function OfflineBanner({
  isOffline,
  wasOffline,
  onReconnectRefresh,
  isRefreshing = false
}) {
  const { t } = useTranslation();

  if (!isOffline && !wasOffline) return null;

  if (wasOffline && !isOffline) {
    return (
      <div className="bg-teal-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-300 font-malayalam">
        <div className="flex items-center gap-2 max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-teal-200" />
            <span>{t('offline.reconnectedMessage')}</span>
          </div>
          <button
            type="button"
            onClick={onReconnectRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 border border-teal-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t('offline.syncNow')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-sm font-malayalam">
      <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
      <span>{t('offline.offlineBanner')}</span>
    </div>
  );
}
