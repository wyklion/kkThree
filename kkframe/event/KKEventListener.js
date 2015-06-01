
kk.EventListener = kk.Class.extend({
    _onEvent: null,                          // Event callback function
    _type: 0,                                 // Event listener type
    _listenerID: null,                       // Event listener ID
    _registered: false,                     // Whether the listener has been added to dispatcher.

    _priority: 0,                      // The higher the number, the higher the priority, 0 is for scene graph base priority.
    _paused: true,                        // Whether the listener is paused
    _isEnabled: true,                      // Whether the listener is enabled

    /**
     * Initializes event with type and callback function
     * @param {number} type
     * @param {string} listenerID
     * @param {function} callback
     */
    ctor: function (type, listenerID, callback) {
        this._onEvent = callback;
        this._type = type || 0;
        this._listenerID = listenerID || "";
    },

    /**
     * <p>
     *     Sets paused state for the listener
     *     The paused state is only used for scene graph priority listeners.
     *     `EventDispatcher::resumeAllEventListenersForTarget(node)` will set the paused state to `true`,
     *     while `EventDispatcher::pauseAllEventListenersForTarget(node)` will set it to `false`.
     *     @note 1) Fixed priority listeners will never get paused. If a fixed priority doesn't want to receive events,
     *              call `setEnabled(false)` instead.
     *            2) In `Node`'s onEnter and onExit, the `paused state` of the listeners which associated with that node will be automatically updated.
     * </p>
     * @param {boolean} paused
     * @private
     */
    _setPaused: function (paused) {
        this._paused = paused;
    },

    /**
     * Checks whether the listener is paused
     * @returns {boolean}
     * @private
     */
    _isPaused: function () {
        return this._paused;
    },

    /**
     * Marks the listener was registered by EventDispatcher
     * @param {boolean} registered
     * @private
     */
    _setRegistered: function (registered) {
        this._registered = registered;
    },

    /**
     * Checks whether the listener was registered by EventDispatcher
     * @returns {boolean}
     * @private
     */
    _isRegistered: function () {
        return this._registered;
    },

    /**
     * Gets the type of this listener
     * @note It's different from `EventType`, e.g. TouchEvent has two kinds of event listeners - EventListenerOneByOne, EventListenerAllAtOnce
     * @returns {number}
     * @private
     */
    _getType: function () {
        return this._type;
    },

    /**
     *  Gets the listener ID of this listener
     *  When event is being dispatched, listener ID is used as key for searching listeners according to event type.
     * @returns {string}
     * @private
     */
    _getListenerID: function () {
        return this._listenerID;
    },

    /**
     * Sets the fixed priority for this listener
     *  @note This method is only used for `fixed priority listeners`, it needs to access a non-zero value. 0 is reserved for scene graph priority listeners
     * @param {number} priority
     * @private
     */
    _setPriority: function (priority) {
        this._priority = priority;
    },

    /**
     * Gets the fixed priority of this listener
     * @returns {number} 0 if it's a scene graph priority listener, non-zero for fixed priority listener
     * @private
     */
    _getPriority: function () {
        return this._priority;
    },

    /**
     * Checks whether the listener is available.
     * @returns {boolean}
     */
    checkAvailable: function () {
        return this._onEvent !== null;
    },

    /**
     * Clones the listener, its subclasses have to override this method.
     * @returns {cc.EventListener}
     */
    clone: function () {
        return null;
    },

    /**
     *  Enables or disables the listener
     *  @note Only listeners with `enabled` state will be able to receive events.
     *          When an listener was initialized, it's enabled by default.
     *          An event listener can receive events when it is enabled and is not paused.
     *          paused state is always false when it is a fixed priority listener.
     * @param {boolean} enabled
     */
    setEnabled: function(enabled){
        this._isEnabled = enabled;
    },

    /**
     * Checks whether the listener is enabled
     * @returns {boolean}
     */
    isEnabled: function(){
        return this._isEnabled;
    },

    /**
     * <p>Currently JavaScript Bindings (JSB), in some cases, needs to use retain and release. This is a bug in JSB,
     * and the ugly workaround is to use retain/release. So, these 2 methods were added to be compatible with JSB.
     * This is a hack, and should be removed once JSB fixes the retain/release bug<br/>
     * You will need to retain an object if you created a listener and haven't added it any target node during the same frame.<br/>
     * Otherwise, JSB's native autorelease pool will consider this object a useless one and release it directly,<br/>
     * when you want to use it later, a "Invalid Native Object" error will be raised.<br/>
     * The retain function can increase a reference count for the native object to avoid it being released,<br/>
     * you need to manually invoke release function when you think this object is no longer needed, otherwise, there will be memory learks.<br/>
     * retain and release function call should be paired in developer's game code.</p>
     * @function
     * @see cc.EventListener#release
     */
    retain:function () {
    },
    /**
     * <p>Currently JavaScript Bindings (JSB), in some cases, needs to use retain and release. This is a bug in JSB,
     * and the ugly workaround is to use retain/release. So, these 2 methods were added to be compatible with JSB.
     * This is a hack, and should be removed once JSB fixes the retain/release bug<br/>
     * You will need to retain an object if you created a listener and haven't added it any target node during the same frame.<br/>
     * Otherwise, JSB's native autorelease pool will consider this object a useless one and release it directly,<br/>
     * when you want to use it later, a "Invalid Native Object" error will be raised.<br/>
     * The retain function can increase a reference count for the native object to avoid it being released,<br/>
     * you need to manually invoke release function when you think this object is no longer needed, otherwise, there will be memory learks.<br/>
     * retain and release function call should be paired in developer's game code.</p>
     * @function
     * @see cc.EventListener#retain
     */
    release:function () {
    }
});

