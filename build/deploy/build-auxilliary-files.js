const denodeify = require('denodeify');
const path = require('path');
const fs = require('fs');
const readFile = denodeify(fs.readFile);
const writeFile = denodeify(fs.writeFile);

const expectedBuiltFiles = require('./expected-built-files');

function expectedAssets () {
	return Promise.resolve(
		expectedBuiltFiles
			.map(filename => {
				if(!fs.existsSync(path.join(process.cwd(), 'public/n-ui', filename))) {
					throw new Error(`${filename} has not been built`);
				}
				return `./public/n-ui/${filename}`;
			})
	);
}

const generateAssetHashes = require('../lib/generate-asset-hashes');

expectedAssets()
	.then(() => generateAssetHashes('public/n-ui', true))
	.then(() => process.exit(0))
	.catch(err => {
		console.log(err) //eslint-disable-line
		process.exit(2);
	});
