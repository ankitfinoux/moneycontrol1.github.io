/**
 *
 *  @copyright (c) Finoux Solutions Pvt. Ltd. 2013
 *  @author: Vrajesh Sheth
 *  @version: 0.4
 *
 *  /js/charting/main.js
 *
 *  This file is the main js file for initializing the app. All requirejs path config should be added here
 */
require.config({
    paths: {
        //DOM manipulation library
        'jquery': 'libs/jquery/jquery-1.9.1.min',

        //templating library
        'underscore': 'libs/templating/underscore-min',

        //backbone
        'backbone': 'libs/backbone/backbone-min',
        'localStorage': 'libs/backbone/backbone.localStorage-min',

        //graphing libraries
        'highstock': 'libs/graphing/highstock1',
        'highcharts_more': 'libs/graphing/highcharts-more',

        //requirejs plugins
        'text': 'libs/requirejs/plugins/text',

        //datePicker
        'picker': 'libs/datePicker/picker',
        'pickadate': 'libs/datePicker/picker.date',

        //config files
        'config': 'config/config',

        //models
        'model_chart': 'models/model_chart',
        'model_series': 'models/model_series',
        'model_stockWidget': 'models/model_stockWidget',
        'model_selection': 'models/model_selection',
        'model_rangeButtons': 'models/model_rangeButtons',
        'model_flag': 'models/model_flag',
        'model_menu': 'models/model_menu',
        'model_submenu': 'models/model_submenu',
        'model_overlay': 'models/model_overlay',
        'model_indicator': 'models/model_indicator',
        'model_crosshair': 'models/model_crosshair',
        'model_trendline': 'models/model_trendline',
        'model_retracement': 'models/model_retracement',

        //views
        'view_stockWidget': 'views/view_stockWidget',
        'view_popup': 'views/view_popup',
        'view_chart': 'views/view_chart',
        'view_calenderButtons': 'views/view_calenderButtons',
        'view_rangeButtons': 'views/view_rangeButtons',
        'view_rangeSelector': 'views/view_rangeSelector',
        'view_nav': 'views/view_nav',
        'view_menu': 'views/view_menu',
        'view_submenulist': 'views/view_submenulist',
        'view_submenu': 'views/view_submenu',
        'view_settings': 'views/view_settings',
        'view_readings': 'views/view_readings',
        'view_overlays': 'views/view_overlays',
        'view_indicators': 'views/view_indicators',
        'view_snapshots': 'views/view_snapshots',
        'view_notification': 'views/view_notification',

        //collections
        'collection_widgets': 'collections/collection_widgets',
        'collection_flags': 'collections/collection_flags',
        'collection_series': 'collections/collection_series',
        'collection_selection': 'collections/collection_selection',
        'collection_rangeButtons': 'collections/collection_rangeButtons',
        'collection_menus': 'collections/collection_menus',
        'collection_submenus': 'collections/collection_submenus',
        'collection_overlays': 'collections/collection_overlays',
        'collection_indicators': 'collections/collection_indicators',
        'collection_crosshairs': 'collections/collection_crosshairs',
        'collection_trendlines': 'collections/collection_trendlines',
        'collection_retracements': 'collections/collection_retracements',

        //templates
        'widget_tmpl': '../../templates/widget_template.html',
        'indicator_tmpl': '../../templates/indicator_template.html',
        'nav_tmpl': '../../templates/nav_template.html',
        'settings_tmpl': '../../templates/settings_template.html',
        'readings_tmpl': '../../templates/readings_template.html',
        'snapshot_tmpl': '../../templates/snapshot_template.html',
        'popup_tmpl': '../../templates/popup_template.html',
        'error_tmpl': '../../templates/error_template.html',
        'calender_tmpl': '../../templates/calender_template.html'
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'highstock': {
            deps: ['jquery'],
            exports: 'Highcharts'
        },
        'highcharts_more': {
            deps: ['highstock'],
            exports: 'Highcharts_more'
        }
    }
});


