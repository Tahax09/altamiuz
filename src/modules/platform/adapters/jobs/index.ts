// Background-job port (D-14). In-memory queue for tests; the Payload jobs queue is wired in the
// phase that first needs jobs (Phase 2, audit retention).
import { randomUUID } from 'node:crypto'

export type JobHandler = (input: unknown) => Promise<void>

export interface JobQueue {
  register(task: string, handler: JobHandler): void
  enqueue(task: string, input: unknown): Promise<string>
  runDue(): Promise<number>
}

export function createMemoryJobQueue(): JobQueue {
  const handlers = new Map<string, JobHandler>()
  const pending: { id: string; task: string; input: unknown }[] = []
  return {
    register(task, handler) {
      handlers.set(task, handler)
    },
    async enqueue(task, input) {
      if (!handlers.has(task)) throw new Error(`unknown task: ${task}`)
      const id = randomUUID()
      pending.push({ id, task, input })
      return id
    },
    async runDue() {
      const batch = pending.splice(0)
      for (const job of batch) await handlers.get(job.task)!(job.input)
      return batch.length
    },
  }
}
