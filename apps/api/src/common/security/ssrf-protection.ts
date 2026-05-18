import { BadRequestException } from '@nestjs/common';
import * as dns from 'node:dns/promises';

// Private IPv4 ranges as [IP, SubnetMask]
const PRIVATE_IPV4_SUBNETS: [string, number][] = [
  ['127.0.0.0', 8],     // Loopback
  ['10.0.0.0', 8],      // RFC 1918 Private-Use
  ['172.16.0.0', 12],   // RFC 1918 Private-Use
  ['192.168.0.0', 16],  // RFC 1918 Private-Use
  ['169.254.0.0', 16],  // Link-Local
  ['224.0.0.0', 4],     // Multicast
  ['240.0.0.0', 4],     // Reserved / Future Use
  ['255.255.255.255', 32], // Broadcast
];

/**
 * Helper to convert IPv4 string to a 32-bit unsigned integer.
 */
function ipv4ToLong(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) {
    return -1;
  }
  const p0 = parts[0];
  const p1 = parts[1];
  const p2 = parts[2];
  const p3 = parts[3];

  if (
    p0 === undefined ||
    p1 === undefined ||
    p2 === undefined ||
    p3 === undefined ||
    isNaN(p0) ||
    isNaN(p1) ||
    isNaN(p2) ||
    isNaN(p3)
  ) {
    return -1;
  }

  return ((p0 << 24) + (p1 << 16) + (p2 << 8) + p3) >>> 0;
}

/**
 * Checks if an IPv4 address is within a given CIDR block.
 */
function inSubnet(ip: string, subnet: string, mask: number): boolean {
  const ipLong = ipv4ToLong(ip);
  const subnetLong = ipv4ToLong(subnet);
  if (ipLong === -1 || subnetLong === -1) return false;

  const maskLong = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0;
  return (ipLong & maskLong) === (subnetLong & maskLong);
}

/**
 * Checks if an IP is loopback, link-local, multicast, or private intranet space.
 */
function isPrivateIp(ip: string): boolean {
  // 1. IPv6 Checks (standard prefixes)
  if (ip.includes(':')) {
    const cleanIp = ip.toLowerCase().trim();
    if (cleanIp === '::1' || cleanIp === '0:0:0:0:0:0:0:1') return true; // Loopback
    if (cleanIp.startsWith('fe80:')) return true; // Link-Local
    if (cleanIp.startsWith('fc00:') || cleanIp.startsWith('fd00:')) return true; // Unique Local
    if (cleanIp.startsWith('ff00:')) return true; // Multicast
    return false;
  }

  // 2. IPv4 CIDR Block Checks
  for (const [subnet, mask] of PRIVATE_IPV4_SUBNETS) {
    if (inSubnet(ip, subnet, mask)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a URL to prevent Server-Side Request Forgery (SSRF).
 * Throws a BadRequestException if the URL resolves to a local or private address block.
 */
export async function validateWebhookUrl(urlStr: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch (err) {
    throw new BadRequestException('Invalid webhook URL format.');
  }

  // 1. Enforce HTTP/HTTPS protocols only
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException(`Protocol '${url.protocol}' is not supported for webhooks.`);
  }

  const hostname = url.hostname.toLowerCase();

  // 2. Short circuit obvious local names
  if (
    hostname === 'localhost' ||
    hostname === 'localhost.localdomain' ||
    hostname.endsWith('.local')
  ) {
    throw new BadRequestException('Webhook URL resolves to an insecure local endpoint.');
  }

  try {
    // 3. Resolve hostnames using DNS lookup
    const lookupResults = await dns.lookup(url.hostname, { all: true });
    
    for (const res of lookupResults) {
      const ip = res.address;
      
      // 4. Validate resolved IP range against IANA private/local ranges
      if (isPrivateIp(ip)) {
        throw new BadRequestException(`SSRF Blocked: Webhook endpoint resolves to private/local address space (${ip}).`);
      }
    }
  } catch (err: any) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException(`DNS Resolution failed for webhook host: ${url.hostname}`);
  }

  return urlStr;
}
