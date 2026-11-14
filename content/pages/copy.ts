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
    title: { en: 'About Altamiuz', ar: 'من نحن' },
    slug: { en: 'about', ar: 'من-نحن' },
    summary: {
      en: 'A Libyan information security consultancy that helps organisations meet international standards, step by step.',
      ar: 'شركة ليبية لاستشارات أمن المعلومات تساعد المؤسسات على الالتزام بالمعايير الدولية خطوةً بخطوة.',
    },
    seo: {
      title: {
        en: 'About Altamiuz | Information security consultancy',
        ar: 'من نحن | شركة التميز لاستشارات أمن المعلومات',
      },
      description: {
        en: 'Altamiuz is a Libyan information security consultancy that guides organisations, step by step, towards international standards.',
        ar: 'شركة التميز شركة ليبية لاستشارات أمن المعلومات، ترافق المؤسسات خطوةً بخطوة نحو الالتزام بالمعايير الدولية.',
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

/**
 * About page (2026-11-13): rewritten from the owner-supplied legacy text
 * (docs/content/legacy-about.md), reordered and tightened. Claim-free statements are visible in
 * the draft; facts that need evidence (legal form, founding year, head office, licence, people,
 * experience figures, partners) are hidden "Pending" sections or stay out of the CMS until an
 * evidence-gated block can hold them. All of it awaits CD-11 approval and native review.
 */
export const about = {
  intro: {
    eyebrow: { en: 'Who we are', ar: 'من نحن' },
    heading: { en: 'A Libyan partner for information security', ar: 'شريك ليبي في أمن المعلومات' },
    body: {
      en: [
        'Altamiuz is a Libyan information security consultancy. We help public and private organisations comply with international information security standards and with the local policies that apply to them, drawing on our own local expertise and, where a project needs it, on established Arab and international firms in the field.',
        'We act as a local project management office for our clients: present throughout the engagement, and guiding them step by step towards international certification at a proportionate cost.',
      ],
      ar: [
        'شركة التميز شركة ليبية لاستشارات أمن المعلومات. نساعد الجهات العامة والخاصة على الالتزام بالمعايير الدولية لأمن المعلومات وبالسياسات المحلية المتعلقة بها، معتمدين على خبراتنا المحلية، وعلى التعاون مع شركات عربية ودولية متميزة في هذا المجال حين يتطلب المشروع ذلك.',
        'ونؤدي لعملائنا دور مكتب إدارة مشروعات محلي يرافقهم طوال المهمة، ويوجههم خطوةً بخطوة نحو الحصول على شهادة الالتزام الدولية بتكلفة مناسبة.',
      ],
    },
  },
  vision: {
    eyebrow: { en: 'Our vision', ar: 'رؤيتنا' },
    heading: {
      en: 'One home for Libya’s information security expertise',
      ar: 'مظلة واحدة لخبرات أمن المعلومات في ليبيا',
    },
    body: {
      en: [
        'Our vision is to be the local partner our clients rely on for effective information security, and to bring Libya’s leading expertise together in one organisation: a single place for the solutions, services and qualified people the Libyan market needs.',
        'We keep an open door to every organisation in Libya’s telecommunications and IT sector. We welcome cooperation in whatever form suits a partner, set out in agreements that protect the rights of our clients.',
      ],
      ar: [
        'رؤيتنا أن نكون الشريك المحلي الذي يعتمد عليه عملاؤنا في حلول أمن المعلومات الفعّالة، وأن نجمع أبرز الخبرات في ليبيا في مؤسسة واحدة تكون مظلةً تقدّم الحلول والخدمات والكفاءات المؤهلة التي يحتاجها السوق الليبي.',
        'ونعتمد سياسة الباب المفتوح مع جميع الجهات العاملة في قطاع الاتصالات وتقنية المعلومات في ليبيا، ونرحّب بالتعاون بالصيغة التي يراها الشريك مناسبة، على أن يُنظَّم باتفاقيات تحفظ حقوق عملائنا.',
      ],
    },
  },
  approach: {
    eyebrow: { en: 'How we work', ar: 'كيف نعمل' },
    heading: { en: 'Understanding comes before solutions', ar: 'الفهم يسبق الحلول' },
    items: [
      {
        icon: 'policy',
        title: { en: 'Management and clarity first', ar: 'الإدارة ووضوح العمليات أولاً' },
        text: {
          en: 'A project succeeds or fails on how it is managed and how clear its processes are. Technical work and tools support that success; they do not replace it.',
          ar: 'يتوقف نجاح المشروع أو إخفاقه على إدارته ووضوح سير عملياته، أما الأعمال الفنية والأدوات التقنية فوسائل تعين على هذا النجاح ولا تغني عنه.',
        },
      },
      {
        icon: 'audit',
        title: { en: 'Understand before solving', ar: 'نفهم قبل أن نعالج' },
        text: {
          en: 'We study each problem, analyse its effects and trace its ramifications before proposing any solution.',
          ar: 'ندرس كل مشكلة ونحلل آثارها ونتتبع تشعباتها قبل أن نقترح أي حل.',
        },
      },
      {
        icon: 'risk',
        title: {
          en: 'Threats, weaknesses and risks, explained',
          ar: 'التهديدات ونقاط الضعف والمخاطر بوضوح',
        },
        text: {
          en: 'Most of our time goes into understanding and explaining the threats you face, the weaknesses they exploit and the risks that follow.',
          ar: 'نخصص معظم وقتنا لفهم التهديدات التي تواجهك وتفسيرها، ونقاط الضعف التي تستغلها، والمخاطر المترتبة عليها.',
        },
      },
      {
        icon: 'shield',
        title: { en: 'With you, step by step', ar: 'معك خطوةً بخطوة' },
        text: {
          en: 'As your local project office, we stay with you through every stage until the standard is met.',
          ar: 'بصفتنا مكتب مشروعاتك المحلي، نرافقك في كل مرحلة حتى تستوفي متطلبات المعيار.',
        },
      },
    ],
  },
  values: {
    eyebrow: { en: 'Our values', ar: 'قيمنا' },
    heading: { en: 'What we hold to', ar: 'ما نلتزم به' },
    items: [
      {
        icon: 'audit',
        title: { en: 'Integrity', ar: 'النزاهة' },
        text: {
          en: 'We report what we find as it is, with the evidence behind it.',
          ar: 'ننقل ما نجده كما هو، مع الدليل الذي يستند إليه.',
        },
      },
      {
        icon: 'response',
        title: { en: 'Openness', ar: 'الانفتاح' },
        text: {
          en: 'We are open to cooperation with clients and partners, and clear about how we work.',
          ar: 'نحن منفتحون على التعاون مع العملاء والشركاء، وواضحون في طريقة عملنا.',
        },
      },
      {
        icon: 'policy',
        title: { en: 'Continuous improvement', ar: 'التحسين المستمر' },
        text: {
          en: 'Every engagement leaves a plan you can keep improving against.',
          ar: 'تترك كل مهمة خطةً يمكنك مواصلة التحسين على أساسها.',
        },
      },
    ],
  },
  /** Supplied by the owner; shown only after CD-01/CD-02 confirmation (hidden in the draft). */
  company: {
    en: 'Altamiuz is a Libyan limited liability company, founded in 2020 and headquartered in Tripoli.',
    ar: 'شركة التميز للاستشارات وأمن المعلومات شركة ليبية ذات مسؤولية محدودة، تأسست عام 2020 ومقرها الرئيسي في طرابلس.',
  },
  /** The legacy "How can we secure you?" capabilities: titles only until CD-04 defines them. */
  capabilities: [
    { icon: 'shield', title: { en: 'Monitoring', ar: 'المراقبة' } },
    { icon: 'response', title: { en: 'Response', ar: 'الاستجابة' } },
    { icon: 'shield', title: { en: 'Protection', ar: 'الحماية' } },
    { icon: 'policy', title: { en: 'Compliance', ar: 'الالتزام' } },
  ],
} as const

/** Pending dependencies, used as hidden-section labels (admin only). */
export const pending = {
  company:
    'CD-01 legal name and registration; CD-02 founding year and head office (supplied 2026-11-13, unhide once confirmed; the licence no. and Chamber registration go in a Credentials block with evidence, not here)',
  capabilities:
    'CD-04 service catalogue (monitoring, response, protection, compliance as services)',
  team: 'CD-03 founder biography and credentials: add a Team block (evidence: written consent, certificates); proposed text in docs/content/legacy-about.md',
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
