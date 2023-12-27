function fillData() {
  const repLastRow = params.repSheet.getLastRow()
  let repLastCol = params.repSheet.getLastColumn()
  let repRange = params.repSheet.getRange(params.REP_FIRST_DATA_ROW,1,repLastRow-(params.REP_FIRST_DATA_ROW-1),repLastCol).sort(params.REP_SPOOLNUM_COLUMN_POSITION)
  let repValues = repRange.getValues()

  const vwLastRow = params.vwSheet.getLastRow()
  let vwSpoolnums = params.vwSheet.getRange(params.VW_FIRST_DATA_ROW,params.VW_SPOOLNUM_COLUMN_POSITION,vwLastRow-(params.VW_FIRST_DATA_ROW-1)).getValues()

  for(let vwSpoolNumIndex = 0; vwSpoolNumIndex < vwSpoolnums.length; ++vwSpoolNumIndex) {
    let vwSpoolNum = vwSpoolnums[vwSpoolNumIndex][0]
    if(vwSpoolNum === "")
      continue

    // Clear the data already exists on params.vwSheet
    let dataRowCursor = params.VW_FIRST_DATA_ROW + vwSpoolNumIndex
    var vwRangeDeleted = params.vwSheet.getRange(dataRowCursor + params.VW_INSERTPOINT_OFFSET,
                                          params.VW_FIRST_WELDINGPOINT_COLUMN_POSITION,
                                          params.VW_ASSEMBLETYPE_OFFSET * 2,
                                          params.vwSheet.getLastColumn() - params.VW_FIRST_WELDINGPOINT_COLUMN_POSITION)
    vwRangeDeleted.setValue("")


    // Insert the data
    for(const repRow of repValues) {
      if(repRow[params.REP_SPOOLNUM_COLUMN_POSITION - 1] !== vwSpoolNum)
        continue
      
      let data = [[repRow[params.REP_DATE_COLUMN_POSITION-1]],[repRow[params.REP_NAME_COLUMN_POSITION-1].toString().replace(/ |　/,"\n")]]
      var weldingPointNums = repRow[params.REP_WELDINGPOINTNUM_COLUMN_POSITION-1]

      for(const weldingPoint of weldingPointNums.toString().split(',')) {
        let vwFinalAssembleOffset = 0
        if(repRow[params.REP_ASSEMBLETYPE_COLUMN_POSITION] === params.REP_ASSEMBLETYPE_FINAL)
          vwFinalAssembleOffset = params.VW_ASSEMBLETYPE_OFFSET
        var dataRange = params.vwSheet.getRange(dataRowCursor + params.VW_INSERTPOINT_OFFSET + vwFinalAssembleOffset,
                                         params.VW_FIRST_WELDINGPOINT_COLUMN_POSITION + (Number.parseInt(weldingPoint) - 1),
                                         params.VW_ASSEMBLETYPE_OFFSET)
        dataRange.setValues(data)
      }
    }
  }
}