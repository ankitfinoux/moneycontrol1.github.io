/**
*	/js/extend.js
*/
define([
	//libraries
	'underscore', 'highstock', 'highcharts_more', 
	'config'
	], function(_, Highcharts, Highcharts_more, defaultConfig){

		//Extending JavaScript Natives for formatting
		String.prototype.reverseMe = function () {
	        return this.split("").reverse().join("");
	    };

		Number.prototype.toIndian = function(decimals){
			if(decimals < 0){ //if decimals is -1
				decimals = null;
			}
			var input =  decimals !== null ? this.toFixed(decimals) : this.toString(), 
				sign = '';
			if(this < 0){
				input = input.substr(1);
				sign = '-'
			}
			var	strSplit = input.split('.'),
				str = strSplit[0],
				decimals = strSplit[1],
				reverse = str.reverseMe(),
				units = reverse.substr(0,3),
				thousands = reverse.substr(3).match(/[0-9]{1,2}/g);
				if(thousands){
					thousands = thousands.join(',');
				}

				var result = ((thousands)? units+','+thousands : units).reverseMe();
				if(decimals){
					result += '.'+decimals;
				}
				if(sign){
					result = sign+result;
				}

				return result;

		}

		Date.prototype.toIndianDate = function(noDay){
			noDay = noDay || false;
			var d = this.toDateString().split(' '),
				date = [d[2], d[1], d[3]],
				day = noDay ? '' : d[0]+', ';
			return day+date.join(' ');
		};

		Date.prototype.toIndianDateTime = function(noDay){
			var time = this.toTimeString().substr(0,5);
			return this.toIndianDate(noDay)+', '+time;
		}

		//Global Highcharts configuration
		//BUG FIX: Do NOT move this line. Shifting it to highstock_extension breaks envelopes
		Highcharts.setOptions( _.pick(defaultConfig.highchart, 'global', 'lang'));


		//Extending Highcharts
		var each = Highcharts.each,
			extend = Highcharts.extend,
			merge = Highcharts.merge,
			map = Highcharts.map,
			defaultPlotOptions = Highcharts.getOptions().plotOptions,
			seriesTypes = Highcharts.seriesTypes,
			extendClass = Highcharts.extendClass,
			wrap = Highcharts.wrap,
			Chart = Highcharts.Chart,
			Series = Highcharts.Series,
			Axis = Highcharts.Axis,
			Point = Highcharts.Point,
			Pointer = Highcharts.Pointer,
			Scroller = Highcharts.Scroller,
			RangeSelector = Highcharts.RangeSelector;

		//This will make sure that all the input points are stored in the point
		/*seriesTypes.volLine = extendClass(seriesTypes.line, {
			pointArrayMap: ['close', 'volume'],
			pointValKey: 'close',
			toYData: function (point) { // return a plain array for speedy calculation
				return [point.close, point.volume];
			}
		})*/

	
		//Creating a new local variable with same name as internal numberFormat function
		/*function numberFormat (number, decimals){
			var num = Number(number);
			if(_.isNaN(num)){
				return '';
			}
			return num.toIndian(decimals);
		}*/

		//wrap(Point.prototype, 'tooltipFormatter', function(fn){
		//	var res = fn.apply(this, Array.prototype.slice.call(arguments, 1));
			//Was not able to modify or dynamically replace Highcharts
		//})
		/*function updateNumberFormat(fn){
			
			//so now default numberFormat won't be called
			with({numberFormat: numberFormat}){
				fn.apply(this, Array.prototype.slice.call(arguments, 1));
			}
		}

		//wrap(Axis.prototype, 'defaultLabelFormatter', updateNumberFormat);
		wrap(Point.prototype, 'tooltipFormatter', updateNumberFormat);*/


		/*var pointTooltipFormatter = Point.prototype.tooltipFormatter;
		wrap(Point.prototype, 'tooltipFormatter', function(fn, arg1){
			
			var point = this,
				pointFormat = arg1;
	
			pointFormat = pointFormat.replace(
				'{point.change}',
				(point.change > 0 ? '+' : '') + numberFormat(point.change, point.series.tooltipOptions.changeDecimals || 2)
			);

			return pointTooltipFormatter.apply(this, [pointFormat]);
			//NOT calling  fn
		})*/

		//Extending scatter
		extend(seriesTypes.scatter.prototype, {
			noSharedTooltip: false,
			singularTooltips: false,
			setTooltipPoints: Series.prototype.setTooltipPoints
		});

		//modifying setAxisSize so that navigator's xAxis becomes half the chart width
		var navigator_xAxis_id = defaultConfig.highchart.navigator.xAxis.id;
		wrap(Axis.prototype, 'setAxisSize', function(fn){
			//<i>this</i> points to Axis
			if(this.options.id === navigator_xAxis_id){
				var chart = this.chart,
					options = this.options,
					offsetLeft = options.offsetLeft || 0,
					offsetRight = options.offsetRight || 0,
					relativeWidth = options.relativeWidth || 1,
					relativeLeftPadding = options.relativeLeftPadding || 1;
			
				var originalWidth = (chart.plotWidth - offsetLeft + offsetRight);
				this.options.width = originalWidth * relativeWidth;
				this.options.left = chart.plotLeft + chart.options.scrollbar.height + originalWidth * relativeLeftPadding;
			}

			fn.apply(this, Array.prototype.slice.call(arguments, 1));
		});

		//modifying touch behaviour
		//Single touch- only tooltip update
		//Multitouch /pinch - zoom/update range
		wrap(Pointer.prototype, 'pinch', function(fn){
			var e = arguments[1];
			//console.log(e);
			if(e.touches && e.touches.length>1){
				fn.apply(this, Array.prototype.slice.call(arguments, 1));
			}
		});

		wrap(Pointer.prototype, 'onContainerTouchMove', function(fn){
			var e = arguments[1],
				args = Array.prototype.slice.call(arguments, 1);
			
			if(e.touches.length ===1){

				this['onContainerTouchStart'].apply(this, args);
			}else{
				fn.apply(this, args);
			}
			
			e.preventDefault();
			return false;
		});

		wrap(Chart.prototype, 'showResetZoom', function(fn){
			//Do not display the reset zoom button as it resets the zoom to max position
			//fn.apply(this, Array.prototype.slice.call(arguments, 1));
		});

		wrap(RangeSelector.prototype, 'render', function(fn){
			//Do not render the default range selector buttons when custom key is true
			if(!this.custom){
				fn.apply(this, Array.prototype.slice.call(arguments, 1));
			}
		})


		//wrap(Scroller.prototype, 'drawScrollbarButton', function(fn){
			//if(!this.navigatorOptions.custom){
			//	fn.apply(this, Array.prototype.slice.call(arguments, 1));
			//}
		//})


		//extending Navigator Class
		//var extendClass(
			// Initialize scroller for stock charts
		/*wrap(Chart.prototype, 'init', function (proceed, options, callback) {
			
			addEvent(this, 'beforeRender', function () {
				var options = this.options;
				if (options.navigator.enabled || options.scrollbar.enabled) {
					this.scroller = new Scroller(this);
				}
			});

			proceed.call(this, options, callback);

		});*/





		//extending rangeSelector - this fix is required if we want faster performance by passng redraw = false in most places
		/*wrap(Highcharts.RangeSelector.prototype, 'clickButton', function(fn){
			fn.apply(this, Array.prototype.slice.call(arguments, 1));

			this.selected = null;
		});*/

		//PlotLineOrBand is not available directly, so we add a method which emits that constructor,
		//use a dummyAxis to get the constructor & then extend it.
		/*wrap(Axis.prototype, 'addPlotBandOrLine', function(fn){
			var obj = fn.apply(this, Array.prototype.slice.call(arguments, 1));
			obj.hidden = false;
			return obj;
		})

		extend(Axis.prototype, {
			extendPlotLine: function(){
				var plotline = this.addPlotBandOrLine({value: 10, width: 1}, 'plotLines'),
					plotLinePrototype = plotline.__proto__;
				
				if(!plotLinePrototype){
					//handle for IE
					plotLinePrototype = (function(p){ 
						function f (){};
						f.prototype = p;

						return new f
					})(plotline)
				}
				Highcharts.wrap(plotLinePrototype, 'render', function(fn){
					if(!this.hidden){
						var inst = fn.apply(this, Array.prototype.slice.call(arguments, 1));
						return inst;
					}
				})
			}
		});*/

		/*wrap(Axis.prototype, 'init', function(fn){
			fn.apply(this, Array.prototype.slice.call(arguments, 1));

			//extending PlotLines
			console.log(PlotLineOrBand.prototype)
		});*/

		/*var dummyAxis = new Axis({axes:[], yAxis:[]}, {});
		var PlotLine = dummyAxis.extendPlotLine();

		console.log(PlotLine);

		dummyAxis.destroy()*/

		//Extending points to get id in hoverpoints
		/*wrap(Point.prototype, 'getLabelConfig', function(fn){
			var ret = fn.apply(this, Array.prototype.slice.call(arguments, 1));
			_.extend(ret, {id: this.series.options.id});
			return ret;
		})*/

		//console.log("Extended", seriesTypes);

		//wrap(Highcharts.)
});