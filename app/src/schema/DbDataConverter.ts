export default abstract class DbDataConverter<T> implements Record<string, any> {
  docId : string = "";

  constructor(docId? : string|null) {
    if(docId) {
      this.docId = docId
    }
  }

  abstract toJSON() : Partial<T>;
  toJSONSuper() : Partial<T> {
    const result : Partial<T> = {}
    Object.entries(this).forEach(([k, v]) => {
      if(v === undefined) {
        ( ! process.env.isTesting) ? console.error(`Warning: undefined value detected: key=${k}, value=${v}`) : ""
        return
      }

      if(Array.isArray(v)) {
        if(v.length === 0) {
          ( ! process.env.isTesting) ? console.error("Warning: empty array detected: it will not registered to database.") : ""
        }
        v = v.map(item => item?.toJSON != null ? item.toJSON() : item)
      } else if(typeof v == "object") {
        getEntries(v).forEach(([childK, childV]) => {
          v[childK] = childV?.toJSON ? childV?.toJSON() : childV
        })
      }

      //@ts-expect-error
      result[k] = v
    })

    //@ts-expect-error
    delete result.docId

    return result
  }
  getNameNormalized(name : string | undefined) : string {
    return name ? name.replace(/ |　|・/, "") : ""
  }
}

type Entries<T> = (keyof T extends infer U
  ? U extends keyof T
    ? [U, T[U]]
    : never
  : never)[]

function getEntries<T extends Record<string, unknown>>(obj: T): Entries<T> {
  return Object.entries(obj ?? {}) as Entries<T>
}
