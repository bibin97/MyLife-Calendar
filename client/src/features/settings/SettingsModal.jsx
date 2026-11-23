import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Settings as SettingsIcon, User, Globe, Clock, Layers, Plus, Pencil, Trash2, Check, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { categoryService } from '../../services/categoryService.js';
import { changeAppLanguage } from '../../i18n.js';

export const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30) — India' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00) — UAE / Gulf' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST +3:00) — Saudi Arabia' },
  { value: 'Asia/Qatar', label: 'Asia/Qatar (AST +3:00) — Qatar' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (AST +3:00) — Kuwait' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00) — Singapore' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST) — UK' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST) — Germany' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST) — France' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT) — US East' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT) — US Central' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT) — US Pacific' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT) — Australia' }
];

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  categories = [],
  onCategoriesChanged,
  onShowToast
}) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'categories'

  // Profile Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || i18n.language || 'en');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Category Form state
  const [categoryNameEn, setCategoryNameEn] = useState('');
  const [categoryNameMl, setCategoryNameMl] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Delete Category confirmation state
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        displayName: displayName.trim(),
        preferredLanguage,
        timezone
      });
      // Synchronize frontend language if changed
      if (preferredLanguage !== i18n.language) {
        changeAppLanguage(preferredLanguage);
      }
      onShowToast?.(t('settings.profileSaved'), 'success');
      onClose();
    } catch (err) {
      onShowToast?.(err.message || t('settings.profileFailed'), 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateOrUpdateCategory = async (e) => {
    e.preventDefault();
    if (!categoryNameEn.trim() || !categoryNameMl.trim()) {
      setCategoryError(t('settings.nameRequired'));
      return;
    }
    setCategoryError('');
    setIsSubmittingCategory(true);

    try {
      if (editingCategoryId) {
        await categoryService.updateCategory(editingCategoryId, {
          nameEn: categoryNameEn.trim(),
          nameMl: categoryNameMl.trim()
        });
        onShowToast?.(t('settings.categoryUpdated'), 'success');
      } else {
        await categoryService.createCategory({
          nameEn: categoryNameEn.trim(),
          nameMl: categoryNameMl.trim()
        });
        onShowToast?.(t('settings.categoryCreated'), 'success');
      }
      setCategoryNameEn('');
      setCategoryNameMl('');
      setEditingCategoryId(null);
      onCategoriesChanged?.();
    } catch (err) {
      setCategoryError(err.message || t('settings.categoryFailed'));
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCategoryId(cat._id);
    setCategoryNameEn(cat.nameEn);
    setCategoryNameMl(cat.nameMl);
    setCategoryError('');
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setCategoryNameEn('');
    setCategoryNameMl('');
    setCategoryError('');
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory || isDeletingCategory) return;
    setIsDeletingCategory(true);
    try {
      await categoryService.deleteCategory(deletingCategory._id);
      onShowToast?.(t('settings.categoryDeleted'), 'success');
      setDeletingCategory(null);
      onCategoriesChanged?.();
    } catch (err) {
      onShowToast?.(err.message || t('settings.categoryFailed'), 'error');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const customCategories = categories.filter((c) => !c.isDefault);
  const defaultCategories = categories.filter((c) => c.isDefault);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-stone-200/90 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-teal-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 font-malayalam">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700/80 border border-teal-600 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {t('settings.title')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-teal-200 hover:text-white hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 shrink-0 font-malayalam text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-teal-700 text-teal-800 bg-white font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t('settings.profileTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'border-teal-700 text-teal-800 bg-white font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('settings.categoriesTab')} ({customCategories.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 font-malayalam flex-1">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Account / Phone (Read-Only) */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="flex items-center gap-2 text-stone-700 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>{t('settings.phoneNumber')}</span>
                </div>
                <div className="font-mono font-extrabold text-sm text-stone-900 pl-6">
                  {user?.phoneNumber || '—'}
                </div>
                <p className="text-[11px] text-stone-400 pl-6">
                  {t('settings.phoneNote')}
                </p>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  {t('settings.displayName')}
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('settings.displayNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-900 focus:outline-hidden focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-700" />
                  <span>{t('settings.preferredLanguage')}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('en')}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      preferredLanguage === 'en'
                        ? 'border-teal-700 bg-teal-50 text-teal-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('ml')}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold font-malayalam transition-all cursor-pointer ${
                      preferredLanguage === 'ml'
                        ? 'border-teal-700 bg-teal-50 text-teal-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    മലയാളം
                  </button>
                </div>
              </div>

              {/* Timezone Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  <span>{t('settings.timezone')}</span>
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-medium text-stone-900 focus:outline-hidden focus:border-teal-600 focus:ring-2 focus:ring-teal-100 cursor-pointer"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('settings.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t('settings.saveChanges')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  {t('settings.categoriesTitle')}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('settings.categoriesSubtitle')}
                </p>
              </div>

              {/* Add / Edit Category Form */}
              <form onSubmit={handleCreateOrUpdateCategory} className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-teal-900">
                    {editingCategoryId ? t('settings.editCategory') : t('settings.addCategory')}
                  </span>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                    >
                      {t('settings.cancel')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('settings.categoryNameEn')}
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={categoryNameEn}
                      onChange={(e) => setCategoryNameEn(e.target.value)}
                      placeholder={t('settings.categoryNameEnPlaceholder')}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-900 focus:outline-hidden focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {t('settings.categoryNameMl')}
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={categoryNameMl}
                      onChange={(e) => setCategoryNameMl(e.target.value)}
                      placeholder={t('settings.categoryNameMlPlaceholder')}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-900 font-malayalam focus:outline-hidden focus:border-teal-600"
                    />
                  </div>
                </div>

                {categoryError && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ {categoryError}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingCategory}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    {isSubmittingCategory ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{editingCategoryId ? t('settings.updating') : t('settings.creating')}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{editingCategoryId ? t('settings.editCategory') : t('settings.createCategory')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Custom Categories List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t('settings.categoriesTab')} ({customCategories.length})
                </span>

                {customCategories.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-3 text-center bg-stone-50 rounded-xl border border-stone-100">
                    {t('settings.noCustomCategories')}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {customCategories.map((cat) => (
                      <div
                        key={cat._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200 shadow-2xs hover:border-teal-300 transition-colors"
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-stone-900">
                            {cat.nameEn}
                          </div>
                          <div className="text-xs text-stone-500 font-malayalam">
                            {cat.nameMl}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            title={t('settings.editCategory')}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(cat)}
                            title={t('settings.deleteCategory')}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Protected System Categories Summary */}
              <div className="pt-2 border-t border-stone-200">
                <span className="text-[11px] font-bold uppercase text-stone-400 block mb-1.5">
                  {t('settings.defaultProtected')} ({defaultCategories.length})
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                  {defaultCategories.map((c) => (
                    <span
                      key={c._id || c.key}
                      className="text-[11px] font-medium bg-white text-stone-600 px-2 py-0.5 rounded-md border border-stone-200"
                    >
                      {i18n.language === 'ml' ? c.nameMl : c.nameEn}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Category Confirmation Dialog */}
      {deletingCategory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-malayalam">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900">
                  {t('settings.deleteCategory')}
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  {deletingCategory.nameEn} / {deletingCategory.nameMl}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {t('settings.deleteCategoryConfirm')}
            </p>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeletingCategory}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                {t('settings.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={isDeletingCategory}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingCategory && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('settings.deleteCategoryBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}