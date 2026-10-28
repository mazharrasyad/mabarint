import { client, MODEL } from "./client.js";

const res = await client.chat.completions.create({
  model: MODEL,
  messages: [
    {
      role: "user",
      content:
        'Read this: "No," she whispered. "He was fine this morning." ' +
        "Which word would a narrator stress, and what emotion is it? Answer in 2 sentences.",
    },
  ],
});

console.log("Model:", MODEL);
console.log(res.choices[0]?.message?.content);
