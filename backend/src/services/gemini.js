const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Sends a text prompt to Gemini and returns its generated text. */
export async function generateGeminiText({ systemPrompt, userPrompt, temperature = 0.2, responseMimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature,
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!response.ok || !text) {
    throw new Error(data.error?.message || "Gemini returned no generated text.");
  }
  return text;
}
