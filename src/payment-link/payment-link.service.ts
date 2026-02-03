import { BTC_CHAIN_ID, NATIVE, TRON_CHAIN_ID } from "./../constants/index";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PaymentLink, PaymentLinkDocument } from "./schema/payment-link.schema";
import { Model } from "mongoose";
import { AddPaymnetLinkDto, TableDataDto } from "./dto/payment-link.dto";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import { EncryptionService } from "src/utils/encryption.service";
import {
  deposit_bnb_for_gas_fee,
  generateEvmWallet,
  getEVMNativeBalance,
  merchantEvmFundWithdraw,
  withdrawEvmFund,
} from "src/helpers/evm.helper";
import moment from "moment";
import Moralis from "moralis";
import { EvmNative } from "@moralisweb3/common-evm-utils";
import {
  WalletMonitor,
  WalletMonitorDocument,
} from "src/wallet-monitor/schema/wallet-monitor.schema";
import { WalletType } from "src/wallet-monitor/schema/wallet-monitor.enum";
import { Token, TokenDocument } from "src/token/schema/token.schema";
import { ConfigService } from "src/config/config.service";
import {
  MerchantAppTx,
  MerchantAppTxDocument,
} from "src/merchant-app-tx/schema/merchant-app-tx.schema";
import {
  DaysType,
  PaymentStatus,
  TransactionType,
  WithdrawPaymentStatus,
  WithdrawType,
} from "./schema/payment.enum";
import { AdminService } from "src/admin/admin.service";
import {
  generateTronWallet,
  getTronNativeBalance,
  getTronTokenBalance,
  transferTron,
} from "src/helpers/tron.helper";
import {
  generateBitcoinWallet,
  getBTCNativeBalance,
} from "src/helpers/bitcoin.helper";
import {
  calculateTaxes,
  getCoingeckoPrice,
  getCoingeckoSymbol,
} from "src/helpers/helper";
import { EVM_CHAIN_ID_LIST, TIME_PERIOD } from "src/constants";
import { TransactionTypes } from "src/merchant-app-tx/schema/enum";
import axios from "axios";
import { WebhookService } from "src/webhook/webhook.service";
import { WebhookEvent } from "src/webhook/schema/webhook-log.schema";

@Injectable()
export class PaymentLinkService {
  constructor(
    @InjectModel(PaymentLink.name)
    private readonly paymentLinkModel: Model<PaymentLinkDocument>,
    @InjectModel(Apps.name)
    private readonly appsModel: Model<AppsDocument>,
    @InjectModel(WalletMonitor.name)
    private readonly monitorModel: Model<WalletMonitorDocument>,

    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,

    private encryptionService: EncryptionService,

    @InjectModel(MerchantAppTx.name)
    private readonly merchantAppTxModel: Model<MerchantAppTxDocument>,

    private readonly adminService: AdminService,
    private readonly webhookService: WebhookService
  ) { }

  getCoinIdFromCode(code: string): string {
    const baseCode = code.split(".")[0]?.toUpperCase(); // e.g. USDT.BNB → USDT

    const mapping: Record<string, string> = {
      USDT: "tether",
      USDC: "usd-coin",
      WBNB: "wbnb",
      BTC: "bitcoin",
      BNB: "binancecoin",
      TRX: "tron",
      ETH: "ethereum",
      MATIC: "polygon-ecosystem-token",
    };

    return mapping[baseCode] || null;
  }

