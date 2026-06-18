import { useState, useEffect } from 'react';

// Cache em memória para sessões
const imageCache = new Map();
const failedImages = new Set();

export function useImageCache(imageUrl) {
  const [cachedUrl, setCachedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Verifica se já está em cache
    if (imageCache.has(imageUrl)) {
      setCachedUrl(imageCache.get(imageUrl));
      setIsLoading(false);
      return;
    }

    // Verifica se já falhou antes
    if (failedImages.has(imageUrl)) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      imageCache.set(imageUrl, imageUrl);
      setCachedUrl(imageUrl);
      setIsLoading(false);
    };

    img.onerror = () => {
      failedImages.add(imageUrl);
      setHasError(true);
      setIsLoading(false);
    };

    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return { cachedUrl, isLoading, hasError };
}

// Função para limpar cache (útil para desenvolvimento)
export function clearImageCache() {
  imageCache.clear();
  failedImages.clear();
}

export default useImageCache;