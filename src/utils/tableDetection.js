// utils/tableDetection.js - FULLY UPDATED & ENHANCED works majorly with src\app\features\ocr\components\OCRScanner.jsx, shared with advanced OCR

export const detectTables = (text, confidence = 0.7) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const tables = [];
  let currentTable = [];
  let inTable = false;
  let previousColumnCount = 0;

  const detectColumns = (line) => {
    const trimmed = line.trim();
    
    // Skip lines that are clearly headers or section titles
    if (trimmed.match(/^(--- Page \d+ ---|[A-Z][A-Z\s]+:$|^[A-Z\s]{10,}$)/)) {
      return 0;
    }
    
    // Method 1: Tab-separated values (strong indicator)
    if (trimmed.includes('\t')) {
      const columns = trimmed.split('\t').filter(cell => cell.trim().length > 0);
      return columns.length >= 2 ? columns.length : 0;
    }
    
    // Method 2: Pipe-separated values (strong indicator)
    if (trimmed.includes('|')) {
      const columns = trimmed.split('|').filter(cell => cell.trim().length > 0);
      // Must have at least 2 pipes (3 columns) or be clearly a table
      if (columns.length >= 3 || (columns.length === 2 && trimmed.match(/\|\s*\w+\s*\|\s*\w+\s*\|/))) {
        return columns.length;
      }
    }
    
    // Method 3: Multiple consistent spaces (weaker indicator)
    const spaceSeparated = trimmed.split(/\s{3,}/).filter(cell => {
      const cellContent = cell.trim();
      // Filter out very short cells that might just be formatting
      return cellContent.length > 1 && !cellContent.match(/^[•\-*]\s*$/);
    });
    
    // Require at least 3 columns for space-separated to reduce false positives
    if (spaceSeparated.length >= 3) {
      // Additional check: cells should have reasonable content
      const validCells = spaceSeparated.filter(cell => {
        const content = cell.trim();
        return content.length > 0 && !content.match(/^[^a-zA-Z0-9]*$/);
      });
      return validCells.length >= 3 ? validCells.length : 0;
    }
    
    return 0;
  };

  const isValidTable = (tableRows) => {
    if (tableRows.length < 3) return false; // Increased minimum rows
    
    const columnCounts = tableRows.map(row => row.columns);
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    
    // Check if column counts are consistent (within 1 column difference)
    const consistentColumns = columnCounts.every(count => 
      Math.abs(count - avgColumns) <= 1
    );
    
    // Check if the table has meaningful data (not just formatting)
    const hasMeaningfulData = tableRows.some(row => {
      const words = row.text.split(/\s+/).filter(word => word.length > 2);
      return words.length >= row.columns;
    });
    
    return consistentColumns && avgColumns >= 2 && hasMeaningfulData;
  };

  const calculateTableConfidence = (tableRows) => {
    const columnCounts = tableRows.map(row => row.columns);
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    
    // Calculate consistency score
    const consistency = columnCounts.reduce((score, count) => 
      score + (1 - Math.abs(count - avgColumns) / avgColumns), 0
    ) / columnCounts.length;
    
    // Calculate row count score (more rows = higher confidence)
    const rowScore = Math.min(tableRows.length / 8, 1); // Reduced weight
    
    // Calculate content score (more meaningful content = higher confidence)
    const contentScore = tableRows.reduce((score, row) => {
      const words = row.text.split(/\s+/).filter(word => word.length > 2);
      return score + Math.min(words.length / row.columns, 1);
    }, 0) / tableRows.length;
    
    return (consistency * 0.4 + rowScore * 0.3 + contentScore * 0.3);
  };

  // Skip obvious non-table sections
  const skipSections = [
    'PROFESSIONAL SUMMARY',
    'WORK EXPERIENCE', 
    'EDUCATION',
    'CONTACT',
    'SKILLS',
    'PROJECTS'
  ];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip section headers
    if (skipSections.some(section => trimmedLine.toUpperCase().includes(section))) {
      if (inTable && currentTable.length >= 3) {
        if (isValidTable(currentTable)) {
          tables.push({
            data: [...currentTable],
            startLine: currentTable[0].lineNumber,
            endLine: currentTable[currentTable.length - 1].lineNumber,
            confidence: calculateTableConfidence(currentTable)
          });
        }
      }
      inTable = false;
      currentTable = [];
      return;
    }
    
    const columnCount = detectColumns(line);
    
    if (columnCount >= 2) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
        previousColumnCount = columnCount;
      }
      
      // Check if column count is similar to previous rows
      if (Math.abs(columnCount - previousColumnCount) <= 1) {
        currentTable.push({
          text: trimmedLine,
          columns: columnCount,
          lineNumber: index,
          rawText: line
        });
        previousColumnCount = columnCount;
      } else {
        // Column count changed significantly, end current table
        if (currentTable.length >= 3 && isValidTable(currentTable)) {
          tables.push({
            data: [...currentTable],
            startLine: currentTable[0].lineNumber,
            endLine: currentTable[currentTable.length - 1].lineNumber,
            confidence: calculateTableConfidence(currentTable)
          });
        }
        currentTable = [{
          text: trimmedLine,
          columns: columnCount,
          lineNumber: index,
          rawText: line
        }];
        previousColumnCount = columnCount;
      }
    } else {
      if (inTable && currentTable.length >= 3) {
        if (isValidTable(currentTable)) {
          tables.push({
            data: [...currentTable],
            startLine: currentTable[0].lineNumber,
            endLine: currentTable[currentTable.length - 1].lineNumber,
            confidence: calculateTableConfidence(currentTable)
          });
        }
      }
      inTable = false;
      currentTable = [];
      previousColumnCount = 0;
    }
  });

  // Check if we ended while still in a table
  if (inTable && currentTable.length >= 3 && isValidTable(currentTable)) {
    tables.push({
      data: [...currentTable],
      startLine: currentTable[0].lineNumber,
      endLine: currentTable[currentTable.length - 1].lineNumber,
      confidence: calculateTableConfidence(currentTable)
    });
  }

  return tables
    .filter(table => table.confidence >= confidence)
    .sort((a, b) => b.confidence - a.confidence);
};

