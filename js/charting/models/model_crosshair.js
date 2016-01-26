/**
 *   /js/models/model_crosshair.js
 */
define([
    //libraies
    'jquery', 'underscore', 'backbone'
], function(
    //libraries
    $, _, Backbone
) {

    return Backbone.Model.extend({
        defaults: {
            ref: null,
            visible: true
        },
        insert: function(chart) {
            this.chart = chart;

            this.add();
        },
        setReferences: function(xRef, yRef) {
            this.set('ref', {
                x: xRef,
                y: yRef
            });
        },
        add: function() {
            var obj = this.createObject();

            var xRef = this.chart.xAxis[0].addPlotBandOrLine(obj.x, 'plotLines');
            var yRef = this.chart.yAxis[0].addPlotBandOrLine(obj.y, 'plotLines');

            this.setReferences(xRef, yRef);
        },
        purge: function() {
            var ref = this.get('ref');
            ref.x.svgElem && ref.x.destroy();
            ref.y.svgElem && ref.y.destroy();

            // var id = this.get('id');
            //this.chart.xAxis[0].removePlotLine(id);
            //this.chart.yAxis[0].removePlotLine(id);
        },
        createObject: function() {
            var x = this.get('x'),
                y = this.get('y');
            return {
                x: {
                    color: '#000000', //MONEYCONTROL
                    //dashStyle: 'dash',//MONEYCONTROL
                    id: this.id,
                    value: x,
                    width: 1,
                    zIndex: 1 //MONEYCONTROL
                },
                y: {
                    color: '#000000', //MONEYCONTROL
                    //dashStyle: 'dash',//MONEYCONTROL
                    id: this.id,
                    value: y,
                    width: 1,
                    zIndex: 1 //MONEYCONTROL
                }
            };
        },
        toggle: function() {
            //highcharts sets '_addedPlotLB' key which re-adds plotlines to the chart 
            // on Axis.update i.e. on toggling compare mode
            //So the best solution is to remove the plotline & readd them on toggling instead of toggling visiblilty
            //$(ref.svgElem.element).toggle();
            var toVisible = !this.get('visible');

            if (!toVisible) { //hide
                this.purge();
            } else { //show
                this.add();
            }

            this.set('visible', toVisible);
        },
        pluckState: function() {
            var state = this.pick('id', 'x', 'y');
            return state;
        }
    });
});
