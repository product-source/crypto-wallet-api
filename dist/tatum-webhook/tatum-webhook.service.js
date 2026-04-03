"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TatumWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TatumWebhookService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const payment_link_schema_1 = require("../payment-link/schema/payment-link.schema");
const apps_schema_1 = require("../apps/schema/apps.schema");
const payment_enum_1 = require("../payment-link/schema/payment.enum");
const webhook_service_1 = require("../webhook/webhook.service");
const webhook_log_schema_1 = require("../webhook/schema/webhook-log.schema");
const constants_1 = require("../constants");
const tron_helper_1 = require("../helpers/tron.helper");
const encryption_service_1 = require("../utils/encryption.service");
const crypto = __importStar(require("crypto"));
const config_service_1 = require("../config/config.service");
let TatumWebhookService = TatumWebhookService_1 = class TatumWebhookService {
    constructor(paymentLinkModel, appsModel, webhookService, encryptionService) {
        this.paymentLinkModel = paymentLinkModel;
        this.appsModel = appsModel;
        this.webhookService = webhookService;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(TatumWebhookService_1.name);
    }
    verifyHmacSignature(body, signature) {
        try {
            const secret = config_service_1.ConfigService.keys.TATUM_WEBHOOK_HMAC_SECRET;
            if (!secret || !signature) {
                return true;
            }
            const expectedSignature = crypto
                .createHmac("sha512", secret)
                .update(JSON.stringify(body))
                .digest("hex");
            return signature === expectedSignature;
        }
        catch (error) {
            this.logger.error("HMAC verification error:", error.message);
            return false;
        }
    }
    async handleTronWebhook(body) {
        try {
            const { address, txId, amount, counterAddress, asset, type, blockNumber, } = body;
            this.logger.log(`[Tatum Webhook] Received event for address: ${address}, txId: ${txId}, amount: ${amount}, asset: ${asset}`);
            if (!address || !txId) {
                this.logger.warn("[Tatum Webhook] Missing address or txId. Ignoring.");
                return { status: "ignored" };
            }
            const paymentLink = await this.paymentLinkModel.findOne({
                toAddress: address,
                status: payment_enum_1.PaymentStatus.PENDING,
                chainId: constants_1.TRON_CHAIN_ID,
            });
            if (!paymentLink) {
                this.logger.log(`[Tatum Webhook] No PENDING payment link found for address: ${address}. May be already processed or not a payment wallet.`);
                return { status: "no_matching_link" };
            }
            let actualBalance = 0;
            if (paymentLink.tokenAddress === constants_1.NATIVE) {
                actualBalance = await (0, tron_helper_1.getTronBalance)(address);
            }
            else {
                try {
                    const decryptedKey = this.encryptionService.decryptData(paymentLink.privateKey);
                    const tokenInfo = {
                        address: paymentLink.tokenAddress,
                        _doc: { address: paymentLink.tokenAddress },
                    };
                    const balances = await (0, tron_helper_1.getTRC20Balance)([tokenInfo], decryptedKey);
                    if (balances && balances.length > 0) {
                        actualBalance = parseFloat(balances[0].balance || "0");
                    }
                }
                catch (balErr) {
                    this.logger.error(`[Tatum Webhook] Error fetching TRC20 balance: ${balErr.message}`);
                    actualBalance = parseFloat(amount || "0");
                }
            }
            if (actualBalance <= 0) {
                this.logger.log(`[Tatum Webhook] Balance is 0 for ${address}. Webhook may have arrived before on-chain confirmation. Will be caught by fallback cron.`);
                return { status: "balance_zero_will_retry" };
            }
            const app = await this.appsModel.findById(paymentLink.appId);
            const toleranceMargin = app?.toleranceMargin || 0;
            const requiredAmount = parseFloat(paymentLink.amount);
            const minRequired = requiredAmount * (1 - toleranceMargin / 100);
            const updateData = {
                recivedAmount: actualBalance,
                hash: txId,
                fromAddress: counterAddress || "",
            };
            if (actualBalance >= minRequired) {
                updateData.status = payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS;
                this.logger.log(`[Tatum Webhook] ✅ Payment CONFIRMED for ${address}. Received: ${actualBalance}, Required: ${minRequired}`);
            }
            else {
                updateData.status = payment_enum_1.PaymentStatus.PENDING;
                this.logger.log(`[Tatum Webhook] ⏳ Partial payment for ${address}. Received: ${actualBalance}, Required: ${minRequired}`);
            }
            const updatedLink = await this.paymentLinkModel.findOneAndUpdate({ _id: paymentLink._id }, { $set: updateData }, { new: true });
            if (updatedLink &&
                updateData.status === payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS) {
                await this.webhookService.sendWebhook(updatedLink.appId.toString(), updatedLink._id.toString(), webhook_log_schema_1.WebhookEvent.PAYMENT_CONFIRMED, {
                    ...updatedLink.toObject(),
                    status: payment_enum_1.PaymentStatus.PARTIALLY_SUCCESS,
                    hash: txId,
                    fromAddress: counterAddress,
                    recivedAmount: actualBalance,
                });
            }
            return { status: "ok" };
        }
        catch (error) {
            this.logger.error(`[Tatum Webhook] Error processing webhook: ${error.message}`, error.stack);
            return { status: "error" };
        }
    }
};
exports.TatumWebhookService = TatumWebhookService;
exports.TatumWebhookService = TatumWebhookService = TatumWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_link_schema_1.PaymentLink.name)),
    __param(1, (0, mongoose_1.InjectModel)(apps_schema_1.Apps.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        webhook_service_1.WebhookService,
        encryption_service_1.EncryptionService])
], TatumWebhookService);
//# sourceMappingURL=tatum-webhook.service.js.map