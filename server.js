const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function safePath(urlPath) {
  const normalized = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  return path.join(ROOT, normalized);
}

http
  .createServer((req, res) => {
    const rawPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const requestPath = rawPath === "/" ? "/index.html" : rawPath;
    const filePath = safePath(requestPath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(ROOT, "index.html"), (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404);
            res.end("Not found");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(fallbackData);
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log("Dr. Robby listening on port " + PORT);
  });
