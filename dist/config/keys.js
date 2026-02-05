"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keys = void 0;
class Keys {
    constructor() {
        this.PORT = null;
        this.MONGO_URL = null;
        this.JWT_SECRET = null;
        this.SMTP_HOST = null;
        this.SMTP_PORT = null;
        this.SMTP_AUTH_EMAIL = null;
        this.SMTP_AUTH_PASS = null;
        this.BASE_URL = null;
        this.WEB_BASE_URL = null;
        this.Admin_BASE_URL = null;
        this.ENCRYPTION_SECRET = null;
        this.WEB_STREAMER_ID = null;
        this.MORALIS_KEY = null;
        this.ADMIN_WALLET_PRIVATE_KEY = null;
        this.TATUM_X_API_KEY = null;
        this.TATUM_NETWORK = null;
        this.TRON_ADMIN_PRIVATE_KEY = null;
        this.TRON_ADMIN_ADDRESS = null;
        this.COINGECKO_PRO_API_KEY = null;
        this.COINGECKO_PRO_URL = null;
        this.TRON_OWNER_ADDRESS = null;
        this.TRON_GRID_API_KEY = null;
        this.EVM_OWNER_ADDRESS = null;
        this.BTC_OWNER_ADDRESS = null;
        this.TRON_NODE = null;
        try {
            require("dotenv").config();
        }
        catch (error) { }
        this.prepareKeys();
    }
    prepareKeys() {
        this.PORT = process.env.PORT;
        this.MONGO_URL = process.env.MONGO_URL;
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.SMTP_HOST = process.env.SMTP_HOST;
        this.SMTP_PORT = process.env.SMTP_PORT;
        this.SMTP_AUTH_EMAIL = process.env.SMTP_AUTH_EMAIL;
        this.SMTP_AUTH_PASS = process.env.SMTP_AUTH_PASS;
        this.BASE_URL = process.env.BASE_URL;
        this.WEB_BASE_URL = process.env.WEB_BASE_URL;
        this.Admin_BASE_URL = process.env.Admin_BASE_URL;
        this.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
        this.WEB_STREAMER_ID = process.env.WEB_STREAMER_ID;
        this.MORALIS_KEY = process.env.MORALIS_KEY;
        this.ADMIN_WALLET_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY;
        this.TATUM_X_API_KEY = process.env.TATUM_X_API_KEY;
        this.TATUM_NETWORK = process.env.TATUM_NETWORK;
        this.TRON_ADMIN_PRIVATE_KEY = process.env.TRON_ADMIN_PRIVATE_KEY;
        this.TRON_ADMIN_ADDRESS = process.env.TRON_ADMIN_ADDRESS;
        this.COINGECKO_PRO_API_KEY = process.env.COINGECKO_PRO_API_KEY;
        this.COINGECKO_PRO_URL = process.env.COINGECKO_PRO_URL;
        this.TRON_OWNER_ADDRESS = process.env.TRON_OWNER_ADDRESS;
        this.TRON_GRID_API_KEY = process.env.TRON_GRID_API_KEY;
        this.EVM_OWNER_ADDRESS = process.env.EVM_OWNER_ADDRESS;
        this.BTC_OWNER_ADDRESS = process.env.BTC_OWNER_ADDRESS;
        this.TRON_NODE = process.env.TRON_NODE;
    }
}
exports.Keys = Keys;
//# sourceMappingURL=keys.js.map