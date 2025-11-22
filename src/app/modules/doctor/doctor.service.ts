import { Doctor, Prisma, UserStatus } from "@prisma/client";
import { IOptions, pagginationHelper } from "../../helpers/pagginationHelper";
import { prisma } from "../../shared/pirsmaConfig";
import apiError from "../../errors/apiError";
import httpstatus from "http-status";
import { openai } from "../../helpers/opeRouterConfig";
import { extractJsonFromMessage } from "../../helpers/extractAgentMessage";
import { IDoctorFilterRequest, IDoctorUpdate } from "./doctor.interface";
import {
  doctorFilterableFields,
  doctorSearchableFields,
} from "./doctor.constrains";
import { IPaginationOptions } from "../../interfaces/pagination";

const getAllFromDB = async (filters: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    pagginationHelper.calculatePaggination(options);
  const { searchItem, specalities, ...filterData } = filters;

  const andConditations: Prisma.DoctorWhereInput[] = [];
  // Checking and push searcterm intro conditions if any
  if (searchItem) {
    andConditations.push({
      OR: doctorFilterableFields.map((feild) => ({
        [feild]: {
          contains: searchItem,
          mode: "insensitive",
        },
      })),
    });
  }

  // checking and pushing specilaties if any
  if (specalities && specalities.length > 0) {
    andConditations.push({
      AND: {
        doctorSpecialties: {
          some: {
            specialities: {
              title: {
                contains: specalities,
                mode: "insensitive",
              },
            },
          },
        },
      },
    });
  }

  // Checking and pushing filter data if any
  if (Object.keys(filterData).length > 0) {
    const filterConditations = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));
    andConditations.push(...filterConditations);
  }

  const whereConditions: Prisma.DoctorWhereInput =
    andConditations.length > 0 ? { AND: andConditations } : {};
  const result = await prisma.doctor.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      reviews: true,
      doctorSpecialties: {
        include: {
          specialities:{
            select:{
              title:true
            }
          },
        },
      },
    },
  });
  const total = await prisma.doctor.count({
    where: whereConditions,
  });

  console.log({ result });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// Doctor update
const updateDoctor = async (id: string, payload: IDoctorUpdate) => {
  const { specialties, removeSpecialties, ...doctorData } = payload;

  const doctorInfo = await prisma.doctor.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
  });

  await prisma.$transaction(async (transactionClient) => {
    // Step 1: Update doctor basic data
    if (Object.keys(doctorData).length > 0) {
      await transactionClient.doctor.update({
        where: {
          id,
        },
        data: doctorData,
      });
    }

    // Step 2: Remove specialties if provided
    if (
      removeSpecialties &&
      Array.isArray(removeSpecialties) &&
      removeSpecialties.length > 0
    ) {
      // Validate that specialties to remove exist for this doctor
      const existingDoctorSpecialties =
        await transactionClient.doctorSpecialties.findMany({
          where: {
            doctorId: doctorInfo.id,
            specialitiesId: {
              in: removeSpecialties,
            },
          },
        });

      if (existingDoctorSpecialties.length !== removeSpecialties.length) {
        const foundIds = existingDoctorSpecialties.map(
          (ds) => ds.specialitiesId
        );
        const notFound = removeSpecialties.filter(
          (id) => !foundIds.includes(id)
        );
        throw new Error(
          `Cannot remove non-existent specialties: ${notFound.join(", ")}`
        );
      }

      // Delete the specialties
      await transactionClient.doctorSpecialties.deleteMany({
        where: {
          doctorId: doctorInfo.id,
          specialitiesId: {
            in: removeSpecialties,
          },
        },
      });
    }

    // Step 3: Add new specialties if provided
    if (specialties && Array.isArray(specialties) && specialties.length > 0) {
      // Verify all specialties exist in Specialties table
      const existingSpecialties = await transactionClient.specialties.findMany({
        where: {
          id: {
            in: specialties,
          },
        },
        select: {
          id: true,
        },
      });

      const existingSpecialtyIds = existingSpecialties.map((s) => s.id);
      const invalidSpecialties = specialties.filter(
        (id) => !existingSpecialtyIds.includes(id)
      );

      if (invalidSpecialties.length > 0) {
        throw new Error(
          `Invalid specialty IDs: ${invalidSpecialties.join(", ")}`
        );
      }

      // Check for duplicates - don't add specialties that already exist
      const currentDoctorSpecialties =
        await transactionClient.doctorSpecialties.findMany({
          where: {
            doctorId: doctorInfo.id,
            specialitiesId: {
              in: specialties,
            },
          },
          select: {
            specialitiesId: true,
          },
        });

      const currentSpecialtyIds = currentDoctorSpecialties.map(
        (ds) => ds.specialitiesId
      );
      const newSpecialties = specialties.filter(
        (id) => !currentSpecialtyIds.includes(id)
      );

      // Only create new specialties that don't already exist
      if (newSpecialties.length > 0) {
        const doctorSpecialtiesData = newSpecialties.map((specialtyId) => ({
          doctorId: doctorInfo.id,
          specialitiesId: specialtyId,
        }));

        await transactionClient.doctorSpecialties.createMany({
          data: doctorSpecialtiesData,
        });
      }
    }
  });

  // Step 4: Return updated doctor with specialties
  const result = await prisma.doctor.findUnique({
    where: {
      id: doctorInfo.id,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
    },
  });

  return result;
};

