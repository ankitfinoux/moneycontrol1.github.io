/**
*	/js/models/model_overlay.js
*/
define([
	//libraies
		'jquery', 'underscore', 'backbone'
	], function(
	//libraries
		$, _ , Backbone
	){

	return Backbone.Model.extend({
		defaults:{
			ref: null,
			visible: true,
			hasError: false
		},
		addReference: function(serie){
			this.set('ref', serie);
		},
		error: function(){
			this.set('hasError', true);
		},
		getReference: function(){
			return this.get('ref');
		},
		toggle: function(){
			this.set('visible', !this.get('visible'));
		},
		hide: function(){
			var refs = this.getReference();
			_.each(refs, function(ref){
				ref.hide();
			});
		},
		show: function(){
			var refs = this.getReference();
			_.each(refs, function(ref){
				ref.show();
			});
		},
		update: function(obj){
			var ref = this.getReference();

			_.each(ref, function(r, i){
				r.update(obj[i], false);
			});
		},
		setData: function(obj){
			var ref = this.getReference();

			_.each(ref, function(r, i){
				r.setData(obj[i].data, false);
			});
		},
        pluckState: function(){
        	var state = this.pick('id', 'name', 'title','param', 'colour', 'opacity', 'readFromInput');
            return state;
        }
	});

})