import { vi } from "vitest";

// Almacenamientos simulados en memoria
let mockSyncStorage: Record<string, unknown> = {};
let mockManagedStorage: Record<string, unknown> = {};

// ✅ El mock devuelve Promises — igual que las Chrome APIs reales en MV3
const chromeMock = {
  storage: {
    sync: {
      get: vi.fn(async (_keys: unknown) => ({ ...mockSyncStorage })),
      set: vi.fn(async (data: Record<string, unknown>) => {
        mockSyncStorage = { ...mockSyncStorage, ...data };
      }),
    },
    managed: {
      get: vi.fn(async (_keys: unknown) => ({ ...mockManagedStorage })),
    },
    local: {
      get: vi.fn(async (_keys: unknown) => ({})),
      set: vi.fn(async (_data: unknown) => {}),
    },
    session: {
      get: vi.fn(async (_keys: unknown) => ({})),
      set: vi.fn(async (_data: unknown) => {}),
    },
  },
  runtime: {
    lastError: null,
  },
};

// Adjuntar el mock al objeto global
Object.assign(globalThis, { chrome: chromeMock });

// Helper para limpiar los almacenes simulados entre tests
export function resetMockStorage() {
  mockSyncStorage = {};
  mockManagedStorage = {};
}

// Helper para simular una política GPO activa
export function setManagedPolicy(policy: Record<string, unknown>) {
  mockManagedStorage = policy;
}
