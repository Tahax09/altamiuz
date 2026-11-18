// C-1 catalogue drafts: services, training programmes and the first insight article, rewritten
// in Arabic and English from the legacy site text the owner supplied on 2026-11-14
// (docs/content/legacy-site-content.md). Draft copy for approval (CD-04, CD-05, CD-11); nothing is
// published by the seed.
//
// Left out on purpose, because each is a claim that needs evidence or an owner decision first:
// experience figures ("over thirty years", "over 20 years", "over 25 years"), named partners and
// their roles (ZeroChance, DataProtect, Intracom), PECB accreditation and exam eligibility (CD-05),
// the founder's history (CD-03), the free "Aman+" programme "since 2013", direct manufacturer
// pricing claims, and superseded standard editions (ISO/IEC 27001:2013, ISO 22301:2012). Standard
// names carry no edition year; the edition is confirmed under CD-06.
import type { ICON_NAMES } from '../../src/modules/content/blocks'

type IconName = (typeof ICON_NAMES)[number]

export type Locale = 'en' | 'ar'
type L = Record<Locale, string>
type Paras = Record<Locale, string[]>

export type CatalogueItem = {
  key: string
  slug: L
  title: L
  summary: L
  icon: IconName
  body: Paras
}

/** Course facts from the legacy course pages (www.altamiuz.ly/training_courses/…, re-read
 *  2026-11-18), confirmed by the owner (content/attestation.ts). */
export type CourseFacts = {
  duration: { value: number; unit: 'hours' | 'days' }
  format: 'in-person'
  provider: L
  /** Claim: needs verified evidence (owner attestation) to publish. */
  accreditation?: L
  details: { en: readonly string[]; ar: readonly string[] }
}
export type CourseItem = CatalogueItem & { audience?: L; facts?: CourseFacts }

const PECB_PACK = (days: { en: string; ar: string }) => ({
  en: [
    `Duration: ${days.en}, six hours a day.`,
    'Course pack: the PECB-accredited curriculum, a certificate of attendance, and the PECB certificate after passing the exam.',
    'Exam entry and a re-sit are free.',
    'The course can also be delivered in Turkey; venue, travel and accommodation are quoted separately.',
  ],
  ar: [
    `مدة الدورة ${days.ar} بواقع 6 ساعات يومياً.`,
    'الحقيبة التدريبية: المنهج المعتمد من PECB، وشهادة حضور، وشهادة الاعتماد بعد اجتياز الامتحان.',
    'الدخول إلى الامتحان وإعادته مجاناً.',
    'يمكن تقديم الدورة في تركيا، وتُقدَّم تكاليف القاعات والسفر والإقامة في عرض منفصل.',
  ],
})
const ALTAMIUZ = { en: 'Altamiuz', ar: 'شركة التميز' }
const PECB_ACCREDITED = { en: 'Accredited by PECB', ar: 'دورة معتمدة من PECB' }

