export const useGoogleMaps = () => {
  const config = useRuntimeConfig()
  const isLoaded = useState('google-maps-loaded', () => false)
  const loadPromise = useState<Promise<void> | null>('google-maps-promise', () => null)

  const load = async () => {
    if (isLoaded.value) return 

    // Debugging current state
    console.log('[useGoogleMaps] Checking status...', { 
      hasGoogle: !!window.google, 
      hasMaps: !!window.google?.maps, 
      hasImportLibrary: !!window.google?.maps?.importLibrary 
    })

    // If loaded and valid, return
    if (window.google?.maps && 'importLibrary' in window.google.maps) {
      console.log('[useGoogleMaps] Valid Google Maps already loaded.')
      isLoaded.value = true
      return
    }

    // If legacy version detected (or any version if we want to be safe), clean it up
    if (window.google?.maps) {
      console.warn('[useGoogleMaps] Legacy/Invalid Google Maps detected. Cleaning up...')
      try {
        // @ts-expect-error - Cleaning up global namespace
        delete window.google.maps
        // @ts-expect-error - Cleaning up global namespace
        delete window.google
      } catch (e) {
        console.error('[useGoogleMaps] Failed to delete window.google', e)
        // Attempt to nullify if delete fails
        // @ts-expect-error - Force null
        window.google = undefined
      }
    }

    // Remove ANY existing Google Maps scripts to prevent conflicts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com/maps/api/js"]')
    if (existingScripts.length > 0) {
      console.log(`[useGoogleMaps] Removing ${existingScripts.length} existing Google Maps script(s).`)
      existingScripts.forEach(s => s.remove())
    }

    if (!loadPromise.value) {
      console.log('[useGoogleMaps] Initializing new dynamic loader...')
      loadPromise.value = new Promise((resolve, reject) => {
        // Official Google Maps Dynamic Loader Snippet
        // This ensures importLibrary is available IMMEDIATELY
        ((g: any) => {
          var h: any, a: any, k: any, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window as any;
          b = b[c] || (b[c] = {});
          var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => {
            await (a = m.createElement("script"));
            e.set("libraries", "places,marker"); 
            for (k in g) e.set(k.replace(/[A-Z]/g, (t: any) => "_" + t[0].toLowerCase()), g[k]);
            e.set("callback", c + ".maps." + q);
            // @ts-ignore
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => h = n(Error(p + " could not load."));
            // @ts-ignore
            a.nonce = m.querySelector("script[nonce]")?.nonce || "";
            m.head.append(a)
          }));
          // @ts-ignore
          d[l] ? console.warn(p + " already loaded: " + JSON.stringify(d)) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n))
        })({
          key: config.public.googleMapsApiKey,
          v: "weekly",
          loading: "async"
        });

        // The loader doesn't provide a direct "loaded" callback for the main script, 
        // but importLibrary calls will wait. We can assume "loaded" for our internal state
        // once we've set up the stub.
        console.log('[useGoogleMaps] Dynamic loader stub applied.')
        isLoaded.value = true
        resolve()
      })
    }

    await loadPromise.value
  }

  return {
    load,
    isLoaded
  }
}
