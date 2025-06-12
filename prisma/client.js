const { PrismaClient } = require('@prisma/client');

// Create a singleton instance of the PrismaClient
const prisma = new PrismaClient();

module.exports = prisma;
