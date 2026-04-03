import { ethers } from "ethers";
import { Web3 } from "web3";
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
export declare function getERC20TxFee(chainId: any, senderAddress: any, receiverAddress: any, contractAddress: any, amount: any, decimal: any, adminPaymentLinksCharges: any, adminPaymentLinksChargesWallet: any): Promise<{
    adminGas: number;
    merchantGas: number;
    totalGas: number;
    gasPrice: any;
}>;
export declare function evmNativeTokenTransferToPaymentLinks(chainId: any, nativeAmount: any, recipientAddress: any): Promise<any>;
export declare function evmERC20TokenTransfer(chainId: any, paymentLinkPrivateKey: any, txCost: any, tokenContractAddress: any, amount: any, merchantAddress: any, decimal: any, adminPaymentLinksCharges: any, adminPaymentLinksChargesWallet: any): Promise<{
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
