import { createServer } from "node:http";
import next from "next";

const port = Number(process.env.PORT || process.argv[2] || 3000);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const app = next({
  dev: false,
  dir: process.cwd(),
  hostname,
  port
});
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => {
  handle(request, response);
});

server.listen(port, hostname, () => {
  console.log(`Kho Phong Realtime ready at http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
