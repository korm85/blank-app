#!/usr/bin/env node
// Scans the local subnet for devices that look like an Intel NUC.
//
// Method:
//   1. Ping-sweep the target subnet to populate the OS ARP cache.
//   2. Read the ARP cache (IP -> MAC) via the platform's `arp` command.
//   3. Look up each MAC's vendor (api.macvendors.com) and each IP's
//      reverse-DNS / mDNS hostname, flagging anything that looks like a
//      NUC (vendor contains "Intel", or hostname matches /nuc/i).
//
// Must be run on a machine that is on the same local network as the NUC
// (this cannot be run from a remote sandbox against someone else's LAN).
//
// Usage:
//   node scripts/detect-nuc.mjs [--subnet 192.168.1.0/24] [--no-lookup] [--timeout 800]

import { exec } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import dns from "node:dns/promises";

const execAsync = promisify(exec);

function parseArgs(argv) {
  const args = { subnet: null, lookup: true, timeout: 800 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--subnet") args.subnet = argv[++i];
    else if (a === "--no-lookup") args.lookup = false;
    else if (a === "--timeout") args.timeout = Number(argv[++i]) || 800;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function guessLocalSubnet() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] ?? []) {
      if (info.family === "IPv4" && !info.internal) {
        const parts = info.address.split(".");
        parts[3] = "0";
        return `${parts.join(".")}/24`;
      }
    }
  }
  return null;
}

function cidrToHosts(cidr) {
  const [base, prefixStr] = cidr.split("/");
  const prefix = Number(prefixStr ?? 24);
  if (prefix < 16 || prefix > 30) {
    throw new Error("Only /16-/30 subnets are supported for a sweep");
  }
  const baseParts = base.split(".").map(Number);
  const baseInt =
    (baseParts[0] << 24) | (baseParts[1] << 16) | (baseParts[2] << 8) | baseParts[3];
  const hostBits = 32 - prefix;
  const count = 2 ** hostBits;
  const network = baseInt & (~0 << hostBits);
  const hosts = [];
  // Skip network (.0) and broadcast (last) addresses.
  for (let i = 1; i < count - 1; i++) {
    const ip = network + i;
    hosts.push(
      [(ip >>> 24) & 255, (ip >>> 16) & 255, (ip >>> 8) & 255, ip & 255].join(".")
    );
  }
  return hosts;
}

function pingCommand(ip, timeoutMs) {
  if (process.platform === "win32") {
    return `ping -n 1 -w ${timeoutMs} ${ip}`;
  }
  // -c 1 (one echo), -W timeout in seconds on Linux, macOS ping -W is ms.
  const timeoutArg = process.platform === "darwin" ? timeoutMs : Math.ceil(timeoutMs / 1000);
  return `ping -c 1 -W ${timeoutArg} ${ip}`;
}

async function ping(ip, timeoutMs) {
  try {
    await execAsync(pingCommand(ip, timeoutMs), { timeout: timeoutMs + 500 });
    return true;
  } catch {
    return false;
  }
}

async function sweep(hosts, timeoutMs, concurrency = 40) {
  let idx = 0;
  async function worker() {
    while (idx < hosts.length) {
      const ip = hosts[idx++];
      await ping(ip, timeoutMs);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

async function readArpTable() {
  const { stdout } = await execAsync(process.platform === "win32" ? "arp -a" : "arp -a");
  const entries = [];
  const macRe = /([0-9a-f]{1,2}[:-]){5}[0-9a-f]{1,2}/i;
  for (const line of stdout.split("\n")) {
    const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    const macMatch = line.match(macRe);
    if (ipMatch && macMatch) {
      const mac = macMatch[0].replace(/-/g, ":").toLowerCase();
      if (mac === "ff:ff:ff:ff:ff:ff") continue;
      entries.push({ ip: ipMatch[1], mac });
    }
  }
  // De-dupe by IP.
  const seen = new Map();
  for (const e of entries) seen.set(e.ip, e);
  return [...seen.values()];
}

async function lookupVendor(mac) {
  try {
    const res = await fetch(`https://api.macvendors.com/${mac}`);
    if (!res.ok) return null;
    return (await res.text()).trim();
  } catch {
    return null;
  }
}

async function lookupHostname(ip) {
  try {
    const names = await dns.reverse(ip);
    return names[0] ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      "Usage: node scripts/detect-nuc.mjs [--subnet 192.168.1.0/24] [--no-lookup] [--timeout 800]"
    );
    return;
  }

  const subnet = args.subnet ?? guessLocalSubnet();
  if (!subnet) {
    console.error("Could not determine local subnet. Pass one explicitly: --subnet 192.168.1.0/24");
    process.exitCode = 1;
    return;
  }

  console.log(`Sweeping ${subnet} ...`);
  const hosts = cidrToHosts(subnet);
  await sweep(hosts, args.timeout);

  console.log("Reading ARP table ...");
  const arpEntries = await readArpTable();
  if (arpEntries.length === 0) {
    console.log("No ARP entries found. Try running with sudo, or re-run right after the sweep.");
    return;
  }

  console.log(`Found ${arpEntries.length} device(s). Identifying NUC candidates ...\n`);

  const results = [];
  for (const entry of arpEntries) {
    const [vendor, hostname] = await Promise.all([
      args.lookup ? lookupVendor(entry.mac) : Promise.resolve(null),
      lookupHostname(entry.ip),
    ]);
    const isIntel = !!vendor && /intel/i.test(vendor);
    const nameLooksLikeNuc = !!hostname && /nuc/i.test(hostname);
    results.push({ ...entry, vendor, hostname, likelyNuc: isIntel || nameLooksLikeNuc });
    // Be polite to the free vendor-lookup API.
    if (args.lookup) await new Promise((r) => setTimeout(r, 400));
  }

  const width = { ip: 15, mac: 17 };
  console.log(
    "IP".padEnd(width.ip),
    "MAC".padEnd(width.mac),
    "Hostname".padEnd(24),
    "Vendor"
  );
  for (const r of results) {
    const marker = r.likelyNuc ? "★ " : "  ";
    console.log(
      marker +
        r.ip.padEnd(width.ip) +
        r.mac.padEnd(width.mac) +
        (r.hostname ?? "-").padEnd(24) +
        (r.vendor ?? "-")
    );
  }

  const candidates = results.filter((r) => r.likelyNuc);
  console.log("");
  if (candidates.length === 0) {
    console.log("No likely NUC devices found on this subnet.");
    console.log("Tips: make sure the NUC is powered on and connected, or try --subnet to target a different range.");
  } else {
    console.log(`Likely NUC device(s) (marked ★):`);
    for (const c of candidates) {
      console.log(`  ${c.ip}  ${c.mac}  ${c.hostname ?? ""}  ${c.vendor ?? ""}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
