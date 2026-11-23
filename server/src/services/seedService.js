import { Category } from '../models/Category.js';

export const DEFAULT_CATEGORIES = [
  // Christian / Spiritual (9)
  { key: 'went_to_church', nameEn: 'Went to Church', nameMl: 'പള്ളിയിൽ പോയി' },
  { key: 'prayed', nameEn: 'Prayed', nameMl: 'പ്രാർത്ഥിച്ചു' },
  { key: 'read_the_bible', nameEn: 'Read the Bible', nameMl: 'ബൈബിൾ വായിച്ചു' },
  { key: 'attended_holy_mass', nameEn: 'Attended Holy Mass', nameMl: 'വിശുദ്ധ കുർബാനയിൽ പങ്കെടുത്തു' },
  { key: 'prayed_the_rosary', nameEn: 'Prayed the Rosary', nameMl: 'ജപമാല ചൊല്ലി' },
  { key: 'personal_prayer', nameEn: 'Personal Prayer', nameMl: 'വ്യക്തിപരമായ പ്രാർത്ഥന' },
  { key: 'bible_study', nameEn: 'Bible Study', nameMl: 'ബൈബിൾ പഠനം' },
  { key: 'confession', nameEn: 'Confession', nameMl: 'കുമ്പസാരം' },
  { key: 'charity', nameEn: 'Charity', nameMl: 'ദാനധർമ്മം' },

  // Personal Care (7)
  { key: 'took_a_bath', nameEn: 'Took a Bath', nameMl: 'കുളിച്ചു' },
  { key: 'brushed_teeth', nameEn: 'Brushed Teeth', nameMl: 'പല്ല് തേച്ചു' },
  { key: 'exercised', nameEn: 'Exercised', nameMl: 'വ്യായാമം ചെയ്തു' },
  { key: 'went_walking', nameEn: 'Went Walking', nameMl: 'നടക്കാൻ പോയി' },
  { key: 'drank_water', nameEn: 'Drank Water', nameMl: 'വെള്ളം കുടിച്ചു' },
  { key: 'ate_healthy_food', nameEn: 'Ate Healthy Food', nameMl: 'ആരോഗ്യകരമായ ഭക്ഷണം കഴിച്ചു' },
  { key: 'slept_on_time', nameEn: 'Slept on Time', nameMl: 'സമയത്ത് ഉറങ്ങി' },

  // Learning (5)
  { key: 'studied', nameEn: 'Studied', nameMl: 'പഠിച്ചു' },
  { key: 'coding_practice', nameEn: 'Coding Practice', nameMl: 'കോഡിംഗ് പരിശീലിച്ചു' },
  { key: 'english_practice', nameEn: 'English Practice', nameMl: 'ഇംഗ്ലീഷ് പരിശീലിച്ചു' },
  { key: 'read_a_book', nameEn: 'Read a Book', nameMl: 'പുസ്തകം വായിച്ചു' },
  { key: 'completed_assignment', nameEn: 'Completed Assignment', nameMl: 'അസൈൻമെന്റ് പൂർത്തിയാക്കി' },

  // Daily Life (5)
  { key: 'completed_work', nameEn: 'Completed Work', nameMl: 'ജോലി പൂർത്തിയാക്കി' },
  { key: 'cleaned_room', nameEn: 'Cleaned Room', nameMl: 'മുറി വൃത്തിയാക്കി' },
  { key: 'helped_someone', nameEn: 'Helped Someone', nameMl: 'ഒരാളെ സഹായിച്ചു' },
  { key: 'family_time', nameEn: 'Family Time', nameMl: 'കുടുംബത്തോടൊപ്പം സമയം ചെലവഴിച്ചു' },
  { key: 'other', nameEn: 'Other', nameMl: 'മറ്റുള്ളവ' }
];

export const seedDefaultCategories = async () => {
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate(
      { key: cat.key, isDefault: true, userId: null },
      {
        $setOnInsert: {
          key: cat.key,
          nameEn: cat.nameEn,
          nameMl: cat.nameMl,
          isDefault: true,
          userId: null
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✅ Default bilingual categories verified (${DEFAULT_CATEGORIES.length} default categories)`);
};
