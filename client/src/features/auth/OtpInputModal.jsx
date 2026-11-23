import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';

export default function OtpInputModal({
  phoneNumber,
  onVerifyOtp,
  onResendOtp,
  onChangePhone,
  devOtpHint,
  isLoading = false,
  error = null
}) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (300 seconds)
  const [resendCooldown, setResendCooldown] = useState(30); // 30s resend cooldown
  const inputRefs = useRef([]);

  // Auto-focus first input box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 5-minute expiry countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // If user pastes full 6 digits
    if (cleaned.length >= 6) {
      const pasted = cleaned.slice(0, 6).split('');
      setDigits(pasted);
      inputRefs.current[5]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned[cleaned.length - 1]; // Take the latest character
    setDigits(nextDigits);

    // Auto-advance to next input
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullOtp = digits.join('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fullOtp.length === 6) {
      onVerifyOtp(fullOtp);
    }
  };

  const handleQuickFill = (otp) => {
    if (otp && otp.length === 6) {
      setDigits(otp.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full space-y-5">
      {/* Back button & Phone Summary */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onChangePhone}
          className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors font-medium cursor-pointer font-malayalam"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('auth.changeNumber')}</span>
        </button>
        <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
          +91 {phoneNumber}
        </span>
      </div>

      {/* Dev Mode Banner (helps local testing effortlessly) */}
      {devOtpHint && (
        <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{t('auth.devModeOtp')}</strong> <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">{devOtpHint}</code>
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleQuickFill(devOtpHint)}
            className="text-[11px] font-bold text-amber-800 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-malayalam"
          >
            {t('auth.autoFill')}
          </button>
        </div>
      )}

      {/* 6 Digit Inputs */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 text-center font-malayalam">
            {t('auth.otpTitle')}
          </label>
          <div className="flex justify-between gap-2 max-w-xs mx-auto">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                disabled={isLoading}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono text-stone-900 bg-white border border-stone-300 rounded-xl focus:border-teal-600 focus:ring-2 focus:ring-teal-100 focus:outline-hidden shadow-2xs transition-all"
              />
            ))}
          </div>

          {error && (
            <p className="mt-2 text-xs font-medium text-red-600 text-center flex items-center justify-center gap-1 font-malayalam">
              <span>⚠️</span>
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Expiry & Resend Controls */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 font-malayalam">
          <div className="flex items-center gap-1">
            <span>{t('auth.expiresIn')}</span>
            <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-600' : 'text-stone-700'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>

          <button
            type="button"
            disabled={resendCooldown > 0 || isLoading}
            onClick={() => {
              onResendOtp();
              setResendCooldown(30);
              setTimeLeft(300);
            }}
            className="text-teal-700 hover:text-teal-800 disabled:text-stone-400 font-semibold flex items-center gap-1 transition-colors disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>
              {resendCooldown > 0
                ? `${t('auth.resend')} (${resendCooldown}s)`
                : t('auth.resendOtp')}
            </span>
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || fullOtp.length !== 6 || timeLeft <= 0}
          className="w-full py-3.5 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed transition-all active:scale-[0.99] cursor-pointer font-malayalam"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('auth.verifying')}</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>{t('auth.verifyAndContinue')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
