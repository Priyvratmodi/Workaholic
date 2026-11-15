import { PrismaClient } from '@prisma/client';
import { mapLegacyBackgroundToPastel } from '../shared/dist/boardBackgrounds.js';

const prisma = new PrismaClient();

async function main() {
  const boards = await prisma.board.findMany();
  console.log(`Found ${boards.length} boards.`);
  for (const b of boards) {
    const pastel = mapLegacyBackgroundToPastel(b.background);
    if (pastel !== b.background) {
      await prisma.board.update({
        where: { id: b.id },
        data: { background: pastel },
      });
      console.log(`Updated board "${b.title}" (${b.id}): "${b.background}" -> "${pastel}"`);
    } else {
      console.log(`Board "${b.title}" (${b.id}) already pastel: "${b.background}"`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
