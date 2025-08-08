export interface Order {
  id: string;
  type: 'buy' | 'sell';
  title: string;
  amount: string;
  crypto: string;
  time: string;
  status: 'completed' | 'pending' | 'processing';
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: string;
  fee: string;
  estimatedReceived: string;
}

export interface OrderDetailsParams {
  orderId?: string;
  isExistingOrder?: string; // String because route params are always strings
}