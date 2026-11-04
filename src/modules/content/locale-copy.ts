// L-2: scope for the admin "copy to locale" server function. Payload's handler
// (copyDataFromLocaleHandler) calls payload.update with the source language's data, including its
// `_status`, so a copy could publish the target language implicitly. The admin layout runs that
// server function inside this scope; the content and global workflow hooks force a draft save.
import { AsyncLocalStorage } from 'node:async_hooks'

const scope = new AsyncLocalStorage<true>()
/** Payload's server-function name for the admin "copy to locale" action (handleServerFunctions). */
export const COPY_TO_LOCALE = 'copy-data-from-locale'

export const isLocaleCopy = () => scope.getStore() === true

/** Runs an admin server function; the copy-to-locale action runs inside the copy scope. */
export function runServerFunction<T>(name: string, run: () => T): T {
  return name === COPY_TO_LOCALE ? scope.run(true, run) : run()
}
