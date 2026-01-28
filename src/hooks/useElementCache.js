import { useRef, useCallback } from 'react';

/**
 * Custom hook for caching rendered Konva elements to improve performance
 * This is particularly useful for complex canvases with many elements
 * 
 * @param {boolean} enabled - Whether caching is enabled
 * @param {number} maxSize - Maximum cache size (in number of elements)
 * @returns {object} Cache methods
 */
export const useElementCache = (enabled = true, maxSize = 100) => {
  const cacheRef = useRef(new Map());
  const elementHashesRef = useRef(new Map());
  const lruRef = useRef([]); // Least Recently Used tracking

  /**
   * Generate a hash for an element based on its properties
   * This determines if the element has changed and needs re-rendering
   */
  const generateHash = useCallback((element) => {
    if (!element) return '';
    
    // Create a hash string from element properties
    const hashParts = [];
    
    // Basic properties
    hashParts.push(`id:${element.id}`);
    hashParts.push(`type:${element.type}`);
    hashParts.push(`x:${element.x}`);
    hashParts.push(`y:${element.y}`);
    hashParts.push(`width:${element.width}`);
    hashParts.push(`height:${element.height}`);
    hashParts.push(`rotation:${element.rotation || 0}`);
    hashParts.push(`opacity:${element.opacity || 1}`);
    hashParts.push(`visible:${element.visible !== false}`);
    
    // Type-specific properties
    switch (element.type) {
      case 'rectangle':
        hashParts.push(`fill:${element.fill}`);
        hashParts.push(`stroke:${element.stroke || ''}`);
        hashParts.push(`cornerRadius:${element.cornerRadius || 0}`);
        break;
      case 'circle':
        hashParts.push(`radius:${element.radius}`);
        hashParts.push(`fill:${element.fill}`);
        hashParts.push(`stroke:${element.stroke || ''}`);
        break;
      case 'text':
        hashParts.push(`text:${element.text || ''}`);
        hashParts.push(`fontSize:${element.fontSize || 16}`);
        hashParts.push(`fill:${element.fill || '#000'}`);
        break;
      case 'image':
        hashParts.push(`src:${element.src || ''}`);
        break;
      case 'line':
      case 'arrow':
        hashParts.push(`points:${JSON.stringify(element.points || [])}`);
        hashParts.push(`stroke:${element.stroke || ''}`);
        break;
    }
    
    return hashParts.join('|');
  }, []);

  /**
   * Update LRU tracking
   */
  const updateLRU = useCallback((elementId) => {
    if (!enabled) return;
    
    const lru = lruRef.current;
    const index = lru.indexOf(elementId);
    
    if (index > -1) {
      // Move to end (most recently used)
      lru.splice(index, 1);
    }
    
    lru.push(elementId);
    
    // Remove oldest items if cache exceeds max size
    while (lru.length > maxSize) {
      const oldestId = lru.shift();
      cacheRef.current.delete(oldestId);
      elementHashesRef.current.delete(oldestId);
    }
  }, [enabled, maxSize]);

  /**
   * Get a cached element if available and unchanged
   */
  const get = useCallback((elementId, element) => {
    if (!enabled || !elementId || !element) return null;
    
    const currentHash = generateHash(element);
    const cachedHash = elementHashesRef.current.get(elementId);
    const cachedElement = cacheRef.current.get(elementId);
    
    // Check if element has changed
    if (cachedHash === currentHash && cachedElement) {
      updateLRU(elementId);
      return cachedElement;
    }
    
    return null;
  }, [enabled, generateHash, updateLRU]);

  /**
   * Cache a rendered element
   */
  const set = useCallback((elementId, element, renderedElement) => {
    if (!enabled || !elementId || !element || !renderedElement) return;
    
    const hash = generateHash(element);
    
    // Store in cache
    cacheRef.current.set(elementId, renderedElement);
    elementHashesRef.current.set(elementId, hash);
    updateLRU(elementId);
  }, [enabled, generateHash, updateLRU]);

  /**
   * Clear specific element from cache
   */
  const clear = useCallback((elementId) => {
    cacheRef.current.delete(elementId);
    elementHashesRef.current.delete(elementId);
    
    // Remove from LRU
    const lruIndex = lruRef.current.indexOf(elementId);
    if (lruIndex > -1) {
      lruRef.current.splice(lruIndex, 1);
    }
  }, []);

  /**
   * Clear entire cache
   */
  const clearAll = useCallback(() => {
    cacheRef.current.clear();
    elementHashesRef.current.clear();
    lruRef.current = [];
  }, []);

  /**
   * Get cache statistics
   */
  const getStats = useCallback(() => {
    return {
      size: cacheRef.current.size,
      maxSize,
      hits: 0, // You could track hits with a ref if needed
      lruOrder: [...lruRef.current]
    };
  }, [maxSize]);

  return {
    get,
    set,
    clear,
    clearAll,
    getStats,
    isEnabled: enabled
  };
};

/**
 * Alternative simpler cache implementation if you don't need LRU
 */
export const useSimpleElementCache = (enabled = true) => {
  const cacheRef = useRef(new Map());

  const get = useCallback((elementId, element) => {
    if (!enabled || !elementId) return null;
    return cacheRef.current.get(elementId) || null;
  }, [enabled]);

  const set = useCallback((elementId, renderedElement) => {
    if (!enabled || !elementId || !renderedElement) return;
    cacheRef.current.set(elementId, renderedElement);
  }, [enabled]);

  const clear = useCallback((elementId) => {
    cacheRef.current.delete(elementId);
  }, []);

  const clearAll = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { get, set, clear, clearAll };
};