/**
 * Created by kk on 2015/5/18.
 */
var kk = kk || {};

kk.log = function(){
    return console.log.apply(console, arguments);
};

kk.newElement = function (x) {
    return document.createElement(x);
};

kk._addEventListener = function (element, type, listener, useCapture) {
    element.addEventListener(type, listener, useCapture);
};

//is nodejs ? Used to support node-webkit.
kk._isNodeJs = typeof require !== 'undefined' && require("fs");

/**
 * Iterate over an object or an array, executing a function for each matched element.
 * @param {object|array} obj
 * @param {function} iterator
 * @param {object} [context]
 */
kk.each = function (obj, iterator, context) {
    if (!obj)
        return;
    if (obj instanceof Array) {
        for (var i = 0, li = obj.length; i < li; i++) {
            if (iterator.call(context, obj[i], i) === false)
                return;
        }
    } else {
        for (var key in obj) {
            if (iterator.call(context, obj[key], key) === false)
                return;
        }
    }
};

/**
 * Copy all of the properties in source objects to target object and return the target object.
 * @param {object} target
 * @param {object} *sources
 * @returns {object}
 */
kk.extend = function(target) {
    var sources = arguments.length >= 2 ? Array.prototype.slice.call(arguments, 1) : [];

    kk.each(sources, function(src) {
        for(var key in src) {
            if (src.hasOwnProperty(key)) {
                target[key] = src[key];
            }
        }
    });
    return target;
};

/**
 * Check the obj whether is function or not
 * @param {*} obj
 * @returns {boolean}
 */
kk.isFunction = function(obj) {
    return typeof obj === 'function';
};

/**
 * Check the obj whether is number or not
 * @param {*} obj
 * @returns {boolean}
 */
kk.isNumber = function(obj) {
    return typeof obj === 'number' || Object.prototype.toString.call(obj) === '[object Number]';
};

/**
 * Check the obj whether is string or not
 * @param {*} obj
 * @returns {boolean}
 */
kk.isString = function(obj) {
    return typeof obj === 'string' || Object.prototype.toString.call(obj) === '[object String]';
};

/**
 * Check the obj whether is array or not
 * @param {*} obj
 * @returns {boolean}
 */
kk.isArray = function(obj) {
    return Array.isArray(obj) ||
        (typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Array]');
};

/**
 * Check the obj whether is undefined or not
 * @param {*} obj
 * @returns {boolean}
 */
kk.isUndefined = function(obj) {
    return typeof obj === 'undefined';
};

/**
 * Check the obj whether is object or not
 * @param {*} obj
 * @returns {boolean}
 */
