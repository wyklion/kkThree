/**
 * Created by kk on 2015/5/28.
 */

kk.__getListenerID = function (event) {
    var eventType = kk.Event, getType = event.getType();
    /*
    if(getType === eventType.ACCELERATION)
        return kk._EventListenerAcceleration.LISTENER_ID;
    if(getType === eventType.CUSTOM)
        return event.getEventName();
    if(getType === eventType.KEYBOARD)
        return kk._EventListenerKeyboard.LISTENER_ID;
    if(getType === eventType.MOUSE)
        return kk._EventListenerMouse.LISTENER_ID;
    if(getType === eventType.FOCUS)
        return kk._EventListenerFocus.LISTENER_ID;*/
    if(getType === eventType.TOUCH){
        // Touch listener is very special, it contains two kinds of listeners, EventListenerTouchOneByOne and EventListenerTouchAllAtOnce.
        // return UNKNOWN instead.
    }
    return "";
};

kk.eventManager = {
    DIRTY_NONE:0,
    DIRTY_PRIORITY:1<<0,

    _listenersMap: [],
    _priorityDirtyFlagMap: {},
    _toAddedListeners: [],
    _inDispatch: 0,
    _isEnabled: true,

    _addListener: function (listener) {
        if (this._inDispatch === 0)
            this._forceAddEventListener(listener);
        else
            this._toAddedListeners.push(listener);
    },

    _forceAddEventListener: function (listener) {
        var listenerID = listener._getListenerID();
        var listeners = this._listenersMap[listenerID];
        if (!listeners) {
            listeners = [];
            listeners.gt0Index=0;
            this._listenersMap[listenerID] = listeners;
        }
        listeners.push(listener);

        if (listener._getPriority() != 0)
            this._setDirty(listenerID, this.DIRTY_PRIORITY);
    },
    _getListeners: function (listenerID) {
        return this._listenersMap[listenerID];
    },

    _removeAllListeners: function (listenerVector) {
        if (!listenerVector)
            return;
        var selListener;
        for (var i = 0; i < listenerVector.length;) {
            selListener = listenerVector[i];
            selListener._setRegistered(false);
            if (selListener._getSceneGraphPriority() != null){
                this._dissociateNodeAndEventListener(selListener._getSceneGraphPriority(), selListener);
                selListener._setSceneGraphPriority(null);   // NULL out the node pointer so we don't have any dangling pointers to destroyed nodes.
            }

            if (this._inDispatch === 0)
                cc.arrayRemoveObject(listenerVector, selListener);
            else
                ++i;
        }
    },

    _removeListenersForListenerID: function (listenerID) {
        var listeners = this._listenersMap[listenerID], i;
        if (listeners) {

            var selListener;
            for (var i = 0; i < listeners.length;) {
                selListener = listeners[i];
                selListener._setRegistered(false);

                if (this._inDispatch === 0)
                    kk.arrayRemoveObject(listeners, selListener);
                else
                    ++i;
            }

            // Remove the dirty flag according the 'listenerID'.
            // No need to check whether the dispatcher is dispatching event.
            delete this._priorityDirtyFlagMap[listenerID];

            if (!this._inDispatch) {
                listeners.clear();
                delete this._listenersMap[listenerID];
            }
        }

        var locToAddedListeners = this._toAddedListeners, listener;
        for (i = 0; i < locToAddedListeners.length;) {
            listener = locToAddedListeners[i];
            if (listener && listener._getListenerID() === listenerID)
                kk.arrayRemoveObject(locToAddedListeners, listener);
            else
                ++i;
        }
    },

    _sortEventListeners: function (listenerID) {
        var dirtyFlag = this.DIRTY_NONE,  locFlagMap = this._priorityDirtyFlagMap;
        if (locFlagMap[listenerID])
            dirtyFlag = locFlagMap[listenerID];

        if (dirtyFlag !== this.DIRTY_NONE) {
            // Clear the dirty flag first, if `rootNode` is null, then set its dirty flag of scene graph priority
            locFlagMap[listenerID] = this.DIRTY_NONE;

            if (dirtyFlag & this.DIRTY_PRIORITY)
                this._sortListenersOfPriority(listenerID);
        }
    },

    _sortListenersOfPriority: function (listenerID) {
        var listeners = this._listenersMap[listenerID];
        if (!listeners || listeners.length === 0)
            return;

        // After sort: priority < 0, > 0
        listeners.sort(this._sortListenersOfPriorityAsc);

        // FIXME: Should use binary search
        var index = 0;
        for (var len = listeners.length; index < len;) {
            if (listeners[index]._getPriority() >= 0)
                break;
            ++index;
        }
        listeners.gt0Index = index;
    },

    _sortListenersOfPriorityAsc: function (l1, l2) {
        return l1._getPriority() - l2._getPriority();
    },

    _onUpdateListeners: function (listenerID) {
        var listeners = this._listenersMap[listenerID];
        if (!listeners)
            return;

        var i, selListener;

        for (i = 0; i < listeners.length;) {
            selListener = listeners[i];
            if (!selListener._isRegistered())
                kk.arrayRemoveObject(listeners, selListener);
            else
                ++i;
        }

        if (listeners && listeners.length === 0)
            listeners.length = 0;
    },

    _updateListeners: function (event) {
        var locInDispatch = this._inDispatch;
        if(locInDispatch > 1)
            return;

        if (event.getType() === kk.Event.TOUCH) {
            this._onUpdateListeners(kk._EventListenerTouch.LISTENER_ID);
        } else
            this._onUpdateListeners(kk.__getListenerID(event));

        var locListenersMap = this._listenersMap, locPriorityDirtyFlagMap = this._priorityDirtyFlagMap;
        for (var selKey in locListenersMap) {
            if (locListenersMap[selKey].length === 0) {
                delete locPriorityDirtyFlagMap[selKey];
                delete locListenersMap[selKey];
            }
        }

        var locToAddedListeners = this._toAddedListeners;
        if (locToAddedListeners.length !== 0) {
            for (var i = 0, len = locToAddedListeners.length; i < len; i++)
                this._forceAddEventListener(locToAddedListeners[i]);
            this._toAddedListeners.length = 0;
        }
    },

    _onTouchEventCallback: function(listener, argsObj){
        // Skip if the listener was removed.
        if (!listener._isRegistered)
            return false;

        var event = argsObj.event, hammerEvent = argsObj.hammerEvent;
        event._setCurrentTarget(listener._node);

        var getCode = event.getEventCode(), eventCode = kk.EventTouch.EventCode;
        if (getCode === eventCode.TAP && listener.onTap) {
            listener.onTap(hammerEvent);
        }else if(getCode === eventCode.PAN && listener.onPan){
            listener.onPan(hammerEvent);
        }else if(getCode === eventCode.ROTATE && listener.onRotate){
            listener.onRotate(hammerEvent);
        }else if(getCode === eventCode.PRESS && listener.onPress){
            listener.onPress(hammerEvent);
        }

        // If the event was stopped, return directly.
        if (event.isStopped()) {
            kk.eventManager._updateListeners(event);
            return true;
        }

        if (listener._registered && listener.swallowTouches) {
            return true;
        }
        return false;
    },

    _dispatchTouchEvent: function (event) {
        this._sortEventListeners(kk._EventListenerTouch.LISTENER_ID);

        var listeners = this._getListeners(kk._EventListenerTouch.LISTENER_ID);

        // If there aren't any touch listeners, return directly.
        if (null === listeners)
            return;

        var obj = {event:event, hammerEvent:event._hammerEvent};
        /*
        var originalTouches = event.getTouches(), mutableTouches = kk.copyArray(originalTouches);
        var oneByOneArgsObj = {event: event, needsMutableSet: (listeners), touches: mutableTouches, selTouch: null};
        */
        //
        // process the target handlers 1st
        //
        if (listeners) {
            this._dispatchEventToListeners(listeners, this._onTouchEventCallback, obj);
            if (event.isStopped())
                return;
            /*
            for (var i = 0; i < originalTouches.length; i++) {
                oneByOneArgsObj.selTouch = originalTouches[i];
                this._dispatchEventToListeners(listeners, this._onTouchEventCallback, oneByOneArgsObj);
                if (event.isStopped())
                    return;
            }*/
        }

        this._updateListeners(event);
    },
    /*
    _onTouchesEventCallback: function (listener, callbackParams) {
        // Skip if the listener was removed.
        if (!listener._registered)
            return false;

        var eventCode = kk.EventTouch.EventCode, event = callbackParams.event, hammerEvent = callbackParams.hammerEvent, getCode = event.getEventCode();
        event._setCurrentTarget(listener._node);
        if(getCode === eventCode.TAP && listener.onTap)
            listener.onTap(hammerEvent);
        else if(getCode === eventCode.PAN && listener.onPan)
            listener.onPan(hammerEvent);
        else if(getCode === eventCode.ROTATE && listener.onRotate)
            listener.onRotate(hammerEvent);
        else if(getCode === eventCode.PRESS && listener.onPress)
            listener.onPress(hammerEvent);

        // If the event was stopped, return directly.
        if (event.isStopped()) {
            kk.eventManager._updateListeners(event);
            return true;
        }
        return false;
    },*/

    _dispatchEventToListeners: function (listeners, onEvent, eventOrArgs) {
        var shouldStopPropagation = false;
        var i = 0, selListener;
        if (listeners && listeners.length !== 0){
            for (; i < listeners.gt0Index; ++i) {
                selListener = listeners[i];
                if (selListener.isEnabled() && !selListener._isPaused() && selListener._isRegistered() && onEvent(selListener, eventOrArgs)) {
                    shouldStopPropagation = true;
                    break;
                }
            }
        }

        if (listeners && !shouldStopPropagation) {    // priority > 0
            for (; i < listeners.length; ++i) {
                selListener = listeners[i];
                if (selListener.isEnabled() && !selListener._isPaused() && selListener._isRegistered() && onEvent(selListener, eventOrArgs)) {
                    shouldStopPropagation = true;
                    break;
                }
            }
        }
    },

    _setDirty: function (listenerID, flag) {
        var locDirtyFlagMap = this._priorityDirtyFlagMap;
        if (locDirtyFlagMap[listenerID] == null)
            locDirtyFlagMap[listenerID] = flag;
        else
            locDirtyFlagMap[listenerID] = flag | locDirtyFlagMap[listenerID];
    },

    addListener: function (listener, priority) {
        if(!(listener instanceof kk.EventListener)){
            listener = kk.EventListener.create(listener);
        } else {
            if(listener._isRegistered()){
                return;
            }
        }

        if (!listener.checkAvailable())
            return;

        priority = priority || 0;
        listener._setPriority(priority);
        listener._setRegistered(true);
        listener._setPaused(false);
        this._addListener(listener);

        return listener;
    },

    addCustomListener: function (eventName, callback) {
        var listener = new kk._EventListenerCustom(eventName, callback);
        this.addListener(listener, 1);
        return listener;
    },

    removeListener: function (listener) {
        if (listener == null)
            return;

        var isFound, locListener = this._listenersMap;
        for (var selKey in locListener) {
            var listeners = locListener[selKey];

            isFound = this._removeListenerInArray(listeners, listener);
            if (isFound)
                this._setDirty(listener._getListenerID(), this.DIRTY_PRIORITY);

            if (listeners.length === 0) {
                delete this._priorityDirtyFlagMap[listener._getListenerID()];
                delete locListener[selKey];
            }

            if (isFound)
                break;
        }

        if (!isFound) {
            var locToAddedListeners = this._toAddedListeners;
            for (var i = 0, len = locToAddedListeners.length; i < len; i++) {
                var selListener = locToAddedListeners[i];
                if (selListener === listener) {
                    kk.arrayRemoveObject(locToAddedListeners, selListener);
                    selListener._setRegistered(false);
                    break;
                }
            }
        }
    },

    _removeListenerInArray : function(listeners, listener){
        if (listeners == null)
            return false;

        for (var i = 0, len = listeners.length; i < len; i++) {
            var selListener = listeners[i];
            if (selListener === listener) {
                selListener._setRegistered(false);
                if (this._inDispatch === 0)
                    kk.arrayRemoveObject(listeners, selListener);
                return true;
            }
        }
        return false;
    },

    removeListeners: function (listenerType, recursive) {
        var _t = this;
        if (listenerType === kk.EventListener.TOUCH)
            _t._removeListenersForListenerID(kk._EventListenerTouch.LISTENER_ID);
        /*
        else if (listenerType === cc.EventListener.ACCELERATION)
            _t._removeListenersForListenerID(kk._EventListenerAcceleration.LISTENER_ID);
        else if (listenerType === cc.EventListener.KEYBOARD)
            _t._removeListenersForListenerID(kk._EventListenerKeyboard.LISTENER_ID);
        else
            cc.log(cc._LogInfos.eventManager_removeListeners);*/
    },

    /**
     * Removes all custom listeners with the same event name
     * @param {string} customEventName
     */
    removeCustomListeners: function (customEventName) {
        this._removeListenersForListenerID(customEventName);
    },

    removeAllListeners: function () {
        var locListeners = this._listenersMap, locInternalCustomEventIDs = this._internalCustomListenerIDs;
        for (var selKey in locListeners){
            this._removeListenersForListenerID(selKey);
        }
    },

    setPriority: function (listener, priority) {
        if (listener == null)
            return;

        var locListeners = this._listenersMap;
        for (var selKey in locListeners) {
            var selListeners = locListeners[selKey];
            if (selListeners) {
                var found = selListeners.indexOf(listener);
                if (found !== -1) {
                    if (listener._getPriority() !== priority) {
                        listener._setPriority(priority);
                        this._setDirty(listener._getListenerID(), this.DIRTY_PRIORITY);
                    }
                    return;
                }
            }
        }
    },

    setEnabled: function (enabled) {
        this._isEnabled = enabled;
    },

    isEnabled: function () {
        return this._isEnabled;
    },

    dispatchEvent: function (event) {
        if (!this._isEnabled)
            return;

        this._inDispatch++;
        if(!event || !event.getType)
            throw "event is undefined";
        if (event.getType() === kk.Event.TOUCH) {
            this._dispatchTouchEvent(event);
            this._inDispatch--;
            return;
        }

        var listenerID = kk.__getListenerID(event);
        this._sortEventListeners(listenerID);
        var selListeners = this._listenersMap[listenerID];
        if (selListeners != null)
            this._dispatchEventToListeners(selListeners, this._onListenerCallback, event);

        this._updateListeners(event);
        this._inDispatch--;
    },

    _onListenerCallback: function(listener, event){
        listener._onEvent(event);
        return event.isStopped();
    },

    dispatchCustomEvent: function (eventName, optionalUserData) {
        var ev = new kk.EventCustom(eventName);
        ev.setUserData(optionalUserData);
        this.dispatchEvent(ev);
    }
}