// src/app/features/ocr/components/upgrade/layout/KonvaLayoutVisualizer.jsx
import React, { useMemo } from 'react';
import { Line, Rect, Group, Text } from 'react-konva';

const KonvaLayoutVisualizer = ({ 
  layoutEngine, 
  stageScale = 1, 
  stagePosition = { x: 0, y: 0 },
  canvasWidth = 1200,
  canvasHeight = 800,
  isGridVisible = true,
  isGuidesVisible = true,
  isMarginsVisible = true,
  isSafeZoneVisible = false,
  isColumnLayoutVisible = false,
  showLabels = true,
  interactive = false
}) => {
  // Memoize all visual elements for performance
  const visualElements = useMemo(() => {
    if (!layoutEngine) return { elements: [], labels: [] };
    
    const data = layoutEngine.getRenderData();
    const elements = [];
    const labels = [];
    
    // Add grid lines
    if (isGridVisible && data.grid.enabled) {
      // Major grid lines
      data.grid.majorGridLines
        .filter(line => {
          if (line.type === 'vertical') {
            return line.position >= -100 && line.position <= canvasWidth + 100;
          } else {
            return line.position >= -100 && line.position <= canvasHeight + 100;
          }
        })
        .forEach((line) => {
          elements.push({
            type: 'line',
            key: `major-grid-${line.type}-${line.position}`,
            points: line.points,
            stroke: data.grid.majorLineColor || '#cccccc',
            strokeWidth: (data.grid.majorLineWidth || 1) / stageScale,
            opacity: data.grid.opacity * 0.8,
            lineCap: 'round'
          });
          
          // Add coordinate labels for major grid lines
          if (showLabels && stageScale >= 0.5) {
            if (line.type === 'vertical') {
              labels.push({
                type: 'text',
                x: line.position + 5,
                y: 10,
                text: `${line.position}px`,
                fontSize: 10 / stageScale,
                fill: data.grid.majorLineColor || '#cccccc',
                opacity: 0.7
              });
            } else {
              labels.push({
                type: 'text',
                x: 10,
                y: line.position + 5,
                text: `${line.position}px`,
                fontSize: 10 / stageScale,
                fill: data.grid.majorLineColor || '#cccccc',
                opacity: 0.7
              });
            }
          }
        });
      
      // Minor grid lines (limited for performance)
      data.grid.gridLines
        .filter((line, index) => {
          // Show every 5th minor line for performance
          if (index % 5 !== 0) return false;
          if (line.type === 'vertical') {
            return line.position >= -50 && line.position <= canvasWidth + 50;
          } else {
            return line.position >= -50 && line.position <= canvasHeight + 50;
          }
        })
        .forEach((line) => {
          elements.push({
            type: 'line',
            key: `grid-${line.type}-${line.position}`,
            points: line.points,
            stroke: data.grid.color || '#e0e0e0',
            strokeWidth: (data.grid.lineWidth || 0.5) / stageScale,
            opacity: data.grid.opacity * 0.5
          });
        });
    }
    
    // Add document margins and regions
    if (isMarginsVisible && data.document.regions) {
      const { content, safeZone, columns, margins } = data.document;
      
      // Content area
      if (content) {
        elements.push({
          type: 'rect',
          key: 'document-margins',
          x: content.x,
          y: content.y,
          width: content.width,
          height: content.height,
          stroke: '#3B82F6',
          strokeWidth: 1 / stageScale,
          dash: [4 / stageScale, 4 / stageScale],
          opacity: 0.2
        });
        
        // Content area label
        if (showLabels && stageScale >= 0.3) {
          labels.push({
            type: 'text',
            x: content.x + content.width / 2,
            y: content.y - 20 / stageScale,
            text: `Content Area (${content.width}×${content.height})`,
            fontSize: 12 / stageScale,
            fill: '#3B82F6',
            align: 'center',
            opacity: 0.6
          });
        }
      }
      
      // Safe zone
      if (isSafeZoneVisible && safeZone) {
        elements.push({
          type: 'rect',
          key: 'safe-zone',
          x: safeZone.x,
          y: safeZone.y,
          width: safeZone.width,
          height: safeZone.height,
          stroke: '#10B981',
          strokeWidth: 1 / stageScale,
          dash: [3 / stageScale, 3 / stageScale],
          opacity: 0.3
        });
      }
      
      // Columns
      if (isColumnLayoutVisible && columns && columns.length > 1) {
        columns.forEach((column, index) => {
          elements.push({
            type: 'rect',
            key: `column-${index}`,
            x: column.x,
            y: column.y,
            width: column.width,
            height: column.height,
            stroke: '#F59E0B',
            strokeWidth: 1 / stageScale,
            dash: [2 / stageScale, 2 / stageScale],
            opacity: 0.2
          });
        });
      }
      
      // Margin labels
      if (showLabels && margins && stageScale >= 0.5) {
        Object.entries(margins).forEach(([side, size]) => {
          if (size > 0) {
            let x, y, text;
            switch(side) {
              case 'top':
                x = canvasWidth / 2;
                y = size / 2;
                text = `${size}px`;
                break;
              case 'bottom':
                x = canvasWidth / 2;
                y = canvasHeight - size / 2;
                text = `${size}px`;
                break;
              case 'left':
                x = size / 2;
                y = canvasHeight / 2;
                text = `${size}px`;
                break;
              case 'right':
                x = canvasWidth - size / 2;
                y = canvasHeight / 2;
                text = `${size}px`;
                break;
              default:
                return;
            }
            
            labels.push({
              type: 'text',
              x,
              y,
              text,
              fontSize: 10 / stageScale,
              fill: '#6B7280',
              align: 'center',
              verticalAlign: 'middle',
              opacity: 0.5
            });
          }
        });
      }
    }
    
    // Add alignment guides
    if (isGuidesVisible && data.guides.enabled && data.guides.guides) {
      data.guides.guides.forEach((guide) => {
        const isCanvasGuide = guide.alignment?.includes('canvas');
        const isSmartGuide = guide.type?.includes('spacing');
        
        let stroke = guide.color || '#EF4444';
        let strokeWidth = 1.5 / stageScale;
        let dash = [4 / stageScale, 2 / stageScale];
        let opacity = 0.6;
        
        if (isCanvasGuide) {
          stroke = '#DC2626';
          strokeWidth = 2 / stageScale;
          dash = [8 / stageScale, 4 / stageScale];
          opacity = 0.8;
        } else if (isSmartGuide) {
          stroke = '#10B981';
          strokeWidth = 1.5 / stageScale;
          dash = [2 / stageScale, 2 / stageScale];
          opacity = 0.7;
        }
        
        elements.push({
          type: 'line',
          key: `guide-${guide.type}-${guide.position}-${guide.alignment || 'none'}`,
          points: guide.type === 'vertical'
            ? [guide.position, -1000, guide.position, canvasHeight + 1000]
            : [-1000, guide.position, canvasWidth + 1000, guide.position],
          stroke,
          strokeWidth,
          dash,
          opacity,
          lineCap: 'round'
        });
        
        // Guide labels
        if (showLabels && stageScale >= 0.7 && guide.alignment) {
          const labelText = guide.alignment.replace('-', ' ').replace('canvas ', '');
          if (guide.type === 'vertical') {
            labels.push({
              type: 'text',
              x: guide.position + 5 / stageScale,
              y: 15 / stageScale,
              text: labelText,
              fontSize: 9 / stageScale,
              fill: stroke,
              opacity: 0.8
            });
          } else {
            labels.push({
              type: 'text',
              x: 15 / stageScale,
              y: guide.position + 5 / stageScale,
              text: labelText,
              fontSize: 9 / stageScale,
              fill: stroke,
              opacity: 0.8
            });
          }
        }
      });
    }

    // Add center lines
    if (isGuidesVisible) {
      // Vertical center
      elements.push({
        type: 'line',
        key: 'center-vertical',
        points: [canvasWidth / 2, 0, canvasWidth / 2, canvasHeight],
        stroke: '#8B5CF6',
        strokeWidth: 1 / stageScale,
        dash: [8 / stageScale, 8 / stageScale],
        opacity: 0.4
      });
      
      // Horizontal center
      elements.push({
        type: 'line',
        key: 'center-horizontal',
        points: [0, canvasHeight / 2, canvasWidth, canvasHeight / 2],
        stroke: '#8B5CF6',
        strokeWidth: 1 / stageScale,
        dash: [8 / stageScale, 8 / stageScale],
        opacity: 0.4
      });
      
      // Center labels
      if (showLabels && stageScale >= 0.5) {
        labels.push({
          type: 'text',
          x: canvasWidth / 2 + 10 / stageScale,
          y: 10 / stageScale,
          text: 'Center',
          fontSize: 10 / stageScale,
          fill: '#8B5CF6',
          opacity: 0.6
        });
      }
    }
    
    return { elements, labels };
  }, [layoutEngine, canvasWidth, canvasHeight, stageScale, 
      isGridVisible, isGuidesVisible, isMarginsVisible, 
      isSafeZoneVisible, isColumnLayoutVisible, showLabels]);
      // Removed stagePosition.x and stagePosition.y - not needed in dependencies
  
  if (!layoutEngine || !visualElements.elements.length) return null;
  
  return (
    <Group
      listening={interactive}
      opacity={0.9}
    >
      {/* Render all visual elements */}
      {visualElements.elements.map(element => {
        const commonProps = {
          listening: false,
          scaleX: stageScale,
          scaleY: stageScale,
          x: stagePosition.x,
          y: stagePosition.y,
          opacity: element.opacity || 1,
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          dash: element.dash,
          lineCap: element.lineCap
        };
        
        if (element.type === 'line') {
          return (
            <Line
              key={element.key}
              {...commonProps}
              points={element.points}
            />
          );
        } else if (element.type === 'rect') {
          return (
            <Rect
              key={element.key}
              {...commonProps}
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
            />
          );
        }
        return null;
      })}
      
      {/* Render labels */}
      {visualElements.labels.map((label, index) => (
        <Text
          key={`label-${index}`}
          text={label.text}
          fontSize={label.fontSize}
          fill={label.fill}
          align={label.align || 'left'}
          verticalAlign={label.verticalAlign || 'top'}
          opacity={label.opacity || 1}
          listening={false}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x + (label.x || 0)}
          y={stagePosition.y + (label.y || 0)}
        />
      ))}
      
      {/* Canvas border */}
      <Rect
        key="canvas-border"
        width={canvasWidth}
        height={canvasHeight}
        stroke="#D1D5DB"
        strokeWidth={1 / stageScale}
        opacity={0.3}
        listening={false}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
      />
    </Group>
  );
};

// Default props
KonvaLayoutVisualizer.defaultProps = {
  isGridVisible: true,
  isGuidesVisible: true,
  isMarginsVisible: true,
  isSafeZoneVisible: false,
  isColumnLayoutVisible: false,
  showLabels: true,
  interactive: false
};

export default KonvaLayoutVisualizer;