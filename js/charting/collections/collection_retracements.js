/**
*   /js/collections/collection_retracements.js
*/
define([
    //libraries
        'jquery', 'underscore', 'backbone',
    //models
        'model_retracement'
    ], function($, _, Backbone, RetracementModel){
        
        return Backbone.Collection.extend({
            model : RetracementModel,
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
                        retracement = ( isModel ) ? 
                        	next  : new this.model(_.extend({}, next, {	id: 'fibonnaci'+this.count, 
                        												intervals: this.options.intervals,
                        												type: 'retracement',
                                                                        redraw: redraw
                        											})); 
                        // Create a model if it's a JS object
                    
                    if(this.length < this.options.max){
                    	this.count++;
                    	Backbone.Collection.prototype.add.call(this, retracement);
                    }else{
	                //	console.warn("Can't add more, max limit reached. Updating the last instead");
	                	if(isModel){
	                		//do not add to the collection
	                		//should get garbaged collected
	                		continue;
	                	}

	                	var m = this.getLast();
	                	if(m){
	                		m.refresh(next);
	                		this.update = true;
	                	}
	                	return;
	                }
                }
            },
            reset: function(models, options){
                this.count = 0;
                Backbone.Collection.prototype.reset.call(this, models, options);
            },
            getLast: function(){
            	return this.at(this.length - 1);
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