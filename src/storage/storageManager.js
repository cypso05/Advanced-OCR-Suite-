// src/app/features/ocr/storage/storageManager.js

/**
 * Production-grade storage manager for IndexedDB
 * Handles all document storage, retrieval, and management
 */

import { SchemaValidator } from './schemaDefinitions.js';

export class StorageManager {
  constructor() {
    this.dbName = 'OCRDocumentDB';
    this.version = 3;
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize IndexedDB database
   */
  async init() {
    if (this.initialized) return true;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('✅ IndexedDB initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for different document types
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
          store.createIndex('documentType', 'documentType', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('confidence', 'confidence', { unique: false });
        }

        if (!db.objectStoreNames.contains('analytics')) {
          const store = db.createObjectStore('analytics', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('userCorrections')) {
          db.createObjectStore('userCorrections', { keyPath: 'documentId' });
        }

        console.log('📊 IndexedDB schema upgraded');
      };
    });
  }

  /**
   * Store a parsed document
   */
async storeDocument(documentData) {
  if (!this.initialized) await this.init();

  const document = {
    ...documentData,
    id: documentData.id || this.generateId(),
    timestamp: documentData.timestamp || new Date().toISOString(),
    version: documentData.version || '1.0.0',
    lastModified: new Date().toISOString()
  };

  try {
    // Simplified validation without SchemaValidator dependency
    let confidence = documentData.confidence || 50;
    let validationErrors = [];
    
    // Basic validation
    if (!document.documentType) {
      validationErrors.push('Missing document type');
    }
    if (!document.parsedData || typeof document.parsedData !== 'object') {
      validationErrors.push('Invalid parsed data');
    }
    
    if (validationErrors.length > 0) {
      console.warn('Document validation failed:', validationErrors);
      document.validationErrors = validationErrors;
    }

    // Calculate basic confidence
    if (document.parsedData) {
      const fields = Object.keys(document.parsedData);
      if (fields.length > 0) {
        const totalConfidence = fields.reduce((sum, field) => {
          return sum + (document.parsedData[field]?.confidence || 0);
        }, 0);
        confidence = Math.max(50, Math.round(totalConfidence / fields.length));
      }
    }
    
    document.confidence = confidence;
    
  } catch (error) {
    console.error('Document processing error:', error);
    document.confidence = documentData.confidence || 50;
    document.validationErrors = ['Processing error: ' + error.message];
  }

  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction(['documents'], 'readwrite');
    const store = transaction.objectStore('documents');
    const request = store.add(document);

    request.onsuccess = () => {
      console.log('✅ Document stored:', document.id);
      resolve({ ...document, dbId: request.result });
    };

    request.onerror = () => {
      console.error('Failed to store document:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all documents without filtering
 */
async getAllDocuments() {
  if (!this.initialized) await this.init();

  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction(['documents'], 'readonly');
    const store = transaction.objectStore('documents');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get documents by type
 */
async getDocumentsByType(documentType) {
  const allDocs = await this.getAllDocuments();
  return allDocs.filter(doc => doc.documentType === documentType);
}

/**
 * Simple document count
 */
async getDocumentCount() {
  const allDocs = await this.getAllDocuments();
  return allDocs.length;
}
  /**
   * Get document by ID
   */
  async getDocument(id) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all documents with filtering and pagination
   */
  async getDocuments(options = {}) {
    if (!this.initialized) await this.init();

    const {
      documentType = null,
      limit = 50,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const index = store.index(sortBy);
      const request = index.openCursor(null, sortOrder === 'desc' ? 'prev' : 'next');

      const results = [];
      let advanced = false;
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor && count < limit) {
          const document = cursor.value;

          // Apply filters
          if (!documentType || document.documentType === documentType) {
            if (advanced) {
              results.push(document);
              count++;
            } else if (results.length < offset) {
              // Skip to offset
              results.push(document);
              if (results.length === offset) {
                results.length = 0; // Clear the buffer
                advanced = true;
              }
            }
          }

          cursor.continue();
        } else {
          resolve({
            documents: results,
            total: results.length,
            hasMore: !!cursor
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update document with user corrections
   */
  async updateDocument(id, updates) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      // First get the existing document
      this.getDocument(id).then((existingDoc) => {
        if (!existingDoc) {
          reject(new Error('Document not found'));
          return;
        }

        const updatedDoc = {
          ...existingDoc,
          ...updates,
          lastModified: new Date().toISOString(),
          userCorrected: true
        };

        // Store correction for training data
        this.storeUserCorrection(id, existingDoc, updatedDoc)
          .then(() => {
            const transaction = this.db.transaction(['documents'], 'readwrite');
            const store = transaction.objectStore('documents');
            const request = store.put(updatedDoc);

            request.onsuccess = () => {
              console.log('✅ Document updated:', id);
              resolve(updatedDoc);
            };

            request.onerror = () => reject(request.error);
          })
          .catch(reject);
      }).catch(reject);
    });
  }

  /**
   * Store user corrections for model training
   */
  async storeUserCorrection(documentId, original, corrected) {
    if (!this.initialized) await this.init();

    const correction = {
      documentId,
      original,
      corrected,
      timestamp: new Date().toISOString(),
      documentType: original.documentType
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['userCorrections'], 'readwrite');
      const store = transaction.objectStore('userCorrections');
      const request = store.put(correction);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(id) {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('✅ Document deleted:', id);
        resolve(true);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get analytics data
   */
  async getAnalytics(documentType = null, timeRange = 'all') {
    if (!this.initialized) await this.init();

    const documents = await this.getDocuments({ documentType });
    return this.calculateAnalytics(documents.documents, documentType, timeRange);
  }

  /**
   * Calculate analytics from documents
   */
  calculateAnalytics(documents, documentType, timeRange) {
    const analytics = {
      totalDocuments: documents.length,
      averageConfidence: 0,
      byMonth: {},
      byWeek: {},
      byDay: {},
      insights: [],
      timeRange: timeRange // Include the applied time range in results
    };

    if (documents.length === 0) return analytics;

    // Filter documents by time range first
    const filteredDocuments = this.filterDocumentsByTimeRange(documents, timeRange);
    analytics.filteredCount = filteredDocuments.length;
    analytics.timeRange = timeRange;

    if (filteredDocuments.length === 0) return analytics;

    // Calculate average confidence on filtered documents
    const totalConfidence = filteredDocuments.reduce((sum, doc) => sum + (doc.confidence || 0), 0);
    analytics.averageConfidence = Math.round(totalConfidence / filteredDocuments.length);

    // Group by different time periods
    filteredDocuments.forEach(doc => {
      const date = new Date(doc.timestamp);
      
      // Group by month (YYYY-MM)
      const month = doc.timestamp.substring(0, 7);
      if (!analytics.byMonth[month]) {
        analytics.byMonth[month] = {
          count: 0,
          confidence: 0,
          documents: []
        };
      }
      analytics.byMonth[month].count++;
      analytics.byMonth[month].confidence += (doc.confidence || 0);
      analytics.byMonth[month].documents.push(doc);

      // Group by week (YYYY-Www)
      const week = this.getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
      if (!analytics.byWeek[weekKey]) {
        analytics.byWeek[weekKey] = {
          count: 0,
          confidence: 0,
          documents: []
        };
      }
      analytics.byWeek[weekKey].count++;
      analytics.byWeek[weekKey].confidence += (doc.confidence || 0);
      analytics.byWeek[weekKey].documents.push(doc);

      // Group by day (YYYY-MM-DD)
      const day = doc.timestamp.substring(0, 10);
      if (!analytics.byDay[day]) {
        analytics.byDay[day] = {
          count: 0,
          confidence: 0,
          documents: []
        };
      }
      analytics.byDay[day].count++;
      analytics.byDay[day].confidence += (doc.confidence || 0);
      analytics.byDay[day].documents.push(doc);
    });

    // Calculate average confidence for each time period
    Object.keys(analytics.byMonth).forEach(month => {
      analytics.byMonth[month].averageConfidence = Math.round(
        analytics.byMonth[month].confidence / analytics.byMonth[month].count
      );
    });

    Object.keys(analytics.byWeek).forEach(week => {
      analytics.byWeek[week].averageConfidence = Math.round(
        analytics.byWeek[week].confidence / analytics.byWeek[week].count
      );
    });

    Object.keys(analytics.byDay).forEach(day => {
      analytics.byDay[day].averageConfidence = Math.round(
        analytics.byDay[day].confidence / analytics.byDay[day].count
      );
    });

    // Generate insights based on time range and document type
    analytics.insights = this.generateInsights(filteredDocuments, documentType, timeRange);

    // Document type specific analytics on filtered documents
    if (documentType === 'receipt') {
      analytics.spending = this.calculateSpendingAnalytics(filteredDocuments);
    } else if (documentType === 'id_card') {
      analytics.expirations = this.calculateExpirationAnalytics(filteredDocuments);
    } else if (documentType === 'medicine') {
      analytics.medication = this.calculateMedicationAnalytics(filteredDocuments);
    }

    return analytics;
  }

  /**
   * Filter documents by time range
   */
  filterDocumentsByTimeRange(documents, timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
      default:
        return documents; // Return all documents
    }

    return documents.filter(doc => {
      const docDate = new Date(doc.timestamp);
      return docDate >= startDate && docDate <= now;
    });
  }

  /**
   * Get ISO week number for a date
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Generate insights based on analytics data
   */
  generateInsights(documents, documentType, timeRange) {
    const insights = [];

    if (documents.length === 0) return insights;

    // General insights
    if (documents.length > 10) {
      insights.push(`Strong activity with ${documents.length} documents processed in this period`);
    }

    // Confidence insights
    const avgConfidence = documents.reduce((sum, doc) => sum + (doc.confidence || 0), 0) / documents.length;
    if (avgConfidence > 80) {
      insights.push('High accuracy in document processing');
    } else if (avgConfidence < 60) {
      insights.push('Consider reviewing low-confidence documents for corrections');
    }

    // Document type specific insights
    if (documentType === 'receipt') {
      const totalSpending = documents.reduce((sum, doc) => {
        return sum + (parseFloat(doc.parsedData?.total) || 0);
      }, 0);
      
      if (totalSpending > 0) {
        insights.push(`Total spending: $${totalSpending.toFixed(2)}`);
      }

      // Peak day detection
      const dayCounts = {};
      documents.forEach(doc => {
        const day = doc.timestamp.substring(0, 10);
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      
      const peakDay = Object.entries(dayCounts).reduce((a, b) => a[1] > b[1] ? a : b);
      if (peakDay[1] > 2) {
        insights.push(`Peak activity on ${peakDay[0]} with ${peakDay[1]} receipts`);
      }
    }

    // Time-based insights
    if (timeRange === 'today' && documents.length > 5) {
      insights.push('High volume of documents processed today');
    } else if (timeRange === 'week' && documents.length === 0) {
      insights.push('No documents processed this week');
    }

    return insights;
  }

  /**
   * Calculate spending analytics for receipts
   */
  calculateSpendingAnalytics(documents) {
    const spending = {
      total: 0,
      byMonth: {},
      byCategory: {},
      topVendors: []
    };

    documents.forEach(doc => {
      const data = doc.parsedData || {};
      if (data.total) {
        spending.total += parseFloat(data.total) || 0;

        const month = doc.timestamp.substring(0, 7);
        spending.byMonth[month] = (spending.byMonth[month] || 0) + (parseFloat(data.total) || 0);

        // Category breakdown
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach(item => {
            const category = item.category || 'other';
            spending.byCategory[category] = (spending.byCategory[category] || 0) + (parseFloat(item.total_price) || 0);
          });
        }

        // Vendor tracking
        if (data.store_name) {
          const vendor = data.store_name;
          spending.topVendors[vendor] = (spending.topVendors[vendor] || 0) + 1;
        }
      }
    });

    // Convert top vendors to array and sort
    spending.topVendors = Object.entries(spending.topVendors)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return spending;
  }

  /**
   * Calculate expiration analytics for IDs and medicines
   */
  calculateExpirationAnalytics(documents) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expirations = {
      expired: 0,
      expiringSoon: 0,
      valid: 0,
      upcoming: []
    };

    documents.forEach(doc => {
      const data = doc.parsedData || {};
      const expDate = data.expiration_date || data.expiry_date;

      if (expDate) {
        const expiration = new Date(expDate);
        
        if (expiration < now) {
          expirations.expired++;
        } else if (expiration <= thirtyDaysFromNow) {
          expirations.expiringSoon++;
          expirations.upcoming.push({
            document: doc,
            daysUntil: Math.ceil((expiration - now) / (24 * 60 * 60 * 1000))
          });
        } else {
          expirations.valid++;
        }
      }
    });

    // Sort upcoming by days until expiration
    expirations.upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    return expirations;
  }

  /**
   * Calculate medication analytics
   */
  calculateMedicationAnalytics(documents) {
    // Similar to expiration analytics but for medications
    return this.calculateExpirationAnalytics(documents);
  }

  /**
   * Utility methods
   */
  generateId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async clearAll() {
    if (!this.initialized) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['documents', 'analytics', 'userCorrections'], 'readwrite');
      
      transaction.objectStore('documents').clear();
      transaction.objectStore('analytics').clear();
      transaction.objectStore('userCorrections').clear();

      transaction.oncomplete = () => {
        console.log('✅ All data cleared');
        resolve(true);
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStorageStats() {
    if (!this.initialized) await this.init();

    const documents = await this.getDocuments({ limit: 1000 });
    const byType = {};

    documents.documents.forEach(doc => {
      byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
    });

    return {
      totalDocuments: documents.documents.length,
      byDocumentType: byType,
      storageEstimate: await this.estimateStorage()
    };
  }

  async estimateStorage() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { usage: 0, quota: 0 };
    }

    return await navigator.storage.estimate();
  }
}

// Singleton instance
export const storageManager = new StorageManager();
export default storageManager;