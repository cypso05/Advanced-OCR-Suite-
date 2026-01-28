// src/app/features/ocr/DocumentView/EditParsedData.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save,
  Cancel,
  Edit,
  ContentCopy,
  CheckCircle,
  Warning,
  Feedback,
  Analytics,
  Download
} from '@mui/icons-material';
import { storageManager } from '../storage/storageManager';

const EditParsedData = ({ 
  parsedData,
  documentType,
  fileName,
  documentId,
  onSave,
  onCancel,
  onExport
}) => {
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comments: '',
    corrections: {},
    issues: []
  });
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (parsedData) {
      setEditedData(parsedData);
    }
  }, [parsedData]);

  const handleFieldChange = (fieldPath, value) => {
    const keys = fieldPath.split('.');
    setEditedData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Save the edited data
      await onSave(editedData);
      
      // If feedback was provided, save it
      if (feedback.rating > 0 || feedback.comments.trim() || Object.keys(feedback.corrections).length > 0) {
        await storageManager.saveFeedback(documentId, {
          ...feedback,
          originalData: parsedData,
          correctedData: editedData,
          timestamp: new Date().toISOString()
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleCancel = () => {
    setEditedData(parsedData);
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  const handleCopyField = async (fieldName, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const addIssue = (issue) => {
    setFeedback(prev => ({
      ...prev,
      issues: [...prev.issues, { ...issue, id: Date.now() }]
    }));
  };

  const removeIssue = (issueId) => {
    setFeedback(prev => ({
      ...prev,
      issues: prev.issues.filter(issue => issue.id !== issueId)
    }));
  };

  const getFieldValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const renderField = (label, value, fieldPath, fieldType = 'text') => {
    const displayValue = value !== null && value !== undefined ? String(value) : 'N/A';
    
    return (
      <Grid item xs={12} sm={6} key={fieldPath}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
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

            {fieldType === 'textarea' ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={getFieldValue(editedData, fieldPath) || ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                variant="outlined"
                size="small"
                placeholder="No data available"
              />
            ) : fieldType === 'select' ? (
              <FormControl fullWidth size="small">
                <Select
                  value={getFieldValue(editedData, fieldPath) || ''}
                  onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                >
                  <MenuItem value="">Not specified</MenuItem>
                  {/* Add specific options based on field type */}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                value={getFieldValue(editedData, fieldPath) || ''}
                onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
                variant="outlined"
                size="small"
                placeholder="No data available"
              />
            )}

            {value && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Original: {displayValue}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  const renderStructuredData = () => {
    if (!editedData || Object.keys(editedData).length === 0) {
      return (
        <Alert severity="info">
          No structured data available for editing. The AI may not have extracted any structured information from this document.
        </Alert>
      );
    }

    const fieldConfigs = {
      receipt: [
        { label: 'Merchant Name', path: 'merchant.name', type: 'text' },
        { label: 'Total Amount', path: 'total.amount', type: 'text' },
        { label: 'Tax Amount', path: 'tax.amount', type: 'text' },
        { label: 'Date', path: 'date', type: 'text' },
        { label: 'Items', path: 'items', type: 'textarea' }
      ],
      invoice: [
        { label: 'Invoice Number', path: 'invoiceNumber', type: 'text' },
        { label: 'Vendor', path: 'vendor.name', type: 'text' },
        { label: 'Total Due', path: 'total.amount', type: 'text' },
        { label: 'Due Date', path: 'dueDate', type: 'text' },
        { label: 'Line Items', path: 'lineItems', type: 'textarea' }
      ],
      resume: [
        { label: 'Full Name', path: 'personal.name', type: 'text' },
        { label: 'Email', path: 'personal.email', type: 'text' },
        { label: 'Phone', path: 'personal.phone', type: 'text' },
        { label: 'Skills', path: 'skills', type: 'textarea' },
        { label: 'Experience', path: 'experience', type: 'textarea' },
        { label: 'Education', path: 'education', type: 'textarea' }
      ],
      // Add more document type configurations as needed
    };

    const fields = fieldConfigs[documentType] || Object.entries(editedData).map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      path: key,
      type: typeof value === 'string' && value.length > 50 ? 'textarea' : 'text'
    }));

    return (
      <Grid container spacing={2}>
        {fields.map(field => 
          renderField(
            field.label,
            getFieldValue(parsedData, field.path),
            field.path,
            field.type
          )
        )}
      </Grid>
    );
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Edit Parsed Data
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEditing && (
            <>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                size="small"
              >
                Save Changes
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                size="small"
              >
                Cancel
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<Feedback />}
            onClick={() => setShowFeedbackDialog(true)}
            size="small"
          >
            Provide Feedback
          </Button>
          {onExport && (
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => onExport(editedData)}
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

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Edit the AI-extracted data below. Your corrections and feedback will be used to improve our models.
          Fields show both the original extracted value and allow editing.
        </Typography>
      </Alert>

      {renderStructuredData()}

      {/* Feedback Dialog */}
      <Dialog 
        open={showFeedbackDialog} 
        onClose={() => setShowFeedbackDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Feedback />
            <Typography variant="h6">Provide Feedback</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              How accurate was the AI extraction?
            </Typography>
            <Rating
              value={feedback.rating}
              onChange={(event, newValue) => {
                setFeedback(prev => ({ ...prev, rating: newValue }));
              }}
              size="large"
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Comments"
            value={feedback.comments}
            onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
            placeholder="Tell us about any issues with the AI extraction or suggestions for improvement..."
            variant="outlined"
            sx={{ mb: 3 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={feedback.allowRetraining || false}
                onChange={(e) => setFeedback(prev => ({ ...prev, allowRetraining: e.target.checked }))}
              />
            }
            label="Allow this data to be used for model retraining (anonymized)"
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowFeedbackDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowFeedbackDialog(false);
              // Auto-save when feedback is submitted
              if (isEditing) {
                handleSave();
              }
            }}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {isEditing && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            You have unsaved changes. Don't forget to save your edits and provide feedback to help improve our AI.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default EditParsedData;