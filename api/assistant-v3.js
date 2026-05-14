const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

function readMessage(req) {
  let body = req.body || {};

  if (typeof body === "string") {
    const trimmed = body.trim();
    if (!trimmed) {
      body = {};
    } else {
      try {
        body = JSON.parse(trimmed);
      } catch (_) {
        body = { message: trimmed };
      }
    }
  }

  if (!body || typeof body !== "object") {
    body = {};
  }

  return String(body.message || body.query || body.prompt || "").trim();
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "/api/assistant-v3",
      version: "ASSISTANT_V3_EXACT_ROUTE",
      provider: "openai",
      model: "gpt-4o-mini",
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY)
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST /api/assistant-v3"
    });
  }

  try {
    const message = readMessage(req);

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "MISSING_MESSAGE"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: "MISSING_OPENAI_API_KEY"
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: "أنت مساعد Orlixor. أجب باللغة العربية الفصحى دائمًا، وبأسلوب واضح ومهذب ومختصر ما لم يطلب المستخدم التفصيل. إذا كان السؤال بسيطًا فأجب مباشرة، وإذا كان يحتاج شرحًا فرتب الإجابة بنقاط قصيرة وواضحة.",
      input: message
    });

    return res.status(200).json({
      ok: true,
      provider: "openai",
      model: "gpt-4o-mini",
      answer: response.output_text || "No response"
    });
  } catch (error) {
    console.error("ASSISTANT_V3_ERROR", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type
    });

    return res.status(500).json({
      ok: false,
      error: "ASSISTANT_V3_FAILED",
      message: error?.message || "Unknown error",
      status: error?.status || null,
      code: error?.code || null,
      type: error?.type || null
    });
  }
};
