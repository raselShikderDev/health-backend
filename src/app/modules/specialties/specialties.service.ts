import { Request } from "express";
import { fileUploader } from "../../helpers/fileUploadByMulter";
import { prisma } from "../../shared/pirsmaConfig";
import { Specialties } from "@prisma/client";

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

const getAllFromDB = async (): Promise<Specialties[]> => {
  return await prisma.specialties.findMany();
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
