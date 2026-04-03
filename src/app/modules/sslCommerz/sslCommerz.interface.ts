export interface ISSLCommerz {
  amount: number;
  transactionId: string;
  name: string;
  email: string;
  phone: string;
}
export interface ISSLCommerzResponse {
  status: string;
  GatewayPageURL: string;
  sessionkey?: string;
  failedreason?: string;
} 