import { prisma } from "./db";
import { nanoid } from "nanoid";
import setting from "./setting";
import {
  Prisma,
  User_role,
  Transaction_transaction_type,
} from "@prisma/client";
import { emmiter } from "./events";
import { ReadStream } from "fs";
import { put } from "./storage";
import { Readable } from "stream";

export async function userExists(email: string, username: string | undefined) {
  var user = await prisma.user.findUnique({ where: { email } });
  if (user !== null) {
    return [true, "email is aleady in use!"];
  }
  if (username !== undefined)
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
  phone: string,
  bank_name: string,
  bank_number: string
) {
  if ((await userExists(email, username))[0])
    throw Error("user already exists");

  const ownerExists = await wehaveOwners();

  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      refer_id: nanoid(),
      phone,
      bank_name,
      bank_number,
      role: ownerExists ? "member" : "owner",
      verified: !ownerExists,
      accepted_terms: true,
      registered: true,
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

  emmiter.emit("newUser", user);

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

  let commitionFee = (await setting.get("COMMITION")) as number;
  if (user?.role == "owner" || user?.role == "admin") {
    commitionFee == 0;
  } else if (user?.role == "vip") {
    if (chargeInfo?.vip_off.gt(0)) {
      commitionFee = chargeInfo.vip_off
        .mul(commitionFee)
        .dividedBy(100)
        .toNumber();
    } else {
      let vip_off = (await setting.get("VIP_OFF")) as number;
      commitionFee = (vip_off * commitionFee) / 100;
    }
  }

  return commitionFee;
}

export async function verifyUser(user_id: number) {
  await prisma.user.update({
    where: { id: user_id },
    data: { verified: true },
  });
}

export async function changeUserRole(user_id: number, role: User_role) {
  await prisma.user.update({
    where: { id: user_id },
    data: { role },
  });
}

export async function changeUserVipSettings(
  user_id: number,
  vip_off: number,
  base_charge: number
) {
  await prisma.chargeinfo.update({
    where: { user_id: user_id },
    data: { base_charge, vip_off },
  });
}

export async function getUser(user_id: number) {
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    include: {
      chargeinfo: true,
      auction: true,
      block: true,
      documents: true,
      gifts: true,
    },
  });

  return user;
}

export async function getUsers(
  role: User_role | null,
  verified: boolean | null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  const query: Prisma.UserFindManyArgs = {};
  const countQ: Prisma.UserCountArgs = {};
  query.include = { chargeinfo: true };
  query.where = {};
  countQ.where = {};
  if (role != null) {
    query.where.role = role;
    countQ.where.role = role;
  }
  if (verified != null) {
    query.where.verified = verified;
    countQ.where.verified = verified;
  }
  if (sort != null) {
    query.orderBy = {
      created_at: sort,
    };
  }

  let totalPage: number = 1,
    total: number;
  total = await prisma.user.count(countQ);
  if (paginate) {
    perPage = perPage || 10;
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    query.skip = (page - 1) * perPage;
    query.take = perPage;
  }

  const users = await prisma.user.findMany(query);

  return {
    items: users,
    page,
    total,
    totalPage,
    perPage,
  };
}

export async function chargeUser(
  operator_id: number,
  user_id: number,
  is_charge: boolean,
  amount: number
) {
  if (!is_charge) {
    const chargeinfo = await prisma.chargeinfo.findUnique({
      where: { user_id },
    });
    if (chargeinfo?.charge.lt(amount)) {
      throw Error("amount exeeds user charge");
    }

    await prisma.chargeinfo.update({
      where: { user_id },
      data: {
        charge: {
          decrement: amount,
        },
      },
    });
  } else {
    await prisma.chargeinfo.update({
      where: { user_id },
      data: {
        charge: {
          increment: amount,
        },
      },
    });
  }

  let transaction_type: Transaction_transaction_type = is_charge
    ? "admin_charge"
    : "admin_discharge";

  let transaction = await prisma.transaction.create({
    data: {
      user_id: user_id,
      operator_id,
      transaction_type,
      is_done: true,
      is_confirmed: true,
      amount,
    },
  });

  emmiter.emit("charge", transaction);
}

