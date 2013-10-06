PAGE.add("Constructors.DummyScript", function($elem) {
	var dog = { 
		$elem : $elem
		, example : function(val, callback) { return this }
		, example2 : function(val, callback) { return this }
	}

	dog.example = function(val, callback) {
		setTimeout(function() {
			callback(val)
		}, 1000)
		return this
	}

	dog.example2 = function(val, callback) {
		setTimeout(function() {
			callback(val)
		}, 1000)
		return this
	}

	return dog
}, "dummyScript.test.js")