export const services: CatalogueItem[] = [
  {
    key: 'consulting',
    slug: { en: 'security-consulting', ar: 'الاستشارات-الأمنية' },
    title: {
      en: 'IT, telecommunications and information security consulting',
      ar: 'الاستشارات في تقنية المعلومات والاتصالات وأمن المعلومات',
    },
    summary: {
      en: 'Independent advice on technology and security projects, from planning to delivery, so decisions save effort, time and budget.',
      ar: 'استشارات مستقلة لمشاريع التقنية والأمن من التخطيط حتى التنفيذ، لقرارات توفر الجهد والوقت والميزانية.',
    },
    icon: 'policy',
    body: {
      en: [
        'We advise public and private organisations on information technology, telecommunications and information security projects. The aim is simple: decisions that save effort, time and budget.',
        'Our consultants work with your management and technical teams and with the other parties in a project, and advise on recognised international good practice for delivering it.',
      ],
      ar: [
        'نقدم الاستشارات للجهات العامة والخاصة في مشاريع تقنية المعلومات والاتصالات وأمن المعلومات، بهدف واضح: قرارات توفر الجهد والوقت والميزانية.',
        'يعمل مستشارونا مع فرقكم الإدارية والتقنية ومع بقية أطراف المشروع، ويقدمون النصح وفق أفضل الممارسات الدولية المعترف بها لإنجازه.',
      ],
    },
  },
  {
    key: 'research',
    slug: { en: 'security-research', ar: 'الأبحاث-الأمنية' },
    title: {
      en: 'Security research, including physical security',
      ar: 'الأبحاث الأمنية بما فيها الأمن المادي',
    },
    summary: {
      en: 'Research and briefings on current developments in communications, IT and physical security, for civil and defence organisations.',
      ar: 'أبحاث وإحاطات حول المستجدات في أمن الاتصالات وتقنية المعلومات والأمن المادي، للقطاعين المدني والعسكري.',
    },
    icon: 'risk',
    body: {
      en: [
        'We prepare and deliver security research for civil and defence organisations, covering communications and IT security as well as physical security.',
        'Because advising a wide range of clients is our day-to-day work, rather than running operations, we follow international developments closely and bring them to you in a form your teams can use.',
      ],
      ar: [
        'نعد ونقدم الأبحاث الأمنية للجهات المدنية والعسكرية، في أمن الاتصالات وتقنية المعلومات وفي الأمن المادي.',
        'ولأن تقديم الاستشارات لطيف واسع من العملاء هو عملنا اليومي، لا تشغيل الأنظمة، فإننا نتابع المستجدات الدولية عن قرب ونقدمها لكم بصورة تستطيع فرقكم الاستفادة منها.',
      ],
    },
  },
  {
    key: 'specifications',
    slug: { en: 'technical-specifications', ar: 'المواصفات-الفنية' },
    title: {
      en: 'Technical specifications and tender documents',
      ar: 'إعداد ومراجعة المواصفات الفنية',
    },
    summary: {
      en: 'Preparing and reviewing technical specifications, requests for proposals and technical offers in IT, telecommunications and security.',
      ar: 'إعداد ومراجعة المواصفات الفنية وطلبات العروض والعروض الفنية في تقنية المعلومات والاتصالات وأمن المعلومات.',
    },
    icon: 'policy',
    body: {
      en: [
        'We prepare and review technical specifications for information technology, telecommunications and information security purchases.',
        'This includes precise requests for proposals, and the study and evaluation of the technical offers you receive, so that what you buy matches what you need.',
      ],
      ar: [
        'نعد ونراجع المواصفات الفنية لمشتريات تقنية المعلومات والاتصالات وأمن المعلومات.',
        'ويشمل ذلك إعداد وثائق دقيقة لطلبات العروض، ودراسة العروض الفنية التي تصلكم وتقييمها، ليطابق ما تشترونه ما تحتاجونه فعلا.',
      ],
    },
  },
  {
    key: 'iso27001',
    slug: { en: 'iso-27001-implementation', ar: 'تطبيق-آيزو-27001' },
    title: {
      en: 'ISO/IEC 27001 information security management system',
      ar: 'تطبيق نظام إدارة أمن المعلومات ISO/IEC 27001',
    },
    summary: {
      en: 'Help to implement an information security management system to ISO/IEC 27001: requirements, risk treatment and controls, within your budget and timeline.',
      ar: 'المساعدة في تطبيق نظام إدارة أمن المعلومات وفق ISO/IEC 27001: المتطلبات ومعالجة المخاطر والضوابط، ضمن ميزانيتكم وجدولكم الزمني.',
    },
    icon: 'shield',
    body: {
      en: [
        'ISO/IEC 27001 is the international standard for managing information security. Its approach is risk management: find what could go wrong with your information, then treat those risks systematically.',
        'Our engineers help Libyan organisations cover the requirements of the standard and implement the controls listed in the statement of applicability, putting each protection in the right place, within your budget and timeline.',
      ],
      ar: [
        'المعيار ISO/IEC 27001 هو المعيار الدولي لإدارة أمن المعلومات، وفلسفته إدارة المخاطر: تحديد ما قد يصيب معلوماتكم، ثم معالجة تلك المخاطر بطريقة منهجية.',
        'يساعد مهندسونا المؤسسات الليبية على تغطية متطلبات المعيار وتنفيذ الضوابط الواردة في بيان التطبيق، بحيث توضع كل وسيلة حماية في مكانها المناسب، ضمن ميزانيتكم وجدولكم الزمني.',
      ],
    },
  },
  {
    key: 'iso22301',
    slug: { en: 'iso-22301-business-continuity', ar: 'استمرارية-الأعمال-آيزو-22301' },
    title: {
      en: 'ISO 22301 business continuity management',
      ar: 'تطبيق نظام إدارة استمرارية الأعمال ISO 22301',
    },
    summary: {
      en: 'Help to implement a business continuity management system to ISO 22301, so critical services keep running through disruption.',
      ar: 'المساعدة في تطبيق نظام إدارة استمرارية الأعمال وفق ISO 22301، لتستمر الخدمات الحيوية أثناء الأزمات والانقطاعات.',
    },
    icon: 'response',
    body: {
      en: [
        'ISO 22301 sets out how an organisation prepares for, responds to and recovers from disruption.',
        'We work with your engineers to cover the requirements of the standard, from impact analysis to continuity plans and exercises, and to put the right measures in place within your budget and timeline.',
      ],
      ar: [
        'يحدد المعيار ISO 22301 كيف تستعد المؤسسة للانقطاعات والأزمات وتستجيب لها وتتعافى منها.',
        'نعمل مع مهندسيكم لتغطية متطلبات المعيار، من تحليل الأثر إلى خطط الاستمرارية والتمارين عليها، ووضع الإجراءات المناسبة في مكانها ضمن ميزانيتكم وجدولكم الزمني.',
      ],
    },
  },
  {
    key: 'pcidss',
    slug: { en: 'pci-dss-compliance', ar: 'الالتزام-بمعيار-pci-dss' },
    title: {
      en: 'PCI DSS compliance',
      ar: 'تنفيذ متطلبات معيار PCI DSS',
    },
    summary: {
      en: 'Support for organisations that store, process or transmit cardholder data: gap assessment, risk management, evidence and remediation.',
      ar: 'دعم الجهات التي تخزن بيانات حاملي البطاقات أو تعالجها أو تنقلها: تقييم الفجوات وإدارة المخاطر وجمع الأدلة والمعالجة.',
    },
    icon: 'shield',
    body: {
      en: [
        'The Payment Card Industry Data Security Standard (PCI DSS) protects cardholder data. It applies to every party that stores, processes or transmits that data, from points of sale and merchants to issuers, service providers and acquiring banks.',
        'We help Libyan organisations through each step of compliance: an initial assessment, risk management, collecting evidence, vulnerability testing, and then remediation, putting protections in place within your budget and timeline.',
      ],
      ar: [
        'يهدف معيار أمن بيانات صناعة بطاقات الدفع (PCI DSS) إلى حماية بيانات حاملي البطاقات، وينطبق على كل جهة تخزن تلك البيانات أو تعالجها أو تنقلها، من نقاط البيع والتجار إلى المصدرين ومقدمي الخدمات والمصارف المستحوذة.',
        'نساعد المؤسسات الليبية في كل خطوة من خطوات الالتزام: التقييم الأولي، وإدارة المخاطر، وجمع الأدلة، واختبار نقاط الضعف، ثم المعالجة ووضع وسائل الحماية في مكانها ضمن ميزانيتكم وجدولكم الزمني.',
      ],
    },
  },
  {
    key: 'audit',
    slug: { en: 'information-security-audit', ar: 'التدقيق-على-أمن-المعلومات' },
    title: {
      en: 'Information security audit',
      ar: 'التدقيق على أمن المعلومات',
    },
    summary: {
      en: 'An audit of how security is organised and run: structure, processes, staff skills, administrative and physical security, against international good practice.',
      ar: 'تدقيق على تنظيم أمن المعلومات وتشغيله: الهيكل والعمليات وكفاءات الموظفين والأمن الإداري والمادي، وفق أفضل الممارسات الدولية.',
    },
    icon: 'audit',
    body: {
      en: [
        'Our audit looks at how information security is organised and run in your organisation: the structure of security departments and units, how work flows and how accurately, staff skills, administrative and physical security, and operations.',
        'Each finding is measured against international good practice for protecting critical assets, and the report sets out what to fix first.',
      ],
      ar: [
        'يتناول التدقيق كيفية تنظيم أمن المعلومات وتشغيله في مؤسستكم: بنية إدارات ووحدات أمن المعلومات، وسير الأعمال ودقتها، وخبرات الموظفين وكفاءاتهم، والأمن الإداري والمادي، والعمليات.',
        'تقاس كل ملاحظة بأفضل الممارسات الدولية لحماية الأصول الحيوية، ويبين التقرير ما يجب إصلاحه أولا.',
      ],
    },
  },
  {
    key: 'vapt',
    slug: {
      en: 'vulnerability-assessment-penetration-testing',
      ar: 'تقييم-نقاط-الضعف-واختبار-الاختراق',
    },
    title: {
      en: 'Vulnerability assessment and penetration testing',
      ar: 'تقييم نقاط الضعف واختبار الاختراق',
    },
    summary: {
      en: 'Find weaknesses before attackers do: a vulnerability assessment reports them; a penetration test safely shows what they allow, within an agreed scope.',
      ar: 'اكتشاف الثغرات قبل المهاجمين: يرصدها تقييم نقاط الضعف، ويبين اختبار الاختراق بأمان ما تتيحه، ضمن نطاق متفق عليه.',
    },
    icon: 'risk',
    body: {
      en: [
        'We offer both services to civil and defence organisations in Libya. A vulnerability assessment examines the systems in scope and reports their weaknesses, based on evidence gathered from those systems and devices.',
        'A penetration test goes further: an ethical tester exploits the weaknesses to show their real impact, under control, within a defined scope and only with your written approval.',
      ],
      ar: [
        'نقدم الخدمتين للجهات المدنية والعسكرية في ليبيا. يفحص تقييم نقاط الضعف الأنظمة المشمولة ويقدم تقريرا بنقاط ضعفها، استنادا إلى مؤشرات تستخرج من تلك الأنظمة والمعدات.',
        'أما اختبار الاختراق فيذهب أبعد من ذلك: يستغل المختبر الأخلاقي نقاط الضعف ليبين أثرها الفعلي، تحت السيطرة وفي نطاق محدد وبموافقة مكتوبة منكم فقط.',
      ],
    },
  },
  {
    key: 'crypto',
    slug: { en: 'cryptography-consulting', ar: 'استشارات-التشفير' },
    title: {
      en: 'Cryptography and protection systems consulting',
      ar: 'الاستشارات الخاصة بنظم التشفير والحماية',
    },
    summary: {
      en: 'Advice on encryption and on protecting information carried over wired and wireless communications.',
      ar: 'استشارات في التشفير وفي حماية المعلومات المنقولة عبر الاتصالات السلكية واللاسلكية.',
    },
    icon: 'shield',
    body: {
      en: [
        'We advise on cryptographic systems and on protecting information carried over wired and wireless communications: choosing and assessing encryption, how keys are managed, and how protection equipment fits into your networks.',
      ],
      ar: [
        'نقدم الاستشارات في نظم التشفير وحماية المعلومات المنقولة عبر الاتصالات السلكية واللاسلكية: اختيار وسائل التشفير وتقييمها، وإدارة المفاتيح، وكيفية دمج معدات الحماية في شبكاتكم.',
      ],
    },
  },
  {
    key: 'awareness',
    slug: { en: 'security-awareness', ar: 'التوعية-الأمنية' },
    title: {
      en: 'Security awareness programmes',
      ar: 'برامج التوعية الأمنية',
    },
    summary: {
      en: 'Training and awareness are the first line of defence. We design and deliver awareness courses for staff at every level.',
      ar: 'التدريب والتوعية هما خط الدفاع الأول. نصمم ونقدم دورات التوعية الأمنية للموظفين على جميع المستويات.',
    },
    icon: 'training',
    body: {
      en: [
        'Training and awareness are the first line of defence. We design and deliver security awareness courses for any organisation that wants them, with care for both the content and how it is presented.',
        'Courses are delivered by trainers with teaching experience, in Arabic or English.',
      ],
      ar: [
        'التدريب والتوعية هما خط الدفاع الأول. نصمم ونقدم دورات التوعية الأمنية لكل الجهات الراغبة، مع عناية بالمحتوى وبطريقة تقديمه.',
        'يقدم الدورات مدربون ذوو خبرة في التدريس، باللغة العربية أو الإنجليزية.',
      ],
    },
  },
  {
    key: 'radio',
    slug: { en: 'secure-wireless-communications', ar: 'الاتصالات-اللاسلكية-المؤمنة' },
    title: {
      en: 'Military wireless communications consulting (encrypted and open)',
      ar: 'الاستشارات في نظم الاتصالات اللاسلكية العسكرية (المشفرة والمفتوحة)',
    },
    summary: {
      en: 'Consulting for military and security bodies in Libya on wireless communications and their protection, from requirements to supply terms.',
      ar: 'استشارات للجهات العسكرية والأمنية في ليبيا في نظم الاتصالات اللاسلكية وحمايتها، من تحديد المتطلبات إلى شروط التوريد.',
    },
    icon: 'response',
    body: {
      en: [
        'Libyan consultants in military communications and protection systems advise military and security bodies in Libya on encrypted and open wireless communications.',
        'We help define requirements, deal directly with manufacturers to protect sensitive information and public funds, and secure sound supply terms, including training, maintenance and spare parts.',
      ],
      ar: [
        'يقدم مستشارون ليبيون في الاتصالات العسكرية ونظم الحماية استشاراتهم للجهات العسكرية والأمنية داخل ليبيا في نظم الاتصالات اللاسلكية المشفرة والمفتوحة.',
        'نساعد في تحديد المتطلبات، والتعامل المباشر مع المصنعين حفاظا على المعلومات الحساسة والمال العام، وضمان شروط توريد سليمة تشمل التدريب والصيانة وقطع الغيار.',
      ],
    },
  },
]

