import { startTunnel } from "untun";

async function main() {
  console.log("Starting Cloudflare Quick Tunnel for port 4000...");
  const tunnel = await startTunnel({ port: 4000 });
  const url = await tunnel.getURL();
  console.log("=== CLOUDFLARE TUNNEL LIVE ===");
  console.log("PUBLIC_URL:", url);
}

main().catch((err) => {
  console.error("Tunnel error:", err);
});
