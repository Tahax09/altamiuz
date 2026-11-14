// Homepage copy, Direction A (Institutional Precision): English source and Modern Standard Arabic
// adaptation. This is CMS content, loaded into the `home`-template page as a DRAFT by
// scripts/seed-homepage.ts; it is never rendered from code and never published by the script.
//
// Rules (spec "do not invent company claims"; docs/content/dependencies.md):
// - Only what the brief states is used as fact: Altamiuz is a Libyan information security
//   consultancy; the legacy site offered advisory, ISO/IEC 27001, PCI DSS and training work.
// - No history, clients, team, certifications, partnerships, accreditations or statistics.
//   Credentials and statistics blocks are NOT part of this content (CD-01, CD-05, CD-06, CD-07).
// - Sections that need missing facts are created hidden, with the dependency in `blockName`
//   (an admin-only label), so they cannot go live by accident when the page is published.
// - The Arabic company name is CD-01; until it is approved the Latin "Altamiuz" is used in Arabic.
// - All copy awaits approval and translation review (CD-11) before the page is published.

export type Locale = 'en' | 'ar'
type L = Record<Locale, string>

export const illustrations = {
  hero: {
    file: 'hero.svg',
    alt: {
      en: 'Line drawing in plan view: three nested boundaries around an organisation’s systems, with controlled entry points and monitored connections leading to the core assets.',
      ar: 'رسم خطي بمسقط أفقي: ثلاثة حدود متداخلة تحيط بأنظمة مؤسسة، مع نقاط دخول مضبوطة واتصالات مراقَبة تقود إلى الأصول الأساسية.',
    },
  },
  introduction: {
    file: 'introduction.svg',
    alt: {
      en: 'Architectural floor plan of an organisation with dimensioned walls; each door and access point is marked for review.',
      ar: 'مخطط معماري لمؤسسة بجدران محددة الأبعاد، وقد عُلِّم كل باب ونقطة وصول فيه للمراجعة.',
    },
  },
  methodology: {
    file: 'methodology.svg',
    alt: {
      en: 'Four panels on one timeline: a focus ring over a mapped area, a grid with marked cells, a stepped schedule, and a closed loop around a core, for Understand, Assess, Plan and Support.',
      ar: 'أربع لوحات على خط زمني واحد: دائرة تركيز فوق منطقة مرسومة، وشبكة بخلايا معلَّمة، وجدول زمني متدرج، وحلقة مغلقة حول نواة، تمثل الفهم والتقييم والتخطيط والدعم.',
    },
  },
} as const

export const page = {
  title: { en: 'Home', ar: 'الرئيسية' } satisfies L,
  slug: { en: 'home', ar: 'الرئيسية' } satisfies L,
  seo: {
    title: {
      en: 'Altamiuz | Information security consultancy',
      ar: 'Altamiuz | استشارات أمن المعلومات',
    } satisfies L,
    description: {
      en: 'Information security consultancy in Libya: understand your risks, assess controls against recognised standards and plan the improvements that matter most.',
      ar: 'استشارات أمن المعلومات في ليبيا: افهم مخاطرك، وقيّم ضوابطك وفق معايير معترف بها، وخطط للتحسينات الأهم.',
    } satisfies L,
  },
}