export const tableToCSV = (tableData) => {
  if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
    return '';
  }

  const rows = tableData.map(row => {
    let columns = [];
    
    // Try different separation methods
    if (row.rawText.includes('\t')) {
      columns = row.rawText.split('\t').map(col => col.trim());
    } else if (row.rawText.includes('|')) {
      columns = row.rawText.split('|').map(col => col.trim());
    } else {
      // Use multiple spaces
      columns = row.rawText.split(/\s{3,}/).map(col => col.trim());
    }
    
    // Clean up empty columns and escape CSV
    return columns
      .filter(col => col.length > 0)
      .map(col => `"${col.replace(/"/g, '""')}"`)
      .join(',');
  });

  return rows.join('\n');
};

// ✅ FIXED: Updated extractStructuredData to accept and use options parameter
export const extractStructuredData = (text, documentType = 'document', options = {}) => {
  const tables = detectTables(text);
  const result = {
    text,
    tables: [],
    structuredData: {},
    documentType
  };

  tables.forEach((table, index) => {
    const csv = tableToCSV(table.data);
    result.tables.push({
      id: `table-${index}`,
      csv,
      rowCount: table.data.length,
      columnCount: Math.max(...table.data.map(row => row.columns)),
      confidence: table.confidence,
      preview: table.data.slice(0, 3).map(row => row.text),
      startLine: table.startLine,
      endLine: table.endLine
    });
  });

  // ✅ FIXED: Enhanced extraction with options parameter
  switch (documentType) {
    case 'receipt':
      result.structuredData = extractEnhancedReceiptData(text, options);
      break;
    case 'resume':
      result.structuredData = extractEnhancedResumeData(text, options);
      break;
    case 'id_card':
      result.structuredData = extractEnhancedIDData(text, options);
      break;
    case 'price_tag':
      result.structuredData = extractEnhancedPriceTagData(text, options);
      break;
    case 'package':
      result.structuredData = extractEnhancedPackageData(text, options);
      break;
    case 'medicine':
      result.structuredData = extractEnhancedMedicineData(text, options);
      break;
    case 'handwriting':
      result.structuredData = extractEnhancedHandwritingData(text, options);
      break;
    case 'book':
      result.structuredData = extractEnhancedBookData(text, options);
      break;
    case 'translation':
      result.structuredData = extractEnhancedTranslationData(text, options);
      break;
    case 'invoice':
      result.structuredData = extractEnhancedInvoiceData(text, options);
      break;
    case 'business_card':
      result.structuredData = extractEnhancedBusinessCardData(text, options);
      break;
    default:
      result.structuredData = extractGeneralData(text, options);
  }

  return result;
};

