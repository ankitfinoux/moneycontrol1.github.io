/**
*	/js/views/view_overlays.js
*/
define([
	//libraies
		'jquery', 'underscore', 'backbone',
	//models
		'model_series',
	//others
		'formulae'
	], function(
	//libraries
		$, _ , Backbone,
	//model
		SerieModel,
	//others
		formulae
	){

	return Backbone.View.extend({
		initialize: function(options){

			_.bindAll(this, 'add','calc', 'createObject', 'destroy', 'purge','toggle', 'reload', 'updateViewData', 'refresh');
			this.inheritColour = options.serie.get('colour');

			this.listenTo(this.collection, 'add', this.add);
			this.listenTo(this.collection, 'remove', this.destroy);
			this.listenTo(this.collection, 'change:visible', this.toggle);
			this.listenTo(this.collection, 'reset', this.purge);
			this.listenTo(this.collection, 'update-readings', this.updateReadings);
			//this.listenTo(this.collection, 'rebind', this.rebind);
			this.listenTo(options.serie, 'refresh', this.refresh);
			
			this.updateViewData();
			this.reflow = false;
		},
		toggle: function(model, value){
			
			this.reload();

			var op = (!value)? 'hide': 'show';
			model[op]();
		},

		//removes the serie's references from the chart
		destroy: function(model){
			var refs = model.getReference();

			//removing the overlay
			_.each(refs, function(ref){
				ref.remove();
			});
		},

		//destroys all the overlay instances from the chart
		purge: function(models, options){
			var view = this;
			_.each(options.previousModels, function(model){
				view.destroy(model);
			});
		},

		add: function(model){
			var obj = this.calc(model);
			this.render(model, obj);
		},

		updateReadings: function(index, x){

			this.collection.each(function(overlay){
				var data, isVisible;
				try{
					var refs =overlay.getReference(),
						data = {
							high: null,
							low: null,
							y: null,
							colour : null
						};
					isVisible =overlay.get('visible');
					if(isVisible){
						var type = overlay.get('name');
						var	readFromInput = overlay.get('readFromInput');

						for(var i=0, len =refs.length; i < len; i++){
							var ref = refs[i];

							if(!readFromInput){
								var tooltipPoints = ref.tooltipPoints;
								index = _.isNumber(index) ? index :  tooltipPoints && tooltipPoints.length -1;
								var pt = tooltipPoints && tooltipPoints[index];

								if(!pt){
									continue;
								}

								if(pt.high && pt.low){
									data.high = !data.high && pt.high;
									data.low = !data.low && pt.low;
								}else{
									data.y = !data.y && pt.y;
								}
								if(type === "psar"){
									data.colour = pt.color;
								}
							}else{
								//No Overlays should be using this method after pSAR fix
								//Keeping for future use or to prevent breaks
								var curr = _.findWhere( ref.options.data, {0: x});
								//console.log(i, new Date(approx_x).toString() , curr);
								if(curr){
									data.y = curr[1];									
									data.colour = ref.options.color || ref.color;
								}else{
									continue;
								}
							}
						}
					}
				}catch(e){
					data.error = e;
				}finally{
					//trigger an event to the snapshot view if visible
					isVisible && overlay.trigger('reload-readings', data);
				}
			}, this);
		},

		refresh: function(){
			var serie = this.options.serie;
			this.inheritColour = serie.get('colour');
			this.reflow = true;
		},

		updateViewData : function(callback){
			//updating data
			if(!this.data || this.reflow){
				this.options.serie.extractData({
					callback: _.bind(function(error, data, range){
						//<i>this</i> is bound to the view
						if(error){
							this.data = data || {}; //TODO: should we append empty object??
							return;
						}
						this.data = data;
						if(_.isFunction(callback)){
							callback.apply(this, arguments);
						}
					}, this)
				});
			}
		},

		reload: function(forceReflow, setData){
			var operation = setData && 'setData' || 'update'; // choose operation
			if(forceReflow || this.reflow){ // reflow will happen only once
				this.reflow = true;

				this.updateViewData(function(){
					this.collection.each(function(model){
						var obj = this.calc(model);
						model[operation](obj);
					}, this);
					this.reflow = false;
				});
			}

			if(forceReflow){
				this.options.chart.redraw();
				this.updateReadings();
			}
		},
		render: function(model, obj){
			var chart = this.options.chart,
				overlay =[],
				redraw = model.get('redraw');

			_.each(obj, function(each){
				if(chart){
					overlay.push( chart.addSeries(each, false) );
				}
			});
			if(redraw){
				chart.redraw();
			}
			if(overlay.length){
				//add the reference to the model
				model.addReference(overlay);
			}
		},

		calc: function(model){
			var attr = model.toJSON();
			var calc = formulae[attr.name](this.data, attr.param, attr.colour);
			var obj  = this.createObject(attr, calc, model);

			return obj;
		},

		createObject: function(attr, data, model){
			/*
			// Do not need this as we now update overlays for every range change & data can be of 0 length
			if(data instanceof Array && !data.length && /sma|ema/.exec(attr.name)){
				throw new Error("Available data less than window size of "+attr.param.window);
			}*/
			
			var result,
				name = attr.name,
				id = attr.id,
				param = attr.param,
				fillOpacity = attr.opacity || 0.5,
				colour = (attr.colour === 'inherit') ? this.inheritColour : attr.colour,
				hexColour;

			switch(name){
				case 'bollinger':
					colour = (colour instanceof Array)? colour : ['#f28f43', '#ff0000'];
					hexColour = colour[0];
					result = [{
						id : id,
						name: name,
						data: data.bands,
						color:	colour[0],
						fillOpacity: fillOpacity,
						type: 'arearange',
						lineWidth: 0
					},{
						id : id+'-middle',
						name: name,
						data: data.middle,
						color: colour[1],
						fillOpacity: fillOpacity,
						linkedTo: ':previous'
					}];
					break;
				case 'ema':
					result = [{
						id		: id,
						name	: name,
						data	: data,
						color 	: colour
					}]
					break;
				case 'envelopes':
					result = [{
						id : id,
						name: name,
						data: data,
						color 	: colour,
						fillOpacity: fillOpacity,
						type: 'arearange',
						lineWidth: 0
					}];
					break;					
				case 'psar':
					//colour = (colour instanceof Array)? colour : ['#ff0000', '#00ff00'];
					//hexColour = colour[0];

					/* OPTION 3: //BUG FIX - HACK for pSAR values
					var pSarData = []
					_.each(data.rising, function(each){
						pSarData.push({x: each[0], y: each[1], color: colour[0]})
					});
					_.each(data.falling, function(each){
						pSarData.push({x: each[0], y: each[1], color: colour[1]})
					});
					pSarData = _.sortBy(pSarData, function(each){
						return each.x;
					})*/
					//console.log(data);
					result = [{
						id : id,
						name: name,
						data: data,//pSarData,
						fillOpacity: fillOpacity,
						dashStyle: 'ShortDot',
						type: 'scatter'
					}];
					/*result = [{
						id : id+'-rising',
						name: name,
						data: data.rising,
						color 	: colour[0],
						fillOpacity: fillOpacity,
						dashStyle: 'ShortDot',
						type: 'scatter'
					},{
						id : id+'-falling',
						name: name,
						data: data.falling,
						color 	: colour[1],
						fillOpacity: fillOpacity,
						dashStyle: 'ShortDot',
						type: 'scatter',
						linkedTo: ':previous'
					}];*/
					break;
				case 'sma':
					result = [{
						id		: id,
						name	: name,
						data	: data,
						color 	: colour
					}]
					break;
				default:
					result = [{
						id		: id,
						name	: name,
						data	: data,
						color 	: colour
					}]
					break;
			}

			//this will update snapshot colour
			model.set('hexColour', hexColour || colour);
			return result;
		}
		
	});
})
