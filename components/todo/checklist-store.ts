import { useSyncExternalStore } from 'react'

import type { ChecklistStep } from '@/components/todo/types'

/**
 * Ticks on the launch checklist, saved in this browser's localStorage so the
 * owner can close the tab and pick up where they left off. Components read the
 * ticks through useChecklistTicks(), which keeps every open tab in sync.
 */

type Ticks = Readonly<Record<string, boolean>>

const STORAGE_KEY = 'knotted-launch-checklist-v1'
const EMPTY: Ticks = {}

let cachedTicks: Ticks | null = null
const listeners = new Set<() => void>()

/** Keeps only `stepId: boolean` pairs, in case the stored value was edited or corrupted. */
function parseTicks(value: unknown): Ticks {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return EMPTY
  return Object.fromEntries(Object.entries(value).filter(([, checked]) => typeof checked === 'boolean'))
}

function readTicks(): Ticks {
  if (cachedTicks) return cachedTicks
  try {
    cachedTicks = parseTicks(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}'))
  } catch {
    cachedTicks = EMPTY
  }
  return cachedTicks
}

function writeTicks(ticks: Ticks) {
  cachedTicks = ticks
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ticks))
  } catch {
    // Storage can be blocked (private mode, strict settings). Ticks still work until the tab closes.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cachedTicks = null // another tab changed the checklist
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** The server cannot see localStorage, so the first render only shows server-verified steps as done. */
function getServerSnapshot() {
  return EMPTY
}

export function useChecklistTicks() {
  return useSyncExternalStore(subscribe, readTicks, getServerSnapshot)
}

export function setStepChecked(stepId: string, checked: boolean) {
  writeTicks({ ...readTicks(), [stepId]: checked })
}

export function resetChecklist() {
  writeTicks(EMPTY)
}

/** A manual tick (or untick) wins; otherwise a step is done when the server verified it. */
export function isStepDone(ticks: Ticks, step: Pick<ChecklistStep, 'id' | 'verified'>) {
  return ticks[step.id] ?? step.verified ?? false
}
