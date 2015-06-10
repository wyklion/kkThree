/**
 * Created by kk on 2015/6/1.
 */

var kk = kk || {};

/**
 * @namespace
 * @name ClassManager
 */
var ClassManager = {
    id : (0|(Math.random()*998)),

    instanceId : (0|(Math.random()*998)),

    compileSuper : function(func, name, id){
        //make the func to a string
        var str = func.toString();
        //find parameters
        var pstart = str.indexOf('('), pend = str.indexOf(')');
        var params = str.substring(pstart+1, pend);
        params = params.trim();

        //find function body
        var bstart = str.indexOf('{'), bend = str.lastIndexOf('}');
        var str = str.substring(bstart+1, bend);

        //now we have the content of the function, replace this._super
        //find this._super
        while(str.indexOf('this._super') !== -1)
        {
            var sp = str.indexOf('this._super');
            //find the first '(' from this._super)
            var bp = str.indexOf('(', sp);

            //find if we are passing params to super
            var bbp = str.indexOf(')', bp);
            var superParams = str.substring(bp+1, bbp);
            superParams = superParams.trim();
            var coma = superParams? ',':'';

            //replace this._super
            str = str.substring(0, sp)+  'ClassManager['+id+'].'+name+'.call(this'+coma+str.substring(bp+1);
        }
        return Function(params, str);
    },

    getNewID : function(){
        return this.id++;
    },

    getNewInstanceId : function(){
        return this.instanceId++;
    }
};
ClassManager.compileSuper.ClassManager = ClassManager;

/* Managed JavaScript Inheritance
 * Based on John Resig's Simple JavaScript Inheritance http://ejohn.org/blog/simple-javascript-inheritance/
 * MIT Licensed.
 */
(function () {
    var fnTest = /\b_super\b/;
    var config = kk.game.config;
    var releaseMode = config[kk.game.CONFIG_KEY.classReleaseMode];
    if(releaseMode) {
        console.log("release Mode");
    }
    /**
     * The base Class implementation (does nothing)
     * @class
     */
    kk.Class = function () {
    };

    /**
     * Create a new Class that inherits from this Class
     * @static
     * @param {object} props
     * @return {function}
     */
    kk.Class.extend = function (prop) {
        var _super = this.prototype;

        // Instantiate a base Class (but only create the instance,
        // don't run the init constructor)
        var prototype = Object.create(_super);

        var classId = ClassManager.getNewID();
        ClassManager[classId] = _super;

        var desc = { writable: true, enumerable: false, configurable: true };
        prototype.__instanceId = null;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            var isFunc = (typeof prop[name] === "function");
            var override = (typeof _super[name] === "function");
            var hasSuperCall = fnTest.test(prop[name]);

            if (releaseMode && isFunc && override && hasSuperCall) {
                desc.value = ClassManager.compileSuper(prop[name], name, classId);
                Object.defineProperty(prototype, name, desc);
            } else if (isFunc && override && hasSuperCall) {
                desc.value = (function (name, fn) {
                    return function () {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-Class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]);
                Object.defineProperty(prototype, name, desc);
            } else if (isFunc) {
                desc.value = prop[name];
                Object.defineProperty(prototype, name, desc);
            } else {
                prototype[name] = prop[name];
            }
        }

        // The dummy Class constructor
        function Class() {
            this.__instanceId = ClassManager.getNewInstanceId();
            // All construction is actually done in the init method
            if (this.ctor)
                this.ctor.apply(this, arguments);
        }
        Class.id = classId;

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this Class extendable
        Class.extend = kk.Class.extend; //arguments.callee;

        return Class;
    };
})();
