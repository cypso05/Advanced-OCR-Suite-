import React from 'react';
import {
  Box, Paper, Typography, Chip, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableRow
} from '@mui/material';
import {
  CalendarToday, AttachMoney, Email, Phone,
  Language, Receipt, Description
} from '@mui/icons-material';

const SmartResults = ({ extraction }) => {
  if (!extraction) return null;
  
  const { extracted, analytics, formattedText } = extraction;
  
  return (
    <Box sx={{ mt: 3 }}>
      {/* Summary Card */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
        <Typography variant="h6" gutterBottom>
          📊 Document Analysis
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <CalendarToday color="primary" />
              <Typography variant="h6">{extracted.dates.length}</Typography>
              <Typography variant="caption">Dates</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <AttachMoney color="success" />
              <Typography variant="h6">{extracted.money.length}</Typography>
              <Typography variant="caption">Amounts</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Email color="secondary" />
              <Typography variant="h6">{extracted.emails.length}</Typography>
              <Typography variant="caption">Emails</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Phone color="warning" />
              <Typography variant="h6">{extracted.phones.length}</Typography>
              <Typography variant="caption">Phones</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Alert severity="info">
          Detected as: <strong>{analytics.documentType}</strong> • {analytics.summary.wordCount} words
        </Alert>
      </Paper>
      
      {/* Extracted Values */}
      {(extracted.dates.length > 0 || extracted.money.length > 0) && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🔍 Extracted Information
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableBody>
                {extracted.totals.map((total, idx) => (
                  <TableRow key={`total-${idx}`}>
                    <TableCell><AttachMoney sx={{ color: 'success.main' }} /></TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{total}</TableCell>
                  </TableRow>
                ))}
                
                {extracted.dates.slice(0, 3).map((date, idx) => (
                  <TableRow key={`date-${idx}`}>
                    <TableCell><CalendarToday sx={{ color: 'info.main' }} /></TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">{date}</TableCell>
                  </TableRow>
                ))}
                
                {extracted.emails.map((email, idx) => (
                  <TableRow key={`email-${idx}`}>
                    <TableCell><Email sx={{ color: 'secondary.main' }} /></TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">{email}</TableCell>
                  </TableRow>
                ))}
                
                {extracted.phones.map((phone, idx) => (
                  <TableRow key={`phone-${idx}`}>
                    <TableCell><Phone sx={{ color: 'warning.main' }} /></TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">{phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Formatted Text */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📝 Enhanced Text View
        </Typography>
       <Paper variant="outlined" sx={{ 
          p: 2, 
          bgcolor: '#f5f5f5',
          maxHeight: 400, 
          overflow: 'auto',
          border: '1px solid #e0e0e0' 
        }}>
          <Typography sx={{ 
            fontFamily: 'monospace', 
            whiteSpace: 'pre-wrap',
            color: '#1976d2',
            fontSize: '0.875rem'
          }}>
            {formattedText}
          </Typography>
        </Paper>
      </Paper>
    </Box>
  );
};

export default SmartResults;