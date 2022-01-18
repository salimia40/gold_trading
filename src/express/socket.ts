import { User_role } from "@prisma/client";
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { prisma } from "../services/db";
import { decriptToken } from "./routes/auth";

const createSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    /* options */
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const { tokenId } = decriptToken(token);
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
      const err: any = new Error("not authorized");
      err.data = { content: "Please retry later" };
      return next(err);
    }

    // Check token expiration
    if (fetchedToken.expiration < new Date()) {
      const err: any = new Error("not authorized");
      err.data = { content: "Please retry later" };
      return next(err);
    }

    let userId = fetchedToken.userId;

    if (
      fetchedToken.user.role === User_role.admin ||
      fetchedToken.user.role === User_role.owner
    ) {
      socket.join(`/newUser`);
      socket.join(`/chargeRequest`);
    }

    socket.join(`/newPrice`);
    socket.join(`/setting`);
    socket.join(`/offer`);
    socket.join(`/auctionHit/${userId}`);
    socket.join(`/auctionMargin/${userId}`);
    socket.join(`/auction/${userId}`);
    socket.join(`/newCharge/${userId}`);
    socket.join(`/charge/${userId}`);
    socket.join(`/settle/${userId}`);
    socket.join(`/block/${userId}`);
    socket.join(`/notification/${userId}`);

    next();
  });
  return io;
};

export default createSocket;
