var testConsole = {
	log: function () {
		if (process.env.SHOW_LOGS === 'true') {
			console.log.apply(this, arguments);
		}
	}
};

module.exports = {
	requireModule: function (path) {
		return require((process.env.APP_DIR_FOR_CODE_COVERAGE || '../') + path);
	}
};