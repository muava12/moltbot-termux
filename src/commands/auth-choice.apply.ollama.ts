import { ensureMoltbotModelsJson } from "../agents/models-config.js";
import { applyAuthProfileConfig } from "./onboard-auth.js";
import type { ApplyAuthChoiceParams, ApplyAuthChoiceResult } from "./auth-choice.apply.js";

export async function applyAuthChoiceOllama(
  params: ApplyAuthChoiceParams,
): Promise<ApplyAuthChoiceResult | null> {
  if (params.authChoice !== "ollama") {
    return null;
  }

  await params.prompter.note(
    [
      "Ollama is a local LLM runtime. Make sure it's installed and running.",
      "See: https://ollama.ai",
      "",
      "Moltbot will auto-discover models from your local Ollama instance.",
    ].join("\n"),
    "Ollama",
  );

  let nextConfig = applyAuthProfileConfig(params.config, {
    profileId: "ollama:default",
    provider: "ollama",
    mode: "api_key", // Dummy mode, no key is stored
  });

  // Trigger discovery so the model picker is populated.
  await ensureMoltbotModelsJson(nextConfig);

  // We don't set a default model for ollama, user has to choose one
  return { config: nextConfig };
}