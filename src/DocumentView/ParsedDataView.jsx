// src/app/features/ocr/DocumentView/ParsedDataView.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Edit,
  ContentCopy,
  CheckCircle,
  Analytics,
  Download,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

const ParsedDataView = ({ 
  parsedData,
  documentType,
  fileName,
  documentId,
  onEdit,
  onExport,
  onViewAnalytics
}) => {
  const [copiedField, setCopiedField] = useState(null);
  const [showConfidence, setShowConfidence] = useState(false);

  const handleCopyField = async (fieldName, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getFieldValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const renderFieldCard = (label, value, fieldPath, confidence = null) => {
    const displayValue = formatValue(value);
    
    return (
      <Grid item xs={12} sm={6} md={4} key={fieldPath}>
        <Card 
          variant="outlined" 
          sx={{ 
            height: '100%',
            borderColor: confidence && showConfidence ? 
              getConfidenceColor(confidence) === 'success' ? 'success.light' :
              getConfidenceColor(confidence) === 'warning' ? 'warning.light' : 'error.light'
              : 'divider'
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {confidence !== null && showConfidence && (
                  <Chip 
                    label={`${Math.round(confidence * 100)}%`}
                    size="small"
                    color={getConfidenceColor(confidence)}
                    variant="filled"
                  />
                )}
                <Tooltip title={copiedField === fieldPath ? "Copied!" : "Copy value"}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleCopyField(fieldPath, value)}
                    disabled={!value}
                  >
                    {copiedField === fieldPath ? <CheckCircle color="success" /> : <ContentCopy />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Typography 
              variant="body2" 
              sx={{ 
                wordBreak: 'break-word',
                minHeight: '24px',
                color: value ? 'text.primary' : 'text.disabled'
              }}
            >
              {displayValue}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderTableData = (data, title) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const columns = Object.keys(data[0] || {});

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map(column => (
                  <TableCell key={column} sx={{ fontWeight: 600 }}>
                    {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map(column => (
                    <TableCell key={column}>
                      {formatValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderStructuredData = () => {
    if (!parsedData || Object.keys(parsedData).length === 0) {
      return (
        <Alert severity="info">
          No structured data available. The AI may not have extracted any structured information from this document.
        </Alert>
      );
    }

    // Common field configurations for different document types
    const fieldConfigs = {
      receipt: [
        { label: 'Merchant', path: 'merchant.name', confidence: 'merchant.confidence' },
        { label: 'Total Amount', path: 'total.amount', confidence: 'total.confidence' },
        { label: 'Tax Amount', path: 'tax.amount', confidence: 'tax.confidence' },
        { label: 'Date', path: 'date', confidence: 'date.confidence' },
        { label: 'Transaction ID', path: 'transactionId', confidence: 'transactionId.confidence' }
      ],
      invoice: [
        { label: 'Invoice Number', path: 'invoiceNumber', confidence: 'invoiceNumber.confidence' },
        { label: 'Vendor', path: 'vendor.name', confidence: 'vendor.confidence' },
        { label: 'Total Due', path: 'total.amount', confidence: 'total.confidence' },
        { label: 'Due Date', path: 'dueDate', confidence: 'dueDate.confidence' },
        { label: 'PO Number', path: 'poNumber', confidence: 'poNumber.confidence' }
      ],
      resume: [
        { label: 'Full Name', path: 'personal.name', confidence: 'personal.confidence' },
        { label: 'Email', path: 'personal.email', confidence: 'personal.confidence' },
        { label: 'Phone', path: 'personal.phone', confidence: 'personal.confidence' },
        { label: 'Experience Years', path: 'experience.years', confidence: 'experience.confidence' }
      ]
    };

    const fields = fieldConfigs[documentType] || 
      Object.entries(parsedData)
        .filter(([key]) => !key.includes('confidence') && !key.includes('items') && !key.includes('table'))
        .map(([key]) => ({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          path: key,
          confidence: `${key}.confidence`
        }));

    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Extracted Fields
          </Typography>
          <Tooltip title={showConfidence ? "Hide confidence scores" : "Show confidence scores"}>
            <IconButton 
              size="small" 
              onClick={() => setShowConfidence(!showConfidence)}
              color={showConfidence ? "primary" : "default"}
            >
              {showConfidence ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {fields.map(field => 
            renderFieldCard(
              field.label,
              getFieldValue(parsedData, field.path),
              field.path,
              getFieldValue(parsedData, field.confidence)
            )
          )}
        </Grid>

        {/* Render table data if available */}
        {parsedData.items && renderTableData(parsedData.items, 'Items')}
        {parsedData.lineItems && renderTableData(parsedData.lineItems, 'Line Items')}
        {parsedData.experience && renderTableData(parsedData.experience, 'Work Experience')}
      </>
    );
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          AI Parsed Data
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={onEdit}
            size="small"
          >
            Edit Data
          </Button>
          {onViewAnalytics && (
            <Button
              variant="outlined"
              startIcon={<Analytics />}
              onClick={onViewAnalytics}
              size="small"
            >
              Analytics
            </Button>
          )}
          {onExport && (
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => onExport(parsedData)}
              size="small"
            >
              Export
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Chip 
            label={documentType} 
            size="small" 
            color="primary"
            variant="outlined"
          />
          <Chip 
            label="AI Processed"
            size="small"
            color="success"
            variant="filled"
          />
          {parsedData?.confidence && (
            <Chip 
              label={`${Math.round(parsedData.confidence * 100)}% Confidence`}
              size="small"
              color={getConfidenceColor(parsedData.confidence)}
              variant="outlined"
            />
          )}
          {fileName && (
            <Chip 
              label={fileName}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          ✅ AI processing complete. The system has extracted structured data from your document. 
          You can edit the data, view analytics, or export the results.
        </Typography>
      </Alert>

      {renderStructuredData()}

      {parsedData?.analytics && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Analytics Insights
          </Typography>
          <Grid container spacing={2}>
            {parsedData.analytics.insights?.map((insight, index) => (
              <Grid item xs={12} key={index}>
                <Alert 
                  severity={insight.type === 'warning' ? 'warning' : 'info'}
                  sx={{ width: '100%' }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    {insight.title}
                  </Typography>
                  <Typography variant="body2">
                    {insight.message}
                  </Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default ParsedDataView;