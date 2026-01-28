// src/app/features/ocr/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Chip, Button, List, ListItem, ListItemText,
  Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Tooltip,
  IconButton, FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
  DialogContentText
} from '@mui/material';
import {
  Receipt, Badge, MedicalServices, Description,
  TrendingUp, Warning, CheckCircle, AccountBalance,
  LocalShipping, CreditCard, HealthAndSafety,
  Analytics, Download, FilterList, Refresh,
  Visibility, Delete, BarChart, PieChart, Timeline
} from '@mui/icons-material';
import { storageManager } from "../storage/storageManager";
import { analyticsEngine } from '../analytics/analyticsEngine';
import SummaryCard from './SummaryCard';
import ChartComponent from './ChartComponent';

// Type definitions for better type safety
const DOCUMENT_TYPES = {
  RECEIPT: 'receipt',
  INVOICE: 'invoice',
  ID_CARD: 'id_card',
  MEDICINE_LABEL: 'medicine',
  BANK_STATEMENT: 'bank_statement',
  UTILITY_BILL: 'utility_bill',
  SHIPPING_LABEL: 'shipping_label',
  INSURANCE_POLICY: 'insurance',
  PAY_STUB: 'pay_stub'
};

const FINANCIAL_DOC_TYPES = [
  DOCUMENT_TYPES.RECEIPT,
  DOCUMENT_TYPES.INVOICE,
  DOCUMENT_TYPES.BANK_STATEMENT,
  DOCUMENT_TYPES.PAY_STUB
];

const SEVERITY_LEVELS = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const VIEW_MODES = {
  OVERVIEW: 'overview',
  INSIGHTS: 'insights',
  DOCUMENTS: 'documents'
};

const DATE_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL: 'all'
};

// Enhanced analytics processing functions
const processDocumentAnalytics = (documents = []) => {
  if (!documents || documents.length === 0) {
    return {
      summary: {
        totalProcessed: 0,
        avgConfidence: 0,
        totalExtractions: 0,
        withAnalytics: 0,
        documentTypes: {},
        monthlyStats: {}
      },
      insights: [],
      trends: {},
      alerts: [],
      processedDocuments: []
    };
  }

  // Calculate summary statistics
  const totalProcessed = documents.length;
  const withAnalytics = documents.filter(doc => doc.smartProcessed).length;
  const totalExtractions = documents.reduce((acc, doc) => {
    if (doc.extraction?.extracted) {
      return acc + Object.values(doc.extraction.extracted).flat().length;
    }
    return acc;
  }, 0);

  // Calculate average confidence
  const validConfidenceDocs = documents.filter(doc => doc.confidence !== undefined);
  const avgConfidence = validConfidenceDocs.length > 0 
    ? validConfidenceDocs.reduce((acc, doc) => acc + (doc.confidence || 0), 0) / validConfidenceDocs.length
    : 0;

  // Document type breakdown
  const documentTypes = {};
  documents.forEach(doc => {
    const type = doc.documentType || 'unknown';
    documentTypes[type] = (documentTypes[type] || 0) + 1;
  });

  // Monthly statistics
  const monthlyStats = {};
  documents.forEach(doc => {
    if (doc.timestamp) {
      try {
        const date = new Date(doc.timestamp);
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyStats[monthYear]) {
            monthlyStats[monthYear] = { count: 0, totalAmount: 0 };
          }
          monthlyStats[monthYear].count++;
          
          // Extract monetary amounts if available
          if (doc.parsedData?.total) {
            const amount = parseFloat(doc.parsedData.total);
            if (!isNaN(amount)) {
              monthlyStats[monthYear].totalAmount += amount;
            }
          }
        }
      } catch (error) {
        console.warn('Invalid timestamp format:', doc.timestamp, error);
      }
    }
  });

  // Calculate trends using all necessary data
  const trends = calculateTrends(documents, monthlyStats);

  // Generate insights using all parameters
  const insights = generateInsights(documents, documentTypes, trends);

  // Generate alerts
  const alerts = generateAlerts(documents);

  return {
    summary: {
      totalProcessed,
      avgConfidence: Math.round(avgConfidence),
      totalExtractions,
      withAnalytics,
      documentTypes,
      monthlyStats: Object.entries(monthlyStats).map(([month, stats]) => ({
        month,
        count: stats.count,
        totalAmount: stats.totalAmount
      }))
    },
    insights,
    trends,
    alerts,
    processedDocuments: documents.map(doc => ({
      ...doc,
      extractionCount: doc.extraction?.extracted ? Object.values(doc.extraction.extracted).flat().length : 0,
      qualityScore: calculateQualityScore(doc),
      formattedDate: doc.timestamp ? new Date(doc.timestamp).toLocaleDateString() : 'Unknown'
    }))
  };
};

