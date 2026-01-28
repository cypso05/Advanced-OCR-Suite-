// src/app/features/ocr/components/CVTemplateEditor.jsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Grid, Paper, Card, CardContent,
  TextField, Tabs, Tab, FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton,
} from '@mui/material';
import {
  Save, Close, Add, Delete, DragIndicator,
  Palette, FormatBold, FormatItalic
} from '@mui/icons-material';

const CVTemplateEditor = ({ open, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [cvData, setCvData] = useState({
    personalInfo: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
    design: {
      template: 'modern',
      colorScheme: 'blue',
      fontFamily: 'Arial',
      fontSize: 14
    }
  });

  const templates = [
    { id: 'modern', name: 'Modern', description: 'Clean and professional' },
    { id: 'classic', name: 'Classic', description: 'Traditional layout' },
    { id: 'creative', name: 'Creative', description: 'Design-focused' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' }
  ];

  const colorSchemes = {
    blue: { primary: '#1976d2', secondary: '#42a5f5', text: '#333333' },
    green: { primary: '#2e7d32', secondary: '#4caf50', text: '#333333' },
    purple: { primary: '#7b1fa2', secondary: '#9c27b0', text: '#333333' },
    dark: { primary: '#333333', secondary: '#666666', text: '#ffffff' }
  };

  const handleSaveCV = () => {
    onSave(cvData);
  };

  const handleAddExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now(),
        title: '',
        company: '',
        period: '',
        description: ''
      }]
    }));
  };

  const handleRemoveExperience = (id) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h5">CV Template Editor</Typography>
        <Typography variant="body2" color="text.secondary">
          Create and customize your CV from extracted data
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* Left Side - Form Editor */}
          <Grid item xs={12} md={6}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Personal Info" />
              <Tab label="Experience" />
              <Tab label="Skills" />
              <Tab label="Design" />
            </Tabs>
            
            <Box sx={{ mt: 2 }}>
              {activeTab === 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Personal Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={cvData.personalInfo.name || ''}
                        onChange={(e) => setCvData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, name: e.target.value }
                        }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={cvData.personalInfo.email || ''}
                        onChange={(e) => setCvData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={cvData.personalInfo.phone || ''}
                        onChange={(e) => setCvData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Professional Summary"
                        multiline
                        rows={4}
                        value={cvData.summary}
                        onChange={(e) => setCvData(prev => ({ ...prev, summary: e.target.value }))}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              )}
              
              {activeTab === 1 && (
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Work Experience</Typography>
                    <Button startIcon={<Add />} onClick={handleAddExperience}>
                      Add Experience
                    </Button>
                  </Box>
                  
                  {cvData.experience.map((exp, index) => (
                    <Card key={exp.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle1">Experience #{index + 1}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveExperience(exp.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Job Title"
                              value={exp.title}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].title = e.target.value;
                                setCvData(prev => ({ ...prev, experience: newExp }));
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Company"
                              value={exp.company}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].company = e.target.value;
                                setCvData(prev => ({ ...prev, experience: newExp }));
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Period"
                              value={exp.period}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].period = e.target.value;
                                setCvData(prev => ({ ...prev, experience: newExp }));
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                              label="Description"
                              value={exp.description}
                              onChange={(e) => {
                                const newExp = [...cvData.experience];
                                newExp[index].description = e.target.value;
                                setCvData(prev => ({ ...prev, experience: newExp }));
                              }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Paper>
              )}
              
              {activeTab === 2 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Skills</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {cvData.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        onDelete={() => {
                          const newSkills = [...cvData.skills];
                          newSkills.splice(index, 1);
                          setCvData(prev => ({ ...prev, skills: newSkills }));
                        }}
                      />
                    ))}
                  </Box>
                  <TextField
                    fullWidth
                    label="Add Skill"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setCvData(prev => ({
                          ...prev,
                          skills: [...prev.skills, e.target.value.trim()]
                        }));
                        e.target.value = '';
                      }
                    }}
                  />
                </Paper>
              )}
              
              {activeTab === 3 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Design Settings</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Template</InputLabel>
                        <Select
                          value={cvData.design.template}
                          label="Template"
                          onChange={(e) => setCvData(prev => ({
                            ...prev,
                            design: { ...prev.design, template: e.target.value }
                          }))}
                        >
                          {templates.map(template => (
                            <MenuItem key={template.id} value={template.id}>
                              {template.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Color Scheme</InputLabel>
                        <Select
                          value={cvData.design.colorScheme}
                          label="Color Scheme"
                          onChange={(e) => setCvData(prev => ({
                            ...prev,
                            design: { ...prev.design, colorScheme: e.target.value }
                          }))}
                        >
                          {Object.keys(colorSchemes).map(scheme => (
                            <MenuItem key={scheme} value={scheme}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: colorSchemes[scheme].primary,
                                    borderRadius: 1
                                  }}
                                />
                                {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          </Grid>
          
          {/* Right Side - Preview */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '600px', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom sx={{ 
                color: colorSchemes[cvData.design.colorScheme].primary,
                borderBottom: `2px solid ${colorSchemes[cvData.design.colorScheme].primary}`,
                pb: 1
              }}>
                CV Preview
              </Typography>
              
              {/* CV Preview Content */}
              <Box sx={{ fontFamily: cvData.design.fontFamily, fontSize: cvData.design.fontSize }}>
                {cvData.personalInfo.name && (
                  <Typography variant="h4" gutterBottom sx={{ color: colorSchemes[cvData.design.colorScheme].primary }}>
                    {cvData.personalInfo.name}
                  </Typography>
                )}
                
                {(cvData.personalInfo.email || cvData.personalInfo.phone) && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    {cvData.personalInfo.email && (
                      <Typography variant="body2">{cvData.personalInfo.email}</Typography>
                    )}
                    {cvData.personalInfo.phone && (
                      <Typography variant="body2">{cvData.personalInfo.phone}</Typography>
                    )}
                  </Box>
                )}
                
                {cvData.summary && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: colorSchemes[cvData.design.colorScheme].primary }}>
                      Professional Summary
                    </Typography>
                    <Typography variant="body2">{cvData.summary}</Typography>
                  </Box>
                )}
                
                {cvData.experience.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: colorSchemes[cvData.design.colorScheme].primary }}>
                      Work Experience
                    </Typography>
                    {cvData.experience.map((exp, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="subtitle1">{exp.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exp.company} {exp.period && `| ${exp.period}`}
                        </Typography>
                        {exp.description && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {exp.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
                
                {cvData.skills.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: colorSchemes[cvData.design.colorScheme].primary }}>
                      Skills
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {cvData.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          size="small"
                          sx={{ 
                            backgroundColor: colorSchemes[cvData.design.colorScheme].secondary,
                            color: 'white'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<Close />}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveCV} 
          variant="contained" 
          startIcon={<Save />}
          sx={{ backgroundColor: colorSchemes[cvData.design.colorScheme].primary }}
        >
          Save CV
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CVTemplateEditor;