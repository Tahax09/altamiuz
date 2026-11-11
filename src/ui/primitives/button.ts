// Button variants (shadcn/ui pattern with class-variance-authority, ADR-011). Styling lives in the
// `.button*` rules of site.css so CMS-rendered blocks and components share one implementation;
// this module is the typed API. Server-side only: no client JavaScript.
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva('button', {
  variants: {
    variant: {
      primary: '',
      secondary: 'button--secondary',
      inverse: 'button--inverse',
      quiet: 'button--quiet',
    },
    size: { md: '', sm: 'button--sm' },
    arrow: { true: 'button--arrow', false: '' },
  },
  defaultVariants: { variant: 'primary', size: 'md', arrow: false },
})

export type ButtonVariants = VariantProps<typeof buttonVariants>
