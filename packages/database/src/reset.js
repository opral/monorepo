import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    const createManyTranslations = await prisma.translation.deleteMany({});
    const createManyKeys = await prisma.key.deleteMany({});
    const createManyPermissions = await prisma.permission.deleteMany({});
    const createManyUsers = await prisma.user.deleteMany({});
    const createManyProjects = await prisma.project.deleteMany({});
    const createManyOrganizations = await prisma.organization.deleteMany({});
}

main();