import { prisma } from "./db";

import { nanoid } from "nanoid";
import { compare, hash } from "bcryptjs";
import setting from "./setting";
import { User } from "@prisma/client";

export async function userExists(email: string, username: string) {
  var user = await prisma.user.findUnique({ where: { email } });
  if (user !== null) {
    return [true, "email is aleady in use!"];
  }
  user = await prisma.user.findUnique({
    where: { username },
  });
  if (user !== null) {
    return [true, "username is aleady in use!"];
  }
  return [false, ""];
}

export async function createUser(
  name: string,
  username: string,
  email: string,
  password: string,
  phone: string,
  bank_name: string,
  bank_number: string,
) {
  const ownerExists = await wehaveOwners();
  const hashedPassword = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
      refer_id: nanoid(),
      phone,
      bank_name,
      bank_number,
      role: ownerExists ? "member" : "owner",
      accepted_terms: true,
    },
  });

  await prisma.auction.create({
    data: {
      user_id: user.id,
    },
  });

  await prisma.block.create({
    data: {
      user_id: user.id,
      amount: 0,
      is_sell: false,
    },
  });

  await prisma.chargeinfo.create({
    data: {
      user_id: user.id,
    },
  });

  //TODO create a gift for user

  return user;
}

export async function wehaveOwners() {
  var wehaveOwners = await prisma.user.count({ where: { role: "owner" } });
  return !(wehaveOwners === 0);
}

export async function userCommition(user_id: number) {
  const chargeInfo = await prisma.chargeinfo.findUnique({
    where: {
      user_id,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: user_id,
    },
  });

  let commitionFee = await setting.get("COMMITION") as number;
  if (user?.role == "owner" || user?.role == "admin") {
    commitionFee == 0;
  } else if (user?.role == "vip") {
    if (chargeInfo?.vip_off.gt(0)) {
      commitionFee = chargeInfo.vip_off.mul(commitionFee).dividedBy(100)
        .toNumber();
    } else {
      let vip_off = await setting.get("VIP_OFF") as number;
      commitionFee = (vip_off * commitionFee) / 100;
    }
  }

  return commitionFee;
}
