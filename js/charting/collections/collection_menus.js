/**
*	/js/collections/menu.js
*
*/
define([
		'jquery',
		'underscore',
		'backbone',
		'model_menu'
	], function($, _, Backbone, Menu){
		
		return Backbone.Collection.extend({
			model : Menu
		});
});