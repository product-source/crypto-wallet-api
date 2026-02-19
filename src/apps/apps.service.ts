import { getTronBalance } from "./../helpers/tron.helper";
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Apps, AppsDocument } from "./schema/apps.schema";
import { CreateAppsDto, UpdateAppsDto } from "./dto/apps.dto";
import * as crypto from "crypto";
import { EncryptionService } from "src/utils/encryption.service";
import { generateEvmWallet, generateMnemonic } from "src/helpers/evm.helper";
import {
  WalletMonitor,
  WalletMonitorDocument,
} from "src/wallet-monitor/schema/wallet-monitor.schema";

import { WalletType } from "src/wallet-monitor/schema/wallet-monitor.enum";
import { ConfigService } from "src/config/config.service";
import Moralis from "moralis";
import { generateTronWallet, transferTron } from "src/helpers/tron.helper";
import { generateBitcoinWallet } from "src/helpers/bitcoin.helper";
import {
  Notification,
  NotificationDocument,
} from "src/notification/schema/notification.schema";
import { Token, TokenDocument } from "src/token/schema/token.schema";
import {
  PaymentLink,
  PaymentLinkDocument,
} from "src/payment-link/schema/payment-link.schema";
import {
  FiatWithdraw,
  FiatWithdrawDocument,
} from "src/merchant-app-tx/schema/fiat-withdraw.schema";
import { Merchant, MerchantDocument } from "src/merchants/schema/merchant.schema";
import { WebhookService } from "src/webhook/webhook.service";

@Injectable()
export class AppsService {
  constructor(
    @InjectModel(Apps.name)
    private readonly appsModel: Model<AppsDocument>,

    @InjectModel(Merchant.name)
    private readonly merchantModel: Model<MerchantDocument>,

    @InjectModel(WalletMonitor.name)
    private readonly monitorModel: Model<WalletMonitorDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,

    @InjectModel(PaymentLink.name)
    private readonly paymentLinkModel: Model<PaymentLinkDocument>,

    @InjectModel(FiatWithdraw.name)
    private readonly fiatWithdrawModel: Model<FiatWithdrawDocument>,

    private encryptionService: EncryptionService,
    private webhookService: WebhookService
  ) { }

