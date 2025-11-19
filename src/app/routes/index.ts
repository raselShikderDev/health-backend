import express from "express";
import { userRouter } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.route";
import { schedculeRoute } from "../modules/schedules/schedules.route";
import { doctorScheduleRoute } from "../modules/doctorSchedule/doctorSchedule.route";
import { SpecialtiesRoutes } from "../modules/specialties/specialties.routes";
import { doctorRoute } from "../modules/doctor/doctor.route";
import { patientRoute } from "../modules/patient/patient.route";
import { adminRoute } from "../modules/admin/admin.route";
import { appointmentRoutes } from "../modules/appoinments/appoinments.routes";
import { prescriptionsRoute } from "../modules/prescriptions/prescriptions.route";
import { reviewRoutes } from "../modules/reviews/review.routes";
import { paymentRoute } from "../modules/payment/payment.route";
import { metaRoute } from "../modules/meta/meta.route";
import { apiLimiter } from "../middlewares/rateLimiter";

const router = express.Router();


router.use(apiLimiter);


const moduleRoutes = [
  {
    path: "/users",
    route: userRouter,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/schedules",
    route: schedculeRoute,
  },
  {
    path: "/doctor-schedules",
    route: doctorScheduleRoute,
  },
  {
    path: "/specialties",
    route: SpecialtiesRoutes,
  },
  {
    path: "/doctors",
    route: doctorRoute,
  },
  {
    path: "/patients",
    route: patientRoute,
  },
  {
    path: "/admins",
    route: adminRoute,
  },
  {
    path: "/appointments",
    route: appointmentRoutes,
  },
  {
    path: "/payments",
    route: paymentRoute,
  },
  {
    path: "/reviews",
    route: reviewRoutes,
  },
  {
    path: "/reviews",
    route: prescriptionsRoute,
  },
  {
    path: "/meta",
    route: metaRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
