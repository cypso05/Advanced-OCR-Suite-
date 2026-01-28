// src/app/features/ocr/utils/canvasUtils.js
export const calculateElementBounds = (element) => {
  switch (element.type) {
    case 'circle':
      return {
        x: element.x - element.radius,
        y: element.y - element.radius,
        width: element.radius * 2,
        height: element.radius * 2
      };
    case 'line':
    case 'arrow':
      if (element.points && element.points.length >= 4) {
        const minX = Math.min(element.points[0], element.points[2]);
        const maxX = Math.max(element.points[0], element.points[2]);
        const minY = Math.min(element.points[1], element.points[3]);
        const maxY = Math.max(element.points[1], element.points[3]);
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      }
      // fallthrough
    default:
      return {
        x: element.x || 0,
        y: element.y || 0,
        width: element.width || 0,
        height: element.height || 0
      };
  }
};

export const getElementCenter = (element) => {
  const bounds = calculateElementBounds(element);
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  };
};

export const calculateGroupBounds = (elements) => {
  if (!elements || elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(element => {
    const bounds = calculateElementBounds(element);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const isPointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  return inside;
};

export const snapToGrid = (position, gridSize, enabled = true) => {
  if (!enabled) return position;
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
};

export const generateSVG = (data) => {
  const { canvasSize, elements } = data;
  
  const svgElements = elements.map(element => {
    switch (element.type) {
      case 'rectangle':
        return `<rect 
          x="${element.x}" 
          y="${element.y}" 
          width="${element.width}" 
          height="${element.height}" 
          fill="${element.fill}" 
          stroke="${element.stroke || 'none'}" 
          stroke-width="${element.strokeWidth || 0}" 
          rx="${element.cornerRadius || 0}" 
          ry="${element.cornerRadius || 0}"
        />`;
        
      case 'circle':
        return `<circle 
          cx="${element.x}" 
          cy="${element.y}" 
          r="${element.radius}" 
          fill="${element.fill}" 
          stroke="${element.stroke || 'none'}" 
          stroke-width="${element.strokeWidth || 0}"
        />`;
        
      case 'text':
        return `<text 
          x="${element.x}" 
          y="${element.y}" 
          font-family="${element.fontFamily || 'Arial'}" 
          font-size="${element.fontSize || 12}" 
          fill="${element.fill || '#000000'}"
          font-weight="${element.bold ? 'bold' : 'normal'}"
          font-style="${element.italic ? 'italic' : 'normal'}"
          text-decoration="${element.underline ? 'underline' : 'none'}"
        >${(element.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
        
      case 'line':
        return `<line 
          x1="${element.points?.[0] || 0}" 
          y1="${element.points?.[1] || 0}" 
          x2="${element.points?.[2] || 100}" 
          y2="${element.points?.[3] || 0}" 
          stroke="${element.stroke || '#000000'}" 
          stroke-width="${element.strokeWidth || 2}"
          stroke-linecap="${element.lineCap || 'butt'}"
        />`;
        
      default:
        return '';
    }
  }).join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg 
  width="${canvasSize.width}" 
  height="${canvasSize.height}" 
  viewBox="0 0 ${canvasSize.width} ${canvasSize.height}"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${svgElements}
</svg>`;
};

export const getDistance = (point1, point2) => {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
};

export const getAngle = (point1, point2) => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x) * (180 / Math.PI);
};
export const applyLayoutConstraints = (
  element,
  canvasSize,
  options = {}
) => {
  if (!element || !canvasSize) return element;

  const {
    constrainPosition = true,
    constrainSize = true,
    minWidth = 1,
    minHeight = 1,
    minRadius = 1
  } = options;

  const { width: canvasWidth, height: canvasHeight } = canvasSize;

  let updated = { ...element };

  // ---------- SIZE CONSTRAINTS ----------
  if (constrainSize) {
    switch (element.type) {
      case 'rectangle':
      case 'text': {
        const maxWidth = canvasWidth - (element.x || 0);
        const maxHeight = canvasHeight - (element.y || 0);

        updated.width = Math.max(
          minWidth,
          Math.min(element.width || minWidth, maxWidth)
        );

        updated.height = Math.max(
          minHeight,
          Math.min(element.height || minHeight, maxHeight)
        );
        break;
      }

      case 'circle': {
        const maxRadiusX = Math.min(element.x, canvasWidth - element.x);
        const maxRadiusY = Math.min(element.y, canvasHeight - element.y);
        const maxRadius = Math.max(0, Math.min(maxRadiusX, maxRadiusY));

        updated.radius = Math.max(
          minRadius,
          Math.min(element.radius || minRadius, maxRadius)
        );
        break;
      }

      case 'line':
      case 'arrow':
        // Lines are constrained via position, not size
        break;
    }
  }

  // ---------- POSITION CONSTRAINTS ----------
  if (constrainPosition) {
    const bounds = calculateElementBounds(updated);

    let dx = 0;
    let dy = 0;

    if (bounds.x < 0) dx = -bounds.x;
    if (bounds.y < 0) dy = -bounds.y;

    if (bounds.x + bounds.width > canvasWidth) {
      dx = canvasWidth - (bounds.x + bounds.width);
    }
    if (bounds.y + bounds.height > canvasHeight) {
      dy = canvasHeight - (bounds.y + bounds.height);
    }

    switch (updated.type) {
      case 'circle':
        updated.x += dx;
        updated.y += dy;
        break;

      case 'line':
      case 'arrow':
        if (updated.points?.length >= 4) {
          updated.points = [
            updated.points[0] + dx,
            updated.points[1] + dy,
            updated.points[2] + dx,
            updated.points[3] + dy
          ];
        }
        break;

      default:
        updated.x = (updated.x || 0) + dx;
        updated.y = (updated.y || 0) + dy;
    }
  }

  return updated;
};