// ✅ ENHANCED: Updated receipt data extraction with options
const extractEnhancedReceiptData = (text, options = {}) => {
  const data = {
    type: 'receipt',
    items: [],
    totals: {},
    merchant: {},
    metadata: {}
  };

  const lines = text.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lowerLine = line.toLowerCase();
    
    // Merchant detection (usually in first few lines)
    if (index < 5 && !data.merchant.name) {
      // Look for potential merchant names (exclude common receipt words)
      if (trimmed.length > 3 && 
          !lowerLine.includes('receipt') && 
          !lowerLine.includes('total') &&
          !lowerLine.includes('tax') &&
          !lowerLine.includes('date') &&
          !trimmed.match(/^\d/)) {
        data.merchant.name = trimmed;
      }
    }
    
    // Date detection
    if (!data.metadata.date) {
      const dateFormats = [
        /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/, // MM/DD/YY or similar
        /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}/i, // 25 Dec 2023
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i // December 25, 2023
      ];
      
      for (const format of dateFormats) {
        const match = line.match(format);
        if (match) {
          data.metadata.date = match[0];
          break;
        }
      }
    }
    
    // Time detection
    if (!data.metadata.time && line.match(/\d{1,2}:\d{2}\s*(AM|PM)?/i)) {
      data.metadata.time = line.match(/\d{1,2}:\d{2}\s*(AM|PM)?/i)[0];
    }
    
    // Item extraction with enhanced patterns
    if (options.extractItems !== false) {
      const itemPatterns = [
        // Pattern: "2 Burger $10.00" or "Burger 2 $10.00"
        /(\d+)\s+([A-Za-z\s&]+?)\s*[$€£]?\s*(\d+[.,]\d{2})/,
        // Pattern: "Burger $10.00" (single quantity)
        /([A-Za-z\s&]+?)\s*[$€£]?\s*(\d+[.,]\d{2})/,
        // Pattern with x: "2x Burger $10.00"
        /(\d+)x\s*([A-Za-z\s&]+?)\s*[$€£]?\s*(\d+[.,]\d{2})/
      ];
      
      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        if (match && !lowerLine.includes('total') && !lowerLine.includes('tax') && !lowerLine.includes('subtotal')) {
          const quantity = match[1] ? parseInt(match[1]) : 1;
          const name = match[2] ? match[2].trim() : match[1].trim();
          const price = parseFloat(match[3] ? match[3].replace(',', '.') : match[2].replace(',', '.'));
          
          // Avoid adding totals as items
          if (name.length > 2 && price > 0 && price < 1000) {
            data.items.push({
              quantity,
              name,
              price,
              lineTotal: quantity * price
            });
            break;
          }
        }
      }
    }
    
    // Enhanced total extraction
    if (options.extractTotals !== false) {
      if (lowerLine.includes('total') && !data.totals.total) {
        const amountMatch = line.match(/[$€£]?\s*(\d+[.,]\d{2})/);
        if (amountMatch) {
          data.totals.total = parseFloat(amountMatch[1].replace(',', '.'));
        }
      }
      
      if ((lowerLine.includes('tax') || lowerLine.includes('vat')) && !data.totals.tax) {
        const amountMatch = line.match(/[$€£]?\s*(\d+[.,]\d{2})/);
        if (amountMatch) data.totals.tax = parseFloat(amountMatch[1].replace(',', '.'));
      }
      
      if (lowerLine.includes('subtotal') && !data.totals.subtotal) {
        const amountMatch = line.match(/[$€£]?\s*(\d+[.,]\d{2})/);
        if (amountMatch) data.totals.subtotal = parseFloat(amountMatch[1].replace(',', '.'));
      }
    }
  });
  
  // Calculate missing totals
  if (!data.totals.subtotal && data.items.length > 0) {
    data.totals.subtotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
  }
  
  // Currency detection
  if (options.detectCurrency !== false) {
    if (text.includes('€')) data.totals.currency = 'EUR';
    else if (text.includes('£')) data.totals.currency = 'GBP';
    else data.totals.currency = 'USD';
  }
  
  return data;
};

