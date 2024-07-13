import { tstore } from '@/store/index'

/**
 * Use this func instead of Object.keys(), to make keys infereble string.
 * @template T
 * @param {T} obj
 * @return {*}  {(keyof T)[]}
 */
export const getKeys = <T extends{[key: string]: unknown}>(obj: T): (keyof T)[] => Object.keys(obj)
const optionsKeyList = getKeys(tstore.bundles.options)

export const $optionValueTo =
  <
   T extends typeof optionsKeyList[number],
   R extends typeof tstore.bundles.options[T][number],
   K extends keyof R,
  >(optionName: T, value : string, propName? : K) : R[K] => {
  if( ! propName) {
    propName = "text" as K
  }
  const resultObject = tstore.bundles.options[optionName].find((option: R) =>  option.value == value) as R
  if( ! resultObject ) {
    throw Error(`Error: No match to value='${value}' on option optionName='${String(optionName)}'`)
  }

  return resultObject[propName]
}

export const extractInvalidProps = (obj : {[key: string]: any}) => {
  const currentLayer : {[key: string]: any} = {}
  let hasInvalid = false
  Object.keys(obj).forEach(key => {
    if(key === "$invalid" && obj[key] === true) {
      currentLayer.$invalid = true
      hasInvalid = true
    } else if(key === "$each" || ! key.startsWith("$")) {
      const childLayerResult = extractInvalidProps(obj[key])
      if(childLayerResult !== "none") {
        currentLayer[key] = childLayerResult
      }
    }
  })
  return hasInvalid ? currentLayer : "none"
}
