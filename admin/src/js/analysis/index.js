import calcLaborCost from './modules/calcLaborCost.js'
import calcCostPerWork from './modules/calcCostPerWork.js'

export default {
  ...calcLaborCost,
  ...calcCostPerWork
}