// ✅ ENHANCED: Updated resume data extraction with options
const extractEnhancedResumeData = (text, options = {}) => {
  const data = {
    type: 'resume',
    personalInfo: {},
    skills: [],
    experience: [],
    education: [],
    sections: {},
    summary: null
  };

  const lines = text.split('\n');
  let currentSection = 'header';
  
  // Common section headers
  const sectionHeaders = {
    experience: ['experience', 'work experience', 'employment', 'work history'],
    education: ['education', 'academic', 'qualifications', 'degrees'],
    skills: ['skills', 'technical skills', 'competencies', 'abilities'],
    summary: ['summary', 'profile', 'objective', 'about'],
    projects: ['projects', 'portfolio', 'achievements']
  };
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lowerLine = line.toLowerCase().trim();
    
    // Detect section changes
    for (const [section, keywords] of Object.entries(sectionHeaders)) {
      if (keywords.some(keyword => lowerLine === keyword || lowerLine.startsWith(keyword))) {
        currentSection = section;
        data.sections[section] = data.sections[section] || [];
        return;
      }
    }
    
    // Extract personal info from header section
    if (currentSection === 'header' && options.extractContacts !== false) {
      // Name (usually first substantial line)
      if (index === 0 && trimmed.length > 3 && trimmed.length < 50 && !data.personalInfo.name) {
        data.personalInfo.name = trimmed;
      }
      
      // Email
      const emailMatch = line.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch && !data.personalInfo.email) {
        data.personalInfo.email = emailMatch[0];
      }
      
      // Phone
      const phoneMatch = line.match(/[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/);
      if (phoneMatch && !data.personalInfo.phone) {
        data.personalInfo.phone = phoneMatch[0];
      }
      
      // Location
      if (line.match(/\b[A-Z][a-z]+(?: [A-Z][a-z]+)*,? [A-Z]{2}\b/) && !data.personalInfo.location) {
        data.personalInfo.location = trimmed;
      }
      
      // LinkedIn and other profiles
      if (line.includes('linkedin.com') && !data.personalInfo.linkedin) {
        data.personalInfo.linkedin = trimmed;
      }
      if (line.includes('github.com') && !data.personalInfo.github) {
        data.personalInfo.github = trimmed;
      }
    }
    
    // Extract summary
    if (currentSection === 'summary' && trimmed.length > 10) {
      data.summary = data.summary ? data.summary + ' ' + trimmed : trimmed;
    }
    
    // Extract skills
    if (currentSection === 'skills' && options.extractSkills !== false && trimmed.length > 0) {
      // Split skills by commas, slashes, or bullets
      const skillMatches = trimmed.match(/[•\-*]\s*([^,•\-*]+)/g) || 
                          trimmed.split(/[,/]|\n/).map(s => s.trim()).filter(s => s.length > 0);
      
      skillMatches.forEach(skill => {
        const cleanSkill = skill.replace(/[•\-*]\s*/, '').trim();
        if (cleanSkill.length > 2 && !data.skills.includes(cleanSkill)) {
          data.skills.push(cleanSkill);
        }
      });
    }
    
    // Extract experience entries
    if (currentSection === 'experience' && options.extractExperience !== false && trimmed.length > 10) {
      // Look for date patterns in the line
      const dateMatch = trimmed.match(/(\d{4}\s*[-–—]\s*\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4} - (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}|\d{1,2}\/\d{4} - \d{1,2}\/\d{4})/i);
      
      if (dateMatch || data.experience.length === 0) {
        data.experience.push({
          text: trimmed,
          dates: dateMatch ? dateMatch[0] : null
        });
      }
    }
    
    // Extract education entries
    if (currentSection === 'education' && options.detectEducation !== false && trimmed.length > 5) {
      // Look for degree patterns or institution names
      const degreeMatch = trimmed.match(/(Bachelor|Master|PhD|B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Doctorate)/i);
      if (degreeMatch || data.education.length === 0) {
        data.education.push({
          text: trimmed,
          degree: degreeMatch ? degreeMatch[0] : null
        });
      }
    }
  });
  
  return data;
};

// ✅ ENHANCED: Updated ID card data extraction with options
const extractEnhancedIDData = (text, options = {}) => {
  const data = {
    type: 'id_card',
    personalInfo: {},
    documentInfo: {},
    validation: {}
  };

  const lines = text.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Extract personal info
    if (options.extractPersonalInfo !== false) {
      // Name patterns (usually contains letters, spaces, maybe hyphens)
      if (!data.personalInfo.name && trimmed.match(/^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/)) {
        data.personalInfo.name = trimmed;
      }
      
      // Date of birth patterns
      if (!data.personalInfo.dob && trimmed.match(/(?:DOB|Birth|Born)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i)) {
        data.personalInfo.dob = trimmed.match(/(?:DOB|Birth|Born)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i)[1];
      }
      
      // Address patterns
      if (!data.personalInfo.address && trimmed.match(/\d+\s+[A-Z][a-z]+\s+(?:St|Street|Ave|Avenue|Rd|Road)/)) {
        data.personalInfo.address = trimmed;
      }
    }
    
    // ID number patterns (alphanumeric, often specific formats)
    if (!data.documentInfo.number && trimmed.match(/\b[A-Z0-9]{6,12}\b/)) {
      data.documentInfo.number = trimmed;
    }
    
    // Expiry date detection
    if (options.detectExpiry !== false && !data.documentInfo.expiry && trimmed.match(/(?:EXP|Expires|Valid)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i)) {
      data.documentInfo.expiry = trimmed.match(/(?:EXP|Expires|Valid)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i)[1];
    }
    
    // Format validation
    if (options.validateFormat !== false) {
      // Basic validation checks
      if (data.documentInfo.number) {
        data.validation.hasValidFormat = data.documentInfo.number.length >= 6;
      }
      if (data.documentInfo.expiry) {
        const expiryDate = new Date(data.documentInfo.expiry);
        data.validation.isExpired = expiryDate < new Date();
      }
    }
  });
  
  return data;
};

