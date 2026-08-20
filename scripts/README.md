# NUC device detector

`detect-nuc.mjs` finds Intel NUC devices on your local network.

It must be run **on a machine connected to the same home network as the NUC**
(a laptop or Pi on your WiFi/LAN) — it cannot be run remotely against a
network it isn't on.

## Usage

```bash
npm run detect-nuc
# or target a specific subnet:
node scripts/detect-nuc.mjs --subnet 192.168.1.0/24
# skip the vendor lookup (offline / faster):
node scripts/detect-nuc.mjs --no-lookup
```

## How it works

1. Ping-sweeps the local /24 subnet to populate the OS ARP cache.
2. Reads the ARP table (IP ↔ MAC address) via `arp -a`.
3. For each device, looks up the MAC vendor (via api.macvendors.com) and
   reverse-DNS/mDNS hostname, and flags it as a likely NUC if the vendor is
   Intel or the hostname contains "nuc".

Requires Node.js 18+ (for built-in `fetch`). No extra dependencies.
