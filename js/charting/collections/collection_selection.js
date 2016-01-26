/**
*	/js/collections/collection_selection.js
*/
define([
	//libraries
		'jquery', 'underscore', 'backbone', 'localStorage',
	//config
		'config',
	//models
		'model_selection'
	], function (
	//libraries
		$, _, Backbone, localStorage,
	//config
		defaultConfig,
	//models
		SelectionModel
	) {
	return Backbone.Collection.extend({
		initialize: function(options){

			//initializing localStorage
			//TODO: catch !localStorage error
			this.localStorage =  new Backbone.LocalStorage(defaultConfig.chart.localStorageKey);
		},
		model: SelectionModel
	});
});