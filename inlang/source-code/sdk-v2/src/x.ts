const project = loadProjectV1()




type Bundle = {
	id: string
	alias: Record<string, string>
}

type Bundle2 = {
	identifier: string
	alias: Record<string, string>
}

type BundleApp = {
  id: string
	alias: Record<string, string>
}

// @deprecated
project.bundle.select().where("id", "=", "blabla")

// inlang sdk 1.6 -> computed virtual table
project.bundle2.select().where("identifier", "=", "blabla")

// inlang sdk 1.6 -> map "identifier" -> "id"
project.bundle2.insert().where("identifier", "=", "blabla")

// inlang sdk 2.0
project.bundle2.select().where("identifier", "=", "blabla")
project.bundle2.insert().where("identifier", "=", "blabla")


project.bundleapp.select().where("id", "=", "blabla")

// inlang sdk 1.6
project.bundle.get()
project.bundle2.get()

// inlang sdk 2.0
project.bundle2.get()