// ✅ NEW: Enhanced price tag data extraction
const extractEnhancedPriceTagData = (text, options = {}) => {
  const data = {
    type: 'price_tag',
    productName: null,
    brand: null,
    price: null,
    currency: 'USD',
    unitInfo: null,
    promoText: null,
    originalPrice: null,
    discount: null
  };

  const lines = text.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    const lowerLine = line.toLowerCase();
    
    // Price detection
    if (options.detectPrices !== false) {
      const priceMatch = trimmed.match(/[$€£]?\s*(\d+[.,]\d{2})/);
      if (priceMatch && !data.price) {
        data.price = parseFloat(priceMatch[1].replace(',', '.'));
        
        // Detect currency
        if (trimmed.includes('€')) data.currency = 'EUR';
        else if (trimmed.includes('£')) data.currency = 'GBP';
      }
      
      // Original price (for discounts)
      if (lowerLine.includes('was') || lowerLine.includes('original')) {
        const originalPriceMatch = trimmed.match(/\$?\s*(\d+[.,]\d{2})/);
        if (originalPriceMatch) {
          data.originalPrice = parseFloat(originalPriceMatch[1].replace(',', '.'));
          if (data.price && data.originalPrice) {
            data.discount = Math.round((1 - data.price / data.originalPrice) * 100);
          }
        }
      }
    }
    
    // Product info extraction
    if (options.extractProductInfo !== false) {
      // Look for product names (lines without numbers that aren't too short)
      if (!data.productName && trimmed.length > 3 && trimmed.length < 50 && !trimmed.match(/\d/)) {
        data.productName = trimmed;
      }
      
      // Brand detection (often in first lines or contains specific patterns)
      if (!data.brand && (trimmed.match(/^(Nike|Adidas|Apple|Samsung|Sony)/i) || line.includes('™') || line.includes('®'))) {
        data.brand = trimmed;
      }
      
      // Unit information (contains weight/volume)
      if (!data.unitInfo && trimmed.match(/\d+\s*(kg|g|ml|l|oz|lb)/i)) {
        data.unitInfo = trimmed.match(/\d+\s*(kg|g|ml|l|oz|lb)/i)[0];
      }
      
      // Promotional text
      if (!data.promoText && (lowerLine.includes('sale') || lowerLine.includes('discount') || lowerLine.includes('offer'))) {
        data.promoText = trimmed;
      }
    }
  });
  
  return data;
};

// ✅ NEW: Enhanced package/shipping data extraction
const extractEnhancedPackageData = (text, options = {}) => {
  const data = {
    type: 'package',
    carrier: null,
    trackingNumber: null,
    sender: null,
    recipient: null,
    address: null,
    serviceType: null,
    weight: null,
    dimensions: null
  };

  const lines = text.split('\n');
  
  // Tracking number extraction
  if (options.extractTracking !== false) {
    const trackingPatterns = [
      /\b(1Z ?[0-9A-Z]{3} ?[0-9A-Z]{3} ?[0-9A-Z]{2} ?[0-9A-Z]{4} ?[0-9A-Z]{3} ?[0-9A-Z])\b/i, // UPS
      /\b(\d{12,20})\b/, // USPS, FedEx
      /\b([A-Z]{2}\d{9}[A-Z]{2})\b/ // International
    ];
    
    for (const pattern of trackingPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.trackingNumber = match[0];
        break;
      }
    }
  }
  
  // Carrier detection
  if (options.detectCarrier !== false) {
    if (text.match(/ups/i)) data.carrier = 'UPS';
    else if (text.match(/fedex/i)) data.carrier = 'FedEx';
    else if (text.match(/usps/i)) data.carrier = 'USPS';
    else if (text.match(/dhl/i)) data.carrier = 'DHL';
    else if (text.match(/amazon/i)) data.carrier = 'Amazon Logistics';
  }
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Sender/Recipient detection (usually in address blocks)
    if (trimmed.match(/[A-Z][a-z]+ [A-Z][a-z]+/) && trimmed.length < 100) {
      if (!data.sender && index < lines.length / 2) {
        data.sender = trimmed;
      } else if (!data.recipient && index > lines.length / 2) {
        data.recipient = trimmed;
      }
    }
    
    // Address detection (multi-line pattern)
    if (trimmed.match(/\d+\s+[A-Z][a-z]+\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Drive)/) && !data.address) {
      // Get address block (current line + next 2 lines)
      const addressBlock = lines.slice(index, index + 3).join(' ');
      data.address = addressBlock;
    }
    
    // Service type detection
    if (!data.serviceType) {
      if (line.match(/priority|express|overnight/i)) data.serviceType = 'Express';
      else if (line.match(/ground|standard/i)) data.serviceType = 'Ground';
      else if (line.match(/international/i)) data.serviceType = 'International';
    }
    
    // Weight and dimensions
    if (!data.weight && line.match(/\d+(\.\d+)?\s*(kg|lb|lbs)/i)) {
      data.weight = line.match(/\d+(\.\d+)?\s*(kg|lb|lbs)/i)[0];
    }
    if (!data.dimensions && line.match(/\d+\s*x\s*\d+\s*x\s*\d+/i)) {
      data.dimensions = line.match(/\d+\s*x\s*\d+\s*x\s*\d+/i)[0];
    }
  });
  
  return data;
};

