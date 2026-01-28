// src/app/features/ocr/pages/ExportPreviewPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container, Box, Typography, IconButton, Button,
  Slider, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, TextField, Grid,
  Chip, CircularProgress, Paper,
  Breadcrumbs, Link, Divider, AppBar, Toolbar,
  Snackbar // ADD THIS IMPORT
} from '@mui/material';
import {
  ArrowBack, ZoomIn, ZoomOut, Rotate90DegreesCw,
  Contrast, TextFields, FormatAlignLeft,
  FormatAlignCenter, FormatAlignRight, Download,
  Refresh, PictureAsPdf, Image as ImageIcon
} from '@mui/icons-material';
import MuiAlert from '@mui/material/Alert'; // ADD THIS IMPORT

import { generatePreview } from '../utils/pdfExportUtils';
import { useEditorNavigation } from '../components/useEditorNavigation';
import { useNotification } from '../components/useNotification'; // ADD THIS IMPORT
import SaveDialog from '../components/SaveDialog'; // ADD THIS IMPORT

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ExportPreviewPage = () => {
  const location = useLocation();
  const { goBackToPDFEditor, goBackToAdvancedOCR } = useEditorNavigation();
  const { showNotification, hideNotification, notification } = useNotification(); // ADD THIS
  
  const canvasRef = useRef(null);
  
  // Get data passed from PDFEditor
  const { 
    pages = [], 
    currentPageIndex = 0,
    canvasSize = { width: 794, height: 1123 }, 
    textProperties = {},
    documentMetadata 
  } = location.state || {};

  // Extract current page elements
  const currentPage = pages[currentPageIndex] || {};
  const elements = currentPage.elements || [];
  
  console.log('📥 Received data in preview:', {
    pagesCount: pages.length,
    currentPageIndex,
    currentPageElements: elements.length,
    canvasSize,
    documentMetadata,
    cameFrom: location.state?.cameFromPDFEditor ? 'PDF Editor' : 'Unknown'
  });
  
  const [previewImage, setPreviewImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [error, setError] = useState(null);
  const [exportOptions, setExportOptions] = useState({
    mergeRatio: 2,
    mergeOrientation: 'vertical',
    mergeAddBorders: true,
    mergeAddPageNumbers: true,
    quality: 'high',
    enhanceClarity: true,
    contrast: 1.0,
    addOutline: false,
    textAlign: 'left',
    fontFamily: 'Arial',
    fontSize: 16,
    format: 'pdf'
  });

  // SaveDialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
  // Multi-page export state
  const [exportMode, setExportMode] = useState('all');
  const [selectedPages, setSelectedPages] = useState([]);
  const [mergeRatio, setMergeRatio] = useState(2);
  const [exportStartPage, setExportStartPage] = useState(1);
  const [exportEndPage, setExportEndPage] = useState(1);

  // Update export options
  const handleExportOptionChange = (key, value) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  // Initialize selected pages
  useEffect(() => {
    if (pages && pages.length > 0) {
      setSelectedPages(Array.from({ length: pages.length }, (_, i) => i));
      setExportEndPage(pages.length);
    }
  }, [pages]);

  // Memoize the preview generation function
  const generatePreviewImage = useCallback(async () => {
    if (!pages || pages.length === 0) {
      setError('No pages available for preview');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // Generate preview
      const canvas = await generatePreview(pages, {
        ...exportOptions,
        scale: scale,
        canvasSize: canvasSize,
        textProperties: { ...textProperties, ...exportOptions }
      });
      
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        setPreviewImage(dataUrl);
      }
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError(err.message || 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  }, [pages, exportOptions, scale, canvasSize, textProperties]);
  
  // Generate preview when options change
  useEffect(() => {
    if (pages && pages.length > 0) {
      generatePreviewImage();
    }
  }, [pages, exportOptions, scale, generatePreviewImage]);
  
  const handleScaleChange = (newScale) => {
    setScale(Math.max(0.1, Math.min(1, newScale)));
  };
  
  const handleRegeneratePreview = () => {
    generatePreviewImage();
  };

  // Enhanced handleExport function using shared utils
  const handleExport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      console.log('🚀 Starting export from preview:', {
        format: exportOptions.format,
        pagesCount: pages.length,
        exportMode,
        selectedPagesCount: selectedPages.length
      });

      // Import the shared export utility
      const { handlePDFDocumentExport } = await import('../utils/pdfExportUtils');
      
      // Build export data matching PDF Editor structure
      const exportData = {
        content: '',
        elements: elements,
        canvasSize: canvasSize,
        pages: pages,
        metadata: {
          timestamp: new Date().toISOString(),
          documentType: 'export_preview',
          exportSettings: exportOptions,
          fileName: documentMetadata?.fileName || 'Export Preview',
          fileType: documentMetadata?.fileType || 'document',
          totalPages: pages.length
        },
        textProperties: {
          ...textProperties,
          // Apply export option overrides
          fontFamily: exportOptions.fontFamily || textProperties.fontFamily || 'Arial',
          fontSize: exportOptions.fontSize || textProperties.fontSize || 16,
          textAlign: exportOptions.textAlign || textProperties.textAlign || 'left',
          enhanceClarity: exportOptions.enhanceClarity !== false,
          contrast: exportOptions.contrast || 1.0,
          addOutline: exportOptions.addOutline || false,
          // Add quality-based enhancements
          fontScale: exportOptions.quality === 'ultra' ? 1.2 : 
                    exportOptions.quality === 'high' ? 1.1 : 1,
          highDPI: exportOptions.quality === 'ultra' || exportOptions.quality === 'high',
          preserveOCR: true
        }
      };

      // Prepare page options matching PDF Editor structure
      const pageOptions = {
        exportMode: exportMode,
        currentPageIndex: currentPageIndex,
        selectedPages: selectedPages,
        mergeRatio: exportMode === 'merge' ? exportOptions.mergeRatio : 1,
        mergeOrientation: exportOptions.mergeOrientation || 'vertical',
        mergeAddBorders: exportOptions.mergeAddBorders !== false,
        mergeAddPageNumbers: exportOptions.mergeAddPageNumbers !== false,
        canvasSize: canvasSize,
        textProperties: exportData.textProperties,
        filename: `export-${Date.now()}`,
        pages: pages,
        startPage: exportStartPage,
        endPage: exportEndPage
      };

      // Call the shared export utility
      await handlePDFDocumentExport(
        exportOptions.format || 'pdf',
        exportData,
        canvasRef.current ? { current: canvasRef.current } : null, // Use canvasRef if available
        canvasSize,
        exportData.textProperties,
        exportData.metadata,
        pageOptions
      );
      
      showNotification(`Successfully exported as ${exportOptions.format?.toUpperCase()}!`, 'success');
      setSaveDialogOpen(false);
      
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error.message || 'Export failed';
      setError(errorMessage);
      showNotification(`Export failed: ${errorMessage}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackToEditor = () => {
    // Use the navigation hook to go back to PDF Editor with state
    goBackToPDFEditor({
      pages: pages,
      elements: elements,
      canvasSize: canvasSize,
      textProperties: textProperties,
      documentMetadata: documentMetadata,
      // Keep the original cameFrom flag if it exists
      cameFromAdvancedOCR: location.state?.cameFromAdvancedOCR || false
    });
  };

  // If no pages are passed, show an error and redirect back
  if (!pages || pages.length === 0) {
    return (
      <Container>
        <Box my={4} textAlign="center">
          <Typography variant="h5" gutterBottom>
            No document data available for preview.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Please go back to the editor and click "Preview Export" again.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            {/* Primary action: Back to PDF Editor */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArrowBack />}
              onClick={handleBackToEditor}
            >
              Back to PDF Editor
            </Button>
            
            {/* Secondary action: Back to Advanced OCR (if came from there) */}
            {location.state?.cameFromAdvancedOCR && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={goBackToAdvancedOCR}
              >
                Back to Advanced OCR
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          severity={notification.severity} 
          onClose={hideNotification}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <AppBar position="static" color="default" elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
        <Toolbar>
          {/* Back button - now goes to PDF Editor */}
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={handleBackToEditor} 
            sx={{ mr: 2 }}
            title="Back to PDF Editor"
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              Export Preview & Quality Control
            </Typography>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 0.5 }}>
              <Link 
                underline="hover" 
                color="inherit" 
                component="button"
                onClick={handleBackToEditor}
              >
                PDF Editor
              </Link>
              <Typography color="text.primary">Export Preview</Typography>
            </Breadcrumbs>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {pages && pages.length > 0 && (
              <Chip 
                label={`${pages.length} page${pages.length > 1 ? 's' : ''}`} 
                color="primary" 
                variant="outlined"
                icon={<PictureAsPdf />}
              />
            )}
            
            <Button
              variant="contained"
              color="primary"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <Download />}
              onClick={() => setSaveDialogOpen(true)} // Open SaveDialog instead of direct export
              disabled={isGenerating}
              sx={{ minWidth: '180px' }}
            >
              {isGenerating ? 'Exporting...' : `Export as ${exportOptions.format?.toUpperCase() || 'PDF'}`}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Grid container spacing={3}>
        {/* Preview Panel - Left side */}
        <Grid item xs={8}>
          <Paper sx={{ p: 3, mb: 3, minHeight: '70vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Live Preview
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => handleScaleChange(scale - 0.1)}
                  disabled={scale <= 0.1 || isGenerating}
                  size="small"
                >
                  <ZoomOut />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: '60px', textAlign: 'center' }}>
                  {Math.round(scale * 100)}%
                </Typography>
                <IconButton 
                  onClick={() => handleScaleChange(scale + 0.1)}
                  disabled={scale >= 1 || isGenerating}
                  size="small"
                >
                  <ZoomIn />
                </IconButton>
                
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRegeneratePreview}
                  disabled={isGenerating}
                  size="small"
                >
                  Refresh Preview
                </Button>
              </Box>
            </Box>
            
            {/* Zoom slider */}
            <Box sx={{ mb: 3 }}>
              <Slider
                value={scale}
                onChange={(e, newValue) => handleScaleChange(newValue)}
                min={0.1}
                max={1}
                step={0.1}
                disabled={isGenerating}
                marks={[
                  { value: 0.1, label: '10%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' }
                ]}
              />
            </Box>
            
            {/* Preview Area */}
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                p: 3,
                backgroundColor: '#fafafa',
                minHeight: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'auto'
              }}
            >
              {isGenerating ? (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <CircularProgress />
                  <Typography color="textSecondary">Generating preview...</Typography>
                </Box>
              ) : error ? (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {error}
                  </Alert>
                  <Button 
                    variant="outlined" 
                    startIcon={<Refresh />}
                    onClick={handleRegeneratePreview}
                  >
                    Retry Preview
                  </Button>
                </Box>
              ) : previewImage ? (
                <Box position="relative">
                  <img
                    src={previewImage}
                    alt="Export Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '600px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                      display: 'block'
                    }}
                  />
                  {/* Preview overlay info */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdf sx={{ fontSize: 16 }} />
                      <span>Preview | {Math.round(scale * 100)}% | Page 1 of {pages.length}</span>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <Typography color="textSecondary" align="center" variant="h6">
                    Preview will appear here
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: '400px' }}>
                    Adjust the settings on the right to customize your export, then click "Refresh Preview" to see the changes.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Refresh />}
                    onClick={handleRegeneratePreview}
                    disabled={!pages || pages.length === 0}
                    sx={{ mt: 2 }}
                  >
                    Generate Preview
                  </Button>
                </Box>
              )}
            </Box>
            
            {/* Page Navigation */}
            {pages.length > 1 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <Button variant="outlined" size="small" disabled>
                  Previous
                </Button>
                <Typography variant="body2">
                  Page <strong>1</strong> of <strong>{pages.length}</strong>
                </Typography>
                <Button variant="outlined" size="small" disabled>
                  Next
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  (Multi-page preview coming soon)
                </Typography>
              </Box>
            )}
            
            {/* Document Info */}
            {documentMetadata && (
              <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Document Information
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">File Name:</Typography>
                    <Typography variant="body2">{documentMetadata.fileName || 'Untitled'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">File Type:</Typography>
                    <Typography variant="body2">{documentMetadata.fileType || 'Document'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Canvas Size:</Typography>
                    <Typography variant="body2">{canvasSize.width} × {canvasSize.height} px</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total Elements:</Typography>
                    <Typography variant="body2">{elements.length || 0}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Paper>
        </Grid>

        {/* Settings Panel - Right side */}
        <Grid item xs={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Export Settings
            </Typography>
            
            {/* Export Format */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium" color="primary">
                Export Format
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportOptions.format || 'pdf'}
                  label="Format"
                  onChange={(e) => handleExportOptionChange('format', e.target.value)}
                >
                  <MenuItem value="pdf">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdf fontSize="small" /> PDF Document
                    </Box>
                  </MenuItem>
                  <MenuItem value="png">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ImageIcon fontSize="small" /> PNG Image
                    </Box>
                  </MenuItem>
                  <MenuItem value="jpg">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ImageIcon fontSize="small" /> JPG Image
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Merge Settings */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium" color="primary">
                Page Layout
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Pages per Sheet</InputLabel>
                <Select
                  value={exportOptions.mergeRatio || 2}
                  label="Pages per Sheet"
                  onChange={(e) => handleExportOptionChange('mergeRatio', e.target.value)}
                >
                  <MenuItem value={1}>1 page per sheet</MenuItem>
                  <MenuItem value={2}>2 pages per sheet</MenuItem>
                  <MenuItem value={4}>4 pages per sheet</MenuItem>
                  <MenuItem value={6}>6 pages per sheet</MenuItem>
                  <MenuItem value={9}>9 pages per sheet</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Layout Orientation</InputLabel>
                <Select
                  value={exportOptions.mergeOrientation || 'vertical'}
                  label="Layout Orientation"
                  onChange={(e) => handleExportOptionChange('mergeOrientation', e.target.value)}
                >
                  <MenuItem value="horizontal">Horizontal (Side by Side)</MenuItem>
                  <MenuItem value="vertical">Vertical (Stacked)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.mergeAddBorders !== false}
                    onChange={(e) => handleExportOptionChange('mergeAddBorders', e.target.checked)}
                  />
                }
                label="Add Page Borders"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.mergeAddPageNumbers !== false}
                    onChange={(e) => handleExportOptionChange('mergeAddPageNumbers', e.target.checked)}
                  />
                }
                label="Add Page Numbers"
              />
            </Box>
            
            {/* Quality Settings */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium" color="primary">
                Quality Settings
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Quality Preset</InputLabel>
                <Select
                  value={exportOptions.quality || 'high'}
                  label="Quality Preset"
                  onChange={(e) => handleExportOptionChange('quality', e.target.value)}
                >
                  <MenuItem value="low">Low (Fast, Smaller File)</MenuItem>
                  <MenuItem value="medium">Medium (Balanced)</MenuItem>
                  <MenuItem value="high">High (Good Quality)</MenuItem>
                  <MenuItem value="ultra">Ultra (Best Quality)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            {/* Text Enhancement */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium" color="primary">
                Text Enhancement
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.enhanceClarity !== false}
                    onChange={(e) => handleExportOptionChange('enhanceClarity', e.target.checked)}
                  />
                }
                label="Enhance Text Clarity"
              />
              
              {exportOptions.enhanceClarity !== false && (
                <>
                  <Box mt={2}>
                    <Typography variant="caption" display="block" gutterBottom>
                      Contrast: {exportOptions.contrast || 1.0}x
                    </Typography>
                    <Slider
                      value={exportOptions.contrast || 1.0}
                      onChange={(e, newValue) => handleExportOptionChange('contrast', newValue)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      marks={[
                        { value: 0.5, label: 'Low' },
                        { value: 1.0, label: 'Normal' },
                        { value: 1.5, label: 'High' },
                        { value: 2.0, label: 'Max' }
                      ]}
                    />
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.addOutline || false}
                        onChange={(e) => handleExportOptionChange('addOutline', e.target.checked)}
                      />
                    }
                    label="Add Outline to Text"
                  />
                  
                  <Box mt={2}>
                    <Typography variant="caption" display="block" gutterBottom>
                      Text Alignment
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <IconButton
                        size="small"
                        color={exportOptions.textAlign === 'left' ? 'primary' : 'default'}
                        onClick={() => handleExportOptionChange('textAlign', 'left')}
                      >
                        <FormatAlignLeft />
                      </IconButton>
                      <IconButton
                        size="small"
                        color={exportOptions.textAlign === 'center' ? 'primary' : 'default'}
                        onClick={() => handleExportOptionChange('textAlign', 'center')}
                      >
                        <FormatAlignCenter />
                      </IconButton>
                      <IconButton
                        size="small"
                        color={exportOptions.textAlign === 'right' ? 'primary' : 'default'}
                        onClick={() => handleExportOptionChange('textAlign', 'right')}
                      >
                        <FormatAlignRight />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
            
            {/* Font Settings */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight="medium" color="primary">
                Font Settings
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Font Family</InputLabel>
                <Select
                  value={exportOptions.fontFamily || 'Arial'}
                  label="Font Family"
                  onChange={(e) => handleExportOptionChange('fontFamily', e.target.value)}
                >
                  <MenuItem value="Arial">Arial</MenuItem>
                  <MenuItem value="Helvetica">Helvetica</MenuItem>
                  <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                  <MenuItem value="Georgia">Georgia</MenuItem>
                  <MenuItem value="Courier New">Courier New</MenuItem>
                  <MenuItem value="Verdana">Verdana</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Font Size (px)"
                type="number"
                size="small"
                fullWidth
                value={exportOptions.fontSize || 16}
                onChange={(e) => handleExportOptionChange('fontSize', parseInt(e.target.value) || 16)}
                inputProps={{ min: 8, max: 72 }}
                helperText="Base font size for text elements"
              />
            </Box>
            
            {/* Quick Actions */}
            <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              
              {/* Back to PDF Editor Button */}
              <Button
                variant="contained"
                fullWidth
                sx={{ mb: 2 }}
                onClick={handleBackToEditor}
                startIcon={<ArrowBack />}
                color="primary"
              >
                Back to PDF Editor
              </Button>
              
              {/* Back to Advanced OCR Button - for when launched from OCR */}
              {location.state?.cameFromAdvancedOCR && (
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 2 }}
                  onClick={goBackToAdvancedOCR}
                  startIcon={<ArrowBack />}
                >
                  Back to Advanced OCR
                </Button>
              )}
              
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => {
                  setExportOptions({
                    mergeRatio: 2,
                    mergeOrientation: 'vertical',
                    mergeAddBorders: true,
                    mergeAddPageNumbers: true,
                    quality: 'high',
                    enhanceClarity: true,
                    contrast: 1.0,
                    addOutline: false,
                    textAlign: 'left',
                    fontFamily: 'Arial',
                    fontSize: 16,
                    format: 'pdf'
                  });
                }}
              >
                Reset to Defaults
              </Button>
              
              <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                <Typography variant="caption" component="div">
                  <strong>Note:</strong> Changes made here are for preview and export only. 
                  To edit the document content, go back to the editor.
                </Typography>
              </Alert>
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      {/* SaveDialog Component - Reusing the same one from PDF Editor */}
      <SaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleExport}
        isSaving={isGenerating}
        selectedFormat={exportOptions.format}
        setSelectedFormat={(format) => handleExportOptionChange('format', format)}
        contentHeight={canvasSize.height}
        qualityWarningThreshold={canvasSize.height * 1.2}
        // Multi-page options
        exportMode={exportMode}
        setExportMode={setExportMode}
        selectedPages={selectedPages}
        setSelectedPages={setSelectedPages}
        mergeRatio={mergeRatio}
        setMergeRatio={setMergeRatio}
        exportStartPage={exportStartPage}
        setExportStartPage={setExportStartPage}
        exportEndPage={exportEndPage}
        setExportEndPage={setExportEndPage}
        pages={pages}
        currentPageIndex={currentPageIndex}
        // Quality settings
        canvasSize={canvasSize}
        textProperties={{
          ...textProperties,
          // Add export option enhancements
          fontFamily: exportOptions.fontFamily,
          fontSize: exportOptions.fontSize,
          textAlign: exportOptions.textAlign,
          enhanceClarity: exportOptions.enhanceClarity,
          contrast: exportOptions.contrast,
          addOutline: exportOptions.addOutline,
          fontScale: exportOptions.quality === 'ultra' ? 1.2 : 
                    exportOptions.quality === 'high' ? 1.1 : 1,
          highDPI: exportOptions.quality === 'ultra' || exportOptions.quality === 'high',
          preserveOCR: true
        }}
      />
    </Container>
  );
};

export default ExportPreviewPage;