export async function chargeRequest(
  user_id: number,
  amount: number,
  amount_text: string,
  document: Readable,
  ext: string = ".jpg"
) {
  let file = nanoid() + ext;
  await put("documents", file, document);

  let doc = await prisma.document.create({
    data: {
      user_id,
      file: file,
      file_type: "image",
    },
  });

  let transaction = await prisma.transaction.create({
    data: {
      user_id,
      document_id: doc.id,
      amount: amount,
      amount_text: amount_text,
      is_confirmed: false,
      is_done: false,
      transaction_type: "charge",
    },
  });

  emmiter.emit("chargeRequest", transaction);
}

export async function dischargeRequest(
  user_id: number,
  amount: number,
  amount_text: string
) {
  const chargeinfo = await prisma.chargeinfo.findUnique({
    where: { user_id },
  });
  if (chargeinfo?.charge.lt(amount)) {
    throw Error("amount exeeds user charge");
  }

  const transaction = await prisma.transaction.create({
    data: {
      user_id,
      amount: amount,
      amount_text: amount_text,
      is_confirmed: false,
      is_done: false,
      transaction_type: "discharge",
    },
  });

  emmiter.emit("chargeRequest", transaction);
}

export async function confirmTransaction(transaction_id: number) {
  let transaction = await prisma.transaction.findUnique({
    where: { id: transaction_id },
  });

  if (transaction?.is_confirmed) {
    throw Error("transaction is already confirmed");
  }

  if (transaction?.transaction_type == "charge") {
    await prisma.chargeinfo.update({
      where: { user_id: transaction?.user_id },
      data: {
        charge: {
          increment: transaction?.amount!,
        },
      },
    });

    transaction = await prisma.transaction.update({
      where: { id: transaction_id },
      data: {
        is_confirmed: true,
        is_done: true,
      },
    });
  } else {
    transaction = await prisma.transaction.update({
      where: { id: transaction_id },
      data: {
        is_confirmed: true,
      },
    });
  }
  emmiter.emit("charge", transaction);
}

export async function declineTransaction(transaction_id: number) {
  let transaction = await prisma.transaction.findUnique({
    where: { id: transaction_id },
  });

  if (transaction?.is_confirmed) {
    throw Error("transaction is already confirmed");
  }

  transaction = await prisma.transaction.update({
    where: { id: transaction_id },
    data: {
      is_declined: true,
    },
  });

  emmiter.emit("charge", transaction);
}

export async function doTransaction(transaction_id: number) {
  let transaction = await prisma.transaction.findUnique({
    where: { id: transaction_id },
  });

  if (transaction?.is_done) {
    throw Error("transaction is already done");
  }

  if (transaction?.transaction_type == "discharge") {
    await prisma.chargeinfo.update({
      where: { user_id: transaction?.user_id },
      data: {
        charge: {
          decrement: transaction?.amount!,
        },
      },
    });
  }
  await prisma.transaction.update({
    where: { id: transaction_id },
    data: {
      is_done: true,
    },
  });

  emmiter.emit("charge", transaction);
}

export async function getTransactions(
  user_id: number | null,
  is_done: boolean | null,
  is_confirmed: boolean | null,
  transaction_type: Transaction_transaction_type | null,
  sort: "asc" | "desc" = "asc",
  paginate: boolean = false,
  page: number = 1,
  perPage: number = 10
) {
  const query: Prisma.TransactionFindManyArgs = {};
  const countQ: Prisma.TransactionCountArgs = {};
  query.where = {};
  countQ.where = {};
  if (is_confirmed != null) {
    query.where.is_confirmed = is_confirmed;
    countQ.where.is_confirmed = is_confirmed;
  }
  if (is_done != null) {
    query.where.is_done = is_done;
    countQ.where.is_done = is_done;
  }
  if (transaction_type != null) {
    query.where.transaction_type = transaction_type;
    countQ.where.transaction_type = transaction_type;
  }
  if (user_id != null) {
    query.where.user_id = user_id;
    countQ.where.user_id = user_id;
  }
  if (sort != null) {
    query.orderBy = {
      created_at: sort,
    };
  }

  let totalPage: number = 1;
  let total = await prisma.transaction.count(countQ);

  if (paginate) {
    totalPage = Math.ceil(total / perPage);
    if (page > totalPage) {
      page = 1;
    }
    let skip = (page - 1) * perPage;
    query.skip = skip;
    query.take = perPage;
  }

  const transactions = await prisma.transaction.findMany(query);

  return {
    items: transactions,
    page,
    total,
    totalPage,
    perPage,
  };
}
