import envVars from "../../../config/envVars";
import { prisma } from "../../shared/pirsmaConfig";
import * as bcrypt from "bcrypt";
import { UserStatus} from "@prisma/client"
import jwt, {Secret, SignOptions} from "jsonwebtoken"
import { jwtHelper } from "../../helpers/jwtHelper";
import emailSender from "./emailSender";
import apiError from "../../errors/apiError";
import httpStatus from "http-status"
import { IJWTPayload } from "../../types/common";


const login = async (email:string, password:string) => {
const existedUser = await prisma.user.findUniqueOrThrow({
    where:{
        email,
        status:UserStatus.ACTIVE
    }
})

const isCorrectPassword = await bcrypt.compare(password, existedUser.password)
  if (!isCorrectPassword) {
    throw new Error("Password is incorrect")
  }
  const accessToken = jwtHelper.generateToken({email:existedUser.email, role:existedUser.role}, envVars.jwt.access_secret as string,envVars.jwt.access_expires as string
  )
  const refreshToken = jwtHelper.generateToken({email:existedUser.email, role:existedUser.role}, envVars.jwt.refresh_secret as string,envVars.jwt.refresh_expires as string
  )
//   {
//   "password": "StrongPassword123!",
//   "email": "johndoe@example.com"
// }
  return {
    accessToken,
    refreshToken,
    needPasswordChange:existedUser.needPasswordChange
  }
};

const refreshToken = async (token: string) => {
    let decodedData;
    try {
        decodedData = jwtHelper.verifyToken(token, envVars.jwt.refresh_secret as Secret);
    }
    catch (err) {
        throw new Error("You are not authorized!")
    }

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: UserStatus.ACTIVE
        }
    });

    const accessToken = jwtHelper.generateToken({
        email: userData.email,
        role: userData.role
    },
        envVars.jwt.access_secret as Secret,
        envVars.jwt.access_expires as string
    );

    return {
        accessToken,
        needPasswordChange: userData.needPasswordChange
    };

};

const changePassword = async (user: IJWTPayload, payload: any) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: user.email,
            status: UserStatus.ACTIVE
        }
    });

    const isCorrectPassword: boolean = await bcrypt.compare(payload.oldPassword, userData.password);

    if (!isCorrectPassword) {
        throw new Error("Password incorrect!")
    }

    const hashedPassword: string = await bcrypt.hash(payload.newPassword, Number(envVars.bcrypt_salt as string));

    await prisma.user.update({
        where: {
            email: userData.email
        },
        data: {
            password: hashedPassword,
            needPasswordChange: false
        }
    })

    return {
        message: "Password changed successfully!"
    }
};

const forgotPassword = async (payload: { email: string }) => {
    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: UserStatus.ACTIVE
        }
    });

    const resetPassToken = jwtHelper.generateToken(
        { email: userData.email, role: userData.role },
        envVars.RESET_PASS_SECRET as Secret,
        envVars.RESET_PASS_EXPIRES as string
    )

    const resetPassLink = envVars.FRONTEND_URL as string + `?userId=${userData.id}&token=${resetPassToken}`

    await emailSender(
        userData.email,
        `
        <div>
            <p>Dear User,</p>
            <p>Your password reset link 
                <a href=${resetPassLink}>
                    <button>
                        Reset Password
                    </button>
                </a>
            </p>

        </div>
        `
    )
};

const resetPassword = async (token: string, payload: { id: string, password: string }) => {

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            id: payload.id,
            status: UserStatus.ACTIVE
        }
    });

    const isValidToken = jwtHelper.verifyToken(token,  envVars.RESET_PASS_SECRET as Secret,)

    if (!isValidToken) {
        throw new apiError(httpStatus.FORBIDDEN, "Forbidden!")
    }

    // hash password
    const password = await bcrypt.hash(payload.password, Number(envVars.bcrypt_salt as string));

    // update into database
    await prisma.user.update({
        where: {
            id: payload.id
        },
        data: {
            password
        }
    })
};

const getMe = async (session: any) => {
    const accessToken = session.accessToken;
    const decodedData = jwtHelper.verifyToken(accessToken, envVars.jwt.access_secret as string);

    const userData = await prisma.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: UserStatus.ACTIVE
        }
    })

    const { id, email, role, needPasswordChange, status } = userData;

    return {
        id,
        email,
        role,
        needPasswordChange,
        status
    }

}

export const authServices = {
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
