// Contact page and privacy notice content (CMS data, loaded as DRAFTS by
// scripts/seed-contact-privacy.ts; never rendered from code, never published by the script).
//
// Contact page: no address, phone, email or hours (CD-02 open); the enquiry form is the only
// channel. Privacy notice: every visible statement describes behaviour verified in the code
// (paths in docs/content/privacy-notice.md). Every open legal decision is a section labelled
// "Pending …"; a legal page with such a section cannot be published (workflow
// `assertNoPendingLegalSections`). Privacy sections completed 2026-11-18 from the draft wording in
// docs/content/legal-review-libya.md at the owner's request; a lawyer's review (CD-10) is still
// recommended.

type L = { en: string; ar: string }
export type Para = { h?: L; p?: L[]; list?: L[] }
export type Section = { label: string; pending?: string; body: Para[] }

export const contactPage = {
  title: { en: 'Contact us', ar: 'تواصل معنا' } satisfies L,
  slug: { en: 'contact', ar: 'تواصل-معنا' } satisfies L,
  summary: {
    en: 'Tell us about your organisation and what you need to achieve.',
    ar: 'حدّثنا عن مؤسستك وما تسعى إلى تحقيقه.',
  } satisfies L,
  seo: {
    title: { en: 'Contact | Altamiuz', ar: 'تواصل معنا | Altamiuz' } satisfies L,
    description: {
      en: 'Send Altamiuz an enquiry about information security advice for your organisation.',
      ar: 'أرسل استفسارك إلى Altamiuz بشأن استشارات أمن المعلومات لمؤسستك.',
    } satisfies L,
  },
  form: {
    heading: { en: 'Send an enquiry', ar: 'أرسل استفساراً' } satisfies L,
    intro: {
      en: 'Describe your organisation and what you need to achieve, and we will contact you using the details you provide.',
      ar: 'صف مؤسستك وما تسعى إلى تحقيقه، وسنتواصل معك عبر البيانات التي تقدمها.',
    } satisfies L,
  },
  /** One neutral topic so the form can work; the owner sets the real list in site settings. */
  defaultTopic: { en: 'General enquiry', ar: 'استفسار عام' } satisfies L,
}

export const privacyPage = {
  title: { en: 'Privacy notice', ar: 'إشعار الخصوصية' } satisfies L,
  slug: { en: 'privacy', ar: 'الخصوصية' } satisfies L,
  summary: {
    en: 'How information sent through the contact form on this website is handled.',
    ar: 'كيف تُعالَج المعلومات المرسلة عبر نموذج التواصل في هذا الموقع.',
  } satisfies L,
  seo: {
    title: { en: 'Privacy notice | Altamiuz', ar: 'إشعار الخصوصية | Altamiuz' } satisfies L,
    description: {
      en: 'How Altamiuz handles the information you send through the contact form on this website.',
      ar: 'كيف تتعامل Altamiuz مع المعلومات التي ترسلها عبر نموذج التواصل في هذا الموقع.',
    } satisfies L,
  },
}

