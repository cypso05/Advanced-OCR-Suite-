// In documentEditor.js - UPDATE THE CONSTRUCTOR AND ADD EVENT METHODS
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { documentDecomposer } from './decomposer.js';

// Import the worker module URL - this is the Vite/Webpack way
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker using the imported URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class DocumentEditor {
  constructor(options = {}) {
    this.options = {
      dpi: 300,
      scale: 2.0,
      preserveLayout: true,
      extractText: true,
      extractGraphics: true,
      maxFileSize: 100 * 1024 * 1024,
      intelligentElementDetection: true,
      semanticStructure: true,
      canvasElement: null,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1
      },
      ...options
    };

    // ✅ FIXED: Event handling system - use arrays to store handlers
    this.eventHandlers = {
      elementSelected: [],
      elementClicked: [],
      elementDragged: [],
      elementDragCompleted: [],
      elementHovered: [],
      elementTransformed: [],
      viewportChanged: [],
      zoomChanged: [],
      panCompleted: [],
      selectionChanged: [],
      selectionCleared: [],
      selectionCompleted: [],
      canvasClicked: []
    };

    // ✅ ADD: Event system methods
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.emit = this.emit.bind(this);

    // Interactive properties
    this.isDragging = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.currentPan = { x: 0, y: 0 };
    this.currentZoom = 1.0;
    this.lastMousePos = { x: 0, y: 0 };
    this.hoveredElement = null;
    this.selectionRect = null;
    this.isSelecting = false;
    this.isPanning = false;
    this.draggingElement = null;
    this.dragElementOffset = { x: 0, y: 0 };
    this.selectedElementIds = [];

    // Viewport constraints
    this.MIN_ZOOM = 0.1;
    this.MAX_ZOOM = 10.0;
    this.ZOOM_STEP = 0.1;

    // Data management
    this.cache = new Map();
    this.elementRegistry = new Map();
    this.pageCache = new Map();
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false; // Start as false
    this.currentViewport = null;
    this.activePage = 1;
    this.currentRenderedPage = null;

    // Tesseract worker - will be initialized lazily when needed
    this.tesseractWorker = null;
    this.isTesseractInitialized = false;

    // Private initialization promise
    this._initializingPromise = null;

    console.log('📝 DocumentEditor created (not initialized yet)');
  }

  // ✅ ADD: Event system implementation
  on(eventName, handler) {
    if (!this.eventHandlers[eventName]) {
      console.warn(`Event "${eventName}" not supported`);
      return () => {}; // Return empty unsubscribe function
    }
    
    this.eventHandlers[eventName].push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.eventHandlers[eventName].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[eventName].splice(index, 1);
      }
    };
  }

  off(eventName, handler) {
    if (!this.eventHandlers[eventName]) return;
    
    const index = this.eventHandlers[eventName].indexOf(handler);
    if (index > -1) {
      this.eventHandlers[eventName].splice(index, 1);
    }
  }

  emit(eventName, data) {
    if (!this.eventHandlers[eventName]) {
      console.warn(`Cannot emit unknown event: "${eventName}"`);
      return;
    }
    
    // Call all handlers
    this.eventHandlers[eventName].forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in ${eventName} handler:`, error);
      }
    });
  }

  // ✅ ADD this method to check if we need to wait for initialization
  async ensureInitialized() {
    if (this.isInitialized) {
      return this;
    }
    
    // If we're in the process of initializing, wait for it
    if (this._initializingPromise) {
      return this._initializingPromise;
    }
    
    // Otherwise, initialize now
    this._initializingPromise = this.initialize();
    return this._initializingPromise;
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('DocumentEditor already initialized');
      return this;
    }

    try {
      console.log('🔄 Starting DocumentEditor initialization...');
      
      // Don't initialize Tesseract here - do it lazily when needed
      
      // Initialize Canvas context
      if (typeof document !== 'undefined' && this.options.canvasElement) {
        this.canvas = this.options.canvasElement;
        this.ctx = this.canvas.getContext('2d', {
          alpha: true,
          willReadFrequently: true
        });
        
        // Set canvas dimensions
        this.canvas.width = this.options.viewport.width;
        this.canvas.height = this.options.viewport.height;
        
        // Setup canvas event listeners
        this.setupCanvasEvents();
      }

      this.isInitialized = true;
      delete this._initializingPromise; // Clean up the promise
      
      console.log('✅ DocumentEditor initialized successfully');
      return this;

    } catch (error) {
      console.error('❌ Failed to initialize DocumentEditor:', error);
      delete this._initializingPromise;
      throw error;
    }
  }

  // Initialize Tesseract only when needed
  async initializeTesseractIfNeeded() {
    if (this.isTesseractInitialized && this.tesseractWorker) {
      return true;
    }

    try {
      console.log('Initializing Tesseract OCR engine...');
      
      // For Tesseract.js v4+, use this pattern WITHOUT passing functions
      this.tesseractWorker = await Tesseract.createWorker('eng', 1, {
        // Remove the logger function - it causes cloning errors
        corePath: 'https://unpkg.com/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
        workerPath: 'https://unpkg.com/tesseract.js@v5.0.0/dist/worker.min.js',
      });
      
      this.isTesseractInitialized = true;
      console.log('Tesseract OCR engine initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Tesseract OCR:', error);
      return false;
    }
  }


async performOCR(file) {
  try {
    // Initialize Tesseract only when needed
    await this.initializeTesseractIfNeeded();
    
    if (!this.tesseractWorker) {
      console.warn('Tesseract OCR not available, skipping OCR');
      return null;
    }

    const result = await this.tesseractWorker.recognize(file, 'eng', {
      // Remove function references that can't be cloned
      tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD
    });
    return result;
  } catch (error) {
    console.error('OCR error:', error);
    return null;
  }
}

  setupCanvasEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  // Mouse event handlers
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to document coordinates
    const docPos = this.screenToDocument(mouseX, mouseY);
    
    console.log('Mouse Down:', {
      screen: { x: mouseX, y: mouseY },
      document: docPos,
      button: e.button,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey
    });
    
    this.dragStartPos = { x: mouseX, y: mouseY };
    this.lastMousePos = { x: mouseX, y: mouseY };
    
    // Left click: Selection or panning
    if (e.button === 0) {
      // Check if we clicked on an element
      const clickedElement = this.hitTest(docPos.x, docPos.y);
      
      if (clickedElement) {
        // Element clicked - handle selection
        if (e.ctrlKey || e.shiftKey) {
          // Add to/remove from selection
          this.toggleElementSelection(clickedElement.id, e.shiftKey);
        } else {
          // Start dragging element
          this.isDragging = true;
          this.draggingElement = clickedElement;
          this.dragElementOffset = {
            x: docPos.x - clickedElement.x,
            y: docPos.y - clickedElement.y
          };
          // Single selection
          if (!this.selectedElementIds.includes(clickedElement.id)) {
            this.selectedElementIds = [clickedElement.id];
          }
        }
        this.emit('elementSelected', { elementId: clickedElement.id, multiSelect: e.ctrlKey || e.shiftKey });
        this.emit('elementClicked', {
          elementId: clickedElement.id,
          elementType: clickedElement.type,
          page: clickedElement.page,
          coordinates: { x: docPos.x, y: docPos.y },
          screenCoordinates: { x: mouseX, y: mouseY },
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey
        });
      } else {
        // Canvas clicked - start selection rectangle or panning
        if (e.ctrlKey || e.altKey) {
          // Ctrl/Alt + click = pan mode
          this.isDragging = true;
          this.isPanning = true;
          this.canvas.style.cursor = 'grabbing';
        } else {
          // Start rectangle selection
          this.isSelecting = true;
          this.selectionRect = {
            x: docPos.x,
            y: docPos.y,
            width: 0,
            height: 0
          };
        }
        // Clear selection if not Ctrl/Shift clicking
        if (!e.ctrlKey && !e.shiftKey) {
          this.selectedElementIds = [];
          this.emit('selectionCleared', {});
        }
        this.emit('canvasClicked', {
          coordinates: { x: docPos.x, y: docPos.y },
          page: this.activePage
        });
      }
    }
    
    // Prevent default for middle click (to avoid page scroll)
    if (e.button === 1) {
      e.preventDefault();
    }
    
    // Render to show selection changes immediately
    this.renderCurrentPage();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to document coordinates
    const docPos = this.screenToDocument(mouseX, mouseY);
    
    // Calculate movement delta
    const deltaX = mouseX - this.lastMousePos.x;
    const deltaY = mouseY - this.lastMousePos.y;
    
    this.lastMousePos = { x: mouseX, y: mouseY };
    
    // Hover detection
    const hoveredElement = this.hitTest(docPos.x, docPos.y);
    if (hoveredElement !== this.hoveredElement) {
      this.hoveredElement = hoveredElement;
      this.canvas.style.cursor = hoveredElement ? 'move' : this.isPanning ? 'grabbing' : 'default';
      this.emit('elementHovered', { 
        elementId: hoveredElement?.id || null,
        elementType: hoveredElement?.type
      });
      
      // Visual feedback for hover
      if (this.ctx && hoveredElement) {
        this.renderCurrentPage();
      }
    }
    
    // Handle dragging (elements or panning)
    if (this.isDragging) {
      if (this.isPanning) {
        // Pan the viewport
        this.currentPan.x += deltaX;
        this.currentPan.y += deltaY;
        
        // Clamp panning to reasonable limits
        const maxPan = this.canvas.width * 2;
        this.currentPan.x = Math.max(-maxPan, Math.min(maxPan, this.currentPan.x));
        this.currentPan.y = Math.max(-maxPan, Math.min(maxPan, this.currentPan.y));
        
        this.emit('viewportChanged', {
          pan: this.currentPan,
          zoom: this.currentZoom
        });
      } else if (this.draggingElement) {
        // Drag element
        const newX = docPos.x - this.dragElementOffset.x;
        const newY = docPos.y - this.dragElementOffset.y;
        
        // Update element position
        this.draggingElement.x = newX;
        this.draggingElement.y = newY;
        
        // Update element in registry
        this.elementRegistry.set(this.draggingElement.id, this.draggingElement);
        
        this.emit('elementDragged', {
          elementId: this.draggingElement.id,
          newPosition: { x: newX, y: newY }
        });
      }
      
      // Continuous rendering during drag
      this.renderCurrentPage();
    }
    
    // Handle selection rectangle
    if (this.isSelecting && this.selectionRect) {
      this.selectionRect.width = docPos.x - this.selectionRect.x;
      this.selectionRect.height = docPos.y - this.selectionRect.y;
      
      // Select elements within rectangle
      const selected = this.getElementsInRect(this.selectionRect);
      this.selectedElementIds = selected.map(el => el.id);
      
      // Visual feedback for selection rectangle
      this.renderCurrentPage();
    }
    
    // Debug info (optional - can be removed in production)
    if (this.hoveredElement || this.isDragging || this.isSelecting) {
      console.log('Mouse Move:', {
        screen: { x: mouseX, y: mouseY },
        document: docPos,
        delta: { x: deltaX, y: deltaY },
        dragging: this.isDragging ? (this.isPanning ? 'panning' : 'element') : false,
        selecting: this.isSelecting,
        hovered: this.hoveredElement?.id
      });
    }
  }

  handleMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const docPos = this.screenToDocument(mouseX, mouseY);
    
    console.log('Mouse Up:', {
      screen: { x: mouseX, y: mouseY },
      document: docPos,
      button: e.button,
      dragDistance: this.calculateDragDistance(mouseX, mouseY)
    });
    
    // Handle selection finalization
    if (this.isSelecting && this.selectionRect) {
      const elementsInRect = this.getElementsInRect(this.selectionRect);
      this.selectedElementIds = elementsInRect.map(el => el.id);
      
      this.emit('selectionCompleted', {
        elementIds: this.selectedElementIds,
        selectionRect: { ...this.selectionRect }
      });
      
      this.selectionRect = null;
    }
    
    // Handle element drag completion
    if (this.draggingElement) {
      this.emit('elementDragCompleted', {
        elementId: this.draggingElement.id,
        finalPosition: { x: this.draggingElement.x, y: this.draggingElement.y }
      });
      this.draggingElement = null;
      this.dragElementOffset = { x: 0, y: 0 };
    }
    
    // Handle pan completion
    if (this.isPanning) {
      this.emit('panCompleted', { pan: { ...this.currentPan } });
      this.isPanning = false;
      this.canvas.style.cursor = this.hoveredElement ? 'move' : 'default';
    }
    
    // Reset states
    this.isDragging = false;
    this.isSelecting = false;
    
    // Final render
    this.renderCurrentPage();
  }

  handleWheel(e) {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom direction based on deltaY
    const zoomDirection = e.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1 + (zoomDirection * this.ZOOM_STEP);
    const newZoom = this.currentZoom * zoomFactor;
    
    // Apply zoom constraints
    const clampedZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newZoom));
    
    if (clampedZoom !== this.currentZoom) {
      // Calculate zoom point in document coordinates
      const zoomPoint = this.screenToDocument(mouseX, mouseY);
      
      // Store old zoom for calculation
      const oldZoom = this.currentZoom;
      this.currentZoom = clampedZoom;
      
      // Adjust pan to zoom around mouse position
      this.currentPan.x = mouseX - (zoomPoint.x * clampedZoom);
      this.currentPan.y = mouseY - (zoomPoint.y * clampedZoom);
      
      console.log('Zoom:', {
        deltaY: e.deltaY,
        direction: zoomDirection,
        oldZoom: oldZoom,
        newZoom: clampedZoom,
        zoomPoint: zoomPoint,
        ctrlKey: e.ctrlKey,
        pan: this.currentPan
      });
      
      this.emit('zoomChanged', {
        zoom: clampedZoom,
        zoomPoint: zoomPoint,
        pan: this.currentPan
      });
      
      // Re-render with new zoom
      this.renderCurrentPage();
    }
  }

  // Touch event handlers
  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      // Simulate mouse down
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey
      });
      this.handleMouseDown(mouseEvent);
    } else if (e.touches.length === 2) {
      // Pinch zoom handling
      this.touchStartDistance = this.getTouchDistance(e.touches);
      this.touchStartZoom = this.currentZoom;
    }
    e.preventDefault();
  }

  handleTouchMove(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      // Simulate mouse move
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMouseMove(mouseEvent);
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      const currentDistance = this.getTouchDistance(e.touches);
      if (this.touchStartDistance) {
        const scale = currentDistance / this.touchStartDistance;
        const newZoom = this.touchStartZoom * scale;
        const clampedZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newZoom));
        
        if (clampedZoom !== this.currentZoom) {
          this.currentZoom = clampedZoom;
          this.emit('zoomChanged', { zoom: clampedZoom, pan: this.currentPan });
          this.renderCurrentPage();
        }
      }
    }
    e.preventDefault();
  }

  handleTouchEnd(e) {
    if (e.touches.length === 0) {
      // Simulate mouse up
      const mouseEvent = new MouseEvent('mouseup', { button: 0 });
      this.handleMouseUp(mouseEvent);
      this.touchStartDistance = null;
      this.touchStartZoom = null;
    }
    e.preventDefault();
  }

  // Helper methods
  getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  screenToDocument(screenX, screenY) {
    const docX = (screenX - this.currentPan.x) / this.currentZoom;
    const docY = (screenY - this.currentPan.y) / this.currentZoom;
    return { x: docX, y: docY };
  }

  documentToScreen(docX, docY) {
    const screenX = (docX * this.currentZoom) + this.currentPan.x;
    const screenY = (docY * this.currentZoom) + this.currentPan.y;
    return { x: screenX, y: screenY };
  }

  calculateDragDistance(currentX, currentY) {
    const dx = currentX - this.dragStartPos.x;
    const dy = currentY - this.dragStartPos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  hitTest(x, y) {
    const pageData = this.pageCache.get(this.activePage);
    if (!pageData || !pageData.elements) return null;
    
    // Check in reverse render order (top-most elements first)
    for (let i = pageData.elements.length - 1; i >= 0; i--) {
      const element = pageData.elements[i];
      if (this.isPointInElement(x, y, element)) {
        return element;
      }
    }
    return null;
  }

  isPointInElement(x, y, element) {
    const padding = 5 / this.currentZoom;
    return x >= element.x - padding &&
           x <= element.x + (element.width || 0) + padding &&
           y >= element.y - padding &&
           y <= element.y + (element.height || 0) + padding;
  }

  toggleElementSelection(elementId, isShiftKey) {
    const index = this.selectedElementIds.indexOf(elementId);
    
    if (index > -1) {
      if (isShiftKey) {
        this.selectedElementIds.splice(index, 1);
      }
    } else {
      if (isShiftKey) {
        this.selectedElementIds.push(elementId);
      } else {
        this.selectedElementIds = [elementId];
      }
    }
    this.emit('selectionChanged', { selectedElementIds: this.selectedElementIds });
  }

  getElementsInRect(rect) {
    const pageData = this.pageCache.get(this.activePage);
    if (!pageData || !pageData.elements) return [];
    
    return pageData.elements.filter(element => {
      const elementRight = element.x + (element.width || 0);
      const elementBottom = element.y + (element.height || 0);
      const rectRight = rect.x + rect.width;
      const rectBottom = rect.y + rect.height;
      
      const selectionLeft = Math.min(rect.x, rectRight);
      const selectionRight = Math.max(rect.x, rectRight);
      const selectionTop = Math.min(rect.y, rectBottom);
      const selectionBottom = Math.max(rect.y, rectBottom);
      
      return element.x < selectionRight &&
             elementRight > selectionLeft &&
             element.y < selectionBottom &&
             elementBottom > selectionTop;
    });
  }

  // Rendering methods
  renderCurrentPage() {
    if (!this.ctx || !this.canvas) return;
    
    const pageData = this.pageCache.get(this.activePage);
    if (!pageData) return;
    
    this.currentRenderedPage = pageData;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply transformations for zoom and pan
    this.ctx.save();
    this.ctx.translate(this.currentPan.x, this.currentPan.y);
    this.ctx.scale(this.currentZoom, this.currentZoom);
    
    // Draw page background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, pageData.width, pageData.height);
    
    // Render elements
    this.renderElements(pageData.elements);
    
    // Draw selection rectangle if active
    if (this.isSelecting && this.selectionRect) {
      this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)';
      this.ctx.fillStyle = 'rgba(33, 150, 243, 0.1)';
      this.ctx.lineWidth = 1 / this.currentZoom;
      this.ctx.setLineDash([4 / this.currentZoom, 2 / this.currentZoom]);
      
      this.ctx.beginPath();
      this.ctx.rect(this.selectionRect.x, this.selectionRect.y, 
                    this.selectionRect.width, this.selectionRect.height);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
    
    // Draw element selections
    if (this.selectedElementIds.length > 0) {
      pageData.elements.forEach(element => {
        if (this.selectedElementIds.includes(element.id)) {
          this.drawSelectionBox(element);
        }
      });
    }
    
    // Draw hover effect
    if (this.hoveredElement && !this.selectedElementIds.includes(this.hoveredElement.id)) {
      this.drawHoverEffect(this.hoveredElement);
    }
    
    this.ctx.restore();
  }

  renderElements(elements) {
    elements.forEach(element => {
      this.renderElement(element);
    });
  }

  renderElement(element) {
    switch (element.type) {
      case 'text':
        this.renderTextElement(element);
        break;
      case 'image':
        this.renderImageElement(element);
        break;
      default:
        console.warn('Unknown element type:', element.type);
    }
  }

  renderTextElement(element) {
    this.ctx.save();
    
    // Set font properties
    const fontSize = element.fontSize || 12;
    const fontFamily = element.fontFamily || 'sans-serif';
    const fontWeight = element.fontWeight || 'normal';
    const fontStyle = element.fontStyle || 'normal';
    
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = element.fill || '#000000';
    this.ctx.textBaseline = 'top';
    
    // Handle text alignment
    if (element.textAlign) {
      this.ctx.textAlign = element.textAlign;
    }
    
    // Draw text
    const textX = element.textAlign === 'right' ? element.x + element.width : 
                  element.textAlign === 'center' ? element.x + (element.width / 2) : 
                  element.x;
    
    this.ctx.fillText(element.text, textX, element.y, element.width);
    this.ctx.restore();
  }

  async renderImageElement(element) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(
          img,
          element.x,
          element.y,
          element.width,
          element.height
        );
        resolve();
      };
      img.onerror = () => {
        console.error('Failed to load image:', element.id);
        // Draw placeholder
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(element.x, element.y, element.width, element.height);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.strokeRect(element.x, element.y, element.width, element.height);
        resolve();
      };
      img.src = element.src || '';
    });
  }

  drawSelectionBox(element) {
    const padding = 4 / this.currentZoom;
    const cornerSize = 6 / this.currentZoom;
    
    this.ctx.strokeStyle = '#2196f3';
    this.ctx.fillStyle = '#2196f3';
    this.ctx.lineWidth = 1 / this.currentZoom;
    this.ctx.setLineDash([5 / this.currentZoom, 3 / this.currentZoom]);
    
    // Main selection rectangle
    this.ctx.strokeRect(
      element.x - padding,
      element.y - padding,
      (element.width || 0) + (padding * 2),
      (element.height || 0) + (padding * 2)
    );
    
    this.ctx.setLineDash([]);
    
    // Selection corners
    const corners = [
      { x: element.x - padding, y: element.y - padding },
      { x: element.x + (element.width || 0) + padding, y: element.y - padding },
      { x: element.x - padding, y: element.y + (element.height || 0) + padding },
      { x: element.x + (element.width || 0) + padding, y: element.y + (element.height || 0) + padding }
    ];
    
    corners.forEach(corner => {
      this.ctx.fillRect(
        corner.x - cornerSize/2,
        corner.y - cornerSize/2,
        cornerSize,
        cornerSize
      );
    });
  }

  drawHoverEffect(element) {
    this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.3)';
    this.ctx.lineWidth = 2 / this.currentZoom;
    
    this.ctx.strokeRect(
      element.x - 2,
      element.y - 2,
      (element.width || 0) + 4,
      (element.height || 0) + 4
    );
  }

// In documentEditor.js - UPDATE processDocument method to integrate decomposer
// In documentEditor.js - UPDATE processDocument method to integrate decomposer
async processDocument(file, options = {}) {
  // ✅ ADD THIS: Wait for initialization if needed
  if (!this.isInitialized) {
    await this.ensureInitialized();
  }
  
  // ✅ ADD THIS: Initialize Tesseract only if needed for OCR
  if (options.ocr || this.options.extractText) {
    await this.initializeTesseractIfNeeded();
  }
  
  const fileType = this.getFileType(file);
  const processOptions = { ...this.options, ...options };
  
  console.log(`🔄 Processing ${fileType} document:`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    detectedType: fileType,
    options: processOptions,
    useDecomposer: processOptions.useDecomposer !== false
  });
  
  let result;
  
  try {
    // =============================================
    // STEP 1: TRY INTELLIGENT DECOMPOSITION FIRST
    // =============================================
    if (processOptions.useDecomposer !== false) {
      try {
        console.log('🔍 Attempting intelligent decomposition...');
        
        // Use the decomposer for advanced element extraction
        result = await documentDecomposer.decompose(file, {
          // Pass decomposer-specific options
          detectShapes: processOptions.detectShapes !== false,
          extractGraphics: processOptions.extractGraphics !== false,
          textRegionDetection: processOptions.textRegionDetection !== false,
          ocrConfidenceThreshold: processOptions.ocrConfidenceThreshold || 0.6,
          
          // Pass through existing options
          extractText: processOptions.extractText !== false,
          scale: processOptions.scale || 2.0,
          processAllPages: processOptions.processAllPages || false,
          pageRange: processOptions.pageRange,
          maxImageSize: processOptions.maxImageSize || 4096,
          
          // Additional options for better results
          preserveLayout: processOptions.preserveLayout !== false,
          semanticStructure: processOptions.semanticStructure !== false
        });
        
        // Check if decomposition was successful
        const totalElements = result.pages?.reduce((sum, page) => sum + (page.elements?.length || 0), 0) || 0;
        
        if (totalElements > 0) {
          console.log(`✅ Intelligent decomposition successful: ${totalElements} elements extracted`);
          result.metadata = {
            ...result.metadata,
            processingMethod: 'intelligent_decomposition',
            decomposerVersion: '1.0',
            elementsExtracted: totalElements,
            decomposerSuccess: true
          };
          
          // ✅ IMPORTANT: Preserve all existing metadata from your original processing
          if (result.type === 'pdf') {
            result.metadata = {
              ...result.metadata,
              isScannedPDF: totalElements === 0,
              processAllPages: processOptions.processAllPages,
              processedAllPages: processOptions.processAllPages ? 'all' : 'first_only'
            };
          }
          
        } else {
          // Decomposition returned no elements, fallback to original processing
          console.warn('⚠️ Decomposition returned no elements, falling back to original processing...');
          result = null;
        }
        
      } catch (decomposerError) {
        console.warn('❌ Intelligent decomposition failed, using fallback:', decomposerError.message);
        result = null; // Reset to trigger fallback
      }
    }
    
    // =============================================
    // STEP 2: ORIGINAL PROCESSING (YOUR EXISTING CODE)
    // =============================================
    if (!result) {
      console.log('🔄 Using original processing logic...');
      
      if (fileType === 'pdf') {
        // Call your existing processPDF method
        result = await this.processPDF(file, processOptions);
        
        // ✅ YOUR EXISTING FALLBACK LOGIC FOR SCANNED PDFS
        const totalElements = result.pages?.reduce((sum, page) => sum + (page.elements?.length || 0), 0) || 0;
        
        if (totalElements === 0) {
          console.log('⚠️ No elements extracted from PDF. This appears to be a scanned PDF.');
          console.log('Attempting canvas rendering fallback...');
          
          const canvasResult = await this.processScannedPDFWithCanvas(file, {
            ...processOptions,
            scale: 1.0,
            processAllPages: processOptions.processAllPages || false,
            pageRange: processOptions.pageRange
          });
          
          if (canvasResult) {
            result = canvasResult;
            const canvasElements = result.pages?.reduce((sum, p) => sum + (p.elements?.length || 0), 0) || 0;
            console.log(`✅ Canvas fallback extracted ${canvasElements} elements from ${result.pages?.length || 0} pages`);
          } else {
            console.warn('Canvas fallback failed.');
          }
        } else {
          console.log(`✅ Standard PDF processing successful: ${totalElements} elements from ${result.pages?.length || 0} pages`);
        }
        
      } else if (fileType === 'image') {
        // Call your existing processImage method
        result = await this.processImage(file, processOptions);
      } else if (fileType === 'text') {
        // Call your existing processTextFile method
        result = await this.processTextFile(file, processOptions);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      // Add fallback metadata
      if (result.metadata) {
        result.metadata.processingMethod = result.metadata.processingMethod || 'original_processing';
        result.metadata.fallbackUsed = true;
        result.metadata.decomposerUsed = false;
      }
    }
    
    console.log(`✅ ${fileType.toUpperCase()} processing complete:`, {
      pages: result.pages?.length || 0,
      elements: result.pages?.reduce((sum, page) => sum + (page.elements?.length || 0), 0) || 0,
      type: result.type,
      method: result.metadata?.processingMethod || 'unknown',
      decomposerSuccess: result.metadata?.decomposerSuccess || false
    });
    
  } catch (error) {
    console.error(`❌ ${fileType.toUpperCase()} processing error:`, error);
    
    // =============================================
    // STEP 3: EMERGENCY STATIC IMAGE FALLBACK (YOUR EXISTING)
    // =============================================
    // This is where your handleSimpleFileUpload fallback kicks in from PDFEditor.jsx
    // Since you already have that in your PDFEditor, we don't need to duplicate it here
    // Just re-throw so the PDFEditor can handle its fallback
    throw error;
  }
  
  // Store all pages in cache (YOUR EXISTING CODE)
  if (result && result.pages) {
    result.pages.forEach((page, index) => {
      this.pageCache.set(index + 1, page);
    });
    
    // Set active page and render (YOUR EXISTING CODE)
    this.activePage = 1;
    this.renderCurrentPage();
  }
  
  return result;
}

async processTextFile(file, options = {}) {
  try {
    console.log('📝 Processing text file:', file.name);
    
    const text = await file.text();
    
    // Extract options with defaults
    const {
      maxLength = 5000,
      position = { x: 50, y: 50 },
      dimensions = { width: 700, height: 500 },
      styling = { fontSize: 12, fontFamily: 'monospace', fill: '#000000' },
      editable = true,
      draggable = true,
      viewport = {
        width: 800,
        height: 600,
        scale: 1,
        rotation: 0
      },
      includeMetadata = true
    } = options;

    const pageData = {
      pageNumber: 1,
      width: viewport.width,
      height: viewport.height,
      viewport: viewport,
      elements: [],
      vectorPaths: []
    };

    // Process text with options
    const shouldTruncate = text.length > maxLength;
    const displayText = shouldTruncate 
      ? text.substring(0, maxLength) + '...'
      : text;

    // Create text element with options
    const textElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: displayText,
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height,
      fontSize: styling.fontSize,
      fontFamily: styling.fontFamily,
      fill: styling.fill,
      editable: editable,
      draggable: draggable,
      page: 1,
      metadata: includeMetadata ? {
        originalLength: text.length,
        truncated: shouldTruncate,
        maxLength: maxLength,
        viewport: viewport,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
        processingOptions: options
      } : undefined
    };

    pageData.elements.push(textElement);
    
    // Only set if registry exists (optional chaining for safety)
    if (this.elementRegistry) {
      this.elementRegistry.set(textElement.id, textElement);
    }

    const result = {
      type: 'text',
      name: file.name,
      pages: [pageData],
      totalPages: 1,
      metadata: includeMetadata ? {
        processingMethod: 'direct_text',
        isText: true,
        elementsExtracted: pageData.elements.length,
        processingTime: new Date().toISOString(),
        fileSize: file.size,
        textLength: text.length,
        processedTextLength: displayText.length,
        optionsUsed: options
      } : undefined
    };

    // Clean up undefined metadata if needed
    if (!includeMetadata) {
      delete result.metadata;
      if (textElement.metadata === undefined) {
        delete textElement.metadata;
      }
    }

    return result;

  } catch (error) {
    console.error('Text file processing error:', error);
    throw new Error(`Failed to process text file "${file?.name}": ${error.message}`);
  }
}

async processScannedPDF(file, options = {}) {
  try {
    console.log('Processing scanned PDF with OCR fallback...', options);
    
    // Default options
    const defaultOptions = {
      scale: 2.0,
      language: 'eng',
      ocrEnabled: true,
      confidenceThreshold: 0.7,
      ...options
    };
    
    // Use the same conversion logic from your imageProcessing.js
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0
    }).promise;
    
    const pages = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: defaultOptions.scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Set white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      const pageData = {
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        viewport: viewport,
        elements: [],
        vectorPaths: []
      };

      // Only perform OCR if enabled
      if (defaultOptions.ocrEnabled) {
        // Convert canvas to blob for OCR
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/png', 1.0);
        });
        
        // Perform OCR on the page image
        const ocrResult = await this.performOCR(blob, {
          language: defaultOptions.language,
          ...defaultOptions.ocrOptions
        });
        
        // Add OCR text as elements
        if (ocrResult && ocrResult.data && ocrResult.data.words) {
          ocrResult.data.words.forEach((word, index) => {
            // Apply confidence threshold if set
            if (word.confidence && word.confidence < defaultOptions.confidenceThreshold) {
              return; // Skip low confidence words
            }
            
            const textElement = {
              id: `ocr-text-${i}-${index}`,
              type: 'text',
              text: word.text,
              x: word.bbox.x0 || 0,
              y: word.bbox.y0 || 0,
              width: (word.bbox.x1 - word.bbox.x0) || 100,
              height: (word.bbox.y1 - word.bbox.y0) || 20,
              fontSize: 12,
              fontFamily: 'sans-serif',
              fill: '#000000',
              editable: true,
              page: i,
              metadata: {
                confidence: word.confidence || 0,
                source: 'ocr',
                viewport: viewport
              }
            };
            
            pageData.elements.push(textElement);
          });
          
          console.log(`Page ${i}: Extracted ${ocrResult.data.words.length} words via OCR`);
        }
      }

      pages.push(pageData);
    }

    return {
      type: 'pdf',
      name: file.name,
      pages: pages,
      totalPages: pdf.numPages,
      metadata: {
        processingMethod: 'ocr_fallback',
        isScannedPDF: true,
        optionsUsed: defaultOptions
      }
    };
    
  } catch (error) {
    console.error('Scanned PDF processing error:', error);
    return null;
  }
}

// In documentEditor.js - UPDATE processPDF method to respect processAllPages
async processPDF(file, options) {
  try {
    console.log('🔍 Starting PDF processing for:', file.name);
    console.log('PDF processing options:', options);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength); // Fixed: byteLength not byteSize
    
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@latest/cmaps/',
      cMapPacked: true,
      enableXfa: true
    });
    
    const pdf = await loadingTask.promise;
    console.log(`📄 PDF loaded: ${pdf.numPages} pages`);
    
    const pages = [];
    
    // ✅ FIX: Determine how many pages to process
    const totalPages = pdf.numPages;
    const processAllPages = options.processAllPages || false;
    const maxPagesToProcess = processAllPages ? totalPages : Math.min(1, totalPages);
    
    console.log(`Will process ${maxPagesToProcess} out of ${totalPages} pages (processAllPages: ${processAllPages})`);
    
    for (let i = 1; i <= maxPagesToProcess; i++) {
      console.log(`\n📑 Processing page ${i}/${maxPagesToProcess}...`);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ 
        scale: options.scale || 2.0,
        rotation: page.rotate || 0
      });

      console.log(`Page ${i} viewport: ${viewport.width}x${viewport.height}`);
      
      const pageData = {
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        viewport: viewport,
        elements: [],
        vectorPaths: [],
        metadata: {
          rotation: page.rotate || 0,
          userUnit: page.userUnit || 1.0
        }
      };

      // Extract text content
      if (options.extractText) {
        console.log(`Extracting text from page ${i}...`);
        try {
          const textContent = await page.getTextContent();
          console.log(`Raw text items found: ${textContent.items.length}`);
          
          // DEBUG: Show first few text items
          if (textContent.items.length > 0) {
            console.log('Sample text items (first 5):');
            textContent.items.slice(0, 5).forEach((item, idx) => {
              console.log(`  ${idx + 1}. "${item.str}" at (${item.transform?.[4] || 0}, ${item.transform?.[5] || 0})`);
            });
          }
          
          const textElements = this.extractTextElements(textContent, page, viewport);
          console.log(`Text elements created: ${textElements.length}`);
          pageData.elements.push(...textElements);
          
        } catch (textError) {
          console.error(`Failed to extract text from page ${i}:`, textError);
        }
      }

      // Extract images
      if (options.extractGraphics) {
        console.log(`Extracting images from page ${i}...`);
        try {
          const images = await this.extractImages(page, viewport);
          console.log(`Images found: ${images.length}`);
          pageData.elements.push(...images);
        } catch (imageError) {
          console.error(`Failed to extract images from page ${i}:`, imageError);
        }
      }

      console.log(`Page ${i} total elements: ${pageData.elements.length}`);
      pages.push(pageData);
      this.pageCache.set(i, pageData);
    }

    const totalElements = pages.reduce((sum, page) => sum + page.elements.length, 0);
    console.log(`\n📊 PDF processing complete:`);
    console.log(`Total pages: ${pages.length}`);
    console.log(`Total elements extracted: ${totalElements}`);
    console.log(`Page breakdown:`);
    pages.forEach((page, idx) => {
      console.log(`  Page ${idx + 1}: ${page.elements.length} elements`);
    });

    const result = {
      type: 'pdf',
      name: file.name,
      pages: pages,
      totalPages: pdf.numPages,
      processedPages: pages.length,
      metadata: {
        author: pdf.pdfInfo?.Author || '',
        title: pdf.pdfInfo?.Title || file.name,
        creationDate: pdf.pdfInfo?.CreationDate || '',
        producer: pdf.pdfInfo?.Producer || '',
        version: pdf.pdfInfo?.PDFFormatVersion || '',
        elementsExtracted: totalElements,
        isScannedPDF: totalElements === 0,
        processAllPages: processAllPages,
        processedAllPages: processAllPages ? 'all' : 'first_only'
      }
    };

    return result;

  } catch (error) {
    console.error('❌ PDF processing error:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

  extractTextElements(textContent, page, viewport) {
  const textElements = [];
  
  console.log(`Raw text items count: ${textContent.items.length}`);
  
  if (textContent.items.length === 0) {
    console.log('No text items found in PDF. This might be a scanned PDF (image-based).');
    return textElements;
  }
  
  let currentParagraph = [];
  let lastY = null;
  const PARAGRAPH_THRESHOLD = viewport.height * 0.02;
  
  console.log(`Viewport height: ${viewport.height}, Paragraph threshold: ${PARAGRAPH_THRESHOLD}`);
  
  textContent.items.forEach((item, index) => {
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4] || 0;
    const y = viewport.height - (transform[5] || 0);
    const fontSize = Math.abs(transform[3]) || 12;
    
    // DEBUG: Log first few items
    if (index < 5) {
      console.log(`Text item ${index}: "${item.str}" at (${x}, ${y}), fontSize: ${fontSize}`);
    }
    
    if (lastY !== null && Math.abs(y - lastY) > PARAGRAPH_THRESHOLD) {
      if (currentParagraph.length > 0) {
        this.createParagraphElement(currentParagraph, page, viewport, textElements);
        currentParagraph = [];
      }
    }
    
    currentParagraph.push({
      ...item,
      x, y, fontSize,
      index,
      viewport: { ...viewport }
    });
    
    lastY = y;
  });
  
  if (currentParagraph.length > 0) {
    this.createParagraphElement(currentParagraph, page, viewport, textElements);
  }
  
  console.log(`Created ${textElements.length} text elements from ${textContent.items.length} raw items`);
  return textElements;
}

  createParagraphElement(items, page, viewport, textElements) {
    const minX = Math.min(...items.map(i => i.x));
    const maxX = Math.max(...items.map(i => i.x + (i.width || i.fontSize * i.str.length * 0.5)));
    const minY = Math.min(...items.map(i => i.y));
    const maxY = Math.max(...items.map(i => i.y + i.fontSize));
    
    const paragraphText = items.map(i => i.str).join(' ');
    const dominantStyle = this.getDominantStyle(items);
    
    const paragraphElement = {
      id: `paragraph-${page.pageNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      subtype: 'paragraph',
      text: paragraphText,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      fontSize: dominantStyle.fontSize,
      fontFamily: dominantStyle.fontFamily || 'sans-serif',
      fontWeight: dominantStyle.fontWeight,
      fontStyle: dominantStyle.fontStyle,
      lineHeight: 1.5,
      textAlign: this.detectTextAlignment(items),
      fill: '#000000',
      editable: true,
      draggable: true,
      resizable: true,
      rotatable: true,
      page: page.pageNumber,
      metadata: {
        characterCount: paragraphText.length,
        wordCount: paragraphText.split(/\s+/).length,
        confidence: 1.0,
        originalItems: items.map(item => ({
          text: item.str,
          x: item.x,
          y: item.y,
          fontSize: item.fontSize
        })),
        semanticRole: this.detectSemanticRole(items, viewport),
        viewport: { ...viewport }
      }
    };
    
    textElements.push(paragraphElement);
    this.elementRegistry.set(paragraphElement.id, paragraphElement);
  }

  getDominantStyle(items) {
    const styleCount = {};
    items.forEach(item => {
      const style = `${item.fontSize}-${item.fontFamily || 'sans'}-${item.fontWeight || 'normal'}`;
      styleCount[style] = (styleCount[style] || 0) + 1;
    });
    
    const dominantStyle = Object.keys(styleCount).reduce((a, b) => 
      styleCount[a] > styleCount[b] ? a : b
    );
    
    const [fontSize, fontFamily, fontWeight] = dominantStyle.split('-');
    return { fontSize: parseFloat(fontSize), fontFamily, fontWeight };
  }

  detectTextAlignment(items) {
    if (items.length === 0) return 'left';
    
    const firstX = items[0].x;
    const lastX = items[items.length - 1].x;
    const avgX = items.reduce((sum, item) => sum + item.x, 0) / items.length;
    
    // Simple heuristic for alignment detection
    if (Math.abs(firstX - lastX) < 10) return 'left';
    if (avgX > items[0].viewport.width / 2) return 'right';
    return 'left';
  }

  detectSemanticRole(items, viewport) {
    const avgFontSize = items.reduce((sum, item) => sum + item.fontSize, 0) / items.length;
    const pageHeight = viewport.height;
    
    if (avgFontSize > 20) return 'heading';
    if (items[0].y < pageHeight * 0.1) return 'header';
    if (items[0].y > pageHeight * 0.9) return 'footer';
    return 'body';
  }

