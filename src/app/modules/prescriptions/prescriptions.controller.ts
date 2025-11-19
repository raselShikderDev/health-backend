import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types/common";
import { prescriptionsService } from "./prescriptions.service";
import httpStatus from "http-status"
import pick from "../../helpers/pick";
import { userFilterAbleFeild, userFilteroptions } from "../user/user.constants";



const createPrescription = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {


    const result = await prescriptionsService.createPrescription(req.user as IJWTPayload, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Prescription successfully created',
        data: result,
    });
});


const myPrescription = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {

    const options = pick(req.query, userFilteroptions)
    const result = await prescriptionsService.myPrescription(req.user as IJWTPayload, options);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Prescription data successfully retrived',
        data: result.data,
        meta: result.meta
    });
});

export const prescriptionsController = {
    createPrescription,
    myPrescription
}