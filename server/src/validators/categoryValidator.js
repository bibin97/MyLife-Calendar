import { z } from 'zod';

export const createCategorySchema = z.object({
  nameEn: z
    .string({ required_error: 'English category name is required' })
    .trim()
    .min(1, 'Category name (English) cannot be empty')
    .max(100, 'Category name too long'),
  nameMl: z
    .string({ required_error: 'Malayalam category name is required' })
    .trim()
    .min(1, 'Category name (Malayalam) cannot be empty')
    .max(100, 'Category name too long')
});

export const updateCategorySchema = z.object({
  nameEn: z
    .string()
    .trim()
    .min(1, 'Category name (English) cannot be empty')
    .max(100, 'Category name too long')
    .optional(),
  nameMl: z
    .string()
    .trim()
    .min(1, 'Category name (Malayalam) cannot be empty')
    .max(100, 'Category name too long')
    .optional()
});
