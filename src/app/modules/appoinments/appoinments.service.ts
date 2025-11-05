import { prisma } from "../../shared/pirsmaConfig";
import { IJWTPayload } from "../../types/common";
import { v4 as uuidv4 } from "uuid";
import { stripe } from "../../helpers/stripeConfigratation";
import { IOptions, pagginationHelper } from "../../helpers/pagginationHelper";
import {
  AppointmentStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import apiError from "../../errors/apiError";
import httpsStatus from "http-status";

const createAppointment = async (
  user: IJWTPayload,
  payload: { doctorId: string; scheduleId: string }
) => {
  const existingPatient = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });
  const existingDoctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });
  const isBooked = await prisma.doctorSchedules.findFirstOrThrow({
    where: {
      doctorId: payload.doctorId,
      scheduleId: payload.scheduleId,
      isBooked: false,
    },
  });

  const videoCallingId = uuidv4();

  return await prisma.$transaction(async (trans) => {
    const appointmentData = await trans.appointment.create({
      data: {
        patientId: existingPatient.id,
        doctorId: payload.doctorId,
        scheduleId: payload.scheduleId,
        videoCallingId: videoCallingId,
      },
    });

    await trans.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = uuidv4();

    const paymentData = await trans.payment.create({
      data: {
        appoinmentId: appointmentData.id,
        transactionId: transactionId,
        amount: existingDoctor.appointmentFee,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Appointment with ${existingDoctor.name}`,
            },
            unit_amount: existingDoctor.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointmentData.id,
        paymentId: paymentData.id,
      },
      success_url: `https://www.programming-hero.com/`,
      cancel_url: `https://google.com/`,
    });
    console.log(session);

    //  http://localhost:5000/api/v1/appointments
    //     {
    //     "doctorId":"be7e556d-cf09-4ec0-b31a-7763660267d2",
    //     "scheduleId":"911255bf-7165-4c4d-9845-b67708455fce"
    // }
    return {
      paymenTUrl: session.url,
    };
  });
};

const getAllAppointment = async (
  user: IJWTPayload,
  filters: any,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    pagginationHelper.calculatePaggination(options);
  const { ...filterData } = filters;

  const andConditions: Prisma.AppointmentWhereInput[] = [];

  if (Object.keys(filterData).length > 0) {
    const filterCoditions = Object.keys(filterData).map((key) => ({
      [key]: (filterData as any)[key],
    }));
    andConditions.push(...filterCoditions);
  }

  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = prisma.appointment.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include:
      user.role === UserRole.DOCTOR
        ? { patient: true, schedule: true }
        : { doctor: true, schedule: true },
  });
  const total = await prisma.appointment.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      limit,
      page,
    },
    data: result,
  };
};

const getAllDoctorAppointment = async (
  user: IJWTPayload,
  filters: any,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    pagginationHelper.calculatePaggination(options);
  const { ...filterData } = filters;

  if (user.role !== UserRole.ADMIN) {
    throw new apiError(httpsStatus.UNAUTHORIZED, "You are not authorized");
  }

  const isAdmin = await prisma.admin.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const andConditions: Prisma.AppointmentWhereInput[] = [];

  if (Object.keys(filterData).length > 0) {
    const filterCoditions = Object.keys(filterData).map((key) => ({
      [key]: (filterData as any)[key],
    }));
    andConditions.push(...filterCoditions);
  }

  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = prisma.appointment.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: { patient: true, schedule: true, doctor: true },
  });
  const total = await prisma.appointment.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      limit,
      page,
    },
    data: result,
  };
};

const deleteAppointment = async (id: string) => {
  const result = await prisma.appointment.delete({
    where: {
      id,
    },
  });
  return result;
};

const getMyAppointment = async (
  user: IJWTPayload,
  options: IOptions,
  filter: any
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    pagginationHelper.calculatePaggination(options);
  const { ...filterData } = filter;
  const andConditions: Prisma.AppointmentWhereInput[] = [];

  if (user.role === UserRole.PATIENT) {
    andConditions.push({
      patient: {
        email: user.email,
      },
    });
  } else if (user.role === UserRole.DOCTOR) {
    andConditions.push({
      doctor: {
        email: user.email,
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));
    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.appointment.findMany({
    skip,
    take: skip,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include:
      user.role === UserRole.DOCTOR ? { patient: true } : { doctor: true },
  });

  const total = await prisma.appointment.count({
    where: whereConditions,
  });
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const updateAppointmentStatus = async (
  user: IJWTPayload,
  status: AppointmentStatus,
  appointmentId: string
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
    },
  });

  if (UserRole.DOCTOR === user.role) {
    if (!(appointmentData.doctor.email === user.email)) {
      throw new apiError(httpsStatus.BAD_REQUEST, "This is not your account");
    }
  }

  const result = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status,
    },
  });
  return result;
};

const cancelUnpaidAppoinment = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const unPaidAppoinments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        lte: thirtyMinutesAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  const appoinmentsIds = unPaidAppoinments.map((appoinment) => appoinment.id);

  await prisma.$transaction(async (trans) => {
    await trans.payment.deleteMany({
      where: {
        appoinmentId: {
          in: appoinmentsIds,
        },
      },
    });

    await trans.appointment.deleteMany({
      where: {
        id: {
          in: appoinmentsIds,
        },
      },
    });

    for (const unPaidAppoinment of unPaidAppoinments) {
      await trans.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: unPaidAppoinment.doctorId,
            scheduleId: unPaidAppoinment.scheduleId,
          },
        },
        data: {
          isBooked: false,
        },
      });
    }
    return;
  });
};

export const appointmentService = {
  createAppointment,
  getAllAppointment,
  deleteAppointment,
  getMyAppointment,
  updateAppointmentStatus,
  getAllDoctorAppointment,
  cancelUnpaidAppoinment
};
