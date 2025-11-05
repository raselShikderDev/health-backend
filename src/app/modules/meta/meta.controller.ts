import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status"
import { metaServices } from "./meta.service";




const fetchDashboardMetaData = catchAsync(
    async (req: Request & { user?: any }, res: Response) => {
        const user = req.user;

        const result = await metaServices.fetchDashboardMetaData(user);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Meta data successfully retrived",
            data: result,
        });
    }
);



export const metaController = {

  fetchDashboardMetaData,
};
