/**
*	/js/collections/collection_flags.js
*/
define([
	//libraries
	'jquery', 'underscore', 'backbone',
	//models
	'model_flag'
], function(
	//libraries
	$, _, Backbone,
	//models
	FlagModel
	){
	
		return Backbone.Collection.extend({
			model: FlagModel,

			toggle: function(id, redraw){
				var flag = this.get(id);
				if(flag){
					flag.toggle();
					if(flag.hasData()){
						//redraw the serie only if data exists for the current flag 
						this.redraw(null, redraw);
					}
				}
			},

			redraw: function(obj, redraw){
				if(!obj){
					//collect the new data
					var data = [];
					this.each(function(flag){
						data.push(flag.getData());
					});

					var fData = _.flatten(data);
					obj = {data: fData};
				}
				
				this.flagRef && this.flagRef.update(obj, redraw);
			},

			toggleAll: function(redraw){
				if(this.flagRef){
					var visible = this.flagRef.visible;
					var op = (visible) ? 'hideAll' : 'showAll';
					
					this[op](redraw);
				}
			},

			hideAll: function(redraw){
				//hide the series itself
				this.flagRef && this.flagRef.setVisible(false, redraw);
			},

			showAll: function(redraw){
				this.flagRef && this.flagRef.setVisible(true, redraw);
			},

			grabReferences: function(chartRef){
				this.flagRef = chartRef.get('flags');
			},

			assignData: function(data){
				//set data to flags
				//if(data){
				this.each(function(f){
					f.setData( (data && data[f.get('id')] ) || [] );
				});
				//}
			},

			getHighstockFlagsObject: function(args){
				var result,
					merged = [],
					data = args.data && args.data.flags,
					returnAsArray = (args.returnType !== 'object');

				this.assignData(data);

				if(data){
					var fdata = [];
					this.each(function(flag){
						fdata.push(flag.getData());
					});

					//BUG FIX: Sort the flags data after merging else Highcharts throws error #15
					merged = _.sortBy( _.flatten(fdata) , function(e){return e.x});
				}else{
					merged = [];
				}

				result = {
					type: 'flags',
					id: 'flags',
					name: 'flags',
					data: merged,
					onSeries:  args.onSeries,
					visible: (typeof args.visible !== 'undefined')? args.visible : true,
					stackDistance: 31,
					y: -20
				};

				return result;
			},

			add_selection: function(flags){
				var coll = this;
				_.each(flags, function(f){
					//select those flags
					var flag = coll.get(f);
					if(flag){
						flag.show();
					}
				});
			},

			update: function(args){
				//get new flag objs
				var	obj = this.getHighstockFlagsObject({
					onSeries	: args.onSeries, 
					data 		: args.data, 
					visible		: args.visible
				});

				if(obj){
					this.redraw(obj, args.redraw);
				}
			},

			pluckState: function(id){
				if(id){
					return this.get(id).pluckState();
				}else{
					var state = []
					this.each(function(flag){
						state.push( flag.pluckState() );
					});
					return state;
				}
			}/*,
			
			renew: function(args){
				var obj = this.getHighstockFlagsObject({
						onSeries	: args.name, 
						data 		: args.data, 
						hide 		: !args.isHist
					}),
					chart = args.chart;

				if(obj){
					//delete the prev flag serie
					this.flagRef.remove();
					delete this.flagRef;

					//add a new one
					this.flagRef = chart.addSeries(obj, true);
				}
			}*/
		});
});