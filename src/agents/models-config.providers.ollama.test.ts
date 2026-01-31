import { describe, expect, it, vi, afterEach } from "vitest";
import { resolveImplicitProviders } from "./models-config.providers.js";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { upsertAuthProfile } from "./auth-profiles.js";

describe("Ollama provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("should not include ollama when no profile is configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "clawd-test-"));
    const providers = await resolveImplicitProviders({ agentDir });

    expect(providers?.ollama).toBeUndefined();
  });

  it("should include ollama when a profile is configured and models are discovered", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "clawd-test-"));
    upsertAuthProfile({
      profileId: "ollama:default",
      credential: {
        type: "api_key",
        provider: "ollama",
      },
      agentDir,
    });
    
    vi.stubEnv("MOLTBOT_TEST_OLLAMA", "1");
    
    // Mock fetch for Ollama discovery
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: "llama3", modified_at: "...", size: 0, digest: "..." }
        ]
      })
    });
    vi.stubGlobal("fetch", mockFetch);

    const providers = await resolveImplicitProviders({ agentDir });

    expect(providers?.ollama).toBeDefined();
    expect(providers.ollama?.apiKey).toBe("ollama");
    expect(providers.ollama?.models).toHaveLength(1);
    expect(providers.ollama?.models[0].id).toBe("llama3");
  });

  it("should use explicit API key from profile if configured", async () => {
    const agentDir = mkdtempSync(join(tmpdir(), "clawd-test-"));
    upsertAuthProfile({
      profileId: "ollama:default",
      credential: {
        type: "api_key",
        provider: "ollama",
        key: "custom-key",
      },
      agentDir,
    });

    vi.stubEnv("MOLTBOT_TEST_OLLAMA", "1");
    
    // Mock fetch for Ollama discovery
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: "llama3", modified_at: "...", size: 0, digest: "..." }
        ]
      })
    });
    vi.stubGlobal("fetch", mockFetch);

    const providers = await resolveImplicitProviders({ agentDir });

    expect(providers?.ollama).toBeDefined();
    expect(providers.ollama?.apiKey).toBe("custom-key");
  });
});
