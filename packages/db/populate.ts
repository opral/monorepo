import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const createManyOrganizations = await prisma.organization.createMany({
        data: [

        ]
    })
    const createManyUsers = await prisma.user.createMany({
        data: [
            
        ]
    })
    const createManyProjects = await prisma.project.createMany({
        data: [

        ]
    })
    const createManyPermissions = await prisma.permission.createMany({
        data: [

        ]
    })
    const createManyKeys = await prisma.key.createMany({
        data: [

        ]
    })
    const createManyTranslations = await prisma.translation.createMany({
        data: [
            
        ]
    })
}