// Renders a document with the shared renderer (DocumentView) and prints the markup. Used by e2e
// tests to compare preview HTML with the renderer, in a process that resolves the app's aliases.
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DocumentView } from '@/ui'

const { doc, locale } = JSON.parse(readFileSync(0, 'utf8')) as {
  doc: Record<string, unknown>
  locale: 'ar' | 'en'
}
process.stdout.write(renderToStaticMarkup(createElement(DocumentView, { doc, locale })))
