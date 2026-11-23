import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Search, X } from 'lucide-react';

export default function CategorySelect({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  language,
  error = null
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);

  const filteredCategories = categories.filter((c) => {
    const nameEn = c.nameEn?.toLowerCase() || '';
    const nameMl = c.nameMl || '';
    const q = searchQuery.toLowerCase().trim();
    return nameEn.includes(q) || nameMl.includes(q);
  });

  const getDisplayName = (cat) => {
    if (!cat) return '';
    return currentLang === 'ml' ? cat.nameMl : cat.nameEn;
  };

  return (
    <div className="relative w-full font-malayalam" ref={dropdownRef}>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
        {t('activity.selectCategory')}
      </label>

      {/* Dropdown trigger button - clean text only */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-3.5 py-3 rounded-2xl bg-white border text-left flex items-center justify-between text-sm sm:text-base font-semibold transition-all shadow-2xs cursor-pointer font-malayalam
          ${error ? 'border-red-400 ring-1 ring-red-200' : 'border-stone-300 hover:border-teal-600 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'}
          ${selectedCategory ? 'text-stone-900' : 'text-stone-400'}
        `}
      >
        <span className="truncate">
          {selectedCategory
            ? getDisplayName(selectedCategory)
            : t('activity.categoryPlaceholder')}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-malayalam">
          {/* Search Box - Text only */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/70 flex items-center gap-2">
            <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('activity.search')}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:outline-hidden py-1 font-malayalam"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-stone-200 rounded-md text-stone-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clean Text-based list options */}
          <div className="max-h-60 overflow-y-auto divide-y divide-stone-50">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => {
                const isSelected = cat._id === selectedCategoryId;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat._id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`
                      w-full px-4 py-2.5 text-left text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer font-malayalam
                      ${isSelected
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                      }
                    `}
                  >
                    <span>{getDisplayName(cat)}</span>
                    {!cat.isDefault && (
                      <span className="text-[10px] uppercase font-semibold text-teal-700 bg-teal-100/60 px-1.5 py-0.5 rounded font-malayalam">
                        {t('activity.custom')}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-stone-400 font-malayalam">
                {t('activity.noCategories')}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium font-malayalam">
          {error}
        </p>
      )}
    </div>
  );
}
