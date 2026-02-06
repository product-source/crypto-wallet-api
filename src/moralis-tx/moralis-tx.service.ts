import axios from "axios";
import {
  hexToTronAddress,
  tronDecimal,
  getTronTransactions,
  getTRC20Balance,
  getTRC20Transactions,
  transferTron,
  getTronToAddressAllTransactions,
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
} from "src/helpers/evm.helper";
import { EncryptionService } from "src/utils/encryption.service";
import { AdminService } from "src/admin/admin.service";
import { getTronBalance } from "src/helpers/tron.helper";
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
            // WalletType.PAYMENT_LINK
            !isPaymentExist
          ) {
            console.log("Create Paymentlink Transaction");
            await this.paymentLinkModel.updateOne(
              { _id: resultTo._id }, // Assuming `tx` contains the `_id` of the document to be updated
              {
                $set: {
                  recivedAmount: txAmount,
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
                  recivedAmount: txAmount,
                }
              );
            }
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


  @Cron(CronExpression.EVERY_30_SECONDS)
  async withdrawPaymentFromLinksAndUpdateStatus(): Promise<any> {
    try {
      this.logger.debug(
        "-------------- Cron Job -> Withdraw Payment From Links And Update Status In Every 10 Seconds ----------------"
      );

      // Fetch payment links with aggregation
      const selectedPaymentLinks = await this.paymentLinkModel.aggregate([
        {
          $match: {
            status: PaymentStatus.PARTIALLY_SUCCESS,
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

        if (wallet?.tokenAddress === NATIVE) {
          try {
            let feeDetails = await this.adminService.getPlatformFee();
            console.log("feeDetails : ---------- : ", feeDetails);

            let nativeReceipt;
            let paymentLinkCharges;
            let paymentLinkWalletAddress;
            if (feeDetails instanceof NotFoundException) {
              throw Error;
            } else {
              paymentLinkCharges = feeDetails.data.merchantFee;
              paymentLinkWalletAddress = feeDetails.data.merchantFeeWallet;

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

            if (nativeReceipt.adminReceipt) {
              // Update payment link model for admin transaction
              await this.updatePaymentLinkModel(wallet?._id, {
                withdrawStatus: WithdrawPaymentStatus.ADMIN_CHARGES,
                adminFee: nativeReceipt?.adminAmount,
                adminFeeWallet: paymentLinkWalletAddress,
              });
            }

            if (nativeReceipt.merchantReceipt) {
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
          let feeDetails = await this.adminService.getPlatformFee();
          let txCost;
          let paymentLinkCharges;
          let paymentLinkWalletAddress;
          if (feeDetails instanceof NotFoundException) {
            throw Error;
          } else {
            paymentLinkCharges = feeDetails.data.merchantFee;
            paymentLinkWalletAddress = feeDetails.data.merchantFeeWallet;

            txCost = await getERC20TxFee(
              chainId,
              senderWalletAddress,
              receiverAddress,
              tokenContractAddress,
              fullAmount,
              tokenDecimal,
              paymentLinkCharges,
              paymentLinkWalletAddress
            );
          }

          if (wallet?.withdrawStatus === WithdrawPaymentStatus.PENDING) {
            // Transfer evm native tokens to the payment links
            const nativeTxReceipt = await evmNativeTokenTransferToPaymentLinks(
              chainId,
              txCost?.totalGas * txCost?.gasPrice,
              senderWalletAddress
            );
            if (nativeTxReceipt) {
              await this.updatePaymentLinkModel(wallet?._id, {
                withdrawStatus: WithdrawPaymentStatus.NATIVE_TRANSFER,
              });
            }
          }

          try {
            const erc20Receipt = await evmERC20TokenTransfer(
              chainId,
              privateKey,
              txCost,
              tokenContractAddress,
              fullAmount,
              receiverAddress,
              tokenDecimal,
              paymentLinkCharges,
              paymentLinkWalletAddress
            );

            if (erc20Receipt.receipt1) {
              // Update payment link model
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
              // Update payment link model
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

    const app = await this.appModel.findOne({
      "EVMWalletMnemonic.address": {
        $regex: new RegExp(`^${walletAddress}$`, "i"),
      },
    });

    if (paymentLink && parseFloat(txAmount) >= parseFloat(paymentLink.amount)) {
      console.log("this is a payment link tx ----------");

      result = {
        _id: paymentLink?._id,
        id: paymentLink?.appId,
        transactionType: "PAYMENT_LINK",
        // transactionType: WalletType.PAYMENT_LINK,
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

  @Cron(CronExpression.EVERY_30_SECONDS)
  async tronPaymentLink() {
    try {
      this.logger.debug(
        "-------------- Cron Job -> Payment Link Status Update In Every 10 Seconds ----------------"
      );

      const paymentLinks = await this.paymentLinkModel.find({
        status: PaymentStatus.PENDING,
        chainId: { $in: ["TRON"] },
      });

      if (!paymentLinks || paymentLinks?.length === 0) {
        throw new NotFoundException(
          "Payment link not found or not pending from buyer side"
        );
      }

      const trc20FilteredPaymentLinks = paymentLinks.filter(
        (value) => value.code !== "TRX"
      );
      const tronFilteredPaymentLinks = paymentLinks.filter(
        (value) => value.code === "TRX"
      );

      let updatedPaymentLinks = [];
      for (const link of tronFilteredPaymentLinks) {
        let status = {
          recivedAmount: undefined,
          status: undefined, // explicitly declare status as optional
          hash: undefined, // explicitly declare txId as optional
          fromAddress: undefined, // explicitly declare fromAddress as optional
          // tokenDecimals: 6,
        };

        if (link?.tokenAddress === NATIVE) {
          const tronValueInDecimal = Number(link?.amount) * tronDecimal;
          const tronBalance = await getTronBalance(link?.toAddress);

          if (tronBalance >= Number(link.amount)) {
            const transactions = await getTronTransactions(link?.toAddress);

            // Filter transactions that:
            // 1. Have enough amount
            // 2. Are newer than the payment link creation time
            const paymentLinkCreationTime = new Date(link['createdAt']).getTime();

            const matchingTransaction = transactions?.data?.data
              .filter(
                (tx) => {
                  const isAmountMatch = tx?.raw_data?.contract[0]?.parameter?.value?.amount >= tronValueInDecimal;
                  const isTimeMatch = tx?.block_timestamp > paymentLinkCreationTime;
                  return isAmountMatch && isTimeMatch;
                }
              )
              .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];

            if (matchingTransaction) {
              const toAddress =
                await matchingTransaction?.raw_data?.contract[0]?.parameter
                  ?.value?.to_address;
              const toAddressInHex = await hexToTronAddress(
                toAddress?.slice(2, 42)
              );

              if (toAddressInHex === link?.toAddress) {
                const fromAddress =
                  await matchingTransaction?.raw_data.contract[0]?.parameter
                    ?.value?.owner_address;
                status.hash = await matchingTransaction?.txID;
                status.fromAddress = await hexToTronAddress(
                  fromAddress.slice(2, 42)
                );
                status.recivedAmount =
                  (await matchingTransaction?.raw_data.contract[0]?.parameter
                    ?.value?.amount) / tronDecimal;
                status.status = PaymentStatus.PARTIALLY_SUCCESS;

                const updatedLink = await this.paymentLinkModel.findOneAndUpdate(
                  { _id: link?._id },
                  { $set: status },
                  { new: true }
                );

                if (updatedLink) {
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
          const tronValueInDecimal = Number(link?.amount) * tronDecimal;

          const decryptPrivateKey = await this.encryptionService.decryptData(
            link?.privateKey
          );

          const tronBalance = await getTRC20Balance(
            trc20FilteredPaymentLinks,
            decryptPrivateKey
          );

          for (const e of tronBalance) {
            const trc20balanceAmount = await e.balance;
            if (Number(trc20balanceAmount) >= Number(link?.amount)) {
              const transactions = await getTRC20Transactions(link?.toAddress);

              const paymentLinkCreationTime = new Date(link['createdAt']).getTime();

              const matchingTransaction = transactions?.data?.data
                .filter((tx) => {
                  const isAmountMatch = tx?.value >= tronValueInDecimal;
                  const isTimeMatch = tx?.block_timestamp > paymentLinkCreationTime;
                  return isAmountMatch && isTimeMatch;
                })
                .sort((a, b) => b?.block_timestamp - a?.block_timestamp)[0];

              if (matchingTransaction) {
                const toAddress = await matchingTransaction?.to;
                if (toAddress === link?.toAddress) {
                  const fromAddress = await matchingTransaction?.from;
                  status.hash = await matchingTransaction?.transaction_id;
                  status.fromAddress = await fromAddress;
                  status.recivedAmount =
                    (await matchingTransaction?.value) / tronDecimal;
                  status.status = PaymentStatus.PARTIALLY_SUCCESS;

                  const updatedLink = await this.paymentLinkModel.findOneAndUpdate(
                    { _id: link?._id },
                    { $set: status },
                    { new: true }
                  );

                  if (updatedLink) {
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
      }
    } catch (error) {
      console.error("An error occurred:", error.message);
      // throw new BadRequestException("Failed to process payment links");
    }
  }

  @Cron("0 */3 * * * *")
  async withdrawTronPaymentFromLinks() {
    try {
      this.logger.debug(
        "--------------------- Cron Job Started for every 3 minute (To withdraw tron amount from payment links) -----------------------"
      );

      const partialPaymentLinks = await this.paymentLinkModel.aggregate([
        {
          $match: {
            status: PaymentStatus.PARTIALLY_SUCCESS,
            chainId: { $in: ["TRON"] },
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
        throw new NotFoundException(
          "Partial Payment links not found or not paid"
        );
      }

      for (const link of partialPaymentLinks) {
        if (link?.recivedAmount >= link?.amount) {
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
          const totalAmount = await Number(link?.recivedAmount);
          const decimals = await Number(link?.tokenDecimals);

          let merchantAddress = "";

          const isFiat = link?.transactionType === "FIAT";

          // const merchantAddress = await link?.tronWallet;

          merchantAddress = isFiat
            ? ConfigService.keys.TRON_OWNER_ADDRESS
            : await link?.tronWallet;

          const tokenContractAddress = await link?.tokenAddress;
          const paymentLinkAddress = await link?.toAddress;
          const adminAddress = adminData[0]?.tronAdminWallet;
          const adminCharges = adminData[0]?.tronPlatformFee;
          const adminPvtKey = ConfigService.keys.TRON_ADMIN_PRIVATE_KEY;
          const merchantAmount = Number(totalAmount / (1 + adminCharges / 100));
          const adminAmount = Number(totalAmount - merchantAmount);

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
              }
            }
          } else {
            let transferNativeTransactionFee;
            let transferTronToMerchant;
            let transferTronToAdmin;
            const nativeTransactionAmount = 12;
            const halfNativeTransactionAmount = nativeTransactionAmount / 2;

            // Retry logic for fetching balance
            const getBalanceWithRetry = async (address, retries = 5) => {
              let balance = await getTronBalance(address);
              for (let i = 0; i < retries && balance === null; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
                balance = await getTronBalance(address);
              }
              return balance;
            };

            let paymentLinkNativeBalance =
              await getBalanceWithRetry(paymentLinkAddress);

            // transferring manually native fee of 12trx
            if (paymentLinkNativeBalance < nativeTransactionAmount) {
              console.log("step 3");
              transferNativeTransactionFee = await transferTron(
                adminPvtKey,
                NATIVE,
                paymentLinkAddress,
                nativeTransactionAmount,
                decimals
              );

              if (transferNativeTransactionFee.result) {
                paymentLinkNativeBalance =
                  await getBalanceWithRetry(paymentLinkAddress);
              }
            }

            //transferring TRC-20 P.L. balance to merchant
            if (
              paymentLinkNativeBalance >= halfNativeTransactionAmount &&
              status.withdrawStatus !== WithdrawPaymentStatus.NATIVE_TRANSFER
            ) {
              console.log("link", link);
              const merchantReceiver = isFiat
                ? ConfigService.keys.TRON_OWNER_ADDRESS
                : merchantAddress;
              console.log("merchantReceiver", isFiat);

              transferTronToMerchant = await transferTron(
                decryptedPrivateKey,
                tokenContractAddress,
                // merchantAddress,
                merchantReceiver,
                Number(merchantAmount.toFixed(6)),
                decimals
              );

              if (transferTronToMerchant.length === 64) {
                paymentLinkNativeBalance =
                  await getBalanceWithRetry(paymentLinkAddress);
                status.withdrawStatus = WithdrawPaymentStatus.NATIVE_TRANSFER;
              }
            }
            //transferring TRC-20 P.L. balance to admin
            if (
              paymentLinkNativeBalance >= halfNativeTransactionAmount &&
              status.withdrawStatus !== WithdrawPaymentStatus.ADMIN_CHARGES
            ) {
              transferTronToAdmin = await transferTron(
                decryptedPrivateKey,
                tokenContractAddress,
                adminAddress,
                Number(adminAmount.toFixed(6)),
                decimals
              );

              if (transferTronToAdmin.length === 64) {
                paymentLinkNativeBalance =
                  await getBalanceWithRetry(paymentLinkAddress);
                status.adminFee = adminAmount.toFixed(6);
                status.adminFeeWallet = adminAddress;
                status.withdrawStatus = WithdrawPaymentStatus.ADMIN_CHARGES;
              }
            }

            //updating success status of payment links
            if (
              transferTronToMerchant.length === 64 &&
              transferTronToAdmin.length === 64
            ) {
              status.amountAfterTax = merchantAmount.toFixed(6);
              status.withdrawStatus = WithdrawPaymentStatus.SUCCESS;
              status.status = PaymentStatus.SUCCESS;
              paymentLinkNativeBalance =
                await getBalanceWithRetry(paymentLinkAddress);
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
        .select("_id paymentLinkId walletAddress amount transactionType"); // Replace with the specific field names you want

      // get wallet addresses of the payment links
      let walletList = paymentLinks.map((item) => item.walletAddress);
      let walletTxList = [];

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
          transactionType: element.payment.transactionType,  // <-- IMPORTANT
        };

        console.log(element, "element2")

        if (element.transactions && element.transactions.length > 0) {
          element.transactions.forEach((transaction) => {
            tx.block = transaction.blockNumber;
            tx.gas = transaction.fee;
            tx.hash = transaction.hash;
            if (transaction.inputs && transaction.inputs.length > 0) {
              tx.senderAddress = transaction.inputs[0].coin.address; // Check for existence before accessing
            }
            transaction.outputs.forEach((output) => {
              if (output.address === tx.paymentLinkWalletAddress) {
                const outputAmount = output.value / 10 ** 8;

                if (Number(outputAmount) >= Number(tx.paymentLinkAmount)) {
                  // Compare outputAmount directly
                  tx.txAmount = outputAmount; // Update txAmount
                  tx.status = true;
                }
              }
            });
          });
        }
        // if status is true, then only push into the list
        if (tx.status) {
          finalOutput.push(tx);
        }

        // console.log("tx : ", tx);
      });

      // Update in monitor models
      const bulkOperations = finalOutput.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: {
              streamId: item.streamId || ConfigService.keys.WEB_STREAMER_ID,
            },
          },
        },
      }));
      // console.log("bulkOperations : ", bulkOperations.filter);
      await this.monitorModel.bulkWrite(bulkOperations);

      // Update in payment links
      for (const item of finalOutput) {
        console.log(item, "item2")
        await this.paymentLinkModel.updateOne(
          { _id: item.paymentLinkId },
          {
            $set: {
              status: PaymentStatus.PARTIALLY_SUCCESS,
              block: item.block,
              fromAddress: item.senderAddress, // Use senderAddress from finalOutput item
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

      this.logger.debug(
        `------------ Cron Job Started 1 MINUTE (To process btc payment) -------------- ${finalOutput.length}`
      );

      // console.log(
      //   "processBitcoinPaymentLinks ended --------------------------------"
      // );

      // return updatedLinks;
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

      let partialSuccessWalletId = [];

      // Process each payment link synchronously
      for (const wallet of selectedBTCPaymentLinks) {
        partialSuccessWalletId.push(wallet?._id);
        const senderWalletAddress = wallet?.toAddress;
        const fullAmount = wallet?.recivedAmount;
        // const receiverAddress = wallet?.appDetail?.BtcWalletMnemonic?.address;

        const isFiat = wallet?.transactionType?.toUpperCase?.() === "FIAT";
        const receiverAddress = isFiat
          ? ConfigService.keys.BTC_OWNER_ADDRESS
          : wallet?.appDetail?.BtcWalletMnemonic?.address;
        console.log({
          "isFiat": isFiat,
          "BTC_OWNER_ADDRESS": ConfigService.keys.BTC_OWNER_ADDRESS,
          "receiverAddress": receiverAddress
        });

        console.log("VISHAL just abhi maine change kiya hai address dekh len bhia ---------------> ", receiverAddress);


        const privateKey = this.encryptionService.decryptData(
          wallet?.privateKey
        );

        try {
          console.log("🚀 BTC Transfer Started");
          console.log("Sender Wallet: ", senderWalletAddress);
          console.log("Receiver Wallet: ", receiverAddress);
          console.log("Full Amount: ", fullAmount);
          console.log("PrivateKey (decrypted): ", privateKey);
          console.log("is Fiat", isFiat);
          console.log("BTC_OWNER_ADDRES", ConfigService.keys.BTC_OWNER_ADDRESS);


          const tx = await btcTransferFromPaymentLinks(
            privateKey,
            senderWalletAddress,
            receiverAddress,
            fullAmount,
            isFiat,
            ConfigService.keys.BTC_OWNER_ADDRESS
          );
          if (tx.txId) {
            // Update payment link model
            await this.updatePaymentLinkModel(wallet?._id, {
              withdrawStatus: WithdrawPaymentStatus.SUCCESS,
              status: PaymentStatus.SUCCESS,
            });

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
            "Error in evm native transafer from payment link 999: ",
            error.message
          );
        }
      }

      return partialSuccessWalletId;

      // Withdraw funds from the payment links
    } catch (error) {
      console.log(
        "An error occurred in withdrawPaymentFromLinksAndUpdateStatus : ",
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
        // Fetch data for all valid Tron wallets concurrently
        const tronWalletDataList = await Promise.all(
          getAllAppsTronWallets
            .filter((wallet) => {
              return wallet?.TronWalletMnemonic?.address;
            }) // Only wallets with Tron addresses
            .map(async (wallet) => {
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
                        symbol: "TRX",
                        txType: txTypeOfPayment,
                      };

                      // Save the new transaction
                      await this.merchantTxModel.create(newTxData);
                    }
                  }
                }

                return null; // Skip wallets with no successful transactions
              } catch (error) {
                console.error(
                  `Error fetching Tron Wallet Data for Merchant ${merchantId}:`,
                  error.message
                );
                return null;
              }
            })
        );

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
          if (ConfigService.keys.TATUM_NETWORK === "bitcoin") {
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
          "x-api-key": "t-670619093810b72fabd57238-8dc526a6df544ed98b60e4cf",
        };

        const response = await axios.post(url, payload, {
          headers: postHeaders,
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

  // Ended File Here ----
}
