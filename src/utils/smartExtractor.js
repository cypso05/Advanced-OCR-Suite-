// src/utils/smartExtractor.js
import nlp from 'compromise';
import dates from 'compromise-dates';

// Add date plugin
nlp.extend(dates);

// Document-specific extraction rules
const DOCUMENT_RULES = {
  receipt: {
    patterns: {
      total: /(?:total|amount due|grand total)[:\s]*\$?\s*([\d,]+\.?\d{2})/i,
      tax: /(?:tax|vat|gst|sales tax)[:\s]*\$?\s*([\d,]+\.?\d{2})/i,
      subtotal: /(?:sub.?total)[:\s]*\$?\s*([\d,]+\.?\d{2})/i,
      date: /(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
      merchant: /^(?:from|merchant|store)[:\s]*(.+)/im,
    },
    required: ['total', 'date'],
  },
  invoice: {
    patterns: {
      invoiceNumber: /(?:invoice\s*#?|invoice no\.?)[:\s]*([A-Z0-9-]+)/i,
      vendor: /(?:vendor|supplier|from)[:\s]*(.+)/im,
      dueDate: /(?:due\s*date|payment due)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      total: /(?:total|balance due|amount)[:\s]*\$?\s*([\d,]+\.?\d{2})/i,
      poNumber: /(?:p\.?o\.?\s*#?|purchase order)[:\s]*([A-Z0-9-]+)/i,
    },
    required: ['invoiceNumber', 'total'],
  },
  id_card: {
    patterns: {
      name: /(?:name|full name)[:\s]*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i,
      idNumber: /(?:id\s*#?|number|passport)[:\s]*([A-Z0-9-]+)/i,
      dob: /(?:dob|date of birth|birth date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      expiry: /(?:expiry|expiration|valid thru)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      nationality: /(?:nationality|country)[:\s]*([A-Za-z]+)/i,
    },
    required: ['name', 'idNumber'],
  },
  shipping_label: {
    patterns: {
      trackingNumber: /(?:tracking\s*#?|tracking number)[:\s]*([A-Z0-9]{8,20})/i,
      carrier: /(?:carrier|shipper)[:\s]*([A-Za-z]+)/i,
      weight: /(?:weight)[:\s]*(\d+(?:\.\d+)?\s*(?:kg|lb|g|oz))/i,
      service: /(?:service|delivery)[:\s]*([A-Za-z]+)/i,
    },
    required: ['trackingNumber'],
  },
  medicine: {
    patterns: {
      drugName: /(?:drug|medication|medicine)[:\s]*([A-Z][A-Za-z\s]+)/i,
      expiry: /(?:expiry|expiration|use by)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      dosage: /(?:dosage|dose)[:\s]*(\d+(?:\.\d+)?\s*(?:mg|ml|g|tablets?))/i,
      frequency: /(?:frequency|take|use)[:\s]*(\d+\s*(?:times?|daily|weekly))/i,
    },
    required: ['drugName', 'expiry'],
  },
  bank_statement: {
    patterns: {
      accountNumber: /(?:account\s*#?|account no\.?|acc\.?)[:\s]*([A-Z0-9-]+)/i,
      statementDate: /(?:statement\s*date|as of)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      openingBalance: /(?:opening\s*balance|beginning balance)[:\s]*\$?\s*([\d,]+\.?\d{2})/i,
      closingBalance: /(?:closing\s*balance|ending balance|balance)[:\s]*\$?\s*([\d,]+\.?\d{2})/i,
      bankName: /(?:bank|financial institution)[:\s]*([A-Za-z\s&]+)/i,
    },
    required: ['accountNumber', 'closingBalance'],
  },
  resume: {
    patterns: {
      fullName: /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
      phone: /(\+\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/,
      linkedin: /(?:linkedin\.com\/in\/|linkedin:\s*)([a-zA-Z0-9-]+)/i,
      github: /(?:github\.com\/|github:\s*)([a-zA-Z0-9-]+)/i,
    },
    required: ['fullName', 'email'],
  },
  prescription: {
    patterns: {
      patientName: /(?:patient|name)[:\s]*([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i,
      doctorName: /(?:doctor|physician|prescriber)[:\s]*(?:Dr\.?\s*)?([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i,
      licenseNumber: /(?:license\s*#?|license no\.?)[:\s]*([A-Z0-9-]+)/i,
      datePrescribed: /(?:date|prescribed)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      instructions: /(?:instructions|sig)[:\s]*(.+?)(?=\n\n|$)/i,
    },
    required: ['patientName', 'doctorName'],
  },
};

/**
 * Enhanced text line extraction with proper handling
 * @param {string} text - Input text
 * @returns {Array} Array of lines with metadata
 */
const extractLines = (text) => {
  if (!text) return [];
  
  const lines = text.split('\n');
  return lines.map((line, index) => ({
    index,
    text: line,
    trimmed: line.trim(),
    length: line.length,
    isBlank: line.trim().length === 0,
    hasNumbers: /\d/.test(line),
    hasCurrency: /[£$€¥]/.test(line),
    hasEmail: /\S+@\S+\.\S+/.test(line),
    hasPhone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(line),
  }));
};

/**
 * Smart text extraction for various document types
 * @param {string} text - Input text
 * @param {string} documentType - Type of document
 * @returns {Object} Structured extraction results
 */
export const smartExtract = (text, documentType = 'general') => {
  if (!text || text.length < 10) {
    return {
      extracted: {},
      analytics: {
        documentType,
        confidence: 0,
        summary: {
          hasFinancialData: false,
          hasDates: false,
          hasContactInfo: false,
          wordCount: 0,
          lineCount: 0,
          extractionComplete: false,
        },
        insights: [],
        suggestions: [],
        lines: [],
      },
      formattedText: '',
    };
  }
  
  const doc = nlp(text);
  const lines = extractLines(text);
  
  // Extract common information
  const rawDates = doc.dates().out('array');
  
  // Filter out false positives like "5.0"
  const extractedDates = rawDates.filter(date => {
    // Remove simple decimals
    if (/^\d+\.\d+$/.test(date.trim())) {
      return false;
    }
    
    // Remove numbers that look like prices or quantities
    if (/^\d{1,3}\.\d{1,2}$/.test(date) && parseFloat(date) < 1000) {
      return false;
    }
    
    // Keep actual dates
    return true;
  });
  
  const money = doc.money().out('array');
  const emails = text.match(/\S+@\S+\.\S+/g) || [];
  const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  
  // ... rest of the function remains the same
  
  // Extract totals with better regex
  const totals = text.match(/(?:total|amount|balance|due|grand total)[\s:]*\$?\s*([\d,]+\.?\d{2})/gi) || [];
  
  // Document-specific extraction
  const specificExtraction = {};
  const rules = DOCUMENT_RULES[documentType];
  
  if (rules) {
    Object.entries(rules.patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match && match[1]) {
        specificExtraction[key] = match[1].trim();
      }
    });
  }
  
  // Calculate confidence
  const confidence = calculateConfidence(text, rules, specificExtraction, lines);
  
  return {
    extracted: {
      dates: extractedDates,
      money,
      emails,
      phones,
      urls,
      totals: totals.map(t => t.replace(/.*?(\$?\s*[\d,]+\.?\d{2}).*/i, '$1')),
      ...specificExtraction,
    },
    
    analytics: {
      documentType,
      confidence: parseFloat(confidence.toFixed(2)),
      summary: {
        hasFinancialData: money.length > 0,
        hasDates: extractedDates.length > 0,
        hasContactInfo: emails.length > 0 || phones.length > 0,
        wordCount: text.split(/\s+/).length,
        lineCount: lines.length,
        extractionComplete: rules ? 
          rules.required.every(req => specificExtraction[req]) : false,
        averageLineLength: lines.length > 0 
          ? Math.round(lines.reduce((sum, line) => sum + line.length, 0) / lines.length)
          : 0,
      },
      insights: generateInsights(text, documentType, specificExtraction),
      suggestions: generateSuggestions(text, documentType, lines),
      lines: lines.filter(line => !line.isBlank).slice(0, 50), // Return first 50 non-blank lines
    },
    
    formattedText: formatForDisplay(text, documentType, specificExtraction, lines),
    
    metadata: {
      extractionTimestamp: new Date().toISOString(),
      textLength: text.length,
      documentType,
      version: '2.0.0',
    },
  };
};

/**
 * Calculate extraction confidence score
 */
const calculateConfidence = (text, rules, extraction, lines) => {
  let baseConfidence = 0.5;
  
  if (rules) {
    const requiredCount = rules.required.length;
    const foundCount = rules.required.filter(req => extraction[req]).length;
    baseConfidence += (foundCount / requiredCount) * 0.3;
  }
  
  // Add points for structure
  const nonBlankLines = lines.filter(line => !line.isBlank).length;
  if (nonBlankLines > 5) baseConfidence += 0.1;
  if (nonBlankLines > 10) baseConfidence += 0.05;
  
  // Add points for data presence
  const hasDates = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/.test(text);
  const hasMoney = /[£$€¥]\s*\d+/.test(text) || /\d+\s*(?:dollars|euros|pounds)/i.test(text);
  const hasEmails = /\S+@\S+\.\S+/.test(text);
  
  if (hasDates) baseConfidence += 0.05;
  if (hasMoney) baseConfidence += 0.05;
  if (hasEmails) baseConfidence += 0.05;
  
  return Math.min(Math.max(baseConfidence, 0), 0.95);
};

/**
 * Generate insights based on document type and extraction
 */
const generateInsights = (text, docType, extraction) => {
  const insights = [];
  
  switch(docType) {
    case 'receipt': {
      if (extraction.total && extraction.tax) {
        try {
          const total = parseFloat(extraction.total.replace(/[^\d.]/g, ''));
          const tax = parseFloat(extraction.tax.replace(/[^\d.]/g, ''));
          if (tax > 0 && total > tax) {
            const taxRate = ((tax / (total - tax)) * 100).toFixed(1);
            insights.push(`Tax rate: ${taxRate}%`);
            insights.push(`Pre-tax amount: $${(total - tax).toFixed(2)}`);
          }
        } catch (error) {
          // Silently handle parsing errors
          console.log (error)
        }
      }
      break;
    }
      
    case 'invoice': {
      if (extraction.invoiceNumber && extraction.dueDate) {
        insights.push(`Invoice ${extraction.invoiceNumber} payment due`);
      }
      break;
    }
      
    case 'bank_statement': {
      // Calculate balance changes
      const moneyMatches = text.match(/\$?\s*[\d,]+\.?\d{2}/g) || [];
      if (moneyMatches.length >= 2) {
        try {
          const amounts = moneyMatches.map(m => parseFloat(m.replace(/[^\d.]/g, '')));
          const max = Math.max(...amounts);
          const min = Math.min(...amounts);
          insights.push(`Transaction range: $${min.toFixed(2)} - $${max.toFixed(2)}`);
          insights.push(`Number of transactions: ${moneyMatches.length}`);
        } catch (error) {
          console.log(error)
          // Silently handle parsing errors
        }
      }
      break;
    }
      
    case 'medicine': {
      if (extraction.drugName && extraction.expiry) {
        insights.push(`Medication: ${extraction.drugName}`);
        insights.push(`Expires: ${extraction.expiry}`);
      }
      if (extraction.dosage && extraction.frequency) {
        insights.push(`Dosage: ${extraction.dosage}, ${extraction.frequency}`);
      }
      break;
    }
  }
  
  return insights;
};

/**
 * Generate suggestions for improving document quality
 */
const generateSuggestions = (text, docType, lines) => {
  const suggestions = [];
  const nonBlankLines = lines.filter(line => !line.isBlank);
  
  switch(docType) {
    case 'resume': {
      const lowerText = text.toLowerCase();
      if (!lowerText.includes('experience')) {
        suggestions.push('Add work experience section');
      }
      if (!lowerText.includes('education')) {
        suggestions.push('Add education section');
      }
      if (!text.match(/\S+@\S+\.\S+/)) {
        suggestions.push('Include email address');
      }
      if (!text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)) {
        suggestions.push('Include phone number');
      }
      break;
    }
      
    case 'handwriting': {
      if (text.length < 50) {
        suggestions.push('Document may be incomplete');
      }
      if (nonBlankLines.length < 3) {
        suggestions.push('Document appears to be very short');
      }
      break;
    }
      
    case 'receipt': {
      if (!text.match(/total.*?\$/i) && !text.match(/\$\s*\d+/)) {
        suggestions.push('Total amount not clearly identified');
      }
      if (!text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/)) {
        suggestions.push('Date not found on receipt');
      }
      break;
    }
  }
  
  // General suggestions
  if (nonBlankLines.length > 20 && text.length > 1000) {
    suggestions.push('Consider splitting into multiple documents if too long');
  }
  
  return suggestions;
};

/**
 * Format text for display with highlights
 */
const formatForDisplay = (text, docType, extraction, lines) => {
  return lines.map(line => {
    const trimmedLine = line.trimmed;
    if (!trimmedLine) return line.text;
    
    let highlighted = line.text;
    
    // Highlight extracted information
    if (extraction.total && line.text.includes(extraction.total)) {
      highlighted = `💰 ${highlighted}`;
    }
    if (extraction.date && line.text.includes(extraction.date)) {
      highlighted = `📅 ${highlighted}`;
    }
    if (line.hasEmail) {
      highlighted = `📧 ${highlighted}`;
    }
    if (line.hasPhone) {
      highlighted = `📞 ${highlighted}`;
    }
    if (line.hasCurrency && /\d/.test(trimmedLine)) {
      highlighted = `💵 ${highlighted}`;
    }
    
    // Document-specific highlights
    switch(docType) {
      case 'receipt':
        if (trimmedLine.toLowerCase().includes('item') && line.hasNumbers) {
          highlighted = `🛒 ${highlighted}`;
        }
        break;
      case 'id_card':
        if (extraction.name && line.text.includes(extraction.name)) {
          highlighted = `👤 ${highlighted}`;
        }
        if (extraction.idNumber && line.text.includes(extraction.idNumber)) {
          highlighted = `🪪 ${highlighted}`;
        }
        break;
      case 'shipping_label':
        if (extraction.trackingNumber && line.text.includes(extraction.trackingNumber)) {
          highlighted = `📦 ${highlighted}`;
        }
        break;
      case 'prescription':
        if (extraction.patientName && line.text.includes(extraction.patientName)) {
          highlighted = `👨‍⚕️ ${highlighted}`;
        }
        break;
    }
    
    return highlighted;
  }).join('\n');
};

// Export helper functions if needed
export const extractorUtils = {
  extractLines,
  calculateConfidence,
  generateInsights,
  generateSuggestions,
  formatForDisplay,
};

export default smartExtract;