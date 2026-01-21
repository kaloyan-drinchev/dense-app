const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;
const EXPO_PORT = 8081;

// Add headers middleware for all requests
app.use((req, res, next) => {
  // Set the required headers for SharedArrayBuffer
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Proxy all requests to Expo dev server
app.use('/', createProxyMiddleware({
  target: `http://localhost:${EXPO_PORT}`,
  changeOrigin: true,
  ws: true, // Enable websocket proxying for hot reload
  onProxyRes: (proxyRes, req, res) => {
    // Ensure headers are set on response
    proxyRes.headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    proxyRes.headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📱 Proxying to Expo dev server on http://localhost:${EXPO_PORT}`);
  console.log(`✅ SharedArrayBuffer headers enabled`);
  console.log(`\n🌐 Open http://localhost:${PORT} in your browser instead of localhost:8081`);
});
