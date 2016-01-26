/**
*	/js/models/model_selection.js
*/
define([
	//libraries
		'jquery', 'underscore', 'backbone', 'localStorage',
	//config
		'config'
	], function (
	//libraries
		$, _, Backbone, localStorage,
	//defconfig
		defaultConfig	
	) {
		var uniqueComponents = defaultConfig.chart.uniqueComponents;
	return Backbone.Model.extend({
		defaults:{
			// BUG FIX:
			// Use new Object() instead of using {} to instanciate an object as Firefox considers them as arrays
			compare: 		new Object(), 
			
			overlays: 		new Object(),
			indicators: 	new Object(),
			flags: 			new Object(),

			chartType: 		null,
			lineType: 		null, 
			drawType: 		null,
			currentRange:   '',
			rangeSelected:  '',

			//draw
			serieName : 	null,
			crosshairs: 	new Object(),
			trendlines: 	new Object(),
			retracements: 	new Object()
			//annotations: 	new Object()
		},

		initialize: function(options){
			this.defaults[defaultConfig.chart.toggleDrawKey] = undefined;
			this.defaults[defaultConfig.chart.toggleChartTypeKey] = undefined;
			this.defaults[defaultConfig.chart.togglelineTypeKey] = undefined;

			this.listenTo(this, 'change:serieName', this.deleteUniqueInstances);
		},

		add: function(type, obj){
			try{
				var category = this.get(type);
				category[obj.id || obj.name] = obj;
				this.save();
			}catch(e){
				this.trigger('error', {
					data: {type: type, obj: obj},
					error: e, 
					msg: 'Error while storing '+type
				});
			}
		},

		remove: function(type, ids){
			try{
				var category = this.get(type);
				var id = (ids instanceof Array)? ids : [ids];

				for(var i=0, len = id.length; i< len; i++){
					delete category[id[i]];
				}

				this.save();
			}catch(e){
				this.trigger('error', {
					data: {type: type, obj: ids},
					error: e, 
					msg: 'Error while removing '+type
				});
			}
		},

		update: function(type, obj){
			try{
				var category = this.get(type);
				if(obj instanceof Array){
					for(var i=0, len = obj.length; i <len; i++){
						category[obj[i].id] = obj[i];
					}
				}else{
					category[obj.id] = obj;
				}
				this.save();
			}catch(e){
				this.trigger('error', {
					data: {type: type, obj: obj},
					error: e,
					msg: 'Error while updating '+type
				});
			}
		},

		toggle: function(type, val){
			try{
				this.save(type, val);
			}catch(e){
				this.trigger('error', {
					data: {type: type, val: val},
					error: e,
					msg: 'Error while toggling '+type
				});
			}
		},

		reset: function(type){
			try{
				type = _.isArray(type) ? type : [type];
				var reset = {};
				for(var i=0, len = type.length; i < len; i++){
					reset[type[i]] = {}
				}
				this.save(reset);
			}catch(e){
				this.trigger('error', {
					data: {type: type},
					error: e,
					msg: 'Error while reseting '+type
				});
			}
		},

		purge: function(defOpt){
			this.save( _.extend(this.defaults, defOpt) );
		},

		updateSerie: function(value){
			this.set('serieName', value);
		},

		deleteUniqueInstances: function(model, value){
			if(value){ //ignoring for the first serie name change
				this.reset(uniqueComponents); //resetting all instances of components which are unique to a serie
			}
		}
	});
});