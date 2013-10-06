PAGE.addTests("Constructors.DummyScript", function(DummyScript, Test, TestWaiter) {

	var $mock = $("<div>")
	var module = DummyScript($mock)

	new TestWaiter("Async Testing", function(series, go, call) {

		series.push(function() {
			module.example(42, function(val) {
				call({ result : (val === 42), name : "try async example" })
				go()
			})
		})

		series.push(function() {
			module.example2(12, function(val) {
				call({ result : (val === 12), name : "try async example again" })
				go()
			})
		})

		go()
	})
	
})

