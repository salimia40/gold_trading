import PushNotifications from "@pusher/push-notifications-server";
import { Request, Response } from "express";

const beamsClient = new PushNotifications({
  instanceId: process.env.PUSHER_INSTANCE_ID!,
  secretKey: process.env.PUSHER_KEY!,
});

export function publishToUser(user_id: number, title: string, body: string) {
  beamsClient.publishToUsers([user_id.toString()], {
    web: {
      notification: {
        title,
        body,
      },
    },
  });
}

export function publishToPublic(channel: string, title: string, body: string) {
  beamsClient.publishToInterests([channel], {
    web: {
      notification: {
        title,
        body,
      },
    },
  });
}

export function logout(user_id: number) {
  beamsClient.deleteUser(user_id.toString());
}

export function beamsAuth(req: Request, res: Response) {
  // Do your normal auth checks here 🔒
  //   @ts-ignore
  const userId = req.user?.id!.toString()!; // get it from your auth system
  const userIDInQueryParam = req.query["user_id"];
  if (userId != userIDInQueryParam) {
    res.status(401).send("Inconsistent request");
  } else {
    const beamsToken = beamsClient.generateToken(userId);
    res.send(JSON.stringify(beamsToken));
  }
}
