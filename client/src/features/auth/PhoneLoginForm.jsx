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
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {/* Input Group with +91 India badge */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 font-malayalam">
          {t('auth.mobileLabel')}
        </label>
        <div className="relative flex items-center rounded-2xl border border-stone-300 bg-white shadow-2xs focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 transition-all overflow-hidden">
          {/* India (+91) Country Code Badge */}
          <div className="flex items-center gap-1.5 px-3.5 py-3 bg-stone-50 border-r border-stone-200 text-stone-700 select-none">
            <span className="text-base" role="img" aria-label="India Flag">🇮🇳</span>
            <span className="text-sm font-extrabold text-stone-900">+91</span>
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
            className="w-full px-3.5 py-3 text-stone-900 font-semibold tracking-wider placeholder:text-stone-300 focus:outline-hidden text-base sm:text-lg"
          />
        </div>

        {/* Validation or API error display */}
        {(validationError || error) && (
          <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1 font-malayalam">
            <span>⚠️</span>
            <span>{validationError || error}</span>
          </p>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-teal-900 text-xs font-malayalam">
        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
        <span>
          {t('auth.secureLogin')}
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || phoneNumber.length !== 10}
        className="w-full py-3.5 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed transition-all active:scale-[0.99] cursor-pointer font-malayalam"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('auth.sendingOtp')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.getCode')}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
