const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
let rejectedApiKey = null;

export async function generateOpenRouterText({
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  responseMimeType,
  model: requestedModel,
  maxTokens,
  timeoutMs = 60000,
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  if (apiKey === rejectedApiKey) {
    throw new Error("OpenRouter rejected this API key earlier. Update OPENROUTER_API_KEY and restart the backend to retry.");
  }

  const model = requestedModel || process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b";
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-OpenRouter-Title": "SyncBot",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      ...(responseMimeType === "application/json"
        ? { response_format: { type: "json_object" } }
        : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (response.status === 401) rejectedApiKey = apiKey;

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`OpenRouter returned invalid JSON (HTTP ${response.status}).`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!response.ok || !text) {
    const detail = data.error?.message || data.message;
    throw new Error(
      detail
        ? `${detail} (HTTP ${response.status})`
        : `OpenRouter returned no text (HTTP ${response.status}).`,
    );
  }

  return text;
}
