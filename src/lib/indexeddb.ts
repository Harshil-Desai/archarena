import type { TLStoreSnapshot } from "@tldraw/tldraw"
import type { ChatMessage, Hint, ScoreResult, SemanticGraph } from "@/types"

const DB_NAME = "ArchArena"
const STORE = "sessions"
const DB_VERSION = 1
const SESSION_KEY_PREFIX = "session:"

export interface LocalSessionSnapshot {
  id: string
  key: string
  promptId?: string
  graph?: SemanticGraph | null
  canvasSnapshot?: TLStoreSnapshot | null
  notes?: string
  hints?: Hint[]
  chatHistory?: ChatMessage[]
  scoreResult?: ScoreResult | null
  hintsUsed?: number
  scoresUsed?: number
  savedAt: number
}

export type LocalSessionUpdate = Omit<LocalSessionSnapshot, "id" | "key" | "savedAt">

function toSessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`
}

function supportsIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined"
}

async function getDB(): Promise<IDBDatabase | null> {
  if (!supportsIndexedDb()) {
    return null
  }

  try {
    return await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "key" })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch (error) {
    console.warn("IndexedDB open failed", error)
    return null
  }
}

export async function saveSessionLocally(
  id: string,
  data: LocalSessionUpdate
): Promise<boolean> {
  const db = await getDB()
  if (!db) {
    return false
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).put({
        key: toSessionKey(id),
        id,
        ...data,
        savedAt: Date.now(),
      } satisfies LocalSessionSnapshot)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })

    return true
  } catch (error) {
    console.warn("IndexedDB save failed", error)
    return false
  } finally {
    db.close()
  }
}

export async function loadSessionLocally(id: string): Promise<LocalSessionSnapshot | null> {
  const db = await getDB()
  if (!db) {
    return null
  }

  try {
    const record = await new Promise<LocalSessionSnapshot | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly")
      const req = tx.objectStore(STORE).get(toSessionKey(id))
      req.onsuccess = () => resolve((req.result as LocalSessionSnapshot | undefined) ?? null)
      req.onerror = () => reject(req.error)
      tx.onabort = () => reject(tx.error)
    })

    return record
  } catch (error) {
    console.warn("IndexedDB load failed", error)
    return null
  } finally {
    db.close()
  }
}

// ── UI flag helpers (one-time shown states, etc.) ─────────────────
// Stored in the same object store with a "flag:" key prefix.

export async function getUiFlag(name: string): Promise<boolean> {
  const db = await getDB()
  if (!db) return false
  try {
    const result = await new Promise<{ key: string; value: boolean } | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE, "readonly")
        const req = tx.objectStore(STORE).get(`flag:${name}`)
        req.onsuccess = () => resolve(req.result as { key: string; value: boolean } | undefined)
        req.onerror = () => reject(req.error)
      }
    )
    return result?.value ?? false
  } catch {
    return false
  } finally {
    db.close()
  }
}

export async function setUiFlag(name: string, value: boolean): Promise<void> {
  const db = await getDB()
  if (!db) return
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      tx.objectStore(STORE).put({ key: `flag:${name}`, value })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.warn("IndexedDB setUiFlag failed", error)
  } finally {
    db.close()
  }
}

export async function clearSessionLocally(id: string): Promise<boolean> {
  const db = await getDB()
  if (!db) {
    return false
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite")
      const req = tx.objectStore(STORE).delete(toSessionKey(id))
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      tx.onabort = () => reject(tx.error)
    })

    return true
  } catch (error) {
    console.warn("IndexedDB clear failed", error)
    return false
  } finally {
    db.close()
  }
}