// ✅ NEW: Enhanced medicine data extraction
const extractEnhancedMedicineData = (text, options = {}) => {
  const data = {
    type: 'medicine',
    drugName: null,
    dosage: null,
    activeIngredients: [],
    expirationDate: null,
    manufacturer: null,
    warnings: null,
    usageInstructions: null,
    storageInstructions: null
  };

  const lines = text.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    const lowerLine = line.toLowerCase();
    
    // Drug info extraction
    if (options.extractDrugInfo !== false) {
      // Drug name (usually prominent, often in first lines)
      if (!data.drugName && trimmed.length > 2 && trimmed.length < 50 && 
          !lowerLine.includes('mg') && !lowerLine.includes('ml') && 
          !lowerLine.includes('exp') && !lowerLine.match(/^\d/)) {
        data.drugName = trimmed;
      }
      
      // Dosage extraction
      if (!data.dosage && trimmed.match(/(\d+\s*mg|\d+\s*mL|\d+\s*%)/i)) {
        data.dosage = trimmed.match(/(\d+\s*mg|\d+\s*mL|\d+\s*%)/i)[0];
      }
      
      // Active ingredients
      if (lowerLine.includes('ingredient') || lowerLine.includes('contains')) {
        const ingredients = trimmed.split(/[:,]/).slice(1).join(',').split(/\s+and\s+|\s*,\s*/);
        data.activeIngredients = ingredients.map(ing => ing.trim()).filter(ing => ing.length > 0);
      }
    }
    
    // Expiry date detection
    if (options.detectExpiry !== false && !data.expirationDate && trimmed.match(/(EXP|Expires|Use by)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i)) {
      data.expirationDate = trimmed.match(/(EXP|Expires|Use by)[:\s]*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i)[2];
    }
    
    // Manufacturer detection
    if (!data.manufacturer && (trimmed.match(/©|™|®/) || lowerLine.includes('manufactured') || lowerLine.includes('distributed'))) {
      data.manufacturer = trimmed;
    }
    
    // Warnings and instructions
    if (lowerLine.includes('warning') || lowerLine.includes('caution')) {
      data.warnings = data.warnings ? data.warnings + ' ' + trimmed : trimmed;
    }
    if (lowerLine.includes('use') || lowerLine.includes('direction') || lowerLine.includes('instruction')) {
      data.usageInstructions = data.usageInstructions ? data.usageInstructions + ' ' + trimmed : trimmed;
    }
    if (lowerLine.includes('store') || lowerLine.includes('storage')) {
      data.storageInstructions = data.storageInstructions ? data.storageInstructions + ' ' + trimmed : trimmed;
    }
  });
  
  return data;
};

// ✅ NEW: Enhanced handwriting data extraction
const extractEnhancedHandwritingData = (text, options = {}) => {
  const data = {
    type: 'handwriting',
    cleanText: text,
    bulletPoints: [],
    paragraphs: [],
    lists: [],
    keyPoints: []
  };

  // Clean up common handwriting OCR errors
  if (options.enhanceImages !== false) {
    data.cleanText = text
      .replace(/\b([Il1])\b/g, 'I') // Common handwriting confusions
      .replace(/\b([O0])\b/g, 'O')
      .replace(/\b([Ss5])\b/g, 's')
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  const lines = data.cleanText.split('\n').filter(line => line.trim().length > 0);
  
  // Extract bullet points and lists
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Bullet points
    if (trimmed.match(/^[•\-*]\s+/)) {
      data.bulletPoints.push(trimmed.replace(/^[•\-*]\s+/, ''));
    }
    
    // Numbered lists
    if (trimmed.match(/^\d+[.)]\s+/)) {
      data.lists.push(trimmed);
    }
    
    // Paragraphs (substantial text blocks)
    if (trimmed.length > 20 && !trimmed.match(/^[•\-*]\s+/) && !trimmed.match(/^\d+[.)]\s+/)) {
      data.paragraphs.push(trimmed);
    }
    
    // Key points (short, important-looking lines)
    if (trimmed.length > 5 && trimmed.length < 50 && 
        (trimmed === trimmed.toUpperCase() || trimmed.match(/^[A-Z]/))) {
      data.keyPoints.push(trimmed);
    }
  });
  
  return data;
};

