const Scraper = require("@molfar/scanany")

const test = async () => {
	const YAML = require("js-yaml")
	const path = require("path")
	
	let filepath = path.resolve(process.argv[2])
	
	let source = require("fs").readFileSync(filepath).toString().replace(/\t/gm, " ")
	let script = YAML.load(source)

	let paramsFilepath = (process.argv[3]) ? path.resolve(process.argv[3]) : null

	let params, data

	if (paramsFilepath) {
		data = require("fs").readFileSync(paramsFilepath).toString().replace(/\t/gm, " ")
		params = YAML.load(data)
	} 

	let scraper = new Scraper()
	let result = await scraper.execute(script, params)
	
	console.log("---------------------------------------------------------------")
	console.log(`Debug scanany script: ${filepath}`)
	console.log()
	console.log(source)
	console.log("---------------------------------------------------------------")
	
	if(paramsFilepath) {
		console.log(`Call with params: ${paramsFilepath}`)
		console.log()
		console.log(data)
		console.log("---------------------------------------------------------------")
	}
	
	console.log("Scanany result:")
	console.log()
	console.log(result)
	console.log("---------------------------------------------------------------")
	
	// process.exit(0)
}

test()