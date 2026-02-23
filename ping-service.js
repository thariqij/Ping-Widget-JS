/**
 * Ping service - uses OS native ping command
 * Cross-platform (Windows/Mac/Linux), no native addons, no admin privileges.
 * Spawns a continuous ping process and parses latency from stdout.
 */

const { spawn } = require('child_process');

/**
 * Start continuously pinging a target.
 *
 * @param {string} target - Hostname or IP to ping (e.g. '8.8.8.8')
 * @param {function} onResult - Callback: ({ seq, latency, timeout, error })
 * @returns {object} - { stop() } to stop pinging
 */
function startPing(target, onResult) {
  const isWindows = process.platform === 'win32';

  // -t on Windows = ping forever; on Mac/Linux ping runs forever by default
  const args = isWindows ? ['-t', target] : [target];
  const child = spawn('ping', args);

  let seq = 0;
  let stopped = false;

  child.stdout.on('data', (data) => {
    if (stopped) return;
    const lines = data.toString().split('\n');
    for (const line of lines) {
      const latency = parseLatency(line);
      if (latency !== null) {
        seq++;
        onResult({ seq, latency, timeout: false, error: null });
      } else if (isTimeoutLine(line)) {
        seq++;
        onResult({ seq, latency: null, timeout: true, error: null });
      }
    }
  });

  child.stderr.on('data', (data) => {
    if (stopped) return;
    seq++;
    onResult({ seq, latency: null, timeout: false, error: data.toString().trim() });
  });

  child.on('error', (err) => {
    if (stopped) return;
    onResult({ seq: 0, latency: null, timeout: false, error: `Failed to start ping: ${err.message}` });
  });

  child.on('close', (code) => {
    if (stopped) return;
    // Only report if unexpected exit
    if (code !== null && code !== 0) {
      onResult({ seq, latency: null, timeout: false, error: `Ping exited with code ${code}` });
    }
  });

  return {
    stop() {
      stopped = true;
      child.kill();
    }
  };
}

/**
 * Parse latency from a ping output line.
 * Handles Windows ("time=12ms", "time<1ms") and Unix ("time=12.3 ms") formats.
 *
 * @param {string} line
 * @returns {number|null} latency in ms, or null if not a reply line
 */
function parseLatency(line) {
  // Windows: "time=42ms" or "time<1ms"
  // Mac/Linux: "time=42.123 ms"
  const match = line.match(/time[=<]([\d.]+)\s*ms/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Check if a line indicates a timeout.
 *
 * @param {string} line
 * @returns {boolean}
 */
function isTimeoutLine(line) {
  const lower = line.toLowerCase();
  return lower.includes('request timed out') ||    // Windows
         lower.includes('request timeout') ||       // Mac
         lower.includes('no answer yet') ||          // Some Linux
         (lower.includes('icmp_seq') && lower.includes('timeout'));
}

module.exports = { startPing };
