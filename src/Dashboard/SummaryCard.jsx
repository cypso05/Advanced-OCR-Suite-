// src/app/features/dashboard/components/SummaryCard.jsx
import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  color = '#2196F3', 
  subtitle = '',
  trend = null,
  trendLabel = '',
  onClick,
  loading = false
}) => {
  const theme = useTheme();

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendColor = () => {
    if (trend === null) return 'text.secondary';
    if (trend > 0) return theme.palette.success.main;
    if (trend < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const getTrendIcon = () => {
    if (trend === null) return null;
    if (trend > 0) return '↗';
    if (trend < 0) return '↘';
    return '→';
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                {title}
              </Typography>
              <Box sx={{ height: 40, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '60%', height: 8, bgcolor: 'grey.200', borderRadius: 1 }} />
              </Box>
            </Box>
            <Box sx={{ 
              opacity: 0.5,
              backgroundColor: `${color}15`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.cloneElement(icon, { color: 'disabled' })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { 
          transform: 'translateY(-4px)', 
          boxShadow: theme.shadows[8],
          backgroundColor: theme.palette.action.hover
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color, fontWeight: 700, mb: 0.5 }}>
              {formatValue(value)}
            </Typography>
            
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 1 }}>
                {subtitle}
              </Typography>
            )}
            
            {(trend !== null || trendLabel) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {trend !== null && (
                  <Chip 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {getTrendIcon()}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {Math.abs(trend)}%
                        </Typography>
                      </Box>
                    }
                    size="small"
                    sx={{ 
                      backgroundColor: `${getTrendColor()}15`,
                      color: getTrendColor(),
                      border: `1px solid ${getTrendColor()}30`,
                      fontWeight: 600
                    }}
                  />
                )}
                
                {trendLabel && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {trendLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          
          <Box sx={{ 
            color, 
            backgroundColor: `${color}15`,
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            '&:hover': onClick ? { transform: 'scale(1.1)' } : {}
          }}>
            {React.cloneElement(icon, { fontSize: 'medium' })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;