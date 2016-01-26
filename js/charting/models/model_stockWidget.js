/**
*	/js/models/stockWidget.js
*/

define([
	//libraries
		'jquery', 'underscore','backbone','highstock',
	//models
		'model_series',
		'config'
	], function(
	//libraries
		$, _, Backbone, Highcharts, 
	//models
		SerieModel,
		config){
	
		var conf = config.chart,
			hist = conf.timeRanges[conf.histIndex],
			intra = conf.timeRanges[conf.intraIndex];
		
	return Backbone.Model.extend({
		defaults:{
			chartMode 		: 'advanced',

			//optional keys
			allowIndicators	: true,
			allowOverlays	: true,
			//allowFreq		: true,
			hasMenu			: true,
			hasVolume		: true,
			showVolumeReading: true,
			hasFlags 		: true,
			hasNavigator	: true,
			hasReadings		: true,
			hasRangeSelector: true,
			hasDateView 	: true,
			hasCalender 	: true,
			hasCrosshair 	: false, // keep it false if custom crosshair is not needed
			syncCrosshair	: false,
			saveState 		: true,
			onlyErrorNotifications: false, 

			//Internal Keys- modifying these may break the chart
			componentsHidden: false,
			inCompareMode 	: false,
			
			primarySeries	: null,
			currentRange	: null, //conf.initialTimeRange,
			isHist 			: null,
			isIntra 		: null,
			hist 			: hist,
			
			name			: '',

			onLoad 			: true,
			ready 			: false,
			fatalError		: false
		},

		defaults_smallChart: {
			allowIndicators	: false,
			allowOverlays	: false,
			hasMenu			: false,
			hasVolume		: false,
			showVolumeReading: true,
			hasFlags 		: false,
			hasNavigator	: true,
			hasReadings		: true,
			hasRangeSelector: true,
			hasDateView 	: false,
			hasCalender 	: false,
			hasCrosshair 	: true,
			syncCrosshair	: true,
			saveState 		: false,
			onlyErrorNotifications: true
		},
		
		initialize: function(params, options){
			//console.log("New StockWidget model created", this.toJSON());
			if(!params){
				return;
			}
			this.on('change:currentRange', this.update_isHist);
			if(params.chartMode === 'small'){
				this.set(_.defaults(params, this.defaults_smallChart), options);
			}else{
				this.set(params, options);
			}
			
		},
		
		validate: function(attrs){
			//console.log("In validate", attrs);
			if(!attrs.name)
				return {msg: 'No widget name'};
				
			if(!attrs.container){
				return {msg: 'No container selector specified'};
			}else if(!$(attrs.container).length){
				return {msg: 'Cannot find the container in the DOM'};
			}

			if(attrs.primarySeries){
				if(!(attrs.primarySeries instanceof SerieModel))
					return {msg: 'primarySeries not an instanceof SerieModel'};
			}
		},

		/**
		*	Calling this method on the stockwidget model makes the loading screen appear on the screen
		*
		*	@method loading
		*	@public
		*/
		loading: function(){
			if(!this.get('onLoad')){
				this.set('ready', false);
			}
		},

		/**
		*	Calling this method on the stockwidget model makes the loading screen disappear from the screen
		*
		*	@method
		*	@public
		*/
		loaded: function(force){
			if(force || !this.get('onLoad')){
				this.set('ready', true);
			}
		},

		update_isHist: function(model, value){
			var range = value || this.getCurrentRange();
			this.set({
				'isHist': this.isHist(range),
				'isIntra': this.isIntra(range)
			});
		},

		/**
		*	Use this method to check if the given range or the current range of the chart is historical
		*
		*	@method isHist
		*	@param {String} [range] range to test
		*	@returns {Boolean} Whether the given or current range is historical or not
		*	@public
		*/
		isHist: function(range){
			if(!range){
				return this.get('isHist'); 
			}

			var rangeInTest = range,
				isHist = (rangeInTest === hist) ? true : false;

			return isHist;
		},

		/**
		*	Use this method to check if the given range or the current range of the chart is intra
		*
		*	@method isIntra
		*	@param {String} [range] range to test
		*	@returns {Boolean} Whether the given or current range is intra or not
		*	@public
		*/
		isIntra: function(range){
			if(!range){
				return this.get('isIntra'); 
			}

			var rangeInTest = range,
				isIntra = (rangeInTest === intra) ? true : false;

			return isIntra;
		},

		/**
		*	
		*
		*	@method
		*	@returns
		*	@public
		*/
		getCurrentRange: function(){
			return this.get('currentRange');
		},


		//primary series
		updatePrimarySeries: function(newSerie){
			this.set(
				{'primarySeries': newSerie},
				{validate : true}
			);
		},

		resetPrimarySerie: function(){
			this.set({'primarySeries': null}, {silent: true});
		},

		/**
		*	
		*
		*	@method
		*	@param
		*	@returns
		*	@public
		*/
		getPrimarySerie: function(){
			return this.get('primarySeries');
		},

		//compare mode
		
		/**
		*	
		*
		*	@method
		*	@public
		*/
		
		toggleCompareMode: function(){
			this.set('inCompareMode', !this.get('inCompareMode'));
		},

		/**
		*	
		*
		*	@method
		*	@returns
		*	@public
		*/
		inCompareMode: function(){
			return this.get('inCompareMode');
		},

		//components
		
		/**
		*	
		*
		*	@method
		*	@param
		*	@public
		*/
		
		hideComponents: function(opt){
			this.set({'componentsHidden' : true}, opt);
		},

		/**
		*	
		*
		*	@method
		*	@param
		*	@public
		*/
		showComponents: function(opt){
			//if(!this.get('fatalError') && !this.inCompareMode() && (opt.isHist || this.isHist())){
			if(!this.get('fatalError') && !this.inCompareMode()){
				this.set({'componentsHidden' : false}, opt);
			}
		},

		/**
		*	
		*
		*	@method
		*	@param
		*	@returns
		*	@public
		*/
		areComponentsHidden: function(){
			return this.get('componentsHidden');
		}
	});
})