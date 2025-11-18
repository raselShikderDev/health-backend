import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { doctorServices } from "./doctor.service";
import pick from "../../helpers/pick";
import { userFilteroptions } from "../user/user.constants";
import { doctorFilterAbleField } from "./doctor.constants";

// get doctors
const getAllFromDB = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = pick(req.query ?? {}, doctorFilterAbleField)
    const options = pick(req.query ?? {}, userFilteroptions)
    const result = await doctorServices.getAllFromDB(filters, options);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor successfully retrived",
      data: result.data,
      meta: result.meta
    });
  }
);

// update doctor
const updateDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const result = await doctorServices.updateDoctor(req.params.id, req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor successfully updated",
      data: result,
    });
  }
);

// get a doctor
const getDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const result = await doctorServices.getDoctor(req.params.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor successfully retrived",
      data: result,
    });
  }
);

// delete a doctor
const deleteDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const result = await doctorServices.getDoctor(req.params.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor successfully deleted",
      data: result,
    });
  }
);

// softly delete a doctor
const softdeleteDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const result = await doctorServices.softdeleteDoctor(req.params.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Doctor successfully soft deleted",
      data: result,
    });
  }
);


// get a doctor
const getAIsuggestions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const result = await doctorServices.getAIsuggestions(req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Successfully received suggested doctor list",
      data: result,
    });
  }
);

export const doctorController = {
  getAllFromDB,
  updateDoctor,
  getDoctor,
  deleteDoctor,
  getAIsuggestions,
  softdeleteDoctor
};
