import "dotenv/config";
import OpenAI from "openai";

const { META_API_KEY, META_BASE_URL, META_MODEL } = process.env;

if (!META_API_KEY || !META_BASE_URL || !META_MODEL) {
  console.error("Missing META_API_KEY, META_BASE_URL or META_MODEL in .env (see .env.example)");
  process.exit(1);
}

// Meta Model API is OpenAI-compatible: point the OpenAI SDK at Meta's base URL.
export const client = new OpenAI({ apiKey: META_API_KEY, baseURL: META_BASE_URL });
export const MODEL = META_MODEL;
