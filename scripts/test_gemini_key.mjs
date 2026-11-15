const key = process.env.GEMINI_API_KEY || "";

async function test() {
  const models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  for (const m of models) {
    const start = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] }),
      });
      const data = await res.json();
      console.log(m, "Time:", Date.now() - start, "ms", "Status:", res.status, "Text:", data?.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) {
      console.log(m, "ERR:", e.message);
    }
  }
}

test();
