function aliExPressGetProducts() {
	const AliExpress = new AliExpressCLass();

	AliExpress.getProducts();
}

function resetButton() {
	const startCell = SHEET_PRODUCT.getRange("A2:N");

	resetSheet(SHEET_PRODUCT, startCell);

	SHEET_CONFIG.getRange("B13").setValue(1);
	SHEET_CONFIG.getRange("B14").setValue("");
}

function onOpen() {
	var ui = SpreadsheetApp.getUi();
	ui.createMenu("AliExpress")
		.addItem("Generate Affiliate Links", "showGenerateAffiliateLinksSidebar")
		.addToUi();
}

function uncheckProductByID(productID) {
	const data = SHEET_PRODUCT.getDataRange().getValues();

	for (let i = 0; i < data.length; i++) {
		// Asumsikan ID produk ada di kolom B
		if (data[i][1] === productID) {
			// Set checkbox (kolom A) menjadi false
			SHEET_PRODUCT.getRange(i + 1, 1).setValue(false);
			break;
		}
	}
}

function getCheckedProductIDs() {
	const data = SHEET_PRODUCT.getDataRange().getValues();
	const checkedProducts = [];

	for (let i = 1; i < data.length; i++) {
		if (data[i][0] === true) {
			// Asumsikan checkbox ada di kolom A, ID produk di kolom B, dan data tambahan di kolom E
			const productID = data[i][1];
			const additionalData = data[i][4]; // Kolom E (indeks 4)
			checkedProducts.push({
				row: i + 1,
				productID,
				additionalData,
			});
		}
	}
	return checkedProducts;
}

function showGenerateAffiliateLinksSidebar() {
	// Mengatur konten baru ke objek HTML
	var htmlTemplate = HtmlService.createHtmlOutputFromFile("Sidebar")
		.setTitle("AliExpress Affiliate Generator")
		.setWidth(300);

	// Menampilkan sidebar
	SpreadsheetApp.getUi().showSidebar(htmlTemplate);
}

function generateAffiliateLinksButton() {
	const products = getCheckedProductIDs();

	const AliExpress = new AliExpressCLass();

	try {
		products.forEach((product) => {
			Logger.log({
				row: product.row,
				productID: product.productID,
				additionalData: product.additionalData,
			});

			AliExpress.getAffiliateProduct(product.productID);
		});
	} catch (error) {
		Logger.log("Error: " + error.message);
	}
}

function doGet() {
	// Ambil data dari sheet CONFIG untuk "last-update"
	const lastUpdate = SHEET_CONFIG.getRange("B17").getValue(); // Asumsikan "last-update" ada di cell B17

	// Ambil data dari sheet PRODUCT
	const productData = SHEET_PRODUCT.getDataRange().getValues();

	// Buat array untuk menyimpan data produk
	const products = [];

	// Loop melalui data produk, mulai dari baris kedua (baris pertama adalah header)
	for (let i = 1; i < productData.length; i++) {
		const row = productData[i];
		products.push({
			productId: row[1], // Kolom 2
			imageUrl: row[2], // Kolom 3
			productName: row[4], // Kolom 5
			price: row[6], // Kolom 7
			commission: row[7], // Kolom 8
			commissionPercentage: row[8], // Kolom 9
			totalItemsInCart: row[9], // Kolom 10
			totalComments: row[10], // Kolom 11
			commentScore: row[11], // Kolom 12
			totalSales: row[12], // Kolom 13
			isHotProduct: row[13], // Kolom 14
		});
	}

	// Buat objek JSON untuk response
	const response = {
		"last-update": lastUpdate,
		data: {
			products: products,
			total: products.length, // Jumlah total produk
		},
	};

	// Kembalikan response dalam format JSON
	return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
		ContentService.MimeType.JSON,
	);
}