// In documentEditor.js - FIX/UPDATE extractImages method
async extractImages(page, viewport) {
  const images = [];
  try {
    const opList = await page.getOperatorList();
    console.log(`Operator list length: ${opList.fnArray.length}`);
    
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const imgRef = opList.argsArray[i][0];
        const commonObjs = page.commonObjs;
        
        if (commonObjs.has(imgRef)) {
          const imgData = commonObjs.get(imgRef);
          if (imgData && imgData.data) {
            console.log(`Found image data: ${imgData.width}x${imgData.height}`);
            
            // Create ImageBitmap
            const imageBitmap = await createImageBitmap(
              new ImageData(
                new Uint8ClampedArray(imgData.data),
                imgData.width,
                imgData.height
              )
            );
            
            // Convert to data URL
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgData.width;
            tempCanvas.height = imgData.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(imageBitmap, 0, 0);
            
            const imageElement = {
              id: `image-${page.pageNumber}-${images.length}-${Date.now()}`,
              type: 'image',
              originalData: {
                bitmap: imageBitmap,
                width: imgData.width,
                height: imgData.height,
                format: imgData.format || 'jpeg'
              },
              src: tempCanvas.toDataURL('image/jpeg', 0.9),
              x: 0, // We'll need to get the actual position from the PDF
              y: 0,
              width: imgData.width,
              height: imgData.height,
              originalWidth: imgData.width,
              originalHeight: imgData.height,
              editable: true,
              page: page.pageNumber,
              metadata: {
                quality: 'original',
                resolution: imgData.resolution || 300,
                colorSpace: imgData.colorSpace || 'rgb',
                viewport: { ...viewport }
              }
            };
            
            images.push(imageElement);
            this.elementRegistry.set(imageElement.id, imageElement);
          }
        }
      }
    }
    
    console.log(`Total images extracted: ${images.length}`);
  } catch (error) {
    console.error('Image extraction failed:', error);
  }
  return images;
}

