// Server-rendered localized 404 document (FR-008, FR-082, WCAG 3.1.1), served by the proxy for
// missing public paths: complete without JavaScript, `<html lang dir>` per locale, no internal
// details. The in-app not-found boundary (client-side navigations) shows the same message.
import { href, LANGUAGE_NAMES, LOCALES, t, type Locale } from '@/modules/i18n'

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

/** Minimal styles (the hashed site stylesheet is not known to the proxy); nonce-gated by CSP. */
const STYLE = `html{color:#14181f;background:#fff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.45}
html[lang=ar]{font-family:'Segoe UI',Tahoma,'Geeza Pro',system-ui,sans-serif;line-height:1.7}
body{margin:0}main{max-width:68ch;margin:0 auto;padding:clamp(1rem,.8rem + 1vw,1.5rem)}
a{color:#1d4ed8;display:inline-block;min-height:24px;padding-block:.25em}
a:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}
ul{padding-inline-start:1.25em}`

export function notFoundDocument(locale: Locale, nonce: string): string {
  const e = (key: Parameters<typeof t>[1]) => escape(t(locale, key))
  const other = LOCALES.find((l) => l !== locale)!
  return `<!doctype html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${e('notFoundTitle')}</title>
<style nonce="${escape(nonce)}">${STYLE}</style>
</head>
<body>
<main id="main">
<h1>${e('notFoundTitle')}</h1>
<p>${e('notFoundBody')}</p>
<nav aria-label="${e('mainNavigation')}">
<ul>
<li><a href="${href('home', locale)}">${e('backHome')}</a></li>
<li><a href="${href('services', locale)}">${e('services')}</a></li>
<li><a href="${href('training', locale)}">${e('training')}</a></li>
</ul>
</nav>
<p lang="${other}" dir="${other === 'ar' ? 'rtl' : 'ltr'}"><a href="${href('home', other)}" hreflang="${other}">${escape(LANGUAGE_NAMES[other])}</a></p>
</main>
</body>
</html>
`
}
