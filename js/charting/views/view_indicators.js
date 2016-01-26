/**
 *  /js/views/view_indicators.js
 */

define([
    //libraries
    'jquery', 'underscore', 'backbone',
    //models
    'model_series',
    //others
    'formulae',
    //templates
    'text!indicator_tmpl'
], function(
    //libraries
    $, _, Backbone,
    //models
    SerieModel,
    //others
    formulae,
    //templates
    indicator_tmpl
) {

    var tmplStr = _.template(indicator_tmpl);

    return Backbone.View.extend({
        tagName: 'section',

        template: tmplStr,

        initialize: function(options) {
            var attr = this.model.toJSON(),
                chartOpt = options.config.chart,
                classNames = chartOpt.classNames;
            this.classNames = classNames;
            this.decimals = _.isUndefined(attr.decimals) ? chartOpt.decimals : attr.decimals;


            //ANKITZ
            // ADDING THIS VIEWS REFRENCE ON THE MODEL ITSELF FOR LATER PURPOSES
            this.model.view = this;
            //setting the INDICATOR'S DOM node on the MODEL for refrence
            this.model.set('ref', this.el);


            this.el.className = classNames.indicator;
            this.el.id = attr.id;

            this.hideClass = classNames.hide;

            _.bindAll(this, 'destroy', 'toggle', 'reload', 'refresh', 'onMouseMove', 'onMouseLeave', 'updateData', 'updateReadings', 'reloadReadings');
            this.listenTo(this.model, 'remove', this.destroy);
            this.listenTo(this.model, 'change:visible', this.toggle);
            //this.listenTo(this.model, 'rebind', this.refresh);
            this.listenTo(this.model, 'reload', this.reload);
            this.listenTo(this.model, 'update-readings', this.updateReadings);
            this.listenTo(options.serie, 'refresh', this.refresh);
            this.reflow = false;
            this.updateData();
            var result = this.createObject(attr);
            this.result = result; // storing the result temporarily

            this.render(attr)
        },

        events: {
            'click .remove-indicator': 'removeIndicator'
        },

        updateData: function(callback) {
            //updating data
            if (!this.data || this.reflow) {
                this.options.serie.extractData({
                    callback: _.bind(function(error, data, range, min, max, data20) {
                        if (error) {
                            this.data = data || {};
                            return;
                        }
                        this.data = data;
                        this.data20 = data20; //MONEYCONTROL
                        if (_.isFunction(callback)) {
                            callback.apply(this, arguments);
                        }
                        this.chartRef && this.chartRef.xAxis[0].setExtremes(min, max);
                    }, this)
                });
            }
        },

        calc: function(id, param, data, data20) {

            var resp = formulae[id](data, param, data20),
                len = data.length,
                result = [];
            resp = (resp instanceof Array) ? [resp] : resp;
            _.each(resp, function(res, title) {
                /*
                    // Do not need this as we now update overlays for every range change & data can be of 0 length
                    if(!res){
                        throw new Error('Empty Data')
                    }*/

                //padding an extra entry to the start if starttime of output doesn't match start time of input
                var paddedRes,
                    padding = [];

                if (res.length) {
                    var outputStartTime = res[0][0];
                    for (var i = 0; i < len; i++) {
                        var inputTime = data[i].date || data[i][0];
                        if (inputTime >= outputStartTime) {
                            break;
                        }
                        //pad the data with a null value
                        padding.push([inputTime, null]);
                    }
                }
                paddedRes = padding.concat(res);

                result.push({
                    id: (typeof title === 'string') ? title : id,
                    unpadded: res,
                    padded: paddedRes
                });
            });

            //console.log(id, data.length, result);
            return result;
        },

        render: function(attr) {


            var param;
            if (attr.param) {
                param = _.values(attr.param).join(',');
                console.log(param);
            }
            this.$el.append(this.template({
                name: attr.value,
                param: param,
                classNames: this.classNames
            }));
            this.readings = this.$('.indicator-readings');
            //console.log(this.readings);

        },

        onMouseMove: function(e) {
            //console.log("Mouse moved");
            this.options.manageMouseMove(e, this.model.get('id'), e.data.extent);
        },

        onMouseLeave: function(e) {
            //console.log("Mouse leave");
            this.options.manageMouseMove(e, this.model.get('id'), e.data.extent);
        },

        renderChart: function(args) {
            var canvas = this.$('.' + this.classNames.subCanvas);

            var options = this.options,
                id = this.model.get('id'),
                max, min;

            if (options.getExtremes) {
                max = options.getExtremes.max;
                min = options.getExtremes.min;
            }

            if (options.dataGrouping) {
                for (var i = 0, len = this.result.length; i < len; i++) {
                    _.extend(this.result[i], {
                        dataGrouping: options.dataGrouping
                    });
                }
            }

            //  console.log(options.dataGrouping, this.result, options.selectedRangeBtn, max, new Date(max).toDateString(), min, new Date(min).toDateString());

            var opts = {
                chart: {
                    height: 160,
                    spacingTop: 10, //ankitz added height
                    spacingBottom: 0,
                    spacingLeft: 1,
                    spacingRight: 1,
                    panning: false,
                    pinchType: false,
                    backgroundColor: '#eee'
                },

                colors: options.config.chart.indicatorColours,
                credits: {
                    enabled: false
                },
                navigator: {
                    enabled: false
                },
                scrollbar: {
                    enabled: false
                },
                plotOptions: {
                    line: {
                        dataGrouping: options.config.dataGrouping
                    },
                    area: {
                        dataGrouping: options.config.dataGrouping
                    },
                    series: {
                        marker: {
                            symbol: 'circle'
                        }
                    }
                },
                rangeSelector: {
                    enabled: false,
                    buttons: options.selectedRangeBtn,
                    selected: 0,
                    inputEnabled: false
                },
                series: this.result,
                tooltip: {
                    crosshairs: true,
                    pointFormat: '<span style="color:{series.color}">{series.options.title}</span>: <b>{point.y}</b><br/>',
                    //valueSuffix   : indicator.valueSuffix,
                    valueDecimals: this.decimals
                },
                xAxis: {
                    labels: {
                        enabled: false
                    },
                    minorTickLength: 0,
                    min: min,
                    max: max
                },
                yAxis: {
                    endOnTick: false,
                    startOnTick: false,
                    showLastLabel: true,
                    opposite: true,
                    tickPixelInterval: 40,
                    gridLineColor: '#dadada',
                    maxPadding: 0.2,
                    minPadding: 0.02,
                    //ANKITZ
                    offset: options.config.chart.yAxisIndicatorOffset || 50,
                    labels: {
                        align: 'left',
                        x: 3,
                        y: 6
                    },
                    showLastLabel: true,
                    labels: {
                        style: {
                            color: '#999',
                            fontFamily: 'Arial',
                            fontWeight: 'bold'
                        }
                    }
                }
            };
            if (id == 'rsi') {
                opts.yAxis['min'] = 0;
                opts.yAxis['max'] = 100;
            }

            canvas.highcharts('StockChart', opts);

            var chartRef = canvas.highcharts();
            this.chartRef = chartRef;

            //Adding the chartRef to the list
            options.charts.push({
                id: id,
                ref: chartRef
            });
            delete this.result;

            //adding event listeners
            //REMEMBER: IF THE CHART IS MADE RESPONSIVE/FLUID, these parameters should be shifted within the callback
            var top = chartRef.plotTop,
                bottom = chartRef.plotTop + chartRef.plotHeight;


            var extent = {
                left: chartRef.plotLeft,
                right: chartRef.plotLeft + chartRef.plotWidth,
                top: top,
                bottom: bottom,
                chartTop: (chartRef.extraTopMargin) ? top - chartRef.extraTopMargin : top,
                chartBottom: (chartRef.extraBottomMargin) ? bottom + chartRef.extraBottomMargin : bottom
            };


            $(chartRef.container).on('mousemove', {
                extent: extent
            }, this.onMouseMove);
            $(chartRef.container).on('mouseleave', {
                extent: extent
            }, this.onMouseLeave);
            //if(options.isTouch){
            $(chartRef.container).on('touchmove', {
                extent: extent
            }, this.onMouseMove);
            //}

            //adding crosshair
            options.addCrosshair.call(this, this.model.get('id'));

            this.updateReadings();
        },

        updateReadings: function(index, x) {
            var data = [];
            if (this.model.get('visible')) {
                //console.log("i'm visible");
                try {
                    _.each(this.chartRef && this.chartRef.series, function(serie) {
                        var tooltipPoints = serie.tooltipPoints
                        index = _.isNumber(index) ? index : tooltipPoints && tooltipPoints.length - 1;
                        var pt = tooltipPoints && tooltipPoints[index];
                        if (pt) {
                            data.push({
                                id: serie.options.title || serie.name,
                                colour: serie.color,
                                x: pt.x,
                                y: pt.y
                            });
                        }
                    });
                } catch (e) {
                    data.error = e;
                } finally {
                    this.reloadReadings(data);
                }
            }
        },

        reloadReadings: function(data) {
            //console.log('in reloadReadings', data);
            var value = '';
            if (data.error) {
                console && console.warn("Error while reading data", data);
            }
            var dates = [];

            for (var i = 0, len = data.length; i < len; i++) {
                var d = data[i];
                dates.push(d.x);
                if (i > 0) {
                    value += " / <span style='color:" + d.colour + "; text-transform:uppercase'>" + d.id + " ";
                }

                if (!i) {
                    value += "<span style='color:" + d.colour + "'>"
                }
                value += d.y.toIndian(this.decimals) + "</span>";

                if (i === len - 1) {
                    //print date
                    value += " / " + new Date(_.min(dates)).toIndianDate();
                }

            }
            this.readings.html(value);
        },

        removeIndicator: function() {
            //console.log(this.model);
            this.model.trigger('remove-view', this.model);
        },

        refresh: function() {
            this.reflow = true;
        },

        reload: function(forceReflow, setData) {
            var operation = setData && 'setData' || 'update';
            if (forceReflow || this.reflow) {
                this.reflow = true;
                this.updateData(function() {
                    var attr = this.model.toJSON();
                    var obj = this.createObject(attr);
                    var chart = this.chartRef;

                    _.each(obj, function(o) {
                        var serie = chart.get(o.id);
                        serie[operation](setData && o.data || o, false);
                    });

                    chart.redraw();
                    this.reflow = false;
                });

                if (forceReflow) {
                    this.updateReadings();
                }
            }
        },

        destroy: function() {
            var id = this.model.get('id');

            this.chartRef && this.chartRef.destroy();
            //removing chartref & crosshair ref from the list
            this.options.xHairs.remove(id);
            this.options.charts.remove(id);

            this.remove();
        },

        toggle: function(model, visible) {

            this.reload();

            this.$el.toggleClass(this.hideClass);
        },

        createObject: function(attr) {
            var view = this,
                result = [],
                id = attr.id,
                opt = attr.chartOpt,
                param = attr.param;


            // var name = (param)? attr.id +' ('+_.values(param).join(',')+')' : attr.id;

            var calc = this.calc(id, param, this.data, this.data20),
                reslen = calc.length,
                mainResult;

            _.each(calc, function(each) {
                var rid = each.id || id,
                    param = each.param,
                    title = each.id;


                if (reslen === 1 || id === each.id) {
                    title = attr.title || id;
                    mainResult = each;
                }
                var r = {
                    id: rid,
                    name: rid, //name,
                    data: each.padded,
                    title: title
                };
                if (opt) {
                    _.extend(r, {
                        tooltip: {
                            valueDecimals: this.decimals
                        }
                    }, opt)
                }

                result.push(r);
            }, this);
            _.each(attr.signalLines, function(signal) {
                var name = signal.type,
                    sParam = signal.param,
                    chartOpt = signal.chartOpt,
                    vals = _.values(sParam),
                    valStr = vals.length ? ' (' + vals.join(',') + ')' : '',
                    sId = name + valStr,
                    title = (signal.title) ? signal.title + valStr : '';

                var d = view.calc(name, sParam, mainResult.unpadded);
                var res = {
                        id: sId,
                        name: name,
                        data: d[0].padded,
                        title: title || sId
                    },
                    obj = (chartOpt) ? _.extend(res, chartOpt) : res;

                result.push(obj)
            });

            return result;
        }
    });
});
