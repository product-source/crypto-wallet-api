export type NetworkDocument = Network & Document;
export declare class Network {
    networkName: string;
    rpcUrl: string;
    chainId: number;
    currencySymbol: string;
    blockExplorerUrl: string;
    address: string;
}
export declare const NetworkSchema: import("mongoose").Schema<Network, import("mongoose").Model<Network, any, any, any, import("mongoose").Document<unknown, any, Network, any, {}> & Network & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Network, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Network>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Network> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