// ✅ NEW: Enhanced book data extraction
const extractEnhancedBookData = (text, options = {}) => {
  const data = {
    type: 'book',
    chapterTitle: null,
    sections: [],
    paragraphs: [],
    pageNumbers: [],
    footnotes: []
  };

  const lines = text.split('\n');
  let currentSection = { heading: null, content: [] };
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Chapter title detection (usually prominent, early in text)
    if (!data.chapterTitle && index < 10 && 
        (trimmed.match(/^CHAPTER\s+\d+/i) || 
         trimmed.match(/^\d+\.\s+[A-Z]/) ||
         (trimmed.length > 10 && trimmed === trimmed.toUpperCase()))) {
      data.chapterTitle = trimmed;
    }
    
    // Section headings (bold/large text patterns)
    if (trimmed.length > 5 && trimmed.length < 100 && 
        (trimmed.match(/^[A-Z][A-Za-z\s]{10,}$/) || 
         trimmed.match(/^\d+\.\d+\s+/) ||
         trimmed.match(/^[IVX]+\./))) {
      // Save previous section if it has content
      if (currentSection.heading || currentSection.content.length > 0) {
        data.sections.push({
          heading: currentSection.heading,
          content: currentSection.content.join(' ')
        });
      }
      // Start new section
      currentSection = { heading: trimmed, content: [] };
    } else if (trimmed.length > 0) {
      // Add to current section content
      currentSection.content.push(trimmed);
    }
    
    // Page number detection
    if (options.preserveFormatting !== false && trimmed.match(/^\d+$/)) {
      data.pageNumbers.push(trimmed);
    }
    
    // Footnote detection
    if (trimmed.match(/^\[\d+\]/) || trimmed.match(/^\d+\.\s+/)) {
      data.footnotes.push(trimmed);
    }
  });
  
  // Add the last section
  if (currentSection.heading || currentSection.content.length > 0) {
    data.sections.push({
      heading: currentSection.heading,
      content: currentSection.content.join(' ')
    });
  }
  
  // Extract paragraphs (non-section text blocks)
  data.paragraphs = lines.filter(line => 
    line.trim().length > 50 && 
    !line.match(/^[A-Z][A-Za-z\s]{10,}$/) &&
    !line.match(/^\d+$/)
  );
  
  return data;
};

