class AliExpressCLass {
	constructor() {
		this.url = "https://portals.aliexpress.com/";
		this.category = "";
	}

	setCategory(category) {
		this.category = category;
	}

	/**
	 * Send request data to clickadu
	 * @param object params
	 */
	sendGetRequest(page, params) {
		let url = this.url + page;

		if (params instanceof Object) {
			url += "?";
			const Aparams = [];

			Object.keys(params).forEach((key) => {
				const value = params[key];
				if (value instanceof Array) {
					value.forEach((_v) => {
						Aparams.push(`${key}[]=${_v}`);
					});
				} else {
					if (value) {
						Aparams.push(`${key}=${value}`);
					}
				}
			});

			url = url + Aparams.join("&");
		}

		Logger.log(url);

		const response = UrlFetchApp.fetch(url, {
			headers: {
				Cookie: `xman_t=${CONFIG_COOKIE}`,
			},
			muteHttpExceptions: true,
		});

		return JSON.parse(response.getContentText());
	}

	getFirstActiveCategoryId() {
		// Ambil semua data dari sheet
		const data = SHEET_CATEGORY.getDataRange().getValues();

		// Loop melalui data, mulai dari baris kedua (baris pertama adalah header)
		for (let i = 1; i < data.length; i++) {
			const check = data[i][2]; // Kolom C (CHECK)
			const done = data[i][3]; // Kolom D (DONE)

			// Periksa apakah kolom C aktif (true) dan kolom D tidak aktif (false)
			if (check === true && done === false) {
				return data[i][1]; // Kolom B (ID)
			}
		}

		// Jika tidak ditemukan, kembalikan null
		return null;
	}

	checkDoneByCategoryId(targetId) {
		// Ambil semua data dari sheet
		const data = SHEET_CATEGORY.getDataRange().getValues();

		// Loop melalui data, mulai dari baris kedua (baris pertama adalah header)
		for (let i = 1; i < data.length; i++) {
			const id = data[i][1]; // Kolom B (ID)

			// Jika ID sesuai dengan targetId
			if (id == targetId) {
				// Cek checkbox pada kolom D (DONE)
				SHEET_CATEGORY.getRange(i + 1, 4).setValue(true); // Baris ke-(i+1), Kolom 4 (D)
				return true;
			}
		}

		// Jika ID tidak ditemukan
		return false;
	}

	/**
	 * Parse Currency
	 */
	parseCurrency(value) {
		// Menghapus karakter non-digit dan non-desimal
		const numberString = value.replace(/[^0-9.-]+/g, "");
		// Mengonversi string menjadi float
		return parseFloat(numberString);
	}

	stopCrawl() {
		SHEET_CONFIG.getRange("B14").setValue("y");
	}

