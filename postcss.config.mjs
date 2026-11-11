// Tailwind CSS v4 (ADR-011): build-time only, no runtime JavaScript. Files without Tailwind
// directives (Payload's admin styles) pass through unchanged.
const config = { plugins: { '@tailwindcss/postcss': {} } }
export default config