// In documentEditor.js - FIX the processScannedPDFWithCanvas function
async processScannedPDFWithCanvas(file, options = {}) {
  try {
    console.log('Processing scanned PDF using canvas rendering...', { options });
    
    // Default options
    const defaultOptions = {
      scale: 1.5,
      imageQuality: 0.8,
      imageFormat: 'image/jpeg',
      useWhiteBackground: true,
      pageRange: null, // null = all pages
      includeText: false,
      canvasContextOptions: { willReadFrequently: true },
      pdfjsOptions: {
        verbosity: 0,
        disableWorker: false,
        cMapUrl: 'cmaps/',
        cMapPacked: true
      },
      skipErrors: true,
      processAllPages: false // ✅ ADD THIS to control multi-page processing
    };
    
    // Merge options with defaults
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      pdfjsOptions: {
        ...defaultOptions.pdfjsOptions,
        ...(options.pdfjsOptions || {})
      },
      canvasContextOptions: {
        ...defaultOptions.canvasContextOptions,
        ...(options.canvasContextOptions || {})
      }
    };
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      ...mergedOptions.pdfjsOptions
    }).promise;
    
    const pages = [];
    const totalPages = pdf.numPages;
    
    // ✅ FIXED: Determine which pages to process
    let pagesToProcess = [];
    
    // If processAllPages option is true OR pageRange is specified, process accordingly
    if (mergedOptions.processAllPages) {
      // Process ALL pages
      console.log(`🔄 processAllPages is TRUE - processing ALL ${totalPages} pages`);
      for (let i = 1; i <= totalPages; i++) {
        pagesToProcess.push(i);
      }
    } else if (mergedOptions.pageRange) {
      // Use specified page range
      if (Array.isArray(mergedOptions.pageRange)) {
        pagesToProcess = mergedOptions.pageRange.filter(p => p >= 1 && p <= totalPages);
      } else if (typeof mergedOptions.pageRange === 'object' && mergedOptions.pageRange.start && mergedOptions.pageRange.end) {
        const start = Math.max(1, mergedOptions.pageRange.start);
        const end = Math.min(totalPages, mergedOptions.pageRange.end);
        for (let i = start; i <= end; i++) {
          pagesToProcess.push(i);
        }
      } else if (typeof mergedOptions.pageRange === 'number') {
        if (mergedOptions.pageRange >= 1 && mergedOptions.pageRange <= totalPages) {
          pagesToProcess = [mergedOptions.pageRange];
        }
      }
    } else {
      // ✅ DEFAULT: Only process first page (to be backward compatible)
      console.log('ℹ️ Default behavior: processing only first page');
      pagesToProcess = [1];
    }
    
    console.log(`Processing pages: ${pagesToProcess.length} out of ${totalPages} - [${pagesToProcess.join(', ')}]`);
    
    for (const pageNumber of pagesToProcess) {
      try {
        console.log(`📄 Rendering page ${pageNumber}/${totalPages}...`);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: mergedOptions.scale });
        
        // Render page to canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', mergedOptions.canvasContextOptions);
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Set background if option is enabled
        if (mergedOptions.useWhiteBackground) {
          context.fillStyle = 'white';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const pageData = {
          pageNumber: pageNumber,
          width: viewport.width,
          height: viewport.height,
          viewport: viewport,
          elements: [],
          vectorPaths: []
        };

        // Add the entire page as an image element
        const imageElement = {
          id: `scanned-page-${pageNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          src: canvas.toDataURL(mergedOptions.imageFormat, mergedOptions.imageQuality),
          x: 50, // Position on canvas for better visibility
          y: 50,
          width: Math.min(viewport.width, 700), // Limit size
          height: Math.min(viewport.height, 1000),
          originalWidth: viewport.width,
          originalHeight: viewport.height,
          editable: true,
          draggable: true,
          resizable: true,
          page: pageNumber,
          metadata: {
            quality: 'compressed',
            resolution: 150,
            source: 'canvas_rendering',
            isScannedPDF: true,
            viewport: viewport,
            pageNumber: pageNumber,
            totalPages: totalPages
          }
        };
        
        pageData.elements.push(imageElement);
        this.elementRegistry.set(imageElement.id, imageElement);
        pages.push(pageData);
        
        console.log(`✅ Page ${pageNumber} rendered: ${viewport.width}x${viewport.height} (scale: ${mergedOptions.scale})`);
        
        // Clean up canvas to free memory
        canvas.width = 0;
        canvas.height = 0;
        
      } catch (pageError) {
        console.error(`❌ Error processing page ${pageNumber}:`, pageError);
        // Continue with other pages if skipErrors is true
        if (!mergedOptions.skipErrors) {
          throw pageError;
        }
      }
    }

    if (pages.length === 0) {
      console.warn('⚠️ No pages were successfully processed');
      return null;
    }

    const totalElements = pages.reduce((sum, page) => sum + page.elements.length, 0);
    
    console.log(`✅ Canvas fallback completed: ${pages.length} pages, ${totalElements} elements`);
    
    return {
      type: 'pdf',
      name: file.name,
      pages: pages,
      totalPages: totalPages,
      processedPages: pages.length,
      skippedPages: totalPages - pages.length,
      metadata: {
        processingMethod: 'canvas_rendering',
        isScannedPDF: true,
        elementsExtracted: totalElements,
        processingTime: new Date().toISOString(),
        fileSize: file.size,
        processedAllPages: mergedOptions.processAllPages
      }
    };
    
  } catch (error) {
    console.error('❌ Scanned PDF canvas processing error:', error);
    return null; // Return null instead of throwing for fallback handling
  }
}

// In documentEditor.js - UPDATE processImage method
async processImage(file, options) {
  try {
    console.log('🖼️ Starting image processing:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      options: options
    });
    
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    
    console.log('🖼️ Created image URL:', imageUrl);
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        console.log('✅ Image loaded successfully:', {
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        resolve();
      };
      img.onerror = (err) => {
        console.error('❌ Image load error:', err);
        reject(new Error(`Failed to load image: ${err}`));
      };
      img.src = imageUrl;
    });

    const viewport = {
      width: img.width,
      height: img.height,
      scale: 1,
      rotation: 0
    };

    console.log('🖼️ Creating page data with viewport:', viewport);

    const pageData = {
      pageNumber: 1,
      width: img.width,
      height: img.height,
      viewport: viewport,
      elements: [],
      vectorPaths: []
    };

    // Add the image as an element
    const imageElement = {
      id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'image',
      src: imageUrl,
      x: 0, // We'll center it later
      y: 0,
      width: img.width,
      height: img.height,
      originalWidth: img.width,
      originalHeight: img.height,
      editable: true,
      draggable: true,
      resizable: true,
      page: 1,
      metadata: {
        quality: 'original',
        resolution: 72,
        colorSpace: 'rgb',
        viewport: viewport,
        fileType: file.type,
        fileName: file.name
      }
    };

    console.log('🖼️ Created image element:', {
      id: imageElement.id,
      dimensions: `${imageElement.width}x${imageElement.height}`,
      src: imageElement.src?.substring(0, 50) + '...'
    });

    pageData.elements.push(imageElement);
    this.elementRegistry.set(imageElement.id, imageElement);

    // Perform OCR if enabled
    if (options.extractText) {
      console.log('🔍 Attempting OCR on image...');
      try {
        const ocrResult = await this.performOCR(file);
        if (ocrResult && ocrResult.data) {
          console.log(`OCR found ${ocrResult.data.words?.length || 0} words`);
          ocrResult.data.words?.forEach((word, index) => {
            const textElement = {
              id: `ocr-text-${index}`,
              type: 'text',
              text: word.text,
              x: word.bbox.x0 || 0,
              y: word.bbox.y0 || 0,
              width: (word.bbox.x1 - word.bbox.x0) || 100,
              height: (word.bbox.y1 - word.bbox.y0) || 20,
              fontSize: 12,
              fontFamily: 'sans-serif',
              fill: '#000000',
              editable: true,
              page: 1,
              metadata: {
                confidence: word.confidence || 0,
                viewport: viewport,
                source: 'ocr'
              }
            };
            
            pageData.elements.push(textElement);
            this.elementRegistry.set(textElement.id, textElement);
          });
        }
      } catch (ocrError) {
        console.warn('OCR failed, continuing without text extraction:', ocrError);
      }
    }

    const result = {
      type: 'image',
      name: file.name,
      pages: [pageData],
      totalPages: 1,
      metadata: {
        processingMethod: 'direct_image',
        isImage: true,
        elementsExtracted: pageData.elements.length,
        processingTime: new Date().toISOString(),
        fileSize: file.size
      }
    };

    console.log('✅ Image processing complete:', {
      pages: result.pages.length,
      elements: result.pages[0].elements.length,
      firstElement: result.pages[0].elements[0]
    });

    this.pageCache.set(1, pageData);
    
    // Don't revoke the URL immediately - we need it for rendering
    // It will be cleaned up when the editor is destroyed
    // URL.revokeObjectURL(imageUrl);
    
    return result;

  } catch (error) {
    console.error('❌ Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}


  // Viewport control methods
  zoomIn() {
    const newZoom = this.currentZoom * (1 + this.ZOOM_STEP);
    this.setZoom(newZoom);
  }

  zoomOut() {
    const newZoom = this.currentZoom * (1 - this.ZOOM_STEP);
    this.setZoom(newZoom);
  }

  setZoom(zoom, centerX = this.canvas.width / 2, centerY = this.canvas.height / 2) {
    const clampedZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, zoom));
    if (clampedZoom === this.currentZoom) return;
    
    const zoomPoint = this.screenToDocument(centerX, centerY);
    
    const zoomPointForEvent = { ...zoomPoint };
    this.currentZoom = clampedZoom;
    
    this.currentPan.x = centerX - (zoomPoint.x * clampedZoom);
    this.currentPan.y = centerY - (zoomPoint.y * clampedZoom);
    
    this.emit('zoomChanged', {
      zoom: clampedZoom,
      zoomPoint: zoomPointForEvent,
      pan: this.currentPan
    });
    
    this.renderCurrentPage();
  }

  // Page navigation
  goToPage(pageNumber) {
    const pageData = this.pageCache.get(pageNumber);
    if (pageData) {
      this.activePage = pageNumber;
      this.renderCurrentPage();
    }
  }

  nextPage() {
    this.goToPage(this.activePage + 1);
  }

  previousPage() {
    this.goToPage(this.activePage - 1);
  }

  // Export methods
  exportToImage(format = 'png', quality = 1.0) {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    const dataURL = this.canvas.toDataURL(`image/${format}`, quality);
    
    return {
      dataURL,
      format,
      quality,
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

// In documentEditor.js - UPDATE getFileType method
getFileType(file) {
  console.log('🔍 Determining file type:', {
    name: file.name,
    type: file.type,
    size: file.size
  });
  
  if (file.type) {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('text/')) return 'text';
  }
  
  const fileName = file.name.toLowerCase();
  const ext = fileName.split('.').pop();
  
  console.log('📁 File extension:', ext);
  
  if (['pdf'].includes(ext)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif'].includes(ext)) return 'image';
  if (['txt', 'text', 'md', 'csv', 'html', 'htm'].includes(ext)) return 'text';
  
  console.warn('⚠️ Unknown file type, defaulting to text');
  return 'text';
}

  // Selection management
  selectAll() {
    const pageData = this.pageCache.get(this.activePage);
    if (pageData && pageData.elements) {
      this.selectedElementIds = pageData.elements.map(el => el.id);
      this.emit('selectionChanged', { selectedElementIds: this.selectedElementIds });
      this.renderCurrentPage();
    }
  }

  clearSelection() {
    this.selectedElementIds = [];
    this.emit('selectionCleared', {});
    this.renderCurrentPage();
  }

  // Element manipulation
  updateElement(elementId, updates) {
    const element = this.elementRegistry.get(elementId);
    if (element) {
      Object.assign(element, updates);
      this.elementRegistry.set(elementId, element);
      
      // Update in page cache
      const pageData = this.pageCache.get(element.page);
      if (pageData) {
        const index = pageData.elements.findIndex(el => el.id === elementId);
        if (index !== -1) {
          pageData.elements[index] = element;
        }
      }
      
      this.emit('elementTransformed', { elementId, updates });
      this.renderCurrentPage();
    }
  }

  deleteSelectedElements() {
    const pageData = this.pageCache.get(this.activePage);
    if (!pageData) return;
    
    pageData.elements = pageData.elements.filter(element => 
      !this.selectedElementIds.includes(element.id)
    );
    
    this.selectedElementIds.forEach(id => {
      this.elementRegistry.delete(id);
    });
    
    this.selectedElementIds = [];
    this.renderCurrentPage();
  }

  // Cleanup
  async destroy() {
    try {
      if (this.tesseractWorker) {
        await this.tesseractWorker.terminate();
        this.tesseractWorker = null;
        this.isTesseractInitialized = false;
      }
      this.cache.clear();
      this.elementRegistry.clear();
      this.pageCache.clear();
      this.isInitialized = false;
      
      // Remove event listeners
      if (this.canvas) {
        const clone = this.canvas.cloneNode(true);
        this.canvas.parentNode?.replaceChild(clone, this.canvas);
        this.canvas = null;
        this.ctx = null;
      }
      
      console.log('Document Editor destroyed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default DocumentEditor;