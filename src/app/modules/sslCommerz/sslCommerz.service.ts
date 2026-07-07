/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";

import axios from "axios";
import { envVars } from "../../config/env";
import { ISSLCommerz, ISSLCommerzResponse } from "./sslCommerz.interface";
import AppError from "../../errorHelpers/AppError";

import qs from "qs";
import { Transaction } from "../transaction/transaction.model";
const sslPaymentInit = async (
  payload: ISSLCommerz,
): Promise<ISSLCommerzResponse> => {
  try {
    const data = {
      store_id: envVars.SSL.STORE_ID,
      store_passwd: envVars.SSL.STORE_PASS,
      total_amount: payload.amount,
      currency: "BDT",
      tran_id: payload.transactionId,
      success_url: `${envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
      fail_url: `${envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
      cancel_url: `${envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,
      ipn_url: envVars.SSL.SSL_IPN_URL,
      shipping_method: "N/A",
      product_name: "Appointment",
      product_category: "Service",
      product_profile: "general",
      cus_name: payload.name,
      cus_email: payload.email,
      cus_add1: "N/A",
      cus_add2: "N/A",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: payload.phone,
      cus_fax: "01711111111",
      ship_name: "N/A",
      ship_add1: "N/A",
      ship_add2: "N/A",
      ship_city: "N/A",
      ship_state: "N/A",
      ship_postcode: 1000,
      ship_country: "N/A",
    };

  const response = await axios.post<ISSLCommerzResponse>(
  envVars.SSL.SSL_PAYMENT_API,
  qs.stringify(data),
  {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  }
);

    
    return response.data;
  } catch (error: any) {
    console.log(error);
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const validatePayment = async (payload: any) => {
  try {
    const response = await axios({
      method: "GET",
      url: `${envVars.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVars.SSL.STORE_ID}&store_passwd=${envVars.SSL.STORE_PASS}`,
    });

  

    await Transaction.updateOne(
      { transactionId: payload.tran_id },
      { paymentGatewayData: response.data },
      { runValidators: true },
    );
  } catch (error) {
    console.log(error);
    throw new AppError(401, "Transaction Validation Error");
  }
};
export const SSLService = {
  sslPaymentInit,
  validatePayment,
};
