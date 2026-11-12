'use client'
// The enquiry form's client code in its own chunk (FR-083 script budget). A Server Component that
// imports a Client Component puts it in the bundle of every page of the route; through a dynamic
// import in a Client Component it is fetched only where the form is rendered. React.lazy rather
// than next/dynamic: next/dynamic ships its own runtime (about 2.6 KB), which cancelled the
// saving. Still server-rendered (the server waits for the lazy component), so the form works
// without JavaScript (FR-082).
import { lazy, Suspense, type ComponentProps } from 'react'
import type { EnquiryForm as Form } from './EnquiryForm'

const Lazy = lazy(() => import('./EnquiryForm').then((m) => ({ default: m.EnquiryForm })))

export function LazyEnquiryForm(props: ComponentProps<typeof Form>) {
  return (
    <Suspense fallback={null}>
      <Lazy {...props} />
    </Suspense>
  )
}
