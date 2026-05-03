const { execFileSync, spawn } = require("child_process");
const net = require("net");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const managedChildren = [];

function log(message) {
  process.stdout.write(`[dev:all] ${message}\n`);
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });
}

function hasDockerComposePlugin() {
  try {
    execFileSync("docker", ["compose", "version"], {
      cwd: rootDir,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function getComposeCommand() {
  if (hasDockerComposePlugin()) {
    return { command: "docker", args: ["compose"] };
  }
  return { command: "docker-compose", args: [] };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(500);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, "127.0.0.1");
  });
}

async function waitForContainerHealthy(containerName, timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const status = execFileSync(
        "docker",
        ["inspect", "-f", "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", containerName],
        { cwd: rootDir, encoding: "utf8" },
      ).trim();

      if (status === "healthy" || status === "running") {
        return;
      }
    } catch {
      // The container may still be spinning up. Keep polling.
    }

    await wait(1500);
  }

  throw new Error(`Container ${containerName} did not become healthy within ${timeoutMs / 1000}s.`);
}

function startChild(label, npmScript) {
  const child = spawn(npmCmd, ["run", npmScript], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  managedChildren.push(child);

  child.on("exit", (code, signal) => {
    if (signal) {
      log(`${label} exited with signal ${signal}.`);
      return;
    }
    if (typeof code === "number" && code !== 0) {
      log(`${label} exited with code ${code}.`);
      shutdown(code);
    }
  });

  return child;
}

function shutdown(exitCode = 0) {
  for (const child of managedChildren) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(exitCode), 150);
}

async function main() {
  const compose = getComposeCommand();

  log("Starting PostgreSQL container...");
  run(compose.command, [...compose.args, "up", "-d", "postgres"]);

  log("Waiting for PostgreSQL health check...");
  await waitForContainerHealthy("interview-ai-postgres", 60000);

  log("Ensuring Web SQLite schema...");
  run(npmCmd, ["run", "db:push"]);

  log("Building shared API contract...");
  run(npmCmd, ["run", "build:shared"]);

  log("Ensuring API Postgres schema...");
  run(npmCmd, ["run", "prisma:push", "-w", "apps/api"]);

  const webRunning = await isPortOpen(3000);
  const apiRunning = await isPortOpen(4000);

  if (webRunning) {
    log("Port 3000 is already in use. Skipping Web startup.");
  } else {
    log("Starting Web on port 3000...");
    startChild("web", "dev:web");
  }

  if (apiRunning) {
    log("Port 4000 is already in use. Skipping API startup.");
  } else {
    log("Starting API on port 4000...");
    startChild("api", "dev:api");
  }

  if (managedChildren.length === 0) {
    log("Web and API already appear to be running.");
    return;
  }

  log("Stack is booting. Press Ctrl+C to stop managed processes.");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

main().catch((error) => {
  process.stderr.write(`[dev:all] ${error instanceof Error ? error.message : String(error)}\n`);
  shutdown(1);
});
