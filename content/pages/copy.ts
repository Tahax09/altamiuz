// Site pages beyond home, contact and privacy (W-1): About, Standards and frameworks, Expertise and
// experience, Insights and resources, Terms of use; navigation and listing introductions. CMS
// content, loaded as DRAFTS by `pnpm seed:pages` (scripts/site-pages.ts); never rendered from
// code and never published by the script.
//
// Rules (spec "do not invent company claims"; docs/content/dependencies.md):
// - Visible text reuses the homepage draft (content/homepage/copy.ts), which states only what the
//   brief establishes. No history, team, clients, certifications, partnerships or statistics.
// - Anything that needs a missing fact is a hidden section whose admin label (`blockName`) starts
//   with "Pending:" and names the dependency, so it cannot go live by accident.
// - Legal text is not drafted here: the terms of use are headings only, every section pending
//   CD-10, and a legal page with a "Pending" section cannot be published.
// - All copy awaits approval and native-speaker review (CD-11); Arabic page slugs are part of it.
import { sections as home } from '../homepage/copy'

export type Locale = 'en' | 'ar'
export type L = Record<Locale, string>

export type PageDef = {
  key: 'about' | 'standards' | 'expertise' | 'insights' | 'terms'
  template: 'default' | 'legal'
  title: L
  slug: L
  summary?: L
  seo: { title: L; description: L }
}

export const pages: Record<PageDef['key'], PageDef> = {
  about: {
    key: 'about',
    template: 'default',
    title: { en: 'About Altamiuz', ar: 'عن Altamiuz' },
    slug: { en: 'about', ar: 'من-نحن' },
    summary: {
      en: 'A Libyan information security consultancy that works with management and technical teams.',
      ar: 'شركة ليبية لاستشارات أمن المعلومات تعمل مع الفرق الإدارية والتقنية.',
    },
    seo: {
      title: {
        en: 'About Altamiuz | Information security consultancy',
        ar: 'عن Altamiuz | استشارات أمن المعلومات',
      },
      description: {
        en: 'Altamiuz is a Libyan information security consultancy. Each engagement ends with documented findings and a prioritised plan.',
        ar: 'Altamiuz شركة ليبية لاستشارات أمن المعلومات. تنتهي كل مهمة بنتائج موثقة وخطة مرتبة حسب الأولوية.',
      },
    },
  },
  standards: {
    key: 'standards',
    template: 'default',
    title: { en: 'Standards and frameworks', ar: 'المعايير والأطر' },
    slug: { en: 'standards-and-frameworks', ar: 'المعايير-والأطر' },
    summary: home.standards.intro,
    seo: {
      title: {
        en: 'Standards and frameworks | Altamiuz',
        ar: 'المعايير والأطر | Altamiuz',
      },
      description: {
        en: 'The recognised information security frameworks our work references, with their current editions.',
        ar: 'أطر أمن المعلومات المعترف بها التي يستند إليها عملنا، مع إصداراتها الحالية.',
      },
    },
  },
  expertise: {
    key: 'expertise',
    template: 'default',
    title: home.expertise.heading,
    slug: { en: 'expertise', ar: 'الخبرة-والتجربة' },
    seo: {
      title: { en: 'Expertise and experience | Altamiuz', ar: 'الخبرة والتجربة | Altamiuz' },
      description: {
        en: 'How Altamiuz approaches information security work, from understanding your context to supporting implementation.',
        ar: 'كيف تتناول Altamiuz أعمال أمن المعلومات، من فهم سياقك إلى دعم التنفيذ.',
      },
    },
  },
  insights: {
    key: 'insights',
    template: 'default',
    title: home.insights.heading,
    slug: { en: 'insights', ar: 'رؤى-وموارد' },
    summary: home.insights.intro,
    seo: {
      title: { en: 'Insights and resources | Altamiuz', ar: 'رؤى وموارد | Altamiuz' },
      description: home.insights.intro,
    },
  },
  terms: {
    key: 'terms',
    template: 'legal',
    title: { en: 'Terms of use', ar: 'شروط الاستخدام' },
    slug: { en: 'terms-of-use', ar: 'شروط-الاستخدام' },
    seo: {
      title: { en: 'Terms of use | Altamiuz', ar: 'شروط الاستخدام | Altamiuz' },
      description: {
        en: 'Terms that apply to the use of this website.',
        ar: 'الشروط التي تنطبق على استخدام هذا الموقع.',
      },
    },
  },
}

/** Pending dependencies, used as hidden-section labels (admin only). */
export const pending = {
  company: 'CD-01 legal name and registration; CD-02 founding year, address and contact details',
  team: 'CD-03 team biographies, credentials and photo consent',
  standards: home.standards.pending,
  expertise: home.expertise.pending,
  insights: home.insights.pending,
  terms: 'CD-10 terms of use reviewed under applicable law (legal approval)',
} as const

export const headings = {
  company: { en: 'Company details', ar: 'بيانات الشركة' },
  team: { en: 'Our team', ar: 'فريقنا' },
  terms: [
    { en: 'Use of this website', ar: 'استخدام هذا الموقع' },
    { en: 'Intellectual property', ar: 'الملكية الفكرية' },
    { en: 'Limitation of liability', ar: 'حدود المسؤولية' },
    { en: 'Links to other websites', ar: 'الروابط إلى مواقع أخرى' },
    { en: 'Governing law', ar: 'القانون الواجب التطبيق' },
    { en: 'Changes to these terms', ar: 'التعديلات على هذه الشروط' },
  ],
} as const

/** Header and footer menus (drafts). `page:` targets are the pages above or the contact page. */
export type NavTarget =
  { route: 'services' | 'training' } | { page: PageDef['key'] | 'contact' | 'privacy' }
export type NavItem = { label: L; target?: NavTarget; children?: NavItem[] }

export const headerNav: NavItem[] = [
  {
    label: { en: 'About', ar: 'من نحن' },
    target: { page: 'about' },
    children: [
      { label: home.expertise.heading, target: { page: 'expertise' } },
      { label: home.standards.eyebrow, target: { page: 'standards' } },
    ],
  },
  { label: home.services.eyebrow, target: { route: 'services' } },
  { label: { en: 'Training', ar: 'التدريب' }, target: { route: 'training' } },
  { label: home.insights.heading, target: { page: 'insights' } },
]

export const footerNav: NavItem[] = [
  {
    label: { en: 'Company', ar: 'الشركة' },
    children: [
      { label: { en: 'About', ar: 'من نحن' }, target: { page: 'about' } },
      { label: home.expertise.heading, target: { page: 'expertise' } },
      { label: home.standards.eyebrow, target: { page: 'standards' } },
    ],
  },
  {
    label: { en: 'What we do', ar: 'ما نقدمه' },
    children: [
      { label: home.services.eyebrow, target: { route: 'services' } },
      { label: { en: 'Training', ar: 'التدريب' }, target: { route: 'training' } },
      { label: home.insights.heading, target: { page: 'insights' } },
    ],
  },
]

export const legalLinks: NavItem[] = [
  { label: { en: 'Privacy notice', ar: 'إشعار الخصوصية' }, target: { page: 'privacy' } },
  { label: { en: 'Terms of use', ar: 'شروط الاستخدام' }, target: { page: 'terms' } },
]

/** Listing page introductions (site settings `listings`). Training has none until CD-05. */
export const listings = {
  servicesIntro: home.services.intro,
} as const

export const cta = home.contact
