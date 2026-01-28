// services/ocrEngine.js - FIXED VERSION WITH CZECH SUPPORT

import Tesseract from 'tesseract.js';
import { preprocessImage } from '../utils/imageProcessing';

class OCREngine {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.progressCallbacks = [];
    this.currentJob = null;
    this.currentLanguage = 'eng';
  }

  async initialize(language = 'eng') {
    if (this.initializationPromise && this.currentLanguage === language) {
      return this.initializationPromise;
    }

    // Terminate existing worker if language changes
    if (this.worker && this.currentLanguage !== language) {
      await this.terminate();
    }

    this.initializationPromise = (async () => {
      try {
        console.log(`🔄 Initializing OCR Engine for ${language}...`);
        
        // Enhanced language handling for Czech
        const langCode = language === 'ces' ? 'ces' : language;
        
        // REMOVED the problematic workerPath option
        this.worker = await Tesseract.createWorker(langCode, 1, {
          logger: message => this.handleProgress(message),
          errorHandler: err => console.error('OCR Worker Error:', err),
        });
        
        console.log('✅ Worker created, setting parameters...');
        
        // Enhanced parameters for better Czech character recognition
        await this.worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1',
          // Extended character whitelist for Czech diacritics
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ .,!?@#$%&*()_-+={}[]|:;"\'<>/\\',
          textord_tabfind_find_tables: '1',
          tessedit_create_hocr: '0',
          tessedit_create_tsv: '0',
          tessedit_create_pdf: '0',
          
        });
        
        this.isInitialized = true;
        this.currentLanguage = language;
        console.log(`✅ OCR Engine initialized for ${language}`);
        return true;
      } catch (error) {
        console.error('❌ OCR Initialization failed:', error);
        this.initializationPromise = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async setLanguage(language) {
    if (language === this.currentLanguage && this.isInitialized) {
      return;
    }
    
    await this.initialize(language);
  }

  handleProgress(message) {
    console.log('OCR Progress:', message);
    this.progressCallbacks.forEach(callback => {
      if (typeof callback === 'function') {
        callback(message);
      }
    });
  }

  onProgress(callback) {
    if (typeof callback === 'function') {
      this.progressCallbacks.push(callback);
    }
  }

  offProgress(callback) {
    this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
  }

  async recognizeText(imageData, options = {}) {
    // Set language before processing if specified
    if (options.language && options.language !== this.currentLanguage) {
      await this.setLanguage(options.language);
    } else if (!this.isInitialized) {
      await this.initialize(this.currentLanguage);
    }

    try {
      console.log(`🔍 Starting text recognition in ${this.currentLanguage}...`);
      
      let processedImage = imageData;
      
      // Only preprocess if it's not already processed and preprocessing is enabled
      if (options.preprocess !== false && !options.isPDFConverted) {
        console.log('🖼️ Preprocessing image for OCR...');
        processedImage = await preprocessImage(imageData, {
          documentMode: true,
          enhanceContrast: true,
          sharpness: 0.3,
          removeNoise: true,
          grayscale: true,
          brightness: 10,
          format: 'png',
          quality: 1.0
        });
      }

      console.log('📄 Sending image to Tesseract...');
      this.currentJob = this.worker.recognize(processedImage);
      
      const { data } = await this.currentJob;
      
      console.log('📊 OCR Raw Data:', {
        textLength: data.text?.length,
        confidence: data.confidence,
        blocks: data.blocks?.length,
        words: data.words?.length,
        lines: data.lines?.length,
        language: this.currentLanguage
      });

      const result = {
        text: data.text?.trim() || '',
        confidence: data.confidence || 0,
        blocks: data.blocks || [],
        words: data.words || [],
        lines: data.lines || [],
        recognized: (data.confidence || 0) > 0 && (data.text?.trim() || '').length > 0,
        timestamp: new Date().toISOString(),
        language: this.currentLanguage
      };

      console.log(`✅ Recognition completed with ${result.confidence}% confidence in ${this.currentLanguage}`);
      console.log(`📝 Extracted ${result.text.length} characters`);
      
      if (result.text) {
        console.log('📄 Sample extracted text:', result.text.substring(0, 200) + '...');
      }
      
      return result;
    } catch (error) {
      console.error('❌ OCR Recognition failed:', error);
      return {
        text: '',
        confidence: 0,
        blocks: [],
        words: [],
        lines: [],
        recognized: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        language: this.currentLanguage
      };
    }
  }

// FIXED recognizeDocument method - uses recognizeText internally
async recognizeDocument(imageData, documentType = 'document', language = 'eng') {
    console.log(`🔍 Recognizing ${documentType} document in ${language}...`);
    
    try {
        // Document-specific configurations for OCR parameters
      const documentConfigs = {
        receipt: {
            tessedit_pageseg_mode: '6', // Use string for better compatibility
            preserve_interword_spaces: '1',
            textord_tabfind_find_tables: '0',
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,!?@#$%&*()_-+={}[]|:;"\'<>/\\$€£'
        },
        business_card: {
            tessedit_pageseg_mode: '6',
            textord_tabfind_find_tables: '0',
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,!?@#$%&*()_-+={}[]|:;"\'<>/\\@+()'
        },
        id_card: {
            tessedit_pageseg_mode: '6',
            textord_tabfind_find_tables: '0',
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ /.-'
        },
       document: {
              tessedit_pageseg_mode: '6', // Changed from 3 to 6 (SINGLE_BLOCK)
    preserve_interword_spaces: '1',
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ .,!?@#$%&*()_-+={}[]|:;"\'<>/\\',
    textord_tabfind_find_tables: '1'
      },
        resume: {
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '1'
        },
        book: {
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '1'
        },
        translation: {
            tessedit_pageseg_mode: '3',
            preserve_interword_spaces: '1'
        },
        price_tag: {
            tessedit_pageseg_mode: '6',
            textord_tabfind_find_tables: '0',
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$€£ .,'
        },
        package: {
            tessedit_pageseg_mode: '6', // Changed from SINGLE_WORD to SINGLE_BLOCK
            preserve_interword_spaces: '1',
            textord_tabfind_find_tables: '0'
        },
        medicine: {
            tessedit_pageseg_mode: '6',
            textord_tabfind_find_tables: '0',
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz mg/%:.-'
        },
        handwriting: {
            tessedit_pageseg_mode: '6',
            textord_tabfind_find_tables: '0'
        }
    };

        // Apply document-specific configuration
        const config = documentConfigs[documentType] || documentConfigs.document;
        console.log(`📄 Applying ${documentType} configuration:`, config);
        
        // Set language first
        if (language && language !== this.currentLanguage) {
            await this.setLanguage(language);
        } else if (!this.isInitialized) {
            await this.initialize(this.currentLanguage);
        }

        // Apply document-specific parameters
        if (this.isInitialized) {
            await this.worker.setParameters(config);
        }

        // FIXED: Use the working recognizeText method directly
        // Skip preprocessing since AdvancedOCR already handles it
        console.log(`🔤 Starting OCR for ${documentType} using recognizeText...`);
        
        const ocrResult = await this.recognizeText(imageData, {
            preprocess: false, // Skip preprocessing - AdvancedOCR handles it
            language: language,
            documentType: documentType,
            isPDFConverted: true // This also skips preprocessing in recognizeText
        });

        // Enhance result with document type information
        const enhancedResult = {
            ...ocrResult,
            documentType: documentType,
            language: language,
            timestamp: new Date().toISOString()
        };

        console.log(`✅ ${documentType} recognition completed:`, {
            confidence: enhancedResult.confidence,
            textLength: enhancedResult.text?.length || 0,
            words: enhancedResult.words?.length || 0,
            documentType: documentType,
            language: language
        });

        return enhancedResult;

    } catch (error) {
        console.error(`❌ ${documentType} recognition failed:`, error);
        
        return {
            text: '',
            confidence: 0,
            blocks: [],
            words: [],
            lines: [],
            documentType: documentType,
            language: language,
            recognized: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Add this after recognizeDocument method
async recognizeDocumentWithFallback(imageData, documentType = 'document', language = 'eng') {
    console.log(`🔄 Starting OCR for ${documentType} with fallback...`);
    
    // Try document-specific config first
    let result = await this.recognizeDocument(imageData, documentType, language);
    
    // If no text extracted, try with AUTO PSM
    if (!result.text || result.text.trim().length < 10) {
        console.log(`⚠️ ${documentType} OCR failed, trying AUTO mode...`);
        
        // Save current parameters
        const originalParams = await this.worker.getParameters();
        
        try {
            // Try with AUTO PSM (most forgiving)
            await this.worker.setParameters({
                tessedit_pageseg_mode: '3', // AUTO
                preserve_interword_spaces: '1'
            });
            
            const fallbackResult = await this.recognizeText(imageData, {
                preprocess: false,
                language: language
            });
            
            // Restore original parameters
            await this.worker.setParameters(originalParams);
            
            if (fallbackResult.text && fallbackResult.text.trim().length > 10) {
                console.log(`✅ Fallback successful for ${documentType}`);
                return {
                    ...fallbackResult,
                    documentType: documentType,
                    language: language,
                    timestamp: new Date().toISOString(),
                    usedFallback: true
                };
            }
        } catch (error) {
            console.error(`❌ Fallback also failed for ${documentType}:`, error);
            // Restore parameters on error
            await this.worker.setParameters(originalParams);
        }
    }
    
    return result;
}
  
  // New method for resume-specific OCR with language support
  async recognizeResume(imageData, language = null) {
    if (language && language !== this.currentLanguage) {
      await this.setLanguage(language);
    } else if (!this.isInitialized) {
      await this.initialize(this.currentLanguage);
    }

    if (this.isInitialized) {
      await this.worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1'
      });
    }
    
    return this.recognizeText(imageData, {
      preprocess: false, // Skip preprocessing - AdvancedOCR handles it
      documentType: 'resume',
      language: language || this.currentLanguage
    });
  }

  // Simple text detection for testing with language support
  async detectTextSimple(imageData, language = null) {
    if (language && language !== this.currentLanguage) {
      await this.setLanguage(language);
    }
    
    return this.recognizeText(imageData, {
      preprocess: false, // Skip preprocessing for testing
      language: language || this.currentLanguage
    });
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get available languages (static list for now)
  getAvailableLanguages() {
    return [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'chi_sim', name: 'Chinese Simplified' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'kor', name: 'Korean' },
      { code: 'ara', name: 'Arabic' },
      { code: 'hin', name: 'Hindi' },
      { code: 'ces', name: 'Czech' }
    ];
  }

  async terminate() {
    if (this.currentJob) {
      await this.currentJob.terminate();
      this.currentJob = null;
    }
    
    if (this.worker) {
      await this.worker.terminate();
      this.isInitialized = false;
      this.initializationPromise = null;
      this.progressCallbacks = [];
      this.currentLanguage = 'eng';
      console.log('🔴 OCR Engine terminated');
    }
  }

  // Method to reload worker with new language
  async reloadWithLanguage(language) {
    await this.terminate();
    await this.initialize(language);
  }

  // Enhanced method for Czech-specific OCR with optimized settings
  async recognizeCzechText(imageData, options = {}) {
    // Ensure Czech language is set
    if (this.currentLanguage !== 'ces') {
      await this.setLanguage('ces');
    }

    // Optimize parameters for Czech language
    if (this.isInitialized) {
      await this.worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ .,!?@#$%&*()_-+={}[]|:;"\'<>/\\',
        textord_tabfind_find_tables: '1',
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
      });
    }

    return this.recognizeText(imageData, {
      ...options,
      language: 'ces',
      preprocess: options.preprocess !== false
    });
  }

  // Method to detect if text contains Czech characters
  containsCzechCharacters(text) {
    const czechChars = /[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/;
    return czechChars.test(text);
  }

  // Auto-detect language based on character patterns
  async autoDetectLanguage(imageData) {
    // First try with English
    const englishResult = await this.detectTextSimple(imageData, 'eng');
    
    // Check if text contains Czech characters
    if (this.containsCzechCharacters(englishResult.text)) {
      console.log('🔍 Czech characters detected, switching to Czech OCR');
      // Re-run with Czech for better accuracy
      return await this.recognizeCzechText(imageData);
    }
    
    return englishResult;
  }
}

export default new OCREngine();