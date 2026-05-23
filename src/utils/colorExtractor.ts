// Simple color extraction from album art
// In production, use react-native-palette or similar
// This is a lightweight fallback that extracts dominant colors from a color string

export class ColorExtractor {
  // Extract dominant color from a hex or rgb string
  static parseColor(color: string): { r: number; g: number; b: number } | null {
    if (!color) return null;

    // Hex color
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      }
    }

    // RGB color
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
      };
    }

    return null;
  }

  static toHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  static toRgba(r: number, g: number, b: number, a: number): string {
    return `rgba(${r},${g},${b},${a})`;
  }

  // Generate a palette from a single dominant color
  static generatePalette(dominantColor: string): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  } {
    const rgb = this.parseColor(dominantColor);
    if (!rgb) {
      return {
        primary: '#FF6B9D',
        secondary: '#9B59B6',
        accent: '#00D9FF',
        background: '#0A0A0F',
        surface: '#1A1A2E',
      };
    }

    const { r, g, b } = rgb;

    // Darken for background
    const bgR = Math.max(0, r * 0.1);
    const bgG = Math.max(0, g * 0.1);
    const bgB = Math.max(0, b * 0.15);

    // Lighten for surface
    const surfR = Math.min(255, r * 0.2 + 20);
    const surfG = Math.min(255, g * 0.2 + 20);
    const surfB = Math.min(255, b * 0.25 + 30);

    // Complementary for accent
    const accentR = 255 - r;
    const accentG = 255 - g;
    const accentB = 255 - b;

    return {
      primary: this.toHex(r, g, b),
      secondary: this.toHex(
        Math.min(255, r * 0.7 + 50),
        Math.min(255, g * 0.7 + 50),
        Math.min(255, b * 0.7 + 50)
      ),
      accent: this.toHex(accentR, accentG, accentB),
      background: this.toHex(Math.round(bgR), Math.round(bgG), Math.round(bgB)),
      surface: this.toHex(Math.round(surfR), Math.round(surfG), Math.round(surfB)),
    };
  }

  // Get a color tint for track cards based on album art
  static getTrackCardTint(artworkColor: string): string {
    const rgb = this.parseColor(artworkColor);
    if (!rgb) return 'rgba(255,255,255,0.05)';
    return `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
  }

  // Determine if a color is light or dark
  static isLight(r: number, g: number, b: number): boolean {
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }

  // Get contrasting text color
  static getContrastText(bgColor: string): string {
    const rgb = this.parseColor(bgColor);
    if (!rgb) return '#FFFFFF';
    return this.isLight(rgb.r, rgb.g, rgb.b) ? '#000000' : '#FFFFFF';
  }
}
