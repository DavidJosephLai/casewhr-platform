/**
 * 儀表板語言支援測試腳本
 * 
 * 用於驗證儀表板組件在三語系統下的正常運作
 */

import { translations, getTranslation, Language } from '../lib/translations';

console.log('🧪 Testing Dashboard Language Support...\n');

// Test all language variants
const languages: Language[] = ['en', 'zh', 'zh-TW', 'zh-CN'];

languages.forEach(lang => {
  console.log(`\n📝 Testing language: ${lang}`);
  
  try {
    // Method 1: Direct access (old way - may fail for zh-TW, zh-CN)
    const directAccess = (translations as any)[lang];
    console.log(`  ✓ Direct access (translations['${lang}']): ${directAccess ? 'EXISTS' : 'MISSING'}`);
    
    if (directAccess?.dashboard) {
      console.log(`    - dashboard.title: "${directAccess.dashboard.title}"`);
    } else {
      console.log(`    ⚠️ dashboard object not found`);
    }
  } catch (error) {
    console.log(`  ❌ Direct access failed:`, error);
  }
  
  try {
    // Method 2: Using getTranslation helper (recommended)
    const translation = getTranslation(lang);
    console.log(`  ✓ getTranslation('${lang}'): ${translation ? 'EXISTS' : 'MISSING'}`);
    
    if (translation?.dashboard) {
      console.log(`    - dashboard.title: "${translation.dashboard.title}"`);
    } else {
      console.log(`    ⚠️ dashboard object not found`);
    }
  } catch (error) {
    console.log(`  ❌ getTranslation failed:`, error);
  }
});

console.log('\n\n✅ Language Support Test Complete!');
console.log('\n📋 Recommendations:');
console.log('  1. Always use getTranslation(language) instead of translations[language]');
console.log('  2. Migrate old localStorage "zh" values to "zh-TW" or "zh-CN"');
console.log('  3. Update all components to use the getTranslation helper');
