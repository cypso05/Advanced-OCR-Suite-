// src/app/features/ocr/utils/decomposerHooks.js
import { useState, useCallback } from 'react';
import { documentDecomposer } from './decomposer.js';

export function useDocumentDecomposer(options = {}) {
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const decompose = useCallback(async (file, customOptions = {}) => {
    setIsDecomposing(true);
    setError(null);
    
    try {
      const decompositionResult = await documentDecomposer.decompose(file, {
        ...options,
        ...customOptions
      });
      
      setResult(decompositionResult);
      return decompositionResult;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsDecomposing(false);
    }
  }, [options]);
  
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsDecomposing(false);
  }, []);
  
  return {
    decompose,
    isDecomposing,
    error,
    result,
    reset,
    decomposer: documentDecomposer
  };
}