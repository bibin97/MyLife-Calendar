import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-stone-200 shadow-xl animate-in slide-in-from-bottom-5 duration-200">
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
      )}
      <span className="text-xs sm:text-sm font-semibold text-stone-800">
        {message}
      </span>
      <button
        type="button"
        onClick={onClose}
        className="p-1 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
