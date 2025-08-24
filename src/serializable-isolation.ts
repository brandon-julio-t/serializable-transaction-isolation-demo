import { PrismaClient } from "../generated/prisma";

const id = "id-serializable-isolation";

const db = new PrismaClient({
  transactionOptions: {
    isolationLevel: "Serializable",
  },
});

async function buyTicket(tx: typeof db) {
  const data = await tx.ticket.findUniqueOrThrow({
    where: {
      id,
    },
  });

  if (data.remainingQuantity <= 0) {
    throw new Error("[pre-purchase]: No tickets remaining");
  }

  const updated = await tx.ticket.update({
    where: {
      id,
    },
    data: {
      remainingQuantity: data.remainingQuantity - 1,
    },
  });

  if (updated.remainingQuantity < 0) {
    throw new Error("[post-purchase]: No tickets remaining");
  }

  await tx.ticketLog.create({
    data: {
      id: crypto.randomUUID(),
      description: `[receipt].[serializable] ${JSON.stringify(updated)}`,
    },
  });

  console.log("[updated]", updated);
}
async function main() {
  await db.ticketLog.deleteMany({
    where: {
      description: {
        contains: "serializable",
      },
    },
  });

  const data = await db.ticket.upsert({
    where: {
      id,
    },
    create: {
      id,
      remainingQuantity: 3,
    },
    update: {
      remainingQuantity: 3,
    },
  });

  console.log("[BEFORE]", data);

  // simulate 5 concurrent transactions, while the remaining quantity is 3
  await Promise.all([
    db
      .$transaction(async (tx) => await buyTicket(tx as typeof db))
      .catch((err) => console.error("Error on tx #1", err)),
    db
      .$transaction(async (tx) => await buyTicket(tx as typeof db))
      .catch((err) => console.error("Error on tx #2", err)),
    db
      .$transaction(async (tx) => await buyTicket(tx as typeof db))
      .catch((err) => console.error("Error on tx #3", err)),
    db
      .$transaction(async (tx) => await buyTicket(tx as typeof db))
      .catch((err) => console.error("Error on tx #4", err)),
    db
      .$transaction(async (tx) => await buyTicket(tx as typeof db))
      .catch((err) => console.error("Error on tx #5", err)),
  ]);

  {
    const final = await db.ticket.findUniqueOrThrow({
      where: {
        id,
      },
    });

    console.log("[AFTER]", final);
  }
}

main().catch(console.error).finally(process.exit);
