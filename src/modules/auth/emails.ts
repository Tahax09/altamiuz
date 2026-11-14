// Bilingual (Arabic + English) staff notification emails (FR-005, FR-034). Plain text only.
import { getConfig } from '../platform'
import { getMailer } from './services'

type Template = { subject: string; ar: string; en: string }

const T = {
  invitation: (link: string): Template => ({
    subject: 'Altamiuz CMS invitation | دعوة إلى نظام إدارة المحتوى',
    ar: `تمت دعوتك إلى نظام إدارة محتوى التميز. أكمل التسجيل خلال 72 ساعة:\n${link}`,
    en: `You have been invited to the Altamiuz CMS. Complete sign-up within 72 hours:\n${link}`,
  }),
  recovery: (link: string): Template => ({
    subject: 'Password recovery | استعادة كلمة المرور',
    ar: `طُلبت استعادة كلمة المرور لحسابك. الرابط صالح لمدة 30 دقيقة ولمرة واحدة:\n${link}\nإن لم تطلب ذلك فتجاهل هذه الرسالة.`,
    en: `A password recovery was requested for your account. The link works once, for 30 minutes:\n${link}\nIf this was not you, ignore this message.`,
  }),
  lockout: (): Template => ({
    subject: 'Sign-in temporarily blocked | تم إيقاف تسجيل الدخول مؤقتاً',
    ar: 'تم إيقاف تسجيل الدخول إلى حسابك مؤقتاً بسبب محاولات متكررة غير ناجحة.',
    en: 'Sign-in to your account was temporarily blocked after repeated failed attempts.',
  }),
  passwordChanged: (): Template => ({
    subject: 'Password changed | تم تغيير كلمة المرور',
    ar: 'تم تغيير كلمة مرور حسابك وإنهاء جميع الجلسات. إن لم تقم بذلك فتواصل مع المسؤول فوراً.',
    en: 'Your password was changed and all sessions were ended. If this was not you, contact an administrator now.',
  }),
  mfaChanged: (what: string): Template => ({
    subject: 'Two-factor authentication changed | تغيير التحقق الثنائي',
    ar: `تغيّر إعداد التحقق الثنائي لحسابك (${what}). تم إنهاء الجلسات الأخرى.`,
    en: `Your two-factor authentication changed (${what}). Other sessions were ended.`,
  }),
  passkeyChanged: (what: 'added' | 'removed'): Template => ({
    subject: 'Passkey changed | تغيير مفتاح المرور',
    ar:
      what === 'added'
        ? 'أُضيف مفتاح مرور جديد إلى حسابك. إن لم تقم بذلك فتواصل مع المسؤول فوراً.'
        : 'أُزيل مفتاح مرور من حسابك وأُنهيت الجلسات الأخرى. إن لم تقم بذلك فتواصل مع المسؤول فوراً.',
    en:
      what === 'added'
        ? 'A new passkey was added to your account. If this was not you, contact an administrator now.'
        : 'A passkey was removed from your account and other sessions were ended. If this was not you, contact an administrator now.',
  }),
}

export type NoticeKind = keyof typeof T

export async function sendNotice<K extends NoticeKind>(
  to: string,
  kind: K,
  ...args: Parameters<(typeof T)[K]>
) {
  const t = (T[kind] as (...a: unknown[]) => Template)(...args)
  await getMailer().send({ to: [to], subject: t.subject, text: `${t.ar}\n\n— — —\n\n${t.en}\n` })
}

export const accountLink = (path: string, token: string) =>
  `${getConfig().siteUrl.replace(/\/$/, '')}${path}?token=${encodeURIComponent(token)}`
