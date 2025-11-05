import { NextFunction, Request, Response, Router } from "express";
import { usercontroller } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import { fileUploader } from "../../helpers/fileUploadByMulter";
import { authValidation } from "../../middlewares/authValidation";
import { UserRole } from "@prisma/client";

const router = Router();



// Getting all users
router.get("/", authValidation(UserRole.ADMIN, UserRole.DOCTOR), usercontroller.getAllFromDB)

router.get("/my-profile", authValidation(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT), usercontroller.getMyProfile)

router.patch(
    "/update-my-profile",
    authValidation(UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT),
    fileUploader.upload.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
        req.body = JSON.parse(req.body.data)
        return usercontroller.updateMyProfie(req, res, next)
    }
);

// Create Patient
router.post(
  "/create-patient",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      req.body = userValidation.createPatientValidationSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return usercontroller.createPatient(req, res, next);
  }
);


// Create Doctor
router.post(
  "/create-doctor",
  fileUploader.upload.single("file"),
  // authValidation(UserRole.ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      req.body = userValidation.createDoctorValidationSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return usercontroller.createDoctor(req, res, next);
  }
);


// Create Admin
router.post(
  "/create-admin",
  fileUploader.upload.single("file"),
  authValidation(UserRole.ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      req.body = userValidation.createAdminValidationSchema.parse(
        JSON.parse(req.body.data)
      );
    }
    return usercontroller.createAdmin(req, res, next);
  }
);


// Update status
router.patch("/:id/status", authValidation(UserRole.ADMIN), usercontroller.updateUserStatus)


export const userRouter = router;
