import { describe, it, expect, beforeEach, vi } from "vitest";
import { getMergedConfig, DEFAULT_CONFIG } from "../background/utils/config";
import { resetMockStorage, setManagedPolicy } from "./setup";

describe("Configuración con precedencia de GPO", () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  it("debe devolver valores por defecto si no hay configuraciones locales ni GPO", async () => {
    const configState = await getMergedConfig();
    expect(configState.values.tabLimit).toBe(DEFAULT_CONFIG.tabLimit);
    expect(configState.managedKeys.length).toBe(0);
  });

  it("debe priorizar valores locales si existen y no hay GPO", async () => {
    // ✅ async/await directo — el mock devuelve Promise
    await chrome.storage.sync.set({ tabLimit: 8 });

    const configState = await getMergedConfig();
    expect(configState.values.tabLimit).toBe(8);
    expect(configState.managedKeys.length).toBe(0);
  });

  it("debe priorizar GPO sobre la configuración local y marcar la clave como managed", async () => {
    await chrome.storage.sync.set({ tabLimit: 8 });

    // ✅ Usar el helper en lugar de mockImplementationOnce con @ts-ignore
    setManagedPolicy({ tabLimit: 3 });

    const configState = await getMergedConfig();
    expect(configState.values.tabLimit).toBe(3);
    expect(configState.managedKeys).toContain("tabLimit");
  });
});
