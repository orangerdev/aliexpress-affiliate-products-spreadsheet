function writeLog(message) {
    SHEET_LOG.appendRow([
      CURRENT_DATETIME,
      message
    ])
}
