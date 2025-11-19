import { Patient, Prisma } from "@prisma/client";
import { IOptions, pagginationHelper } from "../../helpers/pagginationHelper";
import { prisma } from "../../shared/pirsmaConfig";
import { IJWTPayload } from "../../types/common";
import { IPatientFilterRequest } from "./patient.interface";
import { IPaginationOptions } from "../../interfaces/pagination";
import { patientSearchableFields } from "./patient.constants";

const getAllFromDB = async (
  filters: IPatientFilterRequest,
  options: IPaginationOptions,
  includeHealthData: boolean = false // NEW PARAMETER
) => {
  const { limit, page, skip } = pagginationHelper.calculatePaggination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: patientSearchableFields.map((field:any) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        return {
          [key]: {
            equals: (filterData as any)[key],
          },
        };
      }),
    });
  }

  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.PatientWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Conditional include based on parameter
  const includeClause = includeHealthData
    ? {
        medicalReport: true,
        patientHealthData: true,
      }
    : {
        medicalReport: {
          select: {
            id: true,
            reportName: true,
            createdAt: true,
          },
        },
      };

  const result = await prisma.patient.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: "desc",
          },
    include: includeClause,
  });

  const total = await prisma.patient.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// Patient update
const updatePatient = async (user: IJWTPayload, payload: any) => {
  const { matientHealthData, medicalReport, ...patienData } = payload;
  const existingPatient = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
      isDeleted: false,
    },
  });

  return await prisma.$transaction(async (trans) => {
    await trans.patient.update({
      where: {
        id: existingPatient.id,
      },
      data: patienData,
    });

    if (matientHealthData) {
      await trans.patientHealthData.upsert({
        where: {
          patientId: existingPatient.id,
        },
        update: matientHealthData,
        create: {
          ...matientHealthData,
          patientId: existingPatient.id,
        },
      });
    }

    if (medicalReport) {
      await trans.medicalReport.create({
        data: {
          ...medicalReport,
          patientId: existingPatient.id,
        },
      });
    }

    return await trans.patient.findUnique({
      where:{
        id:existingPatient.id
      },
      include:{
        medicalReport:true,
        patientHealthData:true,
      }
    })

  });
};

// Get a Patient
const getPatient = async (id: string) => {
  return await prisma.patient.findUniqueOrThrow({
    where: {
      id,
    },
  });
};

// Get a Patient
const deletePatient = async (id: string) => {
  return await prisma.patient.delete({
    where: {
      id,
    },
  });
};

export const patientServices = {
  getAllFromDB,
  updatePatient,
  getPatient,
  deletePatient,
};