	/**
	 * Get affiliate products
	 */
	getProducts() {
		const enable = CONFIG_ENABLE;

		if (enable == "") {
			writeLog("Product crawl disabled");
			return;
		}

		const stopCrawl = CONFIG_STOP_CRAWL;

		if (stopCrawl != "") {
			return;
		}

		const freeShipping = CONFIG_FREE_SHIPPING ? "y" : "";
		const requireCouponCode = CONFIG_REQUIRE_COUPON ? "y" : "";
		const shipTo = CONFIG_SHIP_TO;
		const shipFrom = CONFIG_SHIP_FROM;
		const currency = CONFIG_CURRENCY ?? "usd";
		const language = CONFIG_LANG ?? "en_EN";
		const type = CONFIG_TYPE ?? "1";
		const pageNum = CONFIG_CURRENT_PAGE;
		const categoryId = this.category ?? CONFIG_CATEGORY;

		const response = this.sendGetRequest("material/productRecommend.do", {
			requireCouponCode,
			freeShipping,
			shipTo,
			shipFrom,
			currency,
			language,
			pageNum,
			pageSize: CONFIG_PAGE_LIMIT,
			type,
			categoryId,
		});

		// check response
		if (!response || response?.code != "00" || !response?.success) {
			writeLog(
				`CANT GET PRODUCT` +
					`requireCouponCode: ${requireCouponCode}|` +
					`freeShipping: ${freeShipping}|` +
					`shipTo: ${shipTo}| ` +
					`shipFrom: ${shipFrom}| ` +
					`currency: ${currency}| ` +
					`language: ${language}| ` +
					`type: ${type}| ` +
					`pageNum: ${pageNum}| ` +
					`category: ${categoryId}`,
			);

			this.stopCrawl();
			return;
		}

		// check if no product in results
		if (response.data?.results?.length === 0) {
			writeLog(`Return products = 0`);
			this.checkDoneByCategoryId(categoryId);
			SHEET_CONFIG.getRange("B13").setValue("1");

			return;
		}

		const data = response.data;

		// check if it reaches the end
		if (data?.finish) {
			writeLog(`Reached the end of the crawl`);
			this.stopCrawl();
			return;
		}

		data.results.forEach((product) => {
			const cartAdd30 = parseInt(product?.cartAdd30);
			const comment30Day = parseInt(product?.comment30Day);
			const commentScore = parseFloat(product?.commentScore);
			const commission = parseFloat(product?.directCommissionRate);
			const productUrl = product?.itemUrl;
			const productName = product?.itemTitle;
			const productImg = product?.itemMainPic;
			const productPrice = parseFloat(
				this.parseCurrency(product?.itemOriginPriceMin),
			);
			const sales30 = parseInt(product?.sales30Day);
			const hotSales = Boolean(product?.sales30DayHot);
			const itemId = product?.itemId;

			const nextRow = SHEET_PRODUCT.getLastRow() + 1;

			SHEET_PRODUCT.getRange(nextRow, 2, 1, 14).setValues([
				[
					itemId,
					productImg,
					"",
					productName,
					productUrl,
					productPrice,
					(productPrice * commission) / 100,
					commission,
					cartAdd30,
					comment30Day,
					commentScore,
					sales30,
					hotSales,
					categoryId,
				],
			]);

			SHEET_PRODUCT.getRange(`A${nextRow}`).insertCheckboxes();
			SHEET_PRODUCT.getRange(`D${nextRow}`).setFormula(
				`=IMAGE("${productImg}")`,
			);
		});

		writeLog(
			`Found products: ${data.results.length} |` +
				`requireCouponCode: ${requireCouponCode}|` +
				`freeShipping: ${freeShipping}|` +
				`shipTo: ${shipTo}| ` +
				`shipFrom: ${shipFrom}| ` +
				`currency: ${currency}| ` +
				`language: ${language}| ` +
				`type: ${type}| ` +
				`pageNum: ${pageNum}| ` +
				`category: ${categoryId}`,
		);

		// update last update

		SHEET_CONFIG.getRange("B17").setValue(CURRENT_DATETIME);

		const nextPageNum = pageNum + 1;

		if (nextPageNum >= CONFIG_MAX_PAGE + 1) {
			writeLog(
				`Page number ${pageNum} exceeds maximum page limit ${CONFIG_MAX_PAGE}. Next crawling.`,
			);
			this.checkDoneByCategoryId(categoryId);
			SHEET_CONFIG.getRange("B13").setValue("1");
			return;
		} else {
			SHEET_CONFIG.getRange("B13").setValue(nextPageNum);
		}
	}

	/*
	 * Save images and product details to Google Drive
	 * @param {string} productId
	 * @param {string} productName
	 * @param {Array} creativityImages
	 * @param {Object} productDetails
	 */
	setToGoogleDrive(productId, productName, creativityImages, productDetails) {
		const folderId = CONFIG_FOLDER_ID;
		const today = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

		// Get or create the main folder for today's date
		const parentFolder = DriveApp.getFolderById(folderId);
		let dateFolder;
		const folders = parentFolder.getFoldersByName(today);
		if (folders.hasNext()) {
			dateFolder = folders.next();
		} else {
			dateFolder = parentFolder.createFolder(today);
		}

		// Create a folder for the productId inside the date folder
		let productFolder;
		const productFolders = dateFolder.getFoldersByName(productId);
		if (productFolders.hasNext()) {
			productFolder = productFolders.next();
		} else {
			productFolder = dateFolder.createFolder(productId);
		}

		// Save images to the product folder
		creativityImages.forEach((image, index) => {
			const imageUrl = image.imageUrl;
			const response = UrlFetchApp.fetch(imageUrl);
			const blob = response.getBlob();

			// Format the image name using a sluggish version of the product name
			const sluggishName = productName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "");
			const imageName = `${sluggishName}-${index + 1}.jpg`;

			// Save the image to the product folder
			productFolder.createFile(blob.setName(imageName));
		});

