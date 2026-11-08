// Seeds e2e accounts through the real services (sign-in → MFA enrolment). Run via `payload run`.
import fs from 'node:fs'
import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { confirmEnrolment, signIn, startEnrolment } from '../../src/modules/auth'

const payload = await getPayload({ config })
const { generate } = await import('otplib')
const out: Record<string, unknown> = {}
const pw = (r: string) => `e2e ${r} pass phrase ${Math.random().toString(36).slice(2)} 7` // gitleaks:allow (synthetic)

// a11y* accounts are used only by the a11y-admin project, so the per-account login limit
// (5 / 15 min) is not shared with the security project in one run.
const ROLE_OF = {
  owner: 'owner',
  administrator: 'administrator',
  publisher: 'publisher',
  editor: 'editor',
  passwordOnly: 'editor',
  a11yOwner: 'owner',
  a11yAdministrator: 'administrator',
  a11yPublisher: 'publisher',
  // tests/security/cache-invalidation.spec.ts only
  cachePublisher: 'publisher',
  cacheAdministrator: 'administrator',
  // tests/e2e/us7-nav.spec.ts only (T130a)
  navOwner: 'owner',
  navAdministrator: 'administrator',
  navPublisher: 'publisher',
  navEditor: 'editor',
  navPasswordOnly: 'publisher',
  // tests/security/admin-code-editor.spec.ts only (E-1 Monaco/DOMPurify exposure)
  monacoOwner: 'owner',
  // tests/security/upload.spec.ts only (T108)
  uploadEditor: 'editor',
  uploadPublisher: 'publisher',
  // tests/e2e/us4-media.spec.ts only (T109)
  mediaEditor: 'editor',
  mediaPublisher: 'publisher',
  // tests/security/enquiry-abuse.spec.ts and tests/e2e/us5-enquiry.spec.ts only (US5)
  enquiryOwner: 'owner',
  enquiryEditor: 'editor',
  enquiryInboxOwner: 'owner',
  // tests/security/redirects.spec.ts only (US6)
  seoAdmin: 'administrator',
  // tests/e2e/admin-login.spec.ts only
  loginOwner: 'owner',
  loginNew: 'owner', // signed up, second factor not enrolled yet
} as const
for (const role of Object.keys(ROLE_OF) as (keyof typeof ROLE_OF)[]) {
  const email = `e2e-${role.toLowerCase()}@example.invalid`
  const password = pw(role)
  const user = (await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name: `E2E ${role}`,
      role: ROLE_OF[role],
      status: 'active',
    } as never,
    overrideAccess: true,
    context: { authSystem: true },
  })) as unknown as { id: number }
  const entry: Record<string, unknown> = { id: user.id, email, password }
  if (role !== 'passwordOnly' && role !== 'navPasswordOnly' && role !== 'loginNew') {
    const login = await signIn(payload, { email, password, ip: '127.0.0.1' })
    if (!login.ok) throw new Error(`seed login failed for ${role}`)
    const ctx = { payload, userId: user.id, email, sid: login.sid }
    const { secret } = await startEnrolment(ctx)
    await confirmEnrolment(ctx, await generate({ secret }))
    entry.secret = secret
    entry.enrolledAt = Date.now()
  }
  out[role] = entry
}
// US2 content: one bilingual draft page with three sections (reorder, preview, locking tests).
const rt = (text: string) => ({
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        children: [{ type: 'text', version: 1, text, format: 0 }],
      },
    ],
  },
})
const page = (await payload.create({
  collection: 'pages',
  locale: 'en',
  draft: true,
  data: {
    title: 'E2E draft page',
    slug: 'e2e-draft',
    template: 'default',
    sections: [
      { blockType: 'richText', blockName: 'First section', content: rt('Draft-only English body') },
      { blockType: 'cta', blockName: 'Second section', heading: 'Talk to us' },
      { blockType: 'richText', blockName: 'Third section', content: rt('Closing words') },
    ],
  } as never,
  overrideAccess: true,
})) as unknown as { id: number; sections: { id: string }[] }
await payload.update({
  collection: 'pages',
  id: page.id,
  locale: 'ar',
  draft: true,
  data: {
    title: 'صفحة تجريبية',
    slug: 'مسودة-تجريبية',
    sections: page.sections.map((s, i) =>
      i === 0
        ? { id: s.id, content: rt('نص عربي مع ISO 27001 داخل الجملة') }
        : i === 1
          ? { id: s.id, heading: 'تواصل معنا' }
          : { id: s.id, content: rt('كلمات ختامية') },
    ),
  } as never,
  overrideAccess: true,
})
out.content = { pageId: page.id }

