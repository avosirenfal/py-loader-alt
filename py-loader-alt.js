const cmd = require('node-cmd');
const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

const spawn = require('child_process').spawn;

const EOL = require('os').EOL;

module.exports = function(source) {
	this.cacheable();

	const compilers = {
		transcrypt: {
			build: function(source_in, src_path, callback) {
				let args = ['-b', '-n', '-m', src_path];
				let proc = spawn('transcrypt', args);

				let data = '';
				let error = '';

				let rootContext = this.rootContext;

				proc.stdout.on('data', function(stdout) {
					data += stdout;
				});

				proc.stderr.on('data', function(stderr) {
					error += stderr;
				});

				proc.on('error', function(err) {
					callback(err);
				});

				proc.on('exit', function(code) {
					try {
						if(code !== 0) {
							callback(new Error(`Transpile failed: ${data}`));
							return;
						}

						const src_info = path.parse(src_path);

						let target_dir = path.join(src_info.dir, '__target__');
						let source = fs.readFileSync(path.join(target_dir, src_info.name + '.js'), 'utf8');
						let sourcemap = fs.readFileSync(path.join(target_dir, src_info.name + '.map'), 'utf8');
						let output_dir = path.join(rootContext, 'transcrypt');

						if(!fs.existsSync(output_dir)) {
							fs.mkdirSync(output_dir);
						}

						fs.copyFileSync(
							path.join(target_dir, 'org.transcrypt.__runtime__.js'),
							path.join(output_dir, 'org.transcrypt.__runtime__.js')
						);

						let files = fs.readdirSync(target_dir);
						// __target__ should never have directories, but sanity check just in case
						let clear = true;

						for(let i = 0; i < files.length; i++) {
							let fn = path.join(target_dir, files[i]);
							let stat = fs.lstatSync(fn);

							if(!stat.isDirectory()) {
								fs.unlinkSync(fn);
							} else {
								clear = false;
							}
						}

						if(clear)
							fs.rmdirSync(target_dir);

						sourcemap = JSON.parse(sourcemap);

						// webpack requires that the source code be included in the sourcemap...
						if(sourcemap.sourcesContent === undefined) {
							sourcemap['sourcesContent'] = [source_in]
						}

						sourcemap = JSON.stringify(sourcemap);

						callback(null, source, sourcemap);
					} catch(err) {
						callback(err);
					}
				});
			}
		},
		javascripthon: {
			build: function(source_in, src_path, callback) {
				let args = ['--inline-map', '--source-name', src_path, '-s', '-'];
				let proc = spawn('pj', args);

				let data = '';
				let error = '';

				proc.stdin.write(source_in);

				proc.stdout.on('data', function(stdout) {
					data += stdout;
				});

				proc.stderr.on('data', function(stderr) {
					error += stderr;
				});

				proc.on('error', function(err) {
					callback(err);
				});

				proc.on('exit', function(code) {
					try {
						if(code !== 0) {
							callback(new Error(`Transpile failed: ${error}`));
							return;
						}

						let sourcemap = null;
						const split = data.split(/\r?\n/);

						for(let i = 0; i < split.length; i++) {
							if(split[i].startsWith('//# sourceMappingURL=')) {
								sourcemap = split[i];
								split[i] = '';
								break;
							}
						}

						let source = split.join(EOL).replace(new RegExp(/\s*$/, 'g'),'');
						sourcemap = sourcemap.replace('//# sourceMappingURL=data:text/json;base64,', '');
						sourcemap = Buffer.from(sourcemap, 'base64').toString();

						callback(null, source, sourcemap);
					} catch(err) {
						callback(err);
					}
				});

				proc.stdin.end();
			}
		}
	};

	const options = loaderUtils.getOptions(this);
	const compilerName = options && options.compiler || 'transcrypt';
	const compiler = compilers[compilerName];

	if (!compiler) {
		throw new Error(`py-loader-alt only supports ${
				listify(Object.keys(compilers).map(properName))
			} compilers.`);
	}

	const finish = this.async();
	const source_path = this.resourcePath;

	let local_callback = function(err, result, sourcemap) {
		if(err !== null) {
			err.message = 'Error occured while transpiling: ' + err.message;
			console.error(`${err}`);
			finish(err);
			return;
		}

		finish(null, result, sourcemap);
	};

	try {
		compiler.build.call(this, source, source_path, local_callback);
	} catch(err) {
		local_callback(err);
	}

};
