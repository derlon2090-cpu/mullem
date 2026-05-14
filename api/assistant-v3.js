module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "POST") {
    return res.status(200).json({
      ok: true,
      answer: "ASSISTANT_V3_ROUTE_WORKING"
    });
  }

  return res.status(405).json({
    ok: false,
    error: "METHOD_NOT_ALLOWED",
    message: "Use POST /api/assistant-v3"
  });
};
