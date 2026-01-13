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
    security: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01', // Shield Alert (Renamed from safety)
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
        water: categoryColors.water,
        infrastructure: categoryColors.infrastructure,
        other: categoryColors.other,
        location: '#EF4444' // Red-500
    }
    return map[category || 'other'] || map.other
  }

  /**
   * Generates a "Premium 3D Bubble" marker SVG.
   * Style: Glossy, Gradient, Thick White Border, Drop Shadow.
   */
  function getPinSvg(category: string | null | undefined, scale: number = 1): string {
    const color = getCategoryColor(category)
    const iconPath = icons[category || 'other'] || icons.other
    
    // Unique ID for gradients to avoid conflicts if multiple markers are rendered (though purely string based here)
    // We'll use the color hex as part of the ID since it's unique per category type usually.
    const cleanColor = color.replace('#', '')
    const gradId = `g-${cleanColor}`
    
    // Bubble Shape: Circle centered at 18,18 radius 15. Tail pointing to 18,46.
    const bubblePath = `
      M 18,46
      C 18,46 4,32 4,18
      A 14,14 0 1,1 32,18
      C 32,32 18,46 18,46 Z
    `

    // We use a radial gradient to simulate 3D sphere look
    // Center is slightly top-left to look like light source
    const gradientDef = `
      <radialGradient id="${gradId}" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="white" stop-opacity="0.4" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="main-${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" />
        <stop offset="100%" stop-color="${adjustBrightness(color, -40)}" />
      </linearGradient>
    `

    // We need a viewbox that includes space for the drop shadow and border stroke
    // Path bounds: x [4..32], y [4..46]. 
    // Add margin for stroke (2.5) and shadow (dy=3, blur~6).
    // Safe ViewBox: x[-5..41] (width 46), y[-5..55] (height 60).
    const viewBox = "-5 -5 46 60"
    const width = 46 * scale
    const height = 60 * scale

    const svg = `
      <svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
          </filter>
          ${gradientDef}
        </defs>
        
        <!-- Drop Shadow Group -->
        <g filter="url(#shadow-lg)">
          <!-- Main Body with Linear Gradient basis -->
          <path d="${bubblePath}" fill="url(#main-${gradId})" stroke="white" stroke-width="2.5" />
        </g>

        <!-- Glossy Highlight Overlay -->
        <path d="${bubblePath}" fill="url(#${gradId})" style="mix-blend-mode: overlay;" pointer-events="none" />
        
        <!-- Top Reflection (Glass effect) -->
        <ellipse cx="18" cy="12" rx="8" ry="4" fill="white" fill-opacity="0.3" pointer-events="none" />

        <!-- Inner Icon (White, centered) -->
        <g transform="translate(9.5, 9.5) scale(0.7)">
          <path d="${iconPath}" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.2));" />
        </g>
      </svg>
    `
    // Minify whitespace
    return svg.replace(/\s+/g, ' ').trim()
  }

  /**
   * Helper to darken hex color for gradient
   */
  function adjustBrightness(hex: string, percent: number) {
    let num = parseInt(hex.replace('#',''), 16)
    let amt = Math.round(2.55 * percent)
    let R = (num >> 16) + amt
    let B = ((num >> 8) & 0x00FF) + amt
    let G = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1)
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
    pinAnchor: { x: 18 + 5, y: 46 + 5 }, // Account for viewBox offset (-5, -5) -> CenterX 18 becomes 23, TipY 46 becomes 51?
    // Wait, if ViewBox starts at -5, then 0 is at 5px from left edge.
    // The coordinate 18 is at 18 - (-5) = 23px from left edge.
    // The coordinate 46 is at 46 - (-5) = 51px from top edge.
    // So visual center is 23, 51.
    anchorPoint: { x: 23, y: 51 },
    size: { width: 46, height: 60 }
  }
}

