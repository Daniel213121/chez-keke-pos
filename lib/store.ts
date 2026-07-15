import { create } from 'zustand'

export interface TaxConfig {
  isTaxEnabled: boolean
  isInclusive: boolean
  vatRate: number
  nhilRate: number
  getfundRate: number
  serviceCharge: number
  discountRate: number
}

interface SettingsStore {
  taxConfig: TaxConfig
  isSettingsLoaded: boolean
  updateTaxConfig: (config: Partial<TaxConfig>) => void
  fetchTaxConfig: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  taxConfig: {
    isTaxEnabled: false,
    isInclusive: false,
    vatRate: 15.0,
    nhilRate: 2.5,
    getfundRate: 2.5,
    serviceCharge: 5.0,
    discountRate: 0,
  },
  isSettingsLoaded: false,
  updateTaxConfig: (newConfig) =>
    set((state) => ({
      taxConfig: { ...state.taxConfig, ...newConfig }
    })),
  fetchTaxConfig: async () => {
    try {
      const res = await fetch('/api/cashier/settings')
      if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`)
      const data = await res.json()
      set({
        isSettingsLoaded: true,
        taxConfig: {
          isTaxEnabled: data.isTaxEnabled,
          isInclusive: data.isInclusive,
          vatRate: data.vatRate,
          nhilRate: data.nhilRate,
          getfundRate: data.getfundRate,
          serviceCharge: data.serviceCharge,
          discountRate: data.discountRate ?? 0,
        }
      })
    } catch (error) {
      console.error('Failed to sync tax config:', error)
      set({ isSettingsLoaded: true })
    }
  }
}))
