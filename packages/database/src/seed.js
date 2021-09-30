import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
    const createManyOrganizations = await prisma.organization.createMany({
        data: [
            {id: 0, name: "Foo" }
        ]
    });
    const createManyUsers = await prisma.user.createMany({
        data: [
            { id: 0, name: "Bob", email: "bob@inlang.dev", organization_id: 0, isAdmin: true },
            { id: 1, name: "Caroline", email: "caroline@inlang.dev", organization_id: 0, isAdmin: false }
        ]
    });
    const createManyProjects = await prisma.project.createMany({
        data: [
            { id: 0, api_key: "myapikey", name: "inlang app", owner_id: 0, default_locale: "en", locales: "de, da, fr" }
        ]
    });
    const createManyPermissions = await prisma.permission.createMany({
        data: [
            { organization_id: 0, project_id: 0, user_id: 0 },
            { organization_id: 0, project_id: 0, user_id: 1 }
        ]
    });
    const createManyKeys = await prisma.key.createMany({
        data: [
            { id: 0, project_id: 0, key: "Welcome", locale: "en" },
            { id: 1, project_id: 0, key: "About", locale: "en"},
            { id: 2, project_id: 0, key: "log in", locale: "en" },
            { id: 3, project_id: 0, key: "sign up", locale: "en" },
            { id: 4, project_id: 0, key: "more information", locale: "en"}
        ]
    });
    const createManyTranslations = await prisma.translation.createMany({
        data: [
            { id: 0, key_id: 0, locale: "da", translated_text: "Velkommen" },
            { id: 1, key_id: 1, locale: "da", translated_text: "Om" },
            { id: 2, key_id: 0, locale: "de", translated_text: "Wilkommen"}
        ]
    });
}

main();