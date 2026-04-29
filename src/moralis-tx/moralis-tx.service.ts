import axios from "axios";
import {
  hexToTronAddress,
  tronDecimal,
  getTronTransactions,
  getTRC20Balance,
  getTRC20Transactions,
  transferTron,
  getTronToAddressAllTransactions,
  estimateAndFundTrc20Gas,
} from "./../helpers/tron.helper";
import {
  BTC_CHAIN_ID,
  btc_PaymentLink_And_App_projectData,
  GET_BTC_TX_BATCH_URL,
  NATIVE,
  paymentLink_And_App_lookupData,
  paymentLink_And_App_projectData,
  postHeaders,
  TRON_CHAIN_ID,
} from "src/constants";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Transaction } from "./schema/moralis-tx.schema";
import { Model } from "mongoose";
import {
  WalletMonitor,
  WalletMonitorDocument,
} from "src/wallet-monitor/schema/wallet-monitor.schema";
import Moralis from "moralis";
import { ConfigService } from "src/config/config.service";
import {
  PaymentLink,
  PaymentLinkDocument,
} from "src/payment-link/schema/payment-link.schema";
import { Apps, AppsDocument } from "src/apps/schema/apps.schema";
import {
  PaymentStatus,
  WithdrawPaymentStatus,
} from "src/payment-link/schema/payment.enum";
import { ethers } from "ethers";
import {
  MerchantAppTx,
  MerchantAppTxDocument,
} from "src/merchant-app-tx/schema/merchant-app-tx.schema";
import {
  evmERC20TokenTransfer,
  evmNativeTokenTransferFromPaymentLinks,
  evmNativeTokenTransferToPaymentLinks,
  getERC20TxFee,
  getNetwork,
  getWeb3,
} from "src/helpers/evm.helper";
import { EncryptionService } from "src/utils/encryption.service";
import { AdminService } from "src/admin/admin.service";
import { getTronBalance } from "src/helpers/tron.helper";
import { toWeiCustom } from "src/helpers/helper";
import { btcTransferFromPaymentLinks } from "src/helpers/bitcoin.helper";
import { Token, TokenDocument } from "src/token/schema/token.schema";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TransactionTypes } from "src/merchant-app-tx/schema/enum";
import { WalletType } from "src/wallet-monitor/schema/wallet-monitor.enum";
import { Admin, AdminDocument } from "src/admin/schema/admin.schema";
import { Console } from "console";
import { WebhookService } from "src/webhook/webhook.service";
import { WebhookEvent } from "src/webhook/schema/webhook-log.schema";

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel("Transaction")
    private readonly transactionModel: Model<Transaction>,

    @InjectModel(WalletMonitor.name)
    private readonly monitorModel: Model<WalletMonitorDocument>,

    @InjectModel(PaymentLink.name)
    private readonly paymentLinkModel: Model<PaymentLinkDocument>,

    @InjectModel(Apps.name)
    private readonly appModel: Model<AppsDocument>,

    @InjectModel(Token.name)
    private readonly tokenModel: Model<TokenDocument>,

    @InjectModel(Admin.name)
    private readonly adminModel: Model<AdminDocument>,

    @InjectModel(MerchantAppTx.name)
    private readonly merchantTxModel: Model<MerchantAppTxDocument>,
    private readonly adminService: AdminService,
    private encryptionService: EncryptionService,
    private readonly webhookService: WebhookService
  ) { }

  private readonly logger = new Logger(TransactionService.name);

  async stream(tx: any): Promise<any> {
    try {
      console.log("--- tx --- : ", tx);

      const transactions = [];

      const commonData = {
        chainId: tx?.chainId,
        streamId: tx?.streamId,
        block: tx?.block,
      };

      if (tx.txs && tx.txs.length > 0) {
        for (const transaction of tx.txs) {
          transactions.push({
            ...commonData,
            ...transaction,
          });
        }
      }

      // Process erc20Transfers if present
      if (tx.erc20Transfers && tx.erc20Transfers.length > 0) {
        for (const transfer of tx.erc20Transfers) {
          console.log("calling for erc20");

          let { value, ...transferWithoutValue } = transfer;

          transactions.push({
            ...commonData,
            ...transferWithoutValue,
          });
        }
      }

      console.log("transactions list length : ", transactions.length);

      const merged = [];
      for (const tx of transactions) {
        const existingTx = merged.find(
          (item) =>
            item.chainId === tx.chainId &&
            item.streamId === tx.streamId &&
            item.block.hash === tx.block.hash &&
            item.hash === tx.transactionHash
        );

        if (existingTx) {
          Object.assign(existingTx, tx);
        } else {
          merged.push(tx);
        }
      }

      console.log("merged tx list length is : ", merged.length);

      for (const tx of merged) {
        console.log("tx to save into the db :  ", tx);
        try {
          const txChainId = parseInt(tx?.chainId, 16).toString();
          const txContract = tx?.contract ? tx.contract : NATIVE;
          const txAmount = tx?.valueWithDecimals
            ? tx?.valueWithDecimals
            : ethers.utils.formatUnits(tx?.value, 18);

          const isPaymentExist = await this.paymentLinkModel.findOne({
            $or: [
              { hash: tx.transactionHash || tx.hash },
              { transactionHash: tx.transactionHash || tx.hash },
              { block: tx.block },
            ],
          });

          const isAppExist = await this.merchantTxModel.findOne({
            $and: [
              { hash: tx.transactionHash || tx.hash },
              { blockNumber: tx.block.number },
            ],
          });

          const resultTo = await this.checkWalletTx(
            tx?.to ? tx.to : tx?.toAddress,
            txContract,
            txChainId,
            txAmount
          );

          console.log(
            "resultTo is : ",
            resultTo,
            "isPaymentExist : ",
            isPaymentExist,
            "isAppExist",
            isAppExist
          );

          // if toAddress found in transaction not not exist in database then update the payment Link
          if (
            resultTo &&
            resultTo.transactionType === "PAYMENT_LINK" &&
            !isPaymentExist
          ) {
            console.log("Create Paymentlink Transaction");
            await this.paymentLinkModel.updateOne(
              { _id: resultTo._id }, // Assuming `tx` contains the `_id` of the document to be updated
              {
                $set: {
                  recivedAmount: resultTo.accumulatedAmount,
                  status: PaymentStatus.PARTIALLY_SUCCESS,
                  block: tx?.block,
                  hash: tx?.hash,
                  gas: tx?.gas,
                  gasPrice: tx?.gasPrice,
                  nonce: tx?.nonce,
                  fromAddress: tx?.fromAddress,
                  tokenName: tx?.tokenName,
                  tokenSymbol: tx?.tokenSymbol,
                  tokenDecimals: tx?.tokenDecimals,
                  txType: TransactionTypes.PAYMENT_LINKS,
                },
              }
            );
            console.log(
              "Payment received in payment link -> if there is not native balance transfer on it."
            );

            // Trigger webhook for payment confirmed
            const paymentLink = await this.paymentLinkModel.findById(resultTo._id);
            if (paymentLink) {
              await this.webhookService.sendWebhook(
                paymentLink.appId.toString(),
                paymentLink._id.toString(),
                WebhookEvent.PAYMENT_CONFIRMED,
                {
                  ...paymentLink.toObject(),
                  status: PaymentStatus.PARTIALLY_SUCCESS,
                  hash: tx?.hash,
                  fromAddress: tx?.fromAddress,
                  recivedAmount: resultTo.accumulatedAmount,
                }
              );
            }
          } else if (
            resultTo &&
            resultTo.transactionType === "PARTIAL_PAYMENT_LINK" &&
            !isPaymentExist
          ) {
            console.log("Create Partial Paymentlink Transaction");
            await this.paymentLinkModel.updateOne(
              { _id: resultTo._id },
              {
                $set: {
                  recivedAmount: resultTo.accumulatedAmount,
                  // MUST Keep Status PENDING for partial payments
                  block: tx?.block,
                  hash: tx?.hash,
                  gas: tx?.gas,
                  gasPrice: tx?.gasPrice,
                  nonce: tx?.nonce,
                  fromAddress: tx?.fromAddress,
                  tokenName: tx?.tokenName,
                  tokenSymbol: tx?.tokenSymbol,
                  tokenDecimals: tx?.tokenDecimals,
                  txType: TransactionTypes.PAYMENT_LINKS,
                },
              }
            );
            console.log("Partial payment synced to database but kept in PENDING status.");
          } else if (
            resultTo &&
            resultTo.transactionType === "APP" &&
            // WalletType.APP
            !isAppExist
          ) {
            const isTxFromPaymentLink = await this.paymentLinkModel.findOne({
              toAddress: {
                $regex: `^${tx?.from || tx?.fromAddress}$`, // Ensure full match
                $options: "i", // Case-insensitive
              },
            });

            console.log("Create App Transaction : ", isTxFromPaymentLink);
            const chainId = Number(tx?.chainId);
            const networkData = getNetwork(chainId);

            const newData = {
              appsId: resultTo?._id,
              recivedAmount: txAmount,
              status: PaymentStatus.SUCCESS,
              hash: tx?.hash,
              gas: tx?.gas,
              gasPrice: tx?.gasPrice,
              fromAddress: tx?.from || tx?.fromAddress,
              toAddress: tx?.to || tx?.toAddress,
              amount: "0",
              note: isTxFromPaymentLink
                ? "Received funds from payment link"
                : "Received funds from a transaction",
              blockNumber: tx?.block?.number,
              chainId: chainId,
              symbol: tx?.tokenSymbol || networkData.symbol,
              txType: isTxFromPaymentLink
                ? TransactionTypes.PAYMENT_LINKS
                : TransactionTypes.DEPOSIT,
            };
            await this.merchantTxModel.create(newData);
          } else {
            console.log("Not a valid transaction type");
          }
        } catch (error) {
          console.error("Error storing transaction:", error);
        }
      }

      return merged;
    } catch (error) {
      console.error("Error in stream method:", error);
      throw error; // Re-throw the error to propagate it to the caller
    }
  }

  // Cron job run in every 30 seconds
  // Push new address into the streamer and db and delete which is not required anymore
  @Cron(CronExpression.EVERY_30_SECONDS)
  async deletePaymentLinksWhichIsNotExistAnymore(): Promise<any> {
    // After update, in this code just deleting the wallet addresses that are expired now.
    this.logger.debug(
      "--------------------- Cron Job Started 30 Sec (To delete expire payment links) -----------------------"
    );

    // Delete all the payment links whose expired time crossed the current time.
    // isExpiry must be true and wallet type must be "PAYMENT_LINK"
    const currentTime = Date.now() / 1000;

    // Find all documents that match the deletion criteria
    const paymentLinksToDelete = await this.monitorModel.find({
      expiryTime: { $lt: currentTime },
      walletType: WalletType.PAYMENT_LINK,
      isExpiry: true,
    });

    if (paymentLinksToDelete?.length > 0) {
      // Extract the walletType values
      const walletAddressToDelete = paymentLinksToDelete.map(
        (doc) => doc.walletAddress
      );

      // Delete the documents from monitor model
      const deletedKey = await this.monitorModel.deleteMany({
        _id: { $in: paymentLinksToDelete.map((doc) => doc._id) },
      });

      // Update the status in payment link table to expire if the status is not chagne and it is pending only
      const expiredPaymentLinks = await this.paymentLinkModel.find({
        toAddress: { $in: walletAddressToDelete },
        status: PaymentStatus.PENDING,
      });

      await this.paymentLinkModel.updateMany(
        {
          toAddress: { $in: walletAddressToDelete },
          status: PaymentStatus.PENDING, // Add condition for current status
        },
        {
          $set: {
            status: PaymentStatus.EXPIRED,
          },
        }
      );

      // Trigger webhook for expired payments
      for (const paymentLink of expiredPaymentLinks) {
        await this.webhookService.sendWebhook(
          paymentLink.appId.toString(),
          paymentLink._id.toString(),
          WebhookEvent.PAYMENT_EXPIRED,
          {
            ...paymentLink.toObject(),
            status: PaymentStatus.EXPIRED,
          }
        );
      }

      // Delete addresses
      await Moralis.Streams.deleteAddress({
        id: ConfigService.keys.WEB_STREAMER_ID,
        address: walletAddressToDelete,
      });
    }
  }

  // Delete the Apps that are not used anymore
  @Cron(CronExpression.EVERY_30_SECONDS)
  async deleteAppsWhichIsNotExistAnymore(): Promise<any> {
    this.logger.debug(
      "-------- New Cron Job running to delete apps that are not existing anymore, every 1 hours --------"
    );

    const monitorWallets = await this.monitorModel.find({
      walletType: "APP",
    });

    let walletIdsToDelete = [];
    let walletAddressesToDelete = [];

    for (const wallet of monitorWallets) {
      const appExists = await this.appModel.findOne({
        "EVMWalletMnemonic.address": {
          $regex: new RegExp(`^${wallet.walletAddress}$`, "i"),
        },
      });

      if (!appExists) {
        walletIdsToDelete.push(wallet._id);
        walletAddressesToDelete.push(wallet.walletAddress);
      }
    }

    if (walletIdsToDelete.length > 0) {
      await this.monitorModel.deleteMany({
        _id: { $in: walletIdsToDelete },
      });

      // Delete addresses
      await Moralis.Streams.deleteAddress({
        id: ConfigService.keys.WEB_STREAMER_ID,
        address: walletAddressesToDelete,
      });
    } else {
      console.log("No wallets found to delete.");
    }
    console.log("Deleted App count: ", walletIdsToDelete.length);
  }


  @Cron("*/10 * * * * *")
  async withdrawPaymentFromLinksAndUpdateStatus(): Promise<any> {
    try {
      this.logger.debug(
        "-------------- Cron Job -> Withdraw Payment From Links And Update Status In Every 10 Seconds ----------------"
      );

      // Fetch payment links with aggregation (exclude TRON — handled by dedicated 2-min cron)
      const selectedPaymentLinks = await this.paymentLinkModel.aggregate([
        {
          $match: {
            status: PaymentStatus.PARTIALLY_SUCCESS,
            chainId: { $nin: ["TRON", "BTC"] },
            withdrawStatus: { $ne: "WITHDRAW_FAILED" },
          },
        },
        {
          $lookup: paymentLink_And_App_lookupData,
        },
        {
          $unwind: "$appDetail",
        },
        {
          $project: paymentLink_And_App_projectData,
        },
      ]);

      let partialSuccessWalletId = [];

      // Process each payment link synchronously
      for (const wallet of selectedPaymentLinks) {
        // ── Retry limit: stop after 5 failed attempts to prevent infinite gas drain ──
        const MAX_WITHDRAW_RETRIES = 5;
        const currentRetry = (wallet?.withdrawRetryCount || 0) + 1;

        if (currentRetry > MAX_WITHDRAW_RETRIES) {
          console.error(
            `[EVM Withdraw] ❌ Max retries (${MAX_WITHDRAW_RETRIES}) exceeded for link ${wallet?._id}. ` +
            `Marking as WITHDRAW_FAILED to stop retry loop.`
          );
          await this.paymentLinkModel.updateOne(
            { _id: wallet._id },
            {
              $set: {
                withdrawStatus: 'WITHDRAW_FAILED',
                withdrawRetryCount: currentRetry,
              },
            }
          );
          continue;
        }

        // Increment retry counter for this attempt
        await this.paymentLinkModel.updateOne(
          { _id: wallet._id },
          { $inc: { withdrawRetryCount: 1 } }
        );

        partialSuccessWalletId.push(wallet?._id);
        const chainId = wallet?.chainId;
        const senderWalletAddress = wallet?.toAddress;
        const tokenContractAddress = wallet?.tokenAddress;
        const fullAmount = wallet?.recivedAmount;
        const tokenDecimal = wallet?.tokenDecimals ?? 18;

        const isFiat = wallet?.transactionType === "FIAT";
        const receiverAddress = isFiat
          ? ConfigService.keys.EVM_OWNER_ADDRESS
          : wallet?.appDetail?.EVMWalletMnemonic?.address;
        console.log({
          "isFiat": isFiat,
          "EVM_OWNER_ADDRESS": ConfigService.keys.EVM_OWNER_ADDRESS,
          "receiverAddress": receiverAddress
        });

        console.log("receiverAddress change now ---------------> ", receiverAddress);
        const privateKey = this.encryptionService.decryptData(
          wallet?.privateKey
        );

        if (wallet?.tokenAddress === NATIVE && chainId !== "TRON" && chainId !== "BTC") {
          try {
            let feeDetails = await this.adminService.getPlatformFee();
            console.log("feeDetails : ---------- : ", feeDetails);

            let nativeReceipt;
            let paymentLinkCharges;
            let paymentLinkWalletAddress;
            if (feeDetails instanceof NotFoundException) {
              throw Error;
            } else {
              // Use platformFee as primary EVM fee; default to 0 to prevent NaN
              paymentLinkCharges = Number(feeDetails.data.platformFee ?? feeDetails.data.merchantFee ?? 0) || 0;
              paymentLinkWalletAddress = feeDetails.data.adminWallet || feeDetails.data.merchantFeeWallet || "";

              console.log("[EVM Native Withdraw] Resolved fee:", { paymentLinkCharges, paymentLinkWalletAddress });

              const paymentLinkData = await this.paymentLinkModel.findOne({
                _id: wallet?._id,
              });

              const currentWithdrawStatus = paymentLinkData.withdrawStatus;

              nativeReceipt = await evmNativeTokenTransferFromPaymentLinks(
                chainId,
                privateKey,
                fullAmount,
                receiverAddress,
                tokenDecimal,
                paymentLinkCharges,
                paymentLinkWalletAddress,
                currentWithdrawStatus
              );
            }
            console.log("nativeReceipt ---*-*-* : ", nativeReceipt);

            if (nativeReceipt?.adminReceipt) {
              // Update payment link model for admin transaction
              await this.updatePaymentLinkModel(wallet?._id, {
                withdrawStatus: WithdrawPaymentStatus.ADMIN_CHARGES,
                adminFee: nativeReceipt?.adminAmount,
                adminFeeWallet: paymentLinkWalletAddress,
              });
            }

            if (nativeReceipt?.merchantReceipt) {
              // Update payment link model
              await this.updatePaymentLinkModel(wallet?._id, {
                withdrawStatus: WithdrawPaymentStatus.SUCCESS,
                status: PaymentStatus.SUCCESS,
                amountAfterTax: nativeReceipt?.merchantAmount,
              });

              // Trigger webhook for payment success
              const paymentLink = await this.paymentLinkModel.findById(wallet?._id);
              if (paymentLink) {
                await this.webhookService.sendWebhook(
                  paymentLink.appId.toString(),
                  paymentLink._id.toString(),
                  WebhookEvent.PAYMENT_SUCCESS,
                  paymentLink.toObject()
                );
              }
            }
          } catch (error) {
            console.log(
              "Error in evm native transafer from payment link : ",
              error.message
            );
          }
        } else {
          if (chainId !== "TRON") {
            let feeDetails = await this.adminService.getPlatformFee();
            let txCost;
            let paymentLinkCharges;
            let paymentLinkWalletAddress;
            if (feeDetails instanceof NotFoundException) {
              throw Error;
            } else {
              // Use platformFee as primary EVM fee; default to 0 to prevent NaN
              paymentLinkCharges = Number(feeDetails.data.platformFee ?? feeDetails.data.merchantFee ?? 0) || 0;
              paymentLinkWalletAddress = feeDetails.data.adminWallet || feeDetails.data.merchantFeeWallet || "";

              console.log("[EVM ERC20 Withdraw] Resolved fee:", { paymentLinkCharges, paymentLinkWalletAddress });

              // Check current withdraw status to determine if admin fee was already transferred
              const currentWithdrawStatus = wallet?.withdrawStatus;
              const adminAlreadyCharged = currentWithdrawStatus === WithdrawPaymentStatus.ADMIN_CHARGES;

              txCost = await getERC20TxFee(
                chainId,
                senderWalletAddress,
                receiverAddress,
                tokenContractAddress,
                fullAmount,
                tokenDecimal,
                paymentLinkCharges,
                paymentLinkWalletAddress,
                adminAlreadyCharged
              );
            }

            // Guard: if getERC20TxFee failed (e.g. insufficient token balance for estimation), skip this cycle
            if (!txCost?.gasPrice) {
              console.log("getERC20TxFee failed â€” gasPrice is null. Skipping this payment link for now.");
              continue;
            }

            // Use 3x gas buffer to handle gas price fluctuations between estimation and execution
            const gasBuffer = BigInt(3);
            const nativeAmountForGas = BigInt(txCost.totalGas) * BigInt(txCost.gasPrice) * gasBuffer;

            if (wallet?.withdrawStatus === WithdrawPaymentStatus.PENDING) {
              // Transfer evm native tokens to the payment links for gas
              let nativeTxReceipt = await evmNativeTokenTransferToPaymentLinks(
                chainId,
                nativeAmountForGas,
                senderWalletAddress
              );

              // Retry once with larger buffer if first attempt failed
              if (!nativeTxReceipt) {
                console.log("[EVM Gas] First gas funding attempt failed. Retrying with 5x buffer...");
                const largerGas = BigInt(txCost.totalGas) * BigInt(txCost.gasPrice) * BigInt(5);
                nativeTxReceipt = await evmNativeTokenTransferToPaymentLinks(
                  chainId,
                  largerGas,
                  senderWalletAddress
                );
              }

              if (nativeTxReceipt) {
                await this.updatePaymentLinkModel(wallet?._id, {
                  withdrawStatus: WithdrawPaymentStatus.NATIVE_TRANSFER,
                });
              } else {
                console.error(`[EVM Gas] âŒ Gas funding failed for ${senderWalletAddress}. Will retry next cycle.`);
                continue;
              }
            }

            // If admin charges were already taken but merchant TX failed previously,
            // send additional native ETH for merchant transfer gas
            if (wallet?.withdrawStatus === WithdrawPaymentStatus.ADMIN_CHARGES) {
              console.log("Sending additional native ETH for merchant transfer gas...");
              const nativeTxReceipt = await evmNativeTokenTransferToPaymentLinks(
                chainId,
                nativeAmountForGas,
                senderWalletAddress
              );
              if (!nativeTxReceipt) {
                console.log("Failed to send additional gas for merchant transfer. Will retry next cycle.");
                continue;
              }
            }

            try {
              const currentWithdrawStatus = wallet?.withdrawStatus;
              const adminAlreadyCharged = currentWithdrawStatus === WithdrawPaymentStatus.ADMIN_CHARGES;

              const erc20Receipt = await evmERC20TokenTransfer(
                chainId,
                privateKey,
                txCost,
                tokenContractAddress,
                fullAmount,
                receiverAddress,
                tokenDecimal,
                paymentLinkCharges,
                paymentLinkWalletAddress,
                adminAlreadyCharged
              );

              if (erc20Receipt.receipt1) {
                // Admin fee transferred â€” update status
                const adminFeeValue =
                  fullAmount / (1 + parseFloat(paymentLinkCharges) / 100);
                const adminFeeAmount = fullAmount - adminFeeValue;
                const amountAfterTaxValue = fullAmount - adminFeeAmount;
                await this.updatePaymentLinkModel(wallet?._id, {
                  withdrawStatus: WithdrawPaymentStatus.ADMIN_CHARGES,
                  adminFee: adminFeeAmount,
                  adminFeeWallet: paymentLinkWalletAddress,
                  amountAfterTax: amountAfterTaxValue,
                });
              }

              if (erc20Receipt.receipt2) {
                // Merchant transfer succeeded â€” mark as complete
                await this.updatePaymentLinkModel(wallet?._id, {
                  withdrawStatus: WithdrawPaymentStatus.SUCCESS,
                  status: PaymentStatus.SUCCESS,
                });

                // Trigger webhook for payment success
                const paymentLink = await this.paymentLinkModel.findById(wallet?._id);
                if (paymentLink) {
                  await this.webhookService.sendWebhook(
                    paymentLink.appId.toString(),
                    paymentLink._id.toString(),
                    WebhookEvent.PAYMENT_SUCCESS,
                    paymentLink.toObject()
                  );
                }
              }
            } catch (error) {
              console.log("An error occurred:", error.message);
            }
          }
        }
      }

      // Withdraw funds from the payment links
    } catch (error) {
      console.log(
        "An error occurred in withdrawPaymentFromLinksAndUpdateStatus : ",
        error
      );
    }
  }


  async checkWalletTx(
    walletAddress: string,
    contractAddress: string,
    chainId: string,
    txAmount: string
  ): Promise<any> {
    let result = null;

    console.log("checking wallet tx : ", {
      walletAddress,
      contractAddress,
      chainId,
      txAmount,
    });

    const forPaymentLink = {
      toAddress: { $regex: new RegExp(`^${walletAddress}$`, "i") },
      status: PaymentStatus.PENDING,
      chainId: chainId,
      tokenAddress: { $regex: new RegExp(`^${contractAddress}$`, "i") },
    };

    console.log("forPaymentLink : ", forPaymentLink);

    const paymentLink = await this.paymentLinkModel.findOne(forPaymentLink);

    let toleranceMargin = 0;
    if (paymentLink) {
      // Fetch App to get toleranceMargin for the payment link
      const appForLink = await this.appModel.findById(paymentLink.appId);
      toleranceMargin = appForLink?.toleranceMargin || 0;
    }

    const app = await this.appModel.findOne({
      "EVMWalletMnemonic.address": {
        $regex: new RegExp(`^${walletAddress}$`, "i"),
      },
    });

    const minRequiredAmount = paymentLink
      ? parseFloat(paymentLink.amount) * (1 - (toleranceMargin / 100))
      : 0;

    // Calculate accumulated amount including past partial payments
    const previousReceived = paymentLink ? parseFloat(paymentLink.recivedAmount || "0") : 0;
    const accumulatedAmount = previousReceived + parseFloat(txAmount);

    if (paymentLink && accumulatedAmount >= minRequiredAmount) {
      console.log("this is a payment link tx ----------");

      result = {
        _id: paymentLink?._id,
        id: paymentLink?.appId,
        transactionType: "PAYMENT_LINK",
        accumulatedAmount: accumulatedAmount
      };
      return result;
    } else if (paymentLink && accumulatedAmount > 0) {
      console.log("this is a partial payment link tx ----------");
      result = {
        _id: paymentLink?._id,
        id: paymentLink?.appId,
        transactionType: "PARTIAL_PAYMENT_LINK",
        accumulatedAmount: accumulatedAmount
      };
      return result;
    } else if (app) {
      console.log("this is a app  tx ----------");
      result = {
        _id: app?._id,
        id: app?._id,
        transactionType: "APP",
        // transactionType: WalletType.APP,
      };
      return result;
    } else {
      console.log("this is a null tx ----------");
      return result;
    }
  }

  async getTransactions(query) {
    try {
      const { pageNo, limitVal, search } = query;

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let queryObject = {};
      if (search) {
        queryObject = {
          $or: [
            { toAddress: { $regex: search, $options: "i" } },
            { appsId: search },
            // { contactNumber: { $regex: search, $options: "i" } },
          ],
        };
      }

      const transactions = await this.transactionModel
        .find(queryObject)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ _id: -1 });

      const count = await this.transactionModel.countDocuments(queryObject);
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

  async updatePaymentLinkModel(id, updateFields): Promise<boolean> {
    try {
      // Perform the update operation
      await this.paymentLinkModel.updateOne(
        { _id: id }, // Use the provided id to find the document
        { $set: updateFields } // Dynamically set the fields to be updated
      );

      // Return a success message or result
      return true;
    } catch (error) {
      console.error("Error updating document: ", error);
      return false;
    }
  }

  // FALLBACK SAFETY NET: Primary detection is via Tatum webhooks (instant).
  // This cron only catches payments if the webhook was missed or delayed.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async tronPaymentLink() {
    try {
      this.logger.debug(
        "-------------- Cron Job -> TRON Payment Link Fallback Check (every 5 min) ----------------"
      );

      const paymentLinks = await this.paymentLinkModel.find({
        status: PaymentStatus.PENDING,
        chainId: { $in: ["TRON"] },
      });

      if (!paymentLinks || paymentLinks?.length === 0) {
        return; // Nothing to process â€” not an error
      }

      const trc20FilteredPaymentLinks = paymentLinks.filter(
        (value) => value.code !== "TRX"
      );
      const tronFilteredPaymentLinks = paymentLinks.filter(
        (value) => value.code === "TRX"
      );

      let updatedPaymentLinks = [];
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      for (const link of tronFilteredPaymentLinks) {
        let status = {
          recivedAmount: undefined,
          status: undefined, // explicitly declare status as optional
          hash: undefined, // explicitly declare txId as optional
          fromAddress: undefined, // explicitly declare fromAddress as optional
          // tokenDecimals: 6,
        };

        if (link?.tokenAddress === NATIVE) {
          // Fetch App to get toleranceMargin
          const app = await this.appModel.findById(link?.appId);
          const toleranceMargin = app?.toleranceMargin || 0;

          const minRequiredAmountTRX = Number(link?.amount) * (1 - (toleranceMargin / 100));

          const tronBalance = await getTronBalance(link?.toAddress);

          if (tronBalance > 0) {
            const transactions = await getTronTransactions(link?.toAddress);

            const paymentLinkCreationTime = new Date(link['createdAt']).getTime();

            // Find the most recent transaction to this wallet after creation time
            const recentTx = transactions?.data?.data
              .filter((tx) => tx?.block_timestamp > paymentLinkCreationTime)
              .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];

            if (recentTx) {
              const toAddress = recentTx?.raw_data?.contract[0]?.parameter?.value?.to_address;
              const toAddressInHex = await hexToTronAddress(toAddress?.slice(2, 42));

              if (toAddressInHex === link?.toAddress) {
                const fromAddress = recentTx?.raw_data?.contract[0]?.parameter?.value?.owner_address;
                status.hash = await recentTx?.txID;
                status.fromAddress = await hexToTronAddress(fromAddress.slice(2, 42));

                // Set received amount to the actual cumulative wallet balance
                status.recivedAmount = tronBalance;

                // Determine if the total balance is enough to mark it success
                if (tronBalance >= minRequiredAmountTRX) {
                  status.status = PaymentStatus.PARTIALLY_SUCCESS;
                } else {
                  status.status = PaymentStatus.PENDING;
                }

                const updatedLink = await this.paymentLinkModel.findOneAndUpdate(
                  { _id: link?._id },
                  { $set: status },
                  { new: true }
                );

                if (updatedLink && status.status === PaymentStatus.PARTIALLY_SUCCESS) {
                  updatedPaymentLinks.push(updatedLink);

                  // Trigger webhook for TRON payment confirmed
                  await this.webhookService.sendWebhook(
                    updatedLink.appId.toString(),
                    updatedLink._id.toString(),
                    WebhookEvent.PAYMENT_CONFIRMED,
                    {
                      ...updatedLink.toObject(),
                      status: PaymentStatus.PARTIALLY_SUCCESS,
                      hash: status.hash,
                      fromAddress: status.fromAddress,
                      recivedAmount: status.recivedAmount,
                    }
                  );
                }
              }
            }
          }
        }
        await delay(1000);
      }

      for (const link of trc20FilteredPaymentLinks) {
        let status = {
          recivedAmount: undefined,
          status: undefined, // explicitly declare status as optional
          hash: undefined, // explicitly declare txId as optional
          fromAddress: undefined, // explicitly declare fromAddress as optional
          // tokenDecimals: 6,
        };
        if (link?.tokenAddress !== NATIVE) {
          // Fetch App to get toleranceMargin
          const app = await this.appModel.findById(link?.appId);
          const toleranceMargin = app?.toleranceMargin || 0;

          const tronValueInDecimal = Number(link?.amount) * tronDecimal;
          const minRequiredAmount = tronValueInDecimal * (1 - (toleranceMargin / 100));

          const decryptPrivateKey = await this.encryptionService.decryptData(
            link?.privateKey
          );

          // FIX N-SQUARED BUG: Passing [link] instead of trc20FilteredPaymentLinks to check only the current wallet
          const tronBalance = await getTRC20Balance(
            [link],
            decryptPrivateKey
          );

          for (const e of tronBalance) {
            const trc20balanceAmount = await e.balance;
            const minRequiredBalance = Number(link?.amount) * (1 - (toleranceMargin / 100));
            if (Number(trc20balanceAmount) > 0) {
              const transactions = await getTRC20Transactions(link?.toAddress);

              const paymentLinkCreationTime = new Date(link['createdAt']).getTime();

              const recentTx = transactions?.data?.data
                .filter((tx) => tx?.block_timestamp > paymentLinkCreationTime)
                .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];

              if (recentTx) {
                const toAddress = await recentTx?.to;
                if (toAddress === link?.toAddress) {
                  const fromAddress = await recentTx?.from;
                  status.hash = await recentTx?.transaction_id;
                  status.fromAddress = await fromAddress;

                  // Set received amount to the actual cumulative TRC20 wallet balance
                  status.recivedAmount = Number(trc20balanceAmount);

                  if (Number(trc20balanceAmount) >= minRequiredBalance) {
                    status.status = PaymentStatus.PARTIALLY_SUCCESS;
                  } else {
                    status.status = PaymentStatus.PENDING;
                  }

                  const updatedLink = await this.paymentLinkModel.findOneAndUpdate(
                    { _id: link?._id },
                    { $set: status },
                    { new: true }
                  );

                  if (updatedLink && status.status === PaymentStatus.PARTIALLY_SUCCESS) {
                    updatedPaymentLinks.push(updatedLink);

                    // Trigger webhook for TRC20 payment confirmed
                    await this.webhookService.sendWebhook(
                      updatedLink.appId.toString(),
                      updatedLink._id.toString(),
                      WebhookEvent.PAYMENT_CONFIRMED,
                      {
                        ...updatedLink.toObject(),
                        status: PaymentStatus.PARTIALLY_SUCCESS,
                        hash: status.hash,
                        fromAddress: status.fromAddress,
                        recivedAmount: status.recivedAmount,
                      }
                    );
                  }
                }
              }
            }
          }
        }
        await delay(1000);
      }
    } catch (error) {
      console.error("An error occurred:", error.message);
      // throw new BadRequestException("Failed to process payment links");
    }
  }

  // Withdrawal cron: reduced from 10s to 2min to stay within API rate limits.
  // Each cycle processes all PARTIALLY_SUCCESS Tron payment links.
  @Cron("*/2 * * * *")
  async withdrawTronPaymentFromLinks() {
    try {
      this.logger.debug(
        "--------------------- Cron Job Started for every 2 minutes (To withdraw tron amount from payment links) -----------------------"
      );

      const partialPaymentLinks = await this.paymentLinkModel.aggregate([
        {
          $match: {
            status: PaymentStatus.PARTIALLY_SUCCESS,
            chainId: { $in: ["TRON"] },
            withdrawStatus: { $ne: "WITHDRAW_FAILED" },
          },
        },
        {
          $lookup: paymentLink_And_App_lookupData,
        },
        {
          $unwind: "$appDetail",
        },
        {
          $addFields: {
            tronWallet: "$appDetail.TronWalletMnemonic.address",
          },
        },
        {
          $project: {
            appDetail: 0, // Exclude the appDetail field if not needed
          },
        },
      ]);

      const adminData = await this.adminModel.find();

      if (!partialPaymentLinks || partialPaymentLinks.length === 0) {
        return; // Nothing to process â€” not an error
      }

      for (const link of partialPaymentLinks) {
        // ── Retry limit: stop after 5 failed attempts to prevent infinite TRX drain ──
        const MAX_WITHDRAW_RETRIES = 5;
        const currentRetry = (link?.withdrawRetryCount || 0) + 1;

        if (currentRetry > MAX_WITHDRAW_RETRIES) {
          console.error(
            `[TRON Withdraw] ❌ Max retries (${MAX_WITHDRAW_RETRIES}) exceeded for link ${link?._id}. ` +
            `Marking as WITHDRAW_FAILED to stop retry loop.`
          );
          await this.paymentLinkModel.updateOne(
            { _id: link._id },
            {
              $set: {
                withdrawStatus: 'WITHDRAW_FAILED',
                withdrawRetryCount: currentRetry,
              },
            }
          );
          continue;
        }

        // Increment retry counter for this attempt
        await this.paymentLinkModel.updateOne(
          { _id: link._id },
          { $inc: { withdrawRetryCount: 1 } }
        );

        // Fetch tolerance margin from the app
        const appForLink = await this.appModel.findById(link?.appId);
        const toleranceMargin = appForLink?.toleranceMargin || 0;
        const minRequiredAmount = Number(link?.amount) * (1 - (toleranceMargin / 100));

        if (link?.recivedAmount >= minRequiredAmount) {
          let status = {
            status: undefined, // explicitly declare status as optional
            withdrawStatus: undefined,
            adminFee: undefined, // explicitly declare fromAddress as optional
            adminFeeWallet: undefined,
            amountAfterTax: undefined,
          };
          const decryptedPrivateKey = await this.encryptionService.decryptData(
            link?.privateKey
          );
          // Parse amounts safely â€” ensure strings/Decimal128 are properly converted
          const totalAmount = Number(String(link?.recivedAmount ?? 0));
          const decimals = Number(String(link?.tokenDecimals ?? 6));

          // Validate before proceeding â€” prevents infinite NaN error loop
          if (isNaN(totalAmount) || isNaN(decimals) || totalAmount <= 0) {
            console.error(
              `[TRON Withdraw] âŒ Invalid amount data for link ${link?._id}: ` +
              `recivedAmount=${link?.recivedAmount} (parsed: ${totalAmount}), ` +
              `tokenDecimals=${link?.tokenDecimals} (parsed: ${decimals}). Skipping.`
            );
            continue;
          }

          let merchantAddress = "";

          const isFiat = link?.transactionType === "FIAT";

          // const merchantAddress = await link?.tronWallet;

          merchantAddress = isFiat
            ? ConfigService.keys.TRON_OWNER_ADDRESS
            : await link?.tronWallet;

          const tokenContractAddress = await link?.tokenAddress;
          const paymentLinkAddress = await link?.toAddress;
          const adminAddress = adminData[0]?.tronAdminWallet;
          const adminCharges = adminData[0]?.tronPlatformFee ?? 0; // default 0 to prevent NaN
          const adminPvtKey = ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
          let merchantAmount = Number(totalAmount / (1 + adminCharges / 100));
          let adminAmount = Number(totalAmount - merchantAmount);

          console.log("[TRON Withdraw] Calculated amounts:", {
            linkId: link?._id,
            totalAmount,
            decimals,
            adminCharges,
            merchantAmount,
            adminAmount,
            merchantAddress,
            tokenContractAddress,
          });

          // â”€â”€ Dust-Skip for TRON deposit admin fee â”€â”€
          // For native TRX: min 1 TRX; for TRC-20 stablecoins: min 5 USDT/USDC; for other TRC-20: min 1 token unit
          const isStablecoinTron = ["USDT", "USDC"].includes(link?.tokenSymbol?.toUpperCase());
          const minTronAdminFee = isStablecoinTron ? 5 : 1; // 5 USDT/USDC or 1 TRX/token
          if (adminAmount > 0 && adminAmount < minTronAdminFee) {
            console.log(
              `[TRON Deposit Fee] â­ï¸ SKIPPING dust admin fee: ${adminAmount.toFixed(6)} ${link?.tokenSymbol || 'TRX'} ` +
              `(threshold: ${minTronAdminFee}). Giving full amount to merchant.`
            );
            merchantAmount = totalAmount;
            adminAmount = 0;
          }

          if (link?.tokenAddress === NATIVE) {
            let transferTronToMerchant;
            let transferTronToAdmin;
            if (
              status.withdrawStatus !== WithdrawPaymentStatus.NATIVE_TRANSFER
            ) {
              // Merchant receiver logic:
              const merchantReceiver = isFiat
                ? ConfigService.keys.TRON_OWNER_ADDRESS
                : merchantAddress;

              console.log("merchantReceiver 11", merchantReceiver);

              transferTronToMerchant = await transferTron(
                decryptedPrivateKey,
                NATIVE,
                // merchantAddress,
                merchantReceiver,
                merchantAmount,
                decimals
              );

              console.log(
                "transferTronToMerchant 000 ",
                transferTronToMerchant
              );

              console.log(
                "transferTronToMerchant",
                transferTronToMerchant.result
              );

              if (transferTronToMerchant.result) {
                status.withdrawStatus = WithdrawPaymentStatus.NATIVE_TRANSFER;
              }
            }

            if (status.withdrawStatus !== WithdrawPaymentStatus.ADMIN_CHARGES) {
              // If admin fee is 0, skip admin transfer and go straight to SUCCESS
              if (adminAmount <= 0) {
                console.log("[TRON Deposit] Admin fee is 0, skipping admin transfer.");
                if (transferTronToMerchant?.result) {
                  status.amountAfterTax = merchantAmount.toFixed(6);
                  status.withdrawStatus = WithdrawPaymentStatus.SUCCESS;
                  status.status = PaymentStatus.SUCCESS;
                }
              } else {
                console.log("324", status.withdrawStatus);
                transferTronToAdmin = await transferTron(
                  decryptedPrivateKey,
                  NATIVE,
                  adminAddress,
                  adminAmount,
                  decimals
                );
                console.log(
                  "transferTronToAdmin.result",
                  transferTronToAdmin.result
                );
                if (transferTronToAdmin.result) {
                  status.adminFee = adminAmount.toFixed(6);
                  status.adminFeeWallet = adminAddress;
                  status.withdrawStatus = WithdrawPaymentStatus.ADMIN_CHARGES;
                }
                if (transferTronToAdmin.result && transferTronToMerchant.result) {
                  status.amountAfterTax = merchantAmount.toFixed(6);
                  status.withdrawStatus = WithdrawPaymentStatus.SUCCESS;
                  status.status = PaymentStatus.SUCCESS;
                }
              }

              const updatedLink = await this.paymentLinkModel.findOneAndUpdate(
                { _id: link?._id },
                { $set: status },
                { new: true }
              );

              if (updatedLink && status.status === PaymentStatus.SUCCESS) {
                await this.webhookService.sendWebhook(
                  updatedLink.appId.toString(),
                  updatedLink._id.toString(),
                  WebhookEvent.PAYMENT_SUCCESS,
                  updatedLink.toObject()
                );

                // Cleanup: unsubscribe Tatum webhook for this address
                if (link?.tatumSubscriptionId) {
                  try {
                    const { unsubscribeTronAddressWebhook } = require("../helpers/tatum-tron.helper");
                    await unsubscribeTronAddressWebhook(link.tatumSubscriptionId);
                  } catch (e) {
                    console.error("[Tatum] Failed to unsubscribe (non-blocking):", e.message);
                  }
                }
              }
            }
          } else {
            let transferTronToMerchant;
            let transferTronToAdmin;

            // Dynamic gas funding: estimate energy needed, check balance, fund only the deficit
            const merchantReceiver = isFiat
              ? ConfigService.keys.TRON_OWNER_ADDRESS
              : merchantAddress;

            const amountInSmallestUnit = toWeiCustom(
              Number(merchantAmount.toFixed(6)).toString(),
              decimals
            );

            const gasResult = await estimateAndFundTrc20Gas(
              paymentLinkAddress,
              tokenContractAddress,
              merchantReceiver,
              amountInSmallestUnit,
              adminPvtKey,
            );

            if (!gasResult.funded) {
              console.error(
                `[TRON Withdraw] âŒ Gas funding failed for ${paymentLinkAddress}. ` +
                `Needed: ${gasResult.trxNeeded} TRX, Has: ${gasResult.balance} TRX. Will retry next cycle.`
              );
              continue;
            }

            let paymentLinkNativeBalance = gasResult.balance;

            //transferring TRC-20 P.L. balance to merchant
            if (
              status.withdrawStatus !== WithdrawPaymentStatus.NATIVE_TRANSFER
            ) {
              console.log("[TRON Withdraw] Transferring TRC-20 to merchant:", merchantReceiver);

              transferTronToMerchant = await transferTron(
                decryptedPrivateKey,
                tokenContractAddress,
                merchantReceiver,
                Number(merchantAmount.toFixed(6)),
                decimals
              );

              if (transferTronToMerchant.length === 64) {
                status.withdrawStatus = WithdrawPaymentStatus.NATIVE_TRANSFER;
              }
            }
            //transferring TRC-20 P.L. balance to admin
            if (adminAmount <= 0) {
              // No admin fee â€” skip admin transfer, go to SUCCESS after merchant transfer
              if (transferTronToMerchant?.length === 64) {
                console.log("[TRON TRC-20 Deposit] Admin fee is 0, skipping admin transfer.");
                status.amountAfterTax = merchantAmount.toFixed(6);
                status.withdrawStatus = WithdrawPaymentStatus.SUCCESS;
                status.status = PaymentStatus.SUCCESS;
              }
            } else {
              if (
                status.withdrawStatus !== WithdrawPaymentStatus.ADMIN_CHARGES
              ) {
                // Re-fund gas for admin transfer if needed (merchant TX may have consumed TRX)
                const adminAmountSmallest = toWeiCustom(
                  Number(adminAmount.toFixed(6)).toString(),
                  decimals
                );
                const adminGasResult = await estimateAndFundTrc20Gas(
                  paymentLinkAddress,
                  tokenContractAddress,
                  adminAddress,
                  adminAmountSmallest,
                  adminPvtKey,
                );

                if (!adminGasResult.funded) {
                  console.error(`[TRON Withdraw] âŒ Admin transfer gas funding failed. Will retry next cycle.`);
                  // Merchant transfer already done, will pick up admin transfer next cycle
                  break;
                }

                transferTronToAdmin = await transferTron(
                  decryptedPrivateKey,
                  tokenContractAddress,
                  adminAddress,
                  Number(adminAmount.toFixed(6)),
                  decimals
                );

                if (transferTronToAdmin.length === 64) {
                  status.adminFee = adminAmount.toFixed(6);
                  status.adminFeeWallet = adminAddress;
                  status.withdrawStatus = WithdrawPaymentStatus.ADMIN_CHARGES;
                }
              }

              //updating success status of payment links
              if (
                transferTronToMerchant?.length === 64 &&
                transferTronToAdmin?.length === 64
              ) {
                status.amountAfterTax = merchantAmount.toFixed(6);
                status.withdrawStatus = WithdrawPaymentStatus.SUCCESS;
                status.status = PaymentStatus.SUCCESS;
              }
            }
          }

          const updatedLink = await this.paymentLinkModel.findOneAndUpdate(
            { _id: link?._id },
            { $set: status },
            { new: true }
          );

          if (updatedLink && status.status === PaymentStatus.SUCCESS) {
            await this.webhookService.sendWebhook(
              updatedLink.appId.toString(),
              updatedLink._id.toString(),
              WebhookEvent.PAYMENT_SUCCESS,
              updatedLink.toObject()
            );

            // Cleanup: unsubscribe Tatum webhook for this address
            if (link?.tatumSubscriptionId) {
              try {
                const { unsubscribeTronAddressWebhook } = require("../helpers/tatum-tron.helper");
                await unsubscribeTronAddressWebhook(link.tatumSubscriptionId);
              } catch (e) {
                console.error("[Tatum] Failed to unsubscribe (non-blocking):", e.message);
              }
            }
          }
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

  async getTronBalanceAPI(query) {
    try {
      const { address, tokenAddress } = query;

      if (!address || !tokenAddress) {
        throw new NotFoundException(
          "Address or tokenAddress or Private Key is not provided here."
        );
      }

      if (tokenAddress === NATIVE) {
        const getBalance = await getTronBalance(address);
        return getBalance;
      } else {
        // const trc20FilteredPaymentLinks = paymentLinks.filter((value) => value.code !== "TRX")
        const getTokens = await this.tokenModel.find({
          chainId: { $in: ["TRON"] },
          code: { $nin: ["TRX"] },
        });

        if (!getTokens || getTokens?.length === 0) {
          throw new NotFoundException("USDT tokens not found");
        }

        const getAppModel = await this.appModel.find();

        if (!getAppModel || getAppModel?.length === 0) {
          throw new NotFoundException("USDT tokens not found");
        }

        let encryptedPvtKey;

        for (const obj of getAppModel) {
          const getAddress = await obj?.TronWalletMnemonic?.address;

          if (address === getAddress) {
            encryptedPvtKey = await obj?.TronWalletMnemonic?.privateKey;
          }
        }

        const decryptPrivateKey =
          await this.encryptionService.decryptData(encryptedPvtKey);

        const trc20Balance = await getTRC20Balance(
          getTokens,
          decryptPrivateKey
        );

        return trc20Balance;
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

  async transferTRONAPI(query) {
    try {
      const {
        tokenContractAddress,
        senderAddress,
        receiverAddress,
        amount,
        decimal,
      } = query;

      if (
        !tokenContractAddress ||
        !senderAddress ||
        !receiverAddress ||
        !amount ||
        !decimal
      ) {
        throw new NotFoundException("Some Details is not provided here.");
      }

      const adminData = await this.adminModel.find();

      const getAppModel = await this.appModel.find();

      if (!getAppModel || getAppModel?.length === 0) {
        throw new NotFoundException("USDT tokens not found");
      }

      let encryptedPvtKey;

      for (const obj of getAppModel) {
        const getAddress = await obj?.TronWalletMnemonic?.address;

        if (senderAddress === getAddress) {
          encryptedPvtKey = await obj?.TronWalletMnemonic?.privateKey;
        }
      }

      const getBalance = await getTronBalance(senderAddress);

      const decryptedPrivateKey =
        await this.encryptionService.decryptData(encryptedPvtKey);

      let transferAdminFee;
      let transferTronToUser;
      const nativeTransactionAmount = 12;
      const halfNativeTransactionAmount = nativeTransactionAmount / 2;
      const adminAddress = adminData[0]?.tronAdminWallet;
      const adminCharges = adminData[0]?.tronMerchantFee;
      const userAmount = Number(amount / (1 + adminCharges / 100));
      const adminAmount = Number(amount - userAmount);

      const getUSDTtokenAddressModel = await this.tokenModel.find({
        chainId: { $in: ["TRON"] },
        code: { $nin: ["TRX"] },
      });

      let getUSDTtokenAddress;

      for (let obj of getUSDTtokenAddressModel) {
        getUSDTtokenAddress = await obj.address;
      }

      if (tokenContractAddress === NATIVE) {
        if (amount < getBalance) {
          transferAdminFee = await transferTron(
            decryptedPrivateKey,
            tokenContractAddress,
            adminAddress,
            adminAmount,
            decimal
          );

          if (!transferAdminFee.result) {
            throw new NotFoundException("Unsufficient balance for transfer");
          }

          transferTronToUser = await transferTron(
            decryptedPrivateKey,
            tokenContractAddress,
            receiverAddress,
            userAmount,
            decimal
          );

          if (!transferTronToUser.result) {
            throw new NotFoundException("Unsufficient balance for transfer");
          }

          if (transferAdminFee.result && transferTronToUser.result) {
            return {
              message: "successfully transferred native amount",
              transactions: {
                adminTxId: transferAdminFee.txid,
                adminTronAmount: adminAmount,
                UserTxId: transferTronToUser.txid,
                adminAddress: adminAddress,
                userTronAmount: userAmount,
              },
            };
          }
        }
      } else {
        const getBalanceWithRetry = async (address, retries = 5) => {
          let balance = await getTronBalance(address);
          for (let i = 0; i < retries && balance === null; i++) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
            balance = await getTronBalance(address);
          }
          return balance;
        };

        if (
          !getUSDTtokenAddressModel ||
          getUSDTtokenAddressModel?.length === 0
        ) {
          throw new NotFoundException("USDT tokens not found");
        }

        let balanceOfNative = await getBalanceWithRetry(senderAddress);

        if (balanceOfNative >= nativeTransactionAmount) {
          const trc20Balance = await getTRC20Balance(
            getUSDTtokenAddressModel,
            decryptedPrivateKey
          );

          const getTronBalance = trc20Balance[0].balance;

          if (amount <= getTronBalance) {
            if (balanceOfNative >= halfNativeTransactionAmount) {
              transferAdminFee = await transferTron(
                decryptedPrivateKey,
                tokenContractAddress,
                adminAddress,
                Number(adminAmount.toFixed(6)),
                decimal
              );
            }

            if (balanceOfNative >= halfNativeTransactionAmount) {
              transferTronToUser = await transferTron(
                decryptedPrivateKey,
                tokenContractAddress,
                receiverAddress,
                Number(userAmount.toFixed(6)),
                decimal
              );
            }

            if (
              transferAdminFee.length !== 64 ||
              transferTronToUser.length !== 64
            ) {
              throw new NotFoundException("Unsufficient balance for transfer");
            } else {
              return {
                message: "successfully transferred TRC20 amount",
                transactions: {
                  adminTxId: transferAdminFee,
                  adminTronAmount: adminAmount,
                  UserTxId: transferTronToUser,
                  userTronAmount: userAmount,
                  adminAddress: adminAddress,
                },
              };
            }
          }
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

  @Cron(CronExpression.EVERY_MINUTE)
  async processBitcoinPaymentLinks() {
    // console.log(
    //   "processBitcoinPaymentLinks started --------------------------------"
    // );

    try {
      // Get the top 50 BTC payment links
      const paymentLinks = await this.monitorModel
        .find({
          chainId: BTC_CHAIN_ID,
          tokenAddress: NATIVE,
          walletType: WalletType.PAYMENT_LINK,
          isExpiry: true,
          streamId: "",
        })
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order (latest first)
        .limit(50)
        .select("_id paymentLinkId walletAddress amount transactionType appId"); // Include appId for tolerance margin lookup

      // get wallet addresses of the payment links
      let walletList = paymentLinks.map((item) => item.walletAddress);
      let walletTxList = [];

      // Fix: skip API call if no wallets to avoid 400 error
      if (walletList.length > 0) {
        try {
          const response = await axios.post(
            GET_BTC_TX_BATCH_URL,
            {
              addresses: walletList,
            },
            {
              headers: {
                accept: "application/json",
                "x-api-key": ConfigService.keys.TATUM_X_API_KEY,
              },
            }
          );

          walletTxList = response.data;
          // console.log(response.data, "response.data1");
        } catch (error) {
          console.log("Error fetching BTC balance:", error.message);
        }
      }

      // Fetch Apps mapping for tolerance Margins
      const appIds = [...new Set(paymentLinks.map(p => p.appId))];
      const apps = await this.appModel.find({ _id: { $in: appIds } });
      const appMap = new Map();
      apps.forEach(app => appMap.set(app._id.toString(), app));

      const mergedData = paymentLinks.map((payment) => {
        console.log('payment 122', payment)
        const walletTx = walletTxList.find((wallet) => {
          return wallet.address === payment.walletAddress;
        });

        // return {
        //   payment,
        //   transactions:
        //     walletTx.transactions.length > 0 ? walletTx.transactions : null,
        // };

        return {
          payment,
          transactions:
            walletTx &&
              Array.isArray(walletTx.transactions) &&
              walletTx.transactions.length > 0
              ? walletTx.transactions
              : null,
        };   /// new code 


      });
      const finalOutput = [];
      const partialOutput = [];
      // Iterate over the mergedData and check the transaction details and store in finalOutput
      mergedData.forEach((element) => {
        let tx = {
          id: element.payment._id,
          paymentLinkId: element.payment.paymentLinkId,
          txAmount: 0, // Initialize as a number
          senderAddress: null,
          paymentLinkWalletAddress: element.payment.walletAddress,
          paymentLinkAmount: element.payment.amount,
          block: null,
          gas: null,
          hash: null,
          status: false,
          isPartial: false,
          transactionType: element.payment.transactionType,  // <-- IMPORTANT
        };

        console.log(element, "element2")

        if (element.transactions && element.transactions.length > 0) {
          // get App toleranceMargin
          const app = appMap.get(element.payment.appId?.toString());
          const toleranceMargin = app?.toleranceMargin || 0;
          const minRequiredAmount = Number(tx.paymentLinkAmount) * (1 - (toleranceMargin / 100));

          // Initialize accumulated amount and latest variables
          let accumulatedAmount = 0;
          let latestBlock = null;
          let latestHash = null;
          let latestGas = null;
          let latestSender = null;

          element.transactions.forEach((transaction) => {
            // Keep track of the latest tx properties
            latestBlock = transaction.blockNumber;
            latestGas = transaction.fee;
            latestHash = transaction.hash;
            if (transaction.inputs && transaction.inputs.length > 0) {
              latestSender = transaction.inputs[0].coin.address; // Check for existence before accessing
            }

            transaction.outputs.forEach((output) => {
              if (output.address === tx.paymentLinkWalletAddress) {
                const outputAmount = output.value / 10 ** 8;
                accumulatedAmount += Number(outputAmount);
              }
            });
          });

          if (accumulatedAmount > 0) {
            tx.txAmount = accumulatedAmount;
            tx.block = latestBlock;
            tx.gas = latestGas;
            tx.hash = latestHash;
            tx.senderAddress = latestSender;

            if (accumulatedAmount >= minRequiredAmount) {
              tx.status = true;
            } else {
              tx.isPartial = true;
            }
          }
        }

        // if status is true, then push into the corresponding lists
        if (tx.status) {
          finalOutput.push(tx);
        } else if (tx.isPartial) {
          partialOutput.push(tx);
        }
      });

      // Update in monitor models for BOTH full and partial payments
      const allDetectedTxs = [...finalOutput, ...partialOutput];
      const bulkOperations = allDetectedTxs.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: {
              streamId: item.streamId || ConfigService.keys.WEB_STREAMER_ID,
            },
          },
        },
      }));
      if (bulkOperations.length > 0) {
        await this.monitorModel.bulkWrite(bulkOperations);
      }

      // Update in payment links for FULL success
      for (const item of finalOutput) {
        console.log("Processing full BTC payment: ", item);
        await this.paymentLinkModel.updateOne(
          { _id: item.paymentLinkId },
          {
            $set: {
              status: PaymentStatus.PARTIALLY_SUCCESS,
              block: item.block,
              fromAddress: item.senderAddress,
              gas: item.fee,
              hash: item.hash,
              recivedAmount: item.txAmount,
              tokenDecimals: "8",
              tokenName: "BTC",
            },
          }
        );

        // Trigger webhook for BTC payment confirmed
        const paymentLink = await this.paymentLinkModel.findById(item.paymentLinkId);
        if (paymentLink) {
          await this.webhookService.sendWebhook(
            paymentLink.appId.toString(),
            paymentLink._id.toString(),
            WebhookEvent.PAYMENT_CONFIRMED,
            {
              ...paymentLink.toObject(),
              status: PaymentStatus.PARTIALLY_SUCCESS,
              hash: item.hash,
              fromAddress: item.senderAddress,
              recivedAmount: item.txAmount,
            }
          );
        }
      }

      // Update in payment links for PARTIAL payments (PENDING)
      for (const item of partialOutput) {
        console.log("Processing partial BTC payment: ", item);
        await this.paymentLinkModel.updateOne(
          { _id: item.paymentLinkId },
          {
            $set: {
              // Status remains PENDING
              block: item.block,
              fromAddress: item.senderAddress,
              gas: item.fee,
              hash: item.hash,
              recivedAmount: item.txAmount,
              tokenDecimals: "8",
              tokenName: "BTC",
            },
          }
        );
      }

      this.logger.debug(
        `------------ Cron Job Started 1 MINUTE (To process btc payment) -------------- Full: ${finalOutput.length}, Partial: ${partialOutput.length}`
      );

      return finalOutput;
      // return mergedData;
    } catch (error) {
      // console.log(
      //   "processBitcoinPaymentLinks ended --------------------------------"
      // );
      console.log("An error occurred:", error.message);
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }
  // Withdraw BTC Fund from the Payment links
  @Cron(CronExpression.EVERY_MINUTE)
  async withdrawBTCPaymentFromLinksAndUpdateStatus(): Promise<any> {
    try {
      // Fetch payment links with aggregation
      const selectedBTCPaymentLinks = await this.paymentLinkModel.aggregate([
        {
          $match: {
            status: PaymentStatus.PARTIALLY_SUCCESS,
            chainId: "BTC",
          },
        },
        {
          $lookup: paymentLink_And_App_lookupData,
        },
        {
          $unwind: "$appDetail",
        },
        {
          $project: btc_PaymentLink_And_App_projectData,
        },
      ]);

      if (!selectedBTCPaymentLinks || selectedBTCPaymentLinks.length === 0) {
        return [];
      }

      // Fetch admin platform fee details (BTC-specific)
      let btcAdminFeePercent = 0;
      let btcAdminWallet = null;
      try {
        const feeDetails = await this.adminService.getPlatformFee();
        if (feeDetails && !(feeDetails instanceof NotFoundException)) {
          btcAdminFeePercent = parseFloat(String(feeDetails.data.btcMerchantFee)) || 0;
          btcAdminWallet = feeDetails.data.btcAdminWallet || null;
          console.log(`[BTC Withdraw] Admin fee: ${btcAdminFeePercent}%, Admin wallet: ${btcAdminWallet}`);
        }
      } catch (feeError) {
        console.log("[BTC Withdraw] Warning: Could not fetch platform fee, proceeding without admin fee split:", feeError.message);
      }

      let partialSuccessWalletId = [];

      // Process each payment link synchronously
      for (const wallet of selectedBTCPaymentLinks) {
        partialSuccessWalletId.push(wallet?._id);
        const senderWalletAddress = wallet?.toAddress;
        const fullAmount = wallet?.recivedAmount;

        const isFiat = wallet?.transactionType?.toUpperCase?.() === "FIAT";
        const receiverAddress = isFiat
          ? ConfigService.keys.BTC_OWNER_ADDRESS
          : wallet?.appDetail?.BtcWalletMnemonic?.address;
        console.log({
          "isFiat": isFiat,
          "BTC_OWNER_ADDRESS": ConfigService.keys.BTC_OWNER_ADDRESS,
          "receiverAddress": receiverAddress
        });

        const privateKey = this.encryptionService.decryptData(
          wallet?.privateKey
        );

        try {
          console.log("ðŸš€ BTC Transfer Started");
          console.log("Sender Wallet: ", senderWalletAddress);
          console.log("Receiver Wallet: ", receiverAddress);
          console.log("Full Amount: ", fullAmount);
          console.log("is Fiat:", isFiat);
          console.log("Admin Fee %:", btcAdminFeePercent);
          console.log("Admin Wallet:", btcAdminWallet);

          const tx = await btcTransferFromPaymentLinks(
            privateKey,
            senderWalletAddress,
            receiverAddress,
            fullAmount,
            isFiat,
            ConfigService.keys.BTC_OWNER_ADDRESS,
            btcAdminFeePercent,
            btcAdminWallet
          );

          if (tx?.txId) {
            // Build update object with fee details
            const updateFields: any = {
              withdrawStatus: WithdrawPaymentStatus.SUCCESS,
              status: PaymentStatus.SUCCESS,
            };

            // Record admin fee details if fee was sent
            if (tx.adminFeeSent && tx.adminFeeAmount > 0) {
              updateFields.adminFee = tx.adminFeeAmount;
              updateFields.adminFeeWallet = btcAdminWallet;
              updateFields.amountAfterTax = tx.merchantAmount;
              console.log(`âœ… BTC Admin fee recorded: ${tx.adminFeeAmount} BTC â†’ ${btcAdminWallet}`);
            } else {
              updateFields.amountAfterTax = tx.merchantAmount || fullAmount;
              if (btcAdminFeePercent > 0) {
                console.log(`âš ï¸ BTC Admin fee was below dust limit. Full amount sent to merchant/owner.`);
              }
            }

            // Update payment link model
            await this.updatePaymentLinkModel(wallet?._id, updateFields);

            // Trigger webhook for BTC payment success
            const paymentLink = await this.paymentLinkModel.findById(wallet?._id);
            if (paymentLink) {
              await this.webhookService.sendWebhook(
                paymentLink.appId.toString(),
                paymentLink._id.toString(),
                WebhookEvent.PAYMENT_SUCCESS,
                paymentLink.toObject()
              );
            }
          }
        } catch (error) {
          console.log(
            "Error in BTC transfer from payment link: ",
            error.message
          );
        }
      }

      return partialSuccessWalletId;
    } catch (error) {
      console.log(
        "An error occurred in withdrawBTCPaymentFromLinksAndUpdateStatus: ",
        error
      );
    }
  }


  @Cron(CronExpression.EVERY_5_MINUTES)
  async TRON_DIRECT_DEPOSIT_MONITOR() {
    try {
      // Fetch the top 50 BTC payment links
      const getAllAppsTronWallets = await this.appModel
        .find()
        .sort({ createdAt: -1 }) // Sort by creation date in descending order
        .limit(50)
        .select("_id merchantId TronWalletMnemonic.address");

      // For Tron wallets
      if (getAllAppsTronWallets && getAllAppsTronWallets.length > 0) {
        // Fix: process wallets sequentially with delay to avoid 429 rate limiting
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
        const validWallets = getAllAppsTronWallets.filter((wallet) => wallet?.TronWalletMnemonic?.address);
        const tronWalletDataList = [];

        for (const wallet of validWallets) {
          const tronWallet = wallet.TronWalletMnemonic.address;
          const merchantId = wallet.merchantId;

          try {
            const tronWalletData =
              await getTronToAddressAllTransactions(tronWallet);

            const trc20Transactions = (
              await getTRC20Transactions(tronWallet)
            ).data;

            if (
              tronWalletData?.success &&
              tronWalletData?.data?.length > 0
            ) {
              // Process each transaction
              for (const transaction of tronWalletData?.data) {
                const hash = transaction?.txID;

                const fAddress =
                  transaction?.raw_data?.contract[0]?.parameter?.value
                    ?.owner_address;

                const tronFAddress =
                  (await hexToTronAddress(fAddress.slice(2, 42))) || null;

                const tAddress =
                  transaction?.raw_data?.contract[0]?.parameter?.value
                    ?.to_address;

                const tronTAddress =
                  (await hexToTronAddress(tAddress.slice(2, 42))) || null;

                // Check if the transaction already exists
                const existingTx = await this.merchantTxModel.findOne({
                  hash,
                });

                const paymentLinks = await this.paymentLinkModel
                  .find({
                    status: PaymentStatus.SUCCESS,
                    chainId: { $in: ["TRON"] },
                  })
                  .select("toAddress");

                const paymentLinkTxTypeCheck = async () => {
                  let txTypeStatus;
                  const paymentLink = await paymentLinks.map(
                    (PL) => PL?.toAddress === tronFAddress
                  );

                  for (const PL of paymentLink) {
                    txTypeStatus = TransactionTypes.DEPOSIT;
                    if (PL) {
                      txTypeStatus = TransactionTypes.PAYMENT_LINKS;
                    }
                  }
                  return txTypeStatus;
                };

                const txTypeOfPayment = await paymentLinkTxTypeCheck();

                if (!existingTx) {
                  const newTxData = {
                    appsId: wallet._id,
                    status: PaymentStatus.SUCCESS,
                    recivedAmount:
                      transaction?.raw_data?.contract[0]?.parameter?.value
                        ?.amount /
                      10 ** 6 || 0, // Convert to proper unit
                    hash,
                    gas: 0, // Update if gas is available
                    gasPrice: 0, // Update if gas price is available
                    fromAddress: tronFAddress,
                    toAddress: tronTAddress,
                    note: "Deposit funds",
                    blockNumber: transaction?.blockNumber,
                    chainId: TRON_CHAIN_ID,
                    symbol: "TRX",
                    txType: txTypeOfPayment,
                  };

                  // Save the new transaction
                  await this.merchantTxModel.create(newTxData);
                }
              }

              // return {
              //   merchantId,
              //   transactionsProcessed: tronWalletData.data.length,
              // };
            }

            if (
              trc20Transactions?.success &&
              trc20Transactions?.data?.length > 0
            ) {
              // Process each transaction
              for (const transaction of trc20Transactions?.data) {
                const hash = transaction.transaction_id;

                const fAddress = transaction?.from;
                const tAddress = transaction?.to;

                // Check if the transaction already exists
                const existingTx = await this.merchantTxModel.findOne({
                  hash,
                });

                const paymentLinks = await this.paymentLinkModel
                  .find({
                    status: PaymentStatus.SUCCESS,
                    chainId: { $in: ["TRON"] },
                  })
                  .select("toAddress");

                const paymentLinkTxTypeCheck = async () => {
                  let txTypeStatus;
                  const paymentLink = await paymentLinks.map(
                    (PL) => PL?.toAddress === fAddress
                  );

                  for (const PL of paymentLink) {
                    txTypeStatus = TransactionTypes.DEPOSIT;
                    if (PL) {
                      txTypeStatus = TransactionTypes.PAYMENT_LINKS;
                    }
                  }
                  return txTypeStatus;
                };

                const txTypeOfPayment = await paymentLinkTxTypeCheck();

                if (!existingTx) {
                  const newTxData = {
                    appsId: wallet._id,
                    status: PaymentStatus.SUCCESS,
                    recivedAmount: transaction?.value / 10 ** 6 || 0, // Convert to proper unit
                    hash,
                    gas: 0, // Update if gas is available
                    gasPrice: 0, // Update if gas price is available
                    fromAddress: fAddress,
                    toAddress: tAddress,
                    note: "Deposit funds",
                    blockNumber: transaction?.blockNumber || 0, //
                    chainId: TRON_CHAIN_ID,
                    symbol: transaction?.token_info?.symbol || "USDT",
                    txType: txTypeOfPayment,
                  };

                  // Save the new transaction
                  await this.merchantTxModel.create(newTxData);
                }
              }
            }

            tronWalletDataList.push(null); // Skip wallets with no successful transactions
          } catch (error) {
            console.error(
              `Error fetching Tron Wallet Data for Merchant ${merchantId}:`,
              error.message
            );
            tronWalletDataList.push(null);
          }
          await delay(1000); // Fix: 1000ms delay between wallets to avoid 429 rate limiting
        }

        // Remove null entries caused by errors or invalid wallets
        const validTronWalletData = tronWalletDataList.filter(
          (data) => data !== null
        );

        return validTronWalletData;
      } else {
        console.log("No wallets found.");
        return [];
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error.message);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException("Failed to monitor deposits");
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async BITCOIN_DIRECT_DEPOSIT_MONITOR() {
    try {
      // Get the top 50 BTC tx
      const getAllAppsBtcWallets = await this.appModel
        .find()
        .sort({ createdAt: -1 }) // Sort by creation date in descending order
        .limit(50)
        .select("_id merchantId BtcWalletMnemonic.address");

      // Create a mapping of address to appsId
      const addressToAppsIdMap = getAllAppsBtcWallets.reduce(
        (map, entry) => {
          const address = entry?.BtcWalletMnemonic?.address;
          if (address) {
            map[address] = entry?._id.toString();
          }
          return map;
        },
        {} as Record<string, string>
      ); //

      const walletList = getAllAppsBtcWallets
        .map((entry) => entry?.BtcWalletMnemonic?.address) // Extract the address if it exists
        .filter((address) => {
          if (!address) return false; // Exclude null or undefined addresses
          if (ConfigService.keys.TATUM_NETWORK?.includes("mainnet") || ConfigService.keys.TATUM_NETWORK === "bitcoin") {
            return address.startsWith("bc"); // Include addresses starting with "bc"
          } else {
            return !address.startsWith("bc"); // Include addresses not starting with "bc"
          }
        });

      let walletTxList = [];

      try {
        const url = "https://api.tatum.io/v3/bitcoin/transaction/address/batch";

        const payload = {
          addresses: walletList,
          txType: "incoming",
        };

        const headers = {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": ConfigService.keys.TATUM_X_API_KEY, // Fix: use env key, not hardcoded
        };

        const response = await axios.post(url, payload, {
          headers,
        });

        // Ensure the response contains data
        if (response?.data) {
          walletTxList = response.data;
        } else {
          console.log("No transaction data received in the response.");
        }
      } catch (error) {
        console.log("Error fetching transactions:", error.message);
      }

      // const output = walletTxList.flatMap(({ address, transactions }) =>
      //   transactions.map((transaction) => ({
      //     transactions: {
      //       appsId: "wallet._id",
      //       status: PaymentStatus.SUCCESS,
      //       recivedAmount: transactions[0].inputs[0].coin.value / 10 ** 8, // Convert to proper unit
      //       hash: transaction?.hash,
      //       gas: transaction.fee, // Update if gas is available
      //       gasPrice: 0, // Update if gas price is available
      //       fromAddress: transactions[0].inputs[0].coin.address,
      //       toAddress: address,
      //       note: "Deposit funds",
      //       blockNumber: transaction.blockNumber,
      //       chainId: BTC_CHAIN_ID,
      //       symbol: "BTC",
      //     },
      //   }))
      // );

      const existingHashes = await this.merchantTxModel.distinct("hash");

      const output = walletTxList.flatMap(({ address, transactions }) =>
        transactions
          .filter((transaction) => !existingHashes.includes(transaction.hash))
          .map((transaction) => ({
            transactions: {
              appsId: addressToAppsIdMap[address] || "",
              status: PaymentStatus.SUCCESS,
              recivedAmount: transaction.inputs[0].coin.value / 10 ** 8, // Convert to proper unit
              hash: transaction.hash,
              gas: transaction.fee, // Update if gas is available
              gasPrice: 0, // Update if gas price is available
              fromAddress: transaction.inputs[0].coin.address,
              toAddress: address,
              note: "Deposit funds",
              blockNumber: transaction.blockNumber,
              chainId: BTC_CHAIN_ID,
              symbol: "BTC",
            },
          }))
      );

      if (output.length > 0) {
        await this.merchantTxModel.insertMany(
          output.map((o) => o.transactions)
        );
      }

      return output;
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

  // =====================================================================
  // CRON: Reclaim leftover funds from completed temp wallets
  // Runs every 15 minutes. Only TRON + EVM (BTC skipped).
  // Sweeps remaining native tokens + any leftover TRC-20/ERC-20 back to
  // the funding/admin wallet â€” but ONLY if profitable (amount > gas cost).
  // TRON â†’ TRON_ADMIN_ADDRESS
  // EVM  â†’ ADMIN_WALLET_ADDRESS
  // =====================================================================
  @Cron("0 */15 * * * *") // Every 15 minutes
  async reclaimLeftoverFunds() {
    try {
      console.log(
        "-------------- Cron Job -> Reclaim Leftover Funds (every 15 min) ----------------"
      );

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const completedLinks = await this.paymentLinkModel
        .find({
          status: PaymentStatus.SUCCESS,
          withdrawStatus: WithdrawPaymentStatus.SUCCESS,
          fundsReclaimed: { $ne: true },
          updatedAt: { $lt: tenMinutesAgo },
          chainId: { $ne: "BTC" }, // Skip BTC â€” fees deducted from amount
        })
        .limit(10)
        .lean();

      if (completedLinks.length === 0) {
        return;
      }

      console.log(`[Reclaim] Found ${completedLinks.length} completed wallets to sweep`);

      for (const link of completedLinks) {
        try {
          // ── Retry limit: stop after 3 failed attempts to prevent infinite gas drain ──
          const MAX_RECLAIM_RETRIES = 3;
          const currentRetry = (link?.reclaimRetryCount || 0) + 1;

          if (currentRetry > MAX_RECLAIM_RETRIES) {
            console.error(
              `[Reclaim] ❌ Max retries (${MAX_RECLAIM_RETRIES}) exceeded for link ${link?._id}. ` +
              `Marking as reclaimed to stop retry loop.`
            );
            await this.paymentLinkModel.updateOne(
              { _id: link._id },
              { $set: { fundsReclaimed: true, reclaimRetryCount: currentRetry } }
            );
            continue;
          }

          // Increment retry counter for this attempt
          await this.paymentLinkModel.updateOne(
            { _id: link._id },
            { $inc: { reclaimRetryCount: 1 } }
          );

          const chainId = link.chainId;
          const tempAddress = link.toAddress;
          const decryptedPrivateKey = this.encryptionService.decryptData(link.privateKey);

          if (!decryptedPrivateKey) {
            console.error(`[Reclaim] Cannot decrypt key for ${tempAddress}. Marking reclaimed.`);
            await this.paymentLinkModel.updateOne({ _id: link._id }, { $set: { fundsReclaimed: true } });
            continue;
          }

          console.log(`[Reclaim] Processing ${tempAddress} on chain ${chainId} (Attempt ${currentRetry}/${MAX_RECLAIM_RETRIES})...`);

          let isReclaimed = false;
          if (chainId === "TRON") {
            isReclaimed = await this.reclaimTronFunds(tempAddress, decryptedPrivateKey, link);
          } else {
            isReclaimed = await this.reclaimEvmFunds(tempAddress, decryptedPrivateKey, chainId, link);
          }

          if (isReclaimed) {
            await this.paymentLinkModel.updateOne({ _id: link._id }, { $set: { fundsReclaimed: true } });
            console.log(`[Reclaim] ✅ Marked ${tempAddress} as reclaimed.`);
          } else {
            console.log(`[Reclaim] ⚠️ Some sweeps failed for ${tempAddress}. Will retry next cycle (if under max retries).`);
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`[Reclaim] Error processing ${link.toAddress}:`, error.message);
        }
      }
    } catch (error) {
      console.error("[Reclaim] Cron error:", error.message);
    }
  }

  /**
   * Sweep leftover TRX + TRC-20 from a completed TRON temp wallet
   * → TRON_ADMIN_ADDRESS. Only if profitable (reclaim > gas cost).
   */
  private async reclaimTronFunds(tempAddress: string, privateKey: string, link: any): Promise<boolean> {
    const adminAddress = ConfigService.keys.TRON_ADMIN_ADDRESS;
    if (!adminAddress) {
      console.error("[Reclaim TRON] No TRON_ADMIN_ADDRESS configured.");
      return false;
    }

    let allSweepsSuccessful = true;

    // 1. TRC-20 tokens
    try {
      const tronNode = ConfigService.keys.TRON_NODE || "https://api.trongrid.io";
      const tronApiKey = ConfigService.keys.TRON_GRID_API_KEY;
      const trc20Url = `${tronNode}/v1/accounts/${tempAddress}/tokens/trc20?limit=50`;
      const reqHeaders: any = { accept: "application/json" };
      if (tronApiKey) reqHeaders["TRON-PRO-API-KEY"] = tronApiKey;

      const trc20Response = await axios.get(trc20Url, { headers: reqHeaders });
      const trc20Tokens = trc20Response?.data?.data || [];

      for (const token of trc20Tokens) {
        const tokenBalance = token.balance || "0";
        const tokenAddr = token.token_id || token.contract_address;
        const tokenDecimals = Number(token.token_decimal || 6);

        if (BigInt(tokenBalance) > BigInt(0) && tokenAddr) {
          const humanAmount = Number(tokenBalance) / (10 ** tokenDecimals);

          // Profitability: TRC-20 transfer costs ~30 TRX ≈ $4-5 in gas.
          // Skip if token value < $1 (covers USDT, USDC dust).
          if (humanAmount < 1) {
            console.log(`[Reclaim TRON] ⏭️ Dust TRC-20: ${humanAmount} of ${tokenAddr} — skip (< $1)`);
            continue;
          }

          const adminPvtKey = ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
          if (!adminPvtKey) continue;

          // Estimate gas needed
          const gasResult = await estimateAndFundTrc20Gas(
            tempAddress, tokenAddr, adminAddress, tokenBalance.toString(), adminPvtKey
          );

          // Profitability: compare token value vs gas cost
          // Rough: 1 TRX ≈ $0.12-0.15. Only reclaim if value > gas cost.
          if (gasResult.trxNeeded > 0 && humanAmount < gasResult.trxNeeded * 0.15) {
            console.log(
              `[Reclaim TRON] ⏭️ Not profitable: ~$${humanAmount.toFixed(2)} < gas ~${gasResult.trxNeeded} TRX ($${(gasResult.trxNeeded * 0.15).toFixed(2)}). Skip.`
            );
            continue;
          }

          if (gasResult.funded) {
            try {
              const txid = await transferTron(privateKey, tokenAddr, adminAddress, humanAmount, tokenDecimals);
              console.log(`[Reclaim TRON] ✅ Swept ${humanAmount} TRC-20 (${tokenAddr}) → ${adminAddress} | TX: ${txid}`);
            } catch (txErr) {
              console.error(`[Reclaim TRON] TRC-20 transfer failed:`, txErr.message);
              allSweepsSuccessful = false;
            }
          } else {
            console.error(`[Reclaim TRON] TRC-20 gas funding failed, skipping sweep.`);
            allSweepsSuccessful = false;
          }
        }
      }
    } catch (trc20Error) {
      console.error(`[Reclaim TRON] TRC-20 sweep error:`, trc20Error.message);
      allSweepsSuccessful = false;
    }

    // 2. Native TRX
    try {
      const trxBalance = await getTronBalance(tempAddress);
      // Profitability: TRX send costs ~0.3 TRX. Only sweep if > 2 TRX.
      const MIN_TRX = 2;
      const SEND_FEE = 0.3;

      if (trxBalance && trxBalance > MIN_TRX) {
        const reclaimAmount = Number((trxBalance - SEND_FEE).toFixed(6));
        console.log(`[Reclaim TRON] Sweeping ${reclaimAmount} TRX → ${adminAddress} (balance: ${trxBalance} TRX)`);

        const txResult = await transferTron(privateKey, NATIVE, adminAddress, reclaimAmount, 6);
        if ((txResult as any)?.result || (typeof txResult === "string" && txResult.length === 64)) {
          console.log(`[Reclaim TRON] ✅ Swept ${reclaimAmount} TRX → ${adminAddress}`);
        } else {
          console.error(`[Reclaim TRON] TRX transfer failed`);
          allSweepsSuccessful = false;
        }
      } else {
        console.log(`[Reclaim TRON] TRX balance ${trxBalance || 0} — below ${MIN_TRX} threshold. Skip.`);
      }
    } catch (trxError) {
      console.error(`[Reclaim TRON] TRX sweep error:`, trxError.message);
      allSweepsSuccessful = false;
    }

    return allSweepsSuccessful;
  }

  /**
   * Sweep leftover native ETH/BNB/MATIC + ERC-20 from a completed EVM temp wallet
   * → ADMIN_WALLET_ADDRESS. Only if profitable (reclaim > gas cost).
   */
  private async reclaimEvmFunds(tempAddress: string, privateKey: string, chainId: string, link: any): Promise<boolean> {
    const adminAddress = ConfigService.keys.ADMIN_WALLET_ADDRESS;
    if (!adminAddress) {
      console.error("[Reclaim EVM] No ADMIN_WALLET_ADDRESS configured.");
      return false;
    }

    let allSweepsSuccessful = true;

    try {
      const web3 = await getWeb3(chainId);
      const account = web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(account);

      // 1. ERC-20 tokens
      const tokenAddress = link.tokenAddress;
      if (tokenAddress && tokenAddress !== NATIVE) {
        try {
          const minABI = [
            { constant: true, inputs: [{ name: "_owner", type: "address" }], name: "balanceOf", outputs: [{ name: "balance", type: "uint256" }], type: "function" },
            { constant: false, inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], type: "function" },
            { constant: true, inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], type: "function" },
          ];

          const tokenContract = new web3.eth.Contract(minABI as any, tokenAddress);
          const tokenBalance = await tokenContract.methods.balanceOf(account.address).call();

          if (BigInt(String(tokenBalance)) > BigInt(0)) {
            let tokenDecimals = 18;
            try { tokenDecimals = Number(await tokenContract.methods.decimals().call()); } catch {}
            const humanBalance = Number(tokenBalance) / (10 ** tokenDecimals);

            // Profitability: skip dust < $0.50
            if (humanBalance < 0.5) {
              console.log(`[Reclaim EVM] ⏭️ Dust ERC-20: ${humanBalance} of ${tokenAddress} on ${chainId} — skip`);
            } else {
              const gasPrice = await web3.eth.getGasPrice();
              const gas = await tokenContract.methods
                .transfer(adminAddress, String(tokenBalance))
                .estimateGas({ from: account.address });
              const gasCostWei = BigInt(gas) * BigInt(gasPrice);
              const gasCostEth = Number(web3.utils.fromWei(gasCostWei.toString(), "ether"));

              // Profitability: is the token value > gas cost?
              // For stablecoins: $humanBalance > gasCostEth * nativePrice
              // Use conservative check: skip if humanBalance < 1 AND gasCost > 0.001 ETH
              if (humanBalance < 1 && gasCostEth > 0.001) {
                console.log(`[Reclaim EVM] ⏭️ Not profitable: ${humanBalance} tokens, gas ${gasCostEth.toFixed(6)} native. Skip.`);
              } else {
                console.log(`[Reclaim EVM] Sweeping ERC-20 (${tokenAddress}): ${humanBalance} from ${tempAddress} on ${chainId}`);

                // Check if native balance covers gas, fund if needed
                const nativeBalance = await web3.eth.getBalance(account.address);
                if (BigInt(nativeBalance) < gasCostWei * BigInt(2)) {
                  console.log(`[Reclaim EVM] Funding gas for ERC-20 sweep...`);
                  const deficit = gasCostWei * BigInt(2) - BigInt(nativeBalance);
                  const fundRes = await evmNativeTokenTransferToPaymentLinks(chainId, deficit, account.address);
                  if (fundRes.status) {
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                  } else {
                    console.error(`[Reclaim EVM] Gas funding failed, skipping ERC-20 sweep.`);
                    allSweepsSuccessful = false;
                  }
                }

                if (allSweepsSuccessful) {
                  const updatedBalance = await web3.eth.getBalance(account.address);
                  if (BigInt(updatedBalance) >= gasCostWei) {
                    const nonce = await web3.eth.getTransactionCount(account.address, "pending");
                    const tx = {
                      from: account.address,
                      to: tokenAddress,
                      gas, gasPrice, nonce,
                      data: tokenContract.methods.transfer(adminAddress, String(tokenBalance)).encodeABI(),
                    };
                    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
                    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                    if (receipt?.status) {
                      console.log(`[Reclaim EVM] ✅ Swept ERC-20 → ${adminAddress} | TX: ${receipt.transactionHash}`);
                    } else {
                      console.error(`[Reclaim EVM] ERC-20 sweep TX failed`);
                      allSweepsSuccessful = false;
                    }
                  } else {
                    console.error(`[Reclaim EVM] Native balance still insufficient after funding`);
                    allSweepsSuccessful = false;
                  }
                }
              }
            }
          }
        } catch (tokenError) {
          console.error(`[Reclaim EVM] ERC-20 sweep error:`, tokenError.message);
          allSweepsSuccessful = false;
        }
      }

      // 2. Native tokens (ETH/BNB/MATIC)
      const nativeBalance = await web3.eth.getBalance(account.address);
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = BigInt(21000);
      const gasCostWei = gasLimit * BigInt(gasPrice);
      // Profitability: only sweep if balance > 3x gas cost (keep 2/3 profit after gas)
      const minReclaim = gasCostWei * BigInt(3);

      if (BigInt(nativeBalance) > minReclaim) {
        const reclaimWei = BigInt(nativeBalance) - gasCostWei;
        console.log(
          `[Reclaim EVM] Sweeping ${web3.utils.fromWei(reclaimWei.toString(), "ether")} native → ${adminAddress} ` +
          `(gas: ${web3.utils.fromWei(gasCostWei.toString(), "ether")}) on ${chainId}`
        );

        const nonce = await web3.eth.getTransactionCount(account.address, "pending");
        const tx = {
          from: account.address, to: adminAddress,
          value: reclaimWei.toString(), gas: gasLimit.toString(), gasPrice, nonce,
        };
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        if (receipt?.status) {
          console.log(`[Reclaim EVM] ✅ Swept native → ${adminAddress} | TX: ${receipt.transactionHash}`);
        } else {
          console.error(`[Reclaim EVM] Native sweep TX failed`);
          allSweepsSuccessful = false;
        }
      } else {
        console.log(`[Reclaim EVM] Native ${web3.utils.fromWei(nativeBalance, "ether")} on ${chainId} — not worth gas. Skip.`);
      }
    } catch (error) {
      console.error(`[Reclaim EVM] Error sweeping ${tempAddress}:`, error.message);
      allSweepsSuccessful = false;
    }

    return allSweepsSuccessful;
  }

  // Ended File Here ----
}

