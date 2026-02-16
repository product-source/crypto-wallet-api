export declare class CommonController {
    getPrice(currency: string, symbol: string): Promise<{
        success: boolean;
        data: {};
    }>;
}
