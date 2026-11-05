// T139 (FR-083, SC-007, SC-008): Lighthouse CI budgets per public template and language, mobile
// profile (Lighthouse default: emulated mid-range phone, simulated slow 4G). Run with
// `pnpm perf:lighthouse` (scripts/lighthouse.sh) against the production build and the seeded e2e
// database. Results stay local (test-results/lighthouse); nothing is uploaded.
// INP is a field metric that a lab run cannot measure; Total Blocking Time is Lighthouse's lab
// proxy for it and carries the 200 ms budget.
// Throttling is applied (`devtools`), not simulated: against a local server the async scripts
// finish before first paint, so the simulator (Lantern) charges all JavaScript to LCP (measured
// 2.5–2.8 s simulated vs 1.4 s actually painted under the same slow-4G/4x-CPU profile, T139).
const BASE = process.env.LHCI_BASE_URL ?? 'http://127.0.0.1:3100'
const ar = (s) => encodeURIComponent(s)
const PATHS = [
  '/en',
  '/ar',
  '/en/about',
  '/en/services',
  '/ar/ar-vocab-pending-services',
  '/en/services/penetration-testing',
  `/ar/ar-vocab-pending-services/${ar('اختبار-الاختراق')}`,
  '/en/training',
  '/ar/ar-vocab-pending-training',
  '/en/training/security-awareness',
]
const KB = 1024

module.exports = {
  ci: {
    collect: {
      url: PATHS.map((p) => BASE + p),
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless=new --no-sandbox',
        throttlingMethod: 'devtools',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2500, aggregationMethod: 'median-run' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'median-run' },
        ],
        'total-blocking-time': ['error', { maxNumericValue: 200, aggregationMethod: 'median-run' }],
        'resource-summary:total:size': ['error', { maxNumericValue: 1024 * KB }],
        'resource-summary:script:size': ['error', { maxNumericValue: 150 * KB }],
        'resource-summary:font:size': ['error', { maxNumericValue: 120 * KB }],
        'categories:accessibility': ['error', { minScore: 1 }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'test-results/lighthouse' },
  },
}
