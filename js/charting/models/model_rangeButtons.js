/**
*	/js/models/model_rangeButtons.js
*
*	This file has the class & its methods for creating rangeSelector buttons
*/
define([
		'jquery',
		'underscore',
		'backbone'
	], function($, _, Backbone){
		
		return Backbone.Model.extend({
			defaults:{
				selected: false
			},
			validate: function(attrs){
				if(!attrs.id){
					return 'Missing parameters: id';
				}
			},
			select: function(silent){
				this.set({
					selected : true
				}, {silent: silent || false});
			},
			deselect: function(silent){
				this.set({
					selected : false
				}, {silent: silent || false});
			},
			click: function(){
				this.trigger('clicked', this);
			}
		});
});