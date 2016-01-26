/**
*   /js/collections/collection_trendlines.js
*/
define([
    //libraries
        'jquery', 'underscore', 'backbone',
    //models
        'model_trendline'
    ], function($, _, Backbone, TrendlineModel){
        
        return Backbone.Collection.extend({
            model : TrendlineModel,
            initialize: function(models, options){
            	this.options = options;

            	this.on('empty-model', this.removeModel);
            },
            count: 0,
            removeModel: function(model){
            	this.remove(model);
            },
            add: function(models, redraw){
            	if(!models){
                    return;
                }

                models = _.isArray(models) ? models.slice() : [models];
                for (var i = 0, length = models.length; i < length; i++) {
                    var next = models[i],
                    	isModel = next instanceof this.model,
                        trendline = ( isModel ) ? 
                        	next  : new this.model(_.extend({}, next, {id: 'trendline'+this.count, type: 'trendline', redraw: redraw})); 
                        // Create a model if it's a JS object
                    
                    var max =this.options.max;
                    if(this.length >= max){
	                	this.trigger('warn', {
                            msg: "Max limit reached",
                            str: 'Cannot add more than '+max+' trendlines',
                            on: 'adding trendlines'
                        });
	                	return;
	                }

                    this.count++;
                    Backbone.Collection.prototype.add.call(this, trendline);
                }
            },
            getCurrent: function(){
            	//a model will be the current one till the time its final coords are not set
            	//findWhere returns the first model satisfying the clause
            	
            	var model = this.findWhere({final: null});
            	return model;
            },
            toggleAll: function(){
                this.each(function(model){
                    model.toggle();
                });
            }
        });
});