// using extend, puppy is instance, dog is prototype, and log is logging
PAGE.extend(function(puppy, dog, log) {

	var results = []
	, allTestFiles = []
	, allTestMaps = {}
	, allTestMapsFlipped = {}
	, onFinished = []

	var dtest = dog.test = {
		results : results
		, allTestFiles : dog.allTestFiles = allTestFiles
		, allTestMaps : allTestMaps
		, allTestMapsFlipped : allTestMapsFlipped

		, addTests : function(path, func ){ return this }
		, runTest : function(path){ return this }
		, runSubTests : function(){ return this }
		, runAllTests : function() { return this }
		, onFinished : function(func) { onFinished.push(func) }
		, addCoverage : function(callback) { return this }

		, activeTests : []
		, index : 0
		, _testData : dog._testData = {}
		, totalPass : 0
		, totalFail : 0
		, codeCoverage : undefined /* CodeCoverage(hashOfScriptsToCheck, test) */
		, hasCodeCoverage : false
	}

	var ref = {}

	// this overrides the PAGE.add method !
	// modifying add method to include path to test
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
				var testMap = {
					path : path
					, obj : obj
					, test : test
				}
				allTestMapsFlipped[arguments[x].toString()] = allTestMaps[path] = testMap
			}
		}
		return puppy[group][item] = obj
	}

	function clean(str) { return str.replace(/\./g,"_") }
	function cleanReverse(str) { return str.replace(/_/g,".") }

	function finishedResults(results) {

		for(var x = 0; x < results.length; x++) {
			if (results[x].result) dtest.totalPass += 1  
			else dtest.totalFail += 1
		}

		var countAsync = 0
			, countSync = 0
			, countPassed = dtest.totalPass
			, countFailed = dtest.totalFail
			, countTotal = Number(dtest.totalPass + dtest.totalFail)
			, countComplete = 0
			, countPossible = 0

		results.forEach(function(item, index, arr) {
			if (item.type === "sync") countSync++
			if (item.type === "async") countAsync++
		})

		var subCount = String("Σ Total Tests async [" + countAsync + "] -- sync [" + countSync + "]")

		var temp = { }

		temp[subCount] = { count : countTotal }
		temp["✔ Tests Passed"] = { count : countPassed }
		temp["✖ Tests Failed"] = { count : countFailed }

		if (PAGE.exists("test.codeCoverage")) {
			var countsCoverage = dtest.codeCoverage.getTotals()
			temp["Functions found"] = { count : countsCoverage.countPossible }
			temp["Functions covered"] = { count : countsCoverage.countComplete }
		}

		console.groupEnd()

		console.table(temp, [ "count" ])


		dtest.totalPass = 0
		dtest.totalFail = 0

	}

	dtest.onFinished(finishedResults)

	/* inherit from PAGE */
	var loadScript = dog.loadScript

	dog.addTests = function(path, func /* (Constructor, Test, TestWaiter, comparer) */ ) {

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
					, construct : path
					, func : func
					, type : "sync"
				}
				results.push(result)
				if (result.result) {
					console.groupCollapsed("%c " + result.name + "%c \u2714", "color:gray; font-weight:normal;", "color:rgb(54, 231, 54)")
					console.log(result)
					console.groupEnd()


				} else {
					console.error(result.name + " \u2716 FAILED")
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
				result.type = "async"
				results.push(result)
				if (result.result) {
					console.groupCollapsed("%c " + testName + ": " + result.name + "%c \u2714", "color:gray; font-weight:normal;", "color:rgb(54, 231, 54)")
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

			typeof console === "object" && console.groupCollapsed("%ccomparer details", "color:gray; font-weight:normal")

			if (!module) {
				typeof console === "object" && console.error("length: ", x, "\u2716")
				return typeof console === "object" && console.groupEnd()
			}

			for (var x in propertiesWithTypes) {
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

		// this is here to help when a test group is finished, clear it up
		var interval = setInterval(function() {
			if (!scout.asyncTests.length) {
				clearInterval(interval)

				if (PAGE.exists("test.codeCoverage")) {
					;(function() {
						var countsCoverage = dtest.codeCoverage.getTotals()
						var temp = {}
						var lastTest = dtest.lastTest
						if (!lastTest) { return alert("oop") }

						var lastTestMap = dtest.allTestMapsFlipped[lastTest]
						var lastConstructorCounts = dtest.codeCoverage.getByPath( lastTestMap.path )

						temp["functions found"] = lastConstructorCounts ? { count : lastConstructorCounts.totalPoints } : 0
						temp["functions tested"] = lastConstructorCounts ? { count : lastConstructorCounts.hitsCount } : 0
						temp["functions missed"] = lastConstructorCounts ? { count : lastConstructorCounts.hitsMissed } : 0
						console.groupEnd()
						console.group("Code Coverage")
						console.table(temp, [ "count" ])

						lastTestMap.coverage = lastConstructorCounts

						console.group("%c Coverage Info", "font-weight:normal; color:#aaa;")
						// console.log(lastTestMap.coverage)
						// console.log("All Test Data")
						// console.log(lastTestMap)


						;(function() {
							var tempMissesList = {}

							if (!lastTestMap.coverage) return

							var misses = lastTestMap.coverage.misses

							for(var x in misses) {
								tempMissesList[x] = {
									lineNumber : misses[x].loc.start.line
									, column : misses[x].loc.start.column
									, name : misses[x].name
								}
							}

							console.group("Misses")
							console.table(tempMissesList, ["name", "lineNumber", "column"])
							console.groupEnd()

						}())

						;(function() {
							var tempHitsList = {}

							if (!lastTestMap.coverage) return

							var hits = lastTestMap.coverage.hits

							for(var x in hits) {
								tempHitsList[x] = {
									lineNumber : hits[x].lineNumber
									, name : hits[x].name
								}
							}

							console.groupCollapsed("Hits")
							console.table(tempHitsList, ["name", "lineNumber"])
							console.groupEnd()

						}())

						console.groupEnd()
						console.groupEnd()
					}())
				}

				console.groupEnd()

				if (dtest.activeTests.length) {
					subRunTest(dtest.activeTests.shift())
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

	/* this is to add coverage stats for all tests */
	dog.addCoverage = function(callback) {

		if (dtest.hasCodeCoverage) {
			typeof callback === "function" && callback(dtest)
			return dtest
		}

		/* load it if it's not there */
		PAGE.exists("Utils.CodeCoverage") ? "" : loadScript("testUtils/page.test.codeCoverage.js")

		// Main code coverage
		PAGE.wait("Utils.CodeCoverage", function(CodeCoverage) {

			dtest.codeCoverage = CodeCoverage(PAGE.Constructors, dtest)
			.start(function() {
				typeof callback === "function" && callback(dtest)
			})

			dtest.hasCodeCoverage = true

		})

		return dtest
	}

	dog.runSubTests = function() {
		dtest.results.length = 0
		dtest.activeTests = dtest.activeTests.concat( dog.allTestFiles )
		console.group("%cPAGE%c♗%cTEST%c〄k","font-size:42px; color:rgb(229, 229, 209); font-weight:normal;", "font-size:42px; color:rgb(233, 227, 80); font-weight:normal;", "font-size:42px; color:rgb(229, 229, 209); font-weight:normal;", "font-size:16px; color:black; font-weight:normal;")

		console.log("PAGE.test : Version 1 : DEC 30 2013")
		subRunTest( dtest.activeTests.shift() )

		return "running all tests, build created 12-24-2013"
}

	dog.runAllTests = function() {
		dog.addCoverage( dog.runSubTests )
		return "Release the Kraken!"
	}

	function subRunTest(path) {
		dtest.lastTest = path
		loadScript(path)
		console.group(path)
		console.group("tests")
	}

	dog.runTest = function(path) {
		dtest.lastTest = path
		dog.addCoverage( function() {
			dtest.results.length = 0
			loadScript(path)
			console.group(path)
			console.group("tests")
		})
		return "Release the Kraken!"
	}

})

