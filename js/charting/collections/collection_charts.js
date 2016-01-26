/**
*	chart collection
*/
define([
	//libraries
	'jquery', 'underscore', 'backbone',
	//models
	'model_chart'
], function(
	//libraries
	$, _, Backbone,
	//models
	ChartModel
	){
	
		return Backbone.Collection.extend({
			model: ChartModel
		});
});