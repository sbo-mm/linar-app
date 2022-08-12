//const { defineConfig } = require('@vue/cli-service')

const electronWinDims = {
	width: 800,
	height: 600
};

module.exports = {
	chainWebpack: (config) => {
		config.plugin('define').tap((definitions) => {
			definitions[0]['process.env']['PACKAGE_VERSION'] = JSON.stringify(require('./package.json').version);
			definitions[0]['process.env']['WINDOW_DIMS'] = JSON.stringify(electronWinDims);
			return definitions;
		});
	},
	transpileDependencies: true
}