  async addPaymentLink(dto: AddPaymnetLinkDto, clientIp?: string) {
    try {
      const {
        appId,
        apiKey,
        secretKey,
        code,
        amount,
        buyerEmail,
        buyerName,
        itemName,
        itemNumber,
        invoice,
        custom,
        successUrl,
        cancelUrl,
        transactionType,
        fiatCurrency,

      } = dto;

      const coinId = this.getCoinIdFromCode(code);

      // ---------------------- transactionType VALIDATION ----------------------
      if (transactionType === TransactionType.FIAT) {
        if (!fiatCurrency) {
          throw new NotFoundException(
            "fiatCurrency is required for FIAT transactions"
          );
        }
        if (!coinId) {
          throw new NotFoundException(
            "Unable to detect coinId from provided code"
          );
        }
      } else if (transactionType !== TransactionType.CRYPTO) {
        throw new NotFoundException("Invalid transaction type");
      }

      // const app = await this.appsModel.findById(appId);
      const app = await this.appsModel.findOne({
        _id: appId,
      });
      if (!app) {
        throw new NotFoundException("Invalid app");
      }

      // ---------------------- IP WHITELIST VALIDATION ----------------------
      const merchant = await this.appsModel.findById(appId).populate('merchantId');
      const merchantData = merchant?.merchantId as any;
      if (merchantData?.isIPWhitelistEnabled && merchantData?.whitelistedIPs && merchantData.whitelistedIPs.length > 0 && clientIp) {
        let normalizedClientIp = clientIp.replace(/^::ffff:/, '');
        
        // Map localhost/loopback addresses to a standard format
        if (normalizedClientIp === '::1' || normalizedClientIp === '127.0.0.1') {
          normalizedClientIp = '127.0.0.1';
        }
        
        const isWhitelisted = merchantData.whitelistedIPs.some(
          (whitelistedIp) => {
            // Also normalize whitelisted IPs for comparison
            const normalizedWhitelistedIp = whitelistedIp === '::1' ? '127.0.0.1' : whitelistedIp;
            return normalizedWhitelistedIp === normalizedClientIp || whitelistedIp === clientIp;
          }
        );
        if (!isWhitelisted) {
          throw new ForbiddenException(
            `Access denied. IP address ${normalizedClientIp} is not whitelisted.`
          );
        }
      }

      const token = await this.tokenModel.findOne({
        code: code,
      });

      if (!token) {
        throw new NotFoundException("Invalid token code");
      }

      if (token.minDeposit > parseFloat(amount)) {
        throw new NotFoundException(
          `For ${token?.network} network ${token?.code
          } min deposit value is ${token?.minDeposit}`
        );
      }

      const publicKey = this.encryptionService.decryptData(app?.API_KEY);
      const privateKey = this.encryptionService.decryptData(app?.SECRET_KEY);

      if (apiKey !== publicKey) {
        throw new NotFoundException(" Api Key not found");
      }
      if (secretKey !== privateKey) {
        throw new NotFoundException("Secret Key not found");
      }

      let cryptoAmount = null;

      let price = null;

      let cryptoUsd = null;

      let fiatUsd = null;

      if (transactionType === TransactionType.FIAT) {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${fiatCurrency}`;

        console.log("urll", url);

        const response = await axios.get(url);

        console.log("response", response);

        if (!response.data[coinId] || !response.data[coinId][fiatCurrency]) {
          throw new BadRequestException("Invalid fiatCurrency");
        }

        price = response.data[coinId][fiatCurrency];
        console.log("price", price);

        cryptoAmount = Number(amount) / price;

        //crypto To USD
        const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        const r = await axios.get(cryptoUrl);
        const pricePer = r.data[coinId].usd;
        cryptoUsd = cryptoAmount * pricePer;

        //fiat To USD
        if (fiatCurrency.toUpperCase() === "USD") {
          fiatUsd = Number(amount);
        } else {
          const fiatUrl = `https://api.frankfurter.app/latest?amount=${amount}&from=${fiatCurrency}&to=USD`;
          const re = await axios.get(fiatUrl);
          const usdPrice = re.data;
          fiatUsd = usdPrice?.rates?.USD;
          console.log("fiatUsd", fiatUsd);
        }
      }

      const model = await new this.paymentLinkModel();
      model.appId = appId;
      model.code = code;
      // model.amount = amount;
      model.buyerEmail = buyerEmail;
      model.expireTime = moment().add(1, "hours").unix();
      // model.expireTime = moment().add(1, "minutes").unix();
      model.buyerName = buyerName;
      model.itemName = itemName;
      model.itemNumber = itemNumber;
      model.invoice = invoice;
      model.custom = custom;
      model.linkURL = `${ConfigService.keys.WEB_BASE_URL}payment-information/${model._id}`;
      model.successUrl = successUrl;
      model.cancelUrl = cancelUrl;
      model.tokenAddress = token.address;
      model.chainId = token?.chainId;
      model.symbol = token?.symbol;
      model.tokenDecimals = token?.decimal.toString();

      //fiat payment
      model.transactionType = transactionType;

      if (transactionType === TransactionType.FIAT) {
        model.fiatCurrency = fiatCurrency;
        model.coinId = coinId;
        model.fiatAmount = amount;
        model.cryptoAmount = cryptoAmount.toFixed(6);
        model.pricePerCoin = price;
        model.amount = cryptoAmount.toFixed(6);
        model.cryptoToUsd = cryptoUsd.toFixed(6);
        model.fiatToUsd = fiatUsd.toFixed(6);
      } else {
        // For CRYPTO — set FIAT fields to null
        model.amount = amount;
        model.fiatCurrency = undefined;
        model.coinId = undefined;
        model.cryptoAmount = undefined;
        model.pricePerCoin = undefined;
        model.fiatAmount = undefined;
        model.cryptoToUsd = undefined;
        model.fiatToUsd = undefined;
      }
      //end fiat payment

      const mnemonic = this.encryptionService.decryptData(
        app?.EVMWalletMnemonic?.mnemonic?.phrase
      );

      let indexVal;
      let walletInfo;

      if (token?.network.toUpperCase() === "TRON") {
        // if network is Tron then generate payment link for tron wallet
        indexVal = app?.tronCurrentIndexVal;
        walletInfo = await generateTronWallet(mnemonic, indexVal + 1);
        app.tronCurrentIndexVal = app?.tronCurrentIndexVal + 1;
        model.tokenDecimals = token?.decimal.toString();
      } else if (token?.network.toUpperCase() === "BITCOIN") {
        // if network is BTC then generate payment link for BTC wallet
        indexVal = app?.btcCurrentIndexVal;
        walletInfo = await generateBitcoinWallet(mnemonic, indexVal + 1);
        app.btcCurrentIndexVal = app?.btcCurrentIndexVal + 1;
      } else {
        // For EVM
        indexVal = app?.currentIndexVal;
        walletInfo = await generateEvmWallet(mnemonic, indexVal + 1);
        app.currentIndexVal = app?.currentIndexVal + 1;
      }

      if (!walletInfo) {
        throw new NotAcceptableException("Error in generating wallet");
      }

      model.toAddress = walletInfo?.address;
      model.privateKey = this.encryptionService.encryptData(
        walletInfo?.privateKey
      );

      const result = await model.save();
      if (result) {
        await app.save();
      }

      // if network is belongs to evm then push the wallet address into the moralis server
      if (
        token?.network.toUpperCase() !== "TRON" &&
        token?.network?.toUpperCase() !== "BITCOIN"
      ) {
        const streamData = {
          id: ConfigService.keys.WEB_STREAMER_ID,
          address: walletInfo?.address,
        };
        await Moralis.Streams.addAddress(streamData);
      }

      //add data in wallet monitor
      const wallet = await new this.monitorModel();
      wallet.paymentLinkId = model?._id;
      wallet.walletAddress = model?.toAddress;
      wallet.tokenAddress = token?.address;
      wallet.chainId = token?.chainId;
      wallet.expiryTime = model.expireTime;
      wallet.transactionType = model.transactionType;
      wallet.walletType = WalletType.PAYMENT_LINK;
      wallet.isExpiry = true;
      // wallet.streamId = ""; //ConfigService.keys.WEB_STREAMER_ID;
      wallet.streamId =
        token?.chainId.toUpperCase() === "BTC"
          ? ""
          : ConfigService.keys.WEB_STREAMER_ID;

      if (transactionType === TransactionType.FIAT) {
        wallet.amount = cryptoAmount.toFixed(6);
      } else {
        wallet.amount = amount;

      }



      await wallet.save();

      // Trigger webhook for payment initiated
      await this.webhookService.sendWebhook(
        appId,
        model._id.toString(),
        WebhookEvent.PAYMENT_INITIATED,
        {
          ...model.toObject(),
          status: PaymentStatus.PENDING,
        }
      );

      return {
        message: "Payment link created successfully",
        link: model,
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

  async getWalletERC20Transactions(query) {
    try {
      const { paymentId } = query;
      const payment = await this.paymentLinkModel.findById(paymentId);
      if (!payment) {
        throw new NotFoundException("Invalid payment Id");
      }

      const address = payment?.toAddress;
      const amount = payment?.amount;
      const Amount = EvmNative.create(amount);

      // ------------- Input parameters ended here --------------------

      const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
        chain: payment?.chainId,
        address: payment.toAddress,
        contractAddresses: [payment?.tokenAddress],
      });

      let tx = null;
      let data = (await response?.result) ?? [];

      const newData = data[0]?.toJSON();
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getMerchantTransactions(query, user) {
    try {
      const {
        appId,
        pageNo,
        limitVal,
        search,
        symbol,
        chainId,
        startDate,
        endDate,
      } = query;

      // Find all apps associated with the given merchant
      const apps = await this.appsModel.find({
        merchantId: user.userId,
      });

      if (apps.length === 0) {
        throw new NotFoundException("Apps not found.");
      }

      // Collect all app IDs
      const appIds = apps.map((app) => app._id);
      console.log("appIds", appIds);

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let queryObject: any = {};

      if (appId) {
        queryObject.appId = appId;
      } else {
        queryObject.appId = { $in: appIds };
      }

      if (search) {
        queryObject = {
          $or: [
            { tokenSymbol: { $regex: search, $options: "i" } },
            { fromAddress: { $regex: search, $options: "i" } },
            { toAddress: { $regex: search, $options: "i" } },
            { symbol: { $regex: symbol, $options: "i" } },
          ],
        };
      } else if (symbol === "ALL") {
        queryObject = {
          appId: { $in: appIds },
        };
      } else if (symbol) {
        queryObject = {
          symbol: { $regex: symbol, $options: "i" },
          appId: { $in: appIds },
        };
      } else if (chainId) {
        queryObject = {
          chainId: { $regex: chainId, $options: "i" },
        };
      }

      // Apply date range filter if provided
      if (startDate || endDate) {
        queryObject.createdAt = {};
        if (startDate) {
          queryObject.createdAt.$gte = moment(startDate)
            .startOf("day")
            .toDate();
        }
        if (endDate) {
          queryObject.createdAt.$lte = moment(endDate).endOf("day").toDate();
        }
      }

      // Fetch transactions based on the query objectt
      const transactions = await this.paymentLinkModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ _id: -1 });

      const count = await this.paymentLinkModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        total: count,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        data: transactions,
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

  async getMerchantTransactionById(query) {
    try {
      const { transactionId } = query;
      if (!transactionId) {
        throw new BadRequestException("Transaction ID is required");
      }
      const transaction = await this.paymentLinkModel.findById(transactionId);
      if (!transaction) {
        throw new BadRequestException("Invalid Id");
      }
      return { success: true, data: transaction };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getAllPaymentLinks(query, user) {
    try {
      const { pageNo, limitVal, search } = query;

      if (!user.isAdmin) {
        throw new ForbiddenException("Unauthorized access");
      }

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let queryObject: any = {};

      if (search) {
        queryObject = {
          $or: [
            { recivedAmount: search },
            { toAddress: { $regex: search, $options: "i" } },
            { hash: { $regex: search, $options: "i" } },
            { fromAddress: { $regex: search, $options: "i" } },
            { chainId: { $regex: search, $options: "i" } },
            { status: search },
            { tokenSymbol: { $regex: search, $options: "i" } },
          ],

          // $or: [
          //   { tokenSymbol: { $regex: search, $options: "i" } },
          //   { fromAddress: { $regex: search, $options: "i" } },
          //   { toAddress: { $regex: search, $options: "i" } },
          // ],
        };
      }

      // Fetch transactions based on the query object
      const transactions = await this.paymentLinkModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ _id: -1 });

      const count = await this.paymentLinkModel.countDocuments(queryObject);
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        total: count,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        data: transactions,
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

  async getPaymentLinksById(query) {
    try {
      const { paymentId } = query;
      const paymentLink = await this.paymentLinkModel.findById(paymentId);

      if (!paymentLink || !paymentId) {
        throw new NotFoundException("Payment link or id not found");
      }

      const app = await this.appsModel.findById(paymentLink.appId);
      const paymentLinkObj = paymentLink.toObject();

      if (app && app.logo) {
        paymentLinkObj['logo'] = app.logo.replace(/\\/g, "/");
      }
      if (app && app.theme) {
        paymentLinkObj['theme'] = app.theme;
      }

      return {
        data: paymentLinkObj,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException("Unable to retrieve payment link");
      }
    }
  }

  async count(query) {
    try {
      const { timePeriod } = query;

      const total = await this.paymentLinkModel.countDocuments({
        status: PaymentStatus.SUCCESS,
      });

      // Get the current year
      const currentYear = new Date().getFullYear();
      const lastFourYears = Array.from(
        { length: 4 },
        (_, i) => currentYear - i
      );

      // Step 1: Count the total payment links for each token for the current year
      const tokenCounts = await this.paymentLinkModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
              $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
            },
            status: PaymentStatus.SUCCESS,
          },
        },
        {
          $group: {
            _id: "$code",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Step 2: Select the top 5 tokens
      const top5Tokens = tokenCounts.slice(0, 5).map((token) => token._id);

      let timePeriodArray;
      let timePeriods;
      let monthlyCounts;

      if (timePeriod === TIME_PERIOD.MONTHLY) {
        // Monthly data
        timePeriodArray = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        timePeriods = Array.from({ length: 12 }, (_, i) => i + 1); // Months 1 to 12

        monthlyCounts = await this.paymentLinkModel.aggregate([
          {
            $match: {
              code: { $in: top5Tokens },
              createdAt: {
                $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
              },
              status: PaymentStatus.SUCCESS,
            },
          },
          {
            $project: {
              code: 1,
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
          },
          {
            $group: {
              _id: { code: "$code", year: "$year", month: "$month" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.code": 1, "_id.year": 1, "_id.month": 1 } },
        ]);
      } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
        // Quarterly data
        timePeriodArray = ["Jan - Mar", "Apr - Jun", "Jul - Sep", "Oct - Dec"];

        timePeriods = [1, 2, 3, 4]; // Quarters 1 to 4

        monthlyCounts = await this.paymentLinkModel.aggregate([
          {
            $match: {
              code: { $in: top5Tokens },
              createdAt: {
                $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
              },
              status: PaymentStatus.SUCCESS,
            },
          },
          {
            $project: {
              code: 1,
              year: { $year: "$createdAt" },
              quarter: {
                $switch: {
                  branches: [
                    { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: 1 },
                    { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: 2 },
                    { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: 3 },
                  ],
                  default: 4,
                },
              },
            },
          },
          {
            $group: {
              _id: { code: "$code", year: "$year", quarter: "$quarter" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.code": 1, "_id.year": 1, "_id.quarter": 1 } },
        ]);
      } else if (timePeriod === TIME_PERIOD.ANNUALLY) {
        // Yearly data for the last 4 years
        timePeriodArray = lastFourYears;

        timePeriods = lastFourYears;

        monthlyCounts = await this.paymentLinkModel.aggregate([
          {
            $match: {
              code: { $in: top5Tokens },
              createdAt: {
                $gte: new Date(`${lastFourYears[3]}-01-01T00:00:00.000Z`),
                $lte: new Date(`${lastFourYears[0]}-12-31T23:59:59.999Z`),
              },
              status: PaymentStatus.SUCCESS,
            },
          },
          {
            $project: {
              code: 1,
              year: { $year: "$createdAt" },
            },
          },
          {
            $group: {
              _id: { code: "$code", year: "$year" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.code": 1, "_id.year": 1 } },
        ]);
      } else {
        throw new BadRequestException("Invalid time period");
      }

      // Create a complete response with zeros for missing periods
      const completeResponse = top5Tokens.flatMap((token) =>
        timePeriods.map((period) => {
          const found = monthlyCounts.find(
            (item) =>
              item._id.code === token &&
              (timePeriod === TIME_PERIOD.ANNUALLY
                ? item._id.year === period
                : timePeriod === TIME_PERIOD.QUARTERLY
                  ? item._id.quarter === period
                  : item._id.month === period)
          );

          return (
            found || {
              _id: {
                code: token,
                year: currentYear,
                ...(timePeriod === TIME_PERIOD.ANNUALLY
                  ? { year: period }
                  : timePeriod === TIME_PERIOD.QUARTERLY
                    ? { quarter: period }
                    : { month: period }),
              },
              count: 0,
            }
          );
        })
      );

      return {
        message: "Payment link count",
        total,
        monthlyCounts: completeResponse,
        timePeriodArray,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException("Unable to retrieve payment link");
      }
    }
  }

  // async revenue(query) {
  //   try {
  //     const { timePeriod, coin } = query;
  //     const currentYear = new Date().getFullYear();
  //     const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  //     const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

  //     let groupBy;
  //     let periods;
  //     let periodArray;

  //     if (timePeriod === TIME_PERIOD.MONTHLY) {
  //       // Monthly
  //       groupBy = { $month: "$createdAt" };
  //       periods = [
  //         "January",
  //         "February",
  //         "March",
  //         "April",
  //         "May",
  //         "June",
  //         "July",
  //         "August",
  //         "September",
  //         "October",
  //         "November",
  //         "December",
  //       ];
  //       periodArray = periods;
  //     } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
  //       // Quarterly
  //       groupBy = {
  //         $switch: {
  //           branches: [
  //             { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: 1 },
  //             { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: 2 },
  //             { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: 3 },
  //             { case: { $lte: [{ $month: "$createdAt" }, 12] }, then: 4 },
  //           ],
  //           default: null,
  //         },
  //       };
  //       periods = ["Jan - Mar", "Apr - Jun", "Jul - Sep", "Oct - Dec"];
  //       periodArray = periods;
  //     } else if (timePeriod === TIME_PERIOD.ANNUALLY) {
  //       // Yearly
  //       groupBy = { $year: "$createdAt" };
  //       periods = [
  //         currentYear.toString(),
  //         (currentYear - 1).toString(),
  //         (currentYear - 2).toString(),
  //         (currentYear - 3).toString(),
  //       ];
  //       periodArray = periods;
  //     } else {
  //       throw new BadRequestException("Invalid time period");
  //     }

  //     const paymentLinkResult = await this.paymentLinkModel.aggregate([
  //       {
  //         $match: {
  //           createdAt: { $gte: startOfYear, $lte: endOfYear },
  //           status: "SUCCESS",
  //           symbol: coin,
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           adminFee: {
  //             $convert: {
  //               input: "$adminFee",
  //               to: "double",
  //               onError: 0,
  //               onNull: 0,
  //             },
  //           },
  //           period: groupBy,
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: "$period",
  //           totalAdminFee: { $sum: "$adminFee" },
  //         },
  //       },
  //       {
  //         $sort: { _id: 1 },
  //       },
  //     ]);

  //     const merchantAppTxResult = await this.merchantAppTxModel.aggregate([
  //       {
  //         $match: {
  //           createdAt: { $gte: startOfYear, $lte: endOfYear },
  //           status: "SUCCESS",
  //           symbol: coin,
  //           txType: "DEPOSIT",
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           adminFee: {
  //             $convert: {
  //               input: "$adminFee",
  //               to: "double",
  //               onError: 0,
  //               onNull: 0,
  //             },
  //           },
  //           recivedAmount: {
  //             $convert: {
  //               input: "$recivedAmount",
  //               to: "double",
  //               onError: 0,
  //               onNull: 0,
  //             },
  //           },
  //           period: groupBy,
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: "$period",
  //           totalAdminFee: { $sum: "$adminFee" },
  //           totalRecivedAmount: { $sum: "$recivedAmount" },
  //         },
  //       },
  //       {
  //         $sort: { _id: 1 },
  //       },
  //     ]);

  //     const revenueData = periods.map((period) => ({
  //       period,
  //       totalAdminFee: 0,
  //       grossIncome: 0,
  //       netIncome: 0,
  //     }));

  //     paymentLinkResult.forEach((doc) => {
  //       let periodIndex;
  //       if (timePeriod === TIME_PERIOD.ANNUALLY) {
  //         periodIndex = periods.indexOf(doc._id.toString());
  //       } else {
  //         periodIndex = doc._id - 1;
  //       }

  //       revenueData[periodIndex].totalAdminFee += Number(
  //         doc.totalAdminFee.toFixed(2)
  //       );
  //       revenueData[periodIndex].netIncome += Number(
  //         doc.totalAdminFee.toFixed(2)
  //       );
  //       revenueData[periodIndex].grossIncome += Number(
  //         doc.totalAdminFee.toFixed(2)
  //       );
  //     });

  //     merchantAppTxResult.forEach((doc) => {
  //       let periodIndex;
  //       if (timePeriod === TIME_PERIOD.ANNUALLY) {
  //         periodIndex = periods.indexOf(doc._id.toString());
  //       } else {
  //         periodIndex = doc._id - 1;
  //       }

  //       revenueData[periodIndex].totalAdminFee += Number(
  //         doc.totalAdminFee.toFixed(2)
  //       );
  //       revenueData[periodIndex].grossIncome += Number(
  //         doc.totalRecivedAmount.toFixed(2)
  //       );
  //       revenueData[periodIndex].netIncome += Number(
  //         doc.totalAdminFee.toFixed(2)
  //       );
  //     });

  //     return {
  //       message: "Revenue data retrieved successfully",
  //       data: revenueData,
  //       periods: periodArray,
  //     };
  //   } catch (error) {
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     } else {
  //       console.log("An error occurred in revenue:", error.message);
  //       throw new BadRequestException("Unable to retrieve revenue data");
  //     }
  //   }
  // }

  // async revenue(query) {
  //   try {
  //     console.log(
  //       "----------------------------------------------------------------RR"
  //     );

  //     const { timePeriod, symbol } = query; // Expecting a timePeriod query parameter (0 for monthly, 1 for quarterly, 2 for yearly)
  //     const startOfYear = moment().startOf("year").toDate();
  //     const currentYear = moment().year();

  //     // Initialize response object with periods as keys
  //     const response = {
  //       message: "Total deposits and paymentLinks calculated successfully",
  //       paymentLinks: [],
  //       merchant: [],
  //       periodNames: [], // To hold the names of months/quarters/years
  //     };

  //     let groupBy;
  //     let periods;

  //     // Define groupBy and periods based on the selected time period
  //     if (timePeriod === TIME_PERIOD.MONTHLY) {
  //       // Monthly
  //       groupBy = { $month: "$createdAt" };
  //       periods = Array.from({ length: 12 }, (_, i) =>
  //         moment().month(i).format("MMMM")
  //       );
  //       response.paymentLinks = Array.from({ length: 12 }, (_, i) => ({
  //         month: i + 1,
  //         total: 0,
  //       }));
  //       response.merchant = Array.from({ length: 12 }, (_, i) => ({
  //         month: i + 1,
  //         total: 0,
  //       }));
  //       response.periodNames = periods;
  //     } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
  //       // Quarterly
  //       groupBy = { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } }; // Group by quarter
  //       periods = ["Jan - Mar", "Apr - Jun", "Jul - Sept", "Oct - Dec"];
  //       response.paymentLinks = Array.from({ length: 4 }, (_, i) => ({
  //         quarter: i + 1,
  //         total: 0,
  //       }));
  //       response.merchant = Array.from({ length: 4 }, (_, i) => ({
  //         quarter: i + 1,
  //         total: 0,
  //       }));
  //       response.periodNames = periods;
  //     } else if (timePeriod === TIME_PERIOD.ANNUALLY) {
  //       // Yearly
  //       groupBy = { $year: "$createdAt" };
  //       periods = [
  //         currentYear.toString(),
  //         (currentYear - 1).toString(),
  //         (currentYear - 2).toString(),
  //         (currentYear - 3).toString(),
  //       ];
  //       response.paymentLinks = Array.from({ length: 4 }, (_, i) => ({
  //         year: currentYear - i,
  //         total: 0,
  //       }));
  //       response.merchant = Array.from({ length: 4 }, (_, i) => ({
  //         year: currentYear - i,
  //         total: 0,
  //       }));
  //       response.periodNames = periods;
  //     } else {
  //       throw new BadRequestException(
  //         "Invalid time period provided, must be MONTHLY, QUARTER or ANNUALY specified"
  //       );
  //     }

  //     // Query for paymentLinks from the paymentLinkModel table
  //     const paymentLinkData = await this.paymentLinkModel.aggregate([
  //       {
  //         $match: {
  //           createdAt: { $gte: startOfYear },
  //           symbol: symbol,
  //           status: PaymentStatus.SUCCESS,
  //           adminFee: { $gt: 0 },
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: groupBy,
  //           adminFee: { $sum: { $toDouble: "$adminFee" } }, // Convert to double
  //         },
  //       },
  //       {
  //         $sort: { _id: 1 }, // Sort by the grouped period
  //       },
  //     ]);

  //     console.log("paymentLinkData : ", paymentLinkData);

  //     // Update paymentLinks response
  //     paymentLinkData.forEach((item) => {
  //       let index;
  //       if (timePeriod === TIME_PERIOD.MONTHLY) {
  //         // Monthly
  //         index = item._id - 1; // For monthly, _id is the month number (1-12)
  //       } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
  //         // Quarterly
  //         index = item._id - 1; // For quarterly, _id is the quarter number (1-4)
  //       } else {
  //         // Yearly
  //         index = periods.indexOf(item._id.toString()); // For yearly, match the year string
  //       }

  //       if (index >= 0) {
  //         response.paymentLinks[index].total = item.adminFee; // Set the total for the corresponding period
  //       }
  //     });

  //     // Query for depositsData from the merchantapptxes table
  //     const merchantData = await this.merchantAppTxModel.aggregate([
  //       {
  //         $match: {
  //           createdAt: { $gte: startOfYear },
  //           symbol: symbol,
  //           status: PaymentStatus.SUCCESS,
  //           txType: TransactionTypes.WITHDRAW,
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: groupBy,
  //           totalReceivedAmount: { $sum: { $toDouble: "$adminFee" } }, // Convert to double
  //         },
  //       },
  //       {
  //         $sort: { _id: 1 }, // Sort by the grouped period
  //       },
  //     ]);

  //     // Update deposits response
  //     merchantData.forEach((item) => {
  //       let index;
  //       if (timePeriod === TIME_PERIOD.MONTHLY) {
  //         // Monthly
  //         index = item._id - 1; // For monthly, _id is the month number (1-12)
  //       } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
  //         // Quarterly
  //         index = item._id - 1; // For quarterly, _id is the quarter number (1-4)
  //       } else {
  //         // Yearly
  //         index = periods.indexOf(item._id.toString()); // For yearly, match the year string
  //       }

  //       if (index >= 0) {
  //         response.merchant[index].total = item.totalReceivedAmount; // Set the total for the corresponding period
  //       }
  //     });

  //     return response;
  //   } catch (error) {
  //     console.log("An error occurred:", error.message);
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     } else {
  //       console.log("An error occurred:", error.message);
  //       throw new BadRequestException(error);
  //     }
  //   }
  // }

  async revenue(query) {
    try {
      console.log(
        "----------------------------------------------------------------RR"
      );

      const { timePeriod, symbol } = query; // Expecting a timePeriod query parameter (0 for monthly, 1 for quarterly, 2 for yearly)
      const startOfYear = moment().startOf("year").toDate();
      const currentYear = moment().year();

      // Initialize response object with periods as keys
      const response = {
        message: "Total deposits and paymentLinks calculated successfully",
        paymentLinks: [],
        merchant: [],
        periodNames: [], // To hold the names of months/quarters/years
      };

      let groupBy;
      let periods;

      // Define groupBy and periods based on the selected time period
      if (timePeriod === TIME_PERIOD.MONTHLY) {
        // Monthly
        groupBy = { $month: "$createdAt" };
        periods = Array.from({ length: 12 }, (_, i) =>
          moment().month(i).format("MMMM")
        );
        response.paymentLinks = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total: 0,
        }));
        response.merchant = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total: 0,
        }));
        response.periodNames = periods;
      } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
        // Quarterly
        groupBy = {
          $switch: {
            branches: [
              { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: 1 },
              { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: 2 },
              { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: 3 },
              { case: { $lte: [{ $month: "$createdAt" }, 12] }, then: 4 },
            ],
            default: null,
          },
        };
        periods = ["Jan - Mar", "Apr - Jun", "Jul - Sept", "Oct - Dec"];
        response.paymentLinks = Array.from({ length: 4 }, (_, i) => ({
          quarter: i + 1,
          total: 0,
        }));
        response.merchant = Array.from({ length: 4 }, (_, i) => ({
          quarter: i + 1,
          total: 0,
        }));
        response.periodNames = periods;
      } else if (timePeriod === TIME_PERIOD.ANNUALLY) {
        // Yearly
        groupBy = { $year: "$createdAt" };
        periods = [
          currentYear.toString(),
          (currentYear - 1).toString(),
          (currentYear - 2).toString(),
          (currentYear - 3).toString(),
        ];
        response.paymentLinks = Array.from({ length: 4 }, (_, i) => ({
          year: currentYear - i,
          total: 0,
        }));
        response.merchant = Array.from({ length: 4 }, (_, i) => ({
          year: currentYear - i,
          total: 0,
        }));
        response.periodNames = periods;
      } else {
        throw new BadRequestException(
          "Invalid time period provided, must be MONTHLY, QUARTERLY or ANNUAL specified"
        );
      }

      // Query for paymentLinks from the paymentLinkModel table
      const paymentLinkData = await this.paymentLinkModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear },
            symbol: symbol,
            status: PaymentStatus.SUCCESS,
            // adminFee: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: groupBy,
            adminFee: { $sum: { $toDouble: "$adminFee" } }, // Convert to double
          },
        },
        {
          $sort: { _id: 1 }, // Sort by the grouped period
        },
      ]);

      console.log("  let groupBy;  let periods : ", groupBy, "p : ", periods);

      console.log("paymentLinkData ---------------------- : ", paymentLinkData);

      // Update paymentLinks response
      paymentLinkData.forEach((item) => {
        let index;
        if (timePeriod === TIME_PERIOD.MONTHLY) {
          index = item._id - 1; // For monthly, _id is the month number (1-12)
        } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
          index = item._id - 1; // For quarterly, _id is the quarter number (1-4)
        } else {
          index = periods.indexOf(item._id.toString()); // For yearly, match the year string
        }

        if (index >= 0) {
          response.paymentLinks[index].total = item.adminFee; // Set the total for the corresponding period
        }
      });

      // Query for depositsData from the merchantapptxes table
      const merchantData = await this.merchantAppTxModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear },
            symbol: symbol,
            status: PaymentStatus.SUCCESS,
            txType: TransactionTypes.WITHDRAW,
          },
        },
        {
          $group: {
            _id: groupBy,
            totalReceivedAmount: { $sum: { $toDouble: "$adminFee" } }, // Convert to double
          },
        },
        {
          $sort: { _id: 1 }, // Sort by the grouped period
        },
      ]);

      // Update deposits response
      merchantData.forEach((item) => {
        let index;
        if (timePeriod === TIME_PERIOD.MONTHLY) {
          index = item._id - 1; // For monthly, _id is the month number (1-12)
        } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
          index = item._id - 1; // For quarterly, _id is the quarter number (1-4)
        } else {
          index = periods.indexOf(item._id.toString()); // For yearly, match the year string
        }

        if (index >= 0) {
          response.merchant[index].total = item.totalReceivedAmount; // Set the total for the corresponding period
        }
      });

      return response;
    } catch (error) {
      console.log("An error occurred:", error.message);
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException("Unable to retrieve revenue data");
      }
    }
  }

  async cryptoMargins(query) {
    try {
      const { timePeriod } = query;
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

      let groupBy: any;
      let periods: string[];
      let periodNames: string[];

      if (timePeriod === TIME_PERIOD.MONTHLY) {
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          symbol: { $ifNull: ["$symbol", "Not Specified"] },
        };
        periods = Array.from({ length: 12 }, (_, i) =>
          moment().month(i).format("MMMM")
        );
        periodNames = periods;
      } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
        groupBy = {
          year: { $year: "$createdAt" },
          quarter: { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } },
          symbol: { $ifNull: ["$symbol", "Not Specified"] },
        };
        periods = ["Jan - Mar", "Apr - Jun", "Jul - Sep", "Oct - Dec"];
        periodNames = periods;
      } else if (timePeriod === TIME_PERIOD.ANNUALLY) {
        groupBy = {
          year: { $year: "$createdAt" },
          symbol: { $ifNull: ["$symbol", "Not Specified"] },
        };
        periods = [
          currentYear.toString(),
          (currentYear - 1).toString(),
          (currentYear - 2).toString(),
          (currentYear - 3).toString(),
        ];
        periodNames = periods;
      } else {
        throw new BadRequestException("Invalid time period");
      }

      // Aggregate data from merchantAppTxModel only
      const merchantAppTxMargins = await this.merchantAppTxModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfYear,
              $lte: endOfYear,
            },
            status: PaymentStatus.SUCCESS,
          },
        },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            ...(timePeriod === TIME_PERIOD.MONTHLY
              ? { "_id.month": 1 }
              : timePeriod === TIME_PERIOD.QUARTERLY
                ? { "_id.quarter": 1 }
                : {}),
          },
        },
      ]);

      // Identify top 5 cryptocurrencies by count
      const cryptoCounts = {};
      merchantAppTxMargins.forEach((doc) => {
        const symbol = doc._id.symbol || "Not Specified";
        if (!cryptoCounts[symbol]) {
          cryptoCounts[symbol] = 0;
        }
        cryptoCounts[symbol] += doc.count;
      });

      const topCryptos = Object.entries(cryptoCounts)
        .sort(([, a], [_, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([symbol]) => symbol);

      // Filter and organize data for top 5 cryptocurrencies
      const result = periods.map((period) => {
        const tokenCounts = topCryptos.reduce(
          (acc, symbol) => {
            acc[symbol] = 0;
            return acc;
          },
          {} as Record<string, number>
        );
        return {
          period,
          tokenCounts,
          totalCounts: 0,
        };
      });

      merchantAppTxMargins.forEach((doc) => {
        if (topCryptos.includes(doc._id.symbol)) {
          let periodName;
          if (timePeriod === TIME_PERIOD.MONTHLY) {
            periodName = moment()
              .month(doc._id.month - 1)
              .format("MMMM");
          } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
            const quarter = doc._id.quarter;
            periodName = periodNames[quarter - 1];
          } else {
            periodName = doc._id.year.toString();
          }

          const periodData = result.find((p) => p.period === periodName);
          if (periodData) {
            const symbol = doc._id.symbol || "Not Specified";
            periodData.tokenCounts[symbol] += doc.count;
            periodData.totalCounts += doc.count;
          }
        }
      });

      const filteredResult = result.filter((periodData) => {
        const hasTokens = Object.values(periodData.tokenCounts).some(
          (count) => count > 0
        );
        return hasTokens;
      });

      return {
        message: "Crypto margin calculated successfully",
        data: filteredResult,
        periodNames,
      };
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException("Unable to calculate crypto margin");
    }
  }

  async merchantDepositWithdrawals(query) {
    try {
      const { timePeriod, symbol } = query; // Expecting a timePeriod query parameter (0 for monthly, 1 for quarterly, 2 for yearly)
      const startOfYear = moment().startOf("year").toDate();
      const currentYear = moment().year();

      // Initialize response object with periods as keys
      const response = {
        message: "Total deposits and withdrawals calculated successfully",
        withdrawals: [],
        deposits: [],
        periodNames: [], // To hold the names of months/quarters/years
      };

      let groupBy;
      let periods;

      // Define groupBy and periods based on the selected time period
      if (timePeriod === TIME_PERIOD.MONTHLY) {
        // Monthly
        groupBy = { $month: "$createdAt" };
        periods = Array.from({ length: 12 }, (_, i) =>
          moment().month(i).format("MMMM")
        );
        response.withdrawals = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total: 0,
        }));
        response.deposits = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          total: 0,
        }));
        response.periodNames = periods;
      } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
        // Quarterly
        groupBy = { $ceil: { $divide: [{ $month: "$createdAt" }, 3] } }; // Group by quarter
        periods = ["Jan - Mar", "Apr - Jun", "Jul - Sept", "Oct - Dec"];
        response.withdrawals = Array.from({ length: 4 }, (_, i) => ({
          quarter: i + 1,
          total: 0,
        }));
        response.deposits = Array.from({ length: 4 }, (_, i) => ({
          quarter: i + 1,
          total: 0,
        }));
        response.periodNames = periods;
      } else if (timePeriod === TIME_PERIOD.ANNUALLY) {
        // Yearly
        groupBy = { $year: "$createdAt" };
        periods = [
          currentYear.toString(),
          (currentYear - 1).toString(),
          (currentYear - 2).toString(),
          (currentYear - 3).toString(),
        ];
        response.withdrawals = Array.from({ length: 4 }, (_, i) => ({
          year: currentYear - i,
          total: 0,
        }));
        response.deposits = Array.from({ length: 4 }, (_, i) => ({
          year: currentYear - i,
          total: 0,
        }));
        response.periodNames = periods;
      } else {
        throw new BadRequestException(
          "Invalid time period provided, must be MONTHLY, QUARTER or ANNUALY specified"
        );
      }

      // Query for withdrawals from the merchantapptxes table
      const withdrawalsData = await this.merchantAppTxModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear },
            symbol: symbol,
            status: PaymentStatus.SUCCESS,
            txType: TransactionTypes.WITHDRAW,
          },
        },
        {
          $group: {
            _id: groupBy,
            totalReceivedAmount: { $sum: { $toDouble: "$recivedAmount" } }, // Convert to double
          },
        },
        {
          $sort: { _id: 1 }, // Sort by the grouped period
        },
      ]);

      // Update withdrawals response
      withdrawalsData.forEach((item) => {
        let index;
        if (timePeriod === TIME_PERIOD.MONTHLY) {
          // Monthly
          index = item._id - 1; // For monthly, _id is the month number (1-12)
        } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
          // Quarterly
          index = item._id - 1; // For quarterly, _id is the quarter number (1-4)
        } else {
          // Yearly
          index = periods.indexOf(item._id.toString()); // For yearly, match the year string
        }

        if (index >= 0) {
          response.withdrawals[index].total = item.totalReceivedAmount; // Set the total for the corresponding period
        }
      });

      // Query for depositsData from the merchantapptxes table
      const depositsData = await this.merchantAppTxModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear },
            symbol: symbol,
            status: PaymentStatus.SUCCESS,
            txType: {
              $in: [TransactionTypes.DEPOSIT, TransactionTypes.PAYMENT_LINKS], // Match DEPOSIT and PAYMENT_LINKS
            },
          },
        },
        {
          $group: {
            _id: groupBy,
            totalReceivedAmount: { $sum: { $toDouble: "$recivedAmount" } }, // Convert to double
          },
        },
        {
          $sort: { _id: 1 }, // Sort by the grouped period
        },
      ]);

      // Update deposits response
      depositsData.forEach((item) => {
        let index;
        if (timePeriod === TIME_PERIOD.MONTHLY) {
          // Monthly
          index = item._id - 1; // For monthly, _id is the month number (1-12)
        } else if (timePeriod === TIME_PERIOD.QUARTERLY) {
          // Quarterly
          index = item._id - 1; // For quarterly, _id is the quarter number (1-4)
        } else {
          // Yearly
          index = periods.indexOf(item._id.toString()); // For yearly, match the year string
        }

        if (index >= 0) {
          response.deposits[index].total = item.totalReceivedAmount; // Set the total for the corresponding period
        }
      });

      return response;
    } catch (error) {
      console.log("An error occurred:", error.message);
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async getMerchantCryptoSymbols() {
    try {
      // Fetch distinct symbols from the database
      const symbols = await this.tokenModel.distinct("symbol");

      // Add the empty selection option as the first item in the result
      const selectCoin = {
        // "": "Select Crypto Currency", // Default select option
        ...symbols.reduce((acc, symbol) => {
          acc[symbol] = symbol; // Map each symbol to itself
          return acc;
        }, {}),
      };

      return selectCoin;
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(
        "Unable to retrieve merchant crypto symbols."
      );
    }
  }

  async activePaymentLinks(query) {
    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const oneHourInSeconds = 3600;

      const paymentLinkData = await this.paymentLinkModel.find(
        {
          expireTime: {
            $gt: currentTimestamp,
            $lte: currentTimestamp + oneHourInSeconds,
          },
          status: { $ne: "SUCCESS" },
        },
        { expireTime: 1, status: 1, _id: 0 }
      );

      const activeCount = paymentLinkData.length;

      console.log("Active Payment Links Count:", activeCount);
      return activeCount;
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(
        "Unable to calculate active payment links."
      );
    }
  }

  async activeMerchantApps(query) {
    try {
      const activeApps = await this.appsModel.countDocuments({});
      if (activeApps) {
        return activeApps;
      }
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(
        "Unable to calculate active payment links."
      );
    }
  }

  async depositTxFeeByAdmin(user, dto) {
    try {
      if (!user.isAdmin) {
        throw new BadRequestException("Only admin users can deposit");
      }

      const { paymentId, tokenBalance } = dto;
      const PRIVATE_KEY = ConfigService.keys.ADMIN_WALLET_PRIVATE_KEY;

      const parsedBalance = parseFloat(tokenBalance);
      if (isNaN(parsedBalance) || parsedBalance < 0) {
        throw new NotFoundException("Invalid token balance: " + tokenBalance);
      }

      if (!PRIVATE_KEY) {
        throw new NotFoundException("Private key not found");
      }

      // Find all apps associated with the given merchant
      const paymentLink = await this.paymentLinkModel.findById(paymentId);
      if (!paymentLink) {
        throw new NotFoundException("Payment link not found");
      }

      // check the status of the payment link
      const isValidState =
        paymentLink.status === PaymentStatus.PARTIALLY_SUCCESS &&
        paymentLink.withdrawStatus === WithdrawPaymentStatus.PENDING;
      if (!isValidState) {
        throw new BadRequestException(
          "Payment link is not in a valid state for depositing"
        );
      }
      const app = await this.appsModel.findById(paymentLink.appId);

      if (!app) {
        throw new NotFoundException("App not found");
      }

      const receiverAddress = app?.EVMWalletMnemonic?.address;

      const receipt = await deposit_bnb_for_gas_fee(
        paymentLink?.chainId,
        PRIVATE_KEY,
        paymentLink?.tokenAddress,
        receiverAddress,
        tokenBalance,
        paymentLink?.toAddress
      );

      if (!receipt) {
        throw new NotFoundException("Unable to transfer gas fee");
      } else {
        paymentLink.withdrawStatus = WithdrawPaymentStatus.NATIVE_TRANSFER;
        paymentLink.save();
      }

      return receipt;
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(error.message);
    }
  }

  async withdrawFund(user, dto) {
    try {
      if (!user.isAdmin) {
        throw new BadRequestException("Only admin users can withdraw funds");
      }

      const { paymentId, amount, withdrawType } = dto;

      const parsedBalance = parseFloat(amount);
      if (isNaN(parsedBalance) || parsedBalance < 0) {
        throw new NotFoundException("Invalid token balance: " + amount);
      }

      const paymentLink = await this.paymentLinkModel.findById(paymentId);
      if (!paymentLink) {
        throw new NotFoundException("Payment link not found");
      }

      const privateKey = await this.encryptionService.decryptData(
        paymentLink.privateKey
      );

      const app = await this.appsModel.findById(paymentLink.appId);

      if (!app) {
        throw new NotFoundException("App not found");
      }

      if (
        withdrawType === WithdrawType.MERCHANT &&
        paymentLink.withdrawStatus !== WithdrawPaymentStatus.ADMIN_CHARGES
      ) {
        throw new BadRequestException(
          "Direct merchant withdrawal not allowed, please withdraw the admin fee first."
        );
      }

      let adminWallet;

      const adminInfo = await this.adminService.getPlatformFee();

      if (adminInfo && "data" in adminInfo) {
        adminWallet = adminInfo?.data?.adminWallet;
      } else {
        throw new NotFoundException("Admin wallet not found");
      }

      const receiverAddress =
        withdrawType === WithdrawType.MERCHANT
          ? app?.EVMWalletMnemonic?.address
          : adminWallet;

      const receipt = await withdrawEvmFund(
        paymentLink.chainId,
        privateKey,
        paymentLink.tokenAddress,
        amount,
        receiverAddress
      );

      if (receipt?.transactionHash) {
        if (withdrawType === WithdrawType.MERCHANT) {
          paymentLink.withdrawStatus = WithdrawPaymentStatus.SUCCESS;
          paymentLink.status = PaymentStatus.SUCCESS;
          paymentLink.amountAfterTax = (
            Number(paymentLink.amount) - Number(paymentLink.adminFee)
          ).toString();
        } else {
          // For admin charges
          paymentLink.withdrawStatus = WithdrawPaymentStatus.ADMIN_CHARGES;
          paymentLink.adminFee = amount;
          paymentLink.adminFeeWallet = receiverAddress;
        }
        paymentLink.save();
      }

      return { receipt };
    } catch (error) {
      console.log("An error occurred:", error.message);
      throw new BadRequestException(error.message);
    }
  }

  async getUserPaymentsLinksAmountSum(user) {
    try {
      // Fetch data for the last 12 months including the current month
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11); // Start from 11 months ago
      startDate.setDate(1); // Ensure starting from the 1st of the month
      startDate.setHours(0, 0, 0, 0);

      const newData = await this.appsModel.aggregate([
        {
          $match: {
            merchantId: user.userId,
          },
        },
        {
          $lookup: {
            from: "paymentlinks",
            localField: "_id",
            foreignField: "appId",
            as: "paymentLinks",
          },
        },
        { $unwind: "$paymentLinks" },
        {
          $match: {
            "paymentLinks.status": "SUCCESS",
            "paymentLinks.withdrawStatus": "SUCCESS",
            "paymentLinks.type": WalletType.PAYMENT_LINK,
            "paymentLinks.createdAt": { $gte: startDate }, // Filter for last 12 months
          },
        },
        {
          $project: {
            appId: "$_id",
            amount: { $toDouble: "$paymentLinks.amount" },
            symbol: "$paymentLinks.symbol",
            createdAt: {
              $ifNull: ["$paymentLinks.createdAt", new Date(0)], // Fallback for null dates
            },
            month: { $month: "$paymentLinks.createdAt" }, // Extract month from createdAt
            year: { $year: "$paymentLinks.createdAt" }, // Extract year from createdAt
          },
        },
        {
          $group: {
            _id: { month: "$month", year: "$year", symbol: "$symbol" },
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id.month",
            year: "$_id.year",
            symbol: "$_id.symbol",
            totalAmount: 1,
          },
        },
      ]);

      // const cg_url = `${ConfigService.keys.COINGECKO_PRO_URL}/api/v3/simple/price?ids=bitcoin,ethereum,matic-network,tether,usd-coin,binancecoin,avalanche-2,tron&vs_currencies=usd`;

      const response = await getCoingeckoPrice("usd");

      // axios.get(cg_url, {
      //   headers: cgHeaders,
      // });

      // Process data to calculate total prices for each month
      const monthlyTotals = {};

      for (const item of newData) {
        const coingeckoSymbol = await getCoingeckoSymbol(item.symbol);
        const priceInUsd = response?.data[coingeckoSymbol]?.usd || 0;
        const totalPrice = item.totalAmount * priceInUsd;

        const monthYearKey = `${item.month}-${item.year}`;
        if (!monthlyTotals[monthYearKey]) {
          monthlyTotals[monthYearKey] = 0;
        }
        monthlyTotals[monthYearKey] += totalPrice;
      }

      const finalData = (() => {
        // Generate an array of all months for the last 12 months
        const monthNames = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MAY",
          "JUN",
          "JUL",
          "AUG",
          "SEP",
          "OCT",
          "NOV",
          "DEC",
        ];

        const currentDate = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
          );
          const month = date.getMonth() + 1; // 1-based month
          const year = date.getFullYear();
          const formattedMonth = `${monthNames[month - 1]}-${year}`;
          months.push({
            month,
            year,
            formattedMonth,
            totalPrice: 0, // Default total price as 0
          });
        }

        // Create a map of existing data by month-year key
        const dataMap = newData.reduce((acc, item) => {
          const key = `${item.month}-${item.year}`;
          const coingeckoSymbol = getCoingeckoSymbol(item.symbol);
          const priceInUsd = response?.data[coingeckoSymbol]?.usd || 0;
          const totalPrice = item.totalAmount * priceInUsd;

          if (!acc[key]) acc[key] = 0;
          acc[key] += totalPrice;

          return acc;
        }, {});

        // Merge existing data with the months array
        return months.map((monthObj) => ({
          month: monthObj.formattedMonth,
          totalPrice: dataMap[`${monthObj.month}-${monthObj.year}`] || 0, // Return as number
        }));
      })();

      return {
        data: finalData,
        // data: newData,
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

  async getUserBalanceSum(query, user) {
    try {
      let balance = {
        bsc: 0,
        eth: 0,
        matic: 0,
        avax: 0,
        trx: 0,
        btc: 0,
      };

      const { currency } = query;
      if (!currency) {
        throw new BadRequestException("Currency is required");
      }

      // Fetch wallet addresses
      const walletAddresses = await this.appsModel
        .find({
          merchantId: user.userId,
        })
        .select(
          "EVMWalletMnemonic.address TronWalletMnemonic.address BtcWalletMnemonic.address"
        );

      // Separate objects for each address type
      const addressLists = walletAddresses.reduce(
        (acc, wallet) => {
          if (wallet.EVMWalletMnemonic?.address) {
            acc.evmAddresses.push(wallet.EVMWalletMnemonic.address);
          }
          if (wallet.TronWalletMnemonic?.address) {
            acc.tronAddresses.push(wallet.TronWalletMnemonic.address);
          }
          if (wallet.BtcWalletMnemonic?.address) {
            acc.btcAddresses.push(wallet.BtcWalletMnemonic.address);
          }
          return acc;
        },
        {
          evmAddresses: [],
          tronAddresses: [],
          btcAddresses: [],
        }
      );

      const evm = await getEVMNativeBalance(addressLists?.evmAddresses);
      const trx = await getTronNativeBalance(addressLists?.tronAddresses);
      const btc = await getBTCNativeBalance(addressLists?.btcAddresses);

      const response = await getCoingeckoPrice(`${currency},USD`);

      // const response = await axios.get(
      //   `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,matic-network,tether,usd-coin,binancecoin,avalanche-2,tron&vs_currencies=${currency},USD`
      // );

      balance = { ...balance, trx, btc, ...evm };

      let currencyConversion = {
        bsc: balance.bsc * response.data.binancecoin[currency],
        eth: balance.eth * response.data.ethereum[currency],
        matic: balance.matic * response.data["matic-network"][currency],
        avax: balance.avax * response.data["avalanche-2"][currency],
        trx: balance.trx * response.data.tron[currency],
        btc: balance.btc * response.data.bitcoin[currency],
      };

      const usdTotal =
        balance.bsc * response.data.binancecoin.usd +
        balance.eth * response.data.ethereum.usd +
        balance.matic * response.data["matic-network"].usd +
        balance.avax * response.data["avalanche-2"].usd +
        balance.trx * response.data.tron.usd +
        balance.btc * response.data.bitcoin.usd;

      const symbolToName = {
        bsc: "Binance",
        eth: "Ethereum",
        matic: "Polygon",
        avax: "Avalanche",
        trx: "Tron",
        btc: "Bitcoin",
      };

      // const _data = { currencyConversion, balance };
      // Combine balance and currencyConversion into a unified format
      const data = Object.keys(balance).map((key) => ({
        name: symbolToName[key] || "Unknown", // Fallback for unknown symbols
        symbol: key,
        balance: parseFloat(balance[key]), // Ensure balance is a number
        currencyConversion: currencyConversion[key],
      }));

      return { currency, data, usdTotal };
    } catch (error) {
      console.error("An error occurred:", error.message);
      throw new BadRequestException(error);
    }
  }

  async tablePaymentLinkCount(dto) {
    try {
      console.log("Rahul ----- 900 : ");

      const { startDate, endDate, token, timeFormat } = dto;

      // Parse the start and end date from the query (assuming the dates are in 'DD/MM/YYYY' format)
      const start = new Date(startDate.split("/").reverse().join("-")); // Convert to YYYY-MM-DD format
      const end = new Date(endDate.split("/").reverse().join("-")); // Convert to YYYY-MM-DD format

      console.log("Start date: " + start, "end date: " + end);

      // Build the query filter
      const filter = {
        status: PaymentStatus.SUCCESS,
        symbol: token, // Filter by the token (e.g., USDC)
        createdAt: { $gte: start, $lte: end }, // Date range filter
      };

      console.log("filter : ", filter);

      let groupByField;
      let addFields;
      let projectFields;

      // Adjust the grouping and projection logic based on the time format
      if (timeFormat === DaysType.DAYS) {
        groupByField = {
          day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
        };
        projectFields = { _id: 0, date: "$_id.day", count: 1 };
        addFields = {};
      } else if (timeFormat === DaysType.WEEKS) {
        groupByField = {
          week: { $isoWeek: "$createdAt" },
          year: { $isoWeekYear: "$createdAt" },
        };
        projectFields = { _id: 0, weekStart: 1, weekEnd: 1, count: 1 };
        addFields = {
          weekStart: {
            $dateFromParts: {
              isoWeekYear: "$_id.year",
              isoWeek: "$_id.week",
              isoDayOfWeek: 1, // Start of the week
            },
          },
        };
      } else if (timeFormat === DaysType.MONTHS) {
        groupByField = {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        };
        projectFields = {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
        };
        addFields = {};
      } else if (timeFormat === DaysType.YEARS) {
        groupByField = { year: { $year: "$createdAt" } };
        projectFields = { _id: 0, year: "$_id.year", count: 1 };
        addFields = {};
      } else {
        throw new Error("Invalid Time Format");
      }

      // Aggregation pipeline
      const data = await this.paymentLinkModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupByField,
            count: { $sum: 1 },
          },
        },
        ...(Object.keys(addFields).length ? [{ $addFields: addFields }] : []),
        {
          $addFields: {
            weekEnd: {
              $dateAdd: {
                startDate: "$weekStart",
                unit: "day",
                amount: 6, // Add 6 days to get the end of the week
              },
            },
          },
        },
        {
          $project: projectFields,
        },
        {
          $sort: { "_id.day": 1, "_id.week": 1, "_id.month": 1, "_id.year": 1 },
        },
      ]);

      return {
        message: "Payment link count",
        total: data.length,
        symbol: token,
        data: data, // Return the grouped data
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log(
          "An error occurred in tablePaymentLinkCount:",
          error.message
        );
        throw new BadRequestException("Unable to retrieve payment link");
      }
    }
  }

  async tableMerchantDepositWithdrawCount(dto) {
    try {
      const { startDate, endDate, token, timeFormat } = dto;

      // Parse the start and end date from the query (assuming the dates are in 'DD/MM/YYYY' format)
      const start = new Date(startDate.split("/").reverse().join("-")); // Convert to YYYY-MM-DD format
      const end = new Date(endDate.split("/").reverse().join("-")); // Convert to YYYY-MM-DD format

      console.log("Start date: " + start, "end date: " + end);

      // Build the query filter
      const filter = {
        status: PaymentStatus.SUCCESS,
        symbol: token, // Filter by the token (e.g., USDC)
        txType: {
          $in: [TransactionTypes.DEPOSIT, TransactionTypes.PAYMENT_LINKS], // Match DEPOSIT and PAYMENT_LINKS
        },
        createdAt: { $gte: start, $lte: end }, // Date range filter
      };

      // Adjust the grouping and projection logic based on the time format
      let groupByField;
      let addFields;
      let projectFields;

      if (timeFormat === DaysType.DAYS) {
        groupByField = {
          day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
        };
        projectFields = { _id: 0, date: "$_id.day", count: 1 };
        addFields = {};
      } else if (timeFormat === DaysType.WEEKS) {
        groupByField = {
          week: { $isoWeek: "$createdAt" },
          year: { $isoWeekYear: "$createdAt" },
        };
        projectFields = { _id: 0, weekStart: 1, weekEnd: 1, count: 1 };
        addFields = {
          weekStart: {
            $dateFromParts: {
              isoWeekYear: "$_id.year",
              isoWeek: "$_id.week",
              isoDayOfWeek: 1, // Start of the week
            },
          },
          weekEnd: {
            $dateAdd: {
              startDate: "$weekStart",
              unit: "day",
              amount: 6,
            },
          },
        };
      } else if (timeFormat === DaysType.MONTHS) {
        groupByField = {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        };
        projectFields = {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
        };
        addFields = {};
      } else if (timeFormat === DaysType.YEARS) {
        groupByField = { year: { $year: "$createdAt" } };
        projectFields = { _id: 0, year: "$_id.year", count: 1 };
        addFields = {};
      } else {
        throw new Error("Invalid Time Format");
      }

      // Aggregation pipeline
      const data = await this.merchantAppTxModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupByField,
            count: { $sum: 1 },
          },
        },
        ...(Object.keys(addFields).length
          ? [
            { $addFields: { ...addFields } }, // First define weekStart
            {
              $addFields: {
                weekEnd: {
                  $dateAdd: {
                    startDate: "$weekStart",
                    unit: "day",
                    amount: 6,
                  },
                },
              },
            },
          ]
          : []),
        {
          $project: projectFields,
        },
        {
          $sort: { "_id.day": 1, "_id.week": 1, "_id.month": 1, "_id.year": 1 },
        },
      ]);

      return {
        message: "Merchant deposit/withdraw count",
        total: data.length,
        symbol: token,
        data: data, // Return the grouped data
      };
    } catch (error) {
      console.log("An error occurred:", error.message);
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async tableMerchantAppTxRevenueReports(dto: TableDataDto) {
    try {
      const { startDate, endDate, token, timeFormat } = dto;

      const start = new Date(startDate.split("/").reverse().join("-"));
      const end = new Date(endDate.split("/").reverse().join("-"));

      console.log("Start date: " + start, "end date: " + end);

      // Build the query filter
      const filter = {
        status: PaymentStatus.SUCCESS,
        symbol: token,
        txType: {
          $in: [TransactionTypes.WITHDRAW],
        },
        createdAt: { $gte: start, $lte: end },
      };

      // Adjust the grouping and projection logic based on the time format
      let groupByField;
      let addFields;
      let projectFields;

      if (timeFormat === DaysType.DAYS) {
        groupByField = {
          day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
        };
        projectFields = { _id: 0, date: "$_id.day", adminFee: 1 };
        addFields = {};
      } else if (timeFormat === DaysType.WEEKS) {
        groupByField = {
          week: { $isoWeek: "$createdAt" },
          year: { $isoWeekYear: "$createdAt" },
        };
        projectFields = {
          _id: 0,
          weekStart: 1,
          weekEnd: 1,
          adminFee: 1,
        };
        addFields = {
          weekStart: {
            $dateFromParts: {
              isoWeekYear: "$_id.year",
              isoWeek: "$_id.week",
              isoDayOfWeek: 1, // Start of the week
            },
          },
          weekEnd: {
            $dateAdd: {
              startDate: "$weekStart",
              unit: "day",
              amount: 6,
            },
          },
        };
      } else if (timeFormat === DaysType.MONTHS) {
        groupByField = {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        };
        projectFields = {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          adminFee: 1,
        };
        addFields = {};
      } else if (timeFormat === DaysType.YEARS) {
        groupByField = { year: { $year: "$createdAt" } };
        projectFields = { _id: 0, year: "$_id.year", adminFee: 1 };
        addFields = {};
      } else {
        throw new Error("Invalid Time Format");
      }

      // Aggregation pipeline
      const data = await this.merchantAppTxModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupByField,
            adminFee: { $sum: { $toDouble: "$adminFee" } },
          },
        },
        ...(Object.keys(addFields).length
          ? [{ $addFields: { ...addFields } }]
          : []),
        {
          $project: projectFields,
        },
        {
          $sort: {
            "_id.day": 1,
            "_id.week": 1,
            "_id.month": 1,
            "_id.year": 1,
          },
        },
      ]);

      // Add the sum of adminFee to the response
      const totalAdminFee = data.reduce(
        (sum, item) => sum + (item.adminFee || 0),
        0
      );

      return {
        message: "Revenue reports generated successfully",
        total: data.length,
        symbol: token,
        totalAdminFee: totalAdminFee,
        data: data,
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

  async tablePaymentLinkRevenueReports(dto: TableDataDto) {
    try {
      const { startDate, endDate, token, timeFormat } = dto;

      const start = new Date(startDate.split("/").reverse().join("-"));
      const end = new Date(endDate.split("/").reverse().join("-"));

      console.log("Start date: " + start, "end date: " + end);

      // Build the query filter
      const filter = {
        status: PaymentStatus.SUCCESS,
        symbol: token,
        createdAt: { $gte: start, $lte: end },
      };

      // Adjust the grouping and projection logic based on the time format
      let groupByField;
      let addFields;
      let projectFields;

      if (timeFormat === DaysType.DAYS) {
        groupByField = {
          day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
        };
        projectFields = { _id: 0, date: "$_id.day", adminFee: 1 };
        addFields = {};
      } else if (timeFormat === DaysType.WEEKS) {
        groupByField = {
          week: { $isoWeek: "$createdAt" },
          year: { $isoWeekYear: "$createdAt" },
        };
        projectFields = {
          _id: 0,
          weekStart: 1,
          weekEnd: 1,
          adminFee: 1,
        };
        addFields = {
          weekStart: {
            $dateFromParts: {
              isoWeekYear: "$_id.year",
              isoWeek: "$_id.week",
              isoDayOfWeek: 1, // Start of the week
            },
          },
          weekEnd: {
            $dateAdd: {
              startDate: "$weekStart",
              unit: "day",
              amount: 6,
            },
          },
        };
      } else if (timeFormat === DaysType.MONTHS) {
        groupByField = {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        };
        projectFields = {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          adminFee: 1,
        };
        addFields = {};
      } else if (timeFormat === DaysType.YEARS) {
        groupByField = { year: { $year: "$createdAt" } };
        projectFields = { _id: 0, year: "$_id.year", adminFee: 1 };
        addFields = {};
      } else {
        throw new Error("Invalid Time Format");
      }

      // Aggregation pipeline
      const data = await this.paymentLinkModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: groupByField,
            adminFee: { $sum: { $toDouble: "$adminFee" } },
          },
        },
        ...(Object.keys(addFields).length
          ? [{ $addFields: { ...addFields } }]
          : []),
        {
          $project: projectFields,
        },
        {
          $sort: {
            "_id.day": 1,
            "_id.week": 1,
            "_id.month": 1,
            "_id.year": 1,
          },
        },
      ]);

      // Add the sum of adminFee to the response
      const totalAdminFee = data.reduce(
        (sum, item) => sum + (item.adminFee || 0),
        0
      );

      return {
        message: "Revenue reports of payment link generated successfully",
        total: data?.length,
        symbol: token,
        totalAdminFee: totalAdminFee,
        data: data,
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

  async withdrawPaymentLinkFundsByAdmin(dto, user) {
    try {
      console.log("user of the user : ", user);

      const { paymentId, chainId, amount, withdrawType } = dto;

      if (!user?.isAdmin) {
        throw new BadRequestException(
          "Not permitted. Only the admin can access this."
        );
      }

      const payment = await this.paymentLinkModel
        .findById(paymentId)
        .select("+privateKey"); // Explicitly include privateKey

      if (!payment) {
        throw new NotFoundException("Invalid payment Id");
      }

      const decryptedPrivateKey = this.encryptionService.decryptData(
        payment?.privateKey
      );

      let adminFeeInfo;
      const adminInfo = await this.adminService.getPlatformFee();
      if (adminInfo && "data" in adminInfo) {
        adminFeeInfo = adminInfo?.data;
      } else {
        throw new NotFoundException("Admin wallet not found");
      }

      let decimal = 0;
      if (!payment.tokenDecimals) {
        throw new NotFoundException("Token decimals not found in payment link");
      } else {
        decimal = parseInt(payment?.tokenDecimals);
      }

      // const app = await this.appsModel.findById(appId);
      const app = await this.appsModel.findOne({
        _id: payment?.appId,
      });
      if (!app) {
        throw new NotFoundException("Invalid app");
      }

      let adminFeeWalletAddress = null;
      let adminPaymentLinksCharges = 0;

      console.log("adminFeeInfo : ", adminFeeInfo);

      if (EVM_CHAIN_ID_LIST.includes(payment.chainId)) {
        adminFeeWalletAddress = adminFeeInfo?.adminWallet;
        adminPaymentLinksCharges = adminFeeInfo?.platformFee;
      } else if (payment.chainId === TRON_CHAIN_ID) {
        adminFeeWalletAddress = adminFeeInfo.tronAdminWallet;
        adminPaymentLinksCharges = adminFeeInfo.tronPlatformFee;
      } else if (payment.chainId === BTC_CHAIN_ID) {
        adminFeeWalletAddress = adminFeeInfo.btcAdminWallet;
        adminPaymentLinksCharges = adminFeeInfo.btcPlatformFee;
      } else {
        throw new Error("Invalid chainId");
      }

      let withdrawalAmount = payment?.recivedAmount;

      const tax = await calculateTaxes(
        withdrawalAmount,
        adminPaymentLinksCharges
      );
      console.log("Tax is : ", tax);

      let receipt = null;
      let withdrawalAddress = null;

      // Transaction or withdraw fund
      if (payment.chainId === BTC_CHAIN_ID) {
        // TODO: Implement BTC withdrawal logic
        throw new BadRequestException(
          "Bitcoin transaction not working properly"
        );
      } else if (payment?.chainId === TRON_CHAIN_ID) {
        // TODO: Implement TRON withdrawal logic
        withdrawalAddress =
          withdrawType == WithdrawType.ADMIN_CHARGES
            ? adminFeeWalletAddress
            : app?.TronWalletMnemonic?.address;

        receipt = await transferTron(
          decryptedPrivateKey,
          payment?.tokenAddress,
          withdrawalAddress,
          amount,
          decimal
        );
      } else if (EVM_CHAIN_ID_LIST.includes(payment.chainId)) {
        // TODO: Implement default withdrawal logic for other chains

        withdrawalAddress =
          withdrawType == WithdrawType.ADMIN_CHARGES
            ? adminFeeWalletAddress
            : app?.EVMWalletMnemonic?.address;

        receipt = await merchantEvmFundWithdraw(
          payment?.chainId,
          decryptedPrivateKey,
          payment?.tokenAddress,
          amount,
          withdrawalAddress,
          decimal,
          ""
        );
      }

      console.log("Receipt is : ", receipt);

      if (receipt.status === false) {
        throw new BadRequestException(
          receipt?.error || "Unable to withdraw funds"
        );
      } else {
        if (withdrawType == WithdrawType.ADMIN_CHARGES) {
          // admin
          if (payment.status != PaymentStatus.SUCCESS) {
            payment.withdrawStatus = WithdrawPaymentStatus.ADMIN_CHARGES;
          }

          payment.adminFee = payment.adminFee
            ? (Number(payment.adminFee) + Number(amount)).toString()
            : amount;
          payment.adminFeeWallet = withdrawalAddress;
        } else {
          // merchant
          payment.status = PaymentStatus.SUCCESS;
          payment.withdrawStatus = WithdrawPaymentStatus.SUCCESS;
          payment.amountAfterTax = payment.amountAfterTax
            ? (Number(payment.amountAfterTax) + Number(amount)).toString()
            : amount;
        }
        // Save the updated document back to the database
        await payment.save();
      }

      return {
        receipt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error.message);
      }
    }
  }

  async getPaymentLinkTronTokenBalance(dto, user) {
    try {
      const { paymentId } = dto;

      if (!user?.isAdmin) {
        throw new BadRequestException(
          "Not permitted. Only the admin can access this."
        );
      }

      const payment = await this.paymentLinkModel
        .findById(paymentId)
        .select("+privateKey"); // Explicitly include privateKey

      if (!payment) {
        throw new NotFoundException("Invalid payment Id");
      }

      if (payment.chainId != TRON_CHAIN_ID) {
        throw new NotFoundException("Invalid chain id for tron balance");
      }

      const decryptedPrivateKey = this.encryptionService.decryptData(
        payment?.privateKey
      );

      const balance = await getTronTokenBalance(
        payment?.toAddress,
        payment?.tokenAddress,
        decryptedPrivateKey
      );

      console.log("balance : ", balance);

      return balance;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error.message);
      }
    }
  }
}
