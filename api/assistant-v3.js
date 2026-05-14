const OpenAI = require("openai");

function readMessage(req) {
  const body = typeof req.body === "string"
    ? JSON.parse(req.body || "{}")
    : (req.body || {});

  return String(body.message || body.query || body.prompt || "").trim();
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "POST") {
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

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `أجب عن السؤال التالي بشكل مفيد وواضح. إذا كان يحتاج معلومات حديثة، وضح أن الإجابة قد لا تكون محدثة:\n\n${message}`
      });

      return res.status(200).json({
        ok: true,
        provider: "openai",
        model: "gpt-4o-mini",
        answer: response.output_text || "No answer returned"
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
  }

  return res.status(405).json({
    ok: false,
    error: "METHOD_NOT_ALLOWED",
    message: "Use POST /api/assistant-v3"
  });
};