export const privacySections: Section[] = [
  {
    label: 'Scope',
    body: [
      {
        h: { en: 'What this notice covers', ar: 'نطاق هذا الإشعار' },
        p: [
          {
            en: 'This notice explains how information you send through the contact form on this website is handled.',
            ar: 'يوضح هذا الإشعار كيفية التعامل مع المعلومات التي ترسلها عبر نموذج التواصل في هذا الموقع.',
          },
        ],
      },
    ],
  },
  {
    label: 'Controller',
    body: [
      {
        h: { en: 'Who is responsible for your information', ar: 'الجهة المسؤولة عن معلوماتك' },
        p: [
          {
            en: 'Altamiuz for Consulting and Information Security, Al-Sabaa, Tripoli, Libya, is responsible for the information you send through this form. You can reach us at info@altamiuz.ly.',
            ar: 'شركة التميز للاستشارات وأمن المعلومات، السبعة، طرابلس، ليبيا، هي الجهة المسؤولة عن المعلومات التي ترسلها عبر هذا النموذج. ويمكنك التواصل معنا على info@altamiuz.ly.',
          },
        ],
      },
    ],
  },
  {
    label: 'What we collect',
    body: [
      {
        h: { en: 'What the form collects', ar: 'ما يجمعه النموذج' },
        list: [
          { en: 'your name and email address', ar: 'اسمك وعنوان بريدك الإلكتروني' },
          {
            en: 'your phone number and organisation, if you give them',
            ar: 'رقم هاتفك واسم مؤسستك، إن قدمتهما',
          },
          { en: 'the topic and text of your message', ar: 'موضوع رسالتك ونصها' },
          {
            en: 'your confirmation that you have read this notice',
            ar: 'تأكيدك أنك اطّلعت على هذا الإشعار',
          },
          {
            en: 'the language of the page you used and the time you sent the form',
            ar: 'لغة الصفحة التي استخدمتها ووقت إرسال النموذج',
          },
        ],
        p: [
          {
            en: 'We also record whether the notification email to our staff was delivered, and the date on which your enquiry is due to be deleted. Your IP address and browser details are not stored with your enquiry.',
            ar: 'ونسجّل كذلك ما إذا كان البريد الإلكتروني المرسل لإشعار موظفينا قد وصل، والتاريخ المقرر لحذف استفسارك. ولا يُخزَّن عنوان IP الخاص بك ولا بيانات متصفحك مع الاستفسار.',
          },
        ],
      },
    ],
  },
  {
    label: 'Abuse limits',
    body: [
      {
        h: { en: 'How repeated submissions are limited', ar: 'كيف نحدّ من الإرسال المتكرر' },
        p: [
          {
            en: 'The website accepts up to five submissions from one network address in ten minutes. The address itself is not kept: the counter holds only a keyed one-way digest of it, and counters are deleted after their ten-minute window by the website’s scheduled maintenance task.',
            ar: 'يقبل الموقع خمس عمليات إرسال كحد أقصى من عنوان شبكة واحد خلال عشر دقائق. ولا يُحتفظ بالعنوان نفسه، إذ لا يحفظ العدّاد إلا بصمة أحادية الاتجاه مشفّرة بمفتاح، وتُحذف العدّادات بعد انقضاء فترتها البالغة عشر دقائق عبر مهمة الصيانة المجدولة في الموقع.',
          },
        ],
      },
    ],
  },
  {
    label: 'Purpose',
    body: [
      {
        h: { en: 'Why we use it', ar: 'لماذا نستخدمها' },
        p: [
          {
            en: 'We use your enquiry to read it and reply to you. It is stored in the website’s enquiry inbox, and our staff are notified by email when it arrives.',
            ar: 'نستخدم استفسارك لقراءته والرد عليك. ويُحفظ في صندوق الاستفسارات في الموقع، ويُبلَّغ موظفونا بوصوله عبر البريد الإلكتروني.',
          },
        ],
      },
    ],
  },
  {
    label: 'Legal basis',
    body: [
      {
        h: { en: 'Why we may use it', ar: 'أساس استخدامها' },
        p: [
          {
            en: 'We use your information because you ask us to reply to your enquiry. We use it only for that, and for nothing else without your agreement.',
            ar: 'نستخدم معلوماتك لأنك تطلب منا الرد على استفسارك، ولا نستخدمها إلا لهذا الغرض، ولا لغيره دون موافقتك.',
          },
        ],
      },
    ],
  },
  {
    label: 'Access',
    body: [
      {
        h: { en: 'Who can see it', ar: 'من يمكنه الاطّلاع عليها' },
        p: [
          {
            en: 'Only staff with administrator access to the website can open, export or delete enquiries. Each of these actions is recorded in an audit log, which does not contain the content of the enquiry. The notification email goes to staff addresses set by our administrators.',
            ar: 'لا يستطيع فتح الاستفسارات أو تصديرها أو حذفها إلا الموظفون الذين لديهم صلاحية الإدارة في الموقع. ويُسجَّل كل إجراء من هذه الإجراءات في سجل تدقيق لا يتضمن محتوى الاستفسار. ويُرسل بريد الإشعار إلى عناوين موظفين يحددها مسؤولو الإدارة لدينا.',
          },
        ],
      },
    ],
  },
  {
    label: 'Service providers',
    body: [
      {
        h: { en: 'Service providers', ar: 'مزودو الخدمات' },
        p: [
          {
            en: 'The website’s database is hosted by Neon in Frankfurt, Germany. The check that stops automated submissions is provided by Cloudflare. Notification e-mails to our staff are sent through an e-mail delivery provider. These providers process your information only to provide their service to us, under their own security commitments.',
            ar: 'تستضيف شركة Neon قاعدة بيانات الموقع في فرانكفورت، ألمانيا. وتقدّم Cloudflare خدمة التحقق التي تمنع الإرسال الآلي. وتُرسل رسائل الإشعار إلى موظفينا عبر مزوّد لخدمة البريد الإلكتروني. ولا يعالج هؤلاء المزودون معلوماتك إلا لتقديم خدماتهم لنا وفق التزاماتهم الأمنية.',
          },
        ],
      },
    ],
  },
  {
    label: 'Retention',
    body: [
      {
        h: { en: 'How long we keep it', ar: 'مدة الاحتفاظ بها' },
        p: [
          {
            en: 'Each enquiry is scheduled for deletion 12 months after it is received and is then deleted automatically.',
            ar: 'يُجدوَل كل استفسار للحذف بعد 12 شهراً من استلامه، ثم يُحذف تلقائياً.',
          },
        ],
      },
    ],
  },
  {
    label: 'Backups',
    body: [
      {
        h: { en: 'Backups', ar: 'النسخ الاحتياطية' },
        p: [
          {
            en: 'Copies may remain in our encrypted backups for up to 30 days after an enquiry is deleted, and are then removed.',
            ar: 'قد تبقى نسخ في نسخنا الاحتياطية المشفّرة مدة أقصاها 30 يوماً بعد حذف الاستفسار، ثم تُزال.',
          },
        ],
      },
    ],
  },
  {
    label: 'Requests',
    body: [
      {
        h: { en: 'Your requests', ar: 'طلباتك' },
        p: [
          {
            en: 'You can ask to see, correct or delete your enquiry by writing to info@altamiuz.ly. We reply within 30 days.',
            ar: 'يمكنك طلب الاطلاع على استفسارك أو تصحيحه أو حذفه بالكتابة إلى info@altamiuz.ly، ونرد خلال 30 يوماً.',
          },
        ],
      },
    ],
  },
  {
    label: 'Cookies and storage',
    body: [
      {
        h: { en: 'Cookies and similar storage', ar: 'ملفات تعريف الارتباط والتخزين المماثل' },
        p: [
          {
            en: 'This site sets one cookie, altamiuz-locale, to remember your language for one year. If a site notice is shown, closing it is remembered in your browser’s storage. The check on the contact form is provided by Cloudflare and may use its own technical data. The site uses no advertising or tracking cookies.',
            ar: 'يضع الموقع ملف تعريف ارتباط واحداً هو altamiuz-locale لتذكّر لغتك مدة سنة. وإذا ظهر تنبيه في الموقع، يُحفظ إغلاقه في ذاكرة متصفحك. ويقدّم Cloudflare خدمة التحقق في نموذج التواصل وقد يستخدم بيانات تقنية خاصة به. ولا يستخدم الموقع ملفات إعلانية أو للتتبع.',
          },
          {
            en: 'The map on the contact page loads only if you choose to open it. It then fetches map images from OpenFreeMap, which receives your IP address as any website you visit does.',
            ar: 'لا تُحمَّل الخريطة في صفحة التواصل إلا إذا اخترت فتحها، وعندها تُجلب صور الخريطة من OpenFreeMap التي تتلقى عنوان IP الخاص بك كما يحدث عند زيارة أي موقع.',
          },
        ],
      },
    ],
  },
  {
    label: 'Changes',
    body: [
      {
        h: { en: 'Changes to this notice', ar: 'التغييرات على هذا الإشعار' },
        p: [
          {
            en: 'This notice applies from 18 November 2026. If we change it, we will publish the new version here with its date.',
            ar: 'يسري هذا الإشعار اعتباراً من 18 نوفمبر 2026. وإذا عدّلناه، ننشر النسخة الجديدة هنا مع تاريخها.',
          },
        ],
      },
    ],
  },
]
