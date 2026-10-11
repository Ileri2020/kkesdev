#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

function main() {
  const root = path.resolve(__dirname, "..");
  let secret = process.env.AI_KEYS_ENCRYPTION_KEY || "";
  const previousConfigPath = path.join(root, "utils", "ai-secret-config.local.json");
  if (!secret && fs.existsSync(previousConfigPath)) {
    const previous = JSON.parse(fs.readFileSync(previousConfigPath, "utf8"));
    secret = typeof previous.AI_KEYS_ENCRYPTION_KEY === "string" ? previous.AI_KEYS_ENCRYPTION_KEY : "";
  }
  if (!secret || secret.length < 32) {
    throw new Error("The existing encryption key was not found in the process environment or previous local config.");
  }

  const configPath = path.join(root, "utils", "ai-secret-config.json");
  const payload = `${JSON.stringify({ AI_KEYS_ENCRYPTION_KEY: secret }, null, 2)}\n`;
  fs.writeFileSync(configPath, payload, { encoding: "utf8", mode: 0o600 });
  console.log("Copied the existing AI encryption key to utils/ai-secret-config.json. Secret value not displayed.");
  console.warn("This config is intentionally tracked by Git per request; anyone with repository access can decrypt the stored provider key.");
}

try {
  main();
} catch (error) {
  console.error(`Could not save local AI encryption config: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
}
