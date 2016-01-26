/**
*	//NOT USING THIS FILE
*/
define([
	//libraries
		'jquery', 'underscore', 'backbone'
	], function(
	//libraries
		$, _, Backbone
		){

		return Backbone.Model.extend({
			initialize: function(options){

			},

			updateChart: function(){
				this.trigger('updated', this);
			},

			update: function(chart){
				this.set({
					chart 	: chart
				});

				//this.updateChart();
			},

			updateRangeSelector : function(rsObj){
				var chart = this.getChart();
				chart.rangeSelector.clickButton(rsObj.index, rsObj, true);
			},

			getChart: function(){
				return this.get('chart');
			}

		});

});