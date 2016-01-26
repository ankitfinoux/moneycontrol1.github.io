/**
 *	js/models/model_serie.js
 */

define([
    //libraries
    'jquery', 'underscore', 'backbone',
    //config
    'config',
    //others
    'parse'
], function(
    //libraries
    $, _, Backbone,
    //config
    config,
    //others
    parse
) {

    var conf = config.chart,
        hist = conf.timeRanges[conf.histIndex],
        week = conf.timeRanges[conf.weekIndex],
        intra = conf.timeRanges[conf.intraIndex],
        appendDataFor = conf.appendDataFor,
        appendOrder = conf.appendOrder,
        appendRanges = _.without(appendOrder, appendDataFor),
        fileName = _.template(conf.fileFormat);

    return Backbone.Model.extend({
        defaults: {
            data_raw: {},
            asset: '',
            appendData: false,
            isHidden: false,
            isPrimary: false,
            isStale: false
        },
        initialize: function() {},
        validate: function(attrs) {
            var url = attrs.url;
            if (!url && !attrs.name && !attrs.exchange)
                return 'Missing Parameters: url / name / exchange';

            if (url) {
                if (!(typeof url === 'object' && url.intra && url.week && url.hist))
                // if url is passed as a parameter & if it doesn't have urls
                    return 'Incomplete url object';
            }
        },

        /**
         *	Returns whethwe the given serie model is primary serie of the chart
         *
         *	@method isPrimary
         *	@returns {Boolean}
         *	@public
         */
        isPrimary: function() {
            return this.get('isPrimary');
        },

        /**
         *	Set a particular serie as stale & hence hides it. Use it only on a primary serie
         *
         *	@method stale
         *	@private
         */
        stale: function() {
            this.set({
                'isStale': true
            });

            this.hide();
        },

        /**
         *
         *
         *	@method
         *	@param
         *	@returns
         *	@public
         */
        enable: function(redraw) {
            this.show(redraw);
            this.set('isDisabled', false);
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@public
         */
        disable: function() {
            this.hide(false);
            this.set('isDisabled', true);
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@public
         */
        hide: function(redraw) {
            this.toggle(false, redraw);
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@public
         */
        show: function(redraw) {
            this.toggle(true, redraw);
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@public
         */
        updateTimeRange: function(newTimeRange) {
            if (newTimeRange) {
                // update the timeRange
                this.set('currTimeRange', newTimeRange);
            }
        },

        /**
         *
         *
         *	@methodget
         *	@returns {String} the current timerange in the serie model
         *	@private
         */
        getCurrentRange: function() {
            return this.get('currTimeRange')
        },

        /**
         *
         *
         *	@method
         *	@public
         */
        purgeData: function() {
            //delete the current data
            this.set({
                'data_raw': new Object()
            }, {
                silent: true
            });
        },

        /**
         *	Use this function to check if data exists for a given range or even to grab range data
         *
         *	@method dataExists
         *	@param {String} newTimeRange
         *	@returns {Data|False}  returns data instead of true if it exists , else returns false
         *	@public
         */
        dataExists: function(newTimeRange) {
            var data = this.get('data_raw')[newTimeRange];
            return data ? data : false;
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        extractData: function(args) {
            var min = args.min,
                max = args.max,
                priSerieRef = this.get('serie'),
                processedXData = priSerieRef && priSerieRef.processedXData,
                callback = args.callback || function() {};


            //series.processedXData & series.processedYData has the X & Y values of the points currently shown in the chart
            //Also, the first entry of these array is not shown in the chart with Highstock version 1.3.2. Need to adjust for that

            //Here we need to get a slice of the input/CSV data for the given range. So we will be using first (actually second) 
            //and last value of processedXData to slice the input data. 
            //Then make overlays & indicators adapt to the updated range

            //We can also use e.min & e.max but there it is not accurate ( date sync issues exists - it returns Sat/Sun dates also)
            if (processedXData) {
                var len = processedXData.length;
                min = processedXData[1]; // TODO: Please test if 0th value is always not shown, even for series with few points
                max = processedXData[len - 1];
                //console.log(min, max, 'proxessxdata');

                return this.getHistData({
                    callback: function(err, data, range) {
                        if (err) {
                            return;
                        }
                        var data = args.data || this.getRangeData();
                        var error,
                            dates = _.pluck(data.array, 0),
                            startIndex = dates.indexOf(min),
                            endIndex = dates.indexOf(max) + 1; // +1 because we even have to include the last one
                        if (!(_.isNumber(startIndex) && _.isNumber(endIndex))) {
                            error = new Error("Error while updating range");
                        }
                        // var rangeData = data.json.slice(startIndex, endIndex); 


                        //ADDING 20 more data points for Moneycontrol
                        if (data.json[startIndex - 26] != undefined) {
                            var twenty_points = data.json.slice(startIndex - 26, startIndex - 1);
                        }


                        if (this.getCurrentRange().toString() == "hist") {
                            var rangeData = data.json.slice(startIndex, endIndex);
                        } else {
                            var rangeData = data.json.slice(0, endIndex);
                        }
                        //console.log(new Date(min), new Date(max), "\n"+startIndex, endIndex, rangeData, '!!!!!!!!!!!');
                        if (twenty_points) {
                            callback(error, rangeData, range, min, max, twenty_points);

                        } else {
                            callback(error, rangeData, range, min, max);
                        }




                        return rangeData;
                    }
                });

            }
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@public
         */
        getRangeData: function(args) {
            /**
             * 	This function supports both synchronous & asynchronous format
             *
             *	If args.newTimeRange is NOT present, it selects the current range & returns the corresponding data. (Data should always exists for the current range)
             *	When data for the given range is present, it executes the callback if present, passing data within it, & later returns the data
             *
             *	When data for the given range doesn't exist it wil fetch the same. Use callback to execute on data fetch success
             */
            args = args || {};

            var model = this,
                newTimeRange = args.newTimeRange || this.getCurrentRange(),
                callback = args.callback || function() {};

            var data = this.dataExists(newTimeRange);
            if (data) {
                //data exists
                callback.call(model, null, data, newTimeRange, false);

                //if(updateRange)
                //model.updateTimeRange(newTimeRange);
                return data;
            } else {
                //data doesn't exists fetch a new file

                //Logic for 4+1
                // if(this.get('appendData') && newTimeRange === appendDataFor){ 
                if (newTimeRange === appendDataFor) { //ankitz removed this.get('appendData') condition in IF
                    //setting a key to indicate that the model has an appending type of data currently
                    this.set({
                        'appending': true,
                        'appendingFor': newTimeRange
                    });

                    var store = {
                        count: 0,
                        result: {},
                        error: []
                    };
                    //adding events to store object
                    _.extend(store, Backbone.Events);
                    store.on('data-received', function(error, data, range, skipMsg) {
                        //this is bound to the store obj
                        this.result[range] = data;
                        this.skipMsg = skipMsg && (this.skipMsg || false);
                        /*if(error){
							this.error.push(error.message);
						}*/
                        this.count++;
                        if (this.count === appendOrder.length) {
                            this.trigger('all-data-received');
                        }
                    });
                    store.on('all-data-received', function() {
                        //this is bound to the store obj

                        //append intra & week data here
                        var result,
                            error = false,
                            store = this;
                        _.each(appendOrder, function(range, i) {
                            if (!result) {
                                result = _.clone(store.result[range]);
                            } else {
                                _.each(store.result[range], function(val, key) {
                                    result[key] = _.union(result[key], val);
                                });
                            }
                        });
                        if (!result) {
                            error = new Error('Missing intra/week files');
                        } else if (!result.json.length) {
                            error = new Error('Not Traded for the ' + appendDataFor);
                        } else {
                            var appendResult = {};
                            appendResult[appendDataFor] = result;

                            var newData = _.extend(model.get('data_raw'), appendResult);
                            model.set('data_raw', newData);
                        }

                        //unsetting the appending key
                        model.unset('appending');
                        callback.call(model, error, result, appendDataFor, /*newFile*/ true, /*skipMsg*/ this.skipMsg);
                    });

                    function appendHandler(error, data, range, newFile, skipMsg) {
                        store.trigger('data-received', error, data, range, skipMsg);
                    };
                    model.fetch({
                        newTimeRange: newTimeRange,
                        callback: appendHandler,
                        onLoad: args.onLoad
                    });

                    for (var i = 0, len = appendRanges.length; i < len; i++) {
                        model.getRangeData({
                            newTimeRange: appendRanges[i],
                            callback: appendHandler
                        });
                    }

                } else {
                    model.fetch({
                        newTimeRange: newTimeRange,
                        callback: callback,
                        onLoad: args.onLoad
                    });
                }
            }
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@public
         */
        getHistData: function(args) {
            args = args || {};
            var range = this.getCurrentRange();
            return this.getRangeData({
                newTimeRange: range,
                callback: args.callback
            })
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        getDataType: function(args) {
            var chartType = args.chartType || this.get('chartType'),
                //	isNewRange = args.isNewRange || ( (args.onLoad)? true : false ),
                type;

            if (!args.isHist) {
                type = 'array';
            } else {
                type = (_.indexOf(['ohlc', 'candlestick'], chartType) < 0) ? 'plot' : 'array'
            }

            return type;
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        fetch: function(args) {

            var model = this,
                attr = model.toJSON(),
                timeInterpolation = this.get('timeInterpolation'),
                plotOn = attr.plotOn,
                newTimeRange = args.newTimeRange,
                dataType = conf.dataType || 'csv',
                url = attr.url,
                name = attr.name;

            if (url) {
                url = url[newTimeRange]
            } else {
                if (dataType === 'csv') {
                    //generating the link to the csv file
                    var name = fileName(attr);
                    url = conf.urlPath[newTimeRange] + name;
                } else {
                    //if REST API
                    //pass params
                }
            }

            if (url) {
                var error = false;
                $.ajax({
                    url: url,
                    dataType: (dataType === 'csv') ? 'html' : dataType,
                    success: function(dataStr, status, xhr) {
                        try {
                            var parseMap = attr.parseMap,
                                parseAs,
                                noTrading,
                                msgType = 'error';
                            if (parseMap && parseMap[newTimeRange]) {
                                parseAs = parseMap[newTimeRange];
                            }
                            var data = parse[conf.graphing_library_used]({
                                    data: dataStr,
                                    dataType: dataType,
                                    range: newTimeRange,
                                    plotOn: plotOn,
                                    parseAs: parseAs,
                                    exchange: attr.exchange,
                                    timeInterpolation: timeInterpolation
                                }),
                                r = {};

                            if (!data.json.length) {
                                var msg = name + ': Not Traded for the ' + ((newTimeRange === intra) ? 'Day' : newTimeRange);
                                //BUG FIX: Not Traded 
                                error = new Error(msg);
                                noTrading = true;

                                //if its onLoad & not appending we throw this error else we just notify
                                if (args.onLoad && !model.get('appending')) {
                                    msgType = !args.onLoad ? 'warn' : msgType;
                                    throw error;
                                } else {
                                    model.messenger.warn({
                                        model: model,
                                        msg: msg,
                                        range: newTimeRange
                                    });
                                }
                            }

                            if (!noTrading) {
                                //Not stroring the data if its empty
                                r[newTimeRange] = data;

                                //model.updateTimeRange(newTimeRange);

                                var newData = _.extend({}, model.get('data_raw'), r);
                                model.set({
                                    'data_raw': newData
                                }, {
                                    silent: true
                                });
                            }

                        } catch (e) {
                            error = e;
                            model.messenger[msgType]({
                                error: e,
                                model: model,
                                msg: e.message,
                                status: xhr.status,
                                on: e.on || 'parsing the data',
                                source: 'data',
                                url: this.url,
                                range: newTimeRange
                            });
                        } finally {
                            args.callback.call(model, error, data, newTimeRange, /*newFile*/ true, /*skipMsg*/ noTrading);

                            //BUG FIX: (for) 4+1 onload not shown 
                            //shifting trigger-ing line from try block to finally
                            var isAppending = model.get('appending'),
                                appendingFor = model.get('appendingFor');
                            if ((!error || (noTrading && appendingFor)) && !isAppending) { // the first OR ignores noTrading error
                                var range = appendingFor || newTimeRange; //workaround to fix onLoad week 4+1 bug
                                //triggering an unique event instead of using 'change:data_raw' event to pass range to view_chart.render
                                model.unset('appendingFor'); //workaround to fix onLoad week 4+1 bug
                                model.trigger('data-updated', model, range);
                            }
                        }
                    },
                    error: function(xhr, error, status) {
                        var msg = newTimeRange + ' file ' + status + ' for ' + name;
                        if (args.onLoad) {
                            model.messenger.error({
                                model: model,
                                msg: msg,
                                url: this.url,
                                range: newTimeRange,
                                status: xhr.status,
                                on: 'making ajax call',
                                source: 'ajax'
                            });
                        }

                        args.callback.call(model, new Error(msg), null, newTimeRange, null, false);
                    },
                    type: 'GET'

                })
            } else {
                model.messenger.error({
                    model: model,
                    msg: 'NO URL FOUND',
                    on: 'attempting an ajax call',
                    type: 'url',
                    range: newTimeRange
                });
            }
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        getHighstockSeriesObject: function(args) {
            var attr = this.toJSON(),
                range = attr.currTimeRange,
                data = args.data || attr.data_raw[range],
                chartType = attr.chartType,
                dataType = this.getDataType(_.extend({
                    chartType: chartType
                }, args)),
                name = attr.name,
                //noFlags = args.noFlags,
                hasVolume = attr.hasVolume;

            var serie = {
                    type: chartType,
                    data: data && data[dataType] || [],
                    name: name,
                    id: name,
                    color: attr.colour,
                    visible: true
                },
                volume = {
                    type: 'column',
                    color: attr.colour,
                    data: data && data.volume || [],
                    id: name + '-volume',
                    name: name + '-volume',
                    visible: true,
                    yAxis: 1,
                    tooltip: {
                        valueDecimals: 0
                    }
                };

            if (args.toCompareMode) {
                //if compare mode
                noFlags = true;
                var setting = this.compareModeSettings(args);

                if (!args.compareVolume) {
                    //hideVolume is set to true for compare series when compareVolume = false
                    //for compare series we plot the volumn but don't display it when in compare mode.
                    //When we switch out of compare & if primarySeries is changed, we just change the visibility of the new primarySerie
                    volume.visible = false;
                }

                _.extend(serie, setting.serie);
                _.extend(volume, setting.volume);
            }

            var result = hasVolume ? [serie, volume] : [serie];

            return result;
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        grabReferences: function(chartRef) {
            var name = this.get('name'),
                serieRef = chartRef.get(name),
                volumeRef = chartRef.get(name + '-volume');

            this.set({
                'serie': serieRef,
                'volume': volumeRef
            });
        },

        /**
         *
         *
         *	@method toggle
         *	@public
         */
        toggle: function(visibility, redraw) {
            var serie = this.get('serie'),
                chart;
            if (serie) {
                chart = chart || serie.chart;
                serie.setVisible(visibility, false);
            }

            var volume = this.get('volume');
            if (volume) {
                chart = chart || serie.chart;
                volume.setVisible(visibility, false);
            }

            if (redraw && chart) {
                chart.redraw();
            }

            this.set('isHidden', true);
        },

        /**
         *
         *
         *	@method
         *	@returns
         */
        updateData: function(args) {
            //ankitz: added args.inCompareMode this will always use default Linetype from config when in compare mode
            if (!args.inCompareMode) {
                if (args.ids == 'weekly' || args.ids == 'monthly' || args.ids == 'daily') { //SK Linetyoe fix for rangeselection

                } else if ($('#weekly')[0] && $('#weekly')[0].classList[1] && args.isHist) {
                    args.ids = 'weekly';
                } else if ($('#daily')[0] && $('#daily')[0].classList[1] && args.isHist) {
                    args.ids = 'daily';
                } else if ($('#monthly')[0] && $('#monthly')[0].classList[1] && args.isHist) {
                    args.ids = 'monthly';
                } else {
                    args.ids = 'daily'; //ankitz: default is daily
                }
            }


            if (args.silent) {
                return false;
            }
            var data = args.data || this.getRangeData();
            var dataType = this.getDataType(args);
            //console.log(args, dataType);
            if (!data) {
                return false;
            }
            if (args.ids) {

                var volData = data.volume,
                    serieData = data[dataType],
                    dataGrouping = {
                        enabled: false
                    };
                newdata = [];

                if (args.ids !== 'daily') {
                    for (i = 1; i < serieData.length; i++) {
                        prevdate = new Date(serieData[i - 1][0]);
                        currdate = new Date(serieData[i][0]);
                        if (args.ids == 'monthly') {
                            if (currdate.getMonth() != prevdate.getMonth()) {
                                newdata.push(serieData[i - 1]);
                            }
                        } else if (args.ids == 'weekly') {
                            tok = currdate.getDay();
                            if (tok == 5) {
                                newdata.push(serieData[i]);
                            }
                        }

                        // } else if (args.ids == 'daily') {
                        //     //newdata.push(serieData[i-1]);//ankitz BeFORE: newdata.push(serieData[i]); this was missing the first value
                        // }
                    }
                    serieData = newdata;
                }

            } else {
                //console.log('in else');
                var volData = data.volume,
                    serieData = data[dataType],
                    dataGrouping = {
                        enabled: false
                    };
            }
            if (!volData.length && !serieData.length) {
                return false;
            }

            var visible = args.visible === false ? false : true;

            /*var groupingWeek = this.get('groupingWeek');
			if(groupingWeek && !args.isIntra && !args.isHist){
				dataGrouping = {
					units : groupingWeek,
					enabled: true
				}
			}*/
            if (this.get('grouping')) {
                //if grouping key is set then it will override groupingWeek settings
                dataGrouping = {
                    enabled: !args.isIntra, // this prevents grouping for intra
                    units: null
                }
            }

            //update volume data when silent undef or false
            var volume = this.get('volume');
            if (volume) {
                volume.update({
                    data: volData,
                    dataGrouping: dataGrouping,
                    visible: visible
                }, args.redraw); //!!!chart-redraw
            }

            var serie = this.get('serie');
            if (serie) {
                serie.update({
                    data: serieData,
                    type: args.chartType,
                    dataGrouping: dataGrouping,
                    visible: visible
                }, args.redraw); //!!!chart-redraw // Require this to be true else rangeSelector will have wrong values
            }

            this.set({
                'isHidden': !visible,
                'isDisabled': args.isDisabled || false
            });
            return true;

        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        compareModeSettings: function(args) {
            var unit = '%',
                pointFormat, volPointFormat,
                colour = this.get('colour');

            if (args.toCompareMode) {
                pointFormat = '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}' + unit + ')<br/>';
                volPointFormat = '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:,.2f}' + unit + ')<br/>';
            } else {
                pointFormat = '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>';
                volPointFormat = pointFormat;
            }

            return {
                serie: {
                    compare: args.type,
                    tooltip: {
                        pointFormat: pointFormat
                    }
                },
                volume: {
                    stacking: args.stacking,
                    color: colour,
                    tooltip: {
                        pointFormat: volPointFormat,
                        valueDecimals: 0
                    }
                }
            };
        },

        /**
         *
         *
         *	@method toggleSerie
         *	@param {Object} args
         *	@todo ?? toggle remove multiple Yaxis
         *	@private
         */
        toggleSerie: function(args) {
            // This is called only for the main series
            var setting = this.compareModeSettings(args);

            var serie = this.get('serie');

            if (!serie) {
                return false;
            }

            var data = serie.options.data,
                opt = _.extend({
                    data: data
                }, setting.serie);

            serie.update(opt, false);

            if (this.get('hasVolume')) {
                var volume = this.get('volume'),
                    volData = volume.options.data;

                if (!args.compareVolume) {
                    //var op = (args.toCompareMode)? 'hide': 'show';
                    //volume[op]();
                    volume.setVisible(!args.toCompareMode, false);

                    //TODO??: toggle remove multiple Yaxis
                } else {
                    var volOpt = _.extend({
                        data: volData
                    }, setting.volume);
                    volume.update(volOpt, false);
                }
            }
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        pluckState: function() {
            var state = this.pick('id', 'code', 'name', 'exchange', 'title', 'url');
            return state;
        },

        /**
         *
         *
         *	@method
         *	@returns
         *	@private
         */
        pickProperties: function() {
            var prop = this.pick('chartType', 'colour', 'plotOn', 'timeInterpolation', 'hasVolume', 'lineType'); //ankitz added 'lineType'
            return prop;
        }
    });
});
