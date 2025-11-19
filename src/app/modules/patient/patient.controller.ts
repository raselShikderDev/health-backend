import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helpers/pick";
import { userFilteroptions } from "../user/user.constants";
import { patientServices } from "./patient.service";
import { IJWTPayload } from "../../types/common";
import { patientFilterableFields } from "./patient.constants";

// get Patients
const getAllFromDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query ?? {}, patientFilterableFields);
    const options = pick(req.query ?? {}, userFilteroptions);
    const result = await patientServices.getAllFromDB(filters, options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Patient successfully retrived",
      data: result,
    });
  }
);

// update Patient
const updatePatient = catchAsync(
  async (
    req: Request & { user?: IJWTPayload },
    res: Response,
    next: NextFunction
  ) => {
    const result = await patientServices.updatePatient(
      req.user as IJWTPayload,
      req.body
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Patient successfully updated",
      data: result,
    });
  }
);

// get a Patient
const getPatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await patientServices.getPatient(req.params.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Patient successfully retrived",
      data: result,
    });
  }
);

// get a Patient
const deletePatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await patientServices.getPatient(req.params.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Patient successfully deleted",
      data: result,
    });
  }
);

export const patientController = {
  getAllFromDB,
  updatePatient,
  getPatient,
  deletePatient,
};
