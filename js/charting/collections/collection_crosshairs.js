/**
*   /js/collections/collection_crosshairs.js
*
*/
define([
    //libraries
        'jquery', 'underscore', 'backbone',
    //models
        'model_crosshair'
    ], function($, _, Backbone, CrossHairModel){
        
        return Backbone.Collection.extend({
            model : CrossHairModel,
            initialize: function(models, options){
                this.options = options;
            },
            count: 0,
            add: function(models, redraw){
                if(!models){
                    return;
                }
                var result = [];

                models = _.isArray(models) ? models.slice() : [models];
                for (var i = 0, length = models.length; i < length; i++) {
                    var next = models[i],
                        crosshair = (( next instanceof this.model) ? 
                            next  : new this.model(_.extend({}, next, {id: 'crosshair'+this.count, type: 'crosshair', redraw: redraw}))); 
                        // Create a model if it's a JS object
                    
                    var max = this.options.max;
                    if(this.length >= max){
                        this.trigger('warn', {
                            msg: "Max limit reached",
                            str: 'Cannot add more than '+max+' crosshairs',
                            on: 'adding trendlines'
                        });
                        return;
                    }
                    this.count++;
                    Backbone.Collection.prototype.add.call(this, crosshair);

                    result.push(crosshair);
                }
                return result.length === 1 ? result[0] : result;
            },
            reset: function(models, options){
                this.count = 0;
                Backbone.Collection.prototype.reset.call(this, models, options);
            },
            toggleAll: function(){
                this.each(function(model){
                    model.toggle();
                });
            }
        });
});