/**
*	/js/collections/stockWidget.js
*/

define([
		'jquery',
		'underscore',
		'backbone',
		'highstock',
		'model_stockWidget'
	], function($, _, Backbone, Highcharts, StockWidget){
	
	return Backbone.Collection.extend({
		initialize: function(){
		},
		model 	: StockWidget,
		add		: function(widgets){
			if(!widgets){
                    return;
                }
			widgets = _.isArray(widgets) ? widgets.slice() : [widgets];
	        for (var i = 0, length = widgets.length; i < length; i++) {
	            var next = widgets[i],
	            	widget = (( next instanceof this.model) ? next  : new this.model(next)); // Create a model if it's a JS object

	            var name = widget.get('name'),
	            	isDuplicate = this.any(function(_widget) {
	            		var o =_widget.get('name');
		                return o === name ;
		            });

	          	if (isDuplicate) {
	            	//this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
	            	this.trigger('invalid', this, widget.attributes, widget.validationError);
	                return false;
	            }
	            Backbone.Collection.prototype.add.call(this, widget);
			}
		}
	});
})