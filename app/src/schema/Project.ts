import { required } from "vuelidate/lib/validators";
import DbDataConverter from "./DbDataConverter";
import {tstore} from "@/store/index"
import { ProjectStatusValueLiterals } from "@/store/modules/bundle";

class Project extends DbDataConverter<Project> {
  projectId : number = 0;
  projectTitle : string = "";
  status : ProjectStatusValueLiterals = "running";

  constructor(obj? : Record<string, any>, docId? : string) {
    super(docId)
    Object.keys(obj ?? {}).forEach(k => {
      //@ts-expect-error
      this[k] = obj[k]
    })
  }

  override toJSON() : Partial<Project> {
    return super.toJSONSuper()
  }
}

const projectValidator = (project : Project) => {
  return {
    projectId: {required},
    projectTitle: {required},
    status: {required},
  }
}

export { Project, projectValidator }