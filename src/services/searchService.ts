import { Track } from '../types/journey';

interface SearchFilters {
  mood?: string;
  genre?: string;
  artist?: string;
  album?: string;
  yearMin?: number;
  yearMax?: number;
  bpmMin?: number;
  bpmMax?: number;
  durationMin?: number;
  durationMax?: number;
  text?: string;
}

export function parseSearchQuery(query: string): SearchFilters {
  const filters: SearchFilters = {};
  
  // mood:chill
  const moodMatch = query.match(/mood:(\w+)/i);
  if (moodMatch) filters.mood = moodMatch[1].toLowerCase();
  
  // genre:jazz
  const genreMatch = query.match(/genre:([\w\s-]+)/i);
  if (genreMatch) filters.genre = genreMatch[1].toLowerCase();
  
  // artist:Bon Iver
  const artistMatch = query.match(/artist:([\w\s]+)/i);
  if (artistMatch) filters.artist = artistMatch[1];
  
  // album:xyz
  const albumMatch = query.match(/album:([\w\s]+)/i);
  if (albumMatch) filters.album = albumMatch[1];
  
  // year:>2015 or year:2010-2020
  const yearMatch = query.match(/year:(>?)(\d{4})(?:-(\d{4}))?/);
  if (yearMatch) {
    if (yearMatch[1] === '>') {
      filters.yearMin = parseInt(yearMatch[2]);
    } else if (yearMatch[3]) {
      filters.yearMin = parseInt(yearMatch[2]);
      filters.yearMax = parseInt(yearMatch[3]);
    } else {
      filters.yearMin = parseInt(yearMatch[2]);
      filters.yearMax = parseInt(yearMatch[2]);
    }
  }
  
  // bpm:90-120
  const bpmMatch = query.match(/bpm:(\d+)-(\d+)/);
  if (bpmMatch) {
    filters.bpmMin = parseInt(bpmMatch[1]);
    filters.bpmMax = parseInt(bpmMatch[2]);
  }
  
  // Remaining text
  const remainingText = query
    .replace(/mood:\w+/gi, '')
    .replace(/genre:[\w\s-]+/gi, '')
    .replace(/artist:[\w\s]+/gi, '')
    .replace(/album:[\w\s]+/gi, '')
    .replace(/year:>?[\d-]+/gi, '')
    .replace(/bpm:[\d-]+/gi, '')
    .trim();
  
  if (remainingText) filters.text = remainingText;
  
  return filters;
}

export function searchTracks(tracks: Track[], query: string): Track[] {
  const filters = parseSearchQuery(query);
  
  return tracks.filter(track => {
    // Mood filter
    if (filters.mood && track.moodCoordinate?.label.toLowerCase() !== filters.mood) {
      return false;
    }
    
    // Genre filter
    if (filters.genre && !track.genre?.toLowerCase().includes(filters.genre)) {
      return false;
    }
    
    // Artist filter
    if (filters.artist && !track.artist.toLowerCase().includes(filters.artist.toLowerCase())) {
      return false;
    }
    
    // Album filter
    if (filters.album && !track.album?.toLowerCase().includes(filters.album.toLowerCase())) {
      return false;
    }
    
    // Year filter
    if (filters.yearMin && (!track.year || track.year < filters.yearMin)) {
      return false;
    }
    if (filters.yearMax && (!track.year || track.year > filters.yearMax)) {
      return false;
    }
    
    // BPM filter
    if (filters.bpmMin && (!track.bpm || track.bpm < filters.bpmMin)) {
      return false;
    }
    if (filters.bpmMax && (!track.bpm || track.bpm > filters.bpmMax)) {
      return false;
    }
    
    // Text search
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      const matches = 
        track.title.toLowerCase().includes(searchText) ||
        track.artist.toLowerCase().includes(searchText) ||
        track.album?.toLowerCase().includes(searchText);
      if (!matches) return false;
    }
    
    return true;
  });
}