// US1 public fixtures (published through the normal workflow as the system user).
const seoFor = (l: 'ar' | 'en', title: string) =>
  l === 'ar'
    ? { title: `${title} ع`, description: 'وصف الصفحة' }
    : { title, description: 'Page description' }
async function publishDoc(
  collection: 'pages' | 'services' | 'courses',
  en: Record<string, unknown>,
  ar?: Record<string, unknown>,
) {
  const doc = (await payload.create({
    collection,
    locale: 'en',
    draft: true,
    data: { seo: seoFor('en', String(en.title)), ...en } as never,
    overrideAccess: true,
  })) as unknown as { id: number; sections?: { id: string }[] }
  if (ar)
    await payload.update({
      collection,
      id: doc.id,
      locale: 'ar',
      draft: true,
      data: { seo: seoFor('ar', String(ar.title)), ...ar } as never,
      overrideAccess: true,
    })
  for (const locale of ar ? (['en', 'ar'] as const) : (['en'] as const))
    await payload.update({
      collection,
      id: doc.id,
      locale,
      data: { _status: 'published' } as never,
      publishSpecificLocale: locale,
      overrideAccess: true,
    })
  return doc
}
const svc = await publishDoc(
  'services',
  {
    title: 'Penetration testing',
    slug: 'penetration-testing',
    summary: 'Find weaknesses first.',
    order: 1,
    sections: [{ blockType: 'richText', content: rt('Service body EN') }],
  },
  { title: 'اختبار الاختراق', slug: 'اختبار-الاختراق', summary: 'اكتشف الثغرات أولاً.' },
)
await publishDoc('services', {
  title: 'Hidden service E2E',
  slug: 'hidden-service',
  summary: 'x',
  hidden: true,
  sections: [],
})
const course = await publishDoc('courses', {
  title: 'Security awareness course',
  slug: 'security-awareness',
  summary: 'English-only course.',
  audience: 'All staff',
  duration: { value: 2, unit: 'days' },
  deliveryFormat: 'online',
  sections: [{ blockType: 'richText', content: rt('Course body EN only') }],
})
const homeSections = (l: 'ar' | 'en') => [
  {
    blockType: 'hero',
    heading: l === 'ar' ? 'مرحباً' : 'Welcome',
    primaryCta: {
      linkType: 'internal',
      doc: { relationTo: 'services', value: svc.id },
      label: l === 'ar' ? 'خدماتنا' : 'Our services',
    },
  },
  { blockType: 'serviceList', heading: l === 'ar' ? 'الخدمات' : 'Services', mode: 'all' },
  { blockType: 'richText', hidden: true, content: rt('Hidden section e2e text') },
  {
    blockType: 'stats',
    items: [{ value: '10', label: l === 'ar' ? 'مشروع' : 'Engagements' }],
    evidence: { status: 'verified', reference: 'E2E internal evidence ref' },
  },
  // Homepage sections (Direction A). Fixture text only, so layout, RTL and a11y checks cover them.
  {
    blockType: 'textMedia',
    eyebrow: l === 'ar' ? 'من نحن' : 'About',
    heading: l === 'ar' ? 'مقدمة اختبارية' : 'E2E introduction',
    body: rt(l === 'ar' ? 'نص مقدمة اختباري' : 'E2E introduction body'),
  },
  {
    blockType: 'featureGrid',
    heading: l === 'ar' ? 'لماذا' : 'Why',
    items: [{ icon: 'shield', title: l === 'ar' ? 'سبب' : 'E2E reason' }],
  },
  {
    blockType: 'process',
    heading: l === 'ar' ? 'المنهجية' : 'Approach',
    steps: (l === 'ar' ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D']).map((title) => ({
      title,
      text: l === 'ar' ? 'وصف الخطوة' : 'E2E step text',
    })),
  },
  {
    blockType: 'standards',
    heading: l === 'ar' ? 'المعايير' : 'Standards',
    items: [{ name: l === 'ar' ? 'إطار اختباري' : 'E2E framework' }],
  },
  {
    blockType: 'resourceList',
    heading: l === 'ar' ? 'رؤى' : 'Insights',
    items: [
      {
        kind: l === 'ar' ? 'دليل' : 'Guide',
        title: l === 'ar' ? 'مورد اختباري' : 'E2E resource',
        link: { linkType: 'internal', doc: { relationTo: 'services', value: svc.id } },
      },
    ],
  },
  { blockType: 'cta', heading: l === 'ar' ? 'تواصل' : 'E2E contact' },
]
const home = await publishDoc(
  'pages',
  { title: 'Home', slug: 'home', template: 'home', sections: homeSections('en') },
  undefined,
)
const homeDoc = (await payload.findByID({
  collection: 'pages',
  id: home.id,
  draft: true,
  depth: 0,
  locale: 'en',
  overrideAccess: true,
})) as unknown as { sections: { id: string; items?: { id: string }[] }[] }
await payload.update({
  collection: 'pages',
  id: home.id,
  locale: 'ar',
  draft: true,
  data: {
    title: 'الرئيسية',
    slug: 'الرئيسية',
    seo: seoFor('ar', 'الرئيسية'),
    // Keep section AND row ids: rows sent without ids are new rows, which drops the English
    // statistics label from the draft (the A-8 sequence; the publish gate now refuses it).
    sections: homeDoc.sections.map((sec, i) => {
      const ar = homeSections('ar')[i] as Record<string, unknown>
      const out: Record<string, unknown> = { ...ar, id: sec.id }
      for (const list of ['items', 'steps'] as const) {
        const rows = (sec as Record<string, unknown>)[list] as { id: string }[] | undefined
        if (Array.isArray(ar[list]) && rows)
          out[list] = (ar[list] as object[]).map((row, j) => ({ ...row, id: rows[j]!.id }))
      }
      return out
    }),
  } as never,
  overrideAccess: true,
})
// Adding the Arabic statistics label changed the claim, which removes its verification (L-1);
// re-verify the bilingual claim before publishing Arabic, as an administrator would.
const homeAr = (await payload.findByID({
  collection: 'pages',
  id: home.id,
  draft: true,
  depth: 0,
  locale: 'ar',
  overrideAccess: true,
})) as unknown as { sections: Record<string, unknown>[] }
await payload.update({
  collection: 'pages',
  id: home.id,
  locale: 'ar',
  draft: true,
  data: {
    sections: homeAr.sections.map((sec) =>
      sec.blockType === 'stats'
        ? { ...sec, evidence: { status: 'verified', reference: 'E2E internal evidence ref' } }
        : sec,
    ),
  } as never,
  overrideAccess: true,
})
await payload.update({
  collection: 'pages',
  id: home.id,
  locale: 'ar',
  data: { _status: 'published' } as never,
  publishSpecificLocale: 'ar',
  overrideAccess: true,
})
const about = await publishDoc('pages', {
  title: 'About us',
  slug: 'about',
  sections: [{ blockType: 'richText', content: rt('Published about text') }],
})
await payload.update({
  collection: 'pages',
  id: about.id,
  locale: 'en',
  draft: true,
  data: { title: 'Unreleased about edit' } as never,
  overrideAccess: true,
})
await payload.create({
  collection: 'redirects',
  data: { from: '/en/old-about', to: '/en/about', type: '301', source: 'manual' } as never,
  overrideAccess: true,
})
const poisoned = await publishDoc('pages', {
  title: 'Poisoned page',
  slug: 'poisoned',
  sections: [{ blockType: 'richText', content: rt('Poison placeholder') }],
})
// Write unsafe rich text straight into the published row, bypassing every hook.
const pool = (
  payload.db as unknown as { pool: { query: (q: string, v: unknown[]) => Promise<unknown> } }
).pool
await pool.query(
  `update pages_blocks_rich_text_locales set content = $1
   where _parent_id in (select id from pages_blocks_rich_text where _parent_id = $2)`,
  [
    JSON.stringify({
      root: {
        type: 'root',
        version: 1,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'link',
                version: 3,
                fields: { linkType: 'custom', url: 'javascript:alert(1)' },
                children: [{ type: 'text', version: 1, text: 'Click me', format: 0 }],
              },
              { type: 'html', version: 1, html: '<img src=x onerror=alert(2)>' },
              {
                type: 'text',
                version: 1,
                text: 'Styled',
                format: 0,
                style: 'background:url(javascript:alert(3))',
              },
            ],
          },
        ],
      },
    }),
    poisoned.id,
  ],
)
for (const [slug, data] of [
  [
    'site-settings',
    {
      email: 'info@example.org',
      defaultSeo: { title: 'Altamiuz', description: 'Site description' },
      enquiryRecipients: [{ email: 'e2e-secret-inbox@example.org' }],
    },
  ],
  [
    'header-nav',
    {
      items: [
        {
          link: {
            linkType: 'internal',
            doc: { relationTo: 'services', value: svc.id },
            label: 'Penetration testing',
          },
        },
        { link: { linkType: 'external', url: 'https://example.org/', label: 'External' } },
      ],
    },
  ],
  [
    'footer-nav',
    {
      items: [
        {
          link: {
            linkType: 'internal',
            doc: { relationTo: 'pages', value: about.id },
            label: 'About us',
          },
        },
      ],
    },
  ],
  ['banner', { enabled: true, message: 'E2E banner notice' }],
] as const)
  for (const locale of ['en', 'ar'] as const)
    await payload.updateGlobal({
      slug: slug as 'banner',
      locale,
      data: {
        ...(data as object),
        ...(locale === 'ar' && slug === 'header-nav'
          ? {
              items: [
                {
                  link: {
                    linkType: 'internal',
                    doc: { relationTo: 'services', value: svc.id },
                    label: 'اختبار الاختراق',
                  },
                },
              ],
            }
          : {}),
        ...(locale === 'ar' && slug === 'footer-nav' ? { items: [] } : {}),
        ...(locale === 'ar' && slug === 'banner' ? { message: 'إعلان تجريبي' } : {}),
        ...(locale === 'ar' && slug === 'site-settings'
          ? { defaultSeo: { title: 'التميز', description: 'وصف الموقع' } }
          : {}),
        _status: 'published',
      } as never,
      publishSpecificLocale: locale,
      overrideAccess: true,
    })
