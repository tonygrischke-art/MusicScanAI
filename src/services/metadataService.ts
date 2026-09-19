import { parseBuffer, IAudioMetadata, IOptions } from 'music-metadata';
import * as FileSystem from 'expo-file-system';
import { Track } from '../types/journey';

export class MetadataService {
  async parseMetadata(fileUri: string): Promise<Partial<Track>> {
    try {
      // Convert content:// URI to file path if needed
      const filePath = await this.resolveFilePath(fileUri);
      
      // Read file as Uint8Array for parseBuffer
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const uint8Array = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });
      const buffer = Uint8Array.from(atob(uint8Array), c => c.charCodeAt(0));
      
      const options: IOptions = {
        duration: true,
        skipCovers: true,
        skipPostHeaders: true,
      };
      
      const metadata: IAudioMetadata = await parseBuffer(buffer, undefined, options);
      
      return {
        title: metadata.common.title || this.extractTitleFromFilename(filePath),
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        year: metadata.common.year,
        genre: metadata.common.genre?.[0] || 'Unknown',
        bitrate: metadata.format.bitrate,
        duration: metadata.format.duration || 0,
      };
    } catch (error) {
      console.error(`Failed to parse ${fileUri}:`, error);
      return this.getFallbackMetadata(fileUri);
    }
  }

  private async resolveFilePath(uri: string): Promise<string> {
    if (uri.startsWith('file://')) {
      return uri.replace('file://', '');
    }
    if (uri.startsWith('content://')) {
      // Handle Android content URIs
      const stat = await FileSystem.getInfoAsync(uri);
      return stat.uri.replace('file://', '');
    }
    return uri;
  }

  private extractTitleFromFilename(path: string): string {
    const filename = path.split('/').pop() || 'Unknown';
    return filename.replace(/\.[^/.]+$/, ''); // Remove extension
  }

  private getFallbackMetadata(uri: string): Partial<Track> {
    const filename = uri.split('/').pop() || 'Unknown';
    return {
      title: filename.replace(/\.[^/.]+$/, ''),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0,
    };
  }

  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  async extractArtwork(fileUri: string): Promise<string | null> {
    try {
      const filePath = await this.resolveFilePath(fileUri);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return null;
      }
      
      const uint8Array = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });
      const buffer = Uint8Array.from(atob(uint8Array), c => c.charCodeAt(0));
      
      const metadata = await parseBuffer(buffer, undefined, { skipCovers: false });
      
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0];
        const base64 = this.uint8ArrayToBase64(picture.data);
        return `data:${picture.format};base64,${base64}`;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const metadataService = new MetadataService();