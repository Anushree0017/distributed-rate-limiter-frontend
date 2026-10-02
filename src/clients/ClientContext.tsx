import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'drl_selected_client'

interface ClientContextValue {
  /** `null` means "All clients". */
  selectedClient: string | null
  setSelectedClient: (clientId: string | null) => void
}

const ClientContext = createContext<ClientContextValue | null>(null)

export function useClientContext(): ClientContextValue {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClientContext must be used within ClientContextProvider')
  return ctx
}

/** The header client switcher's selection. Only the slug is persisted — it
 * isn't sensitive, unlike credentials/tokens which never touch storage. */
export function ClientContextProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))

  useEffect(() => {
    if (selectedClient) localStorage.setItem(STORAGE_KEY, selectedClient)
    else localStorage.removeItem(STORAGE_KEY)
  }, [selectedClient])

  return (
    <ClientContext.Provider value={{ selectedClient, setSelectedClient: setSelectedClientState }}>
      {children}
    </ClientContext.Provider>
  )
}
