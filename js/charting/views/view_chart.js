/**
 *  /js/views/view_series.js
 */

define([
    //libraries
    'jquery', 'underscore', 'backbone', 'highstock',
    //model
    'model_series'
    //collection
], function(
    //libraries
    $, _, Backbone, Highcharts,
    //model
    Serie
    //collection
) {

    return Backbone.View.extend({

        tagName: 'section',

        initialize: function(options) {
            //console.log("Chart View initialized");

            //binding the correct context to the view functions
            _.bindAll(this, 'addSeries', 'fetchPrimarySeries', 'toggleCompareMode',
                'removeSerie', 'updateRangeSelector',
                'draw_lines', 'insert_lines', 'purge_drawInstances',
                'onMouseMove', 'onMouseLeave', 'updateReadings', 'updateOHLCReadings'
            );


            this.hasVolume = this.model.get('hasVolume');
            this.chartMode = options.chartMode;
            this.isTouch = options.isTouch;

            //ToDo: check for param
            this.fetchPrimarySeries();

            var chart = options.config.chart;
            this.el.className = chart.classNames.canvas;
            this.$el.css({
                height: chart.canvasHeight
            });
            this.defaultHandlers = [];

            //this.$el.append( loading() );

            this.listenTo(this.collection, 'data-updated', this.render);
            this.listenTo(this.collection, 'remove', this.removeSerie);

            this.listenTo(this.collection, 'update-readings', this.updateReadings);
            this.listenTo(this.collection, 'update-ohlc-readings', this.updateOHLCReadings);

            //listenTo draw events
            this.listenTo(this.options.crosshairs, 'add', this.insert_lines);
            this.listenTo(this.options.crosshairs, 'reset', this.purge_drawInstances);

            this.listenTo(this.options.trendlines, 'change:drag', this.draw_lines);
            this.listenTo(this.options.trendlines, 'add change:final', this.insert_lines);
            this.listenTo(this.options.trendlines, 'reset', this.purge_drawInstances);

            this.listenTo(this.options.retracements, 'change:drag', this.draw_lines);
            this.listenTo(this.options.retracements, 'add change:final', this.insert_lines);
            this.listenTo(this.options.retracements, 'reset', this.purge_drawInstances);
        },

        createObject: function(seriesModel, newTimeRange, onLoad) {

            var getFlags = this.model.get('hasFlags');
            var attr = seriesModel.toJSON(),
                data = attr.data_raw[newTimeRange],
                name = attr.id;

            var seriesObj = seriesModel.getHighstockSeriesObject({
                onLoad: onLoad,
                data: data,
                isHist: this.model.isHist()
            });

            var flagsObj = [];
            if (getFlags) {
                flagsObj = this.options.flags.getHighstockFlagsObject({
                    onSeries: name,
                    data: data,
                    hide: this.options.inCompareMode //hide if its in compare mode
                });
            };

            var result = _.union(seriesObj, flagsObj);
            return result;
        },

        render: function(seriesModel, newTimeRange) {
            try {
                var model = this.model,
                    onload = model.get('onLoad');

                //render only if loading for the first time && for the first series
                if (onload && seriesModel.get('id') === this.options.param[0].name) {
                    var hasNavigator = model.get('hasNavigator'),
                        graphObj = this.createObject(seriesModel, newTimeRange, onload),
                        options = this.options,
                        config = options.config,
                        btns = config.rangeSelector.buttons,
                        chartOpt = config.chart,
                        week = chartOpt.timeRanges[chartOpt.weekIndex],
                        highstock = config.highchart,
                        multipleYaxis = (this.hasVolume) ? highstock.yAxis : _.omit(_.first(highstock.yAxis), 'height'),
                        dataGrouping = config.dataGrouping, //(this.model.get('isIntra'))? {enabled: false} :null,
                        chartHt = chartOpt.canvasHeight, // - 24, //#BUG FIX: removing this 24 px adjustment for RS fixes container ht issue
                        navigatorHt, scrollbarHt,
                        width;
                    this.decimals = chartOpt.decimals;

                    if (this.chartMode === 'small') {
                        navigatorHt = 35;
                        scrollbarHt = 10;
                        //chartHt = chartHt - 18;
                    }

                    //BUG FIX - IE 6,7,8 chart width
                    if (![].indexOf) { // <IE9 doesn't have indexOf for Arrays
                        width = $(model.get('container')).width();
                    }

                    //Switch ON Grouping only for week if groupingWeek is passed in the config
                    //This handles chart onLoad grouping 
                    /*if(newTimeRange === week && dataGrouping.unitsWeek){
                                dataGrouping = _.extend(dataGrouping, {
                                    enabled : true,
                                    units   : dataGrouping.unitsWeek
                                });
}*/

                    //BUG FIX: Handling empty Week and / or Intra data
                    var allData = _.flatten(_.pluck(graphObj, 'data'), true),
                        emptyData = !allData.length;

                    if (emptyData) {
                        throw new Error('Not Traded for the ' + newTimeRange);
                    }


                    var opt = $.extend(true, {}, highstock, {
                        chart: {
                            height: chartHt,
                            width: width
                        },
                        plotOptions: {
                            flags: {
                                width: 16,
                                fillColor: '#5F86B3',
                                stackDistance: 20,
                                style: { // text style
                                    color: 'white'
                                }
                            },
                            scatter: {
                                dataGrouping: dataGrouping,
                                dashStyle: 'ShortDash',
                                marker: {
                                    enabled: true,
                                    symbol: 'circle',
                                    radius: 1.5,
                                    lineWidth: 0,
                                    states: {
                                        hover: {
                                            fillColor: null
                                        }
                                    }
                                }
                            },
                            series: {
                                dataGrouping: dataGrouping
                            }
                        },
                        navigator: {
                            custom: true,
                            enabled: hasNavigator,
                            height: navigatorHt
                        },
                        scrollbar: {
                            enabled: hasNavigator,
                            height: scrollbarHt
                        },
                        rangeSelector: {
                            buttons: btns,
                            selected: this.options.selectedRangeBtn
                        },
                        series: graphObj,
                        tooltip: {
                            crosshairs: true,
                            followPointer: true,
                            valueDecimals: chartOpt.decimals
                        },
                        xAxis: {
                            events: {
                                setExtremes: function(e) {
                                    //options.syncExtremes(e, options.name);
                                    options.syncInstances(e, options.name);
                                }
                            }
                        },
                        yAxis: multipleYaxis
                    });


                    this.$el.highcharts('StockChart', opt);

                    var chartRef = this.$el.highcharts();

                    //Adding the chart reference to the View & chartList
                    this.chartRef = chartRef;
                    options.charts.push({
                        id: options.name,
                        ref: chartRef
                    });

                    //adding crosshair
                    this.options.addCrosshair.call(this, options.name);

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
                    }

                    if (this.isTouch) {
                        $(chartRef.container).on('touchmove', {
                            extent: extent
                        }, this.onMouseMove);
                    }
                    $(chartRef.container).on('mousemove', {
                        extent: extent
                    }, this.onMouseMove);
                    $(chartRef.container).on('mouseleave', {
                        extent: extent
                    }, this.onMouseLeave);

                    //grabbing References
                    this.grabReferences(seriesModel);

                    //HACK: updating currTimeRange
                    seriesModel.updateTimeRange(newTimeRange);

                    //do things after chart load here
                    options.callback(chartRef);

                }

            } catch (e) {
                this.options.messenger.error({
                    msg: e.message,
                    on: 'rendering chart',
                    source: 'chart',
                    range: newTimeRange
                });
            }
        },

        /**
         *  This method adds a series to the chart.
         *  @method addSeries
         *  @private
         */
        addSeries: function(args) {
            var params = args.param,
                hasVolume = this.hasVolume,
                initLen = this.collection.length,
                config = this.options.config,
                chart = config.chart,
                messenger = this.options.messenger,
                model = this.model,
                chartType = model.get('chartType'),
                currRange = model.getCurrentRange(),
                dataGrouping = config.dataGrouping;

            if (args.toCompare || !model.isHist()) {
                chartType = 'line';
            }

            for (var i = 0, len = params.length; i < len; i++) {
                var coloursUsed = this.collection.pluck('colour'),
                    colours = _.difference(chart.seriesColours, coloursUsed);

                if (this.collection.length >= chart.maxCompare) {

                    if (((this.model.getPrimarySerie()).attributes.isStale) && (chart.maxCompare == this.collection.length)) {

                    } else {
                        var rem = params.slice(i);
                        messenger.error({
                            data: rem,
                            msg: "Max Limit Reached. Cannot compare " + rem.length + " series",
                            source: 'addSeries', // Hack to display <i>msg</i> instead of <i>on</i>
                            on: 'adding new serie',
                            loaded: true
                        });
                        return false;
                    }
                }

                var param = params[i];
                if (!(param && (param.url || param.code && param.exchange && param.name))) {
                    messenger.error({
                        data: param,
                        msg: "Missing params",
                        on: 'adding new serie. Missing Params',
                        loaded: true
                    });
                    continue;
                }

                var newSerie = new Serie(
                    _.extend({
                            isPrimary: args.setAsPrimary,
                            currTimeRange: currRange,
                            hasVolume: hasVolume,
                            chartType: chartType,
                            timeInterpolation: chart.timeInterpolation,
                            plotOn: chart.plotOn,
                            colour: colours[0],
                            id: param.name,
                            name: param.name,
                            grouping: dataGrouping.enabled,
                            groupingWeek: dataGrouping.unitsWeek,
                            appendData: chart.appendData
                        },
                        param
                    ), {
                        validate: true
                    }
                );

                if (newSerie.validationError) {
                    messenger.error({
                        data: newSerie,
                        msg: 'Invalid serie params' + newSerie.validationError,
                        on: 'instanciating serie model',
                        loaded: true
                    });
                    return;
                }

                var afterAdd = this.collection.add(newSerie);

                if (initLen !== afterAdd.length) {
                    //passing messenger to the serie
                    newSerie.messenger = messenger;

                    // prevent duplicates; length remains same if duplicate
                    newSerie.getRangeData({
                        newTimeRange: currRange,
                        //  updateRange  : true,
                        callback: args.callback,
                        onLoad: model.get('onLoad')
                    });
                } else {
                    var message = "Duplicate series " + param.name;
                    messenger.error({
                        msg: message,
                        on: 'adding serie model to the collection. ' + message,
                        loaded: true
                    });
                }

                if (args.setAsPrimary || !initLen) {
                    this.model.updatePrimarySeries(newSerie);
                }

            }
        },

        fetchPrimarySeries: function() {
            this.addSeries({
                param: this.options.param,
                setAsPrimary: true
            });
        },

        grabReferences: function(seriesModel) {
            var chart = this.chartRef;
            seriesModel.grabReferences(chart);

            var grabFlags = seriesModel.isPrimary(),
                flags = this.options.flags;
            if (grabFlags && flags) {
                flags.grabReferences(chart);
            }
        },

        plotSerie: function(args) {
            var chart = this.chartRef,
                object = args.object,
                len = object.length,
                last = len - 1;

            for (var i = 0; i < len; i++) {
                chart.addSeries(object[i], (i !== last) ? args.redraw : args.last_redraw);
            }

            //grab only series references, not flags
            this.grabReferences(args.model);

        },

        removeSerie: function(serieModel) {
            var attr = serieModel.toJSON();
            if (attr.isStale) {
                //if the serie is the primary one then don't remove
                return;
            }

            var vol = attr.volume;
            if (vol) {
                vol.remove(false);
            }

            var ref = attr.serie;
            if (ref) {
                ref.remove(false);
            }
        },

        /**
         *  This method reads the values of series when in compare mode
         */
        updateReadings: function(index) {
            var isHist = this.model.isHist();
            var updateDate = true,
                priSerie, dateTimeStr;
            this.collection.each(function(serie, i) {
                var data;
                try {
                    if (!i) {
                        priSerie = serie;
                    }
                    if (serie.get('isDisabled')) {
                        return;
                    }
                    var ref = serie.get('serie'),
                        volRef = serie.get('volume');
                    var pt = ref && ref.tooltipPoints[index],
                        volPt = volRef && volRef.tooltipPoints[index];

                    if (!pt) {
                        throw new Error('No pt exists for index-', index);
                    }

                    if (pt.x) {
                        var date = new Date(pt.x);
                        dateTimeStr = isHist ? date.toIndianDate() : date.toIndianDateTime();
                    }

                    data = {
                        x: dateTimeStr,
                        y: pt.y,
                        change: pt.change,
                        volY: volPt && volPt.y,
                        volChange: volPt && volPt.percentage
                    };
                } catch (e) {
                    data = data || {}; // needed when no pt
                    data.error = e;
                    data.x = dateTimeStr;
                } finally {
                    if (data && data.x) {
                        serie.trigger('reload-readings', data);
                        if (updateDate) {
                            priSerie.trigger('reload-date', data.x);
                            updateDate = false;
                        }
                    }
                }
            });
        },

        /**
         *  This method reads the OHLC values of the main series when not in compare mode
         */
        updateOHLCReadings: function(serie, eindex) {
            // This will be called only when the chart isHist
            var data, dateTimeStr;
            try {
                var ref = serie.get('serie'),
                    volRef = serie.get('volume');
                var pt = ref && ref.tooltipPoints[eindex],
                    volPt = volRef && volRef.tooltipPoints[eindex],
                    vol = volPt && volPt.y,
                    day = new Date(pt.x).getDay(),
                    isHist = this.model.isHist(),
                    currData, change;

                if (!pt) {
                    throw new Error('No pt exists for index ', eindex);
                }

                var hasOHLCvalues = pt.open && pt.high && pt.low && pt.close;

                var data_raw = serie.getRangeData();
                var dates = data_raw.dates,
                    index = _.indexOf(dates, pt.x),
                    adjustedDate;
                if (index === -1 && day === 0) {
                    //if data doesn't exist & if its a sunday, then add one day to it
                    //1 day = 24 * 60 * 60 * 1000 ms = 86400000 ms
                    adjustedDate = pt.x + 86400000;
                    index = _.indexOf(dates, adjustedDate);
                } else if (index === -1 && day === 6) {
                    // else if data doesn't exist & if its a saturday, then  add 2 days
                    //2 days = 2* 24 * 60 * 60 * 1000 ms = 172800000 ms
                    adjustedDate = pt.x + 172800000;
                    index = _.indexOf(dates, adjustedDate);
                }

                if (!hasOHLCvalues) {
                    //if its not OHLC or Candlestick series
                    currData = data_raw.json[index];
                }
                if (!vol) {
                    vol = data_raw.volume[index][1];
                }

                if (dates.length) {
                    change = data_raw.change[index];
                } else {
                    change = _.findWhere(data_raw.change, {
                        date: pt.x
                    })
                }

                var d = currData || pt;
                var date = new Date(d.x || d.date);

                dateTimeStr = isHist ? date.toIndianDate() : date.toIndianDateTime();
                data = {
                    x: dateTimeStr,
                    y: d.y,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                    volume: d.volume || vol,
                    change: change
                }
            } catch (e) {
                data = data || {}
                data.error = e;
                data.x = dateTimeStr;
            } finally {
                //trigger an event on the priSerie
                serie.trigger('reload-ohlc-readings', data);
                serie.trigger('reload-date', data.x);
            }
        },

        toggleCompareMode: function(args) {
            // this function toggles between normal & compare mode
            args = args || {};
            var chart = this.chartRef,
                toCompareMode = !this.model.inCompareMode(),
                compareVolume = (typeof args.compareVolume !== 'undefined') ? args.compareVolume : this.compareVolume,
                type, stacking, formatter;

            if (toCompareMode) {
                //Adding compare
                type = args.type;
                stacking = args.stacking;
                formatter = function() {
                    return ((this.value > 0) ? '+' : '') + this.value + '%';
                };

                //saving this key temporarily till we get out of compare mode
                this.compareVolume = compareVolume;
            } else {
                //Removing compare
                type = null;
                formatter = function() {
                    return ((this.value > 0) ? '<span style="padding:0px;font-weight: normal; font-size: 12px; font-style: normal; line-height:normal; font-family: RupeeForadianRegular, sans-serif;">`</span>' : '<span style="padding:0px;font-weight: normal; font-size: 12px; font-style: normal; line-height:normal; font-family: RupeeForadianRegular, sans-serif;">`</span>') + this.value;
                };
                stacking = null;

                delete this.compareVolume;
            }

            var serie0 = this.collection.at(0);
            serie0.toggleSerie({
                toCompareMode: toCompareMode,
                type: type,
                stacking: stacking,
                compareVolume: compareVolume
            });


            if (!chart) {
                return false;
            }

            chart.yAxis[0].update({
                labels: {
                    formatter: formatter
                }
            }, false);
            chart.yAxis[0].setCompare(type, false);

            //set model to compare mode
            this.model.toggleCompareMode();

            return true;
        },

        updateRangeSelector: function(rsObj, min, max) {
            var chart = this.chartRef;
            if (chart && min && max) {
                //update the chart to the given min-max range
                chart.xAxis[0].setExtremes(min, max);
            } else if (chart && rsObj) {
                chart.rangeSelector.clickButton(rsObj.index, true);
            }
        },

        onMouseMove: function(e) {
            //console.log("Mouse moved");
            var options = this.options;
            options.manageMouseMove(e, options.name, e.data.extent);
        },

        onMouseLeave: function(e) {
            //console.log("Mouse leave");
            var options = this.options;
            options.manageMouseMove(e, options.name, e.data.extent);
        },

        preventDefault: function(e) {
            e.preventDefault();
            return false;
        },

        reBindEvent: function(handles) {
            //handle should be either onmousemove or ontouchmove, ontouchstart
            var container = this.chartRef && this.chartRef.container;
            if (container) {
                for (var i = 0, len = handles.length; i < len; i++) {
                    var handle = handles[i];
                    //if no handler except preventDefault is assigned to the event on the container
                    if ((!container[handle] || container[handle] === this.preventDefault) && typeof this.defaultHandlers[handle] === 'function') {
                        container[handle] = this.defaultHandlers[handle];
                        this.defaultHandlers[handle] = null;
                    }
                }
            }
        },

        unBindEvent: function(handles) {
            var container = this.chartRef && this.chartRef.container;
            if (container) {
                for (var i = 0, len = handles.length; i < len; i++) {
                    var handle = handles[i];

                    if (container[handle] && container[handle] !== this.preventDefault) {
                        this.defaultHandlers[handle] = container[handle];
                        container[handle] = /ontouchmove|touchend/.exec(handle) ? null : this.preventDefault || function(evt) {
                            evt.preventDefault();
                            return false;
                        };
                    }
                }
            }
        },

        isInside: function(event, type) {
            type = type || 'plot';
            var x = event.offsetX,
                y = event.offsetY,
                chart = this.chartRef,
                left = chart.plotLeft,
                right = chart.plotLeft + chart.plotWidth,
                top = chart.plotTop,
                bottom = chart.plotTop + chart.plotHeight,
                chartTop = (chart.extraTopMargin) ? top - chart.extraTopMargin : top,
                chartBottom = (chart.extraBottomMargin) ? bottom + chart.extraBottomMargin : bottom,
                result;

            switch (type) {
                case 'plot':
                    result = (x > left && x < right && y > top && y < bottom);
                    break;
                case 'chart':
                    result = (x > left && x < right && y >= chartTop && y <= chartBottom);
                default:
                    result = false;
            }

            return result;
        },

        purge_drawInstances: function(models, options) {
            var view = this;
            _.each(options.previousModels, function(model) {
                model.purge();
            });
        },

        draw_lines: function(model, value) {
            if (value) {
                model.draw(this.chartRef.renderer, value, this.decimals);
            }
        },

        /**
         *  This method is called when the draw instance is about to get inserted
         */
        insert_lines: function(model, value) {
            model.insert(this.chartRef, value, this.decimals);
        }

    });
});
