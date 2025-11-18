import { Router } from "express";
import { schedculeController } from "./schedules.controller";
import { createScheduleSchema } from "./schedules.validation";
import validateRequest from "../../middlewares/validateRequest";
import { authValidation } from "../../middlewares/authValidation";
import { UserRole } from "@prisma/client";

const router = Router()

router.get("/", authValidation(UserRole.ADMIN, UserRole.DOCTOR), schedculeController.getSchedulesForDoctor)
router.post("/", authValidation(UserRole.ADMIN,), validateRequest(createScheduleSchema), schedculeController.insertIntoDB)
router.post("/:id", authValidation(UserRole.ADMIN,), validateRequest(createScheduleSchema), schedculeController.getSchedule)
router.delete("/:id", authValidation(UserRole.ADMIN), schedculeController.deleteScheduleFromDB)


export const schedculeRoute = router