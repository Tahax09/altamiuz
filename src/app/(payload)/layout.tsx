/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'
import { assertAdminServerFunctionAllowed } from '@/modules/auth'
import { runServerFunction } from '@/modules/content'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  // Project addition (WS10): no admin server function runs without a completed-MFA session.
  await assertAdminServerFunctionAllowed(await getPayload({ config }), await headers())
  // Project addition (L-2): copy-to-locale runs in a scope that keeps the copy a draft.
  return runServerFunction(args.name, () =>
    handleServerFunctions({
      ...args,
      config,
      importMap,
    }),
  )
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
