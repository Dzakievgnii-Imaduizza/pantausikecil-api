const { prisma } = require("../db/prisma");

async function findByEmail(email) {
  return prisma.appUser.findUnique({ where: { email } });
}

module.exports = { findByEmail };
