const bcrypt = require("bcrypt");
const { prisma } = require("../src/db/prisma");

async function main() {
  console.log("Seeding started...");

  // 1️⃣ POSYANDU
  let posyandu = await prisma.posyandu.findFirst({
    where: { namaPosyandu: "Posyandu Demo" },
  });

  if (!posyandu) {
    posyandu = await prisma.posyandu.create({
      data: {
        namaPosyandu: "Posyandu Demo",
        alamatPosyandu: "Alamat demo",
        rt: "01",
        rw: "02",
        kelurahan: "Posongan",
        kecamatan: "Comal",
        kabupatenKota: "Pemalang",
      },
    });
  }

  // 2️⃣ USER ADMIN
  const passwordHash = await bcrypt.hash("admin123", 10);

  const user = await prisma.appUser.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      nama: "Admin Demo",
      email: "admin@demo.com",
      passwordHash,
      role: "admin",
      posyanduId: posyandu.posyanduId,
    },
  });

  console.log("Seed done:", {
    posyanduId: posyandu.posyanduId,
    userId: user.userId,
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
