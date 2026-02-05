import { WalletType } from "../schema/wallet-monitor.enum";
export declare class AddWalletMonitorDto {
    appId: any;
    walletAddress: string;
    expiryTime: number;
    walletType: WalletType;
    isExpiry: boolean;
}
