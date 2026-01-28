import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, IconButton, Button,
  FormControl, InputLabel, Select, MenuItem,
  TextField, Slider, Alert, Grid,
  CircularProgress, Chip
} from '@mui/material';
import {
  Close, CloudDownload as CloudDownloadIcon,
  PictureAsPdf, Image as ImageIcon,
  Description, TextFields, Code
} from '@mui/icons-material';

// Page selector component for individual page selection
const PageSelector = ({ pages, selectedPages, setSelectedPages }) => {
  const totalPages = pages?.length || 0;
  
  const togglePage = (pageIndex) => {
    if (selectedPages.includes(pageIndex)) {
      setSelectedPages(selectedPages.filter(p => p !== pageIndex));
    } else {
      setSelectedPages([...selectedPages, pageIndex].sort((a, b) => a - b));
    }
  };
  
  const selectAll = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i));
  };
  
  const clearAll = () => {
    setSelectedPages([]);
  };
  
  const selectEven = () => {
    const evenPages = Array.from({ length: totalPages }, (_, i) => i).filter(i => i % 2 === 0);
    setSelectedPages(evenPages);
  };
  
  const selectOdd = () => {
    const oddPages = Array.from({ length: totalPages }, (_, i) => i).filter(i => i % 2 === 1);
    setSelectedPages(oddPages);
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#CBD5E0', fontWeight: 600 }}>
          Select Pages ({selectedPages.length} of {totalPages} selected)
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" onClick={selectAll} sx={{ fontSize: '0.7rem', py: 0.25 }}>
            All
          </Button>
          <Button size="small" onClick={clearAll} sx={{ fontSize: '0.7rem', py: 0.25 }}>
            None
          </Button>
          <Button size="small" onClick={selectEven} sx={{ fontSize: '0.7rem', py: 0.25 }}>
            Even
          </Button>
          <Button size="small" onClick={selectOdd} sx={{ fontSize: '0.7rem', py: 0.25 }}>
            Odd
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        maxHeight: '120px',
        overflowY: 'auto',
        p: 1,
        backgroundColor: '#5A6575',
        borderRadius: 1
      }}>
        {Array.from({ length: totalPages }, (_, i) => i).map((pageIndex) => (
          <Chip
            key={pageIndex}
            label={`Page ${pageIndex + 1}`}
            clickable
            color={selectedPages.includes(pageIndex) ? "primary" : "default"}
            variant={selectedPages.includes(pageIndex) ? "filled" : "outlined"}
            onClick={() => togglePage(pageIndex)}
            sx={{
              color: selectedPages.includes(pageIndex) ? 'white' : '#CBD5E0',
              borderColor: selectedPages.includes(pageIndex) ? '#667eea' : '#718096',
              backgroundColor: selectedPages.includes(pageIndex) ? '#667eea' : 'transparent',
              '&:hover': {
                backgroundColor: selectedPages.includes(pageIndex) ? '#5a67d8' : '#4A5568',
              }
            }}
            size="small"
          />
        ))}
      </Box>
      
      {selectedPages.length > 0 && (
        <Typography variant="caption" sx={{ color: '#A0AEC0', mt: 1, display: 'block' }}>
          Selected: {selectedPages.map(p => p + 1).join(', ')}
        </Typography>
      )}
    </Box>
  );
};
// Update the SaveDialog function signature:
const SaveDialog = ({ 
  open, 
  onClose, 
  onSave, 
  isSaving, 
  selectedFormat, 
  setSelectedFormat,
  contentHeight,
  qualityWarningThreshold,
  // ADD THESE NEW PROPS
  exportMode,
  setExportMode,
  selectedPages,
  setSelectedPages,
  mergeRatio,
  setMergeRatio,
  exportStartPage,
  setExportStartPage,
  exportEndPage,
  setExportEndPage,
  pages,
  currentPageIndex,
  // ADD THESE TWO NEW PROPS:
  canvasSize,
  textProperties // ← This is now properly used below
}) => {
  const isMultiPage = pages && pages.length > 1;
  const totalPages = pages?.length || 1;

  
// Alternative using if-else instead of switch
    React.useEffect(() => {
    if (!isMultiPage) return;
    
    if (exportMode === 'all') {
        setSelectedPages(Array.from({ length: totalPages }, (_, i) => i));
    } else if (exportMode === 'current') {
        setSelectedPages([currentPageIndex]);
    } else if (exportMode === 'range') {
        const startIdx = Math.max(0, exportStartPage - 1);
        const endIdx = Math.min(totalPages - 1, exportEndPage - 1);
        setSelectedPages(Array.from({ length: endIdx - startIdx + 1 }, (_, i) => startIdx + i));
    } else if (exportMode === 'select') {
        // Keep current selection
    } else {
        setSelectedPages([currentPageIndex]);
    }
    }, [exportMode, totalPages, currentPageIndex, exportStartPage, exportEndPage, isMultiPage, setSelectedPages]);

  // Update range when selectedPages changes in select mode
  React.useEffect(() => {
    if (exportMode === 'select' && selectedPages.length > 0) {
      const sorted = [...selectedPages].sort((a, b) => a - b);
      setExportStartPage(sorted[0] + 1);
      setExportEndPage(sorted[sorted.length - 1] + 1);
    }
  }, [selectedPages, exportMode, setExportStartPage, setExportEndPage]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#1A202C',
        color: 'white',
        padding: '16px 24px',
        margin: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Export Design
          </Typography>
          {/* Quality indicator in title */}
          {(selectedFormat === 'pdf' || selectedFormat === 'png') && textProperties && (
            <Chip 
              label="Quality Optimized" 
              size="small" 
              color="primary"
              variant="outlined"
              sx={{ 
                ml: 2, 
                fontSize: '0.7rem',
                height: '24px',
                borderColor: '#667eea',
                color: '#CBD5E0'
              }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white', marginLeft: 2 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        backgroundColor: '#2D3748',
        padding: '24px !important'
      }}>
        <Typography variant="body1" sx={{ color: '#CBD5E0', mb: 3 }}>
          Choose export format and options:
        </Typography>
        
        {/* Format Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel sx={{ 
            color: '#CBD5E0',
            fontWeight: 600,
            '&.Mui-focused': { color: '#667eea' }
          }}>
            Export Format
          </InputLabel>
          <Select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            label="Export Format"
            sx={{
              backgroundColor: '#4A5568',
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#718096'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea'
              }
            }}
          >
            <MenuItem value="json">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CloudDownloadIcon sx={{ color: '#9F7AEA' }} />
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Save as JSON
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E0' }}>
                    Save to app & download file
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="pdf">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PictureAsPdf sx={{ color: '#F56565' }} />
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Export as PDF
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E0' }}>
                    Download as PDF document
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="png">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ImageIcon sx={{ color: '#4299E1' }} />
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Export as Image
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E0' }}>
                    Download as PNG image
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="docx">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Description sx={{ color: '#9F7AEA' }} />
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Export as DOCX
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E0' }}>
                    Download as Word document
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="txt">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextFields sx={{ color: '#68D391' }} />
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Export as Text
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E0' }}>
                    Download as text file
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <MenuItem value="html">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Code sx={{ color: '#ED8936' }} />
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Export as HTML
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#CBD5E0' }}>
                    Download as HTML file
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
        
        {/* Multi-page Export Options */}
        {isMultiPage && (selectedFormat === 'pdf' || selectedFormat === 'png') && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#4A5568', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#CBD5E0', fontWeight: 600, mb: 2 }}>
              Page Export Options ({totalPages} pages total)
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#CBD5E0' }}>Export Mode</InputLabel>
              <Select
                value={exportMode}
                onChange={(e) => setExportMode(e.target.value)}
                label="Export Mode"
                sx={{
                  backgroundColor: '#5A6575',
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#718096'
                  }
                }}
              >
                <MenuItem value="all">All Pages ({totalPages})</MenuItem>
                <MenuItem value="current">Current Page Only (Page {currentPageIndex + 1})</MenuItem>
                <MenuItem value="range">Page Range</MenuItem>
                <MenuItem value="select">Select Individual Pages</MenuItem>
                <MenuItem value="merge">Merge Pages</MenuItem>
              </Select>
            </FormControl>
            
            {exportMode === 'range' && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Start Page"
                    type="number"
                    value={exportStartPage}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                      setExportStartPage(val);
                      if (val > exportEndPage) setExportEndPage(val);
                    }}
                    InputProps={{ inputProps: { min: 1, max: totalPages } }}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiInputLabel-root': { color: '#CBD5E0' }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Page"
                    type="number"
                    value={exportEndPage}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || totalPages));
                      setExportEndPage(val);
                      if (val < exportStartPage) setExportStartPage(val);
                    }}
                    InputProps={{ inputProps: { min: 1, max: totalPages } }}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-input': { color: 'white' },
                      '& .MuiInputLabel-root': { color: '#CBD5E0' }
                    }}
                  />
                </Grid>
              </Grid>
            )}
            
            {exportMode === 'select' && (
              <PageSelector 
                pages={pages}
                selectedPages={selectedPages}
                setSelectedPages={setSelectedPages}
              />
            )}
            
            {exportMode === 'merge' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#CBD5E0', mb: 1 }}>
                  Merge Ratio (pages per sheet)
                </Typography>
                <Slider
                  value={mergeRatio}
                  onChange={(e, newValue) => setMergeRatio(newValue)}
                  min={2}
                  max={Math.min(8, totalPages)}
                  step={1}
                  marks={[
                    { value: 2, label: '2' },
                    { value: 4, label: '4' },
                    { value: 6, label: '6' },
                    { value: 8, label: '8' }
                  ]}
                  sx={{ color: '#667eea' }}
                />
                <Typography variant="caption" sx={{ color: '#A0AEC0', mt: 1, display: 'block' }}>
                  {selectedPages.length || totalPages} pages will be merged into {Math.ceil((selectedPages.length || totalPages) / mergeRatio)} sheets
                </Typography>
              </Box>
            )}
            
            <Alert severity="info" sx={{ mt: 2, backgroundColor: '#2C5282', color: '#BEE3F8' }}>
              <Typography variant="caption">
                {exportMode === 'all' && `Exporting all ${totalPages} pages as separate ${selectedFormat.toUpperCase()} files.`}
                {exportMode === 'current' && `Exporting only current page (page ${currentPageIndex + 1}).`}
                {exportMode === 'range' && `Exporting pages ${exportStartPage} to ${exportEndPage} (${exportEndPage - exportStartPage + 1} pages).`}
                {exportMode === 'select' && `Exporting ${selectedPages.length} selected pages: ${selectedPages.map(p => p + 1).join(', ')}.`}
                {exportMode === 'merge' && `Merging ${selectedPages.length || totalPages} pages into ${Math.ceil((selectedPages.length || totalPages) / mergeRatio)} sheets (${mergeRatio} pages per sheet).`}
              </Typography>
            </Alert>
          </Box>
        )}
        
        {/* Content Warning */}
        {selectedFormat !== 'json' && contentHeight > qualityWarningThreshold && (
          <Alert 
            severity="warning" 
            sx={{ 
              mt: 2,
              backgroundColor: '#FFF3E0',
              border: '1px solid #FFB74D'
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              Content Height Warning
            </Typography>
            <Typography variant="caption">
              Your content ({Math.round(contentHeight)}px) exceeds the recommended height. 
              Export quality may be reduced. Consider splitting content or reducing font sizes.
            </Typography>
          </Alert>
        )}
        
        {/* Quality Info - Now properly uses textProperties */}
        {(selectedFormat === 'pdf' || selectedFormat === 'png') && canvasSize && textProperties && (
          <Alert severity="info" sx={{ 
            mt: 2, 
            backgroundColor: '#2C5282', 
            color: '#BEE3F8',
            border: '1px solid #4299E1'
          }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Export Quality Settings:
              </Typography>
              <Typography variant="caption">
                Canvas: {canvasSize.width}×{canvasSize.height}px
                {textProperties.enhanceClarity && ' • Enhanced text clarity'}
                {textProperties.fontScale && textProperties.fontScale > 1 && ` • Font scale: ${textProperties.fontScale.toFixed(2)}x`}
                {textProperties.highDPI && ' • High DPI (2x)'}
                {textProperties.preserveOCR && ' • OCR metadata preserved'}
              </Typography>
            </Box>
          </Alert>
        )}
        
        {/* Text Properties Summary */}
        {selectedFormat === 'pdf' && textProperties && (
          <Box sx={{ 
            backgroundColor: '#3A4558', 
            p: 2, 
            borderRadius: 1,
            borderLeft: '4px solid #68D391',
            mt: 2
          }}>
            <Typography variant="caption" sx={{ color: '#CBD5E0', fontWeight: 600, display: 'block', mb: 1 }}>
              Text Properties Applied:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={`Font: ${textProperties.fontFamily || 'Arial'}`} 
                size="small" 
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  borderColor: '#718096',
                  color: '#CBD5E0'
                }}
              />
              <Chip 
                label={`Size: ${textProperties.fontSize || 12}px`} 
                size="small" 
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  borderColor: '#718096',
                  color: '#CBD5E0'
                }}
              />
              {textProperties.fontWeight === 'bold' && (
                <Chip 
                  label="Bold" 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    borderColor: '#667eea',
                    color: '#667eea'
                  }}
                />
              )}
              {textProperties.fontStyle === 'italic' && (
                <Chip 
                  label="Italic" 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem',
                    borderColor: '#ED8936',
                    color: '#ED8936'
                  }}
                />
              )}
              <Chip 
                label={`Align: ${textProperties.textAlign || 'left'}`} 
                size="small" 
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  borderColor: '#9F7AEA',
                  color: '#9F7AEA'
                }}
              />
            </Box>
          </Box>
        )}
        
        {/* Info Box */}
        <Box sx={{ 
          backgroundColor: '#4A5568', 
          p: 2, 
          borderRadius: 1,
          borderLeft: '4px solid #667eea',
          mt: 2
        }}>
          <Typography variant="caption" sx={{ color: '#CBD5E0', fontWeight: 600 }}>
            {selectedFormat === 'json' ? 
              'This will save your design to the app storage and download a JSON file.' :
              selectedFormat === 'pdf' ? 
              'This will download your design as a PDF file with enhanced text clarity and quality optimization.' :
              selectedFormat === 'png' ? 
              'This will download your design as a high-quality PNG image.' :
              selectedFormat === 'docx' ?
              'This will download your design as a Word document with preserved formatting.' :
              selectedFormat === 'txt' ?
              'This will download your design as a text file.' :
              'This will download your design as an HTML file with interactive elements.'}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        backgroundColor: '#2D3748',
        padding: '16px 24px',
        borderTop: '1px solid #4A5568'
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#CBD5E0',
            fontWeight: 600
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={isSaving || (exportMode === 'select' && selectedPages.length === 0)}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            }
          }}
        >
          {isSaving ? 'Processing...' : selectedFormat === 'json' ? 'Save Design' : 'Export Design'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveDialog;