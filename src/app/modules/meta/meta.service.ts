import { PaymentStatus, UserRole } from "@prisma/client";
import { IJWTPayload } from "../../types/common";
import apiError from "../../errors/apiError";
import httpStatus from "http-status";
import { prisma } from "../../shared/pirsmaConfig";

const fetchDashboardMetaData = async (user: IJWTPayload) => {
  let metadata;

  switch (user.role) {
    case UserRole.ADMIN:
      metadata = await getAdminMetaData();
      break;
    case UserRole.PATIENT:
      metadata = await getPatientMetaData(user);
      break;
    case UserRole.DOCTOR:
      metadata = await getDoctorMetaData(user);
      break;
    default:
      throw new apiError(httpStatus.BAD_REQUEST, "Invalid user role");
  }
  return metadata;
};

const getDoctorMetaData = async (user: IJWTPayload) => {
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const appoinmentCount = await prisma.appointment.count({
    where: {
      doctorId: doctorData.id,
    },
  });

  const patientCount = await prisma.appointment.groupBy({
    by: ["patientId"],
    _count: {
      id: true,
    },
  });

  const reviwCount = await prisma.review.count({
    where: {
      doctorId: doctorData.id,
    },
  });

  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      appointment: {
        doctorId: doctorData.id,
      },
    },
  });

  const apponmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
    where: {
      doctorId: doctorData.id,
    },
  });

  const formatedApponmentStatusDistribution = apponmentStatusDistribution.map(
    ({ status, _count }) => ({
      status,
      count: _count.id,
    })
  );

  return {
    appoinmentCount,
    patientCount,
    reviwCount,
    totalRevenue,
    formatedApponmentStatusDistribution,
  };
};

const getPatientMetaData = async (user: IJWTPayload) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const appoinmentCount = await prisma.appointment.count({
    where: {
      patientId: patientData.id,
    },
  });

  const toalPrescription = await prisma.prescriptin.count({
    where: {
      patientId: patientData.id,
    },
  });

  const reviewCount = await prisma.review.count({
    where: {
      patientId: patientData.id,
    },
  });

  const appoinmentStatusDistribution = await prisma.appointment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
    where: {
      patientId: patientData.id,
    },
  });

  const formatedApponmentStatusDistribution = appoinmentStatusDistribution.map(
    ({ status, _count }) => ({
      status,
      count: _count.id,
    })
  );

  return {
    appoinmentCount,
    toalPrescription,
    reviewCount,
    formatedApponmentStatusDistribution,
  };
};

const getAdminMetaData = async () => {
  const adminCount = await prisma.admin.count();
  const patientCount = await prisma.patient.count();
  const doctorCount = await prisma.doctor.count();
  const appoinmentCount = await prisma.appointment.count();
  const paymentCount = await prisma.payment.count();

  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: PaymentStatus.PAID,
    },
  });

  const barChartData = await getBarChartData();
  const pieChartData = await getPieChartData();

  return {
    adminCount,
    patientCount,
    doctorCount,
    appoinmentCount,
    paymentCount,
    totalRevenue,
    pieChartData,
    barChartData,
  };
};

const getBarChartData = async () => {
  const appoinmentCountPerMont = await prisma.$queryRaw`
    SELECT DATE_TRUNC("month", "createdAt") AS month
    CAST(count(*) AS INTEGER) as count
    FROM "appointments"
    GROUP BY month
    ORDER BY month ASC
  `;
  return appoinmentCountPerMont;
};

const getPieChartData = async () => {
  const appoinmentDistributionData = await prisma.appointment.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  const formatedData = appoinmentDistributionData.map(({ status, _count }) => ({
    status,
    count: _count.id,
  }));
  return formatedData;
};

export const metaServices = {
  fetchDashboardMetaData,
};
