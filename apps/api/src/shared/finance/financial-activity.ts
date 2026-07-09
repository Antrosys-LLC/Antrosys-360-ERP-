import { FinancialActivityCategory, Prisma } from '@prisma/client';

type DbClient = {
  financialActivity: {
    create: (args: {
      data: {
        category: FinancialActivityCategory;
        title: string;
        occurredAt: Date;
        metadata?: Prisma.InputJsonValue;
      };
    }) => Promise<unknown>;
  };
};

export async function logFinancialActivity(
  db: DbClient,
  input: {
    category: FinancialActivityCategory;
    title: string;
    occurredAt?: Date;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return db.financialActivity.create({
    data: {
      category: input.category,
      title: input.title,
      occurredAt: input.occurredAt ?? new Date(),
      metadata: input.metadata,
    },
  });
}
