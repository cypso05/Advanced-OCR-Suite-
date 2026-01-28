import React from 'react';
import { Alert, Snackbar, Slide } from '@mui/material';

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const AppNotification = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 6 }}
    >
      <Alert 
        onClose={onClose} 
        severity={severity} 
        variant="filled"
        sx={{ 
          width: '100%',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AppNotification;