// event listener type
/**
 * The type code of unknown event listener.
 * @constant
 * @type {number}
 */
kk.EventListener.UNKNOWN = 0;
/**
 * The type code of one by one touch event listener.
 * @constant
 * @type {number}
 */
kk.EventListener.TOUCH = 1;
/**
 * The type code of all at once touch event listener.
 * @constant
 * @type {number}
 */
kk.EventListener.KEYBOARD = 2;
/**
 * The type code of mouse event listener.
 * @constant
 * @type {number}
 */
kk.EventListener.ACCELERATION = 3;
/**
 * The type code of focus event listener.
 * @constant
 * @type {number}
 */
kk.EventListener.CUSTOM = 4;

kk._EventListenerCustom = kk.EventListener.extend({
    _onCustomEvent: null,
    ctor: function (listenerId, callback) {
        this._onCustomEvent = callback;
        var selfPointer = this;
        var listener = function (event) {
            if (selfPointer._onCustomEvent !== null)
                selfPointer._onCustomEvent(event);
        };

        kk.EventListener.prototype.ctor.call(this, kk.EventListener.CUSTOM, listenerId, listener);
    },

    checkAvailable: function () {
        return (kk.EventListener.prototype.checkAvailable.call(this) && this._onCustomEvent !== null);
    },

    clone: function () {
        return new kk._EventListenerCustom(this._listenerID, this._onCustomEvent);
    }
});

kk._EventListenerCustom.create = function (eventName, callback) {
    return new kk._EventListenerCustom(eventName, callback);
};

kk._EventListenerTouch = kk.EventListener.extend({
    _claimedTouches: null,
    swallowTouches: false,
    onTap:null,
    onPan:null,
    /*
    onPanStart:null,
    onPanMove:null,
    onPanEnd:null,
    onPanCancel:null,*/
    ctor: function () {
        kk.EventListener.prototype.ctor.call(this, kk.EventListener.TOUCH, kk._EventListenerTouch.LISTENER_ID, null);
        this._claimedTouches = [];
    },

    setSwallowTouches: function (needSwallow) {
        this.swallowTouches = needSwallow;
    },

    isSwallowTouches: function(){
        return this.swallowTouches;
    },

    clone: function () {
        var eventListener = new kk._EventListenerTouch();
        eventListener.onTap = this.onTap;
        eventListener.onPan = this.onPan;
        eventListener.swallowTouches = this.swallowTouches;
        return eventListener;
    },

    checkAvailable: function () {
        if(!this.onTap && !this.onPan){
            return false;
        }
        return true;
    }
});

kk._EventListenerTouch.LISTENER_ID = "__kk_touch";

kk._EventListenerTouch.create = function () {
    return new kk._EventListenerTouch();
};

/**
 * Create a EventListener object by json object
 * @function
 * @static
 * @param {object} argObj a json object
 * @returns {cc.EventListener}
 * todo: It should be the direct use new
 * @example
 * cc.EventListener.create({
 *       event: cc.EventListener.TOUCH_ONE_BY_ONE,
 *       swallowTouches: true,
 *       onTouchBegan: function (touch, event) {
 *           //do something
 *           return true;
 *       }
 *    });
 */
kk.EventListener.create = function(argObj){

    var listenerType = argObj.event;
    delete argObj.event;

    var listener = null;
    if(listenerType === kk.EventListener.TOUCH)
        listener = new kk._EventListenerTouch();
    /*
    else if(listenerType === kk.EventListener.CUSTOM){
        listener = new kk._EventListenerCustom(argObj.eventName, argObj.callback);
        delete argObj.eventName;
        delete argObj.callback;
    } else if(listenerType === kk.EventListener.KEYBOARD)
        listener = new kk._EventListenerKeyboard();
    else if(listenerType === kk.EventListener.ACCELERATION){
        listener = new kk._EventListenerAcceleration(argObj.callback);
        delete argObj.callback;
    }*/

    for(var key in argObj) {
        listener[key] = argObj[key];
    }

    return listener;
};
