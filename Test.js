function myFunction() {
	writeLog("Duhai");
}

function getFirstActiveCategoryId() {
	const AliExpress = new AliExpressCLass();

	Logger.log(AliExpress.getFirstActiveCategoryId());
}

function checkDoneByCategoryId() {
	const AliExpress = new AliExpressCLass();

	Logger.log(AliExpress.checkDoneByCategoryId(34));
}

function loopCategory() {
	const AliExpress = new AliExpressCLass();

	const categoryId = AliExpress.getFirstActiveCategoryId();

	const isDone = AliExpress.checkDoneByCategoryId(categoryId);

	Logger.log(`Category ID: ${categoryId}, Is Done: ${isDone}`);
}
