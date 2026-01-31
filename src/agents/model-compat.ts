import type { Api, Model } from "@mariozechner/pi-ai";
import type { ModelCompatConfig } from "../config/types.models.js";

function isOpenAiCompletionsModel(model: Model<Api>): model is Model<"openai-completions"> {
  return model.api === "openai-completions";
}

export function normalizeModelCompat(model: Model<Api>): Model<Api> {
  const baseUrl = model.baseUrl ?? "";
  const isZai = model.provider === "zai" || baseUrl.includes("api.z.ai");
  const initialCompat: ModelCompatConfig = model.compat ?? {};

  if (!isZai || !isOpenAiCompletionsModel(model)) {
    // If not ZAI/OpenAICompletions, just return the model with existing compat
    return { ...model, compat: initialCompat };
  }

  const openaiModel = model as Model<"openai-completions">;
  const compat = openaiModel.compat ?? {};

  // Preserve existing supportsTools if present, otherwise set supportsDeveloperRole
  openaiModel.compat = {
    ...initialCompat, // Preserve any existing compat properties
    ...compat,
    supportsDeveloperRole: compat.supportsDeveloperRole ?? false, // Ensure this is always set for ZAI
  };

  return openaiModel;
}
