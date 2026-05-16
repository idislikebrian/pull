import { prisma } from "@/lib/prisma";

const reservedHandles = new Set(["admin", "pull", "support", "moderator", "organizer", "venue", "api"]);

export async function generateSignalerHandle() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(10_000 + Math.random() * 90_000);
    const handle = `signaler-${suffix}`;

    if (reservedHandles.has(handle)) {
      continue;
    }

    const existing = await prisma.user.findUnique({
      where: { handle },
      select: { id: true }
    });

    if (!existing) {
      return handle;
    }
  }

  return `signaler-${crypto.randomUUID().slice(0, 8)}`;
}
