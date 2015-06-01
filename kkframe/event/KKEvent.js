
/**
 * Base class of all kinds of events.
 * @class
 * @extends kk.Class
 */
kk.Event = kk.Class.extend({
    _type: 0,                                   //  Event type
    _isStopped: false,                         //< whether the event has been stopped.
    _currentTarget: null,                       //< Current target

    _setCurrentTarget: function (target) {
        this._currentTarget = target;
    },

    ctor: function (type) {
        this._type = type;
    },

    /**
     * Gets the event type
     * @function
     * @returns {Number}
     */
    getType: function () {
        return this._type;
    },

    /**
     * Stops propagation for current event
     * @function
     */
    stopPropagation: function () {
        this._isStopped = true;
    },

    /**
     * Checks whether the event has been stopped
     * @function
     * @returns {boolean}
     */
    isStopped: function () {
        return this._isStopped;
    },

    /**
     * <p>
     *     Gets current target of the event                                                            <br/>
     *     note: It only be available when the event listener is associated with node.                <br/>
     *          It returns 0 when the listener is associated with fixed priority.
     * </p>
     * @function
     * @returns {cc.Node}  The target with which the event associates.
     */
    getCurrentTarget: function () {
        return this._currentTarget;
    }
});

//event type
/**
 * The type code of Touch event.
 * @constant
 * @type {number}
 */
kk.Event.TOUCH = 0;
/**
 * The type code of Keyboard event.
 * @constant
 * @type {number}
 */
kk.Event.KEYBOARD = 1;
/**
 * The type code of Acceleration event.
 * @constant
 * @type {number}
 */
kk.Event.ACCELERATION = 2;
/**
 * The type code of Mouse event.
 * @constant
 * @type {number}
 */
kk.Event.CUSTOM = 3;

/**
 * The Custom event
 * @class
 * @extends cc.Event
 */
kk.EventCustom = kk.Event.extend({
    _eventName: null,
    _userData: null,

    ctor: function (eventName) {
        kk.Event.prototype.ctor.call(this, kk.Event.CUSTOM);
        this._eventName = eventName;
    },

    /**
     * Sets user data
     * @param {*} data
     */
    setUserData: function (data) {
        this._userData = data;
    },

    /**
     * Gets user data
     * @returns {*}
     */
    getUserData: function () {
        return this._userData;
    },

    /**
     * Gets event name
     * @returns {String}
     */
    getEventName: function () {
        return this._eventName;
    }
});

/**
 * The touch event
 * @class
 * @extends kk.Event
 */
kk.EventTouch = kk.Event.extend({
    _eventCode: 0,
    _touches: null,
    _hammerEvent:null,

    ctor: function (e) {
        kk.Event.prototype.ctor.call(this, kk.Event.TOUCH);
        this._hammerEvent = e;
    },

    /**
     * Returns event code
     * @returns {number}
     */
    getEventCode: function () {
        return this._eventCode;
    },

    /**
     * Returns touches of event
     * @returns {Array}
     */
    getTouches: function () {
        return this._touches;
    },

    _setEventCode: function (eventCode) {
        this._eventCode = eventCode;
    },

    _setTouches: function (touches) {
        this._touches = touches;
    }
});

/**
 * The maximum touch numbers
 * @constant
 * @type {Number}
 */
kk.EventTouch.MAX_TOUCHES = 5;

kk.EventTouch.EventCode = {TAP: 0, PAN: 1};