var w1, w2;
require([
    //libraries
    'jquery', 'underscore', 'backbone',
    //others
    'extend', 'holidays',
    //views
    'view_stockWidget'
], function($, _, Backbone,
    extend /*undefined*/ , holidays,
    StockWidget_View) {

    w1 = new StockWidget_View({
        param: [{
            name: 'ICIBANN',
            title: 'ICICI Bank Ltd.',
            code: '5418',
            asset: 'equity',
            exchange: 'NSE',
            lineType: 'daily',
            url: {
                intra: './data/intra/5418_NSE.csv',
                week: './data/week/5418_NSE.csv',
                hist: './data/hist/5418_NSE.csv'
            },
            links: {
                company: './#pageICICI',
                buy: './#buyICICI',
                sell: './#sellICICI'
            }
        }],

        chartMode: 'advanced', //'advanced' or 'small'
        currentRange: 'hist',
        hasVolume: false,
        hasNavigator: true,
        hasRangeSelector: true,
        //chartMode : 'advanced', //'advanced' or 'small'
        currentRange: 'hist',
        name: 'ABC',
        container: '#container1', //css selector
        // hasVolume: false,
        // hasNavigator: true,
        // hasRangeSelector: true,
        // config: {
        //     chart: {
        //         canvasHeight: 357, //--SK
        //         appendData: true
        //     },
        //     rangeSelector: {
        //         hasButtons: [0, 1, 2, 3, 4, 6, 7, 8, 9]
        //     },
        //     highchart: {
        //         chart: {
        //             //height: 640,
        //             //spacingLeft: 0,
        //             spacingRight: 0
        //                 //spacingBottom: 0,
        //                 //spacingTop: 0,
        //                 //margin: [0, 0, 5, 0],
        //                 //type: 'area'
        //         },
        //         yAxis: [{
        //             height: 250,
        //             // showLastLabel: true,
        //             // endOnTick: false,
        //             // startOnTick: false,
        //             maxPadding: 0.02,
        //             minPadding: 0.02,
        //             gridLineDashStyle: 'longdash',
        //             labels: {
        //                 style: {
        //                     color: '#999',
        //                     fontFamily: 'Arial',
        //                     fontWeight: 'bold'
        //                 },
        //                 formatter: function() {
        //                     var rupeeSymbol = '<span  style="padding:0px;font-weight: normal; font-size: 12px; font-style: normal; line-height:normal; font-family: RupeeForadianRegular, sans-serif;">`</span>';

        //                     return rupeeSymbol + this.value;
        //                 }
        //             }
        //         }, {
        //             height: 79,
        //             top: 278,
        //             offset: 0,
        //             showLastLabel: true,
        //             gridLineColor: null,
        //             labels: {
        //                 enabled: false,
        //                 formatter: function() {
        //                     return (this.isLast) ? this.value : ''
        //                 }
        //             }
        //         }]
        //     }
        // }

    });


});


