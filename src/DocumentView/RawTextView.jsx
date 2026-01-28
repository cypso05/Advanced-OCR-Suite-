// src/app/features/ocr/components/DocumentView/RawTextView.jsx
import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  ContentCopy,
  CheckCircle,
  Warning
} from '@mui/icons-material';

const RawTextView = ({ 
  rawText, 
  onSave, 
  onCancel,
  documentType,
  fileName,
  readOnly = false 
}) => {
  const [editedText, setEditedText] = useState(rawText);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    onSave(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(rawText);
    setIsEditing(false);
    if (onCancel) onCancel();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getTextStats = (text) => {
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const lines = text.trim() ? text.split('\n') : [];
    return {
      words: words.length,
      lines: lines.length,
      characters: text.length
    };
  };

  const stats = getTextStats(editedText);

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Raw OCR Text
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!readOnly && (
            <>
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    size="small"
                  >
                    Save
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
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
                  size="small"
                >
                  Edit
                </Button>
              )}
            </>
          )}
          
          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
            <IconButton onClick={handleCopy} size="small">
              {copied ? <CheckCircle color="success" /> : <ContentCopy />}
            </IconButton>
          </Tooltip>
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
            label={`${stats.words} words`}
            size="small"
            variant="outlined"
          />
          <Chip 
            label={`${stats.lines} lines`}
            size="small"
            variant="outlined"
          />
          <Chip 
            label={`${stats.characters} chars`}
            size="small"
            variant="outlined"
          />
        </Box>
        {fileName && (
          <Typography variant="body2" color="text.secondary">
            File: {fileName}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {!rawText || rawText.trim().length === 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No text was extracted from this document. The OCR process may have failed or the document may be unreadable.
        </Alert>
      ) : rawText.length < 50 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Very little text was extracted. This might indicate poor image quality or an unsupported document type.
        </Alert>
      ) : null}

      <TextField
        fullWidth
        multiline
        rows={12}
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        disabled={!isEditing && !readOnly}
        variant={isEditing ? "outlined" : "filled"}
        sx={{
          '& .MuiInputBase-root': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.4
          }
        }}
        placeholder="No text available. The OCR process may have failed to extract any readable text from this document."
      />

      {isEditing && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Editing the raw text will affect AI processing results. Make sure to correct any OCR errors for better parsing accuracy.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default RawTextView;