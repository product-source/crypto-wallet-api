export declare function subscribeTronAddressWebhook(walletAddress: string): Promise<string | null>;
export declare function unsubscribeTronAddressWebhook(subscriptionId: string): Promise<boolean>;
export declare function getTronAccountViaTatum(address: string): Promise<any>;
export declare function getTronTrc20TransactionsViaTatum(address: string): Promise<any>;
export declare function getTronTransactionsViaTatum(address: string): Promise<any>;
export declare function getCachedTronBalance(address: string): Promise<number>;
