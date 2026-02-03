import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  Notification,
  NotificationDocument,
} from "./schema/notification.schema";
import { Model } from "mongoose";
import { MerchantsService } from "src/merchants/merchants.service";
import { SendNotificationDto } from "./dto/notification.dto";
import { Merchant, MerchantDocument } from "src/merchants/schema/merchant.schema";

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Merchant.name)
    private readonly merchantModel: Model<MerchantDocument>,
    private readonly merchantService: MerchantsService
  ) {}

  async getAuthNotifications(user: any, query) {
    try {
      const { pageNo, limitVal } = query;

      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      const userInfo = await this.merchantService.userProfile(user);
      console.log("userInfouserInfo", userInfo);

      const userCreatedAt = userInfo?.data?.createdAt;

      console.log("userCreatedAt", userCreatedAt);

      const notifications = await this.notificationModel
        // .find({
        //   $or: [{ merchantId: user?.userId }, { notificationType: "ADMIN" }],
        // })
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
        // merchantId: user?.userId,
        // $or: [{ merchantId: user?.userId }, { notificationType: "ADMIN" }],
        $and: [
          {
            $or: [
              { merchantId: user?.userId },
              { notificationType: "ADMIN" },
            ],
          },
          { createdAt: { $gte: userCreatedAt } }, // Filter by createdAt >= userCreatedAt
        ],
      });
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      // Update the status of the fetched notifications to "seen"
      const notificationIds = notifications.map((n) => n._id); // Extract IDs of fetched notifications
      await this.notificationModel.updateMany(
        { _id: { $in: notificationIds } }, // Match the fetched notifications
        { $set: { isRead: true } } // Update the isRead to "true"
      );

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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  ////////////////// admin side///////////////////////////////

  async notificationList(query) {
    try {
      const { pageNo, limitVal, search } = query;
      const page = pageNo ? parseInt(pageNo) : 1;
      const limit = limitVal ? parseInt(limitVal) : 10;

      let matchQuery: any = {};
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }

  async deleteNotification(id: string) {
    try {
      const notification = await this.notificationModel.findById(id);

      if (!notification) {
        throw new NotFoundException("Notification not found");
      }

      await this.notificationModel.findByIdAndDelete(id);

      return {
        success: true,
        message: "Notification deleted successfully",
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

  async sendNotification(dto: SendNotificationDto) {
    try {
      const { message, sendToAll, merchantIds } = dto;

      if (sendToAll) {
        // Send notification to all merchants
        const notification = await this.notificationModel.create({
          message,
          notificationType: "ADMIN",
        });

        return {
          success: true,
          message: "Notification sent to all merchants",
          data: notification,
        };
      } else {
        // Send notification to specific merchants
        if (!merchantIds || merchantIds.length === 0) {
          throw new BadRequestException("merchantIds are required when sendToAll is false");
        }

        const notifications = await this.notificationModel.insertMany(
          merchantIds.map((merchantId) => ({
            merchantId,
            message,
            notificationType: "MERCHANT",
          }))
        );

        return {
          success: true,
          message: `Notification sent to ${merchantIds.length} merchant(s)`,
          data: notifications,
        };
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      } else {
        console.log("An error occurred:", error.message);
        throw new BadRequestException(error);
      }
    }
  }
}
