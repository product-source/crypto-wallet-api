"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyIpWhitelist = verifyIpWhitelist;
function verifyIpWhitelist(whitelistedIPs, clientIp) {
    if (!whitelistedIPs || whitelistedIPs.length === 0) {
        return true;
    }
    if (!clientIp) {
        return false;
    }
    let normalizedClientIp = clientIp.replace(/^::ffff:/, "");
    if (normalizedClientIp === "::1") {
        normalizedClientIp = "127.0.0.1";
    }
    return whitelistedIPs.some((rule) => {
        let normalizedRule = rule === "::1" ? "127.0.0.1" : rule.replace(/^::ffff:/, "");
        if (normalizedRule === normalizedClientIp) {
            return true;
        }
        if (normalizedRule.includes("/")) {
            try {
                const [subnet, prefixLenStr] = normalizedRule.split("/");
                const prefixLen = parseInt(prefixLenStr, 10);
                const ipToInt = (ipStr) => {
                    return ipStr.split(".").reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
                };
                const subnetInt = ipToInt(subnet);
                const clientInt = ipToInt(normalizedClientIp);
                const mask = (0xffffffff << (32 - prefixLen)) >>> 0;
                return (clientInt & mask) === (subnetInt & mask);
            }
            catch (err) {
                return false;
            }
        }
        return false;
    });
}
//# sourceMappingURL=ip-whitelist.helper.js.map