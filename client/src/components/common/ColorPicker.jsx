import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export const PRESET_COLORS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Black', hex: '#1c1917' }
];

export default function ColorPicker({
  label,
  value = '#dc2626',
  onChange,
  language
}) {
  const { t } = useTranslation();
  const isCustom = !PRESET_COLORS.some((c) => c.hex.toLowerCase() === value.toLowerCase());

  return (
    <div className="space-y-2 font-malayalam">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
          {label}
        </label>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
          {value.toUpperCase()}
        </span>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
        {PRESET_COLORS.map((col) => {
          const isSelected = value.toLowerCase() === col.hex.toLowerCase();
          return (
            <button
              key={col.hex}
              type="button"
              onClick={() => onChange(col.hex)}
              aria-label={col.name}
              style={{ backgroundColor: col.hex }}
              className={`
                h-8 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-150 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer
                ${isSelected ? 'ring-2 ring-offset-2 ring-stone-900 shadow-md scale-105' : 'hover:opacity-90'}
              `}
            >
              {isSelected && (
                <Check
                  className={`w-4 h-4 stroke-[3] ${
                    col.hex === '#eab308' || col.hex === '#facc15' ? 'text-stone-900' : 'text-white'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center gap-2 pt-1 font-malayalam">
        <div className="relative flex items-center w-8 h-8 rounded-lg overflow-hidden border border-stone-300 shadow-2xs cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0"
          />
          <div
            className="w-full h-full"
            style={{ backgroundColor: value }}
          />
        </div>
        <input
          type="text"
          value={value}
          maxLength={7}
          onChange={(e) => {
            const val = e.target.value;
            if (val.startsWith('#') || val === '') {
              onChange(val);
            } else {
              onChange(`#${val}`);
            }
          }}
          placeholder="#000000"
          className="w-28 px-2.5 py-1 text-xs font-mono font-bold uppercase rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
        />
        <span className="text-[11px] text-stone-500 font-medium">
          {t('activity.customColor')}
        </span>
      </div>
    </div>
  );
}
