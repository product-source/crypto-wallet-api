import { ForbiddenException } from "@nestjs/common";

/**
 * Validates a client IP address against a list of whitelisted IPs or CIDR blocks.
 * @param whitelistedIPs Array of allowed IPs or CIDR subnets (e.g., ['192.168.1.1', '10.0.0.0/24'])
 * @param clientIp The IP address of the incoming request
 * @returns boolean true if authorized, false otherwise.
 */
export function verifyIpWhitelist(whitelistedIPs: string[], clientIp: string): boolean {
  if (!whitelistedIPs || whitelistedIPs.length === 0) {
    // If no whitelist is configured, allow all traffic (or change to false if strict)
    return true; 
  }

  if (!clientIp) {
    return false;
  }

  // Normalize IPv6 localhost
  let normalizedClientIp = clientIp.replace(/^::ffff:/, "");
  if (normalizedClientIp === "::1") {
    normalizedClientIp = "127.0.0.1";
  }

  return whitelistedIPs.some((rule) => {
    let normalizedRule = rule === "::1" ? "127.0.0.1" : rule.replace(/^::ffff:/, "");

    // Check for exact match
    if (normalizedRule === normalizedClientIp) {
      return true;
    }

    // Check for CIDR block (IPv4 only implementation for simplicity)
    if (normalizedRule.includes("/")) {
      try {
        const [subnet, prefixLenStr] = normalizedRule.split("/");
        const prefixLen = parseInt(prefixLenStr, 10);
        
        // Convert IPs to 32-bit integers
        const ipToInt = (ipStr: string) => {
          return ipStr.split(".").reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
        };

        const subnetInt = ipToInt(subnet);
        const clientInt = ipToInt(normalizedClientIp);
        
        // Create subnet mask
        const mask = (0xffffffff << (32 - prefixLen)) >>> 0;

        return (clientInt & mask) === (subnetInt & mask);
      } catch (err) {
        // If parsing fails, ignore this rule
        return false;
      }
    }

    return false;
  });
}
