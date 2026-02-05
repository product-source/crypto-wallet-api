import mongoose from "mongoose";
export type ContactUsDocument = ContactUs & Document;
export declare class ContactUs {
    name: string;
    email: string;
    countryCode: string;
    contactNumber: string;
    description: string;
    image: string;
    adminReply: string;
    status: string;
    pricingId: mongoose.Types.ObjectId;
}
export declare const ContactUsSchema: mongoose.Schema<ContactUs, mongoose.Model<ContactUs, any, any, any, mongoose.Document<unknown, any, ContactUs, any, {}> & ContactUs & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, ContactUs, mongoose.Document<unknown, {}, mongoose.FlatRecord<ContactUs>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<ContactUs> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