///////////////////////////////////////////////////RUNTIME CONFIGURATION/////////////////////////////////////////////
var callCompanyArr = [{
        objCoCode: "476",
        objExchange: "NSE",
        objCompname: "Reliance Industries Ltd",
        objCompTitle: "RELIND ",
        objCompURL: "https://www.edelweiss.in/company/Reliance-Industries-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "5418",
        objExchange: "NSE",
        objCompname: "ICICI Bank Ltd",
        objCompTitle: "ICIBANN",
        objCompURL: "https://www.edelweiss.in/company/ICICI-Bank-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "5419",
        objExchange: "BSE",
        objCompname: "ICICI Bank Ltd",
        objCompTitle: "ICIBAN-BSE",
        objCompURL: "https://www.edelweiss.in/company/ICICI-Bank-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "5400",
        objExchange: "NSE",
        objCompname: "Tata Consultancy Services Ltd",
        objCompTitle: "TATCON",
        objCompURL: "https://www.edelweiss.in/company/Tata-Consultancy-Services-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "4987",
        objExchange: "NSE",
        objCompname: "HDFC Bank Ltd",
        objCompTitle: "HDFBAN",
        objCompURL: "https://www.edelweiss.in/company/HDFC-Bank-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "2806",
        objExchange: "NSE",
        objCompname: "Infosys Ltd",
        objCompTitle: "INFLTD",
        objCompURL: "https://www.edelweiss.in/company/ICICI-Bank-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },


    {
        objCoCode: "2295",
        objExchange: "NSE",
        objCompname: "Tata Communications Ltd",
        objCompTitle: "TATCOM",
        objCompURL: "https://www.edelweiss.in/company/Tata-Communications-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "614",
        objExchange: "NSE",
        objCompname: "Wipro Ltd",
        objCompTitle: "WIPLTD ",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "6890",
        objExchange: "NSE",
        objCompname: "DLF Ltd",
        objCompTitle: "DLFLTD",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "28074",
        objExchange: "NSE",
        objCompname: "Bajaj Auto Ltd",
        objCompTitle: "BAJAUT",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "237",
        objExchange: "NSE",
        objCompname: "Hero MotoCorp Ltd",
        objCompTitle: "HERMOT",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },


    //BSE
    {
        objCoCode: "560",
        objExchange: "BSE",
        objCompname: "Tata Motors Ltd",
        objCompTitle: "TATMOT",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "12019",
        objExchange: "BSE",
        objCompname: "Coal India Ltd",
        objCompTitle: "COAIND",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "566",
        objExchange: "BSE",
        objCompname: "Tata Steel Ltd",
        objCompTitle: "TATSTE",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "114",
        objExchange: "BSE",
        objCompname: "Cipla Ltd",
        objCompTitle: "CIPLTD",
        objCompURL: "https://www.edelweiss.in/company/Wipro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }, {
        objCoCode: "469",
        objExchange: "BSE",
        objCompname: "Ranbaxy Laboratories Ltd",
        objCompTitle: "RANLAB",
        objCompURL: "https://www.edelweiss.in/company/Ranbaxy-Laboratories-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },


    {
        objCoCode: "51",
        objExchange: "BSE",
        objCompname: "Bajaj Electricals Ltd",
        objCompTitle: "BAJELE",
        objCompURL: "https://www.edelweiss.in/company/Bajaj-Electricals-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },

    {
        objCoCode: "348",
        objExchange: "BSE",
        objCompname: "Larsen & Toubro Ltd",
        objCompTitle: "LARTOU",
        objCompURL: "https://www.edelweiss.in/company/Larsen-And-Toubro-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },

    {
        objCoCode: "255",
        objExchange: "BSE",
        objCompname: "Hindustan Unilever Ltd",
        objCompTitle: "HINUNI",
        objCompURL: "https://www.edelweiss.in/company/Hindustan-Unilever-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },

    {
        objCoCode: "5656",
        objExchange: "BSE",
        objCompname: "HCL Technologies Ltd",
        objCompTitle: "HCLTEC",
        objCompURL: "https://www.edelweiss.in/company/HCL-Technologies-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },

    {
        objCoCode: "231",
        objExchange: "BSE",
        objCompname: "GlaxoSmithkline Consumer Healthcare Ltd",
        objCompTitle: "GLACON",
        objCompURL: "https://www.edelweiss.in/company/GlaxoSmithkline-Consumer-Healthcare-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    },


    {
        objCoCode: "17215",
        objExchange: "BSE",
        objCompname: "Tech Mahindra Ltd",
        objCompTitle: "TECMAH",
        objCompURL: "https://www.edelweiss.in/company/Tech-Mahindra-Ltd.html",
        objBuyURL: "https://www.edelweiss.in",
        objSellURL: "https://www.edelweiss.in"
    }
];

function getParam(graphDataObj) {
    return {
        name: graphDataObj.objCompTitle,
        title: graphDataObj.objCompname,
        code: graphDataObj.objCoCode,
        exchange: graphDataObj.objExchange,
        url: {
            intra: './data/intra/' + graphDataObj.objCoCode + "_" + graphDataObj.objExchange + ".csv",
            week: './data/week/' + graphDataObj.objCoCode + "_" + graphDataObj.objExchange + ".csv",
            hist: './data/hist/' + graphDataObj.objCoCode + "_" + graphDataObj.objExchange + ".csv"
        },
        links: {
            company: graphDataObj.objCompURL || '#',
            buy: graphDataObj.objBuyURL || '#',
            sell: graphDataObj.objSellURL || '#'
        }
    }
}

function drawBaseCompany() {
    if (w1) {
        var currCompany = Number(document.getElementById('drpBaseCompany').value);
        if (currCompany != -1) {
            for (var i = 0; i < callCompanyArr.length; i++) {
                if (currCompany == Number(callCompanyArr[i].objCoCode)) {
                    w1.replace(getParam(callCompanyArr[i]));
                }
            }
        }

    } else {
        var currCompany = Number(document.getElementById('drpBaseCompany').value);
        if (currCompany != -1) {
            for (var i = 0; i < callCompanyArr.length; i++) {
                if (currCompany == Number(callCompanyArr[i].objCoCode)) {
                    drawADVHighChart(callCompanyArr[i]);
                }
            }
        }
    }

}

function drawADVHighChart(graphDataObject) {
    var compFullCSVName = graphDataObject.objCoCode + "_" + graphDataObject.objExchange + ".csv";
    require(['view_stockWidget'], function(StockWidget_View) {
        w1 = new StockWidget_View({
            param: getParam(graphDataObject),
            config: {
                highchart: {
                    exporting: {
                        enabled: true
                    }
                }
            },
            name: 'ABC',
            container: '#container1'
        });
    });
}


function addCompany() {
    var compCompany = Number(document.getElementById('drpCompareCompany').value);
    if (compCompany != -1) {
        for (var i = 0; i < callCompanyArr.length; i++) {
            if (compCompany == Number(callCompanyArr[i].objCoCode)) {
                addCompareHighCharts(callCompanyArr[i]);
            }
        }
    }
}


function addCompareHighCharts(compGraphDataObject) {
    var compareFullCSVName = compGraphDataObject.objCoCode + "_" + compGraphDataObject.objExchange + ".csv";
    if (w1) {
        w1.add_compare({
            param: [{
                name: compGraphDataObject.objCompTitle,
                title: compGraphDataObject.objCompname,
                code: compGraphDataObject.objCoCode,
                exchange: compGraphDataObject.objExchange,
                url: {
                    intra: './data/intra/' + compareFullCSVName,
                    week: './data/week/' + compareFullCSVName,
                    hist: './data/hist/' + compareFullCSVName
                },
                links: {
                    company: compGraphDataObject.objCompURL || '#',
                    buy: compGraphDataObject.objBuyURL || '#',
                    sell: compGraphDataObject.objSellURL || '#'
                }
            }]
        });
    }
}






////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////================BROWSER DETECTION==============///////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
function get_browser() {
    var N = navigator.appName,
        ua = navigator.userAgent,
        tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
    M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
    return M[0];
}

function get_browser_version() {
    var N = navigator.appName,
        ua = navigator.userAgent,
        tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
    M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
    return M[1];
}



// GLOBAL VARIABLE
var user_browser = get_browser();
var user_browser_version = get_browser_version();

function drawStockChart(params) {

    //  if IE 9.0 or less than Draw older Flash Charts else newer HighCharts
    if (user_browser.toString().toLowerCase() == "msie" && (!isNaN(user_browser_version) && Number(user_browser_version) <= 9)) {
        //CALL FLASH CHART

    } else {
        //CALL NEW ADVANCE CHART with params
        drawADVHighChart(params)

    }

}



function addCompareCompany(params) {

    //  if IE 9.0 or less than Draw older Flash Charts else newer HighCharts
    if (user_browser.toString().toLowerCase() == "msie" && (!isNaN(user_browser_version) && Number(user_browser_version) <= 9)) {
        //CALL FLASH CHART COMPARE CODE

    } else {
        //CALL NEW ADVANCE CHART with params
        addCompareHighCharts(params)
    }


}
