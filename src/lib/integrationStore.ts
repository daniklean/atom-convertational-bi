import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface IntegrationState {
  id: string;
  connected: boolean;
}

interface IntegrationStore {
  integrations: IntegrationState[];
  connectIntegration: (id: string) => void;
  disconnectIntegration: (id: string) => void;
}

export const useIntegrationStore = create<IntegrationStore>()(
  persist(
    (set) => ({
      integrations: [],

      connectIntegration: (id: string) =>
        set((state) => {
          const exists = state.integrations.find((i) => i.id === id);
          if (exists) {
            return {
              integrations: state.integrations.map((i) =>
                i.id === id ? { ...i, connected: true } : i
              ),
            };
          }
          return {
            integrations: [...state.integrations, { id, connected: true }],
          };
        }),

      disconnectIntegration: (id: string) =>
        set((state) => ({
          integrations: state.integrations.map((i) =>
            i.id === id ? { ...i, connected: false } : i
          ),
        })),
    }),
    { name: "atom-integrations-storage" }
  )
);
