/**
*	/js/models/model_indicator.js
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
			crosshair: null,

			hasCrosshair: true,
			visible: true,
			hasError: false
		},
		toggle: function(){
			this.set('visible', !this.get('visible'));
		},
        pluckState: function(){        	
            var state = this.pick('id', 'param');//S.K added 'param' for saving RSi
            return state;
        },
        reload: function(forceReflow, setData){
        	this.trigger('reload', forceReflow, setData);
        }
		
	});

})