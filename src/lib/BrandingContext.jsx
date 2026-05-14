import React, { createContext, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    primary: '#003DA5',
    secondary: '#FFD100',
    font: 'Inter'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        // Fetch from hub config
        const response = await fetch('https://beacon-92324875.base44.app/functions/getHubConfig');
        const data = await response.json();
        
        if (data.ok && data.config.branding) {
          setBranding({
            primary: data.config.branding.brand_primary_color,
            secondary: data.config.branding.brand_secondary_color,
            font: data.config.branding.brand_font || 'Inter'
          });
          
          // Apply to root CSS variables
          const root = document.documentElement;
          root.style.setProperty('--brand-primary', data.config.branding.brand_primary_color);
          root.style.setProperty('--brand-secondary', data.config.branding.brand_secondary_color);
        }
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
};