export default {
  filters: {
    categoryTranslator(newValue, array1, array2) {
      let translation
      [...array1, ...array2].some(category => {
        if(category.value === newValue){
          translation = category.text
          return true
        }
      })
      return translation
    },
    forecastStatusTranslator(newValue) {
      return newValue === 'estimation' ? '見積'
          : newValue === 'result' ? '実績'
          : newValue
    },
    amountTranslator(newValue) {
      let isMinus = newValue.toString().includes('-')
      const intermediateValue = newValue.toString()
        .replace(/[^0-9]/g, '')   // Remove non-numeric literals
        .replace(/^0/, '')        // Remove leading 0 (such as when value === '0123')
        .slice(0, 11)             // Limit number to 10 billion
      return `${isMinus ? '-' : ''}¥${intermediateValue === "" ? 0 : parseFloat(intermediateValue).toLocaleString()}`
    },
    monthTranslator(newValue) {
      if(newValue == null) return
      const array = newValue.split('-').map(val => val.replace(/^0/, ''))
      return `${array[0]}年${array[1]}月度`
    },
    registeredAtTranslator(newValue) {
      if(newValue == null) return
      const array = newValue.split('-').map(val => val.replace(/^0/, ''))
      return `${array[0]}年${array[1]}月${array[2]}日`
    }
  }
}