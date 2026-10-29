// Public-site typefaces (T101, D-24): Manrope (English headings), Inter (English body/UI) and
// IBM Plex Sans Arabic (Arabic, 400/700). Sourced from Google Fonts through next/font/google
// (owner instruction, 2026-10-29): the files are downloaded at build time and served from this
// origin, so visitors make no requests to Google and CSP keeps `font-src 'self'`.
// Not preloaded: each page then fetches only the faces its text uses (an English page never
// downloads the Arabic font), which keeps the per-language font budget (D-24). `swap` shows the
// fallback stack until a face arrives.
// Arabic uses two weights, not three: every Plex weight is an Arabic-script file plus a Latin file
// (digits and Latin words appear on every page), and 400/600/700 measured 146 KB, over the
// 120 KB per-language target; 400/700 is 96 KB. Weight 600 resolves to 700 (CSS font matching).
import { IBM_Plex_Sans_Arabic, Inter, Manrope } from 'next/font/google'

export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-manrope',
})

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
  variable: '--font-inter',
})

export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-plex-arabic',
})

/** Class names that define the three font variables; set on <html> by the site layout. */
export const fontVariables = [manrope.variable, inter.variable, plexArabic.variable].join(' ')
