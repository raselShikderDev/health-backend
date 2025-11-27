import { Router } from "express";
import { doctorController } from "./doctor.controller";
import { authValidation } from "../../middlewares/authValidation";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { DoctorValidation } from "./doctor.validation";

const router = Router();

router.get(
  "/:id",
  doctorController.getDoctor
);
router.get("/", authValidation(UserRole.ADMIN), doctorController.getAllFromDB);
router.patch(
  "/:id",
  authValidation(UserRole.ADMIN),
  doctorController.updateDoctor
);
router.delete(
  "/:id",
  authValidation(UserRole.ADMIN),
  doctorController.deleteDoctor
);
router.patch(
  "/soft-delete/:id",
  authValidation(UserRole.ADMIN),
  validateRequest(DoctorValidation.update),
  doctorController.softdeleteDoctor
);
router.post(
  "/ai-suggestion",
  authValidation(UserRole.ADMIN),
  doctorController.getAIsuggestions
);

export const doctorRoute = router;