  async addApp(user, dto: CreateAppsDto, file: any) {
    try {
      const { name, description } = dto;

      const getTokens = await this.tokenModel.find({
        chainId: { $in: ["TRON"] },
        code: { $in: ["TRX"] },
      });

      const tronTokenContractAddress = await getTokens[0]?.address;
      const tronTokenDecimal = await getTokens[0]?.decimal;
      const tronAdminPvtKey = ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
      const tronAdminAddress = ConfigService.keys.TRON_ADMIN_ADDRESS;
      const tronAmount = 0.000001;
      const totalActivationCost = tronAmount + 1.1;
      const isAdminBalance = await getTronBalance(tronAdminAddress);

      const appExist = await this.appsModel.findOne({ name });
      if (appExist) {
        throw new NotAcceptableException("This app is already present");
      }
      const totalUserApp = await this.appsModel.find({
        merchantId: user?.userId,
      });
      if (totalUserApp?.length > 2) {
        throw new BadRequestException("Only 3 apps can generated");
      }
      const model = await new this.appsModel();

      const publicKey = crypto.randomBytes(48).toString("base64url");
      const privateKey = crypto.randomBytes(48).toString("base64url");

      if (publicKey === privateKey) {
        throw new NotAcceptableException("Both keys are same");
      }
      if (!publicKey || !privateKey) {
        throw new NotAcceptableException("Keys not generated properly");
      }

      //generating Mnemonic
      const generate = generateMnemonic();
      if (!generate) {
        throw new NotAcceptableException("Error in generating Mnemonic");
      }

      // generate evm wallet
      const walletInfo = await generateEvmWallet(generate, 0);
      const tronWallet = await generateTronWallet(generate, 0);
      const btcWallet = await generateBitcoinWallet(generate, 0);

      if (!walletInfo && !tronWallet && !btcWallet) {
        throw new NotAcceptableException("Error in generating wallet");
      }

      // For EVM
      const encryptedPrivateKey = this.encryptionService.encryptData(
        walletInfo?.privateKey
      );
      const encryptedMnemonicPhrase = this.encryptionService.encryptData(
        walletInfo?.mnemonic.phrase
      );
      const encryptedMnemonicPath = this.encryptionService.encryptData(
        walletInfo?.mnemonic.path
      );

      // For Tron Wallet
      const encryptedTronPrivateKey = this.encryptionService.encryptData(
        tronWallet?.privateKey
      );
      const encryptedTronMnemonicPath = this.encryptionService.encryptData(
        tronWallet?.path
      );

      // For Bitcoin Wallet
      const encryptedBtcPrivateKey = this.encryptionService.encryptData(
        btcWallet?.privateKey
      );
      const encryptedBtcMnemonicPath = this.encryptionService.encryptData(
        btcWallet?.path
      );

      if (publicKey && privateKey && tronWallet?.address) {
        model.merchantId = user?.userId;
        model.name = name.trim();
        model.description = description.trim();
        console.log("Adding App - DTO:", JSON.stringify(dto));
        const { theme } = dto;
        if (theme) {
          console.log("Setting theme:", theme);
          model.theme = theme;
        }
        if (file) {
          model.logo = file.path.replace(/\\/g, "/");
        }
        model.API_KEY = this.encryptionService.encryptData(publicKey);
        model.SECRET_KEY = this.encryptionService.encryptData(privateKey);

        //index no
        model.currentIndexVal = walletInfo?.index;
        model.tronCurrentIndexVal = tronWallet?.index;

        model.EVMWalletMnemonic = {
          address: walletInfo?.address,
          privateKey: encryptedPrivateKey,
          mnemonic: {
            phrase: encryptedMnemonicPhrase,
            path: encryptedMnemonicPath,
            locale: walletInfo?.mnemonic.locale,
          },
        };
        // For Tron wallet
        model.TronWalletMnemonic = {
          address: tronWallet?.address,
          privateKey: encryptedTronPrivateKey,
          mnemonic: {
            phrase: encryptedMnemonicPhrase, // same as evm
            path: encryptedTronMnemonicPath,
            locale: walletInfo?.mnemonic.locale, // same as evm
          },
        };

        // For Bitcoin wallet
        model.BtcWalletMnemonic = {
          address: btcWallet?.address,
          privateKey: encryptedBtcPrivateKey,
          mnemonic: {
            phrase: encryptedMnemonicPhrase, // same as evm
            path: encryptedBtcMnemonicPath,
            locale: walletInfo?.mnemonic.locale, // same as evm
          },
        };

        if (isAdminBalance >= totalActivationCost) {
          console.log("isAdminBalance", isAdminBalance);
          console.log("totalActivationCost", totalActivationCost);
          const initialTronTransfer = await transferTron(
            tronAdminPvtKey,
            tronTokenContractAddress,
            tronWallet?.address,
            tronAmount,
            tronTokenDecimal
          );

          // Log actual receipt to debug mainnet response shape
          console.log("initialTronTransfer receipt:", JSON.stringify(initialTronTransfer));

          // Accept any truthy receipt: { result: true }, { txid: '...' }, or 64-char txid string
          const tronTransferOk =
            initialTronTransfer &&
            (
              (typeof initialTronTransfer === 'object' &&
                (initialTronTransfer.result === true ||
                  typeof initialTronTransfer.txid === 'string')) ||
              (typeof initialTronTransfer === 'string' &&
                initialTronTransfer.length === 64)
            );

          if (tronTransferOk) {
            await model.save();

            // saving notification
            const notificationModel = new this.notificationModel({
              merchantId: model?.merchantId,
              message: "App Created successfully",
            });
            await notificationModel.save();

            // Push the address into the moralis server (non-blocking)
            try {
              await Moralis.Streams.addAddress({
                id: ConfigService.keys.WEB_STREAMER_ID,
                address: model?.EVMWalletMnemonic?.address,
              });
            } catch (moralisError) {
              console.log("Warning: Moralis.Streams.addAddress failed (non-critical):", moralisError?.message || moralisError);
            }

            //  data in wallet monitor
            const wallet = await new this.monitorModel();
            wallet.appId = model?._id;
            wallet.walletAddress = model?.EVMWalletMnemonic?.address;
            wallet.tokenAddress = "All Native Currency and Tokens";
            wallet.chainId = "0";
            wallet.expiryTime = 0;
            wallet.walletType = WalletType.APP;
            wallet.appId = model._id;
            wallet.isExpiry = false;
            wallet.streamId = ConfigService.keys.WEB_STREAMER_ID;
            await wallet.save();

            return { message: "App created succesfully" };
          }
        } else {
          throw new NotAcceptableException(
            "Admin don't have sufficient TRX for creating a new app."
          );
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getApps00(user, query) {
    try {
      const { pageNo, limitVal, search } = query;

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      // let queryObject = {};
      let queryObject: any = { merchantId: user?.userId };

      if (search) {
        queryObject = {
          ...queryObject,
          $or: [{ name: { $regex: search, $options: "i" } }],
        };
      }

      const app = await this.appsModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ _id: -1 });

      const count = await this.appsModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        message: "apss info",
        total: count,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        data: app,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getApps(user, query) {
    try {
      const { pageNo, limitVal, search } = query;

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let queryObject: any = { merchantId: user?.userId };

      if (search) {
        queryObject = {
          ...queryObject,
          $or: [{ name: { $regex: search, $options: "i" } }],
        };
      }

      // -------------------------------
      // 1️⃣ Fetch Apps (Pagination)
      // -------------------------------
      const apps = await this.appsModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ _id: -1 });

      const count = await this.appsModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const updatedApps = apps.map((app) => {
        const appObj = app.toObject();
        if (appObj.logo) {
          appObj.logo = appObj.logo.replace(/\\/g, "/");
        }
        return appObj;
      });

      // ----------------------------------------
      // 2️⃣ Calculate FIAT Balance For Each App
      // ----------------------------------------
      let merchantTotalFiat = 0; // total of all apps

      for (let app of updatedApps) {
        const appId = app?._id;

        // Get transactions
        const transactions = await this.paymentLinkModel.find({ appId });

        // Withdrawals
        const fiatWithdrawl = await this.fiatWithdrawModel.find({ appsId: appId });

        // Calculate SUCCESS FIAT → USD
        let totalSuccessFiat = 0;
        transactions.forEach((txn) => {
          if (txn.transactionType === "FIAT" && txn.status === "SUCCESS") {
            totalSuccessFiat += Number(txn.fiatToUsd) || 0;
          }
        });

        // Subtract SUCCESS withdrawals
        fiatWithdrawl.forEach((wd) => {
          if (wd.status === "SUCCESS") {
            totalSuccessFiat -= Number(wd.withdrawlAmount) || 0;
          }
        });

        // Store inside app object so it returns in API
        // app.totalFiatToUsd = Number(totalSuccessFiat.toFixed(6));

        // Add to merchant total
        merchantTotalFiat += Number(totalSuccessFiat);

        // Update in DB
        // ----------------------------------------
        // 3️⃣ Update Merchant totalFiatBalance
        // ----------------------------------------
        await this.merchantModel.findByIdAndUpdate(
          user?.userId,
          { totalFiatBalance: Number(merchantTotalFiat.toFixed(6)) },
          { new: true }
        );
      }

      // -------------------------------
      // 3️⃣ Return final response
      // -------------------------------
      return {
        message: "apps info",
        total: count,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPrevPage,

        // 🌟 NEW: Merchant total FIAT across all apps
        // 🌟 NEW: Merchant total FIAT across all apps
        merchantTotalFiat: Number(merchantTotalFiat.toFixed(6)),

        data: updatedApps,
      };

    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(error);
    }
  }

  // async appById(user, query) {
  //   try {
  //     const userId = user?.userId;

  //     const { appId } = query;

  //     const app = await this.appsModel.findById({
  //       _id: appId,
  //       merchantId: userId,
  //     });

  //     if (!app) {
  //       return new NotFoundException("Invalid app Id");
  //     }

  //     const publicKey = await this.encryptionService.decryptData(app?.API_KEY);
  //     const privateKey = await this.encryptionService.decryptData(
  //       app?.SECRET_KEY
  //     );

  //     const transactions = await this.paymentLinkModel.find({ appId: appId });

  //     const fiatWithdrawl = await this.fiatWithdrawModel.find({ appId: appId });

  //     console.log('fiatWithdrawl',fiatWithdrawl)

  //     let totalFiatToUsd = 0;

  //     const txns = transactions.map((txn) => {
  //       const obj = txn.toObject();

  //       if (obj?.transactionType === "FIAT" && obj?.status === "SUCCESS") {
  //         const fiatToUsd = Number(obj?.fiatToUsd) || 0;
  //         totalFiatToUsd += fiatToUsd;
  //       }

  //       return obj;
  //     });

  //     // STEP 3: Update in DB (Apps table)
  //     const updatedApp = await this.appsModel.findByIdAndUpdate(
  //       appId,
  //       { totalFiatBalance: Number(totalFiatToUsd.toFixed(6)) },
  //       { new: true }
  //     );

  //     return {
  //       message: "apps by Id",
  //       totalFiatToUsd: Number(totalFiatToUsd.toFixed(6)),
  //       data: app,
  //     };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     } else {
  //       console.log("An error occurred:", error.message);
  //       throw new BadRequestException(error);
  //     }
  //   }
  // }

  async appById(user, query) {
    try {
      const userId = user?.userId;
      const { appId } = query;

      const app = await this.appsModel.findOne({
        _id: appId,
        merchantId: userId,
      });

      if (!app) {
        throw new NotFoundException("Invalid app Id");
      }

      // Get transactions
      const transactions = await this.paymentLinkModel.find({ appId });

      // Get withdrawals
      const fiatWithdrawl = await this.fiatWithdrawModel.find({
        appsId: appId,
      });

      // 1️⃣ Calculate TOTAL SUCCESS FIAT transaction USD
      let totalSuccessFiat = 0;
      transactions.forEach((txn) => {
        if (txn.transactionType === "FIAT" && txn.status === "SUCCESS") {
          totalSuccessFiat += Number(txn.fiatToUsd) || 0;
        }
      });

      // 2️⃣ Calculate TOTAL PENDING withdrawals (status === SUCCESS)
      let totalPendingWithdraw = 0;
      fiatWithdrawl.forEach((wd) => {
        if (wd.status === "SUCCESS") {
          totalSuccessFiat -= Number(wd?.withdrawlAmount) || 0;
        }
      });

      // Update in DB
      await this.appsModel.findByIdAndUpdate(
        appId,
        { totalFiatBalance: Number(totalSuccessFiat.toFixed(6)) },
        { new: true }
      );

      const appObj = app.toObject();
      if (appObj.logo) {
        appObj.logo = appObj.logo.replace(/\\/g, "/");
      }

      return {
        message: "apps by Id",
        totalFiatToUsd: Number(totalSuccessFiat.toFixed(6)),
        totalSuccessFiat,
        totalPendingWithdraw,
        data: appObj,
      };
    } catch (error) {
      throw new BadRequestException(error.message || error);
    }
  }

  async getKeys(user, query) {
    try {
      const userId = user?.userId;

      const { appId } = query;

      const app = await this.appsModel.findById({
        _id: appId,
        merchantId: userId,
      });

      if (!app) {
        return new NotFoundException("Invalid app Id");
      }

      const publicKey = await this.encryptionService.decryptData(app?.API_KEY);
      const privateKey = await this.encryptionService.decryptData(
        app?.SECRET_KEY
      );

      return {
        message: "public and private keys",
        publicKey: publicKey,
        privateKey: privateKey,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async updateApp(user, query, dto: UpdateAppsDto, file: any) {
    try {
      const userId = user?.userId;

      const { appId } = query;

      const { name, description } = dto;

      const app = await this.appsModel.findById({
        _id: appId,
        merchantId: userId,
      });

      if (!app) {
        return new NotFoundException("Invalid app Id");
      }

      if (name) app.name = name.trim();
      if (description) app.description = description.trim();
      const { theme, removeLogo } = dto;
      if (theme) {
        app.theme = theme;
      }
      // Handle logo removal
      if (removeLogo === "true") {
        app.logo = ""; // Clear the custom logo to use platform default
      } else if (file) {
        app.logo = file.path.replace(/\\/g, "/");
      }

      await app.save();

      return { message: "App updated successfully", data: app };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async deleteApp(user, query) {
    try {
      const userId = user?.userId;

      const { appId } = query;

      const app = await this.appsModel.findByIdAndDelete({
        _id: appId,
        merchantId: userId,
      });

      if (!app) {
        return new NotFoundException("Invalid app Id");
      }

      return {
        message: "Deleted App successfully",
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  ///admin side

  async appList(query) {
    try {
      const { pageNo, limitVal, search, merchantId } = query;

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let queryObject: any = { merchantId: merchantId };

      if (search) {
        queryObject = {
          ...queryObject,
          $or: [{ name: { $regex: search, $options: "i" } }],
        };
      }

      const app = await this.appsModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .select({
          _id: 1,
          merchantId: 1,
          name: 1,
          description: 1,
          // API_KEY: 1,
          // SECRET_KEY: 1,
          createdAt: 1,
        })
        .limit(limit)
        .sort({ _id: -1 });

      // app.map(async (val, index) => {
      //   const publicKey = await this.encryptionService.decryptData(
      //     val?.API_KEY
      //   );
      //   const privateKey = await this.encryptionService.decryptData(
      //     val?.SECRET_KEY
      //   );

      //   return {...app, publicKey, privateKey}
      // });

      const count = await this.appsModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        message: "apss info",
        total: count,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        data: app,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getUnreadNotificationCount(user) {
    try {
      const count = await this.notificationModel.countDocuments({
        merchantId: user?.userId,
        isRead: false,
      });

      return {
        message: "Unread notification count",
        count,
      };
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(error);
    }
  }

  async viewMerchantApp(id) {
    try {
      const app = await this.appsModel.findById(id);
      if (!app) {
        throw new NotFoundException("Invalid App Id");
      }

      const apiKey = this.encryptionService.decryptData(app?.API_KEY);
      const secretKey = this.encryptionService.decryptData(app?.SECRET_KEY);

      const appWithKeys = {
        ...app.toObject(),
        apiKey,
        secretKey,
      };

      return {
        message: "View App",
        app: appWithKeys,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async updateWebhook(user, query, dto) {
    try {
      const { appId } = query;
      const { webhookUrl, webhookSecret } = dto;

      const app = await this.appsModel.findOne({
        _id: appId,
        merchantId: user?.userId,
      });

      if (!app) {
        throw new NotFoundException("App not found or unauthorized");
      }

      const updateData: any = { webhookUrl };
      if (webhookSecret) {
        updateData.webhookSecret = this.encryptionService.encryptData(webhookSecret);
      }

      await this.appsModel.updateOne({ _id: appId }, { $set: updateData });

      return {
        message: "Webhook configuration updated successfully",
        webhookUrl,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  // API Key authenticated webhook methods
  async updateWebhookWithApiKey(dto) {
    try {
      const { appId, apiKey, secretKey, webhookUrl, webhookSecret } = dto;

      const app = await this.appsModel.findById(appId);
      if (!app) {
        throw new NotFoundException("App not found");
      }

      // Validate API Key and Secret Key
      const storedApiKey = this.encryptionService.decryptData(app.API_KEY);
      const storedSecretKey = this.encryptionService.decryptData(app.SECRET_KEY);

      if (apiKey !== storedApiKey) {
        throw new BadRequestException("Invalid API Key");
      }
      if (secretKey !== storedSecretKey) {
        throw new BadRequestException("Invalid Secret Key");
      }

      const updateData: any = { webhookUrl };
      if (webhookSecret) {
        updateData.webhookSecret = this.encryptionService.encryptData(webhookSecret);
      }

      await this.appsModel.updateOne({ _id: appId }, { $set: updateData });

      return {
        status: true,
        message: "Webhook configuration updated successfully",
        webhookUrl,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error.message || "Failed to update webhook");
      }
    }
  }

  async getWebhookLogsWithApiKey(dto) {
    try {
      const { appId, apiKey, secretKey, pageNo = 1, limitVal = 20, status, event } = dto;

      const app = await this.appsModel.findById(appId);
      if (!app) {
        throw new NotFoundException("App not found");
      }

      // Validate API Key and Secret Key
      const storedApiKey = this.encryptionService.decryptData(app.API_KEY);
      const storedSecretKey = this.encryptionService.decryptData(app.SECRET_KEY);

      if (apiKey !== storedApiKey) {
        throw new BadRequestException("Invalid API Key");
      }
      if (secretKey !== storedSecretKey) {
        throw new BadRequestException("Invalid Secret Key");
      }

      // Call webhook service to get logs
      return await this.webhookService.getWebhookLogs(appId, { pageNo, limitVal, status, event });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error.message || "Failed to get webhook logs");
      }
    }
  }
}

