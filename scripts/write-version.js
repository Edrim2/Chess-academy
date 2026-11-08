const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "www");
const packageJson = require(path.join(rootDir, "package.json"));

const buildNumber = Number(process.env.GITHUB_RUN_NUMBER || 0);
const payload = {
  name: "Chess Academy",
  version: packageJson.version || "0.5.0",
  build: Number.isFinite(buildNumber) && buildNumber > 0 ? buildNumber : 0
};

fs.mkdirSync(outDir, { recursive: true });

for (const directory of [rootDir, outDir]) {
  const target = path.join(directory, "version.json");
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
}
