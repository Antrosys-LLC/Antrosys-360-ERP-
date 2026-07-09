import { Role, Prisma } from '@prisma/client';

type NotificationDb = Pick<Prisma.TransactionClient, 'user' | 'notification'>;

export async function notifyUsersByRoles(
  tx: NotificationDb,
  roles: Role[],
  title: string,
  message: string,
) {
  const users = await tx.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { id: true },
  });

  for (const user of users) {
    await tx.notification.create({
      data: { userId: user.id, title, message },
    });
  }
}
