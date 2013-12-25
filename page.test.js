PAGE.extend(function(puppy, dog, log) {

	var results = []
	var allTestFiles = []
	var onFinished = []

	dog.test = {
		results : results
		, addTests : dog.addTests = addTests
		, allTestFiles : dog.allTestFiles = allTestFiles
		, runTest : dog.runTest = runTest
		, runAllTests : dog.runAllTests = runAllTests
		, activeTests : []
		, index : 0
		, onFinished : function(func) {
			onFinished.push(func)
		}
		, _testData : dog._testData = {}
		, totalPass : 0
		, totalFail : 0
	}

	// this overrides the PAGE.add method !
	// modify add method to include path to test
	dog.add = function(path, obj, test) {
		if (typeof path === "undefined") return
		var arr = path.split(".")
		if (arr.length < 2) return
		var group = arr[0]
			, item = arr[1]
		if (!puppy[group]) puppy[group] = {}
		if (test) {
			// all arguments after path and object are considered test files
			for(var x = 2; x < arguments.length; x++) {
				allTestFiles.push(arguments[x])
			}
		}
		return puppy[group][item] = obj
	}

	function clean(str) { return str.replace(/\./g,"_") }
	function cleanReverse(str) { return str.replace(/_/g,".") }

	function finishedResults(results) {

		for(var x = 0; x < results.length; x++) {
			if (results[x].result) dog.test.totalPass += 1  
			else dog.test.totalFail += 1
		}

		var temp = {
			"Total Tests" :	{   count : Number(dog.test.totalPass + dog.test.totalFail) }
			, "Total Passed" :	{  count : dog.test.totalPass }
			, "Total Failed" : {  count : dog.test.totalFail }
		}

		console.groupEnd()

		console.table(temp, [ "count" ])

		dog.test.totalPass = 0
		dog.test.totalFail = 0

	}

	dog.test.onFinished(finishedResults)

	var loadScript = function(pathToFile) {
		var scriptId = clean(pathToFile)
			, existingElm = document.getElementById(scriptId)

		if (existingElm) {
			existingElm.parentElement.removeChild(existingElm)
		}

		var fileref = document.createElement('script')
		fileref.setAttribute("type","text/javascript")
		fileref.setAttribute("src", pathToFile + "?" + (String(Math.random()).replace(/\./,""))) // randomize
		fileref.setAttribute("id", scriptId)
		document.getElementsByTagName("head")[0].appendChild(fileref)
	}

	function addTests(path, func /* (Constructor, Test, TestWaiter, comparer) */ ) {

		var scout = {
			syncTests : []
			, asyncTests : []
		}


		function Test(testName, resultFunc) {

			scout.syncTests.push(function() {
				var result = {
					name : testName
					, result : resultFunc()
					, test : resultFunc
					, path : path
					, func : func
				}
				results.push(result)
				if (result.result) {
					console.groupCollapsed(result.name, "\u2714 passed")
					console.log(result)
					console.groupEnd()
				} else {
					console.error(result.name, "\u2716 failed")
					console.log(result)
				}
			})

			scout.syncTests.shift()()

		}

		function TestWaiter(testName, resultFunc /* (series, go, call) */ ) {
			var series = scout.asyncTests

			function go() {
				if (series.length > 0) {
					series[0]()
				} else {
				}
			}

			function call(result) {
				results.push(result)
				if (result.result) {
					console.groupCollapsed(testName + ": ", result.name, "\u2714 passed")
					console.log(result)
					console.groupEnd()
				} else {
					console.error(testName + ": ", result.name, "\u2716 failed")
					console.error(result)
				}
				series.shift()
			}

			resultFunc(series, go, call)
		}

		function toShortString(obj) {
			var split = obj.toString().split("()")[0].split("function ")[1]
			if (split === "(e,t){return new x.fn.init(e,t,r)}") {
				return "jQuery"
			} else {
				return split
			}
		}

		function comparer(module, propertiesWithTypes) {
			var truthy = true

			typeof console === "object" && console.groupCollapsed("details")

			if (!module) {
				typeof console === "object" && console.error("length: ", x, "\u2716")
				return typeof console === "object" && console.groupEnd()
			}

			for (var x in propertiesWithTypes) {
				// if (typeof module[x] === "undefined") return false
				
				var run = true

				if (!propertiesWithTypes[x].empty && module[x] === undefined) {
					typeof console === "object" && console.error(x + " is undefined", x, "\u2716")
					truthy = false
					run = false
				}

				if (typeof propertiesWithTypes[x].empty !== "undefined") {
					if (module[x] !== undefined) {
						typeof console === "object" && console.error("value: ", x, "\u2716")
						typeof console === "object" && console.info("value should be undefined")
						truthy = false
					} else {
						typeof console === "object" && console.log("value: ", x, "\u2714")
					}
				}

				if (run && propertiesWithTypes[x].like) {
					if (module[x].constructor.toString() !== propertiesWithTypes[x].like.constructor.toString()) {
						typeof console === "object" && console.error("likeness: ", x, "\u2716")
						typeof console === "object" && console.info("value should be:", toShortString(module[x].constructor))
						truthy = false
					} else {
						typeof console === "object" && console.log(x, "likeness: ", "\u2714", toShortString(module[x].constructor))
					}
				}
				if (run && propertiesWithTypes[x].length) {
					if (module[x].length !== propertiesWithTypes[x].length) {
						typeof console === "object" && console.error("length: ", x, "\u2716")
						typeof console === "object" && console.info("value should be:", module[x].length)
						truthy = false
					} else {
						typeof console === "object" && console.log(x, "length: ", "\u2714", module[x].length)
					}
				}
				if (run && typeof propertiesWithTypes[x].value !== "undefined") {
					if (module[x] !== propertiesWithTypes[x].value) {
						typeof console === "object" && console.error("value: ", x, "\u2716")
						typeof console === "object" && console.info("value should be:", propertiesWithTypes[x].value)
						truthy = false
					} else {
						typeof console === "object" && console.log(x, "value: ", "\u2714", propertiesWithTypes[x].value)
					}
				}
			}

			typeof console === "object" && console.groupEnd()

			return truthy
		}

		var interval = setInterval(function() {
			if (!scout.asyncTests.length) {
				clearInterval(interval)
				console.groupEnd()

				if (dog.test.activeTests.length) {
					runTest(dog.test.activeTests.shift())
				} else {
					for(var x = 0; x < onFinished.length; x++) {
						onFinished[x](results)
					}
				}

			}


		}, 1000)

		PAGE.wait(path, function(Constructor) {
			typeof func === "function" && func( Constructor, Test, TestWaiter, comparer )
		})

	}

	dog.setTests = function(arr) {
		dog.allTestFiles = dog.allTestFiles.concat(arr)
	}

	function runAllTests() {
		dog.test.results.length = 0
		dog.test.activeTests = dog.test.activeTests.concat( dog.allTestFiles )
		console.group("%cPAGE%c☃%cTESTING","font-size:42px;", "font-size:42px; color:hsl(0,0%, 84%); font-weight:normal;", "font-size:42px;")
		runTest( dog.test.activeTests.shift() )
		return "running all tests, build created 12-24-2013"
	}

	function runTest(path) {
		console.group(path)
		loadScript(path)
	}

})

