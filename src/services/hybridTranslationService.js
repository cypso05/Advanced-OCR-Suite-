// services/hybridTranslationService.js - ENHANCED FOR CZECH

class HybridTranslationService {
  constructor() {
    this.methods = [
      this.translateViaLibreTranslate.bind(this),
      this.translateViaGoogleWeb.bind(this),
      this.translateViaMyMemory.bind(this),
      this.fallbackTranslation.bind(this)
    ];
    this.translationCache = new Map();
  }

  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    if (!text || text.trim().length === 0) return text;

    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text.substring(0, 100)}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    // Try each method in order until one works
    for (const method of this.methods) {
      try {
        console.log(`Trying translation method: ${method.name}`);
        const translated = await method(text, targetLanguage, sourceLanguage);
        
        if (translated && translated !== text && translated.trim().length > 0) {
          this.translationCache.set(cacheKey, translated);
          return translated;
        }
      } catch (error) {
        console.warn(`Translation method ${method.name} failed:`, error);
        continue;
      }
    }

    return this.fallbackTranslation(text, targetLanguage);
  }

  async translateViaLibreTranslate(text, targetLang, sourceLang) {
    const endpoints = [
      'https://translate.argosopentech.com/translate',
      'https://libretranslate.de/translate',
      'https://libretranslate.com/translate'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text.substring(0, 5000),
            source: sourceLang,
            target: targetLang,
            format: 'text'
          }),
          timeout: 10000
        });

        if (response.ok) {
          const data = await response.json();
          return data.translatedText;
        }
      } catch (error) {
        console.log(`LibreTranslate endpoint ${endpoint} failed:`, error);
        continue;
      }
    }
    throw new Error('All LibreTranslate endpoints failed');
  }

  async translateViaGoogleWeb(text, targetLang, sourceLang) {
    try {
      // Enhanced Google Translate API call
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*'
        },
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0]) {
          return data[0].map(segment => segment[0]).join('');
        }
      }
    } catch (error) {
      console.log('Google Web translation failed:', error);
    }
    throw new Error('Google Web translation failed');
  }

  async translateViaMyMemory(text, targetLang, sourceLang) {
    try {
      // MyMemory Translation API as fallback
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      
      const response = await fetch(url, { timeout: 10000 });
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (error) {
      console.log('MyMemory translation failed:', error);
    }
    throw new Error('MyMemory translation failed');
  }

  fallbackTranslation(text, targetLanguage) {
    // Enhanced fallback with basic Czech support
    const wordMap = {
      'en': {},
      'es': { 'the': 'el', 'and': 'y', 'is': 'es', 'to': 'a', 'of': 'de' },
      'fr': { 'the': 'le', 'and': 'et', 'is': 'est', 'to': 'à', 'of': 'de' },
      'de': { 'the': 'der', 'and': 'und', 'is': 'ist', 'to': 'zu', 'of': 'von' },
      'cs': { 
        'the': '', // Czech doesn't use articles
        'and': 'a', 
        'is': 'je', 
        'to': 'do', 
        'of': 'z',
        'hello': 'ahoj',
        'thank you': 'děkuji',
        'yes': 'ano',
        'no': 'ne'
      }
    };

    const map = wordMap[targetLanguage] || {};
    let translated = text;
    
    Object.keys(map).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      translated = translated.replace(regex, map[word]);
    });

    return translated !== text ? translated : text;
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'cs', name: 'Czech' }
    ];
  }

  // Helper method to convert OCR language codes to translation codes
  ocrToTranslationLang(ocrLangCode) {
    const mapping = {
      'eng': 'en',
      'spa': 'es', 
      'fra': 'fr',
      'deu': 'de',
      'ita': 'it',
      'por': 'pt',
      'rus': 'ru',
      'chi_sim': 'zh',
      'jpn': 'ja',
      'kor': 'ko',
      'ara': 'ar',
      'hin': 'hi',
      'ces': 'cs'
    };
    
    return mapping[ocrLangCode] || 'en';
  }
}

export default new HybridTranslationService();