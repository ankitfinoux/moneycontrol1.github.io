/**
 * js/parse.js
 *
 * This module parses the data for the widget based on the charting library
 *
 */

define([
    'jquery', 'underscore',
    'config', 'holidays'
], function($, _, defaultConfig, holidays) {
    //	console.log("parse loaded");
    var conf = defaultConfig.chart,
        ONE_WEEK = conf.ONE_WEEK,
        ONE_DAY = conf.ONE_DAY,
        ONE_MIN = conf.ONE_MIN,
        basic = conf.basic,
        hist = conf.timeRanges[conf.histIndex],
        intra = conf.timeRanges[conf.intraIndex],
        week = conf.timeRanges[conf.weekIndex],
        defaultTimings = conf.intraDayTimings,
        defaultTimeZoneOffset = conf.defaultTimeZoneOffset;
    /**
     * These modules should only deal with string/input and return its json/array conversion
     * and not with Widget objects
     */
    return {
        /**
         *	Parsing method for input data so that its understandable by the app, highcharts.
         *
         *	FILE STRUCTURE:
         *	HIST: Date, Open, High, Low, Close, Volume, Bonus, Dividends, Rights, Splits, //CUSTOM_EVENT1, CUSTOM_EVENT2
         *	WEEK: Date with YYYY , Time, Price, Volume, //Prev day's close price, Exchange Open Time, Exchange Close Time (only for 1st entry of a new date)
         *	INTRA:
         *		1st line: Today's date with YYYY, //Prev day's close, Exchange Open Time, Exchange Close Time
         *		2nd Line onwards: Time, Price, Volume
         *	BASIC: Date, Value
         *
         *	@method highstock
         * 	@param {Object} args { <br/>
         *		data: {String} input data string to parse, <br/>
         *		dataType: {String} dataType html/json/jsonp etc, <br/>
         *		range: {String} the current range intra/week/hist/basic,<br/>
         *		plotOn: {String} using this key we can plot the chart on open/close/high/low values,<br/>
         *		parseAs: {String} some csv have format of other range eg. intra file having format similar to week, then pass week here,<br/>
         *		exchange: {String} NSE/BSE etc,<br/>
         *		timeInterpolation: {Boolean} should we do time interpolation,<br/>
         *		returnFileVolume: {Boolean} intra/week - volume is cumulative for intra/week, by default we extract individual volume. use this to output volume supplied in csv<br/>
         *	}
         *	@returns {Object} { <br/>
         *		json 	: {Object[]} Each entry has the following entries {<br/>
         *				date : timestamp,<br/>
         *				open : Number,<br/>
         *				high : Number,<br/>
         *				low  : Number,<br/>
         *				close : Number,<br/>
         *				volume: Number<br/>
         *			},<br/>
         *		array 	: {Array[]} Each entry will be in an array with input no of enteries,<br/>
         *		plot 	: {Array[]} n x 2 array - only date & 'plotOn value from args',<br/>
         *		volume 	: {Array[]} n x 2 array - only date & volume,<br/>,<br/>
         *		dates	: {Array[]} n x 1 array - only dates,<br/>
         *		flags 	: {Object[]} in hist/if any - details of flags { <br/>
         *					x: date timestamp, <br/>
         *					title:  letter to display eg.'B', <br />
         *					text: value of that flag in the csv, <br/>
         *					name: type of that flag eg. 'bonus'<br/>
         *				}<br/>
         *		change 	: {Object[]} only for Hist; has keys { <br/>
         *					date : timestamp, <br/>
         *					change: {Number} change from yesterday, <br />
         *					percent: {number} change in percentage <br/>
         *			}<br/>
         *		prevClose: {Number} in intra/if any
         *	}
         *	@public
         *	@todo In the function 'interpolateTime' we need to consider the current time zone offset of the user to interpolate properly.
         *	Please implement else a user from a foreign country will see his local time
         */
        'highstock': function(args) {

            var timeInterpolation = args.timeInterpolation || false,
                returnFileVolume = args.returnFileVolume || false,
                str = args.data,
                plotOn = args.plotOn || 'close',
                dataType = args.dataType || 'csv',
                parseAs = args.parseAs || args.range;

            if (typeof str !== 'string') {
                throw new Error("Input to parser is not a string");
            }

            if (!parseAs) {
                throw new Error("Missing parseAs")
            }

            var result = {
                    json: [],
                    array: [],
                    plot: [],
                    volume: [],
                    dates: [],
                    change: []
                },
                json = result.json,
                array = result.array,
                volume = result.volume,
                plot = result.plot,
                dates = result.dates,
                change = result.change,
                isJSON = (dataType === 'json') ? true : false,
                data = (isJSON) ? JSON.parse(str) : str.split('\n'),
                len = data.length;

            function interpolateTime(from, to, prevClose) {
                var count = 0;
                var t = from;
                while (from < to) {
                    each = {
                        date: from,
                        y: prevClose
                    };
                    json.push(each);
                    change.push({
                        date: from,
                        change: 0.00,
                        percent: 0.00
                    });
                    array.push([each.date, each.y]);
                    volume.push([each.date, 0]);
                    dates.push(each.date);

                    from += ONE_MIN;
                    count++;
                }
                //console.log("interpolating ", new Date(t).toLocaleString(), new Date(to).toLocaleString(), count, prevClose);
            };

            var getVolume = function(today, prev) {
                if (!returnFileVolume) {
                    getVolume = function(today, prev) {
                        //return current time volume
                        return today && (today - prev) || 0;
                    };
                } else {
                    getVolume = function(today) {
                        //return volume as given in file
                        return today || 0;
                    };
                }
            };
            getVolume();

            switch (parseAs) {
                case hist:

                    result.flags = {
                        bonus: [],
                        dividends: [],
                        splits: [],
                        rights: []
                    };
                    var flags = result.flags,
                        prevDate, prevClose;

                    if (((data[0].split(',').length) == 2) && ((data[len - 1].split(',').length) == 2)) {
                        // if CSV
                        for (var i = 0; i < len; i++) {
                            var items = data[i].split(',');
                            var newDate = Date.parse(items[0]);
                            each = {
                                date: newDate,
                                open: 0.00,
                                high: 0.00,
                                low: 0.00,
                                close: Number(items[1]),
                                volume: 0.00 //null
                            };
                            json.push(each);
                            array.push([each.date, each.open, each.high, each.low, each.close]);
                            volume.push([each.date, each.volume]);
                            plot.push([each.date, each[plotOn]]);
                            change.push({
                                date: each.date,
                                change: 0.00,
                                percent: 0.00
                            });
                            dates.push(each.date);

                        };
                    } else {
                        $.each(data, function(lineNo, line) {
                            var each,
                                bonus, dividends, rights, splits;
                            if (!isJSON) {
                                // if CSV
                                var items = line.trim().split(','); // Adding trim strips out /r character at the end
                                var newDate = Date.parse(items[0]);

                                if (prevDate) {
                                    var nextDate = prevDate + ONE_DAY;
                                    while (newDate - nextDate > 0) {
                                        if (!holidays.isHoliday(nextDate, args.exchange)) {
                                            // Not one of Sat /Sun or exchange holiday
                                            // add an entry for this day to the arrays
                                            each = {
                                                date: nextDate,
                                                open: prevClose,
                                                high: prevClose,
                                                low: prevClose,
                                                close: prevClose,
                                                volume: 0 //null
                                            };
                                            json.push(each);
                                            array.push([each.date, each.open, each.high, each.low, each.close]);
                                            volume.push([each.date, each.volume]);
                                            plot.push([each.date, each[plotOn]]);
                                            change.push({
                                                date: each.date,
                                                change: 0.00,
                                                percent: 0.00
                                            });
                                            dates.push(each.date);

                                        }
                                        nextDate += ONE_DAY;
                                    }
                                }

                                each = {
                                    date: newDate,
                                    open: Number(items[1]),
                                    high: Number(items[2]),
                                    low: Number(items[3]),
                                    close: Number(items[4]),
                                    volume: parseInt(items[5])
                                };
                                bonus = items[6];
                                dividends = items[7];
                                rights = items[8];
                                splits = items[9]; // && items[9].length>1; // !!! HACK;

                                json.push(each);
                            } else {
                                // if JSON
                                each = line;
                                each.date = Date.parse(line.date);

                                bonus = each.bonus;
                                dividends = each.dividends;
                                rights = each.rights;
                                splits = each.splits;
                            }

                            if (bonus) {
                                flags.bonus.push({
                                    x: each.date,
                                    title: 'B',
                                    text: bonus,
                                    name: 'Bonus'
                                });
                            }
                            if (dividends) {
                                flags.dividends.push({
                                    x: each.date,
                                    title: 'D',
                                    text: dividends,
                                    name: 'Dividend'
                                });
                            }
                            if (splits) {
                                flags.splits.push({
                                    x: each.date,
                                    title: 'S',
                                    text: splits,
                                    name: 'Splits'
                                });
                            }
                            if (rights) {
                                flags.rights.push({
                                    x: each.date,
                                    title: 'R',
                                    text: rights,
                                    name: 'Rights'
                                });
                            }

                            var currChange = 0.00,
                                percent = 0.00;

                            if (prevClose) {
                                currChange = each[plotOn] - prevClose;
                                percent = currChange * 100 / prevClose;
                            }

                            array.push([each.date, each.open, each.high, each.low, each.close]);
                            plot.push([each.date, each[plotOn]]);
                            volume.push([each.date, each.volume]);

                            change.push({
                                date: each.date,
                                change: currChange,
                                percent: percent
                            });
                            dates.push(each.date);

                            //Setting prevDate & prevClose
                            prevDate = newDate;
                            prevClose = each[plotOn]; // !!! CHANGE TO CLOSE
                        });

                    }



                    break;
                case intra:
                    var date,
                        prevTime, prev,
                        startTime, endTime,
                        prevVol = 0;
                    var currChange = null,
                        percent = null;


                    $.each(data, function(i, line, data) {
                        var each;
                        if (!isJSON) {
                            if (!line) {
                                return;
                            }
                            var items = line.trim().split(',');
                            if (i) {
                                if (!(items[0] && items[1])) {
                                    throw new Error("Missing entries in the CSV")
                                }

                                prev = (array.length) ? array[array.length - 1][1] : prevClose;

                                var currTime = Date.parse(date + " " + items[0]);
                                var nextTime = prevTime + ONE_MIN;
                                if (timeInterpolation) {
                                    if (i === 1 && currTime > startTime) {
                                        //interpolate timings from startTime to the first entry
                                        interpolateTime(startTime, currTime, prev);
                                    } else if (currTime - nextTime > 0) {
                                        //interpolate in between entries
                                        interpolateTime(nextTime, currTime, prev);
                                    }
                                }

                                var todayVol = items[2] && parseInt(items[2]) || 0,
                                    // BUG FIX: this makes sure that the volume doesn't become NaN when not present in the csv
                                    vol = getVolume(todayVol, prevVol);
                                each = {
                                    date: currTime,
                                    y: Number(items[1]),
                                    volume: vol
                                };
                                json.push(each);

                                currChange = each.y - prev,
                                    percent = currChange * 100 / prev;

                                change.push({
                                    date: each.date,
                                    change: currChange,
                                    percent: percent
                                });

                                array.push([each.date, each.y]);
                                dates.push(each.date);

                                volume.push([each.date, vol]);

                                //interpolate for minutes from the last entry to the end time
                                //take into consideration of timezone offset
                                var d = new Date();
                                var currLocalTime = Date.parse(date + ' ' + d.getHours() + ':' + d.getMinutes());
                                var lastTimeToInterpolate = currLocalTime < endTime ? currLocalTime : endTime;
                                if (timeInterpolation && i === len - 1) {
                                    //console.log(new Date(lastTimeToInterpolate).toString());
                                    interpolateTime(each.date, lastTimeToInterpolate, each.y);
                                }

                                prevVol = todayVol;
                                prevTime = each.date;

                            } else if (i === 0) {
                                // first line has date & prev closing price
                                date = items[0];
                                prevClose = Number(items[1]);
                                startTime = Date.parse(date + ' ' + (items[2] || defaultTimings[0]));
                                endTime = Date.parse(date + ' ' + (items[3] || defaultTimings[1]));

                                result.prevClose = prevClose;
                            }
                        } else {

                        }
                    });
                    break;
                case week:
                    var prevVol, prevDate, prev,
                        prevTime, startTime, endTime;
                    var currChange = null,
                        percent = null;
                    //Using $.each instead of _.each as we want to break out of the loop
                    $.each(data, function(i, line, data) {
                        var newDate,
                            each;
                        if (!isJSON) {
                            var items = line.trim().split(',');

                            if (!(items[0] && items[1] && items[2])) {
                                //BUG FIX: Handle Empty week file
                                //if 1st entry is empty then we can conclude that no data exists
                                if (!i) {
                                    //breaking out of the loop
                                    return false;
                                }
                                throw new Error("Missing entries in the CSV");
                            }

                            newDate = Date.parse(items[0]);
                            if (_.isNaN(newDate)) {
                                throw new Error('Error in ' + (args.range || parseAs) + ' file Format');
                            }
                            var isNewDate = prevDate !== newDate;
                            if (isNewDate) {
                                prevDate = newDate;
                                startTime = Date.parse(items[0] + ' ' + (items[4] || defaultTimings[0]));
                                endTime = Date.parse(items[0] + ' ' + (items[5] || defaultTimings[1]));
                                prevTime = startTime - ONE_MIN; // subtracting 1 min for time adjustment with nextTime
                                prevVol = 0;

                            }

                            prev = (i && array[array.length - 1][1]);

                            var currTime = Date.parse(items[0] + " " + items[1]);
                            var nextTime = prevTime + ONE_MIN;
                            if (timeInterpolation && currTime - nextTime > 0 && i) { // remove i when prevClose available
                                //interpolate in between times
                                interpolateTime(nextTime, currTime, prev);
                            };
                            var todayVol = items[3] && parseInt(items[3]) || 0,
                                vol = getVolume(todayVol, prevVol);
                            each = {
                                date: currTime,
                                y: Number(items[2]),
                                volume: vol
                            };
                            json.push(each);

                            if (i) { // remove when prevClose available
                                currChange = each.y - prev;
                                percent = (prev) ? currChange * 100 / prev : null;
                            }

                            change.push({
                                date: each.date,
                                change: currChange,
                                percent: percent
                            });
                            array.push([each.date, each.y]);
                            dates.push(each.date);


                            volume.push([each.date, vol]);
                            prevVol = todayVol;
                            prevTime = currTime;
                        } else {

                        }
                    });
                    break;
                case basic:
                    //No intepolation here yet
                    $.each(data, function(lineNo, line) {
                        var items = line.split(',');
                        var date = Date.parse(items[0]);

                        var each = {
                            date: date,
                            value: Number(items[1])
                        }
                        json.push(each);
                        array.push([each.date, each.value]);
                    });
                    break;
            }
            //console.log(result);
            return result;

            //	}catch(err){
            //		throw err;
            //	}
        },
        'd3': function() {
            throw new Error("Parsing for D3 not yet implemented");

            return {};
        }
    };
})
