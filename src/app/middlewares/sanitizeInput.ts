// import { NextFunction, Request, Response } from "express";

// /**
//  * Middleware to trim string inputs and remove potentially harmful characters
//  */
// export const sanitizeInput = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // Sanitize body
//   if (req.body) {
//     req.body = sanitizeObject(req.body);
//   }

//   // Sanitize query
//   if (req.query) {
//     req.query = sanitizeObject(req.query);
//   }

//   // Sanitize params
//   if (req.params) {
//     req.params = sanitizeObject(req.params);
//   }

//   next();
// };

// const sanitizeObject = (obj: any): any => {
//   if (typeof obj !== "object" || obj === null) {
//     return sanitizeValue(obj);
//   }

//   if (Array.isArray(obj)) {
//     return obj.map(sanitizeObject);
//   }

//   const sanitized: any = {};
//   for (const key in obj) {
//     if (obj.hasOwnProperty(key)) {
//       sanitized[key] = sanitizeObject(obj[key]);
//     }
//   }
//   return sanitized;
// };

// const sanitizeValue = (value: any): any => {
//   if (typeof value === "string") {
//     // Trim whitespace
//     value = value.trim();

//     // Remove null bytes
//     value = value.replace(/\0/g, "");

//     // HTML encode dangerous characters (optional - depends on use case)
//     // value = value.replace(/[<>]/g, '');
//   }
//   return value;
// };

import { NextFunction, Request, Response } from "express";

/**
 * Middleware to trim string inputs and remove potentially harmful characters
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sanitize body

  console.log({ "in sanitizer 73 - Req.body:": req.body });

  if (req?.body?.data) {
    req.body = sanitizeObject(req?.body?.data);
  }
  if (req?.body) {
    req.body = sanitizeObject(req?.body);
  }
  console.log({ "in sanitizer 78 - Req.body:": req.body });

  // Sanitize query (cannot reassign because it's a getter → mutate instead)
  if (req.query) {
    Object.assign(req.query, sanitizeObject(req.query));
  }

  // Sanitize params (same reasoning)
  if (req.params) {
    Object.assign(req.params, sanitizeObject(req.params));
  }

  next();
};

const sanitizeObject = (obj: any): any => {
  if (typeof obj !== "object" || obj === null) {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
};

const sanitizeValue = (value: any): any => {
  if (typeof value === "string") {
    value = value.trim();
    value = value.replace(/\0/g, "");
  }
  return value;
};
