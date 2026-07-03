import { useState, useEffect } from 'react';
import { AzureFunctionService, ImageStyle } from '../lib/azureFunctionService';

export const useImageStyles = () => {
  const [styles, setStyles] = useState<ImageStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStyles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const service = new AzureFunctionService();
      const response = await service.getImageStyles();
      
      if (response.success) {
        setStyles(response.filters);
      } else {
        setError(response.error || 'Failed to fetch styles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStyles();
  }, []);

  const refreshStyles = () => {
    fetchStyles();
  };

  return {
    styles,
    loading,
    error,
    refreshStyles,
  };
};






