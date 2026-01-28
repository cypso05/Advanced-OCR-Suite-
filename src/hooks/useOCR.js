import { useState, useCallback,  } from 'react';
import OCREngine from '../services/ocrEngine';

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const processImage = useCallback(async (imageSource, options = {}) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const ocrResult = await OCREngine.recognizeText(imageSource, options);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(ocrResult);

      return ocrResult;
    } catch (err) {
      setError(err.message);
      return {
        text: '',
        confidence: 0,
        recognized: false,
        error: err.message
      };
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, []);

  const processDocument = useCallback(async (imageSource, documentType) => {
    return processImage(imageSource, { documentType });
  }, [processImage]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    isProcessing,
    progress,
    result,
    error,
    processImage,
    processDocument,
    reset
  };
};