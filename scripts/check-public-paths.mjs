/**
 * Unit-style check: ensure PUBLIC_PATHS includes "/contact" so the contact page is public.
 * Run: node scripts/check-public-paths.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "../lib/auth/publicPaths.ts");
const content = fs.readFileSync(filePath, "utf8");

const requiredPath = "/contact";
const hasContact =
  content.includes(`"${requiredPath}"`) || content.includes(`'${requiredPath}'`);

if (!hasContact) {
  console.error("FAIL: PUBLIC_PATHS must include '/contact' in lib/auth/publicPaths.ts");
  process.exit(1);
}

console.log("OK: PUBLIC_PATHS includes '/contact'");
