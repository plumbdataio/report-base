function doGet() {
  const spoolNums = fetchSpoolnums()
  return ContentService.createTextOutput(JSON.stringify(spoolNums))
}

function fetchSpoolnums() {
  var vwSpoolnumRows = params.vwSheet.getRange(params.VW_FIRST_DATA_ROW,
                                      params.VW_SPOOLNUM_COLUMN_POSITION,
                                      params.vwSheet.getLastRow() - (params.VW_FIRST_DATA_ROW - 1)
                                    ).getValues()
  
  spoolNums = []
  vwSpoolnumRows.forEach(vwSpoolnumRow => {
    if(vwSpoolnumRow[0] !== "")
      spoolNums.push(vwSpoolnumRow[0])
  })

  return spoolNums
}