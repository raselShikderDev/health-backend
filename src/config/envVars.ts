import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const envVars = {
  node_env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt: process.env.BCRYPT_SALT,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL,
  RESET_PASS_EXPIRES: process.env.RESET_PASS_EXPIRES,
  RESET_PASS_SECRET: process.env.RESET_PASS_SECRET,
  email:{
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
  },
  cloudinary: {
    key: process.env.CLOUDINARY_KEY,
    secret: process.env.CLOUDINARY_SECRET,
    name: process.env.CLOUDINARY_NAME,
    url: process.env.CLOUDINARY_URL,
  },
  jwt:{
    access_secret:process.env.JWT_ACCESS_SECRET,
    access_expires:process.env.JWT_ACCESS_EXPIRES,
    refresh_secret:process.env.JWT_REFRESH_SECRET,
    refresh_expires:process.env.JWT_REFRESH_EXPIRES,
  },
  SSL: {
      SSL_VALIDATION_API: process.env.SSL_VALIDATION_API,
      SSL_PAYMENT_API: process.env.SSL_PAYMENT_API,
      SSL_SECRET_KEY: process.env.SSL_SECRET_KEY,
      SSL_STORE_ID: process.env.SSL_STORE_ID,
      SSL_SUCCESS_BACKEND_URL: process.env.SSL_SUCCESS_BACKEND_URL,
      SSL_FAIL_BACKEND_URL: process.env.SSL_FAIL_BACKEND_URL,
      SSL_CANCEL_BACKEND_URL: process.env.SSL_CANCEL_BACKEND_URL,
      SSL_SUCCESS_FRONTEND_URL: process.env.SSL_SUCCESS_FRONTEND_URL,
      SSL_FAIL_FRONTEND_URL: process.env.SSL_FAIL_FRONTEND_URL,
      SSL_CANCEL_FRONTEND_URL: process.env.SSL_CANCEL_FRONTEND_URL,
      SSL_IPN_URL:process.env.SSL_IPN_URL,
    },
};
export default envVars;
