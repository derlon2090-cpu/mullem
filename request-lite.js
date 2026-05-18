"use strict";

const http = require("http");
const https = require("https");
const { URL } = require("url");

function requestText(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const headers = { ...(options.headers || {}) };
    if (options.accept) headers.Accept = options.accept;
    if (options.body != null && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    const req = client.request(parsed, {
      method: options.method || "GET",
      headers,
      timeout: Math.max(1000, Number(options.timeout || 15000))
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          text: Buffer.concat(chunks).toString("utf8")
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error(`Request timed out after ${Math.max(1000, Number(options.timeout || 15000))}ms`)));
    if (options.body != null) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function requestJson(url, options = {}) {
  const response = await requestText(url, options);
  let payload = {};
  try {
    payload = response.text ? JSON.parse(response.text) : {};
  } catch (_) {
    payload = { raw: response.text };
  }
  return {
    ...response,
    payload,
    ok: response.status >= 200 && response.status < 300 &&
      payload?.success !== false &&
      payload?.ok !== false
  };
}

module.exports = { requestText, requestJson };
