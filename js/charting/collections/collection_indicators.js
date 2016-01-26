/**
*	/js/collections/collection_indicators.js
*/
define([
	//libraies
		'jquery', 'underscore', 'backbone',
	//models
		'model_indicator'
	], function(
	//libraries
		$, _ , Backbone,
	//models
		IndicatorModel
	){

	return Backbone.Collection.extend({
		model: IndicatorModel
	});

})