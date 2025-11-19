import express, { NextFunction, Request, Response } from 'express';
import { SpecialtiesController } from './specialties.controller';


import { UserRole } from '@prisma/client';
import { fileUploader } from '../../helpers/fileUploadByMulter';
import { SpecialtiesValidtaion } from './specialties.schema';
import { authValidation } from '../../middlewares/authValidation';



const router = express.Router();



router.get(
  '/',
  SpecialtiesController.getAllFromDB
);




router.post(
  '/',
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
      req.body = SpecialtiesValidtaion.create.parse(
        JSON.parse(req.body.data)
      );
    }
    return SpecialtiesController.insertIntoDB(req, res, next);
  }
);


router.delete(
  '/:id',
  authValidation(UserRole.ADMIN, UserRole.DOCTOR),
  SpecialtiesController.deleteFromDB
);

export const SpecialtiesRoutes = router;