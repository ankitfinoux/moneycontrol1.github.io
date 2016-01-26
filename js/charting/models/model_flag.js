/**
*	/js/models/model_flag.js
*/
define([
	//libraies
		'jquery', 'underscore', 'backbone',
	//config
		'config'
	], function(
	//libraries
		$, _ , Backbone,
	//config
		defaultConfig
	){
		var spriteURL = defaultConfig.chart.spriteURL;

	return Backbone.Model.extend({
		defaults :{
			data: null,
			visible: false,
			useSprite: true
		},
		toggle: function(){
			var isVisible = this.get('visible'),
				op = isVisible ? 'hide' : 'show';

			this[op]();
		},

		hide: function(){
			//hide & show doesn't work correctly with the single-series-for-flags approach. 
			//on updating range the hidden flag points are made visible and stacked flags remain hanging in the air until redrawn
			
			//here we will only unset the visibility, getData should handle the rest
			
			this.set('visible', false);
		},

		show: function(){
			//here we will only set the visibility, getData should handle the rest
			this.set('visible', true);
		},

		hasData : function(){
			var data = this.get('data');
			return  data && data.length;
		},

		getData: function(){
			var attr = this.toJSON();

			return attr.visible ? attr.data : [];
		},

		setData: function(data){
			//adding shape & style properties to the flag
			var flag = this,
				shape = this.get('shape') , //|| (this.get('useSprite') && spriteURL && 'url('+spriteURL+')') || null,
				style = this.get('style');
			for(var i=0, len = data.length; i < len; i++){
				_.extend(data[i], {
					shape: shape,
					style: style,
					title: (shape)?' ' : data[i].title
				});
			}
			this.set('data', data);
		},

		pluckState: function(){
            var state = this.pick('id', 'visible');
            return state;
        }
		
	});

})