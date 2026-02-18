import mongoose from "mongoose";
export type OrderDocument = Order & Document;
export declare class Order {
    merchantId: mongoose.Types.ObjectId;
    appsId: mongoose.Types.ObjectId;
    fiatAmount: string;
    cryptoAmount: string;
    email: string;
    productId: string;
    productName: string;
    remarks: string;
}
export declare const OrderSchema: mongoose.Schema<Order, mongoose.Model<Order, any, any, any, mongoose.Document<unknown, any, Order, any, {}> & Order & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Order, mongoose.Document<unknown, {}, mongoose.FlatRecord<Order>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<Order> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
