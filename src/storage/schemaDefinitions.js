// src/app/features/ocr/storage/schemaDefinitions.js

export class SchemaValidator {
  static validateDocument(document, schema) {
    const errors = [];
    
    // Check required fields
    for (const [field, config] of Object.entries(schema)) {
      if (config.required && (document[field] === undefined || document[field] === null)) {
        errors.push(`Missing required field: ${field}`);
      }
      
      // Type validation
      if (document[field] !== undefined && document[field] !== null) {
        const typeError = this.validateType(document[field], config.type);
        if (typeError) {
          errors.push(`Invalid type for ${field}: ${typeError}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      documentType: document.documentType
    };
  }
  
  static validateType(value, expectedType) {
    if (expectedType === 'array') {
      return Array.isArray(value) ? null : 'Expected array';
    }
    
    if (expectedType === 'object') {
      return typeof value === 'object' && !Array.isArray(value) && value !== null ? null : 'Expected object';
    }
    
    if (expectedType === 'date') {
      return !isNaN(Date.parse(value)) ? null : 'Invalid date format';
    }
    
    return typeof value === expectedType ? null : `Expected ${expectedType}, got ${typeof value}`;
  }
}

// Schema definitions for all document types
export const DOCUMENT_SCHEMAS = {
  receipt: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    vendor: {
      type: 'object',
      required: true,
      schema: {
        name: { type: 'string', required: true },
        address: { type: 'string', required: false }
      }
    },
    invoiceNumber: { type: 'string', required: false },
    dateIssued: { type: 'date', required: true },
    dueDate: { type: 'date', required: false },
    lineItems: {
      type: 'array',
      required: false,
      itemSchema: {
        quantity: { type: 'number', required: true },
        description: { type: 'string', required: true },
        unitPrice: { type: 'number', required: true },
        amount: { type: 'number', required: true }
      }
    },
    subtotal: { type: 'number', required: false },
    tax: { type: 'number', required: false },
    total: { type: 'number', required: true },
    currency: { type: 'string', required: false },
    paymentMethod: { type: 'string', required: false },
    notes: { type: 'string', required: false }
  },

  invoice: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    vendor: {
      type: 'object',
      required: true,
      schema: {
        name: { type: 'string', required: true },
        address: { type: 'string', required: false },
        phone: { type: 'string', required: false },
        email: { type: 'string', required: false }
      }
    },
    invoiceNumber: { type: 'string', required: true },
    dateIssued: { type: 'date', required: true },
    dueDate: { type: 'date', required: true },
    lineItems: {
      type: 'array',
      required: true,
      itemSchema: {
        quantity: { type: 'number', required: true },
        description: { type: 'string', required: true },
        unitPrice: { type: 'number', required: true },
        amount: { type: 'number', required: true }
      }
    },
    subtotal: { type: 'number', required: true },
    tax: { type: 'number', required: false },
    total: { type: 'number', required: true },
    currency: { type: 'string', required: true },
    paymentTerms: { type: 'string', required: false },
    notes: { type: 'string', required: false }
  },

  resume: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    fullName: { type: 'string', required: true },
    contact: {
      type: 'object',
      required: true,
      schema: {
        email: { type: 'string', required: true },
        phone: { type: 'string', required: false },
        address: { type: 'string', required: false },
        linkedin: { type: 'string', required: false },
        portfolio: { type: 'string', required: false }
      }
    },
    summary: { type: 'string', required: false },
    education: {
      type: 'array',
      required: false,
      itemSchema: {
        degree: { type: 'string', required: true },
        institution: { type: 'string', required: true },
        location: { type: 'string', required: false },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', required: false },
        gpa: { type: 'number', required: false },
        honors: { type: 'string', required: false }
      }
    },
    workExperience: {
      type: 'array',
      required: false,
      itemSchema: {
        jobTitle: { type: 'string', required: true },
        company: { type: 'string', required: true },
        location: { type: 'string', required: false },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', required: false },
        description: { type: 'string', required: true },
        achievements: { type: 'array', required: false }
      }
    },
    skills: {
      type: 'array',
      required: false,
      itemSchema: { type: 'string' }
    },
    certifications: {
      type: 'array',
      required: false,
      itemSchema: {
        name: { type: 'string', required: true },
        issuer: { type: 'string', required: false },
        date: { type: 'date', required: false },
        expiry: { type: 'date', required: false }
      }
    },
    languages: {
      type: 'array',
      required: false,
      itemSchema: {
        language: { type: 'string', required: true },
        proficiency: { type: 'string', required: false }
      }
    },
    projects: {
      type: 'array',
      required: false,
      itemSchema: {
        name: { type: 'string', required: true },
        description: { type: 'string', required: true },
        technologies: { type: 'array', required: false },
        url: { type: 'string', required: false }
      }
    }
  },

  id_card: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    fullName: { type: 'string', required: true },
    dateOfBirth: { type: 'date', required: true },
    expiryDate: { type: 'date', required: true },
    idNumber: { type: 'string', required: true },
    nationality: { type: 'string', required: true },
    documentTypeDetail: { type: 'string', required: true },
    issuingCountry: { type: 'string', required: true },
    issueDate: { type: 'date', required: false },
    gender: { type: 'string', required: false },
    address: { type: 'string', required: false },
    issuingAuthority: { type: 'string', required: false }
  },

  shipping_label: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    trackingNumber: { type: 'string', required: true },
    carrier: { type: 'string', required: true },
    sender: {
      type: 'object',
      required: true,
      schema: {
        name: { type: 'string', required: true },
        address: { type: 'string', required: true },
        phone: { type: 'string', required: false },
        email: { type: 'string', required: false }
      }
    },
    recipient: {
      type: 'object',
      required: true,
      schema: {
        name: { type: 'string', required: true },
        address: { type: 'string', required: true },
        phone: { type: 'string', required: false },
        email: { type: 'string', required: false }
      }
    },
    shipDate: { type: 'date', required: false },
    weight: { type: 'string', required: false },
    serviceType: { type: 'string', required: false },
    dimensions: { type: 'string', required: false },
    declaredValue: { type: 'number', required: false },
    specialInstructions: { type: 'string', required: false }
  },

  medicine_label: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    drugName: { type: 'string', required: true },
    dosage: { type: 'string', required: true },
    quantity: { type: 'number', required: false },
    batchNumber: { type: 'string', required: false },
    expiryDate: { type: 'date', required: true },
    manufacturer: { type: 'string', required: true },
    otherInfo: {
      type: 'object',
      required: false,
      schema: {
        instructions: { type: 'string', required: false },
        lot: { type: 'string', required: false },
        barcode: { type: 'string', required: false },
        storage: { type: 'string', required: false },
        warnings: { type: 'string', required: false },
        sideEffects: { type: 'string', required: false }
      }
    },
    activeIngredients: {
      type: 'array',
      required: false,
      itemSchema: {
        name: { type: 'string', required: true },
        strength: { type: 'string', required: false }
      }
    }
  },

  utility_bill: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    provider: {
      type: 'object',
      required: true,
      schema: {
        name: { type: 'string', required: true },
        accountNumber: { type: 'string', required: true },
        customerId: { type: 'string', required: false }
      }
    },
    billingPeriod: {
      type: 'object',
      required: true,
      schema: {
        start: { type: 'date', required: true },
        end: { type: 'date', required: true }
      }
    },
    issueDate: { type: 'date', required: true },
    dueDate: { type: 'date', required: true },
    amountDue: { type: 'number', required: true },
    currency: { type: 'string', required: true },
    usage: {
      type: 'object',
      required: false,
      schema: {
        units: { type: 'number', required: true },
        unitType: { type: 'string', required: true },
        previousReading: { type: 'number', required: false },
        currentReading: { type: 'number', required: false }
      }
    },
    previousBalance: { type: 'number', required: false },
    payments: { type: 'number', required: false },
    newCharges: { type: 'number', required: false }
  },

  bank_statement: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    accountHolder: { type: 'string', required: true },
    accountNumber: { type: 'string', required: true },
    currency: { type: 'string', required: true },
    period: {
      type: 'object',
      required: true,
      schema: {
        start: { type: 'date', required: true },
        end: { type: 'date', required: true }
      }
    },
    transactions: {
      type: 'array',
      required: true,
      itemSchema: {
        date: { type: 'date', required: true },
        description: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        type: { type: 'string', required: true },
        balance: { type: 'number', required: false },
        category: { type: 'string', required: false },
        reference: { type: 'string', required: false }
      }
    },
    summary: {
      type: 'object',
      required: false,
      schema: {
        beginningBalance: { type: 'number', required: false },
        endingBalance: { type: 'number', required: false },
        totalDeposits: { type: 'number', required: false },
        totalWithdrawals: { type: 'number', required: false },
        fees: { type: 'number', required: false },
        interest: { type: 'number', required: false }
      }
    }
  },

  insurance_policy: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    policyNumber: { type: 'string', required: true },
    providerName: { type: 'string', required: true },
    insuredName: { type: 'string', required: true },
    coverageType: { type: 'string', required: true },
    startDate: { type: 'date', required: true },
    expiryDate: { type: 'date', required: true },
    premiumAmount: { type: 'number', required: false },
    deductible: { type: 'number', required: false },
    coverageLimit: { type: 'number', required: false },
    policyType: { type: 'string', required: false },
    beneficiaries: {
      type: 'array',
      required: false,
      itemSchema: {
        name: { type: 'string', required: true },
        relationship: { type: 'string', required: false },
        percentage: { type: 'number', required: false }
      }
    },
    riders: {
      type: 'array',
      required: false,
      itemSchema: { type: 'string' }
    },
    details: { type: 'string', required: false },
    contactInfo: {
      type: 'object',
      required: false,
      schema: {
        phone: { type: 'string', required: false },
        email: { type: 'string', required: false },
        website: { type: 'string', required: false }
      }
    }
  },

  pay_stub: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    employeeName: { type: 'string', required: true },
    employerName: { type: 'string', required: true },
    payPeriod: {
      type: 'object',
      required: true,
      schema: {
        start: { type: 'date', required: true },
        end: { type: 'date', required: true }
      }
    },
    payDate: { type: 'date', required: true },
    grossPay: { type: 'number', required: true },
    netPay: { type: 'number', required: true },
    taxes: { type: 'number', required: false },
    deductions: {
      type: 'array',
      required: false,
      itemSchema: {
        type: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        description: { type: 'string', required: false }
      }
    },
    contributions: {
      type: 'array',
      required: false,
      itemSchema: {
        type: { type: 'string', required: true },
        amount: { type: 'number', required: true },
        employerMatch: { type: 'number', required: false }
      }
    },
    yearToDate: {
      type: 'object',
      required: false,
      schema: {
        gross: { type: 'number', required: false },
        net: { type: 'number', required: false },
        taxes: { type: 'number', required: false },
        deductions: { type: 'number', required: false }
      }
    },
    hours: {
      type: 'object',
      required: false,
      schema: {
        regular: { type: 'number', required: false },
        overtime: { type: 'number', required: false },
        vacation: { type: 'number', required: false },
        sick: { type: 'number', required: false }
      }
    }
  },

  generic: {
    documentType: { type: 'string', required: true },
    metadata: { type: 'object', required: true },
    rawText: { type: 'string', required: true },
    keyPhrases: {
      type: 'array',
      required: false,
      itemSchema: { type: 'string' }
    },
    wordCount: { type: 'number', required: false },
    lineCount: { type: 'number', required: false },
    processingInfo: {
      type: 'object',
      required: false,
      schema: {
        confidence: { type: 'number', required: false },
        parserVersion: { type: 'string', required: false }
      }
    }
  }
};

// Helper functions
export const SchemaUtils = {
  getSchemaForType(documentType) {
    return DOCUMENT_SCHEMAS[documentType] || DOCUMENT_SCHEMAS.generic;
  },

  validateDocumentStructure(document) {
    const schema = this.getSchemaForType(document.documentType);
    return SchemaValidator.validateDocument(document, schema);
  },

  normalizeDocument(document) {
    const schema = this.getSchemaForType(document.documentType);
    const normalized = { ...document };
    
    // Ensure metadata exists
    if (!normalized.metadata) {
      normalized.metadata = {
        parsedAt: new Date().toISOString(),
        parserVersion: '1.0',
        confidence: 0
      };
    }
    
    // Ensure arrays exist
    for (const [field, config] of Object.entries(schema)) {
      if (config.type === 'array' && !normalized[field]) {
        normalized[field] = [];
      }
    }
    
    return normalized;
  },

  calculateDataQualityScore(document) {
    const schema = this.getSchemaForType(document.documentType);
    const validation = SchemaValidator.validateDocument(document, schema);
    
    if (!validation.isValid) {
      return 0;
    }
    
    let filledFields = 0;
    let totalFields = 0;
    
    for (const [field, config] of Object.entries(schema)) {
      if (config.required) {
        totalFields++;
        if (document[field] !== undefined && document[field] !== null) {
          filledFields++;
        }
      }
    }
    
    return totalFields > 0 ? (filledFields / totalFields) * 100 : 100;
  }
};

export default {
  SchemaValidator,
  DOCUMENT_SCHEMAS,
  SchemaUtils
};