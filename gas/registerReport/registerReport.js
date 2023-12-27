function doPost(e) {
  if( ! e || ! e.parameter|| e.parameter === undefined || ! e.parameter.data || e.parameter.data === undefined) {
    console.log("Error: No data has been sent.")
    return ContentService.createTextOutput("no data has been sent.")
  }
  newRows = JSON.parse(e.parameter.data)
  if(checkDuplication(newRows)) {
    return ContentService.createTextOutput("duplicated")
  }
  const response = registerReport(newRows)
  
  return ContentService.createTextOutput("success")
}

function checkDuplication(newRows) {
  // Get the data excludes timestamp column which is unique for each data and not necessary for data comparison.
  const existingData = params.repSheet.getSheetValues(params.REP_FIRST_DATA_ROW,
                                                      params.REP_FIRST_INPUT_DATA_COLUMN,
                                                      params.repSheet.getLastRow() - (params.REP_FIRST_DATA_ROW - 1),
                                                      params.repSheet.getLastColumn() - (params.REP_FIRST_INPUT_DATA_COLUMN - 1))
  existingData.sort().reverse()
  var isDuplicated = false
  newRowsTemp = JSON.parse(JSON.stringify(newRows)) // To deep-copy the array
  newRowsTemp.some(newRow => {
    console.log(`newRow BEFORE: ${JSON.stringify(newRow)}`)
    newRow.shift() // Removes first column which is unique for each data and not necessary for data comparison.
    newRow[0] = new Date(newRow[0]).toISOString()
    console.log(`newRow AFTER: ${JSON.stringify(newRow)}`)
    existingData.some(existingRow => {
      console.log(`newRow: ${JSON.stringify(newRow)}`)
      console.log(`existingRow: ${JSON.stringify(existingRow)}`)
      if(JSON.stringify(newRow) === JSON.stringify(existingRow)) {
        isDuplicated = true
        //break inner "some" loop when found duplication
        return true
      }
    })
    //break outer "some" loop when found duplication
    return isDuplicated
  })

  return isDuplicated
}

function registerReport(newRows) {
  const lastRowNumber = params.repSheet.getLastRow()
  var lastRow = params.repSheet.getRange(lastRowNumber,1,1,params.repSheet.getLastColumn())

  newRows.forEach(newRow => params.repSheet.appendRow(newRow))
  console.log(`lastRow: ${JSON.stringify(lastRow.getValues())}`)

  // copy the format from last row of pre-insertion into rows inserted.
  lastRow.copyFormatToRange(params.repSheet,1,params.repSheet.getLastColumn(),lastRowNumber,params.repSheet.getLastRow())

  console.log(`newRows: ${JSON.stringify(newRows)}`)
  return newRows
}