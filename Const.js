const SHEET = SpreadsheetApp.getActiveSpreadsheet();
const SHEET_CONFIG = SHEET.getSheetByName("CONFIG");
const SHEET_CATEGORY = SHEET.getSheetByName("CATEGORY");
const SHEET_PRODUCT = SHEET.getSheetByName("PRODUCT");
const SHEET_AFFILIATE = SHEET.getSheetByName("AFFILIATE");
const SHEET_LOG = SHEET.getSheetByName("LOG");

const CONFIG_COOKIE = SHEET_CONFIG.getRange("B1").getValue();
const CONFIG_ENABLE = SHEET_CONFIG.getRange("B2").getValue();
const CONFIG_REQUIRE_COUPON = SHEET_CONFIG.getRange("B3").getValue();
const CONFIG_FREE_SHIPPING = SHEET_CONFIG.getRange("B4").getValue();
const CONFIG_SHIP_FROM = SHEET_CONFIG.getRange("B5").getValue();
const CONFIG_SHIP_TO = SHEET_CONFIG.getRange("B6").getValue();
const CONFIG_CATEGORY = SHEET_CONFIG.getRange("B7").getValue();
const CONFIG_CURRENCY = SHEET_CONFIG.getRange("B8").getValue();
const CONFIG_LANG = SHEET_CONFIG.getRange("B9").getValue();
const CONFIG_PAGE_LIMIT = SHEET_CONFIG.getRange("B10").getValue();
const CONFIG_TYPE = SHEET_CONFIG.getRange("B11").getValue();
const CONFIG_MAX_PAGE = parseInt(SHEET_CONFIG.getRange("B12").getValue());
const CONFIG_CURRENT_PAGE = SHEET_CONFIG.getRange("B13").getValue();
const CONFIG_STOP_CRAWL = SHEET_CONFIG.getRange("B14").getValue();

const CONFIG_TRACKER_ID = SHEET_CONFIG.getRange("B15").getValue();
const CONFIG_FOLDER_ID = SHEET_CONFIG.getRange("B16").getValue();
const CONFIG_LAST_UPDATE = SHEET_CONFIG.getRange("B17").getValue();

const CONFIG_SYNC_TOKEN = SHEET_CONFIG.getRange("B18").getValue();

const CURRENT_DATETIME = Utilities.formatDate(
	new Date(),
	"GMT+7",
	"MM/dd/yyyy HH:mm:ss",
);
