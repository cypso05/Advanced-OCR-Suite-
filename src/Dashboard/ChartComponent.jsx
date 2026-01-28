// src/app/features/dashboard/components/ChartComponent.jsx
import React, { useMemo } from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';

const ChartComponent = ({ 
  title, 
  data = {}, 
  type = 'bar',
  height = 300,
  color = '#2196F3',
  showTrend = true,
  maxItems = 6
}) => {
  const theme = useTheme();
  
  const processedData = useMemo(() => {
    const entries = Object.entries(data);
    
    if (type === 'pie') {
      return entries.slice(0, maxItems);
    }
    
    // Sort by value for bar/line charts
    return entries
      .sort((a, b) => {
        const valA = typeof a[1] === 'number' ? a[1] : 0;
        const valB = typeof b[1] === 'number' ? b[1] : 0;
        return valB - valA;
      })
      .slice(0, maxItems);
  }, [data, type, maxItems]);

  const calculateTrend = useMemo(() => {
    const values = processedData.map(([, value]) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return Number.isNaN(num) ? 0 : num;
      }
      return 0;
    });
    
    if (values.length < 2) return null;
    
    const recent = values.slice(-2);
    const trend = ((recent[1] - recent[0]) / (recent[0] || 1)) * 100;
    return Number.isFinite(trend) ? trend : 0;
  }, [processedData]);

  const renderBarChart = useMemo(() => {
    if (processedData.length === 0) return null;
    
    const values = processedData.map(([, value]) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return Number.isNaN(num) ? 0 : num;
      }
      return 0;
    });
    const maxValue = Math.max(...values) || 1;
    
    return (
      <Box sx={{ height: height - 100, display: 'flex', alignItems: 'end', gap: 1, px: 2, pb: 2 }}>
        {processedData.map(([label, value]) => {
          const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
          const percentage = maxValue ? (numericValue / maxValue) * 100 : 0;
          
          return (
            <Box 
              key={label} 
              sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                height: '100%',
                position: 'relative'
              }}
            >
              <Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'end' }}>
                <Box
                  sx={{
                    height: `${percentage}%`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4,
                    width: '70%',
                    transition: 'height 0.3s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    }
                  }}
                />
              </Box>
              <Box sx={{ height: 40, display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textAlign: 'center', 
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%'
                  }}
                >
                  {label.length > 10 ? `${label.substring(0, 10)}...` : label}
                </Typography>
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 0.5, 
                  fontSize: '0.7rem', 
                  fontWeight: 500,
                  color: 'text.primary'
                }}
              >
                {numericValue.toLocaleString()}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  }, [processedData, height, color, theme.palette.primary.dark]);

  const renderLineChart = useMemo(() => {
    if (processedData.length === 0) return null;
    
    const values = processedData.map(([, value]) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return Number.isNaN(num) ? 0 : num;
      }
      return 0;
    });
    
    const maxValue = Math.max(...values) || 1;
    const minValue = Math.min(...values) || 0;
    
    return (
      <Box sx={{ height: height - 100, position: 'relative', px: 3, py: 2 }}>
        <svg width="100%" height="100%" viewBox={`0 0 400 ${height - 100}`}>
          {/* Grid lines */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`grid-${i}`}
              x1="10"
              x2="390"
              y1={((i + 1) / 5) * (height - 120) + 10}
              y2={((i + 1) / 5) * (height - 120) + 10}
              stroke="#e0e0e0"
              strokeWidth="0.5"
            />
          ))}
          
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={processedData.map((_, index) => 
              `${(index / (processedData.length - 1)) * 380 + 10},${(1 - (values[index] - minValue) / (maxValue - minValue || 1)) * (height - 140) + 30}`
            ).join(' ')}
          />
          
          {processedData.map(([label], index) => (
            <g key={label}>
              <circle
                cx={(index / (processedData.length - 1)) * 380 + 10}
                cy={(1 - (values[index] - minValue) / (maxValue - minValue || 1)) * (height - 140) + 30}
                r="4"
                fill={color}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={(index / (processedData.length - 1)) * 380 + 10}
                y={height - 80}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {label.length > 6 ? `${label.substring(0, 6)}...` : label}
              </text>
            </g>
          ))}
        </svg>
      </Box>
    );
  }, [processedData, height, color]);

  const renderPieChart = useMemo(() => {
    if (processedData.length === 0) return null;
    
    const total = processedData.reduce((sum, [, value]) => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      return sum + num;
    }, 0);
    
    const colors = [
      '#2196F3', '#4CAF50', '#FF9800', '#F44336', 
      '#9C27B0', '#00BCD4', '#FFC107', '#795548'
    ];
    
    // Calculate segments data without mutation
    const segments = processedData.reduce((acc, [label, value], index) => {
      const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      const percentage = (numericValue / total) * 100;
      const angle = (percentage / 100) * 360;
      
      if (percentage === 0) return acc;
      
      const startAngle = acc.currentAngle;
      const endAngle = startAngle + angle;
      
      acc.segments.push({
        label,
        numericValue,
        percentage,
        angle,
        startAngle,
        endAngle,
        index
      });
      
      acc.currentAngle = endAngle;
      
      return acc;
    }, { segments: [], currentAngle: 0 }).segments;
    
    return (
      <Box sx={{ height: height - 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="150" height="150" viewBox="0 0 100 100">
          {segments.map(({ label, percentage, startAngle, angle, index }) => {
            const largeArc = angle > 180 ? 1 : 0;
            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');
            
            return (
              <g key={label}>
                <path
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="#fff"
                  strokeWidth="0.5"
                />
                <text
                  x={50 + 45 * Math.cos(((startAngle + angle / 2) * Math.PI) / 180)}
                  y={50 + 45 * Math.sin(((startAngle + angle / 2) * Math.PI) / 180)}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#fff"
                  fontWeight="bold"
                >
                  {percentage.toFixed(0)}%
                </text>
              </g>
            );
          })}
          <circle cx="50" cy="50" r="15" fill="#fff" />
        </svg>
        
        {/* Legend */}
        <Box sx={{ ml: 2, maxWidth: 150 }}>
          {segments.slice(0, 4).map(({ label }, index) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: colors[index % colors.length],
                  borderRadius: 1,
                  mr: 1
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {label.length > 12 ? `${label.substring(0, 12)}...` : label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }, [processedData, height]);

  const chartIcon = {
    bar: <BarChartIcon fontSize="small" />,
    line: <LineChartIcon fontSize="small" />,
    pie: <PieChartIcon fontSize="small" />
  };

  const trend = calculateTrend;

  return (
    <Paper 
      sx={{ 
        p: 2, 
        height,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {chartIcon[type]}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {title}
          </Typography>
        </Box>
        
        {showTrend && trend !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trend > 0 ? (
              <TrendingUp fontSize="small" color="success" />
            ) : (
              <TrendingDown fontSize="small" color="error" />
            )}
            <Typography 
              variant="body2" 
              color={trend > 0 ? 'success.main' : 'error.main'}
              sx={{ fontWeight: 500 }}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </Typography>
          </Box>
        )}
      </Box>
      
      {processedData.length > 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {type === 'bar' && renderBarChart}
          {type === 'line' && renderLineChart}
          {type === 'pie' && renderPieChart}
        </Box>
      ) : (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            No data available
          </Typography>
          <Typography variant="caption">
            Process documents to see analytics
          </Typography>
        </Box>
      )}
      
      {processedData.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          Showing {processedData.length} of {Object.keys(data).length} items
        </Typography>
      )}
    </Paper>
  );
};

export default ChartComponent;