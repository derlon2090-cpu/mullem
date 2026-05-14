const OpenAI = require("openai");

function resolveOpenAiWebSearchV2Model() {
  return "gpt-4.1-mini";
}

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ""
    });
  }
  return client;
}

async function openAiWebSearchV2Raw(userQuery) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const input = String(userQuery || "").trim();
  const toolsToTry = [
    [{ type: "web_search_preview" }],
    [{ type: "web_search" }]
  ];

  let lastError = null;
  for (const tools of toolsToTry) {
    try {
      const response = await getClient().responses.create({
        model: resolveOpenAiWebSearchV2Model(),
        input,
        tools
      });

      return response;
    } catch (error) {
      lastError = error;
      const message = String(error?.message || "");
      const shouldRetry = /web_search_preview|web_search/i.test(message) ||
        Number(error?.status || error?.statusCode || 0) === 400;
      if (!shouldRetry) {
        throw error;
      }
    }
  }

  const finalError = new Error(`OpenAI web search failed: ${String(lastError?.message || "Unknown error")}`);
  finalError.status = Number(lastError?.status || lastError?.statusCode || 500) || 500;
  finalError.code = lastError?.code || "OPENAI_WEB_SEARCH_FAILED";
  throw finalError;
}

async function openAiWebSearchV2(userQuery) {
  const response = await openAiWebSearchV2Raw(userQuery);
  return String(response?.output_text || "").trim();
}

module.exports = {
  openAiWebSearchV2,
  openAiWebSearchV2Raw,
  resolveOpenAiWebSearchV2Model
};
