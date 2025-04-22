function writeLog(message) {
	SHEET_LOG.appendRow([CURRENT_DATETIME, message]);
}

function resetSheet(sheet, startCell) {
	const startRow = startCell.getRow();
	const startColumn = startCell.getColumn();

	const lastRow = sheet.getLastRow();
	const lastColumn = sheet.getLastColumn() + 1;

	if (lastRow < startRow || lastColumn < startColumn) {
		Logger.log("No data available to clear.");
		return;
	}

	const range = sheet.getRange(
		startRow,
		startColumn,
		lastRow - startRow + 1,
		lastColumn - startColumn + 1,
	);

	range.clearContent();
}
