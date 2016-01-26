/**
*	/js/models/model_menu.js
*
*	This file has the class & its methods for creating drop down menu
*/
define([
		'jquery', 'underscore', 'backbone'
	], function($, _, Backbone){
		
	return Backbone.Model.extend({
		defaults:{
			subMenuHidden: true
		},

		initialize: function(){
			// this is a self defining function to handle type of submenu click
			//if type == 'checkbox', then we do a noop
			//if type == 'radio', then we unRun the currently selected option
			this.handleClick = (function(type){
				if(type === 'radio'){
					return function(){
						var submenuSelected = this.get('submenus').findWhere({selected: true});
						if(submenuSelected){
							submenuSelected.unclick();
						}
					}
				}

				//else return a noop
				return function(){}
			})(this.get('type'));
		},
		validate: function(attrs){
			if(!attrs.id){
				return 'Missing parameters: id';
			}
		},
		toggleSubMenu: function(){
			this.set('subMenuHidden', !this.get('subMenuHidden'));
		}
	});
});
