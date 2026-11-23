import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2 } from 'lucide-react';
import PhoneLoginForm from '../features/auth/PhoneLoginForm.jsx';
import OtpInputModal from '../features/auth/OtpInputModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage({ language, onLanguageChange }) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';
  const { requestOtp, login, error, devOtpHint, clearError } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);

  const handleSwitch = (lang) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    } else {
      i18n.changeLanguage(lang);
    }
  };

  const handleOtpRequested = async (phone) => {
    setLoading(true);
    clearError();
    try {
      await requestOtp(phone);
      setPhoneNumber(phone);
      setStep('otp');
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    setLoading(true);
    clearError();
    try {
      await login(phoneNumber, otp);
      // Login successful — AuthContext sets user and App redirects automatically
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    clearError();
    try {
      await requestOtp(phoneNumber);
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Bar with Language Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-stone-900 tracking-tight text-sm">
            MyLife <span className="text-teal-700">Calendar</span>
          </span>
        </div>

        {/* Bilingual Switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitch('en')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              currentLang === 'en' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-stone-600'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleSwitch('ml')}
            className={`px-2.5 py-1 rounded-lg transition-all font-malayalam cursor-pointer ${
              currentLang === 'ml' ? 'bg-white text-teal-800 shadow-xs font-bold' : 'text-stone-600'
            }`}
          >
            മലയാളം
          </button>
        </div>
      </div>

      {/* Main Login Card with Wall Calendar Aesthetics */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl relative overflow-hidden">
          {/* Calendar Spiral Accent at top */}
          <div className="absolute top-0 inset-x-0 h-2.5 bg-stone-100 border-b border-stone-200 flex justify-around items-center px-6">
            <div className="w-6 h-1.5 rounded-full bg-stone-300"></div>
            <div className="w-6 h-1.5 rounded-full bg-stone-300"></div>
            <div className="w-6 h-1.5 rounded-full bg-stone-300"></div>
          </div>

          <div className="pt-3 text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-malayalam">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5 font-malayalam">
              {t('auth.subheading')}
            </p>
          </div>

          {step === 'phone' ? (
            <PhoneLoginForm
              onOtpRequested={handleOtpRequested}
              isLoading={loading}
              error={error}
            />
          ) : (
            <OtpInputModal
              phoneNumber={phoneNumber}
              onVerifyOtp={handleVerifyOtp}
              onResendOtp={handleResendOtp}
              onChangePhone={() => {
                setStep('phone');
                clearError();
              }}
              devOtpHint={devOtpHint}
              isLoading={loading}
              error={error}
            />
          )}

          {/* Feature highlights bullet list */}
          <div className="mt-8 pt-5 border-t border-stone-100 space-y-2 text-xs text-stone-500 font-malayalam">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                {t('auth.feature1')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                {t('auth.feature2')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-stone-400 py-2 font-malayalam">
        {t('auth.copyright')}
      </footer>
    </div>
  );
}
