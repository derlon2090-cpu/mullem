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

  const response = await getClient().responses.create({
    model: resolveOpenAiWebSearchV2Model(),
    input: String(userQuery || "").trim(),
    tools: [{ type: "web_search_preview" }]
  });

  return response;
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
