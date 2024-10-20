import type { ProjectSettings } from "@inlang/project-settings";
import type { InlangProject } from "./api.js";
import { expectType } from "tsd";

const project: InlangProject = {} as any;

// it should not have potentially undefined settings.
expectType<ProjectSettings>(project.settings());
