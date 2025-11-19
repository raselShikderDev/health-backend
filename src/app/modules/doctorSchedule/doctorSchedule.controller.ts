import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { doctorScheduleServices } from "./doctorSchedule.service";
import { IJWTPayload } from "../../types/common";
import pick from "../../helpers/pick";
import { userFilteroptions } from "../user/user.constants";

// Creat doctor schedules
const createDoctorSchedules = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response, next: NextFunction) => {
    const result = await doctorScheduleServices.createDoctorSchedules(req.user as IJWTPayload, req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Doctor schedules successfully created",
      data: result
    });
  }
);
// Creat doctor schedules
const myDoctorAllSchedules = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response, next: NextFunction) => {
    const options = pick(req.query ?? {}, userFilteroptions);

    const result = await doctorScheduleServices.myDoctorAllSchedules(req.user as IJWTPayload, options);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Doctor schedules successfully retrived",
      data: result
    });
  }
);
// Creat doctor schedules
const getAllDoctorSchedules = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response, next: NextFunction) => {
    const options = pick(req.query ?? {}, userFilteroptions);

    const result = await doctorScheduleServices.getAllDoctorSchedules(req.user as IJWTPayload, options);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Doctor schedules successfully retrived",
      data: result
    });
  }
);


// delete doctor schedules
const deleteDoctorSchedules = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response, next: NextFunction) => {
    const result = await doctorScheduleServices.deleteDoctorSchedules(req.user as IJWTPayload, req.params.id);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Doctor schedules successfully deleted",
      data: result
    });
  }
);

export const doctorScheduleController = {
  createDoctorSchedules,
  myDoctorAllSchedules,
  getAllDoctorSchedules,
  deleteDoctorSchedules,
};
