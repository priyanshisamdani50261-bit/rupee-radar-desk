export const GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function geminiUnavailable(status: number): string {
  if (status === 503 || status === 504) return "Google Gemini is temporarily busy. Try again shortly; original headlines remain available.";
  if (status === 429) return "Gemini quota reached. Try again after your quota resets.";
  if (status === 401 || status === 403) return "Gemini access was denied; check the saved key and Google account access.";
  if (status === 404) return "Google could not provide the selected Gemini model for this account. Original headlines remain available.";
  return `Gemini is unavailable (${status}). Original headlines remain available.`;
}