/**
 * 	/js/formulae.js
 *
 * 	This file has all the financial formulas
 *
 *	All data should be passed in json format unless explicitly specified
 *	JSON format: eg. [{
 *		date: 11029048912047, //TimeStamp,
 *		close: 1234,
 *		open: 1234,
 *		high: 1234,
 *		low: 1234
 *	}, ....]
 *
 *	ARRAY Format: eg. [[1036492076392, 1234], [],....]
 *
 *	Note: Input type is NOT checked. Please pass the correct inputs
 *	@see {@link http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators|StockCharts}
 *	@todo : a trivial optimization can be done. Remove try-catch block from each of the formulas & add that to the place from where they are called
 *
 */
define([
    'jquery',
    'underscore'
], function($, _) {

    return {
        /**
         *	This function calculates SMA at a given day - not the entire series. Used Internally by EMA
         *	Formula: SMA[i] = Average of Closing prices from i-period to i, where (i+1-period) >0
         *
         *	@method SMAat
         *	@param {Object[]|Array[]} data - Array of data values either in json or n x 2 array
         *	@param {Number} period - Window over which we need the SMA
         *	@param {Number} day - position where we need the SMA; day >= period -1
         *	@returns {Number|Undefined} SMA at that particular value if day >= period -1
         *
         */
        SMAat: function(data, period, day) {
            try {

                var i = day + 1 - period,
                    count = period,
                    sum = 0, //t =[],
                    result;
                if (i >= 0) { //period nos of entries exists
                    while (count--) {
                        if (i > 0) {
                            //sum += (data[i].close || data[i][1]); //t.push(i)
                            sum += (data[i].close || data[i].y || data[i][1]); //t.push(i) //--sk
                            // console.log(sum, data[i].y, i);
                            i++;
                        } else {
                            sum += (data[i].close || data[i].y || data[i][1]); //t.push(i) //--sk
                            // console.log(sum, data[i].y, i);
                            i++;
                        }

                    }
                    //console.log(t);
                    result = sum / period;

                    if (isNaN(result)) {
                        throw new Error(TypeError, "Calulation results in NaN for SMA@" + day);
                    }
                }
                //else return undefined as sma doesn't exists

                return result;
            } catch (err) {
                throw err;
            }
        },

        /**
         *	Simple Moving Average:
         *	Formula: SMA[i] = Average of Closing prices from i-period to i, where (i-period) >0
         *
         *	eg. 10 , 11 , 12 , 13 , 14 , 15 , 16 , period =5
         *	SMA@15 = (11 + 12 + 13 + 14 + 15) / 5
         *
         *	Optional Implementation: SMA[i] = SMA[i-1] + (Close[i] - Close[i-period])/period
         *	SMA@16 = SMA@15 + (16 - 11)/5
         *
         *	@method sma
         *	@param {Object[]|Array[]} data in JSON or Array format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=20] size of the window /period <br/>
         *	}
         *	@returns {Array[]} SMA of the given input. Format - (n-period+1 x 2 ) Array
         */
        sma: function(data, param) {
            var SMA = [],
                len = data.length,
                period = param.window || 20;

            for (var i = 0; i < len; i++) {
                var date = data[i].date || data[i][0],
                    ans;

                if (_.isUndefined(date)) {
                    throw new Error('Date is undefined for i: ' + i);
                }
                //var currData = data[i].close || data[i][1];
                var diff = i + 1 - period;
                if (diff >= 0) {
                    //if i >= period-th day; entire period number of values is now available
                    var sum = 0;
                    for (var j = diff; j <= i; j++) {
                        //sum += data[j].close || data[j][1];
                        if (j == 0) {
                            sum += data[j].close || data[j].y || data[j][1]; //-sk
                        } else {
                            sum += data[j].close || data[j].y || data[j][1]; //-sk
                        }
                    }
                    ans = sum / period;
                    SMA[diff] = [date, ans];
                }

            }
            return SMA;
        },

        /**
         *	Exponential Moving Average Formula:
         *	Multiplier = 2 /(Time Period +1)
         *
         *	EMA = (Close - EMA[previous day] ) * multiplier + EMA[previous day]
         *	EMA[period-th] (i.e. first EMA)= SMA[period-th] /SMA at that i value
         *
         *	@method ema
         *	@param {Object[]|Array[]} data in JSON or Array format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=20] size of the window /period <br/>
         *	}
         *	@returns {Array[]} EMA of the given input. Format - (n-period+1 x 2 ) Array
         */
        ema: function(data, param) {
            // console.log(data, 'ddata0');
            var period = (param.window) || 20,
                multiplier = 2 / (period + 1),
                EMA = [],
                len = data.length;

            for (var i = 0; i < len; i++) {
                var date = data[i].date || data[i][0],
                    ans;

                var diff = i + 1 - period;
                if (diff >= 0) {
                    if (diff > 0) {
                        //var close = data[i].close || data[i][1],
                        var close = data[i].close || data[i].y || data[i][1], //sk
                            prevDayEMA = EMA[diff - 1][1];
                        ans = (close - prevDayEMA) * multiplier + prevDayEMA;

                    } else {
                        //if its the 1st value, calculate its SMA
                        ans = this.SMAat(data, period, i) || null;
                    }
                    EMA[diff] = [date, ans];
                }
            }
            // console.log(EMA, 'ema');
            return EMA;
        },

        /**
         *	Window = 20, percent = 0.05
         *	Upper Envelope: window_day SMA + (window_day SMA x param)
         *	Lower Envelope: window_day SMA - (window_day SMA x param)
         *
         *	@method envelopes
         *	@param {Object[]|Array[]} data in JSON or Array format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=20] size of the window /period, <br/>
         *		percent: {Number} [percent=5] how much percent eg. 5, 10, 20 (not in the form 0.05, 0.1, 0.2)<br/>
         *	}
         *	@returns {Array[]} Envelope of the given input. Format - (n-period+1 x 3 ) Array
         */
        envelopes: function(data, param) {
            var percent = param.percent * 0.01 || 0.05,
                period = param.window || 20;

            var SMA = this.sma(data, param),
                len = SMA.length,
                upperMultiplier = 1 + percent,
                lowerMultiplier = 1 - percent,
                envelope_up = [];
            envelope_low = [];

            for (var i = 0; i < len; i++) {

                //copying the date
                var date = SMA[i][0],
                    up, low;

                //multiplying with respective multipliers
                if (SMA[i][1]) {
                    up = upperMultiplier * SMA[i][1];
                    low = lowerMultiplier * SMA[i][1];
                } else {
                    up = null;
                    low = null;
                }
                envelope_up[i] = [date, up];
                envelope_low[i] = [date, low];
            }
            //console.log("envelope", envelope.length);
            return {
                'upper_env': envelope_up,
                'lower_env': envelope_low
            }
        },

        /** 
         *	Standard Deviation Formula:
         *
         *	1. Calculate the average (mean) price for the number of periods or observations
         *	2. Determine each period's deviation (close less average price).
         *	3. Square each period's deviation
         *	4. Sum the squared deviations
         *	5. Divide this sum by the number of observations.
         *	6. The standard deviation is then equal to the square root of that number
         *
         *	Note: this method can be ported out separately as an explicit overlay. We just need to add an entry in the config file
         *
         *	@method standardDeviation
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=20] size of the window /period <br/>
         *	}
         *	@returns {Array[]} standard deviation of the given input. Format - (n-period+1 x 2 ) Array
         */
        standardDeviation: function(data, param) {


            var period = param.window || 20,
                //var close = _.pluck(data, 'close')

                len = data.length,
                stdDev = [];
            for (var i = 0; i < len; i++) {

                var sum = 0,
                    mean = 0,
                    deviation = 0,
                    dev2 = 0,
                    dev2Sum = 0,
                    variance = 0,
                    diff = i + 1 - period,
                    ans;

                if (diff >= 0) {
                    // 1. Calculate Arithmetic Mean
                    for (var j = diff; j <= i; j++) {
                        var close = data[j].close || data[j].y || data[j][1]; //--sk
                        //sum += close[j];
                        sum += close; //--sk
                    }
                    mean = sum / period;

                    // 2, 3, 4. Deviation
                    for (var k = diff; k <= i; k++) {
                        var close = data[k].close || data[k].y || data[k][1]; //--sk
                        deviation = close - mean; //sks
                        dev2 = Math.pow(deviation, 2);
                        dev2Sum += dev2;
                    }

                    variance = dev2Sum / period;
                    ans = Math.sqrt(variance)

                    stdDev[diff] = [data[i].date, ans];
                }
            }
            //console.log("STDEv", len, stdDev.length, stdDev);
            return stdDev;
        },
        /**	
         *	Bollinger Bands Formula:
         *
         *	Middle Band = 20-day simple moving average (SMA)
         *	Upper Band = 20-day SMA + (20-day standard deviation of price x 2)
         * 	Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
         *
         *	@method bollinger
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=20] size of the window /period <br/>
         *	}
         *	@returns {Object} {<br/>
         *		bands: {Array[]} bollinger band of the given input. Format - (n-period+1 x 3 ) Array, <br/>
         *		middle: {Array[]} sma20 of input. Format - (n-period+1 x 2) Array <br/>
         *	}
         */
        bollinger: function(data, param) {
            var period = param.window || 20,
                stdDev = this.standardDeviation(data, param),
                sma20 = this.sma(data, param),
                band = [],
                ups = [],
                lws = [],
                len = data.length;

            for (var i = 0; i < len; i++) {
                var date = data[i].date || data[i][0],
                    upper, lower;
                var diff = i + 1 - period;
                if (diff >= 0) {
                    upper = sma20[diff][1] + (stdDev[diff][1] * 2);
                    lower = sma20[diff][1] - (stdDev[diff][1] * 2);

                    //band[diff] = [date, upper, lower];
                    lws[diff] = [date, lower];
                    ups[diff] = [date, upper];
                }
            }
            return {
                'middle': sma20,
                'upper': ups,
                'lower': lws

            };
        },

        /**	
         *	Parabolic SAR Formula:
         *	Prior SAR: The SAR value for the previous period.
         *
         *	Extreme Point (EP): The highest high/ lowest low of the current uptrend.
         *
         *	Acceleration Factor (AF): Starting at .021 AF increases by .01 each time the extreme point
         *	makes a new high/low. AF can reach a maximum of .20, no matter how long the uptrend/downtrend extends.
         *
         *	Current SAR = Prior SAR + Prior AF(Prior EP - Prior SAR)
         *
         *	Note however that SAR can never be above/below the prior two periods' lows/highs. Should SAR be above/below one of those lows/highs,
         *	use the lowest/highest of the two for SAR
         *
         *	@method psar
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		afStep: {Number} [afStep=0.02] each step size of acceleration factor, <br/>
         *		afMax: {Number} [afMax=0.2] max acceleration factor ,<br/>
         *		colour: {Array} ['#f1503b', '#137f0a']
         *	}
         *	@returns {Array[]} pSAR of the given input. Format: {x: X_VAL, y: Y_VAL, color: PT_COLOR}
         *	//DEPRECATED RETURN //@returns {Object} {<br/>
         *		rising: {Array[]} rising psar of the given input (in green). Format - (n-period+1 x 2 ) Array, <br/>
         *		falling: {Array[]} falling psar of the given input (in red). Format - (n-period+1 x 2 ) Array, <br/>
         *	}
         *
         */
        psar: function(data, param, colourArray) {
            try {
                param = param || {};
                colourArray = colourArray || ['#00ff00', '#ff0000'];
                var chkHist = this.isIntraWeekData(data[0]);
                if (chkHist) {
                    var data = this.intraOHLC(data);
                }
                var len = data.length;
                //var afStep 	= 0.2,
                //	afMax	= 1,
                var afStep = param.afStep || 0.02,
                    afMax = param.afMax || 0.2,

                    //psarRise =[],
                    //psarFall = [],
                    //psar = psarRise,
                    psarBoth = [],
                    psar = psarBoth,

                    colour,
                    risingColour = colourArray[0],
                    fallingColour = colourArray[1],
                    psar = [],
                    newLow,
                    newHigh,
                    prevLow = data[0].low,
                    prevHigh = data[0].high,
                    isLongPosition = 1,
                    newTrend = 1,
                    ep,
                    prevSAR,
                    SAR,
                    prevAF,
                    max = Math.max,
                    min = Math.min;

                function risingTrend() {
                    if (!newTrend) {
                        SAR = prevSAR + prevAF * (ep - prevSAR);

                        if (newHigh > ep) {
                            ep = newHigh;
                            prevAF = min(prevAF + afStep, afMax);
                        }

                        if (prevSAR > min(newLow, prevLow)) {
                            // ignore this calculation
                            newTrend = 1;
                            isLongPosition = 0;

                            //	psar = psarFall;
                            psar = psarBoth;

                            colour = risingColour;
                            SAR = null;

                            //execute falling trend
                            fallingTrend();
                        }

                    } else {
                        prevSAR = newLow;
                        prevAF = afStep;
                        ep = newHigh;

                        //reset newTrend
                        newTrend = 0;
                    }
                };

                function fallingTrend() {
                    if (!newTrend) {
                        SAR = prevSAR + prevAF * (ep - prevSAR);

                        if (newLow < ep) {
                            ep = newLow;
                            prevAF = min(prevAF + afStep, afMax);
                        }

                        if (prevSAR < max(prevHigh, newHigh)) {
                            // ignore this calculation
                            // call risingTrend()
                            newTrend = 1;
                            isLongPosition = 1;

                            //	psar = psarRise;
                            psar = psarBoth;

                            colour = fallingColour,
                                SAR = null;

                            risingTrend();
                        }

                    } else {
                        prevSAR = newHigh;
                        prevAF = afStep;
                        ep = newLow;

                        //reset newTrend
                        newTrend = 0;
                    }
                };

                for (var i = 0; i < len; i++) {
                    newHigh = data[i].high;
                    newLow = data[i].low;

                    if (isLongPosition) {
                        // Rising Trend
                        //	colour = '#00ff00';
                        risingTrend();
                    } else {
                        // Falling Trend
                        //	colour = '#ff0000';
                        fallingTrend();
                    }

                    //if(chkHist && i % 2 == 0){
                    //	psar.push({x: data[i].date, y: prevSAR, color: colour});	
                    //}
                    //lesser points of psar for better analysis for 5YRS & Max - SK
                    //psar.push({x: data[i].date, y: prevSAR, color: colour});
                    //}
                    //else if (len < 1000){
                    //else if (!chkHist){
                    psar.push({
                        x: data[i].date,
                        y: prevSAR,
                        color: colour
                    });
                    //}
                    prevSAR = (SAR) ? SAR : prevSAR;
                    prevLow = newLow;
                    prevHigh = newHigh;
                    //}
                }
                return psar;
                /*return {
						'rising'	: 	psarRise,
						'falling'	: 	psarFall
					};*/
            } catch (err) {
                throw err;
            }
        },

        //indicators
        //DO NOT PAD with null values
        /**
         *	Accumulation / Distribution
         *
         *	Money Flow Multiplier = [(Close - low) - (High - Close) ] / (High - Low)
         *		*if (High -Low === 0) Money Flow Multiplier = 0
         *
         *	Money Flow Volume = Money Flow Multiplier x Volume for the Period
         *
         *	AD = Prev AD + Current Money Flow Volume
         *
         *	@method accDist
         *	@param {Object[]} data input data in JSON format
         *	@returns {Array[]} accumulation distribution of the given input. Format - (n x 2 ) Array
         */
        accDist: function(data) {
            var accDistIndex = [];
            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var len = data.length;
            for (var i = 0; i < len; i++) {
                accDistIndex[i] = [];
                accDistIndex[i][0] = data[i].date;
                var currData = data[i],
                    open = currData.open,
                    high = currData.high,
                    low = currData.low,
                    close = currData.close,
                    volume = currData.volume;

                var num = (close - low) - (high - close),
                    den = high - low,
                    moneyFlow = (!den) ? 0 : num / den,
                    moneyFlowVolume = moneyFlow * volume;
                accDistIndex[i][1] = (i > 0) ? (accDistIndex[i - 1][1] + moneyFlowVolume) : moneyFlowVolume;
            }
            return accDistIndex;
        },

        /** 
         *	Average Directional Index Formula:
         *	1. Calculate True Range:
         *		Max ( Current_High - Current_Low, |Current_High - Prev_Close| , |Current_Low - Prev_Close|)
         *	2. Calulate +DM, -DM:
         *		if  Current_high - Prev_high > Prev_low - Current_Low
         *			+DM = Current_high - Prev_high (min = 0) ; -DM = 0
         *		else
         *			-DM = Prev_low - Current_Low (min = 0); +DM = 0
         *	3.	Smooth TR, +DM & -DM using Wilder's smoothing techniques
         *		 First TR14 = Sum of first 14 periods of TR/ +DM/-DM
         *		 Next = Prior TR14 - (Prior TR14/14) + Current TR14
         *	4.	+DI14 = +DM14 * 100/ TR14 (green line)
         *		-DI14 = -DM14 * 100/ TR14 (red line)
         *	5. 	Directional Movement Index (DX) = | +DI14 - -DI14 | / +DI14 + -DI14
         *	6. 	ADX = Smoothed DX
         * 		 First ADX = 14 day average of DX
         * 		 Next = ( (PriorADX * 13) + CurrentDX ) / 14
         *
         *	@method adx
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=14] size of the window /period <br/>
         *	}
         *	@returns {Object} {<br/>
         *		adx: {Array[]} average directional index of the given input. Format - (n-period+1 x 2 ) Array, <br/>
         *		-DI: {Array[]} Negative Directional index of input. Format - (n-period+1 x 2) Array <br/>
         *		+DI: {Array[]} Positive Directional index of input. Format - (n-period+1 x 2) Array <br/>
         *	}
         */
        adx: function(data, param) {
            var period = param.window || 14,
                tr = [],
                smoothTR = [],
                plusDM = [],
                smoothPDM = [],
                minusDM = [],
                smoothMDM = [],
                plusDI = [],
                minusDI = [],
                dx = [],
                adx = [],
                prevADX,
                chkHist = this.isIntraWeekData(data[0]);
            if (chkHist)
                var data = this.intraOHLC(data);
            var len = data.length;
            //ignoring the first tr as its not useful for ADX , hence i=1
            for (var i = 0; i < len; i++) {
                if (!chkHist && i == 0)
                    i = i + 1;
                var currHigh = data[i].high,
                    currLow = data[i].low,
                    date = data[i].date,

                    prev_close = (i == 0 && chkHist) ? data[i].prevClose : data[i - 1].close;
                //1. Calculate True Range
                var high_low = currHigh - currLow,
                    high_close = Math.abs(currHigh - prev_close),
                    low_close = Math.abs(currLow - prev_close);

                tr.push(Math.max(high_low, high_close, low_close));
                var diff_high, diff_low;
                if (i != 0) {
                    //2. Calculate +DM, -DM
                    diff_high = currHigh - data[i - 1].high;
                    diff_low = data[i - 1].low - currLow;
                }

                if (diff_high > diff_low) {
                    plusDM.push((diff_high > 0) ? diff_high : 0);
                    minusDM.push(0);
                } else {
                    plusDM.push(0);
                    minusDM.push((diff_low > 0) ? diff_low : 0);
                }


                //3. calculate the smoothed TR, +DM, -DM using Wilder's technique 

                var diff = chkHist ? (i - period) + 1 : i - period,
                    currIndex = tr.length - 1; // i-1; 
                if (diff > 0) {
                    var prevTR = smoothTR[diff - 1],
                        prevPDM = smoothPDM[diff - 1],
                        prevMDM = smoothMDM[diff - 1];

                    smoothTR.push(prevTR - (prevTR / period) + tr[currIndex]);
                    smoothPDM.push(prevPDM - (prevPDM / period) + plusDM[currIndex]);
                    smoothMDM.push(prevMDM - (prevMDM / period) + minusDM[currIndex]);

                } else if (!diff) {
                    //First Smoothened TR/ +DM / -DM
                    var sumTR = 0,
                        sumPDM = 0,
                        sumMDM = 0,
                        chki = chkHist ? i + 1 : i;
                    for (var j = diff; j < chki; j++) {
                        sumTR += tr[j];
                        sumPDM += plusDM[j];
                        sumMDM += minusDM[j];
                    }
                    //console.log('j', j);
                    smoothTR.push(sumTR);
                    smoothPDM.push(sumPDM);
                    smoothMDM.push(sumMDM);
                }


                if (diff >= 0) {
                    //4. Calculate +DI, -DI
                    var index = smoothTR.length - 1,
                        cTR = smoothTR[index],
                        pDI = smoothPDM[index] * 100 / cTR,
                        mDI = smoothMDM[index] * 100 / cTR;
                    plusDI.push([date, pDI]);
                    minusDI.push([date, mDI]);

                    //5. Calculate DX
                    var currDX = Math.abs(pDI - mDI) * 100 / (pDI + mDI);
                    dx.push(currDX);

                    //6. Smooth DX to get ADX
                    var adxDiff = diff + 1 - period;
                    if (adxDiff >= 0) {
                        if (!adxDiff) { // for the first value
                            var dxSum = 0;
                            for (var k = adxDiff; k <= diff; k++) {
                                dxSum += dx[k];
                            }
                            //console.log('k',k)
                            ans = dxSum / period;
                        } else {
                            ans = (prevADX * (period - 1) + currDX) / period;
                        }

                        adx.push([date, ans]);
                        prevADX = ans;
                    }
                }
            }
            return {
                'adx': adx,
                '-DI': minusDI,
                '+DI': plusDI
            };
        },

        /** Average True Range
         *	Formula :
         *	1. Calculte current True Range:
         *		Max ( Current_High - Current_Low, |Current_High - Prev_Close| , |Current_Low - Prev_Close|)
         *
         *	2. Average True Range
         *			[ (Prior_ATR * 13) + current_TR ] / 14
         *		- For i = 14, ATR = SUM_TRs_for_i_days/ i
         *
         *	@method atr
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=14] size of the window/period <br/>
         *	}
         *	@returns {Array[]} average true range of the given input. Format - (n + 1 - period x 2 ) Array
         *
         */
        atr: function(data, param) {
            var period = param.window || 14,
                tr = [],
                atr = [];

            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var len = data.length;
            for (var i = 0; i < len; i++) {
                var high_low = data[i].high - data[i].low,
                    current_tr,
                    sum = 0,
                    ans;

                if (i > 0) {
                    var high_close = Math.abs(data[i].high - data[i - 1].close),
                        low_close = Math.abs(data[i].low - data[i - 1].close);

                    current_tr = Math.max(high_low, high_close, low_close);
                } else {
                    current_tr = high_low;
                }

                tr[i] = current_tr;

                var diff = i + 1 - period;
                if (diff > 0) {
                    var newValue = ((atr[diff - 1][1] * (period - 1)) + current_tr) / period;
                    ans = newValue;
                } else if (!diff) { //for i = period
                    for (var j = diff; j <= i; j++) {
                        sum += tr[j];
                    }
                    ans = sum / 14;
                }
                atr[diff] = [data[i].date, ans];
            }
            return atr;
        },

        /**
         *	Commodity Channel Index Formula:
         *
         *	CCI = (Typical Price  -  20-period SMA of TP) / (.015 x Mean Deviation)
         *
         *	Typical Price (TP) = (High + Low + Close)/3
         *	Constant = .015
         *
         *	@method cci
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param {<br/>
         *		window: {Number} window size of window <br/>
         *	}
         *	@returns {Array[]} CCI of the given input. Format - (n+1 -period x 2 ) Array
         */
        cci: function(data, param) {

            try {

                var period = param.window || 20;
                var cci = [],
                    CONSTANT = 0.015,
                    typicalPrice = this.typicalPrice(data),
                    tpsma20 = this.sma(typicalPrice, param),
                    meanDev = this.meanDeviation(typicalPrice, param),
                    length = typicalPrice.length;

                for (var i = 0; i < length; i++) {
                    var ans,
                        diff = i - period + 1;
                    if (diff >= 0) {
                        ans = (typicalPrice[i][1] - tpsma20[diff][1]) / (CONSTANT * meanDev[diff][1]);

                        cci[diff] = [typicalPrice[i][0], ans];
                    }
                }

                return cci;
            } catch (e) {
                console.log(i, e)
            }
        },

        /**
         *	Chaikin Money Flow
         *	Formula:
         *	Money Flow Multiplier = [(Close  -  Low) - (High - Close)] /(High - Low)
         *	Money Flow Volume = Money Flow Multiplier x Volume for the Period
         *	20-period CMF = 20-period Sum of Money Flow Volume / 20 period Sum of Volume
         *
         *
         *	@method cmf
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param {<br/>
         *		window: {Number} window size of window <br/>
         *	}
         *	@returns {Array[]} CMF of the given input. Format - (n+1 -period x 2 ) Array
         */
        cmf: function(data, param) {
            var period = param.window || 20,
                vol = [],
                mfv = [],
                mfVol = [],
                cmf = [];
            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var length = data.length;
            for (var i = 0; i < length; i++) {
                var currData = data[i],
                    high = currData.high,
                    low = currData.low,
                    close = currData.close,
                    volume = currData.volume,
                    den = high - low;


                var multiplier = (den) ? ((close - low) - (high - close)) / den : 0;
                /*if(_.isNaN(multiplier)){
						throw new Error('NAN: ', new Date(currData.date).toDateString())
					}*/

                vol[i] = volume;
                mfv[i] = volume * multiplier;

                var mfVol20 = 0,
                    vol20 = 0,
                    diff = i + 1 - period;
                if (diff >= 0) {
                    for (var j = diff; j <= i; j++) {
                        mfVol20 += mfv[j];
                        vol20 += vol[j];
                    }
                    ans = mfVol20 / vol20;
                    cmf[diff] = [currData.date, ans];
                }
            }
            return cmf;
        },

        /** 
         *	Slow Stochastoic Oscillator
         *
         *	Formula:
         *	fStoch = (Current Close - Lowest Low)/(Highest High - Lowest Low) * 100
         *	%K = 3-day SMA of fStoch
         *	%D = 3-day SMA of %K
         *
         *	@method sStoch
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=3] size of the window/period <br/>
         *	}
         *	@returns {Array[]} slow stochastic of the given input. Format - (n + 1 - period x 2 ) Array
         *
         */
        sStoch: function(data, param) {
            var fStoch = this.fStoch(data, {
                window: 14
            });
            var sStoch = this.sma(fStoch, param);

            return sStoch;
        },

        /** 
         *	Fast Stochastoic Oscillator
         *
         *	Formula:
         *	%K = (Current Close - Lowest Low)/(Highest High - Lowest Low) * 100
         *	%D = 3-day SMA of %K
         *
         *	@method fStoch
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=14] size of the window/period <br/>
         *	}
         *	@returns {Array[]} fast stochastic of the given input. Format - (n + 1 - period x 2 ) Array
         *
         */
        fStoch: function(data, param) {
            var period = param.window || 14,
                fStoch = [];

            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var length = data.length;

            for (var i = 0; i < length; i++) {
                var currData = data[i],
                    high = currData.high,
                    low = currData.low,
                    close = currData.close,
                    date = currData.date,
                    ans;

                //Calculate highMax & lowMin within the period
                var diff = i - period + 1;
                if (diff >= 0) {
                    var range = data.slice(diff, i + 1);
                    var lowMin = _.min(range, function(each) {
                        return each.low
                    }).low;
                    var highMax = _.max(range, function(each) {
                        return each.high
                    }).high;

                    var den = (highMax - lowMin);
                    ans = (den) ? (close - lowMin) / den * 100 : 0;
                    fStoch[diff] = [date, ans];
                }
            }
            return fStoch;
        },

        /**	Formula: 
         *
         *	MACD Line: (12-day EMA - 26-day EMA)
         *	Signal Line: 9-day EMA of MACD Line
         *	MACD Histogram: MACD Line - Signal Line
         *
         *	@method macd
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window1: {Number} [window=12] size of the window/period for EMA12, <br/>
         *		window2: {Number} [window=26] size of the window/period for EMA26, <br/>
         *	}
         *	@returns {Array[]} MACD of the given input. Format - (n + 1 - period x 2 ) Array
         *	@todo We can merge macdHistogram in this one itself. Do check the config. NOT NECESSARY
         */
        macd: function(data, param, data20) {

            if (data20) {
                data = data20.concat(data);
            }



            var ema26 = this.ema(data, {
                    window: param.window2
                }),
                ema12 = this.ema(data, {
                    window: param.window1
                }),
                diff = Math.abs(param.window2 - param.window1),
                length = ema26.length,
                macd = [];

            //var count = 14; // 26 - 12
            for (var i = 0; i < length; i++) {
                macd[i] = [ema26[i][0], ema12[i + diff][1] - ema26[i][1]];
            }

            return macd;
        },

        /** Formula:
         *	MACD Histogram: MACD Line - Signal Line
         *
         *	@method macdHistogram
         *	@param {Object} macd MACD calculated in the above formula
         *	@returns {Array[]}
         *	@todo NOT NECESSARY. merge with macd. Separated so that we can have configuarble chartOpt for a signal line (it is displayed as a column chart)
         */
        macdHistogram: function(macd) {

            var period = 9;
            var ema9 = this.ema(macd, {
                window: period
            });
            var length = macd.length,
                hist = [];

            for (var i = period - 1; i < length; i++) {
                var diff = i - period + 1;
                var ans = macd[i][1] - ema9[diff][1];
                hist[diff] = [ema9[diff][0], ans];
                //console.log(hist);
                //console.log(diff);
            }
            return hist;
        },

        /** Momentum
         *
         *	Formula: Close[Current] - Close[window_days]
         *
         *	@method momentum
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=10] size of the window/period <br/>
         *	}
         *	@returns {Array[]} momentum of the given input. Format - (n + 1 - period x 2 ) Array
         *
         */
        momentum: function(data, param) {

            var period = param.window || 10,
                len = data.length,
                momentum = [];


            for (var i = 0; i < len; i++) {
                var diff = i - period + 1;
                if (diff >= 0) {
                    if (this.isIntraWeekData(data[0])) {
                        momentum[diff] = [data[i].date, data[i].y - data[diff].y];
                    } else {

                        momentum[diff] = [data[i].date, data[i].close - data[diff].close];
                    }
                }
            }

            return momentum;
        },


        /**	Money Flow Index
         *	Formula:
         *
         *	Typical Price = (High + Low + Close)/3
         *	Raw Money Flow = Typical Price x Volume
         *	Money Flow Ratio = (14-period Positive Money Flow)/(14-period Negative Money Flow)
         *	Money Flow Index = 100 - 100/(1 + Money Flow Ratio)
         *
         *	@method mfi
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param - { <br/>
         *		window: {Number} [window=14] size of the window/period <br/>
         *	}
         *	@returns {Array[]} mfi of the given input. Format - (n - period  x 2 ) Array
         *
         */
        mfi: function(data, param) {

            var period = param.window || 14,
                typicalPrice,
                oldTypicalPrice,
                moneyFlow = [],
                posMoneyFlow = [],
                negMoneyFlow = [],
                posMoneyFlow14 = [],
                negMoneyFlow14 = [],
                mfRatio = [],
                mfi = [];

            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var length = data.length;
            for (var i = 0; i < length; i++) {
                var currData = data[i],
                    date = currData.date,
                    high = currData.high,
                    low = currData.low,
                    close = currData.close,
                    volume = currData.volume;

                // Calculating typical price					
                typicalPrice = (high + low + close) / 3;

                if (i) {
                    //calculating raw money flow
                    var rawMF = typicalPrice * volume;
                    moneyFlow[i] = rawMF;

                    //calculating 1 period +/- money flow
                    if (typicalPrice > oldTypicalPrice) {
                        posMoneyFlow.push(rawMF);
                        negMoneyFlow.push(0);
                    } else if (typicalPrice === oldTypicalPrice) {
                        posMoneyFlow.push(0);
                        negMoneyFlow.push(0);
                    } else {
                        posMoneyFlow.push(0);
                        negMoneyFlow.push(rawMF);
                    }

                    var diff = i - period; //not adding +1 here as we need to skip the 1st entry
                    if (diff >= 0) {
                        if (diff > 0) {
                            //calculating 14-period +/- money flow
                            // Using previously calculated +/-MF values instead of looping everytime
                            // all indexes are 1 less as we have skipped the first one
                            posMoneyFlow14[diff] = posMoneyFlow14[diff - 1] - posMoneyFlow[diff - 1] + posMoneyFlow[i - 1];
                            negMoneyFlow14[diff] = negMoneyFlow14[diff - 1] - negMoneyFlow[diff - 1] + negMoneyFlow[i - 1];
                        } else if (!diff) {
                            // Calculate the 1st 14 period +/- MF
                            var posSum = 0,
                                negSum = 0
                            for (var j = 0; j < period; j++) {
                                posSum += posMoneyFlow[j];
                                negSum += negMoneyFlow[j];
                            }
                            posMoneyFlow14[diff] = posSum;
                            negMoneyFlow14[diff] = negSum;
                        }

                        mfRatio[diff] = (posMoneyFlow14[diff]) ? (posMoneyFlow14[diff] / negMoneyFlow14[diff]) : 0;
                        mfi[diff] = [date, 100 - 100 / (1 + mfRatio[diff])];
                    }
                }
                //
                oldTypicalPrice = typicalPrice;
            }
            return mfi;
        },

        /**	On Balance Vol
         *	Formula:
         *	If the closing price is above the prior close price then:
         *	Current OBV = Previous OBV + Current Volume
         *
         *	If the closing price is below the prior close price then:
         *	Current OBV = Previous OBV  -  Current Volume
         *
         *	If the closing prices equals the prior close price then:
         *	Current OBV = Previous OBV (no change)
         *
         *	OBV[0] = 0
         *
         *	@method obv
         *	@param {Object[]} data input data in JSON format
         *	@returns {Array[]} On Balance Vol of the given input. Format - (n x 2 ) Array
         *
         */
        obv: function(data) {
            var obv = [];
            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var len = data.length,
                ans;
            obv[0] = [data[0].date, 0];
            for (var i = 1; i < len; i++) {
                if (data[i].close > data[i - 1].close) {
                    ans = obv[i - 1][1] + data[i].volume;
                } else if (data[i].close <= data[i - 1].close) {
                    ans = obv[i - 1][1] - data[i].volume;
                } else {
                    ans = obv[i - 1][1]
                }
                obv[i] = [data[i].date, ans];
            }
            return obv;
        },

        /** Rate Of Change
         *
         *	Formula: ( Current_close - window_days_ago's_close) * 100 / window_days_ago's_close ;
         *	in percentage
         *	Note: Not reusing momentum formula as it would double the complexity
         *	@method roc
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param {<br/>
         *		window: {Number} [window=10] size of window <br/>
         *	}
         *	@returns {Array[]} Rate of change of the given input. Format - (n+1-period x 2 ) Array
         *
         */
        roc: function(data, param) {


            var period = param.window || 10,
                len = data.length,
                roc = [];

            for (var i = 0; i < len; i++) {
                var diff = i + 1 - period;
                if (data[diff]) {
                    var val_window = data[diff].close || data[diff].y,
                        ans = ((data[i].close - val_window) * 100 / val_window) || ((data[i].y - val_window) * 100 / val_window);

                    roc.push([data[i].date, ans]);
                }
            }

            return roc;
        },

        /** Relative Strength Index
         *	Formula:
         *				  100
         *	RSI = 100 - --------
         *				 1 + RS
         *
         *	RS = Average Gain / Average Loss
         *	First Average Gain/Loss = Sum of gains/loss over the past 14 periods / 14
         *	Average Gain/Loss =  [(previous Average Gain/Loss) x 13 + current Gain/Loss] / 14
         *
         *	period = 14
         *	@method rsi
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param {<br/>
         *		window: {Number} [window=14] size of window <br/>
         *	}
         *	@returns {Array[]} Relative Strength Index of the given input. Format - (n-period x 2 ) Array
         */
        rsi: function(data, param) {
            var period = param.window || 14;
            var length = data.length,
                prevClose = data[0].close || data[0].y,
                currClose,
                currDate,
                gain = [],
                loss = [],
                avgGain = [],
                avgLoss = [],
                rs = [],
                rsi = [];

            for (var i = 1; i < length; i++) {
                currClose = data[i].close || data[i].y;
                var closingDiff = currClose - prevClose;

                if (closingDiff > 0) {
                    gain.push(closingDiff);
                    loss.push(0);
                } else if (!closingDiff) {
                    gain.push(0);
                    loss.push(0);
                } else {
                    gain.push(0);
                    loss.push(-closingDiff);
                }

                var diff = i - period; // not adding 1 here as we start the loop itself from 1
                if (diff >= 0) {
                    if (diff > 0) {
                        //calculating 14-period Avg Gain/Loss
                        // Using previously calculated Avg Gain/Loss values instead of looping everytime
                        avgGain[diff] = (avgGain[diff - 1] * 13 + gain[i - 1]) / 14;
                        avgLoss[diff] = (avgLoss[diff - 1] * 13 + loss[i - 1]) / 14;
                    } else if (!diff) {
                        // Calculate the 1st 14 period +/- MF
                        var gainSum = 0,
                            lossSum = 0;
                        for (var j = 0; j < period; j++) {
                            gainSum += gain[j];
                            lossSum += loss[j];
                        }
                        avgGain[diff] = gainSum / 14;
                        avgLoss[diff] = lossSum / 14;
                    }

                    rs[diff] = (avgGain[diff]) ? (avgGain[diff] / avgLoss[diff]) : 0;
                    rsi[diff] = [data[i].date, 100 - 100 / (1 + rs[diff])];
                }

                prevClose = currClose;
            }
            return rsi;
        },

        threshold70: function(rsi) {

            var period = 9;
            //var ema9 = this.ema(macd, {window: period});
            var length = rsi.length + 8,
                hist = [];

            for (var i = period - 1; i < length; i++) {
                var diff = i - period + 1;
                //var ans = macd[i][1]- ema9[diff][1];
                hist[diff] = [rsi[diff][0], 70];
            }

            return hist;
        },
        threshold30: function(rsi) {

            var period = 9;
            //var ema9 = this.ema(macd, {window: period});
            var length = rsi.length + 8,
                hist = [];

            for (var i = period - 1; i < length; i++) {
                var diff = i - period + 1;
                //var ans = macd[i][1]- ema9[diff][1];
                hist[diff] = [rsi[diff][0], 30];
                //console.log(hist);
                //console.log(diff);
            }

            return hist;
        },

        /**	Relative Vigor Index
         *	Formula:
         *	    Num = ( (close1 - open1) + 2*(close2-open2)+ 2*(close3 - open3) + (close4 - open4) ) /6,
         *		Den = ( (high1  - low1)  + 2*(high2 -low2) + 2*(high3  - low3)  + (high4  - low4)  ) /6;
         *		RVI = Num /Den;
         *
         *	Simple Formula: RVI = (Close - Open) / (High - Low)
         *		ANS = SMA(10) of RVI
         *
         *	@method rvi
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param {<br/>
         *		window: {Number} [window=10] size of window <br/>
         *	}
         *	@returns {Array[]} Relative Vigor Index of the given input. Format - (n x 2 ) Array
         *	@todo VERIFY THE FORMULA - simple or better approximation
         *	@todo PLEASE VERIFY & MODIFY IF REQUIRED: should we use future 3 values to compute the RVI for today (last few values won't come)
         *	or should we use the past few values for c2, c3, c4 (first few values won't come)
         */
        rvi: function(data, param) {
            /* //Initial implementation:
				// With this implementation we are using the future 3 values to compute the RVI for today. Hence the last few values do not come
				var period = param.window || 10,
					length = data.length,
					nLimit = length - period - 4,
					rvi = [];
					
				for(var i=0; i < nLimit; i++){
					var num = 0,
						den = 0;
					
					for(var j=i; j<i+period; j++){
						var c1 = data[j].close,
							c2 = data[j+1].close,
							c3 = data[j+2].close,
							c4 = data[j+3].close,
							o1 = data[j].open,
							o2 = data[j+1].open,
							o3 = data[j+2].open,
							o4 = data[j+3].open,
							h1 = data[j].high,
							h2 = data[j+1].high,
							h3 = data[j+2].high,
							h4 = data[j+3].high,
							l1 = data[j].low,
							l2 = data[j+1].low,
							l3 = data[j+2].low,
							l4 = data[j+3].low,
							dValUp = ((c1 - o1)+ 2*(c2-o2)+ 2*(c3 - o3)+ (c4 - o4))/6,
							dValDn = ((h1 - l1)+ 2*(h2-l2)+ 2*(h3 - l3)+ (h4 - l4))/6;
							
						num += dValUp;
						den += dValDn;
					};
					
					var ans = (!den) ? 0 : (num/den);
					rvi.push([data[i].date, ans]);
				}
				
				return rvi;
				*/
            //simple implementation
            var period = param.window || 10,
                rvi = [];
            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var length = data.length;
            for (var i = 0; i < length; i++) {
                var currData = data[i];
                var num = currData.close - currData.open,
                    den = currData.high - currData.low;
                var ans = (den) ? num / den : 0;

                rvi[i] = [currData.date, ans];
            }
            return this.sma(rvi, param);
        },

        /**
         *	RVISignal = (RVI[0] + 2*RVI[1] + 2*RVI[2] + RVI[3])/6;
         *
         *	@method rviSignal
         *	@param {Array[]} rvi
         *	@returns {Array[]} rviSignal
         *	@todo If we switch to the better approximation formula then this is the signal function that should be used. Modify the entry in the config file
         */
        rviSignal: function(rvi) {
            var limit = rvi.length,
                rviSignal = [];

            for (var i = 3; i < limit; i++) {
                rviSignal[i - 3] = [rvi[i][0], (rvi[i][1] + 2 * rvi[i - 1][1] + 2 * rvi[i - 2][1] + rvi[i - 3][1]) / 6]
            }

            return rviSignal;
        },

        /**
         *	Volume
         *	Formula: grab the volume from the input for each entry
         *
         *	@method volume
         *	@param {Object[]} data input data in JSON format
         *	@returns {Array[]} volume of the given input. Format - (n x 2 ) Array
         */
        volume: function(data) {
            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var len = data.length,
                volume = [];
            for (var i = 0; i < len; i++) {
                volume[i] = [data[i].date, data[i].volume];
            }
            return volume;
        },

        /** Formula:
         *
         *	Single-Smoothed EMA = 15-period EMA of the closing price
         *	Double-Smoothed EMA = 15-period EMA of Single-Smoothed EMA
         *	Triple-Smoothed EMA = 15-period EMA of Double-Smoothed EMA
         *	TRIX = 1-period percent change in Triple-Smoothed EMA
         *
         *	@method trix
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param {<br/>
         *		window: {Number} [window=15] size of window <br/>
         *	}
         *	@returns {Array[]} typical price of the given input. Format - (n- 3*period x 2 ) Array
         */
        trix: function(data, param) {

            var period = param.window || 15;
            var ema1 = this.ema(data, param),
                ema2 = this.ema(ema1, param),
                ema3 = this.ema(ema2, param),
                length = ema3.length,
                trix = [];

            for (var i = 1; i < length; i++) {
                var prev = ema3[i - 1][1],
                    percent = ((ema3[i][1] - prev) / prev) * 100;
                trix.push([ema3[i][0], percent]);
            }

            return trix;
        },

        /** William's %R Formula:
         *	%R = (Highest High - Close)/(Highest High - Lowest Low) * -100
         *
         *	Highest High & Lowest Low are within a look-back period
         *	period = 14;
         *
         *	@method typicalPrice
         *	@param {Object[]} data input data in JSON format
         *	@param {Object} param {<br/>
         *		window: {Number} [window=14] size of window <br/>
         *	}
         *	@returns {Array[]} William's %R of the given input. Format - (n+1 -period x 2 ) Array
         */
        wpr: function(data, param) {

            var period = param.window || 14,
                wpr = [];

            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var length = data.length;
            for (var i = 0; i < length; i++) {
                var currData = data[i],
                    high = currData.high,
                    low = currData.low,
                    close = currData.close,
                    date = currData.date;

                //Calculate highMax & lowMin within the period
                var diff = i - period + 1;
                if (diff >= 0) { // if we have at least period entries of data 

                    var range = data.slice(diff, i + 1);
                    var lowMin = _.min(range, function(each) {
                        return each.low
                    }).low;
                    var highMax = _.max(range, function(each) {
                        return each.high
                    }).high;

                    var den = (highMax - lowMin);
                    ans = (den) ? (highMax - close) / den * -100 : 0;

                    wpr[diff] = [date, ans];
                }
            }
            return wpr;
        },

        /**	Typical Price 
         *
         *	Formula: ( High + Low + Close ) / 3
         *
         *	@method typicalPrice
         *	@param {Object[]} data input data in JSON format
         *	@returns {Array[]} typical price of the given input. Format - (n x 2 ) Array
         *
         */
        typicalPrice: function(data) {
            if (this.isIntraWeekData(data[0]))
                var data = this.intraOHLC(data);
            var len = data.length,
                typicalPrice = [];
            for (var i = 0; i < len; i++) {
                typicalPrice[i] = [data[i].date, (data[i].high + data[i].low + data[i].close) / 3];
            }
            return typicalPrice;
        },

        /**	
         *	Mean Deviation Formula:
         *	1. typical Price[i] - typicalPriceAvgOver20Days
         *	2. take the absolute values of these numbers
         *	3. sum the absolute values over the period
         *	4. divide by the total number of periods (20)
         *
         *	@method meanDeviation
         *	@param {Object[]} data input data in JSON format - SHOULD be an array of typical price
         *	@param {Object} param {<br/>
         *		window: {Number} [window=20] size of window <br/>
         *	}
         *	@returns {Array[]} Mean Deviation of the given input. Format - (n+1 -period x 2 ) Array
         *	@todo if you want to have this as a separate overlay/indicator then modify this method to call typical price within it. Also make usre CCI is not broken
         */
        meanDeviation: function(data, param) {

            var period = param.window || 20;
            var meanDev = [],
                abs = Math.abs,
                length = data.length;

            for (var i = 0; i < length; i++) {
                var ans;
                var diff = i - period + 1;
                if (diff >= 0) {
                    var sum = 0,
                        tpAvg = 0,
                        num = 0;

                    // 1. Calculate Arithmetic Mean
                    for (var j = diff; j <= i; j++) {
                        sum += data[j][1];
                    }
                    tpAvg = sum / period;


                    for (var j = diff; j <= i; j++) {
                        var subtract = data[j][1] - tpAvg;
                        num += abs(subtract);
                    }

                    ans = num / period;
                    meanDev[diff] = [data[i].date || data[i][0], ans];
                }

            }
            return meanDev;
        },
        intraOHLC: function(data) {
            var len = data.length,
                mainohlc = [],
                main_bucket = [],
                vol_pos_bucket = [],
                prevI = 0,
                volVal = 0,
                CumVol = 0,
                Chk_volume = 0,
                volumevalue = 0;
            var dat = data;
            for (var i = 0; i < len; i++) {
                if (dat[i]['volume'] >= 0) {
                    prevI = dat.indexOf(i);
                    volVal = dat[i]['volume'];
                    CumVol = CumVol + volVal;
                    vol_pos_bucket.push({
                        'volpos': i,
                        'volVal': volVal,
                        'CumVol': CumVol
                    });
                }
            }
            for (var i = 0; i < vol_pos_bucket.length; i++) {
                Chk_volume = 0;
                pvol_pos = (i > 0) ? vol_pos_bucket[i - 1]['volpos'] : 0;
                pvol_pos_idx = (i > 0) ? (pvol_pos + 1) : 0;
                pCumvol = (i > 0) ? vol_pos_bucket[i - 1]['CumVol'] : 0;
                vol_pos_bucket[i]['PosDiff'] = vol_pos_bucket[i]['volpos'] - (pvol_pos);
                vol_pos_bucket[i]['CumVolDiff'] = vol_pos_bucket[i]['CumVol'] - (pCumvol);
                for (var m = 0; m < vol_pos_bucket[i]['PosDiff']; m++) {
                    volumevalue = Math.round(vol_pos_bucket[i]['CumVolDiff'] / vol_pos_bucket[i]['PosDiff']);
                    dat[pvol_pos_idx + m]['volume'] = volumevalue;
                    Chk_volume = Chk_volume + volumevalue;
                }
                if (Chk_volume != vol_pos_bucket[i]['CumVolDiff']) {
                    diffLeft = vol_pos_bucket[i]['CumVolDiff'] - Chk_volume;
                    for (var m = 0; m < vol_pos_bucket[i]['PosDiff']; m++) {
                        if (diffLeft > 0) {
                            dat[pvol_pos_idx + m]['volume'] = dat[pvol_pos_idx + m]['volume'] + 1;
                            diffLeft--;
                            if (diffLeft == 0)
                                break;
                        } else if (diffLeft < 0) {
                            dat[pvol_pos_idx + m]['volume'] = dat[pvol_pos_idx + m]['volume'] - 1;
                            diffLeft++;
                            if (diffLeft == 0)
                                break;
                        }
                    }
                }
            }
            // }
            for (var j = 0; j < len - 4; j++) {
                main_bucket.push([dat[j], dat[j + 1], dat[j + 2], dat[j + 3], dat[j + 4]]);
            }
            for (var p = 0; p < main_bucket.length; p++) {
                var hilowChk = [main_bucket[p][0].y, main_bucket[p][1].y, main_bucket[p][2].y, main_bucket[p][3].y, main_bucket[p][4].y]
                var open = main_bucket[p][0].y,
                    high = Math.max.apply(Math, hilowChk),
                    low = Math.min.apply(Math, hilowChk),
                    close = main_bucket[p][4].y,
                    // volume		= (main_bucket[p][0].volume || 0 + main_bucket[p][1].volume || 0  + main_bucket[p][2].volume || 0 + main_bucket[p][3].volume || 0 + main_bucket[p][4].volume || 0 )/5,
                    volume = main_bucket[p][4].volume || 0,
                    bdate = main_bucket[p][4].date;
                if (p == 0) {
                    mainohlc[p] = {
                        'open': open,
                        'high': high,
                        'low': low,
                        'close': close,
                        'volume': volume,
                        'date': bdate,
                        'prevClose': main_bucket[p][3].y
                    };
                } else
                    mainohlc[p] = {
                        'open': open,
                        'high': high,
                        'low': low,
                        'close': close,
                        'volume': volume,
                        'date': bdate
                    };
            }
            return mainohlc;
        },
        isIntraWeekData: function(firstValue) {
            if (Object.keys(firstValue).length < 4)
                return true
            else
                return false
        }
    };
});
