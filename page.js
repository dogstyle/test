/* PAGE is way of organizing your javascript based app. 
* Works great across pages, or in single page apps, extensions, etc etc.
* Works great with other libraries like jQuery.
* Can be extended to work great with other libraries
* Small by design.
* SEE https://github.com/dogstyle/page
* Created by Justin Kempton
* MIT License
*/
var PAGE = (function() {

	/* 
	* the point of PAGE is to be able to open up a javascript console, type PAGE and see everything you've loaded.
	* For large complex projects this can be very helpful during the debugging process.
	*
	* For most things, PAGE.add, PAGE.add$, and PAGE.wait are all you need.
	*
	* To add use PAGE.add("GROUPNAME.THING", THING)
	* Example:
	* PAGE.add("Constructors.MyThing", function(options) {
	* var dog = {}
	* return dog
	* })
	* 
	* to retrieve instance items use PAGE.wait
	* for instance properties PAGE.wait("GROUPNAME.THING", function(THING) {})
	* for prototype PAGE.wait("THING", function(THING) {})
	*
	* To add more functionality to PAGE itself, use PAGE.extend(function(puppy, dog, log)
	* Puppy is the instance, Dog is the Prototype, and Log is for logging.
	*
	* Because PAGE is a singleton, it doesn't really matter if methods are added to the prototype or the instance.
	* However, in the console, there is a nice seperation between the instance methods and the prototype methods.
	* Prototype methods are hidden, until you open proto. Try it.
	* So, for this reason alone I have seperated them.
	*
	* for example, adding a function
	* PAGE.add("Functions.myFunction", function() {
	* alert("dog is great!")
	* })
	*
	* for example, a singleton
	* PAGE.add("Modules.myModule", (function() {
	* var dog = {}
	* return dog
	* })())
	*
	* for example, a constructor
	* PAGE.add("Constructors.MyConstructor", function() {
	* var dog = {
	*  love : "trucks"
	* }
	* function init() {
	* alert("dogs love " + dog.love)
	* }
	* init()
	* return dog
	* })
	*
	*/
	var Page  = function(){}          // base constructor
		, dog   = Page.prototype = {}   // base prototype
		, puppy = new Page()            // base instance
		, speedOfInterval      =        150 // speed of interval (slowed down, to see if it has an effect)

	/* logging for everything, gets passed into extend */
	function log(thing) {
		if (typeof console === "object") {
			console.log(thing)
		}
	}

	/* this is how you add stuff to your app, 
	* example usage: 
	* PAGE.add("Constructors.MyConstructor", function($root, options) { 
	* ... 
	* }) 
	* */
	dog.add = function(path, obj, test) {
		if (typeof path === "undefined") return
		var arr = path.split(".")
		if (arr.length < 2) return
		var group = arr[0]
			, item = arr[1]
		if (!puppy[group]) puppy[group] = {}
		return puppy[group][item] = obj
	}

	/* this is how to wait for methods that have been added using extend
	* use PAGE.wait() instead
	* might be useful while extending the functionality PAGE itself
	* example usage: 
	* PAGE.waitProto("Image", function(Image) {
	* var image = Image
	* }) 
	* */
	dog.waitProto = function(name, callback) {
		var limit = 1000
			, count = 0
			, interval

		if (dog[name]) {
			return callback(dog[name])
		}

		interval = setInterval(function() {
			if (count > limit) {
				console.error("could not find prototype " + name)
				clearInterval(interval)
				return
			}
			if (count > limit || (dog[name])) {
				if (typeof callback === "function") {
					callback(dog[name])
				}
				clearInterval(interval)
			}
			// console.count("waitProto")
			count++
		}, speedOfInterval)
	}

	/* the base of PAGE.wait(...)
	* example usage :
	* PAGE.waitLoad("Constructors", "Popup", function(Popup) {
	* ...
	* }) */
	dog.waitLoad = function(group, name, callback, refObj) {
			var limit = 1000
				, count = 0
				, interval

			refObj = refObj || {}

			if (puppy[group] && puppy[group][name]) {
				return callback(puppy[group][name])
			}

			interval = setInterval(function() {
				if (count > limit) {
					debugger
					console.error("could not find " + group + ":" + name)
					clearInterval(interval)
					return
				}
				if (count > limit || (puppy[group] && puppy[group][name])) {
					if (typeof callback === "function") {
						refObj[name] = puppy[group][name]
						callback(puppy[group][name])
					}
					clearInterval(interval)
				}
				// console.count("waitLoad")
				count++
			}, speedOfInterval)
		}


	/* method for loading external scripts, use it more for testing purposes, 
	* production code should be loading as minified unified code */
	dog.loadScript = function(pathToFile) {
		var scriptId = pathToFile.replace(/\./g,"_")
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

	/* method for loading external libries, that get dumped into the PAGE.Lib object. 
	* Use it more for testing purposes, production code should be loading as bundled minified code */
	dog.AddExternalLib = function(path, globalVarName, callback) {

		if (dog.exists("Lib." + globalVarName)) {
			typeof callback === "function" && callback(window[globalVarName])
			return
		}

		dog.loadScript(path)
		var interval = setInterval(function() {
			var glob = window[globalVarName]
			if (glob) {
				clearInterval(interval)
				if (!puppy.Lib) puppy.Lib = {}
				puppy.add("Lib." + globalVarName, glob)
				typeof callback === "function" && callback(glob)
			}
		}, 100)
	}

	/* the shorthand of PAGE.wait(...)
	* example usage :
	* PAGE.wait("Constructors.Popup", function(Popup) {
	* ...
	* }) 
	* alternatively
	* This adds it to the refObj
	* PAGE.wait("Constructors.Popup", refObj)
	*
	* */
	dog.wait = function(path, callback, refObj) {
		refObj = refObj || {}
		if (typeof path === "undefined") return
		var arr = path.split(".")
		if (arr.length < 1) return
		if (arr.length < 2) return dog.waitProto(arr[0], callback)
		return dog.waitLoad(arr[0], arr[1], callback, refObj)
	}

	/* this is for extending the PAGE class itself, giving access to the prototype
	* example usage
	* PAGE.extend(function( instance, proto, log ) {
	* proto.Image = {
	*   upload : function() {}
	* }
	* }) */
	dog.extend = function(callback) {
		typeof callback === "function" && callback(puppy, dog, log)
	}

	/* special case for adding stuff after jquery has loaded, we all love jquery!
	* example usage :
	* PAGE.add$("Modules.myPage", (function() {
	* ...
	* }()))
	* */
	dog.add$ = function() {
		var args = arguments
		try {
			$(document).ready(function() {
				dog.add.apply(puppy, args)
			})
		} 
		catch (ex) {
			throw(ex)
		}
	}

	/* immediate check to see if something exists, if so, return it, otherwise return undefined
	* example usage
	* var shoppingCart = PAGE.exists("Properties.ShoppingCart")
	*/
	dog.exists = function (path) {
		if (typeof path === "undefined") return
		var arr = path.split(".")
			, x = 0
			, obj = puppy

		if (arr.length < 1) return

		while (x < arr.length) {
			obj = obj[arr[x]]
			if (obj === undefined) return obj
			x++
		}
		return obj
	}

	/* Load a whole batch of things, pass in array and object, object gets filled by things (by reference), or optionally calls back with the object when it's done. */
	dog.batchWaitRef = function(arr, obj, callback) {
		var count = 0
			, obj = obj || {}
		for (var x = 0; x < arr.length; x++) {
			;(function(index, arr) {
				dog.wait(arr[index], function(f) {
					count += 1
					var name = arr[index].split(".").reverse()[0]
					obj[name] = f
					if (count >= arr.length) {
						typeof callback === "function" && callback(obj)
					}
				})
			}(x, arr))
		}
		return puppy
	}

	dog.batchWait = function(arr, callback) {
		dog.batchWaitRef(arr, {}, callback)
	}

	return puppy

}())

