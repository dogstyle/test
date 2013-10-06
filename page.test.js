PAGE.extend(function(puppy, dog, log) {

	dog.testResults = []
	dog.allTests = []

	var f = function(){}
	var console = window.console || {
		error : f
		, group : f
		, log : f
		, groupEnd : f
		, groupCollapsed : f
		, count : f
	}
	console.group = console.group || console.log
	console.groupEnd = console.groupEnd || f
	console.groupCollapsed = console.groupCollapsed || f

	// use for multiple tests with callbacks
	function TestWaiter(testGroupName, callback) {
		var series = []

		function go() {
			if (series.length === 0) return
			series.shift()(arguments)
		}

		function call(result) {
			if (result.result) {
				console.groupCollapsed(testGroupName, result.name, "\u2714")
				console.log("passed \u2714")
			} else {
				console.group(testGroupName, result.name, "\u2716")
				console.error("failed \u2716")
			}
			console.groupEnd()

			dog.testResults.push(result)
		}

		callback(series, go, call)
	}

	function Test(testName, callback) {
		var result = {
			name : testName
			, result : callback()
			, test : callback
		}
		dog.testResults.push(result)
		if (result.result) {
			console.groupCollapsed(testName, "\u2714")
			console.log("passed \u2714")
			console.groupEnd()
		}
		else {
			console.group(testName, "\u2716")
			console.error("failed \u2716")
			console.groupEnd()
		}
	}

	// modify add method to include path to test
	dog.add = function(path, obj, test) {
		if (typeof path === "undefined") return
		var arr = path.split(".")
		if (arr.length < 2) return
		var group = arr[0]
			, item = arr[1]
		if (!puppy[group]) puppy[group] = {}
		if (test) dog.allTests.push(test)
		return puppy[group][item] = obj
	}

	dog.addTests = function(path, func) {
		if (typeof console === "undefined") return
		PAGE.wait(path, function(Constructor) {
			console.group("PAGE IS TESTING:", path) 
			func(Constructor, Test, TestWaiter)
			console.groupEnd()
		})
		return puppy 
	}

	dog.runAllTests = function() {
		for (var x in dog.allTests) {
			;(function(pathToFile) {
				var scriptId = pathToFile.replace(/\//g, "_")

				if (document.getElementById(scriptId)) return

				var fileref = document.createElement('script')
				fileref.setAttribute("type","text/javascript")
				fileref.setAttribute("src", pathToFile)
				fileref.setAttribute("id", scriptId)
				document.getElementsByTagName("head")[0].appendChild(fileref)
			}(dog.allTests[x]))
		}
		return puppy
	}

	dog.setTests = function(arr) {
		dog.allTests = dog.allTests.concat(arr)
	}

})
