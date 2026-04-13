const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";

function timestamp(): string {
  return DIM + new Date().toLocaleTimeString("en-US", { hour12: false }) + RESET;
}

function format(label: string, color: string, msg: string): string {
  return `${timestamp()} ${color}[${label}]${RESET} ${msg}`;
}

export const log = {
  server: (msg: string) => console.log(format("server", BLUE, msg)),
  ws: (msg: string) => console.log(format("ws", CYAN, msg)),
  device: (msg: string) => console.log(format("device", GREEN, msg)),
  tunnel: (msg: string) => console.log(format("tunnel", YELLOW, msg)),
  sim: (msg: string) => console.log(format("sim", GREEN, msg)),
  error: (msg: string) => console.error(format("error", RED, msg)),
};
