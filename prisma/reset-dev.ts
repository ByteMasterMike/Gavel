import { prisma } from "../lib/prisma";

const DEV_EMAIL = "dev@thegavel.local";

/**
 * Removes the local dev user and all related game rows (rulings cascade).
 * Next "Dev sign-in" recreates a fresh user. Clear browser cookies for localhost
 * if you still see JWT/session errors (old token vs new AUTH_SECRET).
 */
async function main() {
  const user = await prisma.user.findUnique({ where: { email: DEV_EMAIL } });
  if (!user) {
    console.log(`No user found for ${DEV_EMAIL} — nothing to reset.`);
    return;
  }

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted dev user ${DEV_EMAIL} and related data (e.g. rulings).`);
  console.log("In the app: Sign out, clear localhost cookies if needed, then Dev sign-in again.");
  console.log("Old JWTs still point at the deleted user id and will fail until you re-authenticate.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
