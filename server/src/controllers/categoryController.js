import { Category } from '../models/Category.js';
import { createCategorySchema, updateCategorySchema } from '../validators/categoryValidator.js';

export const categoryController = {
  /**
   * GET /api/categories
   * Returns default system categories + user's custom categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await Category.find({
        $or: [
          { isDefault: true, userId: null },
          { userId: req.user._id }
        ]
      }).sort({ isDefault: -1, createdAt: 1 });

      res.status(200).json({ categories });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/categories
   * Creates a user-specific custom category
   */
  async createCategory(req, res, next) {
    try {
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { nameEn, nameMl } = parsed.data;
      const key = `custom_${nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;

      const category = await Category.create({
        key,
        nameEn,
        nameMl,
        isDefault: false,
        userId: req.user._id
      });

      res.status(201).json({
        message: 'Category created successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/categories/:id
   * Updates a user's custom category (Default categories are protected)
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const parsed = updateCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      if (category.isDefault) {
        return res.status(403).json({ error: 'Default system categories cannot be modified.' });
      }

      if (category.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You do not have permission to edit this category.' });
      }

      if (parsed.data.nameEn) category.nameEn = parsed.data.nameEn;
      if (parsed.data.nameMl) category.nameMl = parsed.data.nameMl;

      await category.save();

      res.status(200).json({
        message: 'Category updated successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/categories/:id
   * Deletes a user's custom category (Default categories cannot be deleted)
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      if (category.isDefault) {
        return res.status(403).json({ error: 'Default system categories cannot be deleted.' });
      }

      if (category.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You do not have permission to delete this category.' });
      }

      await Category.deleteOne({ _id: category._id });

      res.status(200).json({
        message: 'Custom category deleted successfully. Existing activities retain their category snapshot.'
      });
    } catch (error) {
      next(error);
    }
  }
};