// The legacy "programmes" list, with the three detailed course texts folded into their entries.
// Duration, format, provider and PECB accreditation for the three legacy course pages (owner
// confirmed 2026-11-18); the other programmes had no detail page and carry none.
export const courses: CourseItem[] = [
  {
    key: 'isms-intro',
    slug: { en: 'iso-27001-introduction', ar: 'مقدمة-آيزو-27001' },
    title: {
      en: 'ISO/IEC 27001 Introduction',
      ar: 'مقدمة في نظام إدارة أمن المعلومات ISO/IEC 27001',
    },
    summary: {
      en: 'What an information security management system is, the principles behind it, and what ISO/IEC 27001 requires.',
      ar: 'ما هو نظام إدارة أمن المعلومات، والمبادئ التي يقوم عليها، وما يتطلبه المعيار ISO/IEC 27001.',
    },
    icon: 'training',
    facts: {
      duration: { value: 1, unit: 'days' },
      format: 'in-person',
      provider: ALTAMIUZ,
      details: {
        en: [
          'Duration: one day, six hours over two sessions.',
          'Course pack: the presentation, and an Altamiuz certificate of attendance for participants who pass the end-of-course test.',
        ],
        ar: [
          'مدة الدورة يوم واحد بواقع 6 ساعات على محاضرتين.',
          'الحقيبة التدريبية: العرض التقديمي، وشهادة حضور من شركة التميز لمن يجتاز امتحان نهاية الدورة.',
        ],
      },
    },
    audience: {
      en: 'Managers and staff new to information security management',
      ar: 'المديرون والموظفون الجدد على إدارة أمن المعلومات',
    },
    body: {
      en: [
        'This course explains the information security management system (ISMS) in detail: the principles of information security and how they meet management systems and processes to form one framework that supports both long-term and day-to-day decisions.',
        'Participants gain a clear understanding of the requirements of ISO/IEC 27001, how the standard affects people, organisations and their partners, the main parts of the ISO/IEC 27000 family, the Annex A controls, and the path to certification.',
      ],
      ar: [
        'تشرح هذه الدورة نظام إدارة أمن المعلومات (ISMS) بالتفصيل: مبادئ أمن المعلومات وتقاطعها مع نظم الإدارة والعمليات لتكوين إطار متكامل يدعم القرارات على المدى الطويل وفي العمل اليومي.',
        'ويكتسب المشاركون فهما واضحا لمتطلبات المعيار ISO/IEC 27001، وتأثيره في الأفراد والمؤسسات والجهات المرتبطة بها، وأهم عناصر عائلة المعايير ISO/IEC 27000، وضوابط الملحق A، ومسار الحصول على الشهادة.',
      ],
    },
  },
  {
    key: 'isms-foundation',
    slug: { en: 'iso-27001-foundation', ar: 'أساسيات-آيزو-27001' },
    title: {
      en: 'ISO/IEC 27001 Foundation',
      ar: 'أساسيات نظام إدارة أمن المعلومات ISO/IEC 27001',
    },
    summary: {
      en: 'The core elements of implementing and managing an ISMS: policies, procedures, performance measurement, internal audit, management review and continual improvement.',
      ar: 'العناصر الأساسية لتطبيق نظام إدارة أمن المعلومات وإدارته: السياسات والإجراءات وقياس الأداء والتدقيق الداخلي ومراجعة الإدارة والتحسين المستمر.',
    },
    icon: 'training',
    facts: {
      duration: { value: 2, unit: 'days' },
      format: 'in-person',
      provider: ALTAMIUZ,
      accreditation: PECB_ACCREDITED,
      details: {
        en: [
          ...PECB_PACK({ en: 'two days', ar: '' }).en,
          'After passing the exam you can apply for the certificate under PECB’s certification rules.',
        ],
        ar: [
          ...PECB_PACK({ en: '', ar: 'يومان' }).ar,
          'بعد اجتياز الامتحان يمكنك التقدم بطلب الشهادة وفق قواعد وسياسات إصدار الشهادات لدى PECB.',
        ],
      },
    },
    body: {
      en: [
        'This course teaches the core elements of implementing and managing an information security management system as specified in ISO/IEC 27001.',
        'You will understand the building blocks of an ISMS: policies and procedures, performance measurement, management commitment, internal audit, management review and continual improvement.',
      ],
      ar: [
        'تتيح لك هذه الدورة تعلم العناصر الأساسية لتطبيق نظام إدارة أمن المعلومات وإدارته كما تحددها المواصفة الدولية ISO/IEC 27001.',
        'ستفهم المكونات الأساسية للنظام: السياسات والإجراءات، وقياس الأداء، والتزام الإدارة، والتدقيق الداخلي، ومراجعة الإدارة، والتحسين المستمر.',
      ],
    },
  },
  {
    key: 'isms-li',
    slug: { en: 'iso-27001-lead-implementer', ar: 'كبير-منفذي-آيزو-27001' },
    title: {
      en: 'ISO/IEC 27001 Lead Implementer',
      ar: 'كبير منفذي نظام إدارة أمن المعلومات ISO/IEC 27001',
    },
    summary: {
      en: 'For those who will implement, manage, maintain and improve an ISMS based on ISO/IEC 27001, or advise others on it.',
      ar: 'لمن سيتولى تطبيق نظام إدارة أمن المعلومات وإدارته وصيانته وتحسينه وفق ISO/IEC 27001، أو تقديم الاستشارات فيه.',
    },
    icon: 'training',
    facts: {
      duration: { value: 5, unit: 'days' },
      format: 'in-person',
      provider: ALTAMIUZ,
      accreditation: PECB_ACCREDITED,
      details: {
        en: [
          ...PECB_PACK({ en: 'five days', ar: '' }).en,
          'On passing the exam and meeting the certification conditions you receive a certificate of attendance and the PECB Provisional Implementer certificate; the Lead Implementer certificate follows after two years of practical ISMS implementation experience.',
        ],
        ar: [
          ...PECB_PACK({ en: '', ar: 'خمسة أيام' }).ar,
          'بعد اجتياز الامتحان واستيفاء شروط الشهادة يحصل المتدرب على شهادة حضور وشهادة المنفذ المؤقت (Provisional Implementer)، ثم شهادة كبير مسؤولي التنفيذ بعد خبرة عملية في تنفيذ نظم إدارة أمن المعلومات لمدة سنتين.',
        ],
      },
    },
    audience: {
      en: 'People who will run an ISMS, and independent consultants',
      ar: 'من سيتولون إدارة نظام أمن المعلومات، والمستشارون المستقلون',
    },
    body: {
      en: [
        'This course supports organisations that want to implement, manage, maintain and improve an information security management system based on ISO/IEC 27001, by passing the knowledge to the people who will do that work.',
        'Once the essential concepts are mastered, participants gain the skills to apply good practice that improves the performance and effectiveness of the ISMS. It also suits people who want to develop their ISMS management skills, work as independent consultants or improve their career prospects.',
      ],
      ar: [
        'تهدف هذه الدورة إلى دعم المؤسسات الراغبة في تطبيق نظام إدارة أمن المعلومات وإدارته وصيانته وتحسينه وفق المواصفة الدولية ISO/IEC 27001، من خلال نقل المعرفة إلى الأفراد الذين سيتولون هذه المهمة.',
        'وبعد إتقان المفاهيم الضرورية يكتسب المشاركون المهارات اللازمة لتطبيق أفضل الممارسات التي ترفع أداء النظام وفاعليته. كما تناسب الدورة من يرغب في تنمية مهاراته في إدارة نظم أمن المعلومات، أو العمل مستشارا مستقلا، أو تحسين فرصه الوظيفية.',
      ],
    },
  },
  {
    key: 'isms-la',
    slug: { en: 'iso-27001-lead-auditor', ar: 'كبير-مدققي-آيزو-27001' },
    title: {
      en: 'ISO/IEC 27001 Lead Auditor',
      ar: 'كبير مدققي نظام إدارة أمن المعلومات ISO/IEC 27001',
    },
    summary: {
      en: 'Planning, conducting and reporting audits of an information security management system against ISO/IEC 27001.',
      ar: 'تخطيط عمليات التدقيق على نظام إدارة أمن المعلومات وتنفيذها وإعداد تقاريرها وفق ISO/IEC 27001.',
    },
    icon: 'audit',
    body: {
      en: [
        'This course covers how to plan, conduct, report and follow up an audit of an information security management system against the requirements of ISO/IEC 27001.',
      ],
      ar: [
        'تتناول هذه الدورة كيفية تخطيط التدقيق على نظام إدارة أمن المعلومات وتنفيذه وإعداد تقريره ومتابعته وفق متطلبات المعيار ISO/IEC 27001.',
      ],
    },
  },
  {
    key: 'bcms-li',
    slug: { en: 'iso-22301-lead-implementer', ar: 'كبير-منفذي-آيزو-22301' },
    title: {
      en: 'ISO 22301 Lead Implementer',
      ar: 'كبير منفذي نظام إدارة استمرارية الأعمال ISO 22301',
    },
    summary: {
      en: 'Implementing and managing a business continuity management system based on ISO 22301.',
      ar: 'تطبيق نظام إدارة استمرارية الأعمال وإدارته وفق ISO 22301.',
    },
    icon: 'response',
    body: {
      en: [
        'This course covers how to implement and manage a business continuity management system based on ISO 22301: impact analysis, continuity strategies and plans, exercises and continual improvement.',
      ],
      ar: [
        'تتناول هذه الدورة تطبيق نظام إدارة استمرارية الأعمال وإدارته وفق المعيار ISO 22301: تحليل الأثر، واستراتيجيات الاستمرارية وخططها، والتمارين، والتحسين المستمر.',
      ],
    },
  },
  {
    key: 'risk',
    slug: { en: 'iso-31000-risk-manager', ar: 'إدارة-المخاطر-آيزو-31000' },
    title: {
      en: 'ISO 31000 Lead Risk Manager',
      ar: 'كبير مديري إدارة المخاطر ISO 31000',
    },
    summary: {
      en: 'The principles, framework and process of risk management according to ISO 31000.',
      ar: 'مبادئ إدارة المخاطر وإطارها وعمليتها وفق المعيار ISO 31000.',
    },
    icon: 'risk',
    body: {
      en: [
        'This course covers the principles, framework and process of risk management in ISO 31000, and how to apply them across an organisation.',
      ],
      ar: [
        'تتناول هذه الدورة مبادئ إدارة المخاطر وإطارها وعمليتها في المعيار ISO 31000، وكيفية تطبيقها على مستوى المؤسسة.',
      ],
    },
  },
  {
    key: 'pcidss',
    slug: { en: 'pci-dss-cardholder-data', ar: 'حماية-بيانات-حاملي-البطاقات' },
    title: {
      en: 'PCI DSS: protecting cardholder data',
      ar: 'نظام حماية معلومات حاملي البطاقات الائتمانية PCI DSS',
    },
    summary: {
      en: 'What PCI DSS requires of organisations that handle card data, and how to plan for compliance.',
      ar: 'ما يتطلبه معيار PCI DSS من الجهات التي تتعامل مع بيانات البطاقات، وكيفية التخطيط للالتزام به.',
    },
    icon: 'shield',
    body: {
      en: [
        'This course explains the operational and technical requirements of the Payment Card Industry Data Security Standard (PCI DSS), who they apply to, and how to plan and maintain compliance.',
      ],
      ar: [
        'تشرح هذه الدورة المتطلبات التشغيلية والتقنية لمعيار أمن بيانات صناعة بطاقات الدفع (PCI DSS)، والجهات التي ينطبق عليها، وكيفية التخطيط للالتزام به والمحافظة عليه.',
      ],
    },
  },
  {
    key: 'awareness',
    slug: { en: 'security-awareness-course', ar: 'دورة-التوعية-الأمنية' },
    title: {
      en: 'Security awareness',
      ar: 'التوعية الأمنية',
    },
    summary: {
      en: 'Everyday security for all staff: recognising phishing and social engineering, handling information safely and reporting incidents.',
      ar: 'الأمن في العمل اليومي لجميع الموظفين: التعرف على التصيد والهندسة الاجتماعية، والتعامل الآمن مع المعلومات، والإبلاغ عن الحوادث.',
    },
    icon: 'training',
    audience: { en: 'All staff', ar: 'جميع الموظفين' },
    body: {
      en: [
        'A practical course for all staff on everyday security: recognising phishing and social engineering, using passwords and devices safely, handling information, and reporting incidents quickly.',
      ],
      ar: [
        'دورة عملية لجميع الموظفين في الأمن خلال العمل اليومي: التعرف على رسائل التصيد والهندسة الاجتماعية، والاستخدام الآمن لكلمات المرور والأجهزة، والتعامل مع المعلومات، والإبلاغ السريع عن الحوادث.',
      ],
    },
  },
]