kk.isObject = function(obj) {
    return typeof obj === "object" && Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * Check the url whether cross origin
 * @param {String} url
 * @returns {boolean}
 */
kk.isCrossOrigin = function (url) {
    if (!url) {
        kk.log("invalid URL");
        return false;
    }
    var startIndex = url.indexOf("://");
    if (startIndex === -1)
        return false;

    var endIndex = url.indexOf("/", startIndex + 3);
    var urlOrigin = (endIndex === -1) ? url : url.substring(0, endIndex);
    return urlOrigin !== location.origin;
};

/**
 * Async Pool class, a helper of cc.async
 * @param {Object|Array} srcObj
 * @param {Number} limit the limit of parallel number
 * @param {function} iterator
 * @param {function} onEnd
 * @param {object} target
 * @constructor
 */
kk.AsyncPool = function(srcObj, limit, iterator, onEnd, target){
    var self = this;
    self._srcObj = srcObj;
    self._limit = limit;
    self._pool = [];
    self._iterator = iterator;
    self._iteratorTarget = target;
    self._onEnd = onEnd;
    self._onEndTarget = target;
    self._results = srcObj instanceof Array ? [] : {};
    self._isErr = false;

    kk.each(srcObj, function(value, index){
        self._pool.push({index : index, value : value});
    });

    self.size = self._pool.length;
    self.finishedSize = 0;
    self._workingSize = 0;

    self._limit = self._limit || self.size;

    self.onIterator = function(iterator, target){
        self._iterator = iterator;
        self._iteratorTarget = target;
    };

    self.onEnd = function(endCb, endCbTarget){
        self._onEnd = endCb;
        self._onEndTarget = endCbTarget;
    };

    self._handleItem = function(){
        var self = this;
        if(self._pool.length === 0 || self._workingSize >= self._limit)
            return;                                                         //return directly if the array's length = 0 or the working size great equal limit number

        var item = self._pool.shift();
        var value = item.value, index = item.index;
        self._workingSize++;
        self._iterator.call(self._iteratorTarget, value, index,
            function(err) {
                if (self._isErr)
                    return;

                self.finishedSize++;
                self._workingSize--;
                if (err) {
                    self._isErr = true;
                    if (self._onEnd)
                        self._onEnd.call(self._onEndTarget, err);
                    return;
                }

                var arr = Array.prototype.slice.call(arguments, 1);
                self._results[this.index] = arr[0];
                if (self.finishedSize === self.size) {
                    if (self._onEnd)
                        self._onEnd.call(self._onEndTarget, null, self._results);
                    return;
                }
                self._handleItem();
            }.bind(item),
            self);
    };

    self.flow = function(){
        var self = this;
        if(self._pool.length === 0) {
            if(self._onEnd)
                self._onEnd.call(self._onEndTarget, null, []);
            return;
        }
        for(var i = 0; i < self._limit; i++)
            self._handleItem();
    }
};

kk.async = {
    /**
     * Do tasks series.
     * @param {Array|Object} tasks
     * @param {function} [cb] callback
     * @param {Object} [target]
     * @return {kk.AsyncPool}
     */
    series : function(tasks, cb, target){
        var asyncPool = new kk.AsyncPool(tasks, 1, function(func, index, cb1){
            func.call(target, cb1);
        }, cb, target);
        asyncPool.flow();
        return asyncPool;
    },

    /**
     * Do tasks parallel.
     * @param {Array|Object} tasks
     * @param {function} cb callback
     * @param {Object} [target]
     * @return {kk.AsyncPool}
     */
    parallel : function(tasks, cb, target){
        var asyncPool = new kk.AsyncPool(tasks, 0, function(func, index, cb1){
            func.call(target, cb1);
        }, cb, target);
        asyncPool.flow();
        return asyncPool;
    },

    /**
     * Do tasks waterfall.
     * @param {Array|Object} tasks
     * @param {function} cb callback
     * @param {Object} [target]
     * @return {kk.AsyncPool}
     */
    waterfall : function(tasks, cb, target){
        var args = [];
        var lastResults = [null];//the array to store the last results
        var asyncPool = new kk.AsyncPool(tasks, 1,
            function (func, index, cb1) {
                args.push(function (err) {
                    args = Array.prototype.slice.call(arguments, 1);
                    if(tasks.length - 1 === index) lastResults = lastResults.concat(args);//while the last task
                    cb1.apply(null, arguments);
                });
                func.apply(target, args);
            }, function (err) {
                if (!cb)
                    return;
                if (err)
                    return cb.call(target, err);
                cb.apply(target, lastResults);
            });
        asyncPool.flow();
        return asyncPool;
    },

    /**
     * Do tasks by iterator.
     * @param {Array|Object} tasks
     * @param {function|Object} iterator
     * @param {function} [callback]
     * @param {Object} [target]
     * @return {kk.AsyncPool}
     */
    map : function(tasks, iterator, callback, target){
        var locIterator = iterator;
        if(typeof(iterator) === "object"){
            callback = iterator.cb;
            target = iterator.iteratorTarget;
            locIterator = iterator.iterator;
        }
        var asyncPool = new kk.AsyncPool(tasks, 0, locIterator, callback, target);
        asyncPool.flow();
        return asyncPool;
    },

    /**
     * Do tasks by iterator limit.
     * @param {Array|Object} tasks
     * @param {Number} limit
     * @param {function} iterator
     * @param {function} cb callback
     * @param {Object} [target]
     */
    mapLimit : function(tasks, limit, iterator, cb, target){
        var asyncPool = new kk.AsyncPool(tasks, limit, iterator, cb, target);
        asyncPool.flow();
        return asyncPool;
    }
};

kk.path = {
    /**
     * Join strings to be a path.
     * @example
     cc.path.join("a", "b.png");//-->"a/b.png"
     cc.path.join("a", "b", "c.png");//-->"a/b/c.png"
     cc.path.join("a", "b");//-->"a/b"
     cc.path.join("a", "b", "/");//-->"a/b/"
     cc.path.join("a", "b/", "/");//-->"a/b/"
     * @returns {string}
     */
    join: function () {
        var l = arguments.length;
        var result = "";
        for (var i = 0; i < l; i++) {
            result = (result + (result === "" ? "" : "/") + arguments[i]).replace(/(\/|\\\\)$/, "");
        }
        return result;
    },

    /**
     * Get the ext name of a path.
     * @example
     cc.path.extname("a/b.png");//-->".png"
     cc.path.extname("a/b.png?a=1&b=2");//-->".png"
     cc.path.extname("a/b");//-->null
     cc.path.extname("a/b?a=1&b=2");//-->null
     * @param {string} pathStr
     * @returns {*}
     */
    extname: function (pathStr) {
        var temp = /(\.[^\.\/\?\\]*)(\?.*)?$/.exec(pathStr);
        return temp ? temp[1] : null;
    },

    /**
     * Get the main name of a file name
     * @param {string} fileName
     * @returns {string}
     */
    mainFileName: function(fileName){
        if(fileName){
            var idx = fileName.lastIndexOf(".");
            if(idx !== -1)
                return fileName.substring(0,idx);
        }
        return fileName;
    },

    /**
     * Get the file name of a file path.
     * @example
     cc.path.basename("a/b.png");//-->"b.png"
     cc.path.basename("a/b.png?a=1&b=2");//-->"b.png"
     cc.path.basename("a/b.png", ".png");//-->"b"
     cc.path.basename("a/b.png?a=1&b=2", ".png");//-->"b"
     cc.path.basename("a/b.png", ".txt");//-->"b.png"
     * @param {string} pathStr
     * @param {string} [extname]
     * @returns {*}
     */
    basename: function (pathStr, extname) {
        var index = pathStr.indexOf("?");
        if (index > 0) pathStr = pathStr.substring(0, index);
        var reg = /(\/|\\\\)([^(\/|\\\\)]+)$/g;
        var result = reg.exec(pathStr.replace(/(\/|\\\\)$/, ""));
        if (!result) return null;
        var baseName = result[2];
        if (extname && pathStr.substring(pathStr.length - extname.length).toLowerCase() === extname.toLowerCase())
            return baseName.substring(0, baseName.length - extname.length);
        return baseName;
    },

    /**
     * Get dirname of a file path.
     * @example
     * unix
     cc.path.driname("a/b/c.png");//-->"a/b"
     cc.path.driname("a/b/c.png?a=1&b=2");//-->"a/b"
     cc.path.dirname("a/b/");//-->"a/b"
     cc.path.dirname("c.png");//-->""
     * windows
     cc.path.driname("a\\b\\c.png");//-->"a\b"
     cc.path.driname("a\\b\\c.png?a=1&b=2");//-->"a\b"
     * @param {string} pathStr
     * @returns {*}
     */
    dirname: function (pathStr) {
        return pathStr.replace(/((.*)(\/|\\|\\\\))?(.*?\..*$)?/, '$2');
    },

    /**
     * Change extname of a file path.
     * @example
     cc.path.changeExtname("a/b.png", ".plist");//-->"a/b.plist"
     cc.path.changeExtname("a/b.png?a=1&b=2", ".plist");//-->"a/b.plist?a=1&b=2"
     * @param {string} pathStr
     * @param {string} [extname]
     * @returns {string}
     */
    changeExtname: function (pathStr, extname) {
        extname = extname || "";
        var index = pathStr.indexOf("?");
        var tempStr = "";
        if (index > 0) {
            tempStr = pathStr.substring(index);
            pathStr = pathStr.substring(0, index);
        }
        index = pathStr.lastIndexOf(".");
        if (index < 0) return pathStr + extname + tempStr;
        return pathStr.substring(0, index) + extname + tempStr;
    },
    /**
     * Change file name of a file path.
     * @example
     cc.path.changeBasename("a/b/c.plist", "b.plist");//-->"a/b/b.plist"
     cc.path.changeBasename("a/b/c.plist?a=1&b=2", "b.plist");//-->"a/b/b.plist?a=1&b=2"
     cc.path.changeBasename("a/b/c.plist", ".png");//-->"a/b/c.png"
     cc.path.changeBasename("a/b/c.plist", "b");//-->"a/b/b"
     cc.path.changeBasename("a/b/c.plist", "b", true);//-->"a/b/b.plist"
     * @param {String} pathStr
     * @param {String} basename
     * @param {Boolean} [isSameExt]
     * @returns {string}
     */
    changeBasename: function (pathStr, basename, isSameExt) {
        if (basename.indexOf(".") === 0) return this.changeExtname(pathStr, basename);
        var index = pathStr.indexOf("?");
        var tempStr = "";
        var ext = isSameExt ? this.extname(pathStr) : "";
        if (index > 0) {
            tempStr = pathStr.substring(index);
            pathStr = pathStr.substring(0, index);
        }
        index = pathStr.lastIndexOf("/");
        index = index <= 0 ? 0 : index + 1;
        return pathStr.substring(0, index) + basename + ext + tempStr;
    }
};

kk.loader = {
    _jsCache: {},//cache for js
    _register: {},//register of loaders
    _langPathCache: {},//cache for lang path
    _aliases: {},//aliases for res url

    resPath: "",//root path of resource
    audioPath: "",//root path of audio
    cache: {},//cache for data loaded

    /**
     * Get XMLHttpRequest.
     * @returns {XMLHttpRequest}
     */
    getXMLHttpRequest: function () {
        return window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject("MSXML2.XMLHTTP");
    },

    //@MODE_BEGIN DEV

    _getArgs4Js: function (args) {
        var a0 = args[0], a1 = args[1], a2 = args[2], results = ["", null, null];

        if (args.length === 1) {
            results[1] = a0 instanceof Array ? a0 : [a0];
        } else if (args.length === 2) {
            if (typeof a1 === "function") {
                results[1] = a0 instanceof Array ? a0 : [a0];
                results[2] = a1;
            } else {
                results[0] = a0 || "";
                results[1] = a1 instanceof Array ? a1 : [a1];
            }
        } else if (args.length === 3) {
            results[0] = a0 || "";
            results[1] = a1 instanceof Array ? a1 : [a1];
            results[2] = a2;
        } else throw "arguments error to load js!";
        return results;
    },

    /**
     * Load js files.
     * If the third parameter doesn't exist, then the baseDir turns to be "".
     *
     * @param {string} [baseDir]   The pre path for jsList or the list of js path.
     * @param {array} jsList    List of js path.
     * @param {function} [cb]  Callback function
     * @returns {*}
     */
    loadJs: function (baseDir, jsList, cb) {
        var self = this, localJsCache = self._jsCache,
            args = self._getArgs4Js(arguments);

        var preDir = args[0], list = args[1], callback = args[2];
        if (navigator.userAgent.indexOf("Trident/5") > -1) {
            self._loadJs4Dependency(preDir, list, 0, callback);
        } else {
            kk.async.map(list, function (item, index, cb1) {
                var jsPath = kk.path.join(preDir, item);
                if (localJsCache[jsPath]) return cb1(null);
                self._createScript(jsPath, false, cb1);
            }, callback);
        }
    },
    /**
     * Load js width loading image.
     *
     * @param {string} [baseDir]
     * @param {array} jsList
     * @param {function} [cb]
     */
    loadJsWithImg: function (baseDir, jsList, cb) {
        var self = this, jsLoadingImg = self._loadJsImg(),
            args = self._getArgs4Js(arguments);
        this.loadJs(args[0], args[1], function (err) {
            if (err) throw err;
            jsLoadingImg.parentNode.removeChild(jsLoadingImg);//remove loading gif
            if (args[2]) args[2]();
        });
    },
    _createScript: function (jsPath, isAsync, cb) {
        var d = document, self = this, s = kk.newElement('script');
        s.async = isAsync;
        self._jsCache[jsPath] = true;
        if(kk.game.config["noCache"] && typeof jsPath === "string"){
            if(self._noCacheRex.test(jsPath))
                s.src = jsPath + "&_t=" + (new Date() - 0);
            else
                s.src = jsPath + "?_t=" + (new Date() - 0);
        }else{
            s.src = jsPath;
        }
        kk._addEventListener(s, 'load', function () {
            s.parentNode.removeChild(s);
            this.removeEventListener('load', arguments.callee, false);
            cb();
        }, false);
        kk._addEventListener(s, 'error', function () {
            s.parentNode.removeChild(s);
            cb("Load " + jsPath + " failed!");
        }, false);
        d.body.appendChild(s);
    },
    _loadJs4Dependency: function (baseDir, jsList, index, cb) {
        if (index >= jsList.length) {
            if (cb) cb();
            return;
        }
        var self = this;
        self._createScript(kk.path.join(baseDir, jsList[index]), false, function (err) {
            if (err) return cb(err);
            self._loadJs4Dependency(baseDir, jsList, index + 1, cb);
        });
    },
    _loadJsImg: function () {
        var d = document, jsLoadingImg = d.getElementById("cocos2d_loadJsImg");
        if (!jsLoadingImg) {
            jsLoadingImg = kk.newElement('img');

            if (kk._loadingImage)
                jsLoadingImg.src = kk._loadingImage;

            var canvasNode = d.getElementById(kk.game.config["id"]);
            canvasNode.style.backgroundColor = "black";
            canvasNode.parentNode.appendChild(jsLoadingImg);

            var canvasStyle = getComputedStyle ? getComputedStyle(canvasNode) : canvasNode.currentStyle;
            if (!canvasStyle)
                canvasStyle = {width: canvasNode.width, height: canvasNode.height};
            jsLoadingImg.style.left = canvasNode.offsetLeft + (parseFloat(canvasStyle.width) - jsLoadingImg.width) / 2 + "px";
            jsLoadingImg.style.top = canvasNode.offsetTop + (parseFloat(canvasStyle.height) - jsLoadingImg.height) / 2 + "px";
            jsLoadingImg.style.position = "absolute";
        }
        return jsLoadingImg;
    },
    //@MODE_END DEV

    /**
     * Load a single resource as txt.
     * @param {string} url
     * @param {function} [cb] arguments are : err, txt
     */
    loadTxt: function (url, cb) {
        if (!kk._isNodeJs) {
            var xhr = this.getXMLHttpRequest(),
                errInfo = "load " + url + " failed!";
            xhr.open("GET", url, true);
            if (/msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)) {
                // IE-specific logic here
                xhr.setRequestHeader("Accept-Charset", "utf-8");
                xhr.onreadystatechange = function () {
                    if(xhr.readyState === 4)
                        xhr.status === 200 ? cb(null, xhr.responseText) : cb(errInfo);
                };
            } else {
                if (xhr.overrideMimeType) xhr.overrideMimeType("text\/plain; charset=utf-8");
                xhr.onload = function () {
                    if(xhr.readyState === 4)
                        xhr.status === 200 ? cb(null, xhr.responseText) : cb(errInfo);
                };
            }
            xhr.send(null);
        } else {
            var fs = require("fs");
            fs.readFile(url, function (err, data) {
                err ? cb(err) : cb(null, data.toString());
            });
        }
    },
    _loadTxtSync: function (url) {
        if (!kk._isNodeJs) {
            var xhr = this.getXMLHttpRequest();
            xhr.open("GET", url, false);
            if (/msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent)) {
                // IE-specific logic here
                xhr.setRequestHeader("Accept-Charset", "utf-8");
            } else {
                if (xhr.overrideMimeType) xhr.overrideMimeType("text\/plain; charset=utf-8");
            }
            xhr.send(null);
            if (!xhr.readyState === 4 || xhr.status !== 200) {
                return null;
            }
            return xhr.responseText;
        } else {
            var fs = require("fs");
            return fs.readFileSync(url).toString();
        }
    },

    loadCsb: function(url, cb){
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";

        xhr.onload = function () {
            var arrayBuffer = xhr.response; // Note: not oReq.responseText
            if (arrayBuffer) {
                window.msg = arrayBuffer;
            }
            if(xhr.readyState === 4)
                xhr.status === 200 ? cb(null, xhr.response) : cb("load " + url + " failed!");
        };

        xhr.send(null);
    },

    /**
     * Load a single resource as json.
     * @param {string} url
     * @param {function} [cb] arguments are : err, json
     */
    loadJson: function (url, cb) {
        this.loadTxt(url, function (err, txt) {
            if (err) {
                cb(err);
            }
            else {
                try {
                    var result = JSON.parse(txt);
                }
                catch (e) {
                    throw "parse json [" + url + "] failed : " + e;
                    return;
                }
                cb(null, result);
            }
        });
    },

    _checkIsImageURL: function (url) {
        var ext = /(\.png)|(\.jpg)|(\.bmp)|(\.jpeg)|(\.gif)/.exec(url);
        return (ext != null);
    },
    /**
     * Load a single image.
     * @param {!string} url
     * @param {object} [option]
     * @param {function} callback
     * @returns {Image}
     */
    loadImg: function (url, option, callback) {
        var opt = {
            isCrossOrigin: true
        };
        if (callback !== undefined)
            opt.isCrossOrigin = option.isCrossOrigin === null ? opt.isCrossOrigin : option.isCrossOrigin;
        else if (option !== undefined)
            callback = option;

        var img = this.getRes(url);
        if (img) {
            callback && callback(null, img);
            return img;
        }

        img = new Image();
        if (opt.isCrossOrigin && location.origin !== "file://")
            img.crossOrigin = "Anonymous";

        var loadCallback = function () {
            this.removeEventListener('load', loadCallback, false);
            this.removeEventListener('error', errorCallback, false);

            kk.loader.cache[url] = img;
            if (callback)
                callback(null, img);
        };

        var self = this;
        var errorCallback = function () {
            this.removeEventListener('error', errorCallback, false);

            if(img.crossOrigin && img.crossOrigin.toLowerCase() === "anonymous"){
                opt.isCrossOrigin = false;
                self.release(url);
                kk.loader.loadImg(url, opt, callback);
            }else{
                typeof callback === "function" && callback("load image failed");
            }
        };

        kk._addEventListener(img, "load", loadCallback);
        kk._addEventListener(img, "error", errorCallback);
        img.src = url;
        return img;
    },

    /**
     * Iterator function to load res
     * @param {object} item
     * @param {number} index
     * @param {function} [cb]
     * @returns {*}
     * @private
     */
    _loadResIterator: function (item, index, cb) {
        var self = this, url = null;
        var type = item.type;
        if (type) {
            type = "." + type.toLowerCase();
            url = item.src ? item.src : item.name + type;
        } else {
            url = item;
            type = kk.path.extname(url);
        }

        var obj = self.getRes(url);
        if (obj)
            return cb(null, obj);
        var loader = null;
        if (type) {
            loader = self._register[type.toLowerCase()];
        }
        if (!loader) {
            kk.log("loader for [" + type + "] not exists!");
            return cb();
        }
        var basePath = loader.getBasePath ? loader.getBasePath() : self.resPath;
        var realUrl = self.getUrl(basePath, url);
        if(kk.game.config["noCache"] && typeof realUrl === "string"){
            if(self._noCacheRex.test(realUrl))
                realUrl += "&_t=" + (new Date() - 0);
            else
                realUrl += "?_t=" + (new Date() - 0);
        }
        loader.load(realUrl, url, item, function (err, data) {
            if (err) {
                kk.log(err);
                self.cache[url] = null;
                delete self.cache[url];
                cb();
            } else {
                self.cache[url] = data;
                cb(null, data);
            }
        });
    },
    _noCacheRex: /\?/,

    /**
     * Get url with basePath.
     * @param {string} basePath
     * @param {string} [url]
     * @returns {*}
     */
    getUrl: function (basePath, url) {
        var self = this, langPathCache = self._langPathCache, path = kk.path;
        if (basePath !== undefined && url === undefined) {
            url = basePath;
            var type = path.extname(url);
            type = type ? type.toLowerCase() : "";
            var loader = self._register[type];
            if (!loader)
                basePath = self.resPath;
            else
                basePath = loader.getBasePath ? loader.getBasePath() : self.resPath;
        }
        url = kk.path.join(basePath || "", url);
        if (url.match(/[\/(\\\\)]lang[\/(\\\\)]/i)) {
            if (langPathCache[url])
                return langPathCache[url];
            var extname = path.extname(url) || "";
            url = langPathCache[url] = url.substring(0, url.length - extname.length) + "_" + cc.sys.language + extname;
        }
        return url;
    },

    /**
     * Load resources then call the callback.
     * @param {string} resources
     * @param {function} [option] callback or trigger
     * @param {function|Object} [loadCallback]
     * @return {kk.AsyncPool}
     */
    load : function(resources, option, loadCallback){
        var self = this;
        var len = arguments.length;
        if(len === 0)
            throw "arguments error!";

        if(len === 3){
            if(typeof option === "function"){
                if(typeof loadCallback === "function")
                    option = {trigger : option, cb : loadCallback };
                else
                    option = { cb : option, cbTarget : loadCallback};
            }
        }else if(len === 2){
            if(typeof option === "function")
                option = {cb : option};
        }else if(len === 1){
            option = {};
        }

        if(!(resources instanceof Array))
            resources = [resources];
        var asyncPool = new kk.AsyncPool(
            resources, 0,
            function (value, index, AsyncPoolCallback, aPool) {
                self._loadResIterator(value, index, function (err) {
                    if (err)
                        return AsyncPoolCallback(err);
                    var arr = Array.prototype.slice.call(arguments, 1);
                    if (option.trigger)
                        option.trigger.call(option.triggerTarget, arr[0], aPool.size, aPool.finishedSize);   //call trigger
                    AsyncPoolCallback(null, arr[0]);
                });
            },
            option.cb, option.cbTarget);
        asyncPool.flow();
        return asyncPool;
    },

    _handleAliases: function (fileNames, cb) {
        var self = this, aliases = self._aliases;
        var resList = [];
        for (var key in fileNames) {
            var value = fileNames[key];
            aliases[key] = value;
            resList.push(value);
        }
        this.load(resList, cb);
    },

    /**
     * <p>
     *     Loads alias map from the contents of a filename.                                        <br/>
     *                                                                                                                 <br/>
     *     @note The plist file name should follow the format below:                                                   <br/>
     *     <?xml version="1.0" encoding="UTF-8"?>                                                                      <br/>
     *         <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">  <br/>
     *             <plist version="1.0">                                                                               <br/>
     *                 <dict>                                                                                          <br/>
     *                     <key>filenames</key>                                                                        <br/>
     *                     <dict>                                                                                      <br/>
     *                         <key>sounds/click.wav</key>                                                             <br/>
     *                         <string>sounds/click.caf</string>                                                       <br/>
     *                         <key>sounds/endgame.wav</key>                                                           <br/>
     *                         <string>sounds/endgame.caf</string>                                                     <br/>
     *                         <key>sounds/gem-0.wav</key>                                                             <br/>
     *                         <string>sounds/gem-0.caf</string>                                                       <br/>
     *                     </dict>                                                                                     <br/>
     *                     <key>metadata</key>                                                                         <br/>
     *                     <dict>                                                                                      <br/>
     *                         <key>version</key>                                                                      <br/>
     *                         <integer>1</integer>                                                                    <br/>
     *                     </dict>                                                                                     <br/>
     *                 </dict>                                                                                         <br/>
     *              </plist>                                                                                           <br/>
     * </p>
     * @param {String} url  The plist file name.
     * @param {Function} [callback]
     */
    loadAliases: function (url, callback) {
        var self = this, dict = self.getRes(url);
        if (!dict) {
            self.load(url, function (err, results) {
                self._handleAliases(results[0]["filenames"], callback);
            });
        } else
            self._handleAliases(dict["filenames"], callback);
    },

    /**
     * Register a resource loader into loader.
     * @param {string} extNames
     * @param {function} loader
     */
    register: function (extNames, loader) {
        if (!extNames || !loader) return;
        var self = this;
        if (typeof extNames === "string")
            return this._register[extNames.trim().toLowerCase()] = loader;
        for (var i = 0, li = extNames.length; i < li; i++) {
            self._register["." + extNames[i].trim().toLowerCase()] = loader;
        }
    },

    /**
     * Get resource data by url.
     * @param url
     * @returns {*}
     */
    getRes: function (url) {
        return this.cache[url] || this.cache[this._aliases[url]];
    },

    /**
     * Release the cache of resource by url.
     * @param url
     */
    release: function (url) {
        var cache = this.cache, aliases = this._aliases;
        delete cache[url];
        delete cache[aliases[url]];
        delete aliases[url];
    },

    /**
     * Resource cache of all resources.
     */
    releaseAll: function () {
        var locCache = this.cache, aliases = this._aliases;
        for (var key in locCache)
            delete locCache[key];
        for (var key in aliases)
            delete aliases[key];
    }
};

