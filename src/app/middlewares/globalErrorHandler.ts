import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import apiError from "../errors/apiError";
import { ZodError } from "zod";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(err);

  let statusCode:number = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let success = false;
  let message = err.message || "Something went wrong!";
  let error = err;


  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      message = "Duplicate error"
      error = err.meta
      statusCode = httpStatus.CONFLICT
    }
    if(err.code === "P1000"){
      message = "Athentication failed against database"
      error = err.meta
      statusCode = httpStatus.BAD_GATEWAY

    }
    if(err.code === "P2003"){
      message = "Foreign key constraints violations"
      error = err.meta
      statusCode = httpStatus.BAD_REQUEST
    }
    if(err.code === "P2025"){
      message = "No record was found for a query"
      error = err.meta
      statusCode = httpStatus.BAD_REQUEST
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Validation error"
    error = err.message
    statusCode = httpStatus.BAD_REQUEST
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    message = "Unknown prisma error occured"
    error = err.message
    statusCode = httpStatus.BAD_REQUEST
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    message = "Prisma client failed to initialized!"
    error = err.message
    statusCode = httpStatus.BAD_REQUEST
  }

  // if (err.message === "Password is incorrect") {
  //   throw new apiError(httpStatus.BAD_REQUEST, "Passowrd is incorrect")
  // }

if(err instanceof ZodError){
  
}


  res.status(statusCode).json({
    success,
    message,
    error,
  });
};

export default globalErrorHandler;
