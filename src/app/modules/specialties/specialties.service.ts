import { Request } from "express";
import { fileUploader } from "../../helpers/fileUploadByMulter";
import { prisma } from "../../shared/pirsmaConfig";
import { Specialties } from "@prisma/client";
import { pagginationHelper } from "../../helpers/pagginationHelper";
import { IPaginationOptions } from "../../interfaces/pagination";

const insertIntoDB = async (req: Request) => {
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.icon = uploadToCloudinary?.secure_url;
  }

  // http://localhost:5000/api/v1/doctors/73e8bf9d-1689-4a6c-bfe3-279fb4a7fabf
  //with file
  // {
  //     "specialties": [
  //         {
  //             "specialitiesId": "a1946df6-1201-418a-8d11-96c1240fca2b",
  //             "isDeleted": false
  //         }
  //     ]
  // }
  const result = await prisma.specialties.create({
    data: req.body,
  });

  return result;
};

const getAllFromDB = async (options: IPaginationOptions) => {
  const { limit, page, skip } = pagginationHelper.calculatePaggination(options);

  const result = await prisma.specialties.findMany({
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.specialties.count();

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const deleteFromDB = async (id: string): Promise<Specialties> => {
  const result = await prisma.specialties.delete({
    where: {
      id,
    },
  });
  return result;
};

export const SpecialtiesService = {
  insertIntoDB,
  getAllFromDB,
  deleteFromDB,
};
