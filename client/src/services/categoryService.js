import { api } from './api.js';

export const categoryService = {
  async getCategories() {
    const res = await api.get('/categories');
    return res.data.categories;
  },

  async createCategory(data) {
    const res = await api.post('/categories', data);
    return res.data.category;
  },

  async updateCategory(id, data) {
    const res = await api.patch(`/categories/${id}`, data);
    return res.data.category;
  },

  async deleteCategory(id) {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  }
};