/** Section text, in the approved homepage order. `pending` = hidden until the named input exists. */
export const sections = {
  hero: {
    eyebrow: { en: 'Information security consultancy', ar: 'استشارات أمن المعلومات' },
    heading: {
      en: 'Security decisions grounded in evidence',
      ar: 'قرارات أمنية تستند إلى الأدلة',
    },
    subheading: {
      en: 'Altamiuz helps organisations in Libya understand their information security risks, assess their controls against recognised standards, and plan the improvements that matter most.',
      ar: 'تساعد Altamiuz المؤسساتِ في ليبيا على فهم مخاطر أمن المعلومات لديها، وتقييم ضوابطها وفق معايير معترف بها، والتخطيط للتحسينات الأكثر أهمية.',
    },
    cta: { en: 'Discuss your requirements', ar: 'ناقش احتياجاتك معنا' },
  },
  introduction: {
    eyebrow: { en: 'About Altamiuz', ar: 'عن Altamiuz' },
    heading: {
      en: 'A structured view of your security posture',
      ar: 'رؤية منهجية لوضعك الأمني',
    },
    body: {
      en: [
        'Altamiuz is a Libyan information security consultancy. We work with management and technical teams to establish where an organisation stands, what its obligations require, and which risks deserve attention first.',
        'Each engagement ends with documented findings and a prioritised plan that your teams can act on and track over time.',
      ],
      ar: [
        'Altamiuz شركة ليبية لاستشارات أمن المعلومات. نعمل مع الفرق الإدارية والتقنية لتحديد موقع المؤسسة الحالي، وما تفرضه عليها التزاماتها، وأي المخاطر أولى بالمعالجة.',
        'تنتهي كل مهمة بنتائج موثقة وخطة مرتبة حسب الأولوية، يمكن لفرقكم تنفيذها ومتابعتها مع الوقت.',
      ],
    },
  },
  services: {
    // Shown since C-1: the section lists published services and renders nothing without them.
    eyebrow: { en: 'Services', ar: 'الخدمات' },
    heading: { en: 'Advisory, assessment and training', ar: 'الاستشارات والتقييم والتدريب' },
    intro: {
      en: 'Engagements are scoped to your organisation’s size, sector and obligations.',
      ar: 'يُحدَّد نطاق كل مهمة وفق حجم مؤسستك وقطاعها والتزاماتها.',
    },
    more: { en: 'All services', ar: 'جميع الخدمات' },
  },
  training: {
    eyebrow: { en: 'Training', ar: 'الدورات التدريبية' },
    heading: {
      en: 'Training to protect you and your organisation',
      ar: 'دورات وبرامج تدريبية لحمايتك وحماية مؤسستك',
    },
    intro: {
      en: 'Courses in information security management, business continuity, risk and awareness, in Arabic and English.',
      ar: 'دورات في إدارة أمن المعلومات واستمرارية الأعمال والمخاطر والتوعية الأمنية، باللغتين العربية والإنجليزية.',
    },
    more: { en: 'All courses', ar: 'جميع الدورات' },
  },
  why: {
    eyebrow: { en: 'Why Altamiuz', ar: 'لماذا Altamiuz' },
    heading: { en: 'How we approach the work', ar: 'كيف نتناول العمل' },
    items: [
      {
        icon: 'audit',
        title: { en: 'Evidence before opinion', ar: 'الدليل قبل الرأي' },
        text: {
          en: 'Findings are traced to the documents, configurations and interviews they come from, so they can be checked and revisited.',
          ar: 'تُنسب كل نتيجة إلى الوثائق والإعدادات والمقابلات التي استُخلصت منها، ليتسنى التحقق منها والرجوع إليها.',
        },
      },
      {
        icon: 'risk',
        title: { en: 'Priorities set by risk', ar: 'أولويات تحددها المخاطر' },
        text: {
          en: 'Recommendations are ordered by their effect on your risk, not by the length of a checklist.',
          ar: 'تُرتَّب التوصيات بحسب أثرها في المخاطر التي تواجهك، لا بحسب طول قائمة التحقق.',
        },
      },
      {
        icon: 'policy',
        title: { en: 'Standards applied in context', ar: 'معايير تُطبَّق في سياقها' },
        text: {
          en: 'Requirements from recognised frameworks are interpreted for your organisation’s size, sector and obligations.',
          ar: 'تُفسَّر متطلبات الأطر المعترف بها بما يناسب حجم مؤسستك وقطاعها والتزاماتها.',
        },
      },
      {
        icon: 'response',
        title: { en: 'Plans you can carry out', ar: 'خطط قابلة للتنفيذ' },
        text: {
          en: 'Each plan names owners, sequence and the resources it needs, and stays usable after the engagement ends.',
          ar: 'تحدد كل خطة المسؤولين والتسلسل والموارد اللازمة، وتبقى صالحة للاستخدام بعد انتهاء المهمة.',
        },
      },
    ],
  },
  methodology: {
    eyebrow: { en: 'Methodology', ar: 'المنهجية' },
    heading: {
      en: 'Four stages, each with defined outputs',
      ar: 'أربع مراحل لكل منها مخرجات محددة',
    },
    intro: {
      en: 'Progress is visible at every step, and each stage builds on the evidence gathered in the one before.',
      ar: 'يظهر التقدم في كل خطوة، وتبني كل مرحلة على الأدلة التي جُمعت في المرحلة التي تسبقها.',
    },
    steps: [
      {
        title: { en: 'Understand', ar: 'الفهم' },
        text: {
          en: 'We map your context, assets, obligations and current controls before forming any view.',
          ar: 'نرسم صورة سياقك وأصولك والتزاماتك وضوابطك الحالية قبل أن نكوّن أي رأي.',
        },
      },
      {
        title: { en: 'Assess', ar: 'التقييم' },
        text: {
          en: 'We examine controls against the agreed scope and recognised criteria, and record each finding with its evidence.',
          ar: 'نفحص الضوابط وفق النطاق المتفق عليه والمعايير المعترف بها، ونوثق كل نتيجة مع دليلها.',
        },
      },
      {
        title: { en: 'Plan', ar: 'التخطيط' },
        text: {
          en: 'We turn findings into a prioritised roadmap with owners, sequence and measurable milestones.',
          ar: 'نحوّل النتائج إلى خارطة طريق مرتبة حسب الأولوية، تحدد المسؤولين والتسلسل ومعالم قابلة للقياس.',
        },
      },
      {
        title: { en: 'Support', ar: 'الدعم' },
        text: {
          en: 'We support implementation and review progress, adjusting the plan as your environment changes.',
          ar: 'ندعم التنفيذ ونراجع التقدم، ونعدّل الخطة كلما تغيّرت بيئتك.',
        },
      },
    ],
  },
  standards: {
    pending: 'CD-06 confirmation of the standards cited and their current editions',
    eyebrow: { en: 'Standards and frameworks', ar: 'المعايير والأطر' },
    heading: { en: 'Frameworks our work references', ar: 'الأطر التي يستند إليها عملنا' },
    intro: {
      en: 'Editions are stated so that requirements are applied as currently published. Referencing a framework is not a claim of certification.',
      ar: 'نذكر الإصدارات لتُطبَّق المتطلبات كما هي منشورة حالياً. والإشارة إلى إطار ما لا تعني ادعاء الحصول على شهادة فيه.',
    },
    // Descriptions are the standards' own scope statements, not claims about Altamiuz.
    items: [
      {
        name: { en: 'ISO/IEC 27001:2022', ar: 'ISO/IEC 27001:2022' },
        text: {
          en: 'Information security management systems: requirements.',
          ar: 'أنظمة إدارة أمن المعلومات: المتطلبات.',
        },
      },
      {
        name: { en: 'PCI DSS v4.0.1', ar: 'PCI DSS v4.0.1' },
        text: {
          en: 'Payment Card Industry Data Security Standard: requirements for protecting payment account data.',
          ar: 'معيار أمن بيانات صناعة بطاقات الدفع: متطلبات حماية بيانات حسابات الدفع.',
        },
      },
    ],
  },
  expertise: {
    pending:
      'CD-03 team expertise and biographies; CD-07 experience claims with evidence (a stats block needs verified evidence)',
    eyebrow: { en: 'Expertise and experience', ar: 'الخبرة والتجربة' },
    heading: { en: 'Expertise and experience', ar: 'الخبرة والتجربة' },
  },
  insights: {
    pending: 'published insight pages (legacy /blog/ content, CD-11 approval, CD-12 mapping)',
    eyebrow: { en: 'Insights and resources', ar: 'رؤى وموارد' },
    heading: { en: 'Insights and resources', ar: 'رؤى وموارد' },
    intro: {
      en: 'Practical guidance on information security, published in Arabic and English.',
      ar: 'إرشادات عملية في أمن المعلومات، تُنشر باللغتين العربية والإنجليزية.',
    },
  },
  contact: {
    heading: { en: 'Discuss your security requirements', ar: 'ناقش متطلباتك الأمنية' },
    text: {
      en: 'Send us a short description of your organisation and what you need to achieve, and we will arrange an initial conversation.',
      ar: 'أرسل إلينا وصفاً موجزاً لمؤسستك وما تسعى إلى تحقيقه، وسنرتب معك محادثة أولية.',
    },
    cta: { en: 'Contact Altamiuz', ar: 'تواصل مع Altamiuz' },
  },
} as const
