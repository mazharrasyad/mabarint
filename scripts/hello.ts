// First call to the Meta Model API: checks the key, base URL and model ID in .env.
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.META_API_KEY, baseURL: process.env.META_BASE_URL });
const model = process.env.META_MODEL ?? "muse-spark-1.3";

const res = await client.chat.completions.create({
  model,
  messages: [{
    role: "user",
    content: 'Read this: "No," she whispered. "He was fine this morning." Which word would a narrator stress, and what emotion is it? Answer in 2 sentences.',
  }],
});

console.log("Model:", model);
console.log(res.choices[0]?.message?.content);