/** The legacy blog's only article, as an insight page. */
export const article = {
  slug: { en: 'what-is-cybersecurity', ar: 'ما-هو-الأمن-السيبراني' },
  title: { en: 'What is cybersecurity?', ar: 'ما هو الأمن السيبراني؟' },
  summary: {
    en: 'Cybersecurity is the practice of protecting systems, networks and programs from digital attacks.',
    ar: 'الأمن السيبراني هو عملية حماية الأنظمة والشبكات والبرامج من الهجمات الرقمية.',
  },
  seo: {
    title: { en: 'What is cybersecurity?', ar: 'ما هو الأمن السيبراني؟' },
    description: {
      en: 'A short introduction to cybersecurity: what it protects, what attacks aim to do, and where an organisation can start.',
      ar: 'مقدمة قصيرة في الأمن السيبراني: ما الذي يحميه، وما الذي تهدف إليه الهجمات، ومن أين تبدأ المؤسسة.',
    },
  },
  body: {
    en: [
      {
        p: [
          'Cybersecurity is the practice of protecting systems, networks and programs from digital attacks. These attacks usually aim to access, change or destroy sensitive information, to extort money from users, or to interrupt normal business operations.',
        ],
      },
      {
        h: 'What it protects',
        p: [
          'Security work protects three qualities of information: confidentiality (only the right people can see it), integrity (it is accurate and has not been altered) and availability (it is there when it is needed).',
        ],
      },
      {
        h: 'Where to start',
        p: [
          'Know what information and systems you have and which matter most. Assess the risks to them, then treat the largest first. Train your staff, because people are the first line of defence, and plan how you will respond when something goes wrong.',
        ],
      },
    ],
    ar: [
      {
        p: [
          'الأمن السيبراني هو عملية حماية الأنظمة والشبكات والبرامج من الهجمات الرقمية. تهدف هذه الهجمات عادة إلى الوصول إلى المعلومات الحساسة أو تغييرها أو إتلافها، أو ابتزاز المستخدمين ماليا، أو تعطيل سير الأعمال الطبيعي.',
        ],
      },
      {
        h: 'ما الذي يحميه',
        p: [
          'يحمي العمل الأمني ثلاث خصائص للمعلومات: السرية (لا يطلع عليها إلا المخولون)، والسلامة (دقيقة ولم تُعدَّل)، والإتاحة (متوفرة عند الحاجة إليها).',
        ],
      },
      {
        h: 'من أين تبدأ',
        p: [
          'اعرف ما لديك من معلومات وأنظمة وأيها الأهم. قيّم المخاطر التي تواجهها، ثم عالج الأكبر منها أولا. درّب موظفيك، فهم خط الدفاع الأول، وخطط لكيفية الاستجابة عند وقوع حادث.',
        ],
      },
    ],
  },
} as const

/** Contact details the owner supplied (2026-11-14). The address is not seeded: it is a
 * claim-bearing field that needs verified evidence before it can be published (CD-02); the
 * value to enter is recorded in docs/content/legacy-site-content.md. */
export const contactDetails = {
  /** Legacy About page and footer; owner confirmed 2026-11-18 (content/attestation.ts). No
   *  English legal name was supplied, so English uses the brand name. */
  companyName: { en: 'Altamiuz', ar: 'شركة التميز للاستشارات وأمن المعلومات' },
  address: { en: 'Al-Sabaa, Tripoli, Libya', ar: 'ليبيا - طرابلس / السبعة' },
  email: 'info@altamiuz.ly',
  phones: ['+218917373202', '+218927373201', '+218214629298'],
} as const
