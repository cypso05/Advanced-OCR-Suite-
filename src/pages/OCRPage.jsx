// OCRPage.jsx - Fixed version
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  DocumentScanner as DocumentScannerIcon,
  Receipt,
  CreditCard,
  Badge,
  Image,
  CameraAlt,
  CloudUpload
} from '@mui/icons-material';
import DocumentScanner from '../components/DocumentScanner';
import OCRScanner from '../components/OCRScanner';
import AdvancedOCR from '../components/AdvancedOCR';

// Move TabPanel outside the component
const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`ocr-tabpanel-${index}`}
    aria-labelledby={`ocr-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const OCRPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  const features = [
    {
      icon: <DocumentScannerIcon sx={{ fontSize: 40 }} />,
      title: 'Smart Document Scan',
      description: 'High-quality document scanning with automatic edge detection and perspective correction',
      color: theme.palette.primary.main
    },
    {
      icon: <Receipt sx={{ fontSize: 40 }} />,
      title: 'Receipt Processing',
      description: 'Extract totals, dates, and items from receipts with AI-powered recognition',
      color: theme.palette.secondary.main
    },
    {
      icon: <CreditCard sx={{ fontSize: 40 }} />,
      title: 'Business Cards',
      description: 'Automatically extract contact information and save to contacts',
      color: theme.palette.success.main
    },
    {
      icon: <Badge sx={{ fontSize: 40 }} />,
      title: 'ID Document Scan',
      description: 'Secure scanning of ID cards, passports, and official documents',
      color: theme.palette.warning.main
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            fontWeight: 700
          }}
        >
          AI-Powered Document Scanner
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Transform your documents into digital text with professional-grade OCR technology
        </Typography>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(feature.color, 0.1),
                    color: feature.color,
                    mb: 2
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Scanner Interface */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              py: 2
            }
          }}
          centered
        >
          <Tab 
            icon={<DocumentScannerIcon sx={{ mr: 1 }} />}
            label="Document Scanner" 
            iconPosition="start"
          />
          <Tab 
            icon={<Image sx={{ mr: 1 }} />}
            label="Quick Text Scan" 
            iconPosition="start"
          />
          <Tab 
            icon={<CameraAlt sx={{ mr: 1 }} />}
            label="Advanced OCR" 
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <DocumentScanner />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <OCRScanner />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <AdvancedOCR />
          </TabPanel>
        </Box>
      </Paper>

      {/* Stats Section */}
      <Grid container spacing={4} sx={{ mt: 6, textAlign: 'center' }}>
        <Grid item xs={12} sm={4}>
          <Typography variant="h3" color="primary" fontWeight={700}>
            99.8%
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Accuracy Rate
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Industry-leading OCR accuracy
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h3" color="secondary" fontWeight={700}>
            50+
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Languages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-language text recognition
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h3" color="success.main" fontWeight={700}>
            <CloudUpload sx={{ fontSize: 'inherit', verticalAlign: 'middle' }} />
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Cloud Sync
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automatic backup & sync
          </Typography>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OCRPage;