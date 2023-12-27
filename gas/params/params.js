/** Constants which describe data structure of Sheets*/
var SHEET_FILE_ID = "1_kdvHdcYmWnMGpHgtoP2X8Az4mdBoL0RXXgvFe01uFo"
/** Report sheet = "REP" */
var REP_SHEET_NAME = "回答"
var REP_FIRST_DATA_ROW = 2
var REP_FIRST_INPUT_DATA_COLUMN = 2
var REP_DATE_COLUMN_POSITION = 2
var REP_NAME_COLUMN_POSITION = 3
var REP_ASSEMBLETYPE_COLUMN_POSITION = 3
var REP_SPOOLNUM_COLUMN_POSITION = 5
var REP_WELDINGPOINTNUM_COLUMN_POSITION = 6
var REP_ASSEMBLETYPE_TEMP = "仮付"
var REP_ASSEMBLETYPE_FINAL = "本組"
/** View sheet = "VW" */
var VW_SHEET_NAME = "進捗管理"
var VW_FIRST_DATA_ROW = 3
var VW_INSERTPOINT_OFFSET = 5
var VW_SPOOLNUM_COLUMN_POSITION = 1
var VW_ASSEMBLETYPE_OFFSET = 2
var VW_FIRST_WELDINGPOINT_COLUMN_POSITION = 6

/** Other variables*/
var sheets = SpreadsheetApp.openById(SHEET_FILE_ID).getSheets()
var repSheet
var vwSheet
for(var i = 0; i < sheets.length; i++) {
  if(sheets[i].getSheetName() === REP_SHEET_NAME)
    repSheet = sheets[i]
  else if(sheets[i].getSheetName() === VW_SHEET_NAME)
    vwSheet = sheets[i]
}