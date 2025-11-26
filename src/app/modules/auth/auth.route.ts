import { Router } from "express";
import { authcontroller } from "./auth.controller";
import { UserRole } from "@prisma/client";
import { authValidation } from "../../middlewares/authValidation";
import { authLimiter } from "../../middlewares/rateLimiter";

const router = Router();

router.post("/login", authLimiter, authcontroller.login);

router.get("/me", authcontroller.getMe);

router.post("/refresh-token", authcontroller.refreshToken);

router.post(
  "/change-password",
  authValidation(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
  authcontroller.changePassword
);

router.post("/forgot-password", authcontroller.forgotPassword);

router.post(
  "/reset-password",
  (req, res, next) => {
    console.log({ "[in auth route] req.body": req.body });
    next();
  },
  authcontroller.resetPassword
);

export const authRoute = router;
