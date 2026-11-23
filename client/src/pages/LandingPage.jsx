import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  Palette,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage({ language, onLanguageChange }) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';
  const { enterWithPhone, error: authError, clearError } = useAuth();

  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyNote, setShowPrivacyNote] = useState(false);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhone(val);
      if (validationError) setValidationError('');
      if (authError) clearError();
    }
  };

  const handleLanguageSwitch = (lang) => {
    if (onLanguageChange) onLanguageChange(lang);
    else i18n.changeLanguage(lang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phone || phone.length !== 10) {
      setValidationError(
        currentLang === 'ml'
          ? 'ദയവായി സാധുവായ 10 അക്ക ഫോൺ നമ്പർ നൽകുക.'
          : 'Please enter a valid 10-digit Indian phone number.'
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setValidationError(
        currentLang === 'ml'
          ? 'നമ്പർ 6, 7, 8, 9 എന്നിവയിൽ ആരംഭിക്കണം.'
          : 'Indian mobile numbers must start with 6, 7, 8, or 9.'
      );
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    try {
      const fullPhone = `+91${phone}`;
      await enterWithPhone(fullPhone, Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', currentLang);
    } catch (err) {
      setValidationError(err.message || 'Failed to enter calendar. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf9f4] via-[#f7f5ed] to-[#f0ece1] text-stone-800 flex flex-col font-sans selection:bg-teal-700 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-teal-800 via-teal-700 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-900/20 ring-2 ring-teal-100">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-stone-900">
              MyLife <span className="text-teal-700">Calendar</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded-full">
              Personal Edition
            </span>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-stone-200/90 shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleLanguageSwitch('en')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              currentLang === 'en'
                ? 'bg-teal-800 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleLanguageSwitch('ml')}
            className={`px-3 py-1.5 rounded-xl transition-all font-malayalam ${
              currentLang === 'ml'
                ? 'bg-teal-800 text-white font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            മലയാളം
          </button>
        </div>
      </nav>

      {/* Main Hero & Entry Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-12 max-w-5xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold font-malayalam shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {currentLang === 'ml'
                  ? 'ജീവിതത്തിലെ ഓരോ ദിവസവും അടയാളപ്പെടുത്തൂ'
                  : 'A real physical calendar experience for your daily journey'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
              {currentLang === 'ml' ? (
                <>
                  ഓരോ ദിവസവും <span className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-900 bg-clip-text text-transparent">വെട്ടി അടയാളപ്പെടുത്താം</span>, ഓർമ്മകൾ സൂക്ഷിക്കാം.
                </>
              ) : (
                <>
                  Cross out your days, <br />
                  <span className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-900 bg-clip-text text-transparent">
                    cherish your life journey.
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-stone-600 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0 font-malayalam">
              {currentLang === 'ml'
                ? 'ഭിത്തിയിൽ തൂക്കിയിട്ട കലണ്ടറിലെ പോലെ ദിവസങ്ങളിൽ അടയാളങ്ങൾ രേഖപ്പെടുത്തുക. മലയാളത്തിലോ ഇംഗ്ലീഷിലോ കുറിപ്പുകൾ, മനോഹരമായ നിറങ്ങൾ, നിങ്ങളുടെ ബ്രൗസറിൽ തികച്ചും സ്വകാര്യമായി.'
                : 'Experience the tactile satisfaction of crossing out completed days on a physical wall calendar. Dual color palettes, rich bilingual notes, and isolated browser privacy.'}
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
              <div className="p-3 bg-white/80 rounded-2xl border border-stone-200/70 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 font-malayalam">
                  {currentLang === 'ml' ? 'റിയൽ വാൾ കലണ്ടർ' : 'Wall Calendar'}
                </h4>
                <p className="text-[11px] text-stone-500 font-malayalam mt-0.5">
                  {currentLang === 'ml' ? 'സ്പൈറൽ ലുക്ക് & ക്രോസ് മാർക്ക്' : 'Spiral bound aesthetic & hand-drawn X marks'}
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-2xl border border-stone-200/70 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                  <Palette className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 font-malayalam">
                  {currentLang === 'ml' ? 'ഇഷ്ട നിറങ്ങൾ & കുറിപ്പുകൾ' : 'Dual Colors & Notes'}
                </h4>
                <p className="text-[11px] text-stone-500 font-malayalam mt-0.5">
                  {currentLang === 'ml' ? 'മലയാളം & ഇംഗ്ലീഷ് യൂണികോഡ്' : 'Custom hex colors & Malayalam unicode notes'}
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-2xl border border-stone-200/70 shadow-2xs">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 font-malayalam">
                  {currentLang === 'ml' ? 'ബ്രൗസർ സുരക്ഷ' : 'Browser Session'}
                </h4>
                <p className="text-[11px] text-stone-500 font-malayalam mt-0.5">
                  {currentLang === 'ml' ? 'ക്രിപ്റ്റോഗ്രാഫിക് സെഷൻ ഐസൊലേഷൻ' : 'Cryptographically isolated device session'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Phone Entry Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:col-span-5 w-full"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-900/5 border border-stone-200/90 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/40 rounded-full blur-2xl pointer-events-none" />

              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-bold mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-teal-700" />
                  <span>{currentLang === 'ml' ? 'ഉടൻ ആരംഭിക്കാം' : 'Instant Calendar Access'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {currentLang === 'ml' ? 'കലണ്ടറിലേക്ക് പ്രവേശിക്കുക' : 'Enter Your Calendar'}
                </h2>
                <p className="text-xs text-stone-500 font-malayalam mt-1">
                  {currentLang === 'ml'
                    ? 'OTP അല്ലെങ്കിൽ പാസ്‌വേർഡ് ആവശ്യമില്ല. ഫോൺ നമ്പർ നൽകി തുടരുക.'
                    : 'No OTP or password required. Enter your phone number to access your personal calendar.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                    {currentLang === 'ml' ? 'മൊബൈൽ നമ്പർ' : 'Mobile Number'}
                  </label>
                  <div className="flex items-center rounded-2xl border-2 border-stone-200 bg-stone-50/70 focus-within:border-teal-700 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-100 transition-all overflow-hidden shadow-inner">
                    <span className="px-3.5 py-3.5 text-sm font-bold text-stone-600 bg-stone-100 border-r border-stone-200 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder={currentLang === 'ml' ? '10 അക്ക മൊബൈൽ നമ്പർ' : '10-digit mobile number'}
                      disabled={isSubmitting}
                      className="w-full px-3.5 py-3.5 text-base sm:text-lg font-bold text-stone-900 placeholder:text-stone-400 placeholder:font-normal bg-transparent outline-none tracking-wider"
                    />
                  </div>
                </div>

                {/* Error message display */}
                {(validationError || authError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{validationError || authError}</span>
                  </motion.div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || phone.length !== 10}
                  className={`
                    w-full py-4 rounded-2xl text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md cursor-pointer
                    ${phone.length === 10 && !isSubmitting
                      ? 'bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-900 hover:to-teal-800 text-white shadow-teal-900/20 hover:shadow-lg'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{currentLang === 'ml' ? 'തുടങ്ങുന്നു...' : 'Entering Calendar...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{currentLang === 'ml' ? 'കലണ്ടറിലേക്ക് തുടരുക' : 'Continue to Calendar'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* Privacy & Browser Session Notice */}
              <div className="mt-5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowPrivacyNote(!showPrivacyNote)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-stone-500 hover:text-teal-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-700" />
                    <span>{currentLang === 'ml' ? 'സ്വകാര്യത & ബ്രൗസർ സെഷൻ വിവരങ്ങൾ' : 'Privacy & Device Session Notice'}</span>
                  </span>
                  <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {showPrivacyNote && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900/90 leading-relaxed font-malayalam"
                  >
                    {currentLang === 'ml' ? (
                      <p>
                        നിങ്ങളുടെ കലണ്ടർ വിവരങ്ങൾ ഈ ബ്രൗസറുമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു (Device-bound session). മറ്റൊരു ബ്രൗസറിൽ നിന്നോ ഫോണിൽ നിന്നോ നിങ്ങളുടെ ഫോൺ നമ്പർ അടിച്ചാൽ നിങ്ങളുടെ ഡാറ്റ മറ്റാർക്കും ലഭിക്കില്ല. കുക്കികൾ ക്ലിയർ ചെയ്യുകയോ ഇൻകോഗ്നിറ്റോ വിൻഡോ ക്ലോസ് ചെയ്യുകയോ ചെയ്താൽ ഡാറ്റ ലഭ്യമായേക്കില്ല.
                      </p>
                    ) : (
                      <p>
                        Your personal calendar is cryptographically tied to this browser session. Entering your phone number on another device will not expose your data. Clearing browser cookies or using incognito mode may prevent restoring unverified session records.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
