import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types/common";
import pick from "../../helpers/pick";
import { userFilterAbleFeild, userFilteroptions } from "../user/user.constants";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const result = await reviewService.createReview(req.user as IJWTPayload, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review created successfully!",
    data: result,
  });
}
);

const getMyReview = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const filters = pick(req.query ?? {}, ["status", "paymentStatus"])
  const options = pick(req.query ?? {}, ["status", "role", "email", "searchTerm"])
  const result = await reviewService.getMyReview(req.user as IJWTPayload, options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review data fetched successfully',
    data: result,
    // meta: result.meta,
  });
});

const getAllReview = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const filters = pick(req.query ?? {}, ["comment", "searchTerm"]);
    const options = pick(req.query ?? {}, userFilteroptions);
    const result = await reviewService.getAllReview(
      req.user as IJWTPayload,
      filters,
      options
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review data fetched successfully",
      data: result,
      // meta: result.meta,
    });
  });

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await reviewService.deleteReview(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

const updateReviewStatus = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {

  const result = await reviewService.getMyReview(req.user as IJWTPayload, req.body, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review successfully updated',
    data: result,
  });
});

export const reviewController = {
  createReview,
  getAllReview,
  deleteReview,
  getMyReview,
  updateReviewStatus,
};
