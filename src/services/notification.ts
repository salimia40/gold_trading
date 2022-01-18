import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { emmiter } from "./events";

export const notifyUser = async (
  user_id: number,
  message: string,
  action: string | undefined = undefined
) => {
  let notification = await prisma.notification.create({
    data: { user_id, message, action },
  });
  emmiter.emit("notification", notification);
};

export const notifyAdmins = async (
  message: string,
  action: string | undefined = undefined
) => {
  let admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["admin", "owner"],
      },
    },
    select: {
      id: true,
    },
  });
  admins.forEach(({ id }) => {
    notifyUser(id, message, action);
  });
};

export const notifyAll = async (
  message: string,
  action: string | undefined = undefined
) => {
  let users = await prisma.user.findMany({
    where: {
      verified: true,
    },
    select: {
      id: true,
    },
  });
  users.forEach(({ id }) => {
    notifyUser(id, message, action);
  });
};

export async function getNotifications(
  user_id: number,
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  let query: Prisma.NotificationFindManyArgs = {
    where: {
      user_id,
    },
  };
  let cQuery: Prisma.NotificationCountArgs = {
    where: {
      user_id,
    },
  };

  let totalPage: number = 1,
    total: number;
  total = await prisma.notification.count(cQuery);
  if (paginate) {
    perPage = perPage || 10;
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  let notifications = await prisma.notification.findMany(query);

  return {
    items: notifications,
    page,
    total,
    totalPage,
    perPage,
  };
}

export async function seen(notification_id: number) {
  await prisma.notification.update({
    where: { id: notification_id },
    data: { is_seen: true },
  });
}
