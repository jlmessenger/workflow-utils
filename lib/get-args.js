function getArgs (executedFilename) {
	const scriptIdx = process.argv.findIndex((arg) => executedFilename.startsWith(arg));
	return process.argv.slice(scriptIdx + 1)
}

module.exports = getArgs
