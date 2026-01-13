export function useMarkerIcon() {
  // 1. Definition of Colors per Category
  const categoryColors: Record<string, string> = {
    pothole: '#FB923C',       // Orange-400
    lighting: '#FACC15',      // Yellow-400
    trash: '#A3E635',         // Lime-400
    safety: '#EF4444',        // Red-500
    water: '#38BDF8',         // Sky-400
    infrastructure: '#94A3B8',// Slate-400
    other: '#D1D5DB'          // Gray-300
  }

  // 2. SVG Paths for Icons (Simplified version of Lucide for embedding)
  // These must be valid SVG <path d="..."> content, scaled generally to fit in 24x24 viewbox
  const icons: Record<string, string> = {
    pothole: 'M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z M12 9v4 M12 17h.01', // Alert Triangle
    lighting: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5 M9 18h6 M10 22h4', // Lightbulb
    trash: 'M3 6h18 M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6 M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', // Trash 2
    trees: 'M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0z M7 16v6 M13 19v3 M10.9 12.9a8 8 0 0 1 10.1 7.1h0a3 3 0 0 1-3 3h0H8', // Trees
    security: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01', // Shield Alert
    safety: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01', // Alias for DB compatibility
    water: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z', // Droplet
    infrastructure: 'M2 22h20 M2 6h20 M2 14h20 M6 2v20 M18 2v20', // Construction grid
    other: 'M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z M12 16v.01 M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4', // Help Circle
    location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6' // Map Pin
  }

  function getCategoryColor(category: string | null | undefined): string {
    const map: Record<string, string> = {
        pothole: categoryColors.pothole,
        lighting: categoryColors.lighting,
        trash: categoryColors.trash,
        trees: '#22C55E', // Green-500
        security: categoryColors.safety,
        safety: categoryColors.safety, // Alias
        water: categoryColors.water,
        infrastructure: categoryColors.infrastructure,
        other: categoryColors.other,
        location: '#EF4444' // Red-500
    }
    return map[category || 'other'] || map.other
  }

  /**
   * Generates a "Flat Modern" marker SVG.
   * Style: Clean, Matte, Minimal Shadow, Teardrop shape.
   */
  function getPinSvg(category: string | null | undefined, scale: number = 1): string {
    const color = getCategoryColor(category)
    const iconPath = icons[category || 'other'] || icons.other
    
    // Modern Teardrop Shape:
    // Centered horizontally at 18.
    // Top circle: Center 18,18 Radius 14.
    // Tail tip: 18, 44.
    const pinPath = `
      M 18,44
      C 18,44 4,28 4,18
      A 14,14 0 1,1 32,18
      C 32,28 18,44 18,44 Z
    `

    // ViewBox: 0 0 36 48 (standard size)
    // We add a small drop shadow via filter, so we might need slightly larger viewBox if we strictly clip,
    // but usually standard SVG overflow is visible if not clipped.
    // Let's keep 36x48 and use a simple shadow.
    
    const svg = `
      <svg width="${36 * scale}" height="${48 * scale}" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
        <filter id="shadow-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.2"/>
        </filter>
        
        <!-- Drop Shadow -->
        <path d="${pinPath}" fill="black" filter="url(#shadow-sm)" stroke="none" transform="translate(0, 1)" />

        <!-- Main Body (Flat Color) -->
        <path d="${pinPath}" fill="${color}" stroke="white" stroke-width="1.5" />

        <!-- Inner Icon (White, centered) -->
        <!-- Center of circle is 18,18. Icon is 24x24. -->
        <!-- Scale 0.65 -> 15.6 size. Offset: 18 - 7.8 = 10.2 -->
        <g transform="translate(10.2, 10.2) scale(0.65)">
          <path d="${iconPath}" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </svg>
    `
    // Minify whitespace
    return svg.replace(/\s+/g, ' ').trim()
  }

  /**
   * Returns a Data URL for use in standard Google Maps Marker (icon: url)
   */
  function getPinDataUrl(category: string | null | undefined, scale: number = 1): string {
    const svg = getPinSvg(category, scale)
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
  }

  return {
    categoryColors,
    getCategoryColor,
    getPinSvg,
    getPinDataUrl,
    // Export dimensions so consumers can align anchors correctly
    // Flat design is standard 36x48
    pinAnchor: { x: 18, y: 44 }, // Tip of the tail
    size: { width: 36, height: 48 },
    anchorPoint: { x: 18, y: 44 } // Duplicate for compat
  }
}


