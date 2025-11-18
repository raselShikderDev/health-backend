import { addHours, addMinutes, format } from "date-fns";
import { prisma } from "../../shared/pirsmaConfig";
import { IOptions, pagginationHelper } from "../../helpers/pagginationHelper";
import { Prisma } from "@prisma/client";
import { IJWTPayload } from "../../types/common";
import apiError from "../../errors/apiError";
import httpStatus from "http-status"

// creating slots
const insertIntoDB = async (payload: any) => {
  const { startTime, endTime, startDate, endDate } = payload;
  const interalTime = 30; // in minutes
  console.log({ startTime, endTime, startDate, endDate });

  const schedules = [];

  const currDate = new Date(startDate);
  const lastDate = new Date(endDate);
  console.log("currDate <= lastDate:", currDate <= lastDate);

  while (currDate <= lastDate) {
    // creating actual start date time
    const startDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currDate, "yyyy-MM-dd")}`,
          Number(startTime.split(":")[0]) // 10:00
        ),
        Number(startTime.split(":")[1])
      )
    );
    // creating actual end date time
    const endDateTime = new Date(
      addMinutes(
        addHours(
          `${format(currDate, "yyyy-MM-dd")}`,
          Number(endTime.split(":")[0]) // 11:00
        ),
        Number(endTime.split(":")[1])
      )
    );

    // creating slot if not bookoed yet after adding interval
    while (startDateTime < endDateTime) {
      const slotStartDateTime = startDateTime; // 10:00
      const slotEndDateTime = addMinutes(endDateTime, interalTime); // 10:30

      const scheduleData = {
        startDateTime: slotStartDateTime,
        endDateTime: slotEndDateTime,
      };
      const existingShedule = await prisma.schedule.findFirst({
        where: scheduleData,
      });
      if (existingShedule) {
        throw new apiError(httpStatus.BAD_REQUEST, "Shedules alreadyed created with this time")
      }
      console.log("existingShedule", existingShedule);

      if (!existingShedule) {
        const newSchedule = await prisma.schedule.create({
          data: scheduleData,
        });
        console.log("newSchedule", newSchedule);
        schedules.push(newSchedule);
      }
      slotStartDateTime.setMinutes(
        slotStartDateTime.getMinutes() + interalTime
      );
    }
    currDate.setDate(currDate.getDate() + 1);
  }
  // http://localhost:5000/api/v1/schedules
  // {
  // "startDate":"2026-10-18",
  // "endDate":"2026-10-19",
  // "startTime":"10:00",
  // "endTime":"17:00"
  // }
  console.log("schedules:", schedules);

  return schedules;
};

// Get all available schedule for doctor
const getSchedulesForDoctor = async (
  user: IJWTPayload,
  filters: any,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    pagginationHelper.calculatePaggination(options);
  const { startDateTime: filterStartDateTime, endDateTime: filterEndDateTime } =
    filters;

  console.log(filterStartDateTime, filterEndDateTime);

  const andConditions: Prisma.ScheduleWhereInput[] = [];

  if (filterStartDateTime && filterEndDateTime) {
    andConditions.push({
      AND: [
        {
          startDateTime: {
            gte: filterEndDateTime,
          },
        },
        {
          endDateTime: {
            gte: filterEndDateTime,
          },
        },
      ],
    });
  }
  const whereConditions: Prisma.ScheduleWhereInput =
    andConditions.length > 0
      ? {
        AND: andConditions,
      }
      : {};

  const doctorSchedules = await prisma.doctorSchedules.findMany({
    where: {
      doctor: {
        email: user.email,
      },
    },
    select: {
      scheduleId: true,
    },
  });
  const doctorSchedulesId = doctorSchedules.map(
    (schedule) => schedule.scheduleId
  );
  const result = await prisma.schedule.findMany({
    skip,
    take: limit,
    where: {
      ...whereConditions,
      id: {
        notIn: doctorSchedulesId,
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
  });
  console.log("result", result);
  const total = await prisma.schedule.count({
    where: {
      ...whereConditions,
      id: {
        notIn: doctorSchedulesId,
      },
    },
  });
  // http://localhost:5000/api/v1/schedules?startDateTime=2026-10-19T12:00:00.000Z&endDateTime=2026-10-19T12:30:00.000Z
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// delete schedule from db
const deleteScheduleFromDB = async (id: string) => {
  const result = await prisma.schedule.delete({
    where: {
      id: id,
    },
  });
  console.log("result", result);
  return result;
};

// get schedule from db
const getSchedule = async (id: string) => {
  const result = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: id,
    },
  });
  console.log("result", result);
  return result;
};

export const schedculeServices = {
  insertIntoDB,
  getSchedulesForDoctor,
  deleteScheduleFromDB,
  getSchedule
};
