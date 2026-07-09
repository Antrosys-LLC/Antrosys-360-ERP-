import { buildApp } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { markMissingAttendanceAsAbsent } from './shared/attendance/mark-absences';

const ONE_HOUR_MS = 60 * 60 * 1000;

const DEMO_ANNOUNCEMENT_CONTENTS = [
  'Q3 Engineering All-Hands meeting schedule update',
  'Please review the new firewall deployment protocol',
  'Office maintenance scheduled for the 3rd floor next week',
];

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on http://0.0.0.0:${env.PORT}`);

    try {
      const cleaned = await prisma.announcement.deleteMany({
        where: { content: { in: DEMO_ANNOUNCEMENT_CONTENTS } },
      });
      if (cleaned.count > 0) {
        app.log.info(`Removed ${cleaned.count} demo team announcement(s)`);
      }
    } catch (err) {
      app.log.error({ err }, 'Failed to clean demo announcements');
    }

    // End-of-day absent marking: run once at boot, then hourly.
    const runAbsentJob = async () => {
      try {
        const result = await markMissingAttendanceAsAbsent();
        if (result.marked > 0) {
          app.log.info(`Marked ${result.marked} missing attendance day(s) as ABSENT`);
        }
      } catch (err) {
        app.log.error({ err }, 'Failed to mark missing attendance as absent');
      }
    };
    void runAbsentJob();
    setInterval(() => {
      void runAbsentJob();
    }, ONE_HOUR_MS);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
