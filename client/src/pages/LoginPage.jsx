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
    <div className="min-h-screen relative flex flex-col justify-between p-4 sm:p-6 font-sans overflow-hidden">
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-400/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-400/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-amber-300/10 blur-[100px] pointer-events-none" />

      {/* Top Bar with Language Switcher */}
      <header className="relative z-10 max-w-lg w-full mx-auto flex items-center justify-between py-2 sm:py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-900/20 ring-4 ring-teal-50">
            <Calendar className="w-5 h-5 drop-shadow-xs" />
          </div>
          <div>
            <span className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg block leading-tight">
              MyLife <span className="bg-gradient-to-r from-teal-700 to-emerald-600 bg-clip-text text-transparent">Calendar</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider text-teal-800/80 uppercase">
              Physical Journal Experience
            </span>
          </div>
        </div>

        {/* Bilingual Switcher */}
        <div className="flex items-center bg-stone-200/60 backdrop-blur-md p-1 rounded-2xl border border-stone-200 shadow-inner text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitch('en')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              currentLang === 'en'
                ? 'bg-white text-teal-900 shadow-sm font-bold scale-[1.02]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleSwitch('ml')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 font-malayalam cursor-pointer ${
              currentLang === 'ml'
                ? 'bg-white text-teal-900 shadow-sm font-bold scale-[1.02]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            മലയാളം
          </button>
        </div>
      </header>

      {/* Main Login Card with Wall Calendar Aesthetics */}
      <main className="relative z-10 max-w-lg w-full mx-auto my-auto py-4 sm:py-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/80 shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-teal-900/10">
          {/* Wall Calendar Wire Ring Header */}
          <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-stone-200 to-stone-100 border-b border-stone-300/80 flex justify-around items-center px-8 sm:px-14">
            <div className="w-8 sm:w-10 h-2 rounded-full calendar-hangers"></div>
            <div className="w-8 sm:w-10 h-2 rounded-full calendar-hangers"></div>
            <div className="w-8 sm:w-10 h-2 rounded-full calendar-hangers"></div>
          </div>

          <div className="pt-4 text-center mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-bold mb-3">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              <span>2026 Edition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-malayalam">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-2 font-malayalam max-w-sm mx-auto leading-relaxed">
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
          <div className="mt-8 pt-5 border-t border-stone-200/70 space-y-2.5 text-xs text-stone-600 font-malayalam">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/70 border border-stone-100">
              <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
              </div>
              <span className="font-medium">
                {t('auth.feature1')}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50/70 border border-stone-100">
              <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
              </div>
              <span className="font-medium">
                {t('auth.feature2')}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-stone-400 py-3 font-malayalam">
        <p className="tracking-wide">{t('auth.copyright')}</p>
      </footer>
    </div>
  );
}
