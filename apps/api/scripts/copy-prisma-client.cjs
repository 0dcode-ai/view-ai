const { cpSync, existsSync, mkdirSync, rmSync } = require("node:fs");
const { join } = require("node:path");

const apiRoot = join(__dirname, "..");
const source = join(apiRoot, "src", "generated");
const targetParent = join(apiRoot, "dist", "src");
const target = join(targetParent, "generated");

if (!existsSync(source)) {
  throw new Error(`Prisma client was not generated at ${source}`);
}

mkdirSync(targetParent, { recursive: true });
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

console.log(`Copied generated Prisma client to ${target}`);
