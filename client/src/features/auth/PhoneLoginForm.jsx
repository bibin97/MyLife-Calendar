import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function PhoneLoginForm({
  onOtpRequested,
  isLoading = false,
  error = null
}) {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    // Keep numbers only and limit to 10 digits
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
    if (validationError) setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setValidationError(t('auth.invalidPhone'));
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setValidationError(t('auth.invalidPhoneIndian'));
      return;
    }
    onOtpRequested(phoneNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {/* Input Group with +91 India badge */}
      <div>
        <div className="flex items-center justify-between mb-2 font-malayalam">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
            {t('auth.mobileLabel')}
          </label>
          <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
            10-digit Mobile
          </span>
        </div>

        <div className="relative flex items-center rounded-2xl border-2 border-stone-200 bg-stone-50/70 hover:bg-white hover:border-teal-400 focus-within:bg-white focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100/70 transition-all duration-200 overflow-hidden shadow-xs">
          {/* India (+91) Country Code Badge */}
          <div className="flex items-center gap-1.5 px-4 py-3.5 bg-stone-100/80 border-r border-stone-200 text-stone-700 select-none">
            <span className="text-lg" role="img" aria-label="India Flag">🇮🇳</span>
            <span className="text-sm font-extrabold text-stone-800 tracking-tight">+91</span>
          </div>

          {/* 10-digit input */}
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            autoFocus
            disabled={isLoading}
            value={phoneNumber}
            onChange={handleChange}
            placeholder={t('auth.phonePlaceholder')}
            className="w-full px-4 py-3.5 text-stone-900 font-bold tracking-widest placeholder:text-stone-300 focus:outline-hidden text-base sm:text-lg bg-transparent"
          />
        </div>

        {/* Validation or API error display */}
        {(validationError || error) && (
          <p className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1.5 font-malayalam bg-rose-50 border border-rose-200/80 p-2 rounded-xl animate-in fade-in">
            <span>⚠️</span>
            <span>{validationError || error}</span>
          </p>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-teal-50/80 border border-teal-200/60 text-teal-900 text-xs font-malayalam shadow-2xs">
        <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <span className="font-medium leading-relaxed">
          {t('auth.secureLogin')}
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || phoneNumber.length !== 10}
        className={`
          w-full py-3.5 sm:py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md font-malayalam cursor-pointer
          ${isLoading || phoneNumber.length !== 10
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white hover:from-teal-800 hover:to-emerald-900 hover:shadow-xl hover:shadow-teal-900/20 active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('auth.sendingOtp')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.requestCode')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
