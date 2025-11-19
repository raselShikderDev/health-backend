import { Doctor, Prisma, UserStatus } from "@prisma/client";
import { IOptions, pagginationHelper } from "../../helpers/pagginationHelper";
import { prisma } from "../../shared/pirsmaConfig";
import { doctorSearchAbleFeild } from "./doctor.constrains";
import { IDoctorUpdateInput } from "./doctor.interface";
import apiError from "../../errors/apiError";
import httpstatus from "http-status";
import { openai } from "../../helpers/opeRouterConfig";
import { extractJsonFromMessage } from "../../helpers/extractAgentMessage";

const getAllFromDB = async (filters: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    pagginationHelper.calculatePaggination(options);
  const { searchItem, specalities, ...filterData } = filters;

  const andConditations: Prisma.DoctorWhereInput[] = [];
  // Checking and push searcterm intro conditions if any
  if (searchItem) {
    andConditations.push({
      OR: doctorSearchAbleFeild.map((feild) => ({
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
    include:{
      reviews:true
    }
  });
  const total = await prisma.doctor.count({
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

// Doctor update
const updateDoctor = async (
  id: string,
  payload: Partial<IDoctorUpdateInput>
) => {
  const existingDoctor = await prisma.doctor.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const { specialties, ...doctorData } = payload;
  return await prisma.$transaction(async (trans) => {
    if (specialties && specialties.length > 0) {
      // getting all deleted specalities
      const deletedSpecilitesIds = specialties.filter(
        (specialtiy) => specialtiy.isDeleted
      );
      // deleting specilites from the databased
      for (const specialtiy of deletedSpecilitesIds) {
        await trans.doctorSpecialties.deleteMany({
          where: {
            doctorId: id,
            specialitiesId: specialtiy.specialitiesId,
          },
        });
      }
      const createSpecilitesIds = specialties.filter(
        (specialtiy) => !specialtiy.isDeleted
      );
      // creating specilites from the databased
      for (const specialtiy of createSpecilitesIds) {
        await trans.doctorSpecialties.createMany({
          data: {
            doctorId: id,
            specialitiesId: specialtiy.specialitiesId as string,
          },
        });
      }
    }

    const updateDoctor = await trans.doctor.update({
      where: {
        id: existingDoctor.id,
      },
      data: doctorData,
      include: {
        doctorSpecialties: {
          include: {
            specialities: true,
          },
        },
      },
    });
    return updateDoctor;
  });
};

// Get a doctor
const getDoctor = async (id: string) => {
  return await prisma.doctor.findUniqueOrThrow({
    where: {
      id,
      isDeleted:false
    },
    include:{
      doctorSpecialties:{
        include:{
          specialities:true
        }
      },
      doctorSchedules:{
        include:{
          schedule:true
        }
      },
      reviews:{
        select:{
          rating:true
        }
      }
    }
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

export const doctorServices = {
  getAllFromDB,
  updateDoctor,
  getDoctor,
  deleteDoctor,
  getAIsuggestions,
  softdeleteDoctor
};
