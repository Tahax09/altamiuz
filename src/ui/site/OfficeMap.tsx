'use client'
// Interactive office map (owner request 2026-11-18). The server renders the stored preview image
// and an "Explore the map" button; MapLibre GL (open source) and the map tiles load only when the
// visitor opens the map, so a page view makes no third-party request and the page's JavaScript
// budget is unchanged. Tiles and style come from OpenFreeMap (free, no key; CSP connect-src). The
// style is recoloured to the site palette, labels use the Latin names (Arabic labels would need a
// separate text-shaping plugin), and two-finger / modifier gestures keep page scrolling usable.
import { useEffect, useRef, useState, type ReactNode } from 'react'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
/** MapLibre's render worker, served from this origin (public/vendor/, kept equal to the installed
 *  package by tests/unit/ui/office-map.test.ts). The bundled code cannot locate it on its own. */
export const WORKER_URL = '/vendor/maplibre-gl-worker-6.16.0.mjs'

/** Site colour tokens (site.css) used to recolour the base style; read at runtime so the map
 *  always follows the palette (docs/design/brand-palette.md). */
const TOKENS = {
  background: '--paper-alt',
  water: '--mist-2',
  park: '--mist',
  building: '--mist-2',
  road: '--paper',
  roadCasing: '--night-muted',
  label: '--ink-muted',
  halo: '--paper',
} as const

function palette(): Record<keyof typeof TOKENS, string> {
  const css = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    Object.entries(TOKENS).map(([k, v]) => [k, css.getPropertyValue(v).trim()]),
  ) as Record<keyof typeof TOKENS, string>
}

type MapLibre = typeof import('maplibre-gl')
type MapInstance = InstanceType<MapLibre['Map']>

function brand(map: MapInstance) {
  const PALETTE = palette()
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id
    if (!PALETTE.background) return // tokens unavailable: keep the base style
    try {
      if (layer.type === 'background')
        map.setPaintProperty(id, 'background-color', PALETTE.background)
      else if (layer.type === 'fill' && /water/.test(id))
        map.setPaintProperty(id, 'fill-color', PALETTE.water)
      else if (layer.type === 'fill' && /park|landcover|grass|wood/.test(id))
        map.setPaintProperty(id, 'fill-color', PALETTE.park)
      else if (layer.type === 'fill' && /building/.test(id))
        map.setPaintProperty(id, 'fill-color', PALETTE.building)
      else if (layer.type === 'line' && /casing/.test(id))
        map.setPaintProperty(id, 'line-color', PALETTE.roadCasing)
      else if (layer.type === 'line' && /road|highway|street|bridge|tunnel/.test(id))
        map.setPaintProperty(id, 'line-color', PALETTE.road)
      else if (layer.type === 'line' && /water|river/.test(id))
        map.setPaintProperty(id, 'line-color', PALETTE.water)
      else if (layer.type === 'symbol') {
        map.setPaintProperty(id, 'text-color', PALETTE.label)
        map.setPaintProperty(id, 'text-halo-color', PALETTE.halo)
        map.setLayoutProperty(id, 'text-field', [
          'coalesce',
          ['get', 'name:en'],
          ['get', 'name:latin'],
          ['get', 'name'],
        ])
      }
    } catch {
      // A layer without that property: leave it as the base style draws it.
    }
  }
}

export function OfficeMap({
  latitude,
  longitude,
  zoom,
  label,
  openLabel,
  loadingLabel,
  failedLabel,
  children,
}: {
  latitude: number
  longitude: number
  zoom: number
  /** Accessible name of the map region (e.g. the section heading). */
  label: string
  openLabel: string
  loadingLabel: string
  failedLabel: string
  /** Server-rendered preview (the stored map image). */
  children?: ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'preview' | 'loading' | 'ready' | 'failed'>('preview')
  // Bumped on each open (and retry). The map lives as long as this value: status changes must not
  // re-run the effect, or its cleanup would remove the map it just created.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!attempt || !box.current) return
    let map: MapInstance | undefined
    let cancelled = false
    void (async () => {
      try {
        const [maplibre] = await Promise.all([
          import('maplibre-gl'),
          import('maplibre-gl/dist/maplibre-gl.css'),
        ])
        if (cancelled || !box.current) return
        maplibre.setWorkerUrl(WORKER_URL)
        map = new maplibre.Map({
          container: box.current,
          style: STYLE_URL,
          center: [longitude, latitude],
          zoom,
          cooperativeGestures: true,
          attributionControl: { compact: true },
        })
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
        // MapLibre positions the marker with a transform, so the teardrop's rotation goes on an
        // inner element (a rotated marker would rotate its own position too).
        const pin = document.createElement('span')
        pin.className = 'office-map__marker'
        pin.setAttribute('aria-hidden', 'true')
        pin.appendChild(document.createElement('span')).className = 'office-map__pin'
        new maplibre.Marker({ element: pin, anchor: 'bottom' })
          .setLngLat([longitude, latitude])
          .addTo(map)
        map.once('load', () => {
          if (!map) return
          brand(map)
          setState('ready')
        })
        map.once('error', () => setState((s) => (s === 'ready' ? s : 'failed')))
      } catch {
        if (!cancelled) setState('failed')
      }
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [attempt, latitude, longitude, zoom])

  const live = state === 'loading' || state === 'ready'
  return (
    <div className="office-map" data-state={state}>
      {live ? (
        // The frame is positioned; MapLibre's own (unlayered) stylesheet makes the inner container
        // position: relative, so the container only fills the frame by size.
        <div className="office-map__frame">
          <div ref={box} className="office-map__canvas" role="region" aria-label={label} />
        </div>
      ) : null}
      {state !== 'ready' ? (
        <div className="office-map__preview">
          {children}
          <button
            type="button"
            className="button office-map__open"
            onClick={() => {
              setState('loading')
              setAttempt((n) => n + 1)
            }}
            disabled={state === 'loading'}
            aria-live="polite"
          >
            {state === 'loading' ? loadingLabel : state === 'failed' ? failedLabel : openLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