		// Create a .txt file with product details
		const productDetailsContent = `
Product Name: ${productDetails.productName}
Promote URL: ${productDetails.promoteUrl}
Origin Price: ${productDetails.originPrice}
Current Price: ${productDetails.currentPrice}
Discount Rate: ${productDetails.discountRate}
        `.trim();

		const txtFileName = `${productName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")}.txt`;

		productFolder.createFile(txtFileName, productDetailsContent);
	}

	getAffiliateProductLink(productId) {
		const trackingId = CONFIG_TRACKER_ID;
		const language = CONFIG_LANG ?? "en_EN";
		const shipTo = CONFIG_SHIP_TO;
		const currency = CONFIG_CURRENCY ?? "USD";

		if (parseInt(productId) === 0) {
			return;
		}

		const response = this.sendGetRequest("promote/promoteNow.do", {
			productId,
			language,
			trackingId,
			shipTo,
			currency,
		});

		if (!response || response?.code != "00" || !response?.success) {
			writeLog(
				`CANT GET AFFILIATE PRODUCT ` +
					`productId: ${productId}|` +
					`trackingId: ${trackingId}|` +
					`language: ${language}|` +
					`shipTo: ${shipTo}|` +
					`currency: ${currency}`,
			);

			return false;
		}

		if (!response?.data?.promoteUrl || response?.success === false) {
			writeLog(
				`INVALID AFFILIATE PRODUCT LINK ` +
					`productId: ${productId}|` +
					`trackingId: ${trackingId}|` +
					`language: ${language}|` +
					`shipTo: ${shipTo}|` +
					`currency: ${currency}`,
			);

			return false;
		}

		return response.data.promoteUrl;
	}

	/**
	 * Get affiliate product data based on productID
	 * @param {string} productId
	 * @returns {object} product
	 */
	getAffiliateProduct(productId) {
		const trackingId = CONFIG_TRACKER_ID;
		const language = CONFIG_LANG ?? "en_EN";
		const shipTo = CONFIG_SHIP_TO;
		const currency = CONFIG_CURRENCY ?? "USD";

		if (parseInt(productId) === 0) {
			return;
		}

		const response = this.sendGetRequest("promote/promoteNow.do", {
			productId,
			language,
			trackingId,
			shipTo,
			currency,
		});

		if (!response || response?.code != "00" || !response?.success) {
			writeLog(
				`CANT GET AFFILIATE PRODUCT ` +
					`productId: ${productId}|` +
					`trackingId: ${trackingId}|` +
					`language: ${language}|` +
					`shipTo: ${shipTo}|` +
					`currency: ${currency}`,
			);

			return;
		}

		if (!response?.data?.promoteUrl || response?.success === false) {
			writeLog(
				`INVALID AFFILIATE PRODUCT LINK ` +
					`productId: ${productId}|` +
					`trackingId: ${trackingId}|` +
					`language: ${language}|` +
					`shipTo: ${shipTo}|` +
					`currency: ${currency}`,
			);

			return;
		}

		// Proses daftar gambar
		const creativityImages = response.data.creativityImages || [];
		const imageUrls = creativityImages.map(
			(image) => `=HYPERLINK("${image.imageUrl}", "View Image")`,
		);

		const nextRow = SHEET_AFFILIATE.getLastRow() + 1;

		SHEET_AFFILIATE.getRange(nextRow, 2, 1, 6).setValues([
			[
				productId,
				response.data.productName,
				response.data.promoteUrl,
				response.data?.originPrice,
				response.data?.currentPrice,
				response.data?.discountRate,
			],
		]);

		imageUrls.forEach((url, index) => {
			SHEET_AFFILIATE.getRange(nextRow, 8 + index).setValue(url);
		});

		SHEET_AFFILIATE.getRange(`A${nextRow}`).insertCheckboxes();

		// Call setToGoogleDrive
		this.setToGoogleDrive(
			productId,
			response.data.productName,
			creativityImages,
			{
				productName: response.data.productName,
				promoteUrl: response.data.promoteUrl,
				originPrice: response.data.originPrice,
				currentPrice: response.data.currentPrice,
				discountRate: response.data.discountRate,
			},
		);

		Logger.log(response);
	}
}
