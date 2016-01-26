/**
*	/js/messenger.js
*/
define([
    'jquery', 'underscore', 'backbone'
    ], function($, _, Backbone){

        /**
        *   This class is used to handle the notification of messages in the stockWidget
        *
        *   @classDesc Messenger
        *   @property errorQueue
        *   @property errorHistory
        *   @property warningHistory
        *
        *   @param {Object} args { <br>
        *       notifyHandler : ... , <br>
        *       errorHandler : ... <br>, 
        *       view : ... <br>,
        *       widgetmodel : ... <br>, 
        *       onlyErrors : {Boolean} Should it display only error messages <br>
        *   }
        */
        function Messenger(args){
            args = args || {};
            this.notifyHandler = _.bind(args.notifyHandler, args.view);
            this.errorHandler = _.bind(args.errorHandler, args.view);
            this.model = args.model;
            this.onlyErrors = args.onlyErrors;

            this.errorQueue = [];

            this.errorHistory = [];
            this.warningHistory = [];
        };

        var proto = _.extend({
            /**
            *   This method should be used to notify errors when even there is a fatal error & can't even render the view
            *
            *   @method failure
            *   @param {Object} args see structure above 
            *   @public
            */
            failure: function(args){
                //unable to even render the view
                this.errorHistory.push(args);
                console && console.error(args);
            },
            /**
            *   Use this method to display widget crash screen. Typically used for onload fatal errors
            *
            *   @method fatal
            *   @param {Object} args see structure above 
            *   @public
            */
            fatal: function(args){
                //fatal error - onLoad error
                this.errorHandler(args);
                this.errorQueue.length = 0;
            },
            /**
            *   use this to document any error; notifies it on the chart in red colour or calls fatal if its a fatal error
            *
            *   @method error
            *   @param {Object} args {<br/>
            *       error: error object, <br/>
            *       model: model ,<br/>
            *       data: data, <br/>
            *       msg: error message, <br/>
            *       status: any ajax status, <br/>
            *       on: where does the error occur. used to display generic message eg. 'parsing data' / 'adding overlays' , <br/>
            *       source: if its value is 'data'/'ajax'/'chart' & if its on load then it will display a fatal message, <br/>
            *       url : the ajax url which had an error, <br/>
            *       range: new time range, <br/>
            *       loaded: pass true to hide the loading screen along with this messenger call <br/>
            *   }
            *   @public
            */
            error: function(args){
                args.type = 'error';
                if(!args.source){
                    args.str = "Error while "+args.on;
                }
                this.errorQueue.push(args);
                this.errorHistory.push(args);

                if(this.model.get('onLoad') && /ajax|data|chart/.exec(args.source)){
                    if(args.range === this.model.getCurrentRange()){
                        this.fatal(args);
                    }else{
                        this.notify();
                    }
                }else{
                    this.notify();
                }
            },
            /**
            *   Displays any successful message. Shows it in green colour
            *
            *   @method success
            *   @param {Object} args see structure above
            *   @public
            */
            success: function(args){
                args.type = 'success';
                //if(!this.onlyErrors){
                    this.notifyHandler(args, !this.onlyErrors);
                //}
            },
            /**
            *   This will add a warning notification on the chart if its allowed (onlyErrors not set). Shows it in yellow colour
            *
            *   @method warn
            *   @param {Object} args  see structure above
            *   @public
            */
            warn: function(args){
                args.type = 'warn';
                this.warningHistory.push(args);
                //if(!this.onlyErrors){
                    this.notifyHandler(args, true);
                //}
            },
            /**
            *   Use this to only log the message/param in the console of the browser
            *
            *   @method log
            *   @param {Object} args  see structure above
            *   @public
            */
            log: function(args){
               console && console.log(args);
            },
            /**
            *
            *   @method notify
            *   @private
            */
            notify: function(){
                if(!this.errorQueue.length)
                    return;

                if(this.notifyHandler(this.errorQueue, true)){
                    this.errorQueue.length = 0;
                }
            },
            /**
            *   Prints the errors & warnings so that we can debug them
            *
            *   @method debug
            *   @public
            */
            debug: function(){
                console && console.log('Errors:', this.errorHistory);
                console && console.log('Warnings:', this.warningHistory);
            },
            /**
            *   Deletes all the previous error history of the widget since chart load
            *
            *   @method clearHistory
            *   @public
            */
            clearHistory: function(){
                this.errorHistory.length = 0;
            }
        }, Backbone.Events);

        Messenger.prototype = proto;

        return Messenger
});