const calculateTrends = (documents, monthlyStats) => {
  const trends = {
    volume: 0,
    quality: 0,
    financial: 0
  };

  // Calculate volume trend
  const monthlyEntries = Object.entries(monthlyStats).sort();
  if (monthlyEntries.length >= 2) {
    const [secondLastMonth, lastMonth] = monthlyEntries.slice(-2);
    
    // Volume trend
    const lastMonthCount = lastMonth[1].count;
    const secondLastMonthCount = secondLastMonth[1].count;
    trends.volume = ((lastMonthCount - secondLastMonthCount) / (secondLastMonthCount || 1)) * 100;

    // Financial trend
    const lastMonthAmount = lastMonth[1].totalAmount;
    const secondLastMonthAmount = secondLastMonth[1].totalAmount;
    if (secondLastMonthAmount > 0) {
      trends.financial = ((lastMonthAmount - secondLastMonthAmount) / secondLastMonthAmount) * 100;
    }
  }

  // Calculate quality trend
  const recentDocs = documents.slice(-20); // Last 20 documents for quality trend
  if (recentDocs.length >= 10) {
    const recentQuality = recentDocs.reduce((acc, doc) => acc + calculateQualityScore(doc), 0) / recentDocs.length;
    const olderDocs = documents.slice(-40, -20); // Previous 20 documents
    if (olderDocs.length >= 10) {
      const olderQuality = olderDocs.reduce((acc, doc) => acc + calculateQualityScore(doc), 0) / olderDocs.length;
      if (olderQuality > 0) {
        trends.quality = ((recentQuality - olderQuality) / olderQuality) * 100;
      }
    }
  }

  return trends;
};

const generateInsights = (documents = [], documentTypes = {}, trends = {}) => {
  const insights = [];

  // Most processed document type - fixed parameter usage
  const documentTypeEntries = Object.entries(documentTypes);
  if (documentTypeEntries.length > 0) {
    const mostProcessedType = documentTypeEntries.sort((a, b) => b[1] - a[1])[0];
    if (mostProcessedType) {
      insights.push({
        type: 'most_processed',
        title: 'Most Processed Document Type',
        content: `${mostProcessedType[0].replace('_', ' ')} (${mostProcessedType[1]} documents)`,
        icon: '📊',
        priority: 'medium'
      });
    }

    // Document diversity insight
    const uniqueTypes = documentTypeEntries.length;
    if (uniqueTypes >= 3) {
      insights.push({
        type: 'diversity',
        title: 'Document Diversity',
        content: `Processing ${uniqueTypes} different document types`,
        icon: '📑',
        priority: 'low'
      });
    }
  }

  // Financial insights - using the documents parameter
  if (documents.length > 0) {
    const financialDocs = documents.filter(doc => 
      FINANCIAL_DOC_TYPES.includes(doc.documentType)
    );
    
    if (financialDocs.length > 0) {
      const totalAmount = financialDocs.reduce((sum, doc) => {
        if (doc.parsedData?.total) {
          const amount = parseFloat(doc.parsedData.total);
          return sum + (isNaN(amount) ? 0 : amount);
        }
        return sum;
      }, 0);

      insights.push({
        type: 'financial_total',
        title: 'Total Financial Amount',
        content: `$${totalAmount.toFixed(2)} processed across ${financialDocs.length} financial documents`,
        icon: '💰',
        priority: 'medium'
      });

      // Average transaction value
      const avgTransaction = totalAmount / financialDocs.length;
      insights.push({
        type: 'avg_transaction',
        title: 'Average Transaction Value',
        content: `$${avgTransaction.toFixed(2)} per financial document`,
        icon: '📈',
        priority: 'low'
      });
    }

    // Quality insights
    const highQualityDocs = documents.filter(doc => calculateQualityScore(doc) > 80);
    if (highQualityDocs.length > 0) {
      const qualityPercentage = (highQualityDocs.length / documents.length) * 100;
      insights.push({
        type: 'quality_insight',
        title: 'High Quality Processing',
        content: `${qualityPercentage.toFixed(0)}% of documents processed with high quality (80%+)`,
        icon: '⭐',
        priority: 'low'
      });
    }
  }

  // Trend insights - using the trends parameter
  if (Math.abs(trends.volume) > 10) {
    insights.push({
      type: 'volume_trend',
      title: trends.volume > 0 ? 'Processing Volume Increasing' : 'Processing Volume Decreasing',
      content: `${Math.abs(trends.volume).toFixed(1)}% ${trends.volume > 0 ? 'increase' : 'decrease'} in document volume`,
      icon: trends.volume > 0 ? '📈' : '📉',
      priority: 'medium'
    });
  }

  if (Math.abs(trends.quality) > 5) {
    insights.push({
      type: 'quality_trend',
      title: trends.quality > 0 ? 'Quality Improving' : 'Quality Declining',
      content: `${Math.abs(trends.quality).toFixed(1)}% ${trends.quality > 0 ? 'improvement' : 'decline'} in processing quality`,
      icon: trends.quality > 0 ? '✅' : '⚠️',
      priority: 'medium'
    });
  }

  return insights;
};

const generateAlerts = (documents = []) => {
  const alerts = [];
  const now = new Date();

  documents.forEach(doc => {
    // Check for expiring documents
    if (doc.parsedData?.expiryDate) {
      try {
        const expiryDate = new Date(doc.parsedData.expiryDate);
        if (!isNaN(expiryDate.getTime())) {
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
            const severity = daysUntilExpiry <= 7 ? SEVERITY_LEVELS.ERROR : 
                            daysUntilExpiry <= 14 ? SEVERITY_LEVELS.WARNING : SEVERITY_LEVELS.INFO;
            
            alerts.push({
              type: 'expiry',
              documentId: doc.id,
              fileName: doc.fileName,
              documentType: doc.documentType,
              message: `${doc.documentType?.replace('_', ' ') || 'Document'} expires in ${daysUntilExpiry} days`,
              severity,
              expiryDate: doc.parsedData.expiryDate,
              daysUntilExpiry
            });
          }
        }
      } catch (e) {
        console.warn('Invalid expiry date format:', doc.parsedData.expiryDate, e);
      }
    }

    // Check for low confidence documents
    const confidence = doc.parsedData?.confidence || doc.confidence;
    if (confidence < 60) {
      alerts.push({
        type: 'low_confidence',
        documentId: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        message: `Low confidence (${Math.round(confidence)}%) - may need reprocessing`,
        severity: SEVERITY_LEVELS.WARNING,
        confidence
      });
    }

    // Check for incomplete documents
    if (doc.parsedData && Object.keys(doc.parsedData).length < 3 && doc.documentType) {
      alerts.push({
        type: 'incomplete_data',
        documentId: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        message: 'Incomplete data extraction - consider reprocessing',
        severity: SEVERITY_LEVELS.INFO
      });
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

const calculateQualityScore = (doc) => {
  if (!doc) return 50;
  
  let score = 50; // Base score
  
  // Confidence contributes up to 30 points
  const confidence = doc.parsedData?.confidence || doc.confidence;
  if (confidence !== undefined) {
    score += (confidence / 100) * 30;
  }
  
  // Extraction quality contributes up to 20 points
  if (doc.parsedData) {
    const extractionCount = Object.keys(doc.parsedData).filter(key => 
      key !== 'confidence' && doc.parsedData[key]
    ).length;
    
    if (extractionCount > 5) score += 15;
    else if (extractionCount > 2) score += 10;
    else if (extractionCount > 0) score += 5;
  }
  
  // Smart analytics bonus
  if (doc.smartProcessed) score += 10;
  
  // Timestamp bonus
  if (doc.timestamp) score += 5;
  
  return Math.min(Math.round(score), 100);
};

const getDocumentIcon = (documentType) => {
  const icons = {
    [DOCUMENT_TYPES.RECEIPT]: <Receipt />,
    [DOCUMENT_TYPES.INVOICE]: <Description />,
    [DOCUMENT_TYPES.ID_CARD]: <Badge />,
    [DOCUMENT_TYPES.MEDICINE_LABEL]: <MedicalServices />,
    [DOCUMENT_TYPES.BANK_STATEMENT]: <AccountBalance />,
    [DOCUMENT_TYPES.UTILITY_BILL]: <Receipt />,
    [DOCUMENT_TYPES.SHIPPING_LABEL]: <LocalShipping />,
    [DOCUMENT_TYPES.INSURANCE_POLICY]: <HealthAndSafety />,
    [DOCUMENT_TYPES.PAY_STUB]: <CreditCard />,
    default: <Description />
  };
  
  return icons[documentType] || icons.default;
};

const getDocumentColor = (documentType) => {
  const colors = {
    [DOCUMENT_TYPES.RECEIPT]: '#4CAF50',
    [DOCUMENT_TYPES.INVOICE]: '#2196F3',
    [DOCUMENT_TYPES.ID_CARD]: '#FF9800',
    [DOCUMENT_TYPES.MEDICINE_LABEL]: '#F44336',
    [DOCUMENT_TYPES.BANK_STATEMENT]: '#795548',
    [DOCUMENT_TYPES.UTILITY_BILL]: '#9C27B0',
    [DOCUMENT_TYPES.SHIPPING_LABEL]: '#607D8B',
    [DOCUMENT_TYPES.INSURANCE_POLICY]: '#00BCD4',
    [DOCUMENT_TYPES.PAY_STUB]: '#E91E63',
    default: '#757575'
  };
  
  return colors[documentType] || colors.default;
};

// Confirmation Dialog Component
const ConfirmationDialog = ({ open, title, message, onConfirm, onCancel, type = 'delete' }) => (
  <Dialog
    open={open}
    onClose={onCancel}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color={type === 'delete' ? 'error' : 'warning'} />
        {title}
      </Box>
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        {message}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} color="primary">
        Cancel
      </Button>
      <Button 
        onClick={onConfirm} 
        color={type === 'delete' ? 'error' : 'warning'}
        variant="contained"
        autoFocus
      >
        {type === 'delete' ? 'Delete' : 'Clear All'}
      </Button>
    </DialogActions>
  </Dialog>
);

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.OVERVIEW);
  const [dateRange, setDateRange] = useState(DATE_RANGES.ALL);
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    type: 'delete'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const filterDocumentsByDateRange = useCallback((documents, range) => {
    if (range === DATE_RANGES.ALL) return documents;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case DATE_RANGES.TODAY:
        startDate.setHours(0, 0, 0, 0);
        break;
      case DATE_RANGES.WEEK:
        startDate.setDate(now.getDate() - 7);
        break;
      case DATE_RANGES.MONTH:
        startDate.setMonth(now.getMonth() - 1);
        break;
      case DATE_RANGES.YEAR:
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return documents;
    }
    
    return documents.filter(doc => {
      if (!doc.timestamp) return false;
      try {
        const docDate = new Date(doc.timestamp);
        return !isNaN(docDate.getTime()) && docDate >= startDate;
      } catch {
        return false;
      }
    });
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load documents from storage manager
      let allDocs = [];
      if (storageManager && typeof storageManager.getAllDocuments === 'function') {
        allDocs = await storageManager.getAllDocuments();
      } else if (storageManager && typeof storageManager.getDocuments === 'function') {
        try {
          const result = await storageManager.getDocuments({ limit: 1000 });
          allDocs = result.documents || [];
        } catch (fallbackError) {
          console.error('Fallback loading failed:', fallbackError);
          allDocs = [];
        }
      } else {
        console.warn('Storage manager not properly initialized');
        allDocs = [];
      }

      // Filter documents based on date range
      const filteredDocs = filterDocumentsByDateRange(allDocs, dateRange);
      
      // Process analytics
      const processedData = processDocumentAnalytics(filteredDocs);
      
      // Add financial analytics
      const financialDocs = filteredDocs.filter(d => 
        d.documentType === DOCUMENT_TYPES.RECEIPT || d.documentType === DOCUMENT_TYPES.INVOICE
      );
      
      let financialAnalytics = { totalSpent: 0, totalDocuments: financialDocs.length };
      let monthlySpending = {};
      
      if (analyticsEngine?.aggregateFinancialAnalytics) {
        try {
          financialAnalytics = await analyticsEngine.aggregateFinancialAnalytics(financialDocs);
        } catch (error) {
          console.error('Financial analytics failed:', error);
        }
      }
      
      if (analyticsEngine?.computeMonthlyBreakdown) {
        try {
          monthlySpending = await analyticsEngine.computeMonthlyBreakdown(financialDocs);
        } catch (error) {
          console.error('Monthly spending analytics failed:', error);
        }
      }

      // Combine processed data with financial analytics
      setAnalyticsData({
        ...processedData,
        financial: {
          totalSpent: financialAnalytics.totalSpent || 0,
          totalDocuments: financialAnalytics.totalDocuments || 0
        },
        monthlySpending
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setAnalyticsData({
        summary: {
          totalProcessed: 0,
          avgConfidence: 0,
          totalExtractions: 0,
          withAnalytics: 0,
          documentTypes: {},
          monthlyStats: []
        },
        financial: { totalSpent: 0, totalDocuments: 0 },
        monthlySpending: {},
        insights: [],
        trends: {},
        alerts: [],
        processedDocuments: []
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterDocumentsByDateRange]);

  const handleExportReport = useCallback(() => {
    if (!analyticsData) return;
    
    const reportData = {
      exportDate: new Date().toISOString(),
      summary: analyticsData.summary,
      financial: analyticsData.financial,
      insights: analyticsData.insights,
      documents: analyticsData.processedDocuments.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        documentType: doc.documentType,
        confidence: doc.parsedData?.confidence,
        timestamp: doc.timestamp,
        qualityScore: doc.qualityScore,
        extractionCount: doc.extractionCount
      })),
      analytics: {
        trends: analyticsData.trends,
        alerts: analyticsData.alerts.length
      }
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success snackbar
    setSnackbar({
      open: true,
      message: 'Report exported successfully',
      severity: 'success'
    });
  }, [analyticsData]);

  const handleDeleteDocument = useCallback((documentId) => {
    const documentToDelete = analyticsData?.processedDocuments.find(doc => doc.id === documentId);
    
    setDialogConfig({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${documentToDelete?.fileName || 'this document'}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          if (storageManager && typeof storageManager.deleteDocument === 'function') {
            await storageManager.deleteDocument(documentId);
            loadDashboardData();
            setDialogOpen(false);
            setSnackbar({
              open: true,
              message: `Document "${documentToDelete?.fileName || ''}" deleted successfully`,
              severity: 'success'
            });
          }
        } catch (error) {
          console.error('Error deleting document:', error);
          setDialogOpen(false);
          setSnackbar({
            open: true,
            message: 'Failed to delete document. Please try again.',
            severity: 'error'
          });
        }
      },
      type: 'delete'
    });
    setDialogOpen(true);
  }, [loadDashboardData, analyticsData]);

  const handleClearAllAnalytics = useCallback(() => {
    setDialogConfig({
      title: 'Clear All Analytics Data',
      message: 'Are you sure you want to clear ALL analytics data? This will remove all stored documents and analytics. This action cannot be undone.',
      onConfirm: () => {
        if (storageManager && typeof storageManager.clearAll === 'function') {
          storageManager.clearAll();
        }
        setAnalyticsData(null);
        loadDashboardData();
        setDialogOpen(false);
        setSnackbar({
          open: true,
          message: 'All analytics data cleared successfully',
          severity: 'info'
        });
      },
      type: 'clearAll'
    });
    setDialogOpen(true);
  }, [loadDashboardData]);

  // Helper functions
  const ensureNumber = useCallback((value, fallback = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }, []);

  const formatCurrency = useCallback((amount) => {
    const numAmount = ensureNumber(amount, 0);
    return `$${numAmount.toFixed(2)}`;
  }, [ensureNumber]);

  const formatDocumentCurrency = useCallback((amount) => {
    if (typeof amount === 'number') return `$${amount.toFixed(2)}`;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? '$0.00' : `$${parsed.toFixed(2)}`;
    }
    return '$0.00';
  }, []);

  // Use useMemo for expensive calculations
  const filteredDocuments = useMemo(() => {
    if (!analyticsData?.processedDocuments) return [];
    
    if (filterType === 'all') return analyticsData.processedDocuments;
    
    return analyticsData.processedDocuments.filter(doc => 
      doc.documentType === filterType
    );
  }, [analyticsData, filterType]);

  const documentTypeOptions = useMemo(() => {
    if (!analyticsData?.summary?.documentTypes) return [];
    
    return Object.keys(analyticsData.summary.documentTypes).map(type => ({
      value: type,
      label: type.replace('_', ' ')
    }));
  }, [analyticsData]);

  // Initialize on mount and when dependencies change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (!analyticsData || analyticsData.processedDocuments.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          AI Analytics Dashboard
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            No documents processed yet.
          </Typography>
          <Typography variant="body2">
            Enable AI analytics in the OCR scanner and process some documents to see insights here.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.href = '/ocr'}
            sx={{ mt: 2 }}
            startIcon={<Analytics />}
          >
            Go to OCR Scanner
          </Button>
        </Alert>
      </Box>
    );
  }

  const { summary, financial, insights, trends, alerts, monthlySpending } = analyticsData;
  const documents = filteredDocuments;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            AI Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Insights from {summary.totalProcessed} processed documents
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value={DATE_RANGES.TODAY}>Today</MenuItem>
              <MenuItem value={DATE_RANGES.WEEK}>Last 7 days</MenuItem>
              <MenuItem value={DATE_RANGES.MONTH}>Last 30 days</MenuItem>
              <MenuItem value={DATE_RANGES.YEAR}>Last year</MenuItem>
              <MenuItem value={DATE_RANGES.ALL}>All time</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={filterType}
              label="Document Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              {documentTypeOptions.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            startIcon={<Refresh />} 
            onClick={loadDashboardData}
            variant="outlined"
          >
            Refresh
          </Button>
          
          <Button 
            startIcon={<Download />} 
            onClick={handleExportReport}
            variant="contained"
            color="primary"
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* View Mode Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Chip 
          label="Overview" 
          color={viewMode === VIEW_MODES.OVERVIEW ? 'primary' : 'default'}
          onClick={() => setViewMode(VIEW_MODES.OVERVIEW)}
          icon={<BarChart />}
        />
        <Chip 
          label="Insights" 
          color={viewMode === VIEW_MODES.INSIGHTS ? 'primary' : 'default'}
          onClick={() => setViewMode(VIEW_MODES.INSIGHTS)}
          icon={<TrendingUp />}
        />
        <Chip 
          label="Documents" 
          color={viewMode === VIEW_MODES.DOCUMENTS ? 'primary' : 'default'}
          onClick={() => setViewMode(VIEW_MODES.DOCUMENTS)}
          icon={<Description />}
        />
      </Box>

      {/* Overview View */}
      {viewMode === VIEW_MODES.OVERVIEW && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Total Documents"
                value={summary.totalProcessed || 0}
                icon={<Description />}
                color="#2196F3"
                subtitle={`${summary.withAnalytics} with smart analytics`}
                trend={trends.volume}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Total Spent"
                value={formatCurrency(financial?.totalSpent)}
                icon={<Receipt />}
                color="#4CAF50"
                subtitle={`${financial?.totalDocuments || 0} receipts/invoices`}
                trend={trends.financial}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Active Policies"
                value={analyticsData.processedDocuments.filter(d => d.documentType === DOCUMENT_TYPES.INSURANCE_POLICY).length || 0}
                icon={<HealthAndSafety />}
                color="#FF9800"
                subtitle={`${analyticsData.processedDocuments.filter(d => d.documentType === DOCUMENT_TYPES.ID_CARD).length || 0} IDs`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Medicines"
                value={analyticsData.processedDocuments.filter(d => d.documentType === DOCUMENT_TYPES.MEDICINE_LABEL).length || 0}
                icon={<MedicalServices />}
                color="#F44336"
                subtitle={`${analyticsData.processedDocuments.filter(d => d.documentType === DOCUMENT_TYPES.PAY_STUB).length || 0} pay stubs`}
              />
            </Grid>
          </Grid>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Alerts & Notifications ({alerts.length})
              </Typography>
              <Grid container spacing={2}>
                {alerts.slice(0, 4).map((alert, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Alert 
                      severity={alert.severity}
                      sx={{ 
                        '& .MuiAlert-icon': { alignItems: 'center' }
                      }}
                      action={
                        <Button 
                          size="small" 
                          color="inherit"
                          onClick={() => setSelectedDocument(
                            analyticsData.processedDocuments.find(d => d.id === alert.documentId) || alert
                          )}
                        >
                          View
                        </Button>
                      }
                    >
                      <Typography variant="body2">
                        <strong>{alert.message}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        {alert.fileName}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <ChartComponent
                title="Monthly Spending"
                data={monthlySpending || {}}
                type="bar"
                color="#4CAF50"
                height={300}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ChartComponent
                title="Document Types"
                data={summary.documentTypes || {}}
                type="bar"
                color="#2196F3"
                height={300}
              />
            </Grid>
          </Grid>

          {/* Recent Documents */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Documents ({documents.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  onClick={loadDashboardData}
                  size="small"
                  startIcon={<Refresh />}
                >
                  Refresh
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setViewMode(VIEW_MODES.DOCUMENTS)}
                  variant="text"
                >
                  View All
                </Button>
              </Box>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.slice(0, 5).map((doc) => (
                    <TableRow key={doc.id || doc.fileName} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: getDocumentColor(doc.documentType) }}>
                            {getDocumentIcon(doc.documentType)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {doc.fileName || 'Unnamed Document'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doc.formattedDate}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={doc.documentType?.replace('_', ' ') || 'Unknown'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doc.parsedData?.total ? formatDocumentCurrency(doc.parsedData.total) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={doc.parsedData?.confidence || 0}
                            sx={{ width: 60, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {Math.round(doc.parsedData?.confidence || 0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doc.formattedDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small"
                              color="error"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Insights View */}
      {viewMode === VIEW_MODES.INSIGHTS && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Insights & Analytics ({insights.length})
          </Typography>
          
          {insights.length > 0 ? (
            <Grid container spacing={3}>
              {insights.map((insight, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ 
                          fontSize: 24,
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText'
                        }}>
                          {insight.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {insight.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {insight.content}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No insights available yet. Process more documents to generate insights.
            </Typography>
          )}
        </Paper>
      )}

      {/* Documents View */}
      {viewMode === VIEW_MODES.DOCUMENTS && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            All Documents ({documents.length})
            <Button 
              size="small" 
              color="error"
              onClick={handleClearAllAnalytics}
              variant="outlined"
            >
              Clear All
            </Button>
          </Typography>
          
          {documents.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Quality</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id || doc.fileName} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: getDocumentColor(doc.documentType) }}>
                            {getDocumentIcon(doc.documentType)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {doc.fileName || 'Unnamed Document'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={doc.documentType?.replace('_', ' ') || 'Unknown'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doc.parsedData?.total ? formatDocumentCurrency(doc.parsedData.total) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={doc.parsedData?.confidence || 0}
                            sx={{ width: 60, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {Math.round(doc.parsedData?.confidence || 0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${doc.qualityScore || 0}%`}
                          size="small"
                          color={
                            (doc.qualityScore || 0) > 80 ? 'success' : 
                            (doc.qualityScore || 0) > 60 ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {doc.formattedDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small"
                              color="error"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No documents available for the selected filters.
            </Typography>
          )}
        </Paper>
      )}

      {/* Document Detail Dialog */}
      {selectedDocument && (
        <Dialog 
          open={Boolean(selectedDocument)} 
          onClose={() => setSelectedDocument(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Document Details
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Basic Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    File Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedDocument.fileName || 'Unknown'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Document Type
                  </Typography>
                  <Chip 
                    label={selectedDocument.documentType?.replace('_', ' ') || 'Unknown'}
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Processing Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedDocument.timestamp ? new Date(selectedDocument.timestamp).toLocaleString() : 'Unknown'}
                  </Typography>
                </Box>
                {selectedDocument.qualityScore !== undefined && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Quality Score
                    </Typography>
                    <Chip 
                      label={`${selectedDocument.qualityScore}%`}
                      color={
                        selectedDocument.qualityScore > 80 ? 'success' : 
                        selectedDocument.qualityScore > 60 ? 'warning' : 'error'
                      }
                    />
                  </Box>
                )}
                {selectedDocument.parsedData?.confidence && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Confidence Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedDocument.parsedData.confidence}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body1">
                        {Math.round(selectedDocument.parsedData.confidence)}%
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Extracted Data
                </Typography>
                {selectedDocument.parsedData && Object.keys(selectedDocument.parsedData).length > 0 ? (
                  <List dense>
                    {Object.entries(selectedDocument.parsedData).map(([key, value]) => {
                      if (!value || value === '' || key === 'confidence') return null;
                      
                      return (
                        <ListItem key={key} disableGutters>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {String(value)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No extracted data available.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedDocument(null)}>
              Close
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                if (selectedDocument.id) {
                  localStorage.setItem('selectedDocumentId', selectedDocument.id);
                  window.location.href = '/ocr';
                }
              }}
              disabled={!selectedDocument.id}
            >
              Reprocess
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={dialogOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={dialogConfig.onConfirm}
        onCancel={() => setDialogOpen(false)}
        type={dialogConfig.type}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;