/**
*	/js/collections/rangeButtons.js
*
*/
define([
		'jquery',
		'underscore',
		'backbone',
		'model_rangeButtons'
	], function($, _, Backbone, RangeButtons){
		
		return Backbone.Collection.extend({
			model : RangeButtons
		});
});