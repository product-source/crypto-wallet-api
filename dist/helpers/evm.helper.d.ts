import { ethers } from "ethers";
import { Web3 } from "web3";
export declare function getOptimalGasParams(web3: any, chainId: any): Promise<{
    gasPrice: string;
    _gasPriceForCalc: bigint;
    maxFeePerGas?: undefined;
    maxPriorityFeePerGas?: undefined;
} | {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    _gasPriceForCalc: bigint;
    gasPrice?: undefined;
}>;
export declare const isValidEVMAddress: (address: any) => Promise<boolean>;
export declare const getWeb3: (chainId: any) => Promise<Web3<import("web3-eth").RegisteredSubscription>>;
export declare const getWeb3TokenContract: (chainId: any, tokenContractAddress: any) => {
    web3: Web3<import("web3-eth").RegisteredSubscription>;
    contract: import("web3").Contract<({
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        name?: undefined;
        outputs?: undefined;
        anonymous?: undefined;
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
        anonymous?: undefined;
    } | {
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
    })[]>;
};
export declare const generateEvmWallet: (mnemonic: any, index: number) => {
    address: string;
    privateKey: string;
    mnemonic: ethers.utils.Mnemonic;
    index: number;
};
export declare const getEvmWalletFromPrivateKey: (privateKey: any, name: string, walletType: string, id: string) => Promise<{
    name: string;
    id: string;
    walletType: string;
    data: {
        evm: any;
    };
}>;
export declare const generateMnemonic: () => string;
export declare function evmCryptoBalanceCheck(RPC_URL: any, tokenAddress: any, walletAddress: any): Promise<any>;
export declare function getNetwork(chainId: any): {
    network: string;
    symbol: string;
    rpc: string;
    explorerURL: string;
    tokenType: string;
} | {
    network: string;
    symbol: string;
    rpc: string;
    explorerURL: string;
    tokenType?: undefined;
};
export declare function calculateERC20SplitAmounts(web3: any, amount: any, decimal: any, adminPaymentLinksCharges: any, chainId: any, actualBalanceInWei?: string | null): {
    merchantRemainingAmountInWei: bigint;
    adminAmountInWei: bigint;
    AMOUNT_IN_WEI: any;
};
export declare function getERC20TxFee(chainId: any, senderAddress: any, receiverAddress: any, contractAddress: any, amount: any, decimal: any, adminPaymentLinksCharges: any, adminPaymentLinksChargesWallet: any, adminAlreadyCharged?: boolean): Promise<{
    adminGas: bigint;
    merchantGas: bigint;
    totalGas: bigint;
    gasPrice: bigint;
    gasParams: {
        gasPrice: string;
        _gasPriceForCalc: bigint;
        maxFeePerGas?: undefined;
        maxPriorityFeePerGas?: undefined;
    } | {
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
        _gasPriceForCalc: bigint;
        gasPrice?: undefined;
    };
} | {
    adminGas: any;
    merchantGas: any;
    totalGas: any;
    gasPrice: any;
    gasParams?: undefined;
}>;
export declare function evmNativeTokenTransferToPaymentLinks(chainId: any, nativeAmount: any, recipientAddress: any): Promise<any>;
export declare function evmERC20TokenTransfer(chainId: any, paymentLinkPrivateKey: any, txCost: any, tokenContractAddress: any, amount: any, merchantAddress: any, decimal: any, adminPaymentLinksCharges: any, adminPaymentLinksChargesWallet: any, adminAlreadyCharged?: boolean): Promise<{
    receipt1: any;
    receipt2: any;
}>;
export declare function evmNativeTokenTransferFromPaymentLinks(chainId: any, paymentLinkPrivateKey: any, fullAmount: any, merchantAddress: any, decimal: any, adminPaymentLinksCharges: any, adminPaymentLinksChargesWallet: any, currentWithdrawStatus: any): Promise<{
    adminReceipt: any;
    merchantReceipt: any;
    merchantAmount: string;
    adminAmount: string;
} | {
    adminReceipt: any;
    merchantReceipt: any;
    merchantAmount?: undefined;
    adminAmount?: undefined;
}>;
export declare function getERC20TransferTxFee(rpcURL: any, tokenContractAddress: any, tokenAmount: any, decimals: any, receiverAddress: any, senderAddress: any): Promise<{
    gasFeeInWei: any;
    gasFeeInEther: any;
}>;
export declare function deposit_bnb_for_gas_fee(chainId: any, privateKey: any, tokenContractAddress: any, receiverAddress: any, tokenAmount: any, paymentLinkAddress: any): Promise<import("web3").TransactionReceipt>;
export declare function withdrawEvmFund(chainId: any, privateKey: any, tokenContractAddress: any, Amount: any, receiverAddress: any): Promise<import("web3").TransactionReceipt | {
    error: any;
    status: boolean;
    data: any;
}>;
export declare function getEVMNativeBalance(walletAddress: string[]): Promise<{
    bsc: number;
    eth: number;
    matic: number;
    avax: number;
}>;
export declare function merchantEvmFundWithdraw(chainId: any, privateKey: any, tokenContractAddress: any, Amount: any, receiverAddress: any, decimal: any, swapTokenAddress: any): Promise<{
    error: any;
    status: boolean;
    data: import("web3").TransactionReceipt;
} | {
    error: any;
    status: boolean;
    data: any;
}>;