// ✅ NEW: Enhanced translation data extraction
const extractEnhancedTranslationData = (text, options = {}) => {
  const data = {
    type: 'translation',
    originalText: text,
    detectedLanguage: null,
    translationReady: true,
    characterCount: text.length,
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    paragraphCount: text.split(/\n\n+/).length,
    hasSpecialCharacters: /[^x00-\x7F]/.test(text)
  };

  // Basic language detection based on character patterns
  if (options.enableTranslation !== false) {
    if (text.match(/[áéíóúñ]/i)) data.detectedLanguage = 'Spanish';
    else if (text.match(/[àâäçéèêëîïôöùûüÿ]/i)) data.detectedLanguage = 'French';
    else if (text.match(/[äöüß]/i)) data.detectedLanguage = 'German';
    else if (text.match(/[áčďéěíňóřšťúůýž]/i)) data.detectedLanguage = 'Czech';
    else if (text.match(/[一-龯]/)) data.detectedLanguage = 'Chinese';
    else if (text.match(/[あ-んア-ン]/)) data.detectedLanguage = 'Japanese';
    else data.detectedLanguage = 'English';
  }
  
  return data;
};
// ✅ UPDATED: Enhanced invoice data extraction with options - FIXED
const extractEnhancedInvoiceData = (text, options = {}) => {
  const data = {
    type: 'invoice',
    invoiceNumber: null,
    dueDate: null,
    issueDate: null,
    items: [],
    totals: {},
    from: null,
    to: null,
    currency: 'USD'
  };

  const lines = text.split('\n');
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // Invoice number - only extract if options allow
    if (options.extractInvoiceNumber !== false && 
        (lowerLine.includes('invoice') || lowerLine.includes('inv#')) && 
        !data.invoiceNumber) {
      const invMatch = line.match(/(?:invoice|inv#?)\s*[:#]?\s*([a-zA-Z0-9-]+)/i);
      if (invMatch) data.invoiceNumber = invMatch[1];
    }
    
    // Due date - only extract if options allow
    if (options.extractDueDate !== false && 
        (lowerLine.includes('due') || lowerLine.includes('payment')) && 
        !data.dueDate) {
      const dateMatch = line.match(/(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/);
      if (dateMatch) data.dueDate = dateMatch[1];
    }
    
    // Issue date - only extract if options allow
    if (options.extractIssueDate !== false && 
        (lowerLine.includes('date') || lowerLine.includes('issued')) && 
        !data.issueDate) {
      const dateMatch = line.match(/(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/);
      if (dateMatch) data.issueDate = dateMatch[1];
    }
    
    // Currency detection
    if (options.detectCurrency !== false) {
      if (line.includes('€') && !data.currency) data.currency = 'EUR';
      else if (line.includes('£') && !data.currency) data.currency = 'GBP';
      else if (line.includes('$') && !data.currency) data.currency = 'USD';
    }
    
    // Extract from/to addresses if options allow
    if (options.extractParties !== false) {
      if ((lowerLine.includes('from') || lowerLine.includes('seller')) && !data.from) {
        data.from = line.replace(/(from|seller):?\s*/i, '').trim();
      }
      if ((lowerLine.includes('to') || lowerLine.includes('bill to')) && !data.to) {
        data.to = line.replace(/(to|bill to):?\s*/i, '').trim();
      }
    }
  });
  
  return data;
};

// ✅ UPDATED: Enhanced business card data extraction with options - FIXED
const extractEnhancedBusinessCardData = (text, options = {}) => {
  const data = {
    type: 'business_card',
    personalInfo: {},
    companyInfo: {}
  };

  const lines = text.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Name extraction - only if options allow
    if (options.extractPersonalInfo !== false && 
        !data.personalInfo.name && 
        index === 0 && 
        trimmed.length > 0) {
      data.personalInfo.name = trimmed;
    }
    
    // Email extraction - only if options allow
    if (options.extractContacts !== false && 
        !data.personalInfo.email && 
        trimmed.includes('@')) {
      const emailMatch = trimmed.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
      if (emailMatch) data.personalInfo.email = emailMatch[0];
    }
    
    // Phone extraction - only if options allow
    if (options.extractContacts !== false && 
        !data.personalInfo.phone && 
        trimmed.match(/[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/)) {
      data.personalInfo.phone = trimmed;
    }
    
    // Company/Title detection - only if options allow
    if (options.extractCompanyInfo !== false) {
      if (!data.companyInfo.name && (trimmed.includes('Inc') || trimmed.includes('LLC') || trimmed.includes('Corp'))) {
        data.companyInfo.name = trimmed;
      }
      if (!data.personalInfo.title && (trimmed.match(/(Director|Manager|Engineer|Specialist|President)/i))) {
        data.personalInfo.title = trimmed;
      }
    }
    
    // Address detection - only if options allow
    if (options.extractAddress !== false && 
        !data.personalInfo.address && 
        trimmed.match(/\d+\s+[A-Z][a-z]+\s+(?:St|Street|Ave|Avenue|Rd|Road)/)) {
      data.personalInfo.address = trimmed;
    }
    
    // Website detection - only if options allow
    if (options.extractWebsite !== false && 
        !data.personalInfo.website && 
        trimmed.match(/(www\.|https?:\/\/)[^\s]+/)) {
      data.personalInfo.website = trimmed;
    }
  });
  
  return data;
};

// ✅ UPDATED: Enhanced general data extraction with options - FIXED
const extractGeneralData = (text, options = {}) => {
  const data = {
    type: 'general',
    lineCount: 0,
    wordCount: 0,
    characterCount: 0,
    hasNumbers: false,
    hasEmail: false,
    hasPhone: false,
    hasDates: false,
    hasUrls: false,
    language: 'unknown',
    documentStats: {}
  };

  const lines = text.split('\n');
  
  // Basic stats - always calculated
  data.lineCount = lines.length;
  data.wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  data.characterCount = text.length;
  
  // Optional feature detection based on options
  if (options.detectFeatures !== false) {
    data.hasNumbers = /\d/.test(text);
    data.hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text);
    data.hasPhone = /[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/.test(text);
    data.hasDates = /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/.test(text);
    data.hasUrls = /https?:\/\/[^\s]+/.test(text);
  }
  
  // Language detection - only if options allow
  if (options.detectLanguage !== false) {
    if (text.match(/[一-龯]/)) data.language = 'Chinese';
    else if (text.match(/[あ-んア-ン]/)) data.language = 'Japanese';
    else if (text.match(/[áéíóúñ]/i)) data.language = 'Spanish';
    else if (text.match(/[àâäçéèêëîïôöùûüÿ]/i)) data.language = 'French';
    else if (text.match(/[äöüß]/i)) data.language = 'German';
    else if (text.match(/[áčďéěíňóřšťúůýž]/i)) data.language = 'Czech';
    else data.language = 'English';
  }
  
  // Additional document statistics - only if options allow
  if (options.calculateStats !== false) {
    data.documentStats = {
      averageWordsPerLine: (data.wordCount / Math.max(data.lineCount, 1)).toFixed(2),
      hasParagraphs: text.includes('\n\n'),
      lineLengths: lines.map(line => line.length),
      longestLine: Math.max(...lines.map(line => line.length)),
      shortestLine: Math.min(...lines.map(line => line.length))
    };
  }
  
  return data;
};

// Your existing utility functions (keep them as they are)
export const exportTablesAsCSV = (tables, baseFilename = 'table') => {
  tables.forEach((table, index) => {
    const filename = `${baseFilename}_${index + 1}_${table.rowCount}x${table.columnCount}.csv`;
    const blob = new Blob([table.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
};


export const exportTablesAsZIP = async (tables, filename = 'tables.zip') => {
  // Check if JSZip is available globally or via import
  const JSZip = window.JSZip;
  
  if (!JSZip) {
    console.warn('JSZip library not available, exporting as individual CSV files');
    exportTablesAsCSV(tables);
    return;
  }

  const zip = new JSZip();
  
  tables.forEach((table, index) => {
    zip.file(`table_${index + 1}.csv`, table.csv);
  });
  
  // Add a summary file
  const summary = tables.map((table, index) => 
    `Table ${index + 1}: ${table.rowCount} rows × ${table.columnCount} columns (${Math.round(table.confidence * 100)}% confidence)`
  ).join('\n');
  zip.file('summary.txt', summary);
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};