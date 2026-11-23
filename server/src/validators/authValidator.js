import { z } from 'zod';

export const requestOtpSchema = z.object({
  phoneNumber: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .transform((val) => {
      // Normalize: if 10 digits without country code, prepend +91
      const cleaned = val.replace(/[\s-]/g, '');
      if (/^\d{10}$/.test(cleaned)) {
        return `+91${cleaned}`;
      }
      return cleaned;
    })
    .refine((val) => /^\+91[6-9]\d{9}$/.test(val), {
      message: 'Please enter a valid 10-digit Indian mobile number (+91)'
    })
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .transform((val) => {
      const cleaned = val.replace(/[\s-]/g, '');
      if (/^\d{10}$/.test(cleaned)) {
        return `+91${cleaned}`;
      }
      return cleaned;
    })
    .refine((val) => /^\+91[6-9]\d{9}$/.test(val), {
      message: 'Invalid phone number format'
    }),
  otp: z
    .string({ required_error: 'OTP is required' })
    .trim()
    .length(6, { message: 'OTP must be exactly 6 digits' })
    .regex(/^\d{6}$/, { message: 'OTP must contain numbers only' })
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { message: 'Display name cannot be empty' })
    .max(50, { message: 'Display name cannot exceed 50 characters' })
    .optional(),
  preferredLanguage: z
    .enum(['en', 'ml'], { errorMap: () => ({ message: 'Preferred language must be en or ml' }) })
    .optional(),
  timezone: z
    .string()
    .refine((tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, { message: 'Invalid IANA timezone identifier' })
    .optional()
});
