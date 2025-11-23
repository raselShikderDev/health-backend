import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { authServices } from "./auth.service";
import httpStatus from "http-status";
import { IJWTPayload } from "../../types/common";
import envVars from "../../../config/envVars";

// Login
const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {


    const accessTokenExpiresIn = envVars.jwt.access_expires as string;
  const refreshTokenExpiresIn = envVars.jwt.refresh_expires as string;

  // convert accessTokenExpiresIn to milliseconds
  let accessTokenMaxAge = 0;
  const accessTokenUnit = accessTokenExpiresIn.slice(-1);
  const accessTokenValue = parseInt(accessTokenExpiresIn.slice(0, -1));
  if (accessTokenUnit === "y") {
    accessTokenMaxAge = accessTokenValue * 365 * 24 * 60 * 60 * 1000;
  }
  else if (accessTokenUnit === "M") {
    accessTokenMaxAge = accessTokenValue * 30 * 24 * 60 * 60 * 1000;
  }
  else if (accessTokenUnit === "w") {
    accessTokenMaxAge = accessTokenValue * 7 * 24 * 60 * 60 * 1000;
  }
  else if (accessTokenUnit === "d") {
    accessTokenMaxAge = accessTokenValue * 24 * 60 * 60 * 1000;
  } else if (accessTokenUnit === "h") {
    accessTokenMaxAge = accessTokenValue * 60 * 60 * 1000;
  } else if (accessTokenUnit === "m") {
    accessTokenMaxAge = accessTokenValue * 60 * 1000;
  } else if (accessTokenUnit === "s") {
    accessTokenMaxAge = accessTokenValue * 1000;
  } else {
    accessTokenMaxAge = 1000 * 60 * 60; // default 1 hour
  }

  // convert refreshTokenExpiresIn to milliseconds
  let refreshTokenMaxAge = 0;
  const refreshTokenUnit = refreshTokenExpiresIn.slice(-1);
  const refreshTokenValue = parseInt(refreshTokenExpiresIn.slice(0, -1));
  if (refreshTokenUnit === "y") {
    refreshTokenMaxAge = refreshTokenValue * 365 * 24 * 60 * 60 * 1000;
  }
  else if (refreshTokenUnit === "M") {
    refreshTokenMaxAge = refreshTokenValue * 30 * 24 * 60 * 60 * 1000;
  }
  else if (refreshTokenUnit === "w") {
    refreshTokenMaxAge = refreshTokenValue * 7 * 24 * 60 * 60 * 1000;
  }
  else if (refreshTokenUnit === "d") {
    refreshTokenMaxAge = refreshTokenValue * 24 * 60 * 60 * 1000;
  } else if (refreshTokenUnit === "h") {
    refreshTokenMaxAge = refreshTokenValue * 60 * 60 * 1000;
  } else if (refreshTokenUnit === "m") {
    refreshTokenMaxAge = refreshTokenValue * 60 * 1000;
  } else if (refreshTokenUnit === "s") {
    refreshTokenMaxAge = refreshTokenValue * 1000;
  } else {
    refreshTokenMaxAge = 1000 * 60 * 60 * 24 * 30; // default 30 days
  }

    const result = await authServices.login(req.body.email, req.body.password);
    const { accessToken, refreshToken, needPasswordChange } = result;
    console.log("result before sendResponse:", result);
    // Setting accessToken in cookies
    res.cookie("accessToken", accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60,
    });
    // Setting refreshToken in cookies
    res.cookie("refreshToken", refreshToken, {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User successfully logged in",
      data: {
        needPasswordChange,
      },
    });
  }
);

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

   const accessTokenExpiresIn = envVars.jwt.access_expires as string;
  const refreshTokenExpiresIn = envVars.jwt.refresh_expires as string;

  // convert accessTokenExpiresIn to milliseconds
  let accessTokenMaxAge = 0;
  const accessTokenUnit = accessTokenExpiresIn.slice(-1);
  const accessTokenValue = parseInt(accessTokenExpiresIn.slice(0, -1));
  if (accessTokenUnit === "y") {
    accessTokenMaxAge = accessTokenValue * 365 * 24 * 60 * 60 * 1000;
  }
  else if (accessTokenUnit === "M") {
    accessTokenMaxAge = accessTokenValue * 30 * 24 * 60 * 60 * 1000;
  }
  else if (accessTokenUnit === "w") {
    accessTokenMaxAge = accessTokenValue * 7 * 24 * 60 * 60 * 1000;
  }
  else if (accessTokenUnit === "d") {
    accessTokenMaxAge = accessTokenValue * 24 * 60 * 60 * 1000;
  } else if (accessTokenUnit === "h") {
    accessTokenMaxAge = accessTokenValue * 60 * 60 * 1000;
  } else if (accessTokenUnit === "m") {
    accessTokenMaxAge = accessTokenValue * 60 * 1000;
  } else if (accessTokenUnit === "s") {
    accessTokenMaxAge = accessTokenValue * 1000;
  } else {
    accessTokenMaxAge = 1000 * 60 * 60; // default 1 hour
  }

  // convert refreshTokenExpiresIn to milliseconds
  let refreshTokenMaxAge = 0;
  const refreshTokenUnit = refreshTokenExpiresIn.slice(-1);
  const refreshTokenValue = parseInt(refreshTokenExpiresIn.slice(0, -1));
  if (refreshTokenUnit === "y") {
    refreshTokenMaxAge = refreshTokenValue * 365 * 24 * 60 * 60 * 1000;
  }
  else if (refreshTokenUnit === "M") {
    refreshTokenMaxAge = refreshTokenValue * 30 * 24 * 60 * 60 * 1000;
  }
  else if (refreshTokenUnit === "w") {
    refreshTokenMaxAge = refreshTokenValue * 7 * 24 * 60 * 60 * 1000;
  }
  else if (refreshTokenUnit === "d") {
    refreshTokenMaxAge = refreshTokenValue * 24 * 60 * 60 * 1000;
  } else if (refreshTokenUnit === "h") {
    refreshTokenMaxAge = refreshTokenValue * 60 * 60 * 1000;
  } else if (refreshTokenUnit === "m") {
    refreshTokenMaxAge = refreshTokenValue * 60 * 1000;
  } else if (refreshTokenUnit === "s") {
    refreshTokenMaxAge = refreshTokenValue * 1000;
  } else {
    refreshTokenMaxAge = 1000 * 60 * 60 * 24 * 30; // default 30 days
  }

  const result = await authServices.refreshToken(refreshToken);
  res.cookie("accessToken", result.accessToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token genereated successfully!",
    data: {
      message: "Access token genereated successfully!",
    },
  });
});

const changePassword = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;

    const result = await authServices.changePassword(
      user as IJWTPayload,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password Changed successfully",
      data: result,
    });
  }
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization || "";

  await authServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userSession = req.cookies;
  const result = await authServices.getMe(userSession);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrive successfully!",
    data: result,
  });
});

export const authcontroller = {
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
