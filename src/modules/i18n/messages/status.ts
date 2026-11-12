// Strings of the client-side error page (src/app/(site)/[locale]/error.tsx). Kept in their own
// module so the error boundary, which ships with every public page, carries only these five
// strings instead of both full dictionaries (FR-083 script budget). en.ts and ar.ts include them,
// so `t()` and the key-parity tests see one set of keys.
export const statusMessages = {
  en: {
    errorTitle: 'Something went wrong',
    errorBody: 'This page cannot be shown right now. Please try again later.',
    backHome: 'Back to the home page',
    tryAgain: 'Try again',
    errorCode: 'Error',
  },
  ar: {
    errorTitle: 'حدث خطأ',
    errorBody: 'تعذّر عرض هذه الصفحة الآن. يرجى المحاولة لاحقاً.',
    backHome: 'العودة إلى الصفحة الرئيسية',
    tryAgain: 'إعادة المحاولة',
    errorCode: 'خطأ',
  },
} as const
