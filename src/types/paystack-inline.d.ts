declare module '@paystack/inline-js' {
  interface PaystackTransactionOptions {
    key: string;
    email?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    access_code?: string;
    metadata?: Record<string, unknown>;
    callback?: (response: { reference: string }) => void;
    onSuccess?: (response: { reference: string }) => void;
    onCancel?: () => void;
  }

  export default class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): void;
  }
}
