import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import https from "https";

const app = express();

const TARGET = "wss://morescosapp.shop"; // seu servidor SSH-WS ou V2Ray WS
const PORT = process.env.PORT || 8080;

// Middleware de log simples
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Proxy WebSocket e HTTP
app.use(
  "/",
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true,
    secure: false,
    logLevel: "warn",
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader("Host", "morescosapp.shop");
    },
    onError(err, req, res) {
      console.error("[Proxy Error]", err.message);
      if (!res.headersSent) res.status(502).send("Bad Gateway");
    },
  })
);

// Rota de status
app.get("/status", (req, res) => {
  res.status(200).send("✅ Proxy ativo no Fly.io 🚀");
});

// Inicia o servidor e envia keep-alive
app.listen(PORT, () => {
  console.log(`✅ Proxy ativo na porta ${PORT} -> ${TARGET}`);

  setInterval(() => {
    https
      .get(`https://${process.env.FLY_APP_NAME}.fly.dev/status`, (res) => {
        console.log(`[Keep-Alive] Ping enviado | Status: ${res.statusCode}`);
      })
      .on("error", (err) => {
        console.error("[Keep-Alive] Erro:", err.message);
      });
  }, 10 * 60 * 1000); // a cada 10 minutos
});
