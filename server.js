import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import https from "https";

// === CONFIGURAÇÃO PRINCIPAL ===
const TARGET = "https://morescosapp.shop"; // seu destino (ex: VPS, Nginx, etc.)
const PORT = process.env.PORT || 8080;

const app = express();

// === PROXY ===
app.use(
  "/",
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    ws: true, // suporte WebSocket (101)
    secure: false,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader("Host", "morescosapp.shop");
    },
    onProxyRes(proxyRes, req, res) {
      // Altera status 101 e 200 OK conforme tipo de conexão
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === "websocket") {
        res.statusCode = 101; // Switching Protocols
      } else {
        proxyRes.statusCode = 200;
      }
    },
    onError(err, req, res) {
      console.error("Erro de proxy:", err.message);
      res.status(502).send("Bad Gateway");
    },
  })
);

// === ROTA DE TESTE LOCAL ===
app.get("/status", (req, res) => {
  res.status(200).send("Proxy ativo e funcionando ✅");
});

// === KEEP-ALIVE AUTOMÁTICO ===
function keepAlive() {
  const url = `https://renderr-f5lj.onrender.com/status`;
  https
    .get(url, (res) => {
      console.log(`[KEEPALIVE] Status: ${res.statusCode}`);
    })
    .on("error", (err) => {
      console.log(`[KEEPALIVE] Erro: ${err.message}`);
    });
}

// Dispara a cada 10 minutos
setInterval(keepAlive, 10 * 60 * 1000);

// === INICIAR SERVIDOR ===
app.listen(PORT, () => {
  console.log(`🚀 Proxy ativo na porta ${PORT} -> ${TARGET}`);
  keepAlive();
});
