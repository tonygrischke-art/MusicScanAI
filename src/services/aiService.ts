import { ScanResult } from '../stores/musicStore';

interface ScanResult {
  artist: string;
  album: string;
  year: number;
  tracks: string[];
}

export const scanAlbumImage = async (base64: string): Promise<ScanResult | null> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Analyze this album artwork and extract the artist name, album title, release year, and track list. Return JSON with artist, album, year, and tracks array.',
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64.split(',')[1],
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return null;
    }
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    return {
      artist: result.artist || '',
      album: result.album || '',
      year: result.year || 0,
      tracks: result.tracks || []
    };
  } catch (error) {
    console.error('Error scanning album image:', error);
    return null;
  }
};