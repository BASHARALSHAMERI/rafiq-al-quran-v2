const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const host = process.env.FRONTEND_HOST || "localhost";
const port = Number(process.env.FRONTEND_PORT || 5173);
const distDir = path.resolve(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

if (!fs.existsSync(indexPath)) {
  console.error("dist/index.html was not found. Run `npm run build` first.");
  process.exit(1);
}

const sendFile = (res, filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer((req, res) => {
  const requestPath = req.url === "/" ? "/index.html" : decodeURIComponent((req.url || "/").split("?")[0]);
  const resolvedPath = path.resolve(distDir, `.${requestPath}`);

  if (!resolvedPath.startsWith(distDir)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(resolvedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(res, resolvedPath);
      return;
    }

    sendFile(res, indexPath);
  });
});

server.listen(port, host, () => {
  console.log(`Frontend preview running on http://${host}:${port}`);
});
