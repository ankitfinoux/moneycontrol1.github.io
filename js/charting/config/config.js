/**
 *  js/config/config.js
 */

define(function() {

    function openOHLC(open, high, low, close) {
        var NUMBER = 'number';

        function openFn(arr) {
            return arr.length ? arr[0] : (arr.hasNulls ? null : undefined);
        };

        open = openFn(open);
        high = openFn(high);
        low = openFn(low);
        close = openFn(close);

        if (typeof open === NUMBER || typeof high === NUMBER || typeof low === NUMBER || typeof close === NUMBER) {
            return [open, high, low, close];
        }
        // else, return is undefined
    };

    return {
        chart: {
            /* ---- NOT CONFIGURABLE at Runtime */
            localStorageKey: 'advancedChart',
            toggleDrawKey: 'temp-draw',
            toggleChartTypeKey: 'temp-chartType',
            togglelineTypeKey: 'temp-lineType',


            timeRanges: ['intra', 'week', 'hist'], // possible timeranges
            basic: 'basic',
            //filePriorityOrder: ['hist', 'week', 'intra'], // used when there is error in fetching a file
            intraIndex: 0, // index of intra in the timeRanges key above
            weekIndex: 1,
            histIndex: 2,
            defaultTimeZoneOffset: -330, //for INDIA use new Date().getTimezoneOffset() to get this value
            debounceTime: 100, // in ms; use this key to control the time after which indicators are updated

            /*urlPath           :{
                'intra' : './data/intra/',
                'week'  : './data/week/',
                'hist'  : './data/hist/'
            },
            */
            defaultExchange: 'bse',
            link: { //deprecated
                company: '/company/<%=data.title%>.html',
                buy: '',
                sell: ''
            },

            urlPath: { //For EDELWEISS
                'intra': './../CData/EQU/INT/',
                'week': './../CData/EQU/FOURINT/',
                'hist': './../CData/EQU/HIS/'
            },
            exchangeHolidaysURL: '', //For Moneycontrol

            fileFormat: "<%=code%>_<%=exchange%>.<% if(typeof format !== 'undefined' && format !== ''){%><%=format%><%}else{%>csv<%}%>",
            dataType: 'csv',
            splitSubTitleFor: ['currency', 'commodities', 'derivatives'],
            uniqueComponents: ['crosshairs', 'trendlines', 'retracements'],

            isChartTypeSavable: true, //ankitz: this will enable/disable saving the chartType(candlestick/ohlc/line) in save module
            isLineTypeSavable: true, //ankitz: this will enable/disable saving the lineType(monthly/weekly/daily) in save module

            isChartTypeIntraWeekEnabled: false, //ankitz: this will enable/disable the lineType(monthly/weekly/daily) in 1D/1W module
            isLineTypeIntraWeekEnabled: false, //ankitz: this will enable/disable the chartType(monthly/weekly/daily) in 1D/1W module

            isOverlaysIntraWeekEnabled: false, //ankitz: this will enable/disable Overlays in intra/week mode
            isIndicatorsIntraWeekEnabled: false, //ankitz: this will enable/disable indicators in intra/week mode
            isDrawInstancesIntraWeekEnabled: false, //ankitz: this will enable/disable DrawInstances(trendline/fibonacci/crosshair) in intra/week mode

            isPurgingEnabled: true, //ankitz :purging is made configurable so on series replace we can keep the previouly selected overlays/indicators
            isInstancesPurgeable: false, //ankitz :on purging enabled , decide if Instances(trendline/fibonacci/crosshair) should also be enabled
            // returnToPreviousChartType:true,    //ankitz :on moving out of compare mode return to previous selected chartType or else use default
            // returnToPreviousLineType:true,

            //ANKITZ
            allowTrendlineOnIndicators: true, // Setting this to true will allow trendlines to be drawn on the Indicators

            //only one entry supported for now, can extend for many later
            appendDataFor: 'week',
            //order important: right appended to left
            // this means append intra data to the end of week data & not the other way round 
            appendOrder: ['week', 'intra'],

            spriteURL: './images/charting/sprite.png',

            holidays: [0, 6], // Sunday: 0, Saturday: 6
            intraDayTimings: ['09:00', '16:00'], // in 24 hr format

            firstDate: [2003, 6, 1], //in [YEAR,MONTH,DATE]

            //CONSTANTS
            ONE_WEEK: 604800000,
            ONE_DAY: 86400000,
            ONE_MIN: 60000,
            /* ---- NOT CONFIGURABLE at Runtime */

            timeInterpolation: true,

            //keep volume the last always
            readings: ['volume', 'open', 'high', 'low', 'close'],
            plotOn: 'close',
            appendData: true,

            graphing_library_used: 'highstock', // eg. in future 'd3'

            flagsMenuType: 'events',

            canvasHeight: 347, // in pixel, don't specify px at the end
            notifyDisplayTime: 2000, // in ms
            decimals: 2, // SHOULD be an Integer

            //compare
            maxCompare: 5,
            compareVolume: false, // if false, volume will be hidden
            compareType: 'percent', // percent or value
            stackingType: 'percent', // percent or normal

            //colours
            // seriesColours    : ['#0c80d0', '#ff0072', '#a200ff', '#009cff', '#01aa4c', '#ff7200', '#ed9c00', '#ff0048', '#7200ff'],
            // seriesColours    : ['#0c80d0', '#80b737', '#e25d4c', '#3d63b8', '#00bbb0', '#ff7200', '#ed9c00', '#ff0048', '#7200ff'],//CUSTOM COLORS
            seriesColours: ['#468bc9', '#0d3c55', '#86466b', '#ff650d', '#eb9b25', '#208582', '#865332', '#5b3781', '#39291f', '#7200ff'], //CUSTOM COLORS
            volumeColours: ['#1395ba'],
            indicatorColours: ['#0d66c1', '#db290e', '#168a31'],
            //overlayColours: ['#6b9e13', '#d7bd0d', '#11974a', '#b111d3', '#e80d40', '#7200ff', '#ff7200', '#ed9c00'],
            overlayColours: ['#ff2333', '#03ce03', '#a14bfc', '#d10800', '#006900', '#763faf', '#ff7200', '#ed9c00'],

            maxRetracements: 1,
            maxCrosshairs: 5,
            maxTrendlines: 20,

            // ANKITZ
            yAxisOffset: 50,
            yAxisIndicatorOffset: 50,


            primary_chartName: 'main',

            //operations    : ['add', 'remove', 'change', 'toggle'], 

            //For state storage
            database: 'localStorage',
            databaseURL: '',

            //groupData     : 'true',

            navLayout: 'single', //'single' or 'multiplecolumn',
            navLimit: 10, // effective only with multi-column

            // UI classes & id-suffixes
            classNames: {
                widget: 'widget',
                canvas: 'canvas',

                hide: 'hide',
                disabled: 'disabled',
                pointer: 'pointer',
                noTouch: 'noTouch',

                //nav
                nav: 'menu-wrapper',
                navUl: 'menu',
                navLi: 'entry',
                navLiDiv: 'entryDiv',
                subMenuWrpr: 'submenu-wrapper',
                subMenuCol: 'submenu-column',
                subMenuUl: 'submenu',
                subMenuLi: 'subEntry',
                subMenuDiv: 'subEntryDiv',
                innerSubMenuWrpr: 'innerSubMenuWrpr',
                subMenuSelected: 'selected',
                checkmark: 'checkmark',

                corporateAction: 'corporate-action',
                date: 'date',

                settings: 'settings',
                settingsArrow: 'settings-arrow-up',
                settingsMenuWrpr: 'settings-menu-wrpr',
                settingsMenu: 'settingsMenu',
                settingsUl: 'settingsUl',
                settingsEntry: 'settingsEntry',

                //readings
                readings: 'readings',

                //snapshot
                snapshot: 'snapshot',

                //notifications
                notify: 'notify',
                notifyMsg: 'notify-msg',
                notifyClose: 'notify-close',

                //rangeSelector & calender
                rangeSelector: 'range-selector',
                rangeButtons: 'range-buttons',
                selectedButton: 'button-selected',
                calenderButtons: 'calender-buttons',
                calenderImg: 'calender-image',
                calenderPage: 'calender-page',
                calenderInput: 'calender-input',
                calender: 'calender',

                //indicators
                indicator: 'indicator',
                subCanvas: 'sub-canvas'

            },
            idSuffixes: {
                widget: '-wrapper',
                navLi: '-li',
                subMenuWrpr: '-submenu',
                subMenuLi: '-li',
                readingsBox: '-box',
                calenderWrpr: '-calenderWrpr'
            }
        },
        defaults: {
            // default selection in the menu / whenever user reset's the chart this is the default settings
            chartType: 'line',
            drawType: 'none',
            lineType: 'daily',

            currentRange: 'hist',
            rangeSelected: 4, // count of range button to be pre-selected when in hist mode

            flags: ['bonus', 'dividends', 'rights', 'splits', 'NavR']
        },
        //style fpr crosshair - deprecated
        crosshair_css: {
            name: 'crosshair-x-',
            stroke: 'red',
            'stroke-width': 1,
            zIndex: 0
        },
        //details of fibonacci lines
        fibonacci_intervals: [{
            colour: '#a7a7a7 ', //MONEYCONTROL
            text: '0%',
            value: 0
        }, {
            colour: '#a7a7a7',
            text: '23.6%',
            value: 0.236
        }, {
            colour: '#a7a7a7',
            text: '38.2%',
            value: 0.382
        }, {
            colour: '#a7a7a7 ',
            text: '50%',
            value: 0.5
        }, {
            colour: '#a7a7a7',
            text: '61.8%',
            value: 0.618
        }, {
            colour: '#a7a7a7',
            text: '78.6%',
            value: 0.786
        }, {
            colour: '#a7a7a7',
            text: '100%',
            value: 1
        }, {
            colour: '#a7a7a7',
            text: '161%',
            value: 1.61
        }, {
            colour: '#a7a7a7',
            text: '261%',
            value: 2.61
        }],
        //generic data grouping option. Imported from highcharts. Check their API ref. Currently Data NOT Grouped 
        dataGrouping: {
            approximation: 'open',
            enabled: false, // keep false
            dateTimeLabelFormats: {
                millisecond: ['%a, %d %b, %H:%M:%S.%L', '%a, %d %b, %H:%M:%S.%L', '-%H:%M:%S.%L'],
                second: ['%a, %d %b %Y, %H:%M:%S', '%a, %d %b %Y, %H:%M:%S', '-%H:%M:%S'],
                minute: ['%a, %d %b %Y, %H:%M', '%a, %d %b %Y, %H:%M', '-%H:%M'],
                hour: ['%a, %d %b %Y, %H:%M', '%a, %d %b %Y, %H:%M', '-%H:%M'],
                day: ['%a, %d %b %Y', '%a, %d %b', '-%a, %d %b %Y'],
                week: ['%a, %d %b %Y', '%a, %d %b', '-%a, %d %b %Y'],
                month: ['%a, %d %b %Y', '%a, %d %b', '-%a, %d %b %Y'],
                year: ['%Y', '%Y', '-%Y']
            },
            unitsWeek: [ //if unitsWeek present then chart will be grouped for week based on the following inputs
                ['minute', [5, 10, 15]]
            ]
        },
        //any highchart config . see HIghcharts API
        highchart: {
            global: {
                useUTC: false
            },
            lang: {
                rangeSelectorZoom: ' '
                    //  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            },
            chart: {
                //height: 640,
                spacingLeft: 0,
                spacingRight: 0,
                spacingBottom: 2,
                spacingTop: -24
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            navigator: {
                handles: {
                    backgroundColor: '#454545',
                    borderColor: '#a2a2a2',
                    maskFill: '#eee' //'rgba(238, 238, 238, 0)',
                },
                height: 47,
                outlineColor: '#cdcdcd',
                outlineWidth: 1,
                //top: 375,
                series: {
                    color: '#dfe9f1',
                    lineColor: '#0086ff',
                    lineWidth: 2,
                    dataGrouping: {
                        //customized grouping for the navigator series
                        enabled: true,
                        approximation: 'average',
                        units: [
                            ['millisecond', [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]],
                            ['second', [1, 2, 5, 10, 15, 30]],
                            ['minute', [15, 30]],
                            ['hour', [1, 2, 3, 4, 6, 8, 12]],
                            ['week', [2, 3]],
                            ['month', [1, 3, 6]],
                            ['year', null]
                        ]
                    }
                },
                //custom: true,
                xAxis: {
                    id: 'navigator-x-axis', //IMP DO NOT DELETE THIS KEY, deleting this key will make the navigator width 100% as normal
                    relativeWidth: 0.42,
                    relativeLeftPadding: 0.65
                }
            },
            plotOptions: {
                column: {
                    minPointLength: 1,
                    dataGrouping: {
                        approximation: 'open'
                    }
                },
                scatter: {
                    tooltip: {
                        followPointer: true,
                        followTouchMove: true,
                        pointFormat: '<span style="color:{point.color}">{series.name}</span>: <b>{point.y}</b><br/>'
                    },
                    dataGrouping: {
                        approximation: 'open'
                    }
                },
                ohlc: {
                    dataGrouping: {
                        approximation: openOHLC
                    }
                },
                candlestick: {
                    dataGrouping: {
                        approximation: openOHLC
                    }
                },
                series: {
                    marker: {
                        symbol: 'circle'
                            /*,
                                                                                                                            fillColor: 'white',
                                                                                                                            lineWidth: 2,
                                                                                                                            lineColor: null
                                                                                                                            */
                    }
                }
            },
            rangeSelector: {
                custom: true, // This key will make sure the default buttons are not rendered
                buttons: [],
                buttonTheme: {
                    style: {
                        display: 'none'
                    }
                },
                enabled: true,
                inputEnabled: false
            },
            scrollbar: {
                barBackgroundColor: '#676767',
                barBorderWidth: 0,
                barBorderColor: '#eee',
                barBorderRadius: 0,
                buttonBackgroundColor: '#ababab',
                buttonBorderRadius: 0,

                height: 16,
                rifleColor: '#858585',
                trackBackgroundColor: '#eee',
                trackBorderColor: '#ccc'
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.options.id}</span>: <b>{point.y}</b><br/>',
                followTouchMove: true
            },
            xAxis: {
                //minRange: 25200000,
                dateTimeLabelFormats: {
                    millisecond: '%H:%M:%S.%L',
                    second: '%H:%M:%S',
                    minute: '%H:%M',
                    hour: '%H:%M',
                    day: '%e %b',
                    week: '%e %b',
                    month: '%b %y',
                    year: '%Y'
                },
                style: {
                    'stroke-dasharray': '8,3'
                },
                displayBtn: false
            },
            yAxis: [{
                height: 250,
                opposite: true,
                showLastLabel: true,
                endOnTick: false,
                startOnTick: false,
                maxPadding: 0.2,
                minPadding: 0.02,
                gridLineDashStyle: 'longdash',

                //ANKITZ
                offset: 50,
                labels: {
                    align: 'left',
                    x: 3,
                    y: 6
                },



                labels: {
                    style: {
                        color: '#999',
                        fontFamily: 'Arial',
                        fontWeight: 'bold'
                    },
                    formatter: function() {
                        var rupeeSymbol = '<span style="padding:0px;font-weight: normal; font-size: 12px; font-style: normal; line-height:normal; font-family: RupeeForadianRegular, sans-serif;">`</span>';

                        return rupeeSymbol + this.value;
                    }
                }
            }, {
                height: 79,
                top: 278,
                offset: 0,
                showLastLabel: true,
                gridLineColor: null,
                labels: {
                    enabled: false,
                    formatter: function() {
                        return (this.isLast) ? this.value : ''
                    }
                }
            }],

        },
        template: {
            menu: [{
                id: 'overlays',
                value: 'Overlays',
                type: 'checkbox',
                hasSubMenu: true,
                enabled: true
            }, {
                id: 'indicators',
                value: 'Indicators',
                type: 'checkbox',
                hasSubMenu: true,
                navLayout: 'multi-column',
                enabled: true
            }, {
                id: 'draw',
                value: 'Draw',
                type: 'radio',
                hasSubMenu: true,
                enabled: true
            }, {
                id: 'chartType',
                value: 'Chart Type',
                type: 'radio',
                hasSubMenu: true,
                enabled: true
            }, {
                id: 'lineType',
                value: 'Line Type',
                type: 'radio',
                hasSubMenu: true,
                enabled: true
            }, {
                id: 'events',
                value: 'Events',
                type: 'checkbox',
                hasSubMenu: true,
                enabled: true
            }],
            submenu: [
                //overlays
                {
                    id: 'bollinger',
                    value: 'Bollinger Bands (BBands)', // in the menu
                    titleHd: 'BBands', // on snapshot
                    type: 'overlays',
                    param: {
                        window: 20
                    },
                    colour: ['#000000', '#a7a7a7', '#000000'], //#f28f43 //MONEYCONTROL
                    opacity: 0.75,
                    enabled: true
                }, {
                    id: 'ema',
                    value: 'Exponential Moving Average (EMA)',
                    type: 'overlays',
                    enabled: true,
                    popup: true,
                    popupOptions: [{
                        key: 'window',
                        text: 'Period1',
                        _typeof: 'number',
                        allowNegative: false,
                        integer: true
                    }, {
                        key: 'window',
                        text: 'Period2',
                        _typeof: 'number',
                        optional: true,
                        allowNegative: false,
                        integer: true
                    }, {
                        key: 'window',
                        text: 'Period3',
                        _typeof: 'number',
                        optional: true,
                        allowNegative: false,
                        integer: true
                    }],
                    // Mention all the params for this operation with their default type
                    param: {
                        window: 20
                    }
                }, {
                    id: 'envelopes',
                    value: 'Envelopes',
                    type: 'overlays',
                    enabled: true,
                    param: {
                        window: 20,
                        percent: 5
                    },
                    colour: '#ff650d', //MONEYCONTROL
                    opacity: 0.5
                }, {
                    id: 'psar',
                    value: 'Parabolic SAR (PSAR)',
                    type: 'overlays',
                    enabled: true,
                    param: {
                        afStep: 0.02,
                        afMax: 0.2
                    },
                    //readFromInput : false, //use this key so that we can read the current value from the input data instead of the tooltipPoint
                    colour: ['#006900', '#d10800'] // Needs to be an array of >=2 colours //MONEYCONTROL
                }, {
                    id: 'sma',
                    value: 'Simple Moving Average (SMA)',
                    type: 'overlays',
                    enabled: true,
                    popup: true,
                    popupOptions: [{
                        key: 'window',
                        text: 'Period1',
                        _typeof: 'number',
                        allowNegative: false,
                        integer: true
                    }, {
                        key: 'window',
                        text: 'Period2',
                        _typeof: 'number',
                        optional: true,
                        allowNegative: false,
                        integer: true
                    }, {
                        key: 'window',
                        text: 'Period3',
                        _typeof: 'number',
                        optional: true,
                        allowNegative: false,
                        integer: true
                    }],
                    param: {
                        window: 20
                    }
                },

                //indicators
                {
                    id: 'accDist',
                    value: 'Accumulation / Distribution',
                    type: 'indicators',
                    enabled: true,
                    title: 'Accum-Distribtn'
                        /*,
                                                                                                                    signalLines: [{
                                                                                                                        type: 'sma',
                                                                                                                        param: {
                                                                                                                            window  : 20
                                                                                                                        },
                                                                                                                        title: 'SMA'
                                                                                                                    }]*/
                }, {
                    id: 'adx',
                    value: 'Average Directional Index (ADX)',
                    type: 'indicators',
                    enabled: true,
                    param: {
                        window: 14
                    }
                }, {
                    id: 'atr',
                    value: 'Average True Range (ATR)',
                    type: 'indicators',
                    enabled: true,
                    decimals: 4,
                    param: {
                        window: 14
                    }
                }, {
                    id: 'cci',
                    value: 'Commodity Channel Index (CCI)',
                    type: 'indicators',
                    enabled: true,
                    param: {
                        window: 20
                    }
                }, {
                    id: 'cmf',
                    value: 'Chaikin Money Flow',
                    type: 'indicators',
                    enabled: true,
                    param: {
                        window: 20
                    }
                }, {
                    id: 'sStoch',
                    value: 'Slow Stochastic',
                    type: 'indicators',
                    enabled: true,
                    param: {
                        window: 3
                    },
                    signalLines: [{
                        type: 'sma',
                        param: {
                            window: 3
                        }
                    }]
                }, {
                    id: 'fStoch',
                    value: 'Fast Stochastic',
                    type: 'indicators',
                    enabled: true,
                    param: {
                        window: 14
                    },
                    signalLines: [{
                        type: 'sma',
                        param: {
                            window: 3
                        }
                    }]
                }, {
                    id: 'macd',
                    value: 'MACD',
                    type: 'indicators',
                    enabled: true,
                    decimals: 4,
                    param: {
                        window1: 12,
                        window2: 26
                    },
                    signalLines: [{
                        type: 'ema',
                        title: 'signal',
                        param: {
                            window: 9
                        }
                    }, {
                        type: 'macdHistogram',
                        title: 'divergence',
                        chartOpt: {
                            type: 'column',
                            pointWidth: 1
                        }
                    }]
                }, {
                    id: 'momentum',
                    value: 'Momentum',
                    type: 'indicators',
                    enabled: true,
                    param: {
                        window: 10
                    },
                    chartOpt: {
                        type: 'area',
                        negativeColor: 'red'
                    }
                }, {
                    id: 'mfi',
                    value: 'Money Flow Index (MFI)',
                    type: 'indicators',
                    enabled: true,
                    decimals: 4,
                    param: {
                        window: 14
                    }
                }, {
                    id: 'obv',
                    value: 'On Balance Volume (OBV)',
                    enabled: true,
                    type: 'indicators',
                    decimals: 0
                }, {
                    id: 'roc',
                    value: 'Rate Of Change (ROC)',
                    type: 'indicators',
                    decimals: 4,
                    enabled: true,
                    param: {
                        window: 10
                    },
                    signalLines: [{
                        type: 'sma',
                        param: {
                            window: 5
                        }
                    }]
                }, {
                    id: 'rsi',
                    value: 'Relative Strength Index (RSI)',
                    type: 'indicators',
                    decimals: 4,
                    enabled: true,
                    popup: true,
                    popupOptions: [{
                        key: 'window',
                        text: 'Period1',
                        _typeof: 'number',
                        allowNegative: false,
                        integer: true
                    }],
                    param: {
                        window: 14,
                        //overbought: 70,
                        //oversold: 30

                    },
                    signalLines: [{
                        type: 'threshold70',
                        title: 'overbought',
                        param: {
                            window: 14
                        }
                    }, {
                        type: 'threshold30',
                        title: 'oversold',
                        param: {
                            window: 14
                        }
                    }]

                }, {
                    id: 'rvi',
                    value: 'Relative Vigor Index (RVI)',
                    enabled: true,
                    type: 'indicators',
                    param: {
                        window: 10
                    },
                    signalLines: [{ // EITHER SMA OR RVISIGNAL
                            type: 'rviSignal',
                            // type: 'sma',
                            param: {
                                window: 4
                            }
                        }
                        /*, {
                                                type: 'rviSignal'
                                            }*/
                    ]
                }, {
                    id: 'standardDeviation',
                    value: 'Standard Deviation', // in the menu
                    type: 'indicators',
                    param: {
                        window: 20
                    },
                    enabled: true
                        //chartOpt :{
                        //  type: 'column'
                        //}
                }, {
                    id: 'trix',
                    value: 'TRIX',
                    decimals: 4, //ankitz added 4 decimal in trix 
                    enabled: true,
                    type: 'indicators',
                    decimals: 4,
                    param: {
                        window: 15
                    },
                    signalLines: [{
                        type: 'ema',
                        param: {
                            window: 9
                        }
                    }]
                }, {
                    id: 'volume',
                    value: 'Volume',
                    enabled: true,
                    type: 'indicators',
                    decimals: 0,
                    chartOpt: {
                        type: 'column'
                    }
                }, {
                    id: 'wpr',
                    value: 'Williams % R',
                    enabled: true,
                    type: 'indicators',
                    param: {
                        window: 14
                    }
                },
                //draw
                {
                    id: 'none',
                    value: 'None',
                    type: 'draw',
                    enabled: true
                }, {
                    id: 'trendline',
                    value: 'Trendline',
                    type: 'draw',
                    enabled: true
                }, {
                    id: 'crosshair',
                    value: 'Crosshair',
                    type: 'draw',
                    enabled: true
                }, {
                    id: 'retracement',
                    value: 'Fibonacci Retracements',
                    type: 'draw',
                    enabled: true
                },
                //chartType{
                {
                    id: 'candlestick',
                    value: 'Candle Stick',
                    enabled: true,
                    type: 'chartType'
                }, {
                    id: 'ohlc',
                    value: 'OHLC',
                    enabled: true,
                    type: 'chartType'
                }, {
                    id: 'line',
                    value: 'Line',
                    type: 'chartType',
                    enabled: true
                }, {
                    id: 'monthly',
                    value: 'Monthly',
                    type: 'lineType',
                    enabled: true
                }, {
                    id: 'weekly',
                    value: 'Weekly',
                    type: 'lineType',
                    enabled: true
                }, {
                    id: 'daily',
                    value: 'Daily',
                    type: 'lineType',
                    enabled: true
                },

                //events
                {
                    id: 'bonus',
                    value: 'Bonus',
                    type: 'events',
                    enabled: true,
                    shape: 'url(./images/charting/bonus.png)'
                        /*  style   :{
                                                                                                'background-position' : '0px -248px',
                                                                                                width: 26,
                                                                                                height: 33
                                                                                            },
                                                                                            sprite_pos : '0px -248px'*/
                }, {
                    id: 'dividends',
                    value: 'Dividends',
                    type: 'events',
                    enabled: true,
                    shape: 'url(./images/charting/dividends.png)'
                        /*  style   :{
                                                                                                'background-position' : '0px -248px',
                                                                                                width: 26,
                                                                                                height: 33
                                                                                            },
                                                                                            sprite_pos : '0px -248px'*/
                }, {
                    id: 'rights',
                    value: 'Rights',
                    enabled: true,
                    type: 'events',
                    shape: 'url(./images/charting/rights.png)',
                    sprite_pos: '-52px -248px'
                }, {
                    id: 'splits',
                    value: 'Splits',
                    type: 'events',
                    shape: 'url(./images/charting/splits.png)',
                    sprite_pos: '-78px -248px',
                    enabled: true
                }, {
                    id: 'crosshair',
                    value: 'Crosshair',
                    type: 'draw',
                    enabled: true
                }, {
                    id: 'NavR',
                    value: 'Show Range Bar',
                    type: 'events',
                    enabled: true
                }
            ],

            settings: [{
                id: 'defaultView',
                title: 'Reset Selection',
                callback: 'resetSelection'
            }, {
                id: 'removeCrosshairs',
                title: 'Remove Crosshairs',
                callback: 'remove_crosshairs'
            }, {
                id: 'removeTrendlines',
                title: 'Remove Trendlines',
                callback: 'remove_trendlines'
            }, {
                id: 'removeRetracements',
                title: 'Remove Retracements',
                callback: 'remove_retracements'
            }, {
                id: 'saveCharts',
                title: 'Save Chart',
                //popup     :   true,
                callback: 'saveWidget'
            }]
        },
        rangeSelector: {
            hasButtons: [0, 1, 2, 3, 4, 5, 6, 8, 9],
            buttons: [{
                id: '1day',
                type: 'day',
                count: 1,
                text: '1D',
                range: 'intra',
                index: 0
            }, {
                id: '1week',
                type: 'week',
                count: 1,
                text: '1W',
                range: 'week',
                index: 1
            }, {
                id: '1month',
                type: 'month',
                count: 1,
                text: '1M',
                range: 'hist',
                index: 2
            }, {
                id: '3month',
                type: 'month',
                count: 3,
                text: '3M',
                range: 'hist',
                index: 3
            }, {
                id: '6month',
                type: 'month',
                count: 6,
                text: '6M',
                range: 'hist',
                index: 4
            }, {
                id: 'ytd',
                type: 'ytd',
                text: 'YTD',
                range: 'hist',
                index: 5
            }, {
                id: '1year',
                type: 'year',
                count: 1,
                text: '1Y',
                range: 'hist',
                index: 6
            }, {
                id: '2year',
                type: 'year',
                count: 2,
                text: '2Y',
                range: 'hist',
                index: 7
            }, {
                id: '5year',
                type: 'year',
                count: 5,
                text: '5Y',
                range: 'hist',
                index: 8
            }, {
                id: 'max',
                type: 'all',
                text: 'MAX',
                range: 'hist',
                index: 9
            }]

        }

    }

});
