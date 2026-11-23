import { z } from 'zod';
import { isDateAllowed } from '../utils/dateValidator.js';

export const createActivitySchema = z.object({
  selectedDate: z
    .string({ required_error: 'Selected calendar date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  categoryId: z
    .string({ required_error: 'Category ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  notes: z
    .string()
    .max(5000, 'Notes cannot exceed 5000 characters')
    .optional()
    .default(''),
  crossColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid cross color hex code')
    .optional()
    .default('#dc2626'),
  noteColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid note color hex code')
    .optional()
    .default('#1e3a8a')
});

export const updateActivitySchema = z.object({
  categoryId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
    .optional(),
  notes: z
    .string()
    .max(5000, 'Notes cannot exceed 5000 characters')
    .optional(),
  crossColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid cross color hex code')
    .optional(),
  noteColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid note color hex code')
    .optional()
});
