/**
*	/js/collections/collection_overlays.js
*/
define([
	//libraies
		'jquery', 'underscore', 'backbone',
	//models
		'model_overlay'
	], function(
	//libraries
		$, _ , Backbone,
	//models
		OverlayModel
	){

	return Backbone.Collection.extend({
		model: OverlayModel
	});

})