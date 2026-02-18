"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const notification_schema_1 = require("./schema/notification.schema");
const mongoose_2 = require("mongoose");
const merchants_service_1 = require("../merchants/merchants.service");
const merchant_schema_1 = require("../merchants/schema/merchant.schema");
let NotificationService = class NotificationService {
    constructor(notificationModel, merchantModel, merchantService) {
        this.notificationModel = notificationModel;
        this.merchantModel = merchantModel;
        this.merchantService = merchantService;
    }
    async getAuthNotifications(user, query) {
        try {
            const { pageNo, limitVal } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            const userInfo = await this.merchantService.userProfile(user);
            console.log("userInfouserInfo", userInfo);
            const userCreatedAt = userInfo?.data?.createdAt;
            console.log("userCreatedAt", userCreatedAt);
            const notifications = await this.notificationModel
                .find({
                $and: [
                    {
                        $or: [
                            { merchantId: user?.userId },
                            { notificationType: "ADMIN" },
                        ],
                    },
                    { createdAt: { $gte: userCreatedAt } },
                ],
            })
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ _id: -1 });
            const count = await this.notificationModel.countDocuments({
                $and: [
                    {
                        $or: [
                            { merchantId: user?.userId },
                            { notificationType: "ADMIN" },
                        ],
                    },
                    { createdAt: { $gte: userCreatedAt } },
                ],
            });
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            const notificationIds = notifications.map((n) => n._id);
            await this.notificationModel.updateMany({ _id: { $in: notificationIds } }, { $set: { isRead: true } });
            return {
                succes: true,
                message: "Notification List",
                total: count,
                totalPages: totalPages,
                currentPage: page,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                notifications,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async notificationList(query) {
        try {
            const { pageNo, limitVal, search } = query;
            const page = pageNo ? parseInt(pageNo) : 1;
            const limit = limitVal ? parseInt(limitVal) : 10;
            let matchQuery = {};
            if (search) {
                matchQuery.message = { $regex: search, $options: "i" };
            }
            const count = await this.notificationModel.countDocuments(matchQuery);
            const notifications = await this.notificationModel.aggregate([
                { $match: matchQuery },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: limit },
                {
                    $lookup: {
                        from: "merchants",
                        localField: "merchantId",
                        foreignField: "_id",
                        as: "merchantDetail",
                    },
                },
                {
                    $unwind: {
                        path: "$merchantDetail",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        merchantId: 1,
                        message: 1,
                        isRead: 1,
                        notificationType: 1,
                        createdAt: 1,
                        "merchantDetail._id": 1,
                        "merchantDetail.name": 1,
                        "merchantDetail.email": 1,
                        "merchantDetail.contactNumber": 1,
                    },
                },
            ]);
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            return {
                success: true,
                message: "Notification List",
                total: count,
                totalPages: totalPages,
                currentPage: page,
                hasNextPage: hasNextPage,
                hasPrevPage: hasPrevPage,
                notifications,
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async deleteNotification(id) {
        try {
            const notification = await this.notificationModel.findById(id);
            if (!notification) {
                throw new common_1.NotFoundException("Notification not found");
            }
            await this.notificationModel.findByIdAndDelete(id);
            return {
                success: true,
                message: "Notification deleted successfully",
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
    async sendNotification(dto) {
        try {
            const { message, sendToAll, merchantIds } = dto;
            if (sendToAll) {
                const notification = await this.notificationModel.create({
                    message,
                    notificationType: "ADMIN",
                });
                return {
                    success: true,
                    message: "Notification sent to all merchants",
                    data: notification,
                };
            }
            else {
                if (!merchantIds || merchantIds.length === 0) {
                    throw new common_1.BadRequestException("merchantIds are required when sendToAll is false");
                }
                const notifications = await this.notificationModel.insertMany(merchantIds.map((merchantId) => ({
                    merchantId,
                    message,
                    notificationType: "MERCHANT",
                })));
                return {
                    success: true,
                    message: `Notification sent to ${merchantIds.length} merchant(s)`,
                    data: notifications,
                };
            }
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            else {
                console.log("An error occurred:", error.message);
                throw new common_1.BadRequestException(error);
            }
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __param(1, (0, mongoose_1.InjectModel)(merchant_schema_1.Merchant.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        merchants_service_1.MerchantsService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map