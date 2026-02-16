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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const webhook_log_schema_1 = require("./schema/webhook-log.schema");
const apps_schema_1 = require("../apps/schema/apps.schema");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const schedule_1 = require("@nestjs/schedule");
const encryption_service_1 = require("../utils/encryption.service");
let WebhookService = WebhookService_1 = class WebhookService {
    constructor(webhookLogModel, appsModel, encryptionService) {
        this.webhookLogModel = webhookLogModel;
        this.appsModel = appsModel;
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(WebhookService_1.name);
        this.MAX_RETRY_ATTEMPTS = 5;
        this.RETRY_DELAYS = [0, 60000, 300000, 900000, 3600000];
    }
    generateSignature(payload, secret) {
        const payloadString = JSON.stringify(payload);
        return crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
    }
    async sendWebhook(appId, paymentId, event, paymentData) {
        try {
            const app = await this.appsModel.findById(appId).select('+webhookSecret +SECRET_KEY');
            if (!app || !app.webhookUrl) {
                this.logger.debug(`No webhook URL configured for app ${appId}`);
                return;
            }
            const isWithdrawalEvent = event.startsWith('withdrawal.');
            let payload;
            if (isWithdrawalEvent) {
                payload = {
                    event,
                    ...paymentData,
                    timestamp: Date.now(),
                };
            }
            else {
                payload = {
                    event,
                    paymentId,
                    orderId: paymentData.orderId || paymentData._id,
                    amount: paymentData.amount || paymentData.recivedAmount,
                    currency: paymentData.code || paymentData.currency,
                    status: paymentData.status,
                    timestamp: Date.now(),
                    data: {
                        hash: paymentData.hash,
                        fromAddress: paymentData.fromAddress,
                        toAddress: paymentData.toAddress,
                        blockNumber: paymentData.block?.number || paymentData.blockNumber,
                        chainId: paymentData.chainId,
                        recivedAmount: paymentData.recivedAmount,
                    },
                };
            }
            let webhookSecret;
            try {
                if (app.webhookSecret) {
                    webhookSecret = this.encryptionService.decryptData(app.webhookSecret);
                }
                else if (app.SECRET_KEY) {
                    webhookSecret = this.encryptionService.decryptData(app.SECRET_KEY);
                }
                else {
                    this.logger.error(`No secret key found for app ${appId}`);
                    return;
                }
            }
            catch (error) {
                this.logger.error(`Error decrypting webhook secret for app ${appId}: ${error.message}`);
                return;
            }
            const payloadString = JSON.stringify(payload);
            const signature = crypto.createHmac("sha256", webhookSecret).update(payloadString).digest("hex");
            const payloadWithSignature = {
                ...payload,
                signature: `sha256=${signature}`,
            };
            const webhookLog = await this.webhookLogModel.create({
                appId,
                paymentId,
                event,
                webhookUrl: app.webhookUrl,
                payload: payloadWithSignature,
                status: webhook_log_schema_1.WebhookStatus.PENDING,
                attempts: 0,
            });
            await this.executeWebhook(webhookLog._id.toString());
        }
        catch (error) {
            this.logger.error(`Error preparing webhook: ${error.message}`);
        }
    }
    async executeWebhook(webhookLogId) {
        try {
            const webhookLog = await this.webhookLogModel.findById(webhookLogId);
            if (!webhookLog || webhookLog.status === webhook_log_schema_1.WebhookStatus.SUCCESS) {
                return;
            }
            if (webhookLog.attempts >= this.MAX_RETRY_ATTEMPTS) {
                await this.webhookLogModel.updateOne({ _id: webhookLogId }, {
                    $set: {
                        status: webhook_log_schema_1.WebhookStatus.FAILED,
                        errorMessage: "Max retry attempts reached",
                    },
                });
                this.logger.warn(`Webhook ${webhookLogId} failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
                return;
            }
            const response = await axios_1.default.post(webhookLog.webhookUrl, webhookLog.payload, {
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Signature": webhookLog.payload.signature,
                    "X-Webhook-Event": webhookLog.event,
                },
                timeout: 10000,
            });
            if (response.status >= 200 && response.status < 300) {
                await this.webhookLogModel.updateOne({ _id: webhookLogId }, {
                    $set: {
                        status: webhook_log_schema_1.WebhookStatus.SUCCESS,
                        responseStatus: response.status,
                        responseBody: JSON.stringify(response.data).substring(0, 1000),
                    },
                    $inc: { attempts: 1 },
                });
                this.logger.log(`Webhook ${webhookLogId} delivered successfully`);
            }
            else {
                throw new Error(`Unexpected status code: ${response.status}`);
            }
        }
        catch (error) {
            const webhookLog = await this.webhookLogModel.findById(webhookLogId);
            const nextAttempt = webhookLog.attempts + 1;
            const nextRetryAt = new Date(Date.now() + this.RETRY_DELAYS[nextAttempt] || 3600000);
            await this.webhookLogModel.updateOne({ _id: webhookLogId }, {
                $set: {
                    status: webhook_log_schema_1.WebhookStatus.PENDING,
                    errorMessage: error.message,
                    responseStatus: error.response?.status,
                    nextRetryAt,
                },
                $inc: { attempts: 1 },
            });
            this.logger.warn(`Webhook ${webhookLogId} failed (attempt ${nextAttempt}/${this.MAX_RETRY_ATTEMPTS}): ${error.message}`);
        }
    }
    async retryFailedWebhooks() {
        try {
            const now = new Date();
            const failedWebhooks = await this.webhookLogModel.find({
                status: webhook_log_schema_1.WebhookStatus.PENDING,
                attempts: { $lt: this.MAX_RETRY_ATTEMPTS },
                nextRetryAt: { $lte: now },
            });
            this.logger.debug(`Found ${failedWebhooks.length} webhooks to retry`);
            for (const webhook of failedWebhooks) {
                await this.executeWebhook(webhook._id.toString());
            }
        }
        catch (error) {
            this.logger.error(`Error in retry cron job: ${error.message}`);
        }
    }
    async getWebhookLogs(appId, query) {
        const { pageNo = 1, limitVal = 20, status, event } = query;
        const page = parseInt(pageNo);
        const limit = parseInt(limitVal);
        const skip = (page - 1) * limit;
        const filter = { appId };
        if (status)
            filter.status = status;
        if (event)
            filter.event = event;
        const [logs, total] = await Promise.all([
            this.webhookLogModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.webhookLogModel.countDocuments(filter),
        ]);
        return {
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.WebhookService = WebhookService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhookService.prototype, "retryFailedWebhooks", null);
exports.WebhookService = WebhookService = WebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(webhook_log_schema_1.WebhookLog.name)),
    __param(1, (0, mongoose_1.InjectModel)(apps_schema_1.Apps.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        encryption_service_1.EncryptionService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map