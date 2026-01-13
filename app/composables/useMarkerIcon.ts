export function useMarkerIcon() {
  // 1. Definition of Colors per Category
  // 1. Definition of Colors per Status (UX Redesign: Color = Status)
  const statusColors: Record<string, string> = {
    pending: '#EF4444',      // Red-500 (Open/Critical)
    in_progress: '#EAB308',  // Yellow-500
    resolved: '#22C55E',     // Green-500
    rejected: '#9CA3AF',     // Gray-400
    closed: '#6B7280',       // Gray-500
    unknown: '#94A3B8'       // Slate-400
  }

  // Keep category colors for UI filters if needed, or deprecate/map them
  const categoryColors: Record<string, string> = {
    pothole: '#FB923C',
    lighting: '#FACC15',
    trash: '#A3E635',
    safety: '#EF4444',
    security: '#EF4444',
    trees: '#22C55E',
    water: '#38BDF8',
    infrastructure: '#94A3B8',
    other: '#D1D5DB'
  }

  const icons: Record<string, string> = {
    pothole: 'M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z M12 9v4 M12 17h.01', // Alert Triangle
    lighting: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5 M9 18h6 M10 22h4', // Lightbulb
    trash: 'M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', // Trash 2
    trees: 'M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0z M7 16v6 M13 19v3 M10.9 12.9a8 8 0 0 1 10.1 7.1h0a3 3 0 0 1-3 3h0H8', // Trees
    security: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01', // Shield Alert
    safety: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01', // Alias
    water: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z', // Droplet
    infrastructure: 'M2 22h20 M2 6h20 M2 14h20 M6 2v20 M18 2v20', // Construction grid
    other: 'M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z M12 16v.01 M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4', // Help Circle
    location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6' // Map Pin
  }

  function getStatusColor(status: string | null | undefined): string {
    return statusColors[status || 'pending'] || statusColors.unknown
  }

  // Deprecating direct use in markers, keeping for legacy compatibility if needed
  function getCategoryColor(category: string | null | undefined): string {
     return '#94A3B8' // Return neutral for categories now, or keep mapping if strictly needed elsewhere
  }

  /**
   * Generates a "Flat Modern" marker SVG.
   * Color now depends on STATUS.
   * Icon depends on CATEGORY.
   */
  function getPinSvg(category: string | null | undefined, status: string | null | undefined, scale: number = 1): string {
    const color = getStatusColor(status)
    const iconPath = icons[category || 'other'] || icons.other
    
    // Modern Teardrop Shape
    const pinPath = `
      M 18,44
      C 18,44 4,28 4,18
      A 14,14 0 1,1 32,18
      C 32,28 18,44 18,44 Z
    `
    // Slightly darken stroke or keep white
    const strokeColor = 'white' 

    const svg = `
      <svg width="${36 * scale}" height="${48 * scale}" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
        <filter id="shadow-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.2"/>
        </filter>
        
        <!-- Drop Shadow -->
        <path d="${pinPath}" fill="black" filter="url(#shadow-sm)" stroke="none" transform="translate(0, 1)" />

        <!-- Main Body (Status Color) -->
        <path d="${pinPath}" fill="${color}" stroke="${strokeColor}" stroke-width="1.5" />

        <!-- Inner Icon (White, centered) -->
        <g transform="translate(10.2, 10.2) scale(0.65)">
          <path d="${iconPath}" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </svg>
    `
    return svg.replace(/\s+/g, ' ').trim()
  }

  function getPinDataUrl(category: string | null | undefined, status?: string | null | undefined, scale: number = 1): string {
    // Overloading: if status is a number (old signature was scale), handle it? 
    // Typescript will complain, we updated signature.
    // If called with (category, scale), status is undefined. We should fix callers.
    // For safety, if status is a number (runtime), treat as scale and default status.
    let safeStatus = status;
    let safeScale = scale;

    if (typeof status === 'number') {
        safeScale = status;
        safeStatus = 'pending';
    }

    const svg = getPinSvg(category, safeStatus as string, safeScale)
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
  }

  return {
    statusColors,
    categoryColors, // Exported for compatibility (e.g. filters)
    getStatusColor,
    getCategoryColor,
    getPinSvg,
    getPinDataUrl,
    pinAnchor: { x: 18, y: 44 },
    size: { width: 36, height: 48 },
    anchorPoint: { x: 18, y: 44 }
  }
}


