import axios from "axios";
import httpStatus from "http-status";


import { IPaymentData } from "./ssl.interface";
import envVars from "../../../config/envVars";
import apiError from "../../errors/apiError";

const initPayment = async (paymentData: IPaymentData) => {
    try {
        const data = {
            store_id: envVars.SSL.SSL_STORE_ID,
            store_passwd:envVars.SSL.SSL_SECRET_KEY, 
            total_amount: paymentData.amount,
            currency: "BDT",
            tran_id: paymentData.transactionId,
            success_url: `${envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${paymentData.transactionId}&amount=${paymentData.amount}&status=success`,
            cancel_url: `${envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${paymentData.transactionId}&amount=${paymentData.amount}&status=cancel`,
            fail_url: `${envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${paymentData.transactionId}&amount=${paymentData.amount}&status=fail`,
            ipn_url: envVars.SSL.SSL_IPN_URL as string,
            shipping_method: "N/A",
            product_name: "Tour",
            product_category: "Service",
            product_profile: "general",
            cus_name: paymentData.name,
            cus_email:paymentData.email,
            cus_add1: paymentData.address,
            cus_add2: "N/A",
            cus_city: "Dhaka",
            cus_state: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: paymentData.phoneNumber,
            cus_fax: "01711111111",
            ship_name: "N/A",
            ship_add1: "N/A",
            ship_add2: "N/A",
            ship_city: "N/A",
            ship_state: "N/A",
            ship_postcode: 1000,
            ship_country: "N/A",
        };

        const response = await axios({
            method: 'post',
            url: envVars.SSL.SSL_VALIDATION_API,
            data: data,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        return response.data;
    }
    catch (err) {
        throw new apiError(httpStatus.BAD_REQUEST, "Payment erro occured!")
    }
};

const validatePayment = async (payload: any) => {
    try {
        const response = await axios({
            method: 'GET',
            url: `${envVars.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVars.SSL.SSL_STORE_ID}&store_passwd=${envVars.SSL.SSL_SECRET_KEY}&format=json`
        });

        return response.data;
    }
    catch (err) {
        throw new apiError(httpStatus.BAD_REQUEST, "Payment validation failed!")
    }
}


export const SSLService = {
    initPayment,
    validatePayment
}