export declare class AddTokenDto {
    address: string;
    chainId: string;
    network: string;
    symbol: string;
    code: string;
    minWithdraw: number;
    decimal: number;
    minDeposit: number;
}
export declare class UpdateMinWithdrawDto {
    tokenId: string;
    network: string;
    chainId: string;
    symbol: string;
    address: string;
    code: string;
    decimal: number;
    minWithdraw: number;
    minDeposit: number;
}
