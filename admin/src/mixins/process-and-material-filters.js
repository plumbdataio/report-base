export default {
  filters: {
    processAndMaterialTranslator(origStr, options) {
      if(['','none'].includes(origStr))
        return "-"

      let japanese = origStr
      options.some(option => {
        if(option.value === origStr) {
          japanese = option.text
          return true
        }
      })
      return japanese 
    },
  }
}