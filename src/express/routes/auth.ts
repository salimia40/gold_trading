import { TokenType, User_role } from "@prisma/client";
import dayjs from "dayjs";
import { RequestHandler, Router } from "express";
import { prisma } from "../../services/db";
import { sendMail } from "../../services/mail";
import { createUser, userExists } from "../../services/user";
import jwt from "jsonwebtoken";
import { beamsAuth } from "../../services/pushNotifications";

const EMAIL_TOKEN_EXPIRATION_MINUTES = 10;
export const API_AUTH_STATEGY = "API";
// Load the JWT secret from environment variables or default
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_JWT_SECRET";
const JWT_ALGORITHM = "HS256";
const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 12;
const REFRESH_TOKEN_EXPIRATION_DAYS = 12;

interface APITokenPayload {
  tokenId: number;
}

// Generate a random 8 digit number as the email token
function generateEmailToken(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function sendEmailToken(email: string, token: string) {
  await sendMail(
    email,
    "Login token for the modern backend API",
    `The login token for the API is: ${token}`
  );
}

// Generate a signed JWT token with the tokenId in the payload
function generateAuthToken(tokenId: number): string {
  const jwtPayload = { tokenId };

  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    noTimestamp: true,
  });
}

export const decriptToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  }) as APITokenPayload;
};

const login: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!(await userExists(email, undefined))[0]) {
    return res.boom.badRequest("user doesn't exist");
  }

  // 👇 generate an alphanumeric token
  const emailToken = generateEmailToken();
  // 👇 create a date object for the email token expiration
  const tokenExpiration = dayjs()
    .add(EMAIL_TOKEN_EXPIRATION_MINUTES, "minute")
    .toDate();

  try {
    // 👇 create a short lived token and update user or create if they don't exist
    await prisma.token.create({
      data: {
        emailToken,
        type: TokenType.EMAIL,
        expiration: tokenExpiration,
        user: {
          connect: {
            email,
          },
        },
      },
    });

    // 👇 send the email token
    await sendEmailToken(email, emailToken);
    return res.send(200);
  } catch (error: any) {
    return res.boom.badImplementation(error.message);
  }
};

const authenticate: RequestHandler = async (req, res) => {
  const { email, emailToken } = req.body;

  try {
    // Get short lived email token
    const fetchedEmailToken = await prisma.token.findUnique({
      where: {
        emailToken: emailToken,
      },
      include: {
        user: true,
      },
    });

    if (!fetchedEmailToken?.valid) {
      // If the token doesn't exist or is not valid, return 401 unauthorized
      return res.boom.unauthorized();
    }

    if (fetchedEmailToken.expiration < new Date()) {
      // If the token has expired, return 401 unauthorized
      return res.boom.unauthorized("Token expired");
    }

    // If token matches the user email passed in the payload, generate long lived API token
    if (fetchedEmailToken?.user?.email === email) {
      const tokenExpiration = dayjs()
        .add(AUTHENTICATION_TOKEN_EXPIRATION_HOURS, "hour")
        .toDate();
      const refreshExpiration = dayjs()
        .add(REFRESH_TOKEN_EXPIRATION_DAYS, "day")
        .toDate();
      // Persist token in DB so it's stateful
      const createdToken = await prisma.token.create({
        data: {
          type: TokenType.API,
          expiration: tokenExpiration,
          user: {
            connect: {
              email,
            },
          },
        },
      });

      const createdRefreshToken = await prisma.token.create({
        data: {
          type: TokenType.REFRESH,
          expiration: refreshExpiration,
          user: {
            connect: {
              email,
            },
          },
        },
      });

      // Invalidate the email token after it's been used
      await prisma.token.update({
        where: {
          id: fetchedEmailToken.id,
        },
        data: {
          valid: false,
        },
      });

      const authToken = generateAuthToken(createdToken.id);
      const refreshToken = generateAuthToken(createdRefreshToken.id);

      res.header("Authorization", authToken);
      res.header("x-refresh", refreshToken);
      return res.sendStatus(200);
    } else {
      return res.boom.unauthorized();
    }
  } catch (error: any) {
    return res.boom.badImplementation(error.message);
  }
};

