/**
*	/js/collections/collection_submenus.js
*
*/
define([
		'jquery', 'underscore', 'backbone',
		'model_submenu'
	], function(
		$, _, Backbone, 
		SubMenu
	){
		
		return Backbone.Collection.extend({
			model : SubMenu,

			initialize: function(){
				this.listenTo(this, 'reset', this.unselect);
			},
			unselect: function(subtype){
				var models = this.where({type: subtype, selected: true});
				_.each(models, function(o){
					o.toggle();
				});
			},
			select: function(sel){
				var col = this;
				_.each(sel, function(id){
					var s = col.get(id);
					if(s){
						s.set('selected', true);
					}
				})
			}
		});
});