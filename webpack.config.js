const path = require('path');

module.exports = {
	resolve: {
		alias: {
			'./org.transcrypt.__runtime__.js': path.resolve(__dirname, 'transcrypt', 'org.transcrypt.__runtime__.js'),
		},
	},
	module: {
		rules: [{
			test: /\.py$/,
			use: [{
				loader: path.resolve("./py-loader-alt.js"),
			}]
		}]
	}
};
