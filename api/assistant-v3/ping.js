module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "PING_OK"
    });
  }

  return res.status(405).json({
    ok: false,
    error: "METHOD_NOT_ALLOWED",
    message: "Use GET /api/assistant-v3/ping"
  });
};
