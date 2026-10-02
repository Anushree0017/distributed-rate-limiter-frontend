const STORAGE_KEY = 'drl_actor'

/** `created_by`/`updated_by` is a free-text actor name the API requires on
 * every write but doesn't otherwise validate — there's no auth layer here.
 * Persisting it locally saves re-typing it on every form. */
export function getStoredActor(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export function setStoredActor(actor: string): void {
  localStorage.setItem(STORAGE_KEY, actor)
}
