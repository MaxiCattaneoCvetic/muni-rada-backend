const { execSync } = require('node:child_process');

const port = Number.parseInt(process.argv[2] ?? '3000', 10);

if (!Number.isInteger(port) || port <= 0) {
  console.error('Invalid port number.');
  process.exit(1);
}

function getListeningPids(targetPort) {
  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${targetPort}`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).toString();

    return [...new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && line.includes('LISTENING'))
        .map((line) => line.split(/\s+/).at(-1))
        .map((value) => Number.parseInt(value ?? '', 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    )];
  } catch (error) {
    if (typeof error === 'object' && error && 'status' in error && error.status === 1) {
      return [];
    }
    throw error;
  }
}

for (const pid of getListeningPids(port)) {
  try {
    execSync(`taskkill /PID ${pid} /F`, {
      stdio: 'ignore',
      windowsHide: true,
    });
  } catch {
    // Ignore races if the process already exited.
  }
}