// US5: enquiry topics (labels per locale on the same rows) and a contact page with the form.
{
  const en = (await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      enquiryTopics: [{ label: 'Penetration testing' }, { label: 'Training' }],
      _status: 'published',
    } as never,
    publishSpecificLocale: 'en',
    overrideAccess: true,
  })) as unknown as { enquiryTopics: { id: string }[] }
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'ar',
    data: {
      enquiryTopics: en.enquiryTopics.map((r, i) => ({
        id: r.id,
        label: ['اختبار الاختراق', 'التدريب'][i],
      })),
      _status: 'published',
    } as never,
    publishSpecificLocale: 'ar',
    overrideAccess: true,
  })
}
const contact = await publishDoc(
  'pages',
  {
    title: 'Contact',
    slug: 'contact',
    sections: [{ blockType: 'contactBlock', heading: 'Contact us', intro: 'Send us a message.' }],
  },
  {
    title: 'تواصل معنا',
    slug: 'تواصل',
    sections: [{ blockType: 'contactBlock', heading: 'تواصل معنا', intro: 'أرسل إلينا رسالة.' }],
  },
)
out.public = {
  serviceId: svc.id,
  courseId: course.id,
  homeId: home.id,
  aboutId: about.id,
  contactId: contact.id,
}
fs.mkdirSync('test-results', { recursive: true })
fs.writeFileSync('test-results/e2e-fixtures.json', JSON.stringify(out))
process.exit(0)
