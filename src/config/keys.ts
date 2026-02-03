export class Keys {
  PORT: string = null;
  MONGO_URL: string = null;
  JWT_SECRET: string = null;
  SMTP_HOST: string = null;
  SMTP_PORT: string = null;
  SMTP_AUTH_EMAIL: string = null;
  SMTP_AUTH_PASS: string = null;
  BASE_URL: string = null;
  WEB_BASE_URL: string = null;
  Admin_BASE_URL: string = null;
  ENCRYPTION_SECRET: string = null;
  WEB_STREAMER_ID: string = null;
  MORALIS_KEY: string = null;
  ADMIN_WALLET_PRIVATE_KEY: string = null;
  TATUM_X_API_KEY: string = null;
  TATUM_NETWORK: string = null;
  TRON_ADMIN_PRIVATE_KEY: string = null;
  TRON_ADMIN_ADDRESS: string = null;
  COINGECKO_PRO_API_KEY: string = null;
  COINGECKO_PRO_URL: string = null;
  TRON_OWNER_ADDRESS: string = null;
  TRON_GRID_API_KEY: string = null;
  EVM_OWNER_ADDRESS: string = null;
  BTC_OWNER_ADDRESS: string = null;
  TRON_NODE: string = null;

  constructor() {
    try {
      require("dotenv").config();
    } catch (error) { }
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
