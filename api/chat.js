// /api/chat.js
// This runs on Vercel's servers (NOT in the browser), so the API key stays hidden.
// It receives { system, messages } from the app and calls Google's Gemini API (free tier).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
  }

  try {
    const { system, messages } = req.body;

    // Convert our message format into Gemini's "contents" format
    const contents = messages.map((m) => {
      const parts = [];
      const content = m.content;
      if (typeof content === "string") {
        parts.push({ text: content });
      } else if (Array.isArray(content)) {
        content.forEach((block) => {
          if (block.type === "text") {
            parts.push({ text: block.text });
          } else if (block.type === "image") {
            parts.push({
              inline_data: {
                mime_type: block.source.mediaType,
                data: block.source.data,
              },
            });
          }
        });
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: system || "" }] },
          generationConfig: { maxOutputTokens: 500 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({ error: data?.error?.message || "Gemini API error" });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
