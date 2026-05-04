#!/usr/bin/env node

/**
 * Run both backend and frontend development servers concurrently
 * Usage: node run-dev.js
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
};

const processes = [];

function log(service, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${service}]${colors.reset} ${message}`);
}

function startService(name, cwd, command, args) {
  log('ORCHESTRATOR', `Starting ${name}...`, colors.green);

  const proc = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
  });

  processes.push(proc);

  proc.on('error', (error) => {
    log(name, `Error: ${error.message}`, colors.yellow);
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      log(name, `Exited with code ${code}`, colors.yellow);
    }
  });

  return proc;
}

function cleanup() {
  log('ORCHESTRATOR', 'Shutting down services...', colors.yellow);
  processes.forEach((proc) => {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const rootDir = __dirname;
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

log('ORCHESTRATOR', 'Starting development environment...', colors.cyan);
log('ORCHESTRATOR', `Root: ${rootDir}`, colors.cyan);

// Start Backend
startService(
  'BACKEND',
  backendDir,
  'npm',
  ['run', 'dev']
);

// Give backend a moment to start, then start frontend
setTimeout(() => {
  startService(
    'FRONTEND',
    frontendDir,
    'npm',
    ['run', 'dev']
  );
}, 2000);

log('ORCHESTRATOR', 'Both services are starting...', colors.green);
log('ORCHESTRATOR', 'Press Ctrl+C to stop all services', colors.yellow);
