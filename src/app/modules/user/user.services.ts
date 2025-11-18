import { Request } from "express";
import envVars from "../../../config/envVars";
import { prisma } from "../../shared/pirsmaConfig";
import * as bcrypt from "bcrypt";
import { fileUploader } from "../../helpers/fileUploadByMulter";
import { pagginationHelper } from "../../helpers/pagginationHelper";
import { Doctor, Prisma, UserRole, UserStatus } from "@prisma/client";
import { IJWTPayload } from "../../types/common";
import { tr } from "zod/v4/locales";
import { email } from "zod";
import { userSearchAbleFeilds } from "./user.constants";

// Create Patient
const createPatient = async (req: Request) => {
  // If file exists then upload to cloudinary
  if (!req.file) {
    console.log("file not exists");
  }
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    console.log({
      uploadResult: uploadResult?.secure_url as string,
    });
    req.body.patient.profilePhoto = uploadResult?.secure_url;
  }
 

  const hasedPassword = await bcrypt.hash(
    req.body.password,
    Number(envVars.bcrypt_salt as string)
    // Number(envVars.bcrypt_salt as string)
  );
  console.log("hasedPassword", hasedPassword);

  // Creating user and patient
  const result = await prisma.$transaction(async (trans: any) => {
    await trans.user.create({
      data: {
        email: req.body.patient?.email,
        password: hasedPassword,
      },
    });
    return await trans.patient.create({
      data: req.body.patient,
    });
  });
  console.log("result in service", result);

  // data and file
  // {
  //     "patient": {
  //         "email": "rasel@mail.com",
  //         "name": "Rasel Shikder"
  //     },
  //     "password": "Rasel70#@"
  // }
  return result;
};

// Create Doctor
const createDoctor = async (req: Request): Promise<Doctor> => {
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.doctor.profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword: string = await bcrypt.hash(
    req.body.password,
    Number(envVars.bcrypt_salt as string)
  );

  const userData = {
    email: req.body.doctor.email,
    password: hashedPassword,
    role: UserRole.DOCTOR,
  };

  // Extract specialties from doctor data
  const { specialties, ...doctorData } = req.body.doctor;

  const result = await prisma.$transaction(async (transactionClient) => {
    // Step 1: Create user
    await transactionClient.user.create({
      data: userData,
    });

    // Step 2: Create doctor
    const createdDoctorData = await transactionClient.doctor.create({
      data: doctorData,
    });

    // Step 3: Create doctor specialties if provided
    if (specialties && Array.isArray(specialties) && specialties.length > 0) {
      // Verify all specialties exist
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

      // Create doctor specialties relations
      const doctorSpecialtiesData = specialties.map((specialtyId) => ({
        doctorId: createdDoctorData.id,
        specialitiesId: specialtyId,
      }));

      await transactionClient.doctorSpecialties.createMany({
        data: doctorSpecialtiesData,
      });
    }

    // Step 4: Return doctor with specialties
    const doctorWithSpecialties = await transactionClient.doctor.findUnique({
      where: {
        id: createdDoctorData.id,
      },
      include: {
        doctorSpecialties: {
          include: {
            specialities: true,
          },
        },
      },
    });

    return doctorWithSpecialties!;
  });

  return result;
};

// Create admin
const createAdmin = async (req: Request) => {
  // If file exists then upload to cloudinary
  if (!req.file) {
    console.log("file not exists");
  }
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    console.log({
      uploadResult: uploadResult?.secure_url as string,
    });
    req.body.admin.profilePhoto = uploadResult?.secure_url;
  }
  console.log(req.body);
  console.log({
    pass: req.body.password,
    salt: Number(envVars.bcrypt_salt as string),
  });
  // return req.body;

  const hasedPassword = await bcrypt.hash(req.body.password, 10);

  // Creating user and admin
  const result = await prisma.$transaction(async (trans: any) => {
    await trans.user.create({
      data: {
        email: req.body.admin?.email,
        password: hasedPassword,
        role: UserRole.ADMIN,
      },
    });
    console.log("admin", req.body.admin);

    return await trans.admin.create({
      data: req.body.admin,
    });
  });
  console.log("result in service of admin", result);

  // data and file
  // {
  //   "password": "StrongPass123!",
  //   "admin": {
  //     "name": "Admin",
  //     "email": "admin@health.com",
  //     "contactNumber": "+1234567890"
  //   }
  // }

  return result;
};

// get all users from Db
const getAllFromDB = async (params: any, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    pagginationHelper.calculatePaggination(options);
  const { searchItem, ...filters } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  if (searchItem) {
    andConditions.push({
      OR: userSearchAbleFeilds.map((feild) => ({
        [feild]: {
          contains: searchItem,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filters).length > 0) {
    andConditions.push({
      AND: Object.keys(filters).map((key) => ({
        [key]: {
          equals: (filters as any)[key],
        },
      })),
    });
  }

  const result = await prisma.user.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });
  const total = await prisma.user.count({
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

// get my profile  from Db
const getMyProfile = async (user: IJWTPayload) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      needPasswordChange: true,
      role: true,
      status: true,
    },
  });
  let profileData;
  if (userInfo.role === UserRole.PATIENT) {
    profileData = await prisma.patient.findUniqueOrThrow({
      where: { email: userInfo.email },
    });
  } else if (userInfo.role === UserRole.DOCTOR) {
    profileData = await prisma.admin.findUniqueOrThrow({
      where: { email: userInfo.email },
    });
  }
  return {
    ...userInfo,
    ...profileData,
  };
};

const updateUserStatus = async (id: string, payload: UserStatus) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
  });

  const updatedStatus = await prisma.user.update({
    where: {
      id: userInfo.id,
    },
    data: payload,
  });

  return updatedStatus;
};

const updateMyProfie = async (user: IJWTPayload, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const file = req.file;
  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.profilePhoto = uploadToCloudinary?.secure_url;
  }

  let profileInfo;

  if (userInfo.role === UserRole.ADMIN) {
    profileInfo = await prisma.admin.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  } else if (userInfo.role === UserRole.DOCTOR) {
    profileInfo = await prisma.doctor.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  } else if (userInfo.role === UserRole.PATIENT) {
    profileInfo = await prisma.patient.update({
      where: {
        email: userInfo.email,
      },
      data: req.body,
    });
  }

  return { ...profileInfo };
};

export const userServices = {
  createPatient,
  createDoctor,
  createAdmin,
  getAllFromDB,
  getMyProfile,
  updateUserStatus,
  updateMyProfie,
};