//+++++++++++++++++++++++++something about window events begin+++++++++++++++++++++++++++
(function () {
    var win = window, hidden, visibilityChange, _undef = "undefined";
    if (!kk.isUndefined(document.hidden)) {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (!kk.isUndefined(document.mozHidden)) {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
    } else if (!kk.isUndefined(document.msHidden)) {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (!kk.isUndefined(document.webkitHidden)) {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }

    var onHidden = function () {
        if (kk.eventManager && kk.game._eventHide)
            kk.eventManager.dispatchEvent(kk.game._eventHide);
    };
    var onShow = function () {
        if (kk.eventManager && kk.game._eventShow)
            kk.eventManager.dispatchEvent(kk.game._eventShow);

        if(kk.game._intervalId){
            window.cancelAnimationFrame(kk.game._intervalId);

            kk.game._mainLoop();
        }
    };

    if (hidden) {
        kk._addEventListener(document, visibilityChange, function () {
            if (document[hidden]) onHidden();
            else onShow();
        }, false);
    } else {
        kk._addEventListener(win, "blur", onHidden, false);
        kk._addEventListener(win, "focus", onShow, false);
    }

    if(navigator.userAgent.indexOf("MicroMessenger") > -1){
        win.onfocus = function(){ onShow() };
    }

    if ("onpageshow" in window && "onpagehide" in window) {
        kk._addEventListener(win, "pagehide", onHidden, false);
        kk._addEventListener(win, "pageshow", onShow, false);
    }
    win = null;
    visibilityChange = null;
})();

//+++++++++++++++++++++++++something about sys begin+++++++++++++++++++++++++++++
kk._initSys = function () {
    /**
     * System variables
     * @namespace
     * @name cc.sys
     */
    kk.sys = {};
    var sys = kk.sys;

    /**
     * @memberof cc.sys
     * @name OS_IOS
     * @constant
     * @type {string}
     */
    sys.OS_IOS = "iOS";
    /**
     * @memberof cc.sys
     * @name OS_ANDROID
     * @constant
     * @type {string}
     */
    sys.OS_ANDROID = "Android";
    /**
     * @memberof cc.sys
     * @name OS_WINDOWS
     * @constant
     * @type {string}
     */
    sys.OS_WINDOWS = "Windows";
    /**
     * @memberof cc.sys
     * @name OS_MARMALADE
     * @constant
     * @type {string}
     */
    sys.OS_MARMALADE = "Marmalade";
    /**
     * @memberof cc.sys
     * @name OS_LINUX
     * @constant
     * @type {string}
     */
    sys.OS_LINUX = "Linux";
    /**
     * @memberof cc.sys
     * @name OS_BADA
     * @constant
     * @type {string}
     */
    sys.OS_BADA = "Bada";
    /**
     * @memberof cc.sys
     * @name OS_BLACKBERRY
     * @constant
     * @type {string}
     */
    sys.OS_BLACKBERRY = "Blackberry";
    /**
     * @memberof cc.sys
     * @name OS_OSX
     * @constant
     * @type {string}
     */
    sys.OS_OSX = "OS X";
    /**
     * @memberof cc.sys
     * @name OS_WP8
     * @constant
     * @type {string}
     */
    sys.OS_WP8 = "WP8";
    /**
     * @memberof cc.sys
     * @name OS_WINRT
     * @constant
     * @type {string}
     */
    sys.OS_WINRT = "WINRT";
    /**
     * @memberof cc.sys
     * @name OS_UNKNOWN
     * @constant
     * @type {string}
     */
    sys.OS_UNKNOWN = "Unknown";

    /**
     * @memberof cc.sys
     * @name UNKNOWN
     * @constant
     * @default
     * @type {Number}
     */
    sys.UNKNOWN = 0;
    /**
     * @memberof cc.sys
     * @name IOS
     * @constant
     * @default
     * @type {Number}
     */
    sys.IOS = 1;
    /**
     * @memberof cc.sys
     * @name ANDROID
     * @constant
     * @default
     * @type {Number}
     */
    sys.ANDROID = 2;
    /**
     * @memberof cc.sys
     * @name WIN32
     * @constant
     * @default
     * @type {Number}
     */
    sys.WIN32 = 3;
    /**
     * @memberof cc.sys
     * @name MARMALADE
     * @constant
     * @default
     * @type {Number}
     */
    sys.MARMALADE = 4;
    /**
     * @memberof cc.sys
     * @name LINUX
     * @constant
     * @default
     * @type {Number}
     */
    sys.LINUX = 5;
    /**
     * @memberof cc.sys
     * @name BADA
     * @constant
     * @default
     * @type {Number}
     */
    sys.BADA = 6;
    /**
     * @memberof cc.sys
     * @name BLACKBERRY
     * @constant
     * @default
     * @type {Number}
     */
    sys.BLACKBERRY = 7;
    /**
     * @memberof cc.sys
     * @name MACOS
     * @constant
     * @default
     * @type {Number}
     */
    sys.MACOS = 8;
    /**
     * @memberof cc.sys
     * @name NACL
     * @constant
     * @default
     * @type {Number}
     */
    sys.NACL = 9;
    /**
     * @memberof cc.sys
     * @name EMSCRIPTEN
     * @constant
     * @default
     * @type {Number}
     */
    sys.EMSCRIPTEN = 10;
    /**
     * @memberof cc.sys
     * @name TIZEN
     * @constant
     * @default
     * @type {Number}
     */
    sys.TIZEN = 11;
    /**
     * @memberof cc.sys
     * @name QT5
     * @constant
     * @default
     * @type {Number}
     */
    sys.QT5 = 12;
    /**
     * @memberof cc.sys
     * @name WP8
     * @constant
     * @default
     * @type {Number}
     */
    sys.WP8 = 13;
    /**
     * @memberof cc.sys
     * @name WINRT
     * @constant
     * @default
     * @type {Number}
     */
    sys.WINRT = 14;
    /**
     * @memberof cc.sys
     * @name MOBILE_BROWSER
     * @constant
     * @default
     * @type {Number}
     */
    sys.MOBILE_BROWSER = 100;
    /**
     * @memberof cc.sys
     * @name DESKTOP_BROWSER
     * @constant
     * @default
     * @type {Number}
     */
    sys.DESKTOP_BROWSER = 101;

    sys.BROWSER_TYPE_WECHAT = "wechat";
    sys.BROWSER_TYPE_ANDROID = "androidbrowser";
    sys.BROWSER_TYPE_IE = "ie";
    sys.BROWSER_TYPE_QQ = "qqbrowser";
    sys.BROWSER_TYPE_MOBILE_QQ = "mqqbrowser";
    sys.BROWSER_TYPE_UC = "ucbrowser";
    sys.BROWSER_TYPE_360 = "360browser";
    sys.BROWSER_TYPE_BAIDU_APP = "baiduboxapp";
    sys.BROWSER_TYPE_BAIDU = "baidubrowser";
    sys.BROWSER_TYPE_MAXTHON = "maxthon";
    sys.BROWSER_TYPE_OPERA = "opera";
    sys.BROWSER_TYPE_OUPENG = "oupeng";
    sys.BROWSER_TYPE_MIUI = "miuibrowser";
    sys.BROWSER_TYPE_FIREFOX = "firefox";
    sys.BROWSER_TYPE_SAFARI = "safari";
    sys.BROWSER_TYPE_CHROME = "chrome";
    sys.BROWSER_TYPE_LIEBAO = "liebao";
    sys.BROWSER_TYPE_QZONE = "qzone";
    sys.BROWSER_TYPE_SOUGOU = "sogou";
    sys.BROWSER_TYPE_UNKNOWN = "unknown";

    /**
     * Is native ? This is set to be true in jsb auto.
     * @memberof cc.sys
     * @name isNative
     * @type {Boolean}
     */
    sys.isNative = false;

    var browserSupportWebGL = [sys.BROWSER_TYPE_BAIDU, sys.BROWSER_TYPE_OPERA, sys.BROWSER_TYPE_FIREFOX, sys.BROWSER_TYPE_CHROME, sys.BROWSER_TYPE_SAFARI];
    var osSupportWebGL = [sys.OS_IOS, sys.OS_WINDOWS, sys.OS_OSX, sys.OS_LINUX];
    var multipleAudioWhiteList = [
        sys.BROWSER_TYPE_BAIDU, sys.BROWSER_TYPE_OPERA, sys.BROWSER_TYPE_FIREFOX, sys.BROWSER_TYPE_CHROME, sys.BROWSER_TYPE_BAIDU_APP,
        sys.BROWSER_TYPE_SAFARI, sys.BROWSER_TYPE_UC, sys.BROWSER_TYPE_QQ, sys.BROWSER_TYPE_MOBILE_QQ, sys.BROWSER_TYPE_IE
    ];

    var win = window, nav = win.navigator, doc = document, docEle = doc.documentElement;
    var ua = nav.userAgent.toLowerCase();

    /**
     * Indicate whether system is mobile system
     * @memberof cc.sys
     * @name isMobile
     * @type {Boolean}
     */
    sys.isMobile = ua.indexOf('mobile') !== -1 || ua.indexOf('android') !== -1;

    /**
     * Indicate the running platform
     * @memberof cc.sys
     * @name platform
     * @type {Number}
     */
    sys.platform = sys.isMobile ? sys.MOBILE_BROWSER : sys.DESKTOP_BROWSER;

    var browserType = sys.BROWSER_TYPE_UNKNOWN;
    var browserTypes = ua.match(/sogou|qzone|liebao|micromessenger|qqbrowser|ucbrowser|360 aphone|360browser|baiduboxapp|baidubrowser|maxthon|trident|oupeng|opera|miuibrowser|firefox/i)
        || ua.match(/chrome|safari/i);
    if (browserTypes && browserTypes.length > 0) {
        browserType = browserTypes[0];
        if (browserType === 'micromessenger') {
            browserType = sys.BROWSER_TYPE_WECHAT;
        } else if (browserType === "safari" && (ua.match(/android.*applewebkit/)))
            browserType = sys.BROWSER_TYPE_ANDROID;
        else if (browserType === "trident") browserType = sys.BROWSER_TYPE_IE;
        else if (browserType === "360 aphone") browserType = sys.BROWSER_TYPE_360;
    }else if(ua.indexOf("iphone") && ua.indexOf("mobile")){
        browserType = "safari";
    }
    /**
     * Indicate the running browser type
     * @memberof cc.sys
     * @name browserType
     * @type {String}
     */
    sys.browserType = browserType;

    // Get the os of system
    var iOS = ( ua.match(/(iPad|iPhone|iPod)/i) ? true : false );
    var isAndroid = ua.match(/android/i) || nav.platform.match(/android/i) ? true : false;
    var osName = sys.OS_UNKNOWN;
    if (nav.appVersion.indexOf("Win") !== -1) osName = sys.OS_WINDOWS;
    else if (iOS) osName = sys.OS_IOS;
    else if (nav.appVersion.indexOf("Mac") !== -1) osName = sys.OS_OSX;
    else if (nav.appVersion.indexOf("X11") !== -1 && nav.appVersion.indexOf("Linux") === -1) osName = sys.OS_UNIX;
    else if (isAndroid) osName = sys.OS_ANDROID;
    else if (nav.appVersion.indexOf("Linux") !== -1) osName = sys.OS_LINUX;

    /**
     * Indicate the running os name
     * @memberof cc.sys
     * @name os
     * @type {String}
     */
    sys.os = osName;

    /**
     * cc.sys.localStorage is a local storage component.
     * @memberof cc.sys
     * @name localStorage
     * @type {Object}
     */
    try {
        var localStorage = sys.localStorage = win.localStorage;
        localStorage.setItem("storage", "");
        localStorage.removeItem("storage");
        localStorage = null;
    } catch (e) {
        if (e.name === "SECURITY_ERR" || e.name === "QuotaExceededError") {
            kk.warn("Warning: localStorage isn't enabled. Please confirm browser cookie or privacy option");
        }
        sys.localStorage = function () {
        };
    }

    var capabilities = sys.capabilities = {"canvas": true};
    if (docEle['ontouchstart'] !== undefined || doc['ontouchstart'] !== undefined || nav.msPointerEnabled)
        capabilities["touches"] = true;
    if (docEle['onmouseup'] !== undefined)
        capabilities["mouse"] = true;
    if (docEle['onkeyup'] !== undefined)
        capabilities["keyboard"] = true;
    if (win.DeviceMotionEvent || win.DeviceOrientationEvent)
        capabilities["accelerometer"] = true;

    /**
     * Dump system informations
     * @memberof cc.sys
     * @name dump
     * @function
     */
    sys.dump = function () {
        var self = this;
        var str = "";
        str += "isMobile : " + self.isMobile + "\r\n";
        str += "browserType : " + self.browserType + "\r\n";
        str += "capabilities : " + JSON.stringify(self.capabilities) + "\r\n";
        str += "os : " + self.os + "\r\n";
        str += "platform : " + self.platform + "\r\n";
        kk.log(str);
    }

    /**
     * Open a url in browser
     * @memberof cc.sys
     * @name openURL
     * @param {String} url
     */
    sys.openURL = function(url){
        window.open(url);
    }
};
//+++++++++++++++++++++++++something about sys end+++++++++++++++++++++++++++++

kk.game = {
    EVENT_HIDE: "game_on_hide",
    EVENT_SHOW: "game_on_show",
    _eventHide: null,
    _eventShow: null,
    CONFIG_KEY: {
        engineDir : "engineDir",
        showFPS: "showFPS",
        id: "id",
        jsList: "jsList",
        classReleaseMode: "classReleaseMode"
    },
    _prepareCalled: false,//whether the prepare function has been called
    _prepared: false,//whether the engine has prepared
    _paused: true,//whether the game is paused
    _intervalId: null,//interval target of main
    config:null,
    run: function (id) {
        var self = this;
        var _run = function () {
            if (id) {
                self.config[self.CONFIG_KEY.id] = id;
            }
            if (!self._prepareCalled) {
                self.prepare(function () {
                    self._prepared = true;
                });
            }
            self._checkPrepare = setInterval(function () {
                if (self._prepared) {
                    self._init();
                    self._mainLoop();
                    self._eventHide = self._eventHide || new kk.EventCustom(self.EVENT_HIDE);
                    self._eventHide.setUserData(self);
                    self._eventShow = self._eventShow || new kk.EventCustom(self.EVENT_SHOW);
                    self._eventShow.setUserData(self);
                    self.onStart();
                    clearInterval(self._checkPrepare);
                }
            }, 10);
        };
        document.body ?
            _run() :
            kk._addEventListener(window, 'load', function () {
                this.removeEventListener('load', arguments.callee, false);
                _run();
            }, false);
    },
    _init:function(){
        var ele = document.getElementById(kk.game.config["id"]);
        ele.oncontextmenu = function () {
            return false;
        };
        this._setAnimFrame();
        kk.director.init();

        kk.hammer = new Hammer(ele);
        kk.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        kk.hammer.on("tap", function (e) {
            var touchEvent = new kk.EventTouch(e);
            touchEvent._eventCode = kk.EventTouch.EventCode.TAP;
            kk.eventManager.dispatchEvent(touchEvent);
        });
        kk.hammer.on("pan panstart panmove panend", function (e) {
            var touchEvent = new kk.EventTouch(e);
            touchEvent._eventCode = kk.EventTouch.EventCode.PAN;
            kk.eventManager.dispatchEvent(touchEvent);
        });
    },
    _setAnimFrame: function () {
        this._lastTime = new Date();
        this._frameTime = 1000 / 60;
        if((kk.sys.os === kk.sys.OS_IOS && kk.sys.browserType === kk.sys.BROWSER_TYPE_WECHAT)) {
            window.requestAnimFrame = this._stTime;
            window.cancelAnimationFrame = this._ctTime;
        }
        else {
            window.requestAnimFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            this._stTime;
            window.cancelAnimationFrame = window.cancelAnimationFrame ||
            window.cancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.msCancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.oCancelAnimationFrame ||
            this._ctTime;
        }
    },
    _stTime: function(callback){
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, kk.game._frameTime - (currTime - kk.game._lastTime));
        var id = window.setTimeout(function() { callback(); },
            timeToCall);
        kk.game._lastTime = currTime + timeToCall;
        return id;
    },
    _ctTime: function(id){
        window.clearTimeout(id);
    },
    _mainLoop:function () {
        var self = this;
        var callback = function () {
            if (!self._paused) {
                kk.director.mainLoop();
                if(self._intervalId)
                    window.cancelAnimationFrame(self._intervalId);
                self._intervalId = window.requestAnimFrame(callback);
            }
        };
        window.requestAnimFrame(callback);
        self._paused = false;
    },
    _initConfig: function () {
        var self = this, CONFIG_KEY = self.CONFIG_KEY;
        var _init = function (cfg) {
            cfg[CONFIG_KEY.engineDir] = cfg[CONFIG_KEY.engineDir] || "kkframe";
            return cfg;
        };
        if (document["ccConfig"]) {
            self.config = _init(document["ccConfig"]);
        } else {
            try {
                var cocos_script = document.getElementsByTagName('script');
                for(var i=0;i<cocos_script.length;i++){
                    var _t = cocos_script[i].getAttribute('kk');
                    kk.log(cocos_script[i].src);
                    if(_t === '' || _t){break;}
                }
                var _src, txt, _resPath;
                if(i < cocos_script.length){
                    _src = cocos_script[i].src;
                    if(_src){
                        _resPath = /(.*)\//.exec(_src)[0];
                        kk.loader.resPath = _resPath;
                        _src = kk.path.join(_resPath, 'project.json');
                    }
                    txt = kk.loader._loadTxtSync(_src);
                }
                if(!txt){
                    txt = kk.loader._loadTxtSync("project.json");
                }
                var data = JSON.parse(txt);
                self.config = _init(data || {});
            } catch (e) {
                kk.log("Failed to read or parse project.json");
                self.config = _init({});
            }
        }
        kk._initSys();
    },
    //cache for js and module that has added into jsList to be loaded.
    _jsAddedCache: {},
    _getJsListOfModule: function (moduleMap, moduleName, dir) {
        var jsAddedCache = this._jsAddedCache;
        if (jsAddedCache[moduleName]) return null;
        dir = dir || "";
        var jsList = [];
        var tempList = moduleMap[moduleName];
        if (!tempList) throw "can not find module [" + moduleName + "]";
        var ccPath = kk.path;
        for (var i = 0, li = tempList.length; i < li; i++) {
            var item = tempList[i];
            if (jsAddedCache[item]) continue;
            var extname = ccPath.extname(item);
            if (!extname) {
                var arr = this._getJsListOfModule(moduleMap, item, dir);
                if (arr) jsList = jsList.concat(arr);
            } else if (extname.toLowerCase() === ".js") jsList.push(ccPath.join(dir, item));
            jsAddedCache[item] = 1;
        }
        return jsList;
    },
    prepare: function (cb) {
        var self = this;
        var config = self.config, CONFIG_KEY = self.CONFIG_KEY, engineDir = config[CONFIG_KEY.engineDir], loader = kk.loader;
        self._prepareCalled = true;

        var jsList = config[CONFIG_KEY.jsList] || [];
        if (typeof(THREE) != "undefined") {//is single file
            //load user's jsList only
            loader.loadJsWithImg("", jsList, function (err) {
                if (err) throw err;
                self._prepared = true;
                if (cb) cb();
            });
        } else {
            //load cc's jsList first
            var ccModulesPath = kk.path.join(engineDir, "moduleConfig.json");
            loader.loadJson(ccModulesPath, function (err, modulesJson) {
                if (err) throw err;
                var modules = config["modules"] || [];
                var moduleMap = modulesJson["module"];
                var newJsList = [];
                //if (kk._renderType === kk._RENDER_TYPE_WEBGL) modules.splice(0, 0, "shaders");
                //else if (modules.indexOf("core") < 0) modules.splice(0, 0, "core");
                for (var i = 0, li = modules.length; i < li; i++) {
                    var arr = self._getJsListOfModule(moduleMap, modules[i], engineDir);
                    if (arr) newJsList = newJsList.concat(arr);
                }
                newJsList = newJsList.concat(jsList);
                kk.loader.loadJsWithImg(newJsList, function (err) {
                    if (err) throw err;
                    self._prepared = true;
                    if (cb) cb();
                });
            });
        }
    }
}

kk.game._initConfig();