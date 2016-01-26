/**
*	/js/models/model_submenu.js
*
*/
define([
		'jquery', 'underscore', 'backbone'
	], function(
		$, _, Backbone
	){
		
	return Backbone.Model.extend({
		defaults:{
			selected: false
		},
		validate: function(){
			if(!attrs.id){
				return 'Missing parameters: id';
			}
		},
		toggle: function(silent){
			this.set(
				{ selected	: !this.get('selected')},
				{ silent	: silent || false} // whether to NOT trigger a change event
			);
		},
		click: function(opt){
			this.trigger('clicked', this, opt);
		},
		unclick: function(opt){
			this.trigger('unclicked', this, opt);
		},
		isSelected: function(){
			return  this.get('selected');
		}
	});
});