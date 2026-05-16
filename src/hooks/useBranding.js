import { useEffect } from 'react';

function hexToHsl(hex) {
  if (!hex || !hex.startsWith('#')) return null;
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function useBranding() {
  useEffect(() => {
    const fetchAndApply = async () => {
      try {
        const res = await fetch('https://beacon-nexus-core.base44.app/functions/getBranding');
        const { primary_color, secondary_color, background_color } = await res.json();

        const root = document.documentElement;
        if (primary_color) {
          const hsl = hexToHsl(primary_color);
          root.style.setProperty('--primary', hsl);
        }
        if (secondary_color) {
          const hsl = hexToHsl(secondary_color);
          root.style.setProperty('--accent', hsl);
        }
        if (background_color) {
          const hsl = hexToHsl(background_color);
          root.style.setProperty('--background', hsl);
        }
      } catch (e) {
        // Silently fail if Beacon is unreachable
      }
    };

    fetchAndApply();
    const interval = setInterval(fetchAndApply, 30000);
    return () => clearInterval(interval);
  }, []);
}