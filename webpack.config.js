const require = require('require');

module.exports = {
	resolve: {
		alias: {
			'./org.transcrypt.__runtime__.js': require.resolve(__dirname, 'transcrypt', 'org.transcrypt.__runtime__.js'),
		},
	},
	module: {
		rules: [{
			test: /\.py$/,
			use: [{
				loader: require.resolve("./py-loader-alt.js"),
			}]
		}]
	}
};
