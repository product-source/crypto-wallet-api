import { ChainIdEnum, NetworkEnum } from "../schema/token.enum";
export declare class AddTokenDto {
    address: string;
    chainId: ChainIdEnum;
    network: NetworkEnum;
    symbol: string;
    code: string;
    minWithdraw: number;
    decimal: number;
    minDeposit: number;
}
export declare class UpdateMinWithdrawDto {
    tokenId: string;
    network: NetworkEnum;
    chainId: ChainIdEnum;
    symbol: string;
    address: string;
    code: string;
    decimal: number;
    minWithdraw: number;
    minDeposit: number;
}