const refresh: RequestHandler = async (req, res) => {
  const { tokenId } = req;
  const refreshHeader = req.headers["x-refresh"];

  try {
    const refreshInfo = jwt.verify(refreshHeader as string, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as APITokenPayload;

    const fetchedToken = await prisma.token.findUnique({
      where: {
        id: refreshInfo.tokenId,
      },
      include: {
        user: true,
      },
    });

    // Check if token could be found in database and is valid
    if (!fetchedToken || !fetchedToken?.valid) {
      return res.boom.unauthorized("Invalid Refresh Token");
    }
    // Check token expiration
    if (fetchedToken.expiration < new Date()) {
      return res.boom.unauthorized("Refresh Token expired");
    }

    const tokenExpiration = dayjs()
      .add(AUTHENTICATION_TOKEN_EXPIRATION_HOURS, "day")
      .toDate();

    const refreshExpiration = dayjs()
      .add(REFRESH_TOKEN_EXPIRATION_DAYS, "day")
      .toDate();

    const createdToken = await prisma.token.create({
      data: {
        type: TokenType.API,
        expiration: tokenExpiration,
        user: {
          connect: {
            id: req.user?.id,
          },
        },
      },
    });

    // Invalidate the email token after it's been used
    await prisma.token.update({
      where: {
        id: tokenId,
      },
      data: {
        valid: false,
      },
    });

    await prisma.token.update({
      where: {
        id: fetchedToken.id,
      },
      data: {
        expiration: refreshExpiration,
      },
    });

    const authToken = generateAuthToken(createdToken.id);

    res.header("Authorization", authToken);
    return res.sendStatus(200);
  } catch (error) {}
};

const register: RequestHandler = async (req, res) => {
  const { name, username, email, phone, bank_name, bank_number } = req.body;

  // 👇 generate an alphanumeric token
  const emailToken = generateEmailToken();
  // 👇 create a date object for the email token expiration
  const tokenExpiration = dayjs()
    .add(EMAIL_TOKEN_EXPIRATION_MINUTES, "minute")
    .toDate();

  try {
    await createUser(name, username, email, phone, bank_name, bank_number);

    // 👇 create a short lived token and update user or create if they don't exist
    await prisma.token.create({
      data: {
        emailToken,
        type: TokenType.EMAIL,
        expiration: tokenExpiration,
        user: {
          connect: {
            email,
          },
        },
      },
    });

    // 👇 send the email token
    await sendEmailToken(email, emailToken);
    return res.send(200);
  } catch (error: any) {
    return res.boom.badRequest(error.message);
  }
};

export const authenticateJWT: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  try {
    if (authHeader) {
      const { tokenId } = decriptToken(authHeader);

      const fetchedToken = await prisma.token.findUnique({
        where: {
          id: tokenId,
        },
        include: {
          user: true,
        },
      });

      // Check if token could be found in database and is valid
      if (!fetchedToken || !fetchedToken?.valid) {
        return res.boom.unauthorized("Invalid Token");
      }

      // Check token expiration
      if (fetchedToken.expiration < new Date()) {
        return res.boom.unauthorized("Token expired");
      }

      // The token is valid. Make the `userId`, `isAdmin`, and `teacherOf` to `credentials` which is available in route handlers via `request.auth.credentials`
      req.user = fetchedToken.user;
      req.loggedIn = true;
      req.tokenId = tokenId;

      return next();
    } else {
      res.boom.unauthorized();
    }
  } catch (error: any) {
    res.boom.badRequest(error.message);
  }
};

export const AdminOnly: RequestHandler = (req, res, next) => {
  if (req.user?.role == User_role.admin || req.user?.role == User_role.owner) {
    return next;
  } else res.boom.forbidden("admins only");
};

export const ownerOnly: RequestHandler = (req, res, next) => {
  if (req.user?.role == User_role.owner) {
    return next;
  } else res.boom.forbidden("owner only");
};

export const verifiedOnly: RequestHandler = (req, res, next) => {
  if (req.user?.verified) {
    return next;
  } else res.boom.forbidden("verified only");
};

const router = Router();

router.post("/login", login);
router.post("/authenticate", authenticate);
router.post("/register", register);
router.get("/token", authenticateJWT, refresh);
router.get("/beams", authenticateJWT, beamsAuth);
export default router;
