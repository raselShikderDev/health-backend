import { NextFunction, Request, Response } from "express";
import envVars from "../../config/envVars";
import { jwtHelper } from "../helpers/jwtHelper";
import apiError from "../errors/apiError";
import httpStatus from "http-status"

export const authValidation = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.cookies.accessToken // || req.headers.authorization;
      console.log("token", token);

      if (!token) {
        throw new apiError(httpStatus.UNAUTHORIZED, " You are not authorized");
      }
      const verifiedToken = jwtHelper.verifyToken(
        token,
        envVars.jwt.access_secret as string
      );
      console.log("verifiedToken", verifiedToken);

      if (!verifiedToken) {
        throw new apiError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }
      if (roles.length && !roles.includes(verifiedToken.role)) {
        throw new apiError(httpStatus.UNAUTHORIZED, `${verifiedToken.role} not authorized`);
      }
      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
};
