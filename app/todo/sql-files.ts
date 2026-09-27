import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { SqlFile } from '@/components/todo/types'

/**
 * Reads a file from the supabase/ folder so the checklist can offer it for
 * copying. next.config.ts traces supabase/*.sql into the /todo deployment.
 */
export async function readSqlFile(name: 'schema.sql' | 'seed.sql'): Promise<SqlFile> {
  try {
    const content = await readFile(path.join(process.cwd(), 'supabase', name), 'utf8')
    const lines = content.split(/\r?\n/)
    // A trailing newline does not start another line.
    const lineCount = content.endsWith('\n') ? lines.length - 1 : lines.length
    return { name, ok: true, content, lineCount }
  } catch (error) {
    console.error(`[todo] could not read supabase/${name}`, error instanceof Error ? error.message : error)
    return { name, ok: false }
  }
}