// Get a doctor
const getDoctor = async (id: string) => {
  return await prisma.doctor.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
      doctorSchedules: {
        include: {
          schedule: true,
        },
      },
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });
};

// Get a doctor
const deleteDoctor = async (id: string) => {
  return await prisma.doctor.delete({
    where: {
      id,
    },
  });
};

const getAIsuggestions = async (payload: { symptoms: string }) => {
  if (!(payload && payload.symptoms)) {
    throw new apiError(httpstatus.BAD_REQUEST, "Symptoms is required");
  }
  console.log(`[retriving all doctor..]`);

  const doctors = await prisma.doctor.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
    },
  });

  const prompt = `
You are a medical assistant AI. Based on the patient's symptoms, suggest the top 3 most suitable doctors.
Each doctor has specialties and years of experience.
Only suggest doctors who are relevant to the given symptoms.

Symptoms: ${payload.symptoms}

Here is the doctor list (in JSON):
${JSON.stringify(doctors, null, 2)}

Return your response in JSON format with full individual doctor data. 
`;
  console.log(`[retriving all suggested doctor by AI..]`);

  const completion = await openai.chat.completions.create({
    model: "z-ai/glm-4.5-air:free",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI medical assistant that provides doctor suggestions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  const suggestedDoctors = extractJsonFromMessage(
    completion.choices[0].message
  );
  console.log(suggestedDoctors);

  // {
  //   "symptoms": "Chest pain, shortness of breath, palpitations, fatigue, swelling in legs."
  // }
};

const softdeleteDoctor = async (id: string): Promise<Doctor> => {
  return await prisma.$transaction(async (transactionClient) => {
    const deleteDoctor = await transactionClient.doctor.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    await transactionClient.user.update({
      where: {
        email: deleteDoctor.email,
      },
      data: {
        status: UserStatus.DELETED,
      },
    });

    return deleteDoctor;
  });
};

const getAllPublic = async (
  filters: IDoctorFilterRequest,
  options: IPaginationOptions
) => {
  const { limit, page, skip } = pagginationHelper.calculatePaggination(options);
  const { searchTerm, specialties, ...filterData } = filters;

  const andConditions: Prisma.DoctorWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: doctorSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (specialties && specialties.length > 0) {
    andConditions.push({
      doctorSpecialties: {
        some: {
          specialities: {
            title: {
              contains: specialties,
              mode: "insensitive",
            },
          },
        },
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

  andConditions.push({
    isDeleted: false,
  });

  const whereConditions: Prisma.DoctorWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.doctor.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { avarageRating: "desc" },
    select: {
      id: true,
      name: true,
      // email: false, // Hide email in public API
      profilePhoto: true,
      contactNumber: true,
      address: true,
      registrationNumber: true,
      experience: true,
      gender: true,
      appointmentFee: true,
      qualification: true,
      currentWorkingPlace: true,
      designation: true,
      avarageRating: true,
      createdAt: true,
      updatedAt: true,
      doctorSpecialties: {
        include: {
          specialities: true,
        },
      },
      reviews: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          patient: {
            select: {
              name: true,
              profilePhoto: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.doctor.count({
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

export const doctorServices = {
  getAllFromDB,
  updateDoctor,
  getDoctor,
  deleteDoctor,
  getAIsuggestions,
  softdeleteDoctor,
  getAllPublic,
};
