/**
 *  /js/views/stockWidget.js
 *  This module defines the main stockwidget view file
 *  @module View_StockWidget
 *
 */
define([
    //libraries
    'jquery', 'underscore', 'backbone', 'highstock',
    //config
    'config',
    //models
    'model_stockWidget', 'model_selection', 'model_series', 'model_submenu', 'model_overlay', 'model_indicator',
    //collections
    'collection_widgets', 'collection_selection', 'collection_series', 'collection_flags', 'collection_overlays',
    'collection_indicators', 'collection_rangeButtons', 'collection_menus', 'collection_submenus',
    'collection_crosshairs', 'collection_trendlines', 'collection_retracements',
    //views
    'view_chart', 'view_rangeSelector', 'view_nav', 'view_readings', 'view_popup',
    'view_overlays', 'view_indicators', 'view_snapshots', 'view_notification',
    //templates
    'text!widget_tmpl', 'text!error_tmpl',
    //others
    'messenger', 'holidays'
], function(
    //libraries
    $, _, Backbone, Highcharts,
    //config
    defaultConfig,
    //models
    StockWidget, SelectionModel, Serie, SubMenuModel, OverlayModel, IndicatorModel,
    //collections
    WidgetList, SelectionList, SeriesList, FlagsList, OverlaysList,
    IndicatorsList, ButtonsList, MenuList, SubMenuList,
    CrosshairsList, TrendlinesList, RetracementsList,
    //views
    ChartView, RangeSelector, NavView, ReadingsBarView, PopupView,
    OverlaysView, IndicatorsView, SnapshotView, NotifyView,
    //templates
    widget_tmpl, error_tmpl,
    //others
    Messenger, holidays
) {

    var widgetDB = new WidgetList(),
        selectionDB = new SelectionList();

    var chk = true;

    // fetch localStorage settings
    selectionDB.fetch();

    var navigatorId = "highcharts-navigator-series";

    //templates
    var widgetTmpl = _.template(widget_tmpl),
        errorTmpl = _.template(error_tmpl);

    var chartConf = defaultConfig.chart;
    //constants
    var ONE_MIN = chartConf.ONE_MIN,
        ONE_DAY = chartConf.ONE_DAY,
        ONE_WEEK = chartConf.ONE_WEEK;

    var uniqueComponents = chartConf.uniqueComponents;

    function is_touch_device() {
        // return 'ontouchstart' in window // works on most browsers 
        //     || 'onmsgesturechange' in window; // works on ie10

        //ankitz added window.navigator.maxTouchPoints to correct false positive on IE Browsers
        return !!('ontouchstart' in window) || (!!('onmsgesturechange' in window) && !!window.navigator.maxTouchPoints);
    };

    var isTouch = is_touch_device();
    /**
     *  The main class definition for our stockWidget view
     *  @classdesc StockWidget_View
     *  @constructor
     */
    return Backbone.View.extend({
        template: widgetTmpl,

        tagName: 'article',

        initialize: function(options) {

            //initializing the model
            //BUG FIX: Multiple Instances
            //shifting this inside the initialize else it will NOT be called every time
            this.model = (function() {
                return new StockWidget();
            })();

            //initializing a Messenger object, passing notification & error handlers
            var messenger = new Messenger({
                notifyHandler: this.notifyHandler,
                errorHandler: this.errorHandler,
                view: this
            });
            this.messenger = messenger;

            this.eventMap = (function() {
                return isTouch ? {
                    start: 'touchstart',
                    move: 'touchmove',
                    stop: 'touchend'
                } : {
                    start: 'mousedown',
                    move: 'mousemove',
                    stop: 'mouseup'
                };
            })();
            this.isTouch = isTouch;

            var hasOptions = (options && options.config);
            // BUG FIX: Multiple Instances
            //added an extra object literal {} after true, else defaultConfig itself would get extended
            this.config = hasOptions ? $.extend(true, {}, defaultConfig, options.config) : defaultConfig;

            //hasButtons options is merged because of deep extending, rectifying
            var hasBtns = hasOptions && hasOptions.rangeSelector && hasOptions.rangeSelector.hasButtons;
            if (hasBtns)
                this.config.rangeSelector.hasButtons = hasBtns;

            var chartOpt = this.config.chart,
                template = this.config.template,

                // initializing SeriesList
                seriesList = new SeriesList(),

                // initializing nav- menu & submenus & settings collection
                menus = new MenuList(_.where(template.menu, {
                    enabled: true
                })),
                submenus = new SubMenuList(_.where(template.submenu, {
                    enabled: true
                })),
                settings = new SubMenuList(template.settings),

                //initializing flagsList
                flagNames = _.where(template.submenu, {
                    type: chartOpt.flagsMenuType
                }),
                flags = new FlagsList(flagNames),

                // initializing RangeSelector
                rangeButtons = new ButtonsList(),
                rs = this.config.rangeSelector,
                hasButtons = rs.hasButtons,
                btns = _.filter(rs.buttons, function(btn) {
                    return _.indexOf(hasButtons, btn.index) !== -1;
                }),

                // initializing OverlaysList
                overlaysList = new OverlaysList(),

                // initializing IndicatorsList
                indicatorsList = new IndicatorsList(),

                rangeView, nav, readings;

            this.btns = btns;
            this.rangeButtons = rangeButtons;
            this.chartRefList = new Backbone.Collection();
            this.xHairsList = new Backbone.Collection();

            this.seriesList = seriesList;
            this.flags = flags;
            this.submenusList = submenus;
            this.overlaysList = overlaysList;
            this.indicatorsList = indicatorsList;
            // initialing Draw lists
            this.crosshairsList = new CrosshairsList(null, {
                max: chartOpt.maxCrosshairs
            });
            this.trendlinesList = new TrendlinesList(null, {
                max: chartOpt.maxTrendlines
            });
            this.retracementsList = new RetracementsList(null, {
                intervals: this.config.fibonacci_intervals,
                max: chartOpt.maxRetracements
            });

            // ANKITZ 
            this.trendlinesIndicatorList = new TrendlinesList(null, {
                max: chartOpt.maxTrendlines
            });



            //binding the correct context to the view functions
            //This makes sure that all the listed methods get this as their context
            _.bindAll(this, 'loadWidget', 'add_mainChart', 'getChartRef',
                'renderCharts', 'renderPopup', 'toggleLoading',
                'initLocalStorage', 'resetSelection', 'uploadSelection',
                'manageOperation', 'updateRange', 'updateExtremes', 'toggleComponents',
                'manageMouseMove', 'syncCrosshair', 'syncInstances', //'syncExtremes',
                'add_overlays', 'remove_overlays', 'toggle_overlays',
                'add_indicators', 'remove_indicators', 'toggle_indicators',
                //'add_freq',
                'add_compare', 'remove_compare', 'switchPrimary',
                'change_chartType', 'toggle_events',
                'add_draw', 'remove_draw', 'toggle_draw',
                'start_drawlines', 'drag_drawlines', 'remove_allDrawInstances',

                //ANKITZ - trendlines On Indicator
                'start_drawlines_on_indicator', 'drag_drawlines_on_indicator',
                'add_trendlines_on_indicator',


                'add_crosshairs', 'remove_crosshairs',
                'add_trendlines', 'remove_trendlines',
                'add_retracements', 'remove_retracements',
                'add_snapshot', 'toggleSave', 'purge', 'update',
                'errorHandler', 'notifyHandler', 'loadSaveWidget',
                'saveWidget', 'removeCustomView',
                'change_lineType', //S.K
                'customiseNavigationBar' //ankitz
            );

            //error listeners

            this.listenTo(widgetDB, 'invalid', _.bind(messenger.failure, messenger));

            this.listenTo(submenus, 'clicked unclicked', this.manageOperation);
            this.listenTo(rangeButtons, 'clicked', this.updateRange);
            this.listenTo(indicatorsList, 'remove-view', this.manageOperation);
            this.listenTo(overlaysList, 'add', this.add_snapshot);
            this.listenTo(overlaysList, 'remove-view', this.manageOperation);
            this.listenTo(seriesList, 'remove-view', this.remove_compare);

            this.listenTo(this.trendlinesList, 'warn', _.bind(messenger.warn, messenger));

            // ANKITZ
            this.listenTo(this.trendlinesIndicatorList, 'warn', _.bind(messenger.warn, messenger));
            this.listenTo(this.crosshairsList, 'warn', _.bind(messenger.warn, messenger));

            this.listenTo(settings, 'clicked unclicked', function(model, value) {
                var widgetModel = this.model;
                widgetModel.loading();
                var fn = this[model.get('callback')];
                if (fn) {
                    fn();
                }
                widgetModel.loaded();
            });


            // ... filling up the widget model
            var input = _.omit(options, 'config', 'param');
            this.model.initialize(input, {
                validate: true
            });

            if (!this.model.validationError) {
                var isModelUnique = widgetDB.add(this.model);

                if (isModelUnique !== false) {
                    var selection = this.loadWidget(options);
                } else {
                    this.messenger.failure({
                        msg: "Model Not Unique",
                        model: this.model,
                        on: 'adding the widget model to the widgetDB'
                    });
                    //this.destroy();
                    return;
                }

            } else {
                this.messenger.failure({
                    model: this.model,
                    msg: this.model.validationError,
                    on: 'instanciating the base model'
                });
                //this.destroy();
                return;
            }

            this.el.className = chartOpt.classNames.widget;
            this.el.id = name + chartOpt.idSuffixes.widget;


            //Attaching the listener after real instanciation / after setting the values
            this.listenTo(this.model, 'change:componentsHidden', this.toggleComponents);
            this.listenTo(this.model, 'change:ready', this.toggleLoading);


            var attr = this.model.toJSON();
            this.messenger.model = this.model;
            this.messenger.onlyErrors = attr.onlyErrorNotifications;

            //creating rangeSelector
            try {
                if (attr.hasRangeSelector) {
                    rangeButtons.add(btns);
                    rangeView = new RangeSelector({
                        collection: rangeButtons,
                        config: this.config,
                        select: selection.rangeSelected,
                        hasDateView: attr.hasDateView,
                        hasCalender: attr.hasCalender,
                        messenger: this.messenger,
                        mode: attr.chartMode
                    });

                    this.listenTo(rangeView, 'change', this.updateExtremes);
                }
            } catch (e) {
                rangeView = null;
                this.messenger.error({
                    msg: e.message,
                    error: e,
                    on: "rendering rangeSelector"
                });
            }

            //creating nav
            try {
                if (attr.hasMenu) {
                    nav = new NavView({
                        config: this.config,
                        collection: menus,
                        submenus: submenus,
                        settings: settings,
                        priSerie: this.model.getPrimarySerie(),
                        selected: selection.submenusSelected,
                        messenger: this.messenger,
                        isTouch: this.isTouch
                    });

                    if (selection.disableNav) {
                        nav.toggleNav(); //-- SK
                    }
                }
            } catch (e) {
                nav = null;
                this.messenger.error({
                    msg: e.message,
                    error: e,
                    on: "rendering navigation bar"
                });
            }

            //creating readings bar
            try {
                if (attr.hasReadings) {
                    readings = new ReadingsBarView({
                        config: this.config.chart,
                        model: this.model,
                        messenger: this.messenger,
                        mode: attr.chartMode
                            //  asset       : options.param.asset
                    });
                }
            } catch (e) {
                readings = null;
                this.messenger.error({
                    msg: e.message,
                    error: e,
                    on: "rendering readings bar"
                });
            }

            this.nav = nav;
            this.readings = readings;
            this.rangeSelector = rangeView;

            this.render({
                nav: nav,
                readings: readings,
                rangeSelector: rangeView
            });

        },

        render: function(args) {
            var config = this.config,
                tmpl = config.template,
                classNames = config.chart.classNames,
                navEl, readingsEl, rangeSelectorEl;


            this.$el.html(this.template({
                id: this.options.name,
                classNames: classNames,
                height: config.chart.canvasHeight
            }));

            navEl = (args.nav) ? args.nav.el : navEl;
            readingsEl = (args.readings) ? args.readings.el : readingsEl;
            rangeSelectorEl = (args.rangeSelector) ? args.rangeSelector.el : rangeSelectorEl;

            this.hideClass = classNames.hide;
            this.$loading = this.$('.loading');
            this.$notification = this.$('.notificationWrpr');

            this.$('.header').prepend([navEl, readingsEl]);

            this.$('.footer').append(rangeSelectorEl);

            this.renderCharts({
                onLoad: true,
                classNames: classNames
            });

            //notifications div  now available, display error messages if any
            this.messenger.notify();

            $(this.options.container).append(this.$el);
            //console.log("New Widget View created", this.model);
            var tempSettingsArray, settingsNameList = [];

            this.customiseNavigationBar({
                isHist: this.model.isHist()
            }); //ankitz: calling this very late here after pageload so as to have the widget view enabled first 

            //This will append the Custom-Settings-List from Localstorage to the Settings Menu  
            if (this.stateModel && this.stateModel.attributes && this.stateModel.attributes['savedCustomSetting']) {
                tempSettingsArray = this.stateModel.attributes['savedCustomSetting'];
                if (tempSettingsArray.length > 0) {
                    var a = this.$('.settingsUl');
                    for (var i = 0; i < tempSettingsArray.length; i++) {
                        var temp = tempSettingsArray[i];
                        for (var keyName in temp) {
                            //settingsNameList.push(keyName);
                            a.append('<li><div id=' + keyName + ' class= "settingsEntry">' + keyName + '<div id="remove_' + keyName + '" class="view-btn xbutton">x</div></div></li>');
                            c = this.$('#' + keyName);
                            c.click(keyName, this.loadSaveWidget);
                            this.$('#remove_' + keyName).click(keyName, this.removeCustomView);
                        }
                    }

                }
            }
        },

        // This function handles the rendering of canvas wrappers
        renderCharts: function(args) {
            //var name = (nameOrModel instanceof Backbone.Model)? nameOrModel.get('name') : nameOrModel,
            if (args.onLoad) {
                //render main chart
                this.$('.main').append(this.mainChartView.$el);
                this.$canvas = this.$('.' + args.classNames.canvas);
            } else if (!args.onLoad && args.view instanceof Backbone.View) {
                this.$('.indicators').append(args.view.$el);
                args.view.renderChart();
            }
        },

        /**
         *  This method is used internally by Messenger Class.
         *  It displays the popup notifications in the canvas area in green (Success), yellow (Warning) or red (Error) colours
         *
         *  @method notifyHandler
         *  @private
         *  @param {object} args Object  -with message details
         *  @param {boolean} displayMsg  -display or skip displaying a message
         */
        notifyHandler: function(args, displayMsg) {
            if (displayMsg) {
                var notification = this.$notification;

                if (!(notification && notification.length)) { //if notification div not yet rendered
                    return false;
                }
                args = (args instanceof Array) ? args : [args];
                var chartOpt = this.config.chart,
                    loaded;

                var msgs = [];
                for (var i = 0, len = args.length; i < len; i++) {
                    var opt = args[i];
                    var notify = new NotifyView({
                        classNames: chartOpt.classNames,
                        msg: opt.str || opt.msg,
                        type: opt.type,
                        time: chartOpt.notifyDisplayTime
                    });

                    if (!loaded && opt.loaded) {
                        loaded = true
                    }

                    msgs.push(notify.el);
                }

                notification.append(msgs);
            }

            if (loaded || displayMsg) {
                this.model.loaded();
            }

            return true;
        },

        /**
         *  This method displays or hides the loading screen. Used Internally
         *  It is invoked on every value change of the 'ready' key of the widget model
         *
         *  @method toggleLoading
         *  @private
         *  @param {object} model  -WidgetModel instance of this StockWidget
         *  @param {boolean} value -to unhide or hide the loading screen
         */
        toggleLoading: function(model, value) {
            if (!value) {
                this.$loading.removeClass(this.hideClass);
            } else {
                this.$loading.addClass(this.hideClass);
            }
        },

        /**
         *  This method displays the Error Screen in the canvas area. Used internally
         *  It shows up when there is a fatal error or an error onLoad
         *  @method errorHandler
         *  @private
         *  @param {object} args
         *
         */
        errorHandler: function(args) {
            var model = this.model;
            model.set('fatalError', true);

            //show error screen                 
            this.$canvas.html(errorTmpl(args));

            //disable nav
            model.hideComponents();
            //hide loading screen
            model.loaded(true);

            console && console.error("FATAL", args);
        },

        //This function renders the popup
        renderPopup: function(args) {
            var popup = new PopupView(args);
            this.$el.append(popup.el);
        },

        /*
         *  This function restores all the stored user selection to the chart
         *  It uses remaining key which is populated in the loadWidget method. Used Internally
         *
         *  @method uploadSelection
         *  @private
         *  @param {boolean} [redraw] whether to redraw the chart. Defaults true
         *
         *  @see loadWidget
         */
        uploadSelection: function(redraw) {
            //load remaining components
            if (this.remaining && !this.model.inCompareMode()) { //--SK
                var priName = this.model.getPrimarySerie().get('name');
                var chartRef = this.mainChartView.chartRef;;
                if (!chartRef) {
                    return;
                }
                _.each(this.remaining, function(instances, component) {
                    //not using manageOperation as it would require modification while adding retracements, trendlines, crosshairs
                    var fn = this[((component === 'chartType' || component === 'lineType') ? 'change_' : 'add_') + component];

                    //Do not add component instances which are unique to a series
                    var skip = (_.indexOf(uniqueComponents, component) !== -1 && this.remaining.serieName !== priName);
                    //if(fn && instances.length && !skip){
                    if (fn && instances.length && !skip) {
                        fn({
                            param: instances,
                            redraw: false,
                            uploading: true
                        });
                    }
                }, this);

                if (redraw !== false) {
                    //redraw the chart
                    chartRef && chartRef.redraw();
                }

                this.messenger.success({
                    msg: 'Saved Selection Uploaded'
                })

                //delete the selection once its added to the chart
                delete this.remaining;
            }
        },

        /**
         *  This method sets up the localStorage connection. Used Internally
         *
         *  @method initLocalStorage
         *  @param {String} name Name of the widgetmodel
         *  @param {String} firstSerieName name of the primarySerie - used to make sure draw instances are loaded only for the given serie
         *  @returns {Object} a model of SelectionDB Collection for the given widget
         *  @private
         */

        initLocalStorage: function(name, firstSerieName) {
            if (!this.model.get('saveState')) {
                return null;
            }
            var sel = selectionDB.get(name);

            if (!sel) {
                sel = selectionDB.create(_.extend({
                    id: name,
                    serieName: firstSerieName
                }, this.config.defaults));
            }

            if (sel) {
                this.listenTo(sel, 'error', this.messenger.warn);
            } else {
                this.messenger.warn({
                    msg: 'localStorage not available in the browser',
                    on: 'initializing localStorage'
                })
            }

            return sel;
        },

        /**
         *  This method purges the user selection and restores the chart to the default state
         *
         *  @method resetSelection
         *  @public
         */
        resetSelection: function() {
            this.stateModel && this.stateModel.purge(this.config.defaults);
            this.purge(true, true);
            this.reload({
                msg: 'Chart Restored To Default Settings',
                on: 'resetting selection'
            });
        },

        /**
         *  This method helps in storing & retriving the chartType & drawType values temporarily between range switches & series compares.
         *  It even saves those values when localStorage is not available. Used Internally
         *
         *  @method toggleSave
         *  @param {String} key key to store in the selection
         *  @param value value of the key
         *  @returns {Object|String|Undefined}
         *  @private
         */
        toggleSave: function(key, value) {
            // this module is necessary as localStorage may not be available always
            if (this.stateModel) {
                //localStorage exists
                var ct = this.stateModel.get(key);
                if (ct) {
                    //means key was already stored in LS. Flow should come here when switching OUT of compare mode
                    this.stateModel.unset(key);
                    return ct;
                } else if (value) {
                    //adding a new key to the LS. Flow should come here when switching TO compare mode
                    this.stateModel.set(key, value);
                }
            } else {
                //store it in a temp var
                if (this[key]) {
                    var ct = this[key];
                    delete this[key];
                    return ct;
                } else if (value) {
                    this[key] = value;
                }
            }
        },

        /**
         *  This method does the crucial loading functions for the widget - sets up the selectionDB, creates user selection etc
         *
         *  @method loadWidget
         *  @private
         *  @param {Object} options options passed during instanciation
         *  @returns {Object} default selections for the UI
         */
        loadWidget: function(options) {


            var chartOpt = this.config.chart,
                defaults = this.config.defaults,
                optParams = options.param,
                firstSerieName,
                returns = {};

            //Grabbing the name of the primary serie
            if (optParams instanceof Array) {
                firstSerieName = optParams[0].name;
                _.each(optParams, function(c) {
                    c.fromDeclaration = true;
                });
            } else {
                firstSerieName = optParams.name;
            }

            //initialize localStorage
            this.stateModel = this.initLocalStorage(options.name, firstSerieName);

            //grab the values from the LS which needs to be passed with initial load- currentRange, chartType, rangeSelected, flags
            var storedSettings = this.stateModel && this.stateModel.toJSON() || {};
            var range = storedSettings.currentRange || this.model.getCurrentRange() || defaults.currentRange,
                chartType = storedSettings.chartType || defaults.chartType,
                lineType = storedSettings.lineType || defaults.lineType,

                rs_prev = storedSettings.rangeSelected || defaults.rangeSelected,
                flagNames = _.pluck(_.where(storedSettings.flags, {
                    visible: false
                }), 'id'),
                flags = _.difference(defaults.flags, flagNames),
                compare = _.values(storedSettings.compare),
                drawType = storedSettings.drawType || defaults.drawType;

            // Here we merge the serie params in the declaration & those stored in the settings
            //list of all series
            var params = _.union(optParams, compare),
                inCompareMode;

            if (params.length > 1) {
                //more than one series
                inCompareMode = true;
            }

            //figuring out the range selected
            var rs = _.where(this.config.rangeSelector.buttons, {
                    range: range
                }),
                selbtn;
            if (rs.length > 1) {
                selbtn = _.findWhere(rs, {
                    index: rs_prev
                })
            } else {
                selbtn = rs[0];
            }
            var rangeSelected = selbtn && selbtn.index;

            //update the main model
            var model = this.model;
            model.set({
                currentRange: range,
                chartType: 'line', //chartType,
                rangeSelected: rangeSelected
            });

            //update the flags
            this.flags.add_selection(flags);

            var isHist = model.isHist();
            //pass some selection options 


            this.add_mainChart({
                type: 'primary',
                name: chartOpt.primary_chartName,
                param: [params[0]], //pass the first series params
                inCompareMode: inCompareMode,
                isHist: isHist,
                selectedRangeBtn: selbtn.index,
                chartMode: model.get('chartMode')
            });

            if (inCompareMode) {
                //add compare
                this.add_compare({
                    param: params.slice(1)
                });
            }

            this.remaining = {
                overlays: _.values(storedSettings.overlays),
                indicators: _.values(storedSettings.indicators),
                retracements: _.values(storedSettings.retracements),
                crosshairs: _.values(storedSettings.crosshairs),
                trendlines: _.values(storedSettings.trendlines),
                draw: drawType,
                chartType: chartType,
                lineType: lineType
            };
            this.remaining.serieName = storedSettings.serieName;




            //for submenus
            returns.submenusSelected = _.union(flags, [chartType], [lineType], [drawType]);

            //for rangeSelector
            returns.rangeSelected = rangeSelected;
            //return all default selections for the UI
            /*            if (!isHist) {            //-sk
                            this.remove_overlays();
                            //for nav
                            //returns.disableNav = true;
                            //model.hideComponents();
                        }
                        */
            return returns;
        },

        loadSaveWidget: function(args) {
            // var currSerie = this.model.getPrimarySerie();
            // this.removeSerie([currSerie['id']], currSerie);
            var q, p, tempSettingsArray = [],
                nav = this.nav;
            this.remove_allDrawInstances(true);
            this.toggle_events();
            this.remove_overlays();
            this.remove_indicators();
            this.remove_retracements();
            this.remove_trendlines();


            if (this.stateModel && this.stateModel.attributes && this.stateModel.attributes['savedCustomSetting']) {

                tempSettingsArray = this.stateModel.attributes['savedCustomSetting'];
                if (tempSettingsArray.length > 0) {
                    for (var setting in tempSettingsArray) {
                        if (tempSettingsArray[setting].hasOwnProperty(args.data)) {
                            q = tempSettingsArray[setting][args.data].overlays;
                            for (var over in q) {
                                this.add_overlays({
                                    attr: q[over],
                                    redraw: true,
                                    uploading: true
                                });
                            }
                            p = tempSettingsArray[setting][args.data].indicators;
                            for (var indi in p) {
                                this.add_indicators({
                                    attr: p[indi],
                                    redraw: true
                                });
                            }
                            this.toggle_events();

                            // ankitz: loading chartType & lineType on click of saved setting
                            if (typeof this.config.chart.isChartTypeSavable != 'undefined' && this.config.chart.isChartTypeSavable) {
                                var savedChartType = tempSettingsArray[setting][args.data].chartType;
                                if (typeof savedChartType != "undefined") {
                                    if (nav) {
                                        nav.subMenuClicked({
                                            target: {
                                                id: savedChartType
                                            }
                                        });

                                    }

                                }
                            }

                            if (typeof this.config.chart.isLineTypeSavable != 'undefined' && this.config.chart.isLineTypeSavable) {
                                var savedlineType = tempSettingsArray[setting][args.data].lineType;
                                if (typeof savedlineType != "undefined") {
                                    if (nav) {
                                        nav.subMenuClicked({
                                            target: {
                                                id: savedlineType
                                            }
                                        });

                                    }


                                }
                            }
                            return; //Return after setting is found
                        }
                    }
                }
            }
        },

        saveWidget: function(args) {

            var savechartname = prompt("Save current chart", "XYZ");
            if (!this.validateCustomSetting(savechartname)) {
                return; //Return without saving if Setting is invalid
            }

            this.stateModel[savechartname] = this.stateModel._previousAttributes;
            var a = this.$('.settingsUl');
            b = a.append('<li><div id=' + savechartname + ' class= "settingsEntry">' + savechartname + '<div id="remove_' + savechartname + '" class="view-btn xbutton">x</div></div></li>');
            c = this.$('#' + savechartname);
            c.click(savechartname, this.loadSaveWidget);

            var customSettingArray = (this.stateModel && this.stateModel.attributes && this.stateModel.attributes['savedCustomSetting']) ? this.stateModel.attributes['savedCustomSetting'] : [];

            var tempObj = {};
            tempObj[savechartname] = {
                overlays: this.stateModel._previousAttributes.overlays,
                indicators: this.stateModel._previousAttributes.indicators,
                lineType: this.stateModel._previousAttributes.lineType,
                chartType: this.stateModel._previousAttributes.chartType
            };


            customSettingArray.push(tempObj)
            this.stateModel.attributes['savedCustomSetting'] = customSettingArray;

            this.stateModel.save();
            this.$('#remove_' + savechartname).click(savechartname, this.removeCustomView);

        },
        /**
         * This method removes the custom saved setteing of the user
         *
         * @method removeCustomView
         * @param {Object} id
         * @private
         */
        removeCustomView: function(id) {
            this.$('#' + id.data).parent().remove();
            if (this.stateModel && this.stateModel.attributes && this.stateModel.attributes['savedCustomSetting']) {

                tempSettingsArray = this.stateModel.attributes['savedCustomSetting'];
                if (tempSettingsArray.length > 0) {
                    for (var setting in tempSettingsArray) {
                        if (tempSettingsArray[setting].hasOwnProperty(id.data)) {
                            tempSettingsArray.splice(setting, 1);
                            this.stateModel.attributes['savedCustomSetting'] = tempSettingsArray;
                            this.stateModel.save(); //Removing the setting from the LocalStorage
                            //Removing the setting from the UI-View

                            //stateModel.attributes.savedCustomSetting.splice(2,1)
                        }
                    }
                }
            }

        },
        /**
         * This method removes the custom saved setteing of the user
         *
         * @method validateCustomSetting
         * @param {string} settingName
         * @private
         */
        validateCustomSetting: function(settingName) {
            var tempSettingsArray = [];

            //BLANK NAME CHECK
            if (settingName == null || settingName.toString().trim() == "") {

                return false;
            }

            //DUPLICATE NAME CHECK
            if (this.stateModel && this.stateModel.attributes && this.stateModel.attributes['savedCustomSetting']) {

                tempSettingsArray = this.stateModel.attributes['savedCustomSetting'];
                if (tempSettingsArray.length > 0) {
                    for (var setting in tempSettingsArray) {
                        if (tempSettingsArray[setting].hasOwnProperty(settingName)) {
                            alert("A Chart with the same exists, Please give a different name.");
                            return false; //Return if any same named setting is found
                        }
                    }
                }
            }

            //MAX LIMIT
            if (tempSettingsArray.length >= 5) {

                alert("Maximum 5 Settings can be saved!!");
                return false; //Return if any same named setting is found

            }

            return true; //Valid Setting-Name entered by user

        },

        /**
         *  This method creates a new instance of the ChartView. This view helps in actual loading of Highcharts into the widgte
         *  Attaches listeners to the chart once rendered used for various user interactions/ grabbing readings etc
         *  Used Internally
         *
         *  @method add_mainChart
         *  @param {Object} args
         *  @private
         */
        add_mainChart: function(args) {


            var chart = new ChartView({
                config: this.config,
                collection: this.seriesList,
                param: args.param,
                model: this.model,
                name: args.name,
                chartMode: args.chartMode,

                messenger: this.messenger,
                eventMap: this.eventMap,
                isTouch: this.isTouch,

                inCompareMode: args.inCompareMode,
                isHist: args.isHist,
                selectedRangeBtn: args.selectedRangeBtn,
                btns: this.btns,

                //callbacks
                addCrosshair: this.addCrosshair,
                manageMouseMove: this.manageMouseMove,
                //syncExtremes: this.syncExtremes,
                syncInstances: this.syncInstances,

                xHairs: this.xHairsList,
                charts: this.chartRefList,

                //passing components
                flags: this.flags,
                crosshairs: this.crosshairsList,
                trendlines: this.trendlinesList,
                // ANKITZ
                trendlinesIndicatorList: this.trendlinesIndicatorList,
                retracements: this.retracementsList,
                callback: _.bind(function(chartRef) {

                    if (this.rangeSelector && this.model.get('hasDateView')) {
                        $(chartRef.xAxis[0]).on('afterSetExtremes', this.rangeSelector.updateDate);
                        //hack to make sure afterSetExtremes is always called on page reload
                        chartRef.xAxis[0].isDirtyExtremes = true;
                    }

                    if (!args.inCompareMode) {

                        //upload selection
                        this.uploadSelection(false);

                        chartRef.redraw();

                        //draw initial readings
                        this.currentReadings();
                    }

                    this.model.set({
                        onLoad: false,
                        ready: true,
                        fatalError: false
                    });
                }, this)
            });

            this.mainChartView = chart;
        },

        /**
         *  This method returns the HighChart's chart reference {@link http://api.highcharts.com/highstock HighStock API}
         *
         *  @method getChartRef
         *  @public
         */
        getChartRef: function() {
            return this.mainChartView.chartRef;
        },

        /**
         *
         *  @method addCrosshair
         *  @private
         *  @deprecated Use it only if you want to have custom reading's crosshair. Caution: does not sync 100% with data read
         */
        addCrosshair: function(id) {
            // <i>this</i> is bound to either main chart or indicator chart view
            // this function adds a crosshair to the chart

            if (this.model.get('hasCrosshair') === false) {
                //if false, don't add
                return;
            }

            var chart = this.chartRef;
            var top = chart.plotTop,
                bottom = chart.plotTop + chart.plotHeight;

            var crosshair = chart.renderer.path(['M', 0, top, 'L', '0', bottom])
                .attr(this.options.config.crosshair_css || {
                    stroke: 'black'
                })
                .add()
                .toFront()
                .hide();

            this.options.xHairs.push({
                id: id,
                ref: crosshair
            });
            return crosshair;
        },

        /**
         *  This method adds a snapshot view to the chart. Best if Not used externally
         *
         *  @method add_snapshot
         *  @param {Object|Model} model - serie or overlay model
         *  @private
         *
         */
        add_snapshot: function(model) {
            if (!model || model.get('hasError')) {
                return;
            }
            try {
                var snapshot = new SnapshotView({
                    model: model,
                    mode: this.model.get('chartMode'),
                    hasVolume: this.model.get('hasVolume'),
                    config: this.config.chart
                });
                //console.log(snapshot.el, 'snapshot');
                this.$('.snapshot-wrpr').append(snapshot.el);
            } catch (e) {
                this.messenger.warn({
                    model: model,
                    error: e,
                    msg: "Failed to add " + model.id + "'s snapshot to the chart",
                    on: "adding snapshot"
                })
            }
        },

        /**
         *  This method moves the tooltip between main & indicator charts in sync, reads the currently hovered tooltip. used Internally
         *  @todo this function might need to handle touch events (not sure though)
         *
         *  @method manageMouseMove
         *  @private
         *  @param {Object} e jQuery Event Object
         *  @param {String} id Id of the chart/ graph
         *  @param {Object} extent chart coordinated
         */
        manageMouseMove: function(e, id, extent) {
            // <i>this</i> is bound to StockWidgetView
            var x = e.offsetX || e.originalEvent.layerX,
                y = e.offsetY || e.originalEvent.layerY,
                param = {
                    x: x,
                    y: y,
                    isInsidePlot: x > extent.left && x < extent.right && y > extent.top && y < extent.bottom,
                    isInsideChart: x > extent.left && x < extent.right && y >= extent.chartTop && y <= extent.chartBottom
                },
                inCompareMode = this.model.inCompareMode(),
                isHist = this.model.isHist();

            if (/mousemove|touchmove/i.exec(e.type)) { //if(e.type === this.eventMap.move){
                if (param.isInsidePlot) {
                    // Updating tooltip position for indicator charts
                    //if(!inCompareMode && isHist){                 --SK
                    if (!inCompareMode) {
                        this.chartRefList.each(function(o) {
                            //only for graphs apart from the current one
                            if (o.id !== id) {
                                var graph = o.get('ref');
                                //Highcharts internal function to manage the tooltip
                                var f = graph.pointer.normalize(e);
                                graph.pointer.runPointActions(f);
                            }
                        });
                    }

                    //grab the readings
                    this.currentReadings(e);
                }

                //sync the crosshairs - uncomment if using custom tooltip crosshairs
                //  this.syncCrosshair(e, id, param);
            } else if (e.type === 'mouseleave') {
                //reset the tooltip
                if (!inCompareMode && isHist) {
                    this.chartRefList.each(function(o) {
                        //only for graphs apart from the current one
                        //if(o.id !== id){
                        var graph = o.get('ref');
                        graph.pointer.reset();
                        graph.pointer.chartPosition = null;
                        //}
                    });
                }
            }
        },

        /**
         *  This method grabs the current readings of various chart components
         *  - reads main series (in header or snapshots), overlays & indicators
         *  @todo Optimizing this will really impact the performance as this is called on every mouse event
         *
         *  @method currentReadings
         *  @param {EventObject} [e]
         *
         */
        currentReadings: function(e) {
            //not adding try catch here as if one fails other readings won't be displayed
            var model = this.model;
            if (!model.get('hasReadings') && !this.readings) {
                return;
            }

            var chart = this.getChartRef(),
                index, serie, x, approx_x;
            if (e) {
                var f = chart.pointer.normalize(e);
                index = chart.pointer.getIndex(f);

            } else {
                serie = model.getPrimarySerie();
                var ref = serie.get('serie'),
                    grabLast = true;
                var tooltipPoints = ref && ref.tooltipPoints;
                if (!tooltipPoints) {
                    //TODO: throw ERROR ??
                    this.messenger.warn({
                        msg: "Oops! Couldn't read the current values. Try reloading the page",
                        on: 'reading the values'
                    });
                    return;
                }

                index = tooltipPoints && tooltipPoints.length - 1;

                var ttpl = tooltipPoints[index];
                if (!ttpl) {
                    //TODO: throw ERROR ??
                    this.messenger.warn({
                        msg: "Oops! Couldn't read the current values. Try reloading the page",
                        on: 'reading the values'
                    });
                    return;
                }
                approx_x = ttpl.x;
            }

            if (!model.inCompareMode()) {
                //not in compare mode

                //update ohlc readings
                if (this.readings && !this.readings.isHidden) {
                    serie = serie || model.getPrimarySerie();
                    serie.trigger('update-ohlc-readings', serie, index);
                }

                //if(model.isHist()){                       -- Enabled Menu for one day one week SK
                //only if isHist, else overlays, indicators would be hidden
                //var  coord = chart.pointer.getCoordinates(f),
                //x = coord.xAxis[0].value;

                if (!grabLast || model.get('onLoad')) { // hack to show correct readings for overlays & indicators when range is updated
                    approx_x = approx_x || f && chart.xAxis[0].toValue(f.x); //chart.pointer.getCoordinates(f).xAxis[0].value

                    //approx_x value is not accurate, so we do this
                    x = Date.parse(new Date(approx_x).toDateString());

                    //triggering a single event on the overlays collection
                    this.overlaysList.trigger('update-readings', index, x);
                }

                if (!grabLast) {
                    //loop through indicators
                    this.indicatorsList.each(function(indicator) {
                        indicator.trigger('update-readings', index, x);
                    });
                }
                //}
            } else {
                //if(!model.isHist()){
                //loop through all compare series
                this.seriesList.trigger('update-readings', index);
            }
        },

        /**
         *  @method syncCrosshair
         *  @param {Object} e jQuery Event Object
         *  @param {String} id Id of the chart/ graph
         *  @param {Object} param
         *  @private
         *  @deprecated Use it if using custom crosshairs
         */
        syncCrosshair: function(e, id, param) {
            // <i>this</i> is bound to StockWidgetView
            if (!this.model.get('syncCrosshair')) {
                return;
            }

            if (param.isInsidePlot) {
                this.xHairsList.each(function(o) {
                    var crosshair = o.get('ref');
                    crosshair.show();
                    crosshair.attr('transform', 'translate(' + param.x + ', 0)');
                });
            } else /*if(!param.isInsideChart)*/ {
                this.xHairsList.each(function(o) {
                    var crosshair = o.get('ref');
                    crosshair.hide();
                });
            }
        },

        /**
         *  This function updates the calculation of indicator & overlay instances on every range charge
         *  Internally it will even handle the syncing of indicators & main chart extremes
         *
         *  @method syncInstances
         *  @private
         */
        syncInstances: _.debounce(function(e, id) {
            var isHist = this.model.isHist(),
                inCompareMode = this.model.inCompareMode();

            if (!isHist && inCompareMode) {
                //no need to sync extremes in non-hist & compare mode
                return;
            }

            if (e.triggerOp === 'navigator-drag' || e.trigger === 'zoom') {
                //if this setExtremes is set by navigaror handles drag operation or pinch or zoom
                this.rangeButtons.trigger('blurRS');
            }

            /*var priSerie = this.model.getPrimarySerie();
            priSerie.extractData({
                min: e.min, 
                max: e.max
            });*/

            this.overlayView && this.overlayView.reload(true, true);

            this.indicatorsList.each(function(i) {
                i.reload(true, true);
            });
        }, chartConf.debounceTime),

        /**
         *   This function is useful to syncExtremes of main chart & indicators (DOES NOT ADAPT TO RANGE CHANGES)
         *   It even syncs the grouping of indicators with the main chart if grouping is enabled
         *
         *  @method syncExtremes
         *  @deprecated This method does not make the overlays & indicator instances adapt to the range. It only syncs their extremes
         */

        //DO NOT DELETE THIS FUNCTION EVEN IF ITS NOT IN USE as:
        //  1. It might help revert back later
        //  2. May be useful to handle grouping later

        /*syncExtremes:  _.debounce(function(e, id){
            var isHist = this.model.isHist(),
                inCompareMode = this.model.inCompareMode();

            if(!isHist && inCompareMode){
                //no need to sync extremes in non-hist & compare mode
                return;
            }

            if(e.trigger === 'navigator'){
                this.rangeButtons.trigger('blurRS');
            }

            var indicators = this.indicatorsList;

            var dataGrouping = this.config.dataGrouping.enable;
            this.chartRefList.each(function(o){
                //only for graphs apart from the current one
                var graph = o.get('ref');
                if(o.id === id){
                    dataGrouping = dataGrouping && graph.series[0].currentDataGrouping;
                }else{
                    var model = indicators.get(o.id);
                    if(model && model.get('visible')){
                        if(dataGrouping){
                            //set the other graphs to the same data grouping
                            var opt = {
                                dataGrouping : {
                                    units: [[dataGrouping.unitName , [dataGrouping.count]]]
                                }
                            };
                            _.each(graph.series, function(serie){
                                serie.update( opt, false);
                            });
                        }
                        //now change the extremes
                        graph.xAxis[0].setExtremes( e.min, e.max );
                    }
                }
            });
}, chartConf.debounceTime),*/


        /**
         *  This method acts as the control hub for all user menu selection handler.
         *  This function acts as the callback handler to any event on the menu. @see the event bindings section in initialize method
         *  Can be used externally if you understand how to control it properly. @See {@link #updateRange updateRange}
         *
         *  args structure :
         *  {
         *      attr    : submenu model's attributes JSON ,
         *      model   : eventModel // model passed as a param when called dynamically,
         *      redraw  : true or false,
         *      value   : value of the model's key,
         *      _finally: callback for submenu ui setting or unsetting
         *  }
         *
         *  @method manageOperation
         *  @param {Object} model - a subMenu model or the model causing the event
         *  @param value
         *  @private
         */
        manageOperation: function(model, value) {

            var viewModel = this.model,
                submenu,
                eventModel,
                attr = model.toJSON();

            !value && viewModel.loading();
            if (model instanceof SubMenuModel) {
                submenu = model;
            } else {
                //when a feature is acted upon from outside menu or programatically
                //setting eventModel as the input model
                eventModel = model;

                //get the submenu instance
                submenu = this.submenusList.get(attr.name || attr.id); // name will be there for overlays & not for indicators, others
                attr = submenu.toJSON();
            }

            var type = attr.type,
                operation;

            attr.subtype = attr.id;

            //constructing the callback function's name
            if (type === 'chartType' || type === 'lineType')
                operation = 'change';
            else if (type === 'events')
                operation = 'toggle';
            else if (!attr.selected)
                operation = 'add';
            else
                operation = 'remove';

            var op = operation + '_' + type,
                fn = this[op];

            if (fn) {
                fn({
                    attr: attr,
                    model: eventModel,
                    redraw: true,
                    value: value,
                    _finally: _.once(function() {
                        //change the selected key of the submenu model when the operation is successful - only once
                        //this would result in selection of  the menu item's view
                        submenu.toggle();
                        !value && viewModel.loaded();
                    })
                });

            } else {
                this.messenger.warn({
                    msg: "Function " + op + " doesn't exist",
                    on: "executing operation"
                });
            }
        },

        /**
         *  This method adds an overlay to the chart. only in Hist mode & while not comparing
         *  It requires atleast a submenu model / or a model which provides details to the overlayModel
         *  A popup can be added to take user input from the user. Need to add a key in the config file for that particular overlay
         *      eg. check how sma|ema is configured
         *  args structure is as documented in {@link #manageOperation manageOperation} method
         *e
         *  We only have one overlay view as an individual view is not required. Each overlay instances has its own Overlay Model
         *
         *  @method add_overlays
         *  @param {Object} args
         *  @public
         */
        add_overlays: function(args) {
            var model = this.model;
            if (!model.get('allowOverlays')) {
                this.messenger.warn({
                    msg: "Adding overlays is restricted in the current widget",
                    on: "adding overlays",
                    data: args
                });
                return false;
            }


            if (model.inCompareMode()) {
                this.messenger.warn({
                    msg: "Adding overlays not available in compare mode",
                    on: "adding overlays",
                    data: args
                });
                return false;
            }

            args = args || {};

            var view = this,
                attr = args.attr,
                type = attr && attr.type || 'overlays',
                callback = function(values) {
                    values = values || (attr ? [attr.param] : null);
                    //get the chart ref
                    var chart = view.getChartRef(),
                        primarySerie = model.getPrimarySerie();

                    //Creating One Overlay View for all overlays
                    view.overlayView = view.overlayView || new OverlaysView({
                        collection: view.overlaysList,
                        chart: chart,
                        serie: primarySerie
                    });

                    //Add values.length no of overlays
                    for (var i = 0, len = values.length; i < len; i++) {
                        try {
                            //create a new overlay & display it
                            var id, title, colour,
                                message, error, msgType = 'success';
                            if (attr.title) { //title will be presentonly for entries from the local storage
                                id = attr.id;
                                title = attr.title;
                            } else {
                                id = (attr.id !== 'psar') ? attr.id + _.values(values[i]).join('_') : attr.id;
                                title = attr.title || (attr.titleHd || attr.id) + ' (' + _.values(values[i]).join(',') + ')';
                            }

                            if (!attr.colour) {
                                //find the colours already in use, grab the first not in use
                                var coloursUsed = view.overlaysList.pluck('colour');
                                colour = _.difference(view.config.chart.overlayColours, coloursUsed)[0];
                            }

                            var overlayModel = new OverlayModel({
                                param: values[i],
                                id: id,
                                name: attr.name || attr.id,
                                title: title,
                                type: type,
                                colour: attr.colour || colour,
                                opacity: attr.opacity,
                                readFromInput: attr.readFromInput,
                                redraw: args.redraw
                            });
                            view.overlaysList.add(overlayModel);

                        } catch (e) {
                            //set error key in the model
                            overlayModel && overlayModel.error();

                            msgType = 'error';
                            message = e.message;
                            error = e;

                            //delete the model from the collection
                            view.overlaysList.remove(overlayModel);
                        } finally {
                            //if successful
                            if (!error) {
                                //save state
                                if (!view.remaining && view.stateModel) {
                                    view.stateModel.add('overlays', overlayModel.pluckState());
                                }

                                args._finally && args._finally() || view.submenusList.select([overlayModel.get('name')]);
                            }

                            var data = overlayModel && overlayModel.toJSON() || attr;

                            if (!args.uploading || error) {
                                view.messenger[msgType]({
                                    msg: (args.attr.value || message || data.title) + ' added successfully',
                                    error: error,
                                    data: data,
                                    on: 'adding ' + (data.title || title) + ' overlay'
                                });
                            }

                            if (!args.uploading && error) {
                                model.loaded();
                            }
                        }
                    }

                    //view.overlayView.updateReadings();
                };

            if (attr && attr.popup) {
                this.renderPopup({
                    param: attr.param,
                    popupOpt: attr.popupOptions,
                    name: attr.value,
                    loaded: _.bind(model.loaded, model), // Fix- loading screen now disappears on popup cancel 
                    callback: callback
                });
            } else {
                var param = args.param;
                if (param instanceof Array) {
                    for (var i = 0, len = param.length; i < len; i++) {
                        attr = param[i];
                        callback();
                    }
                } else {
                    callback();
                }
            }
        },

        /**
         *  This method removes all or desired overlays from the chart
         *
         *  @method remove_overlays
         *  @param {Object} [args] args should contain a model key with value as an submenu or overlay Model
         *  @param {Boolean} [skipMsg] whether to display a message
         *  @public
         */
        remove_overlays: function(args, skipMsg) {

            try {
                var evtModel = args && args.model,
                    id, name, ids,
                    models,
                    error = false,
                    msgType = 'success',
                    message;

                if (!args) {
                    //remove all overlays
                    args = this.overlaysList.pluck('id');
                    if (!args.length) {
                        skipMsg = true;
                        return;
                    }
                    this.overlaysList.remove(args);
                    ids = 'All';

                    //logic for unsetting the submenu
                    this.submenusList.trigger('reset', 'overlays');
                    this.stateModel && this.stateModel.reset('overlays');

                } else {
                    //remove individual overlay

                    if (!evtModel) {
                        //thru menu click
                        id = (typeof args === 'string') ? args : args.attr.id;
                        name = id;
                        models = this.overlaysList.where({
                            name: id
                        });
                    } else {
                        // thru view close or programatically
                        id = evtModel.get('id');
                        name = evtModel.get('name');
                        models = [this.overlaysList.get(id)]
                    }

                    //models of same type
                    //There can be multiple instances of SMAs / EMAs
                    var similarModels = this.overlaysList.where({
                        name: name
                    });

                    if (models.length) {
                        this.overlaysList.remove(models);

                        //The submenu should be toggled only when all instances of that type are removed
                        if (models.length === similarModels.length && args._finally) {
                            args._finally();
                        }

                        //remove the entries from LS
                        ids = _.pluck(models, 'id');
                        this.stateModel && this.stateModel.remove('overlays', ids);
                    }
                }
            } catch (e) {
                error = e;
                msgType = 'error';
                message = e.message;
            } finally {
                !skipMsg && this.messenger[msgType]({
                    error: error,
                    msg: (args.attr.value || message || ids) + ' overlay removed successfully',
                    on: 'removing overlays',
                    loaded: true
                });
            }
        },

        /**
         *  This method toggles the visibility of all the overlays
         *
         *  @method toggle_overlays
         *  @public
         */
        toggle_overlays: function() {
            if (this.overlaysList && this.overlaysList.length) {
                var view = this;
                this.overlaysList.each(function(overlay) {
                    overlay.toggle();
                    view.stateModel && view.stateModel.update('overlays', overlay.pluckState())
                })
            }
        },

        /**
         *  This method adds an indicator to the bottom of the chart. (only in Hist mode & while not comparing )
         *  It requires atleast a submenu model /r or a model which provides details to the overlayModel
         *  @todo A popup can be added to take user input from the user. but would need to refactor the logic as in add_overlays
         *  args structure is as documented in {@link #manageOperation manageOperation} method
         *
         *  Each indicator has its own view & model instance
         *
         *  @method add_indicators
         *  @param {Object} args
         *  @public
         */
        add_indicators: function(args) {
            var model = this.model;
            args = args || {};

            if (!model.get('allowIndicators')) {
                this.messenger.warn({
                    msg: "Adding Indicators is restricted in the current widget",
                    on: "adding indicators",
                    data: args
                });
                return false;
            }

            //if(!this.model.isHist()) {
            /*
                            this.messenger.warn({
                                msg: "You can add indicators only when viewing historical data",
                                on: "adding indicators",
                                data: args
                            });
//return false;*/

            //}

            if (model.inCompareMode()) {
                this.messenger.warn({
                    msg: "Adding indicators is disabled in compare mode",
                    on: "adding indicators",
                    data: args
                });
                return false;
            }

            var primarySerie = model.getPrimarySerie();

            var view1 = this,
                attr,
                type = attr && attr.type || 'indicators',
                param;
            if (args.param instanceof Array) {
                attr = args.param;
            } else {
                attr = [args.attr];
            }


            callback = function(values) {
                // if(attr instanceof Array){
                //     attr = attr[0];
                // }

                values = values || [attr[0].param];
                var chart = view1.getChartRef(),
                    selBtn = view1.rangeButtons.findWhere({
                        selected: true
                    }),
                    selBtnOpt = selBtn ? [selBtn.toJSON()] : [],
                    serie = primarySerie.get('serie'),
                    currentDataGrouping = view1.config.dataGrouping.enable && serie && serie.currentDataGrouping,
                    dataGrouping,
                    getExtremes;

                if (currentDataGrouping) {
                    dataGrouping = {
                        units: [
                            [currentDataGrouping.unitName, [currentDataGrouping.count]]
                        ]
                    }
                }

                if (!selBtnOpt.length) {
                    //getExtremes = chart.xAxis[0].getExtremes();
                }

                var error, message, msgType = 'success',
                    indicator;
                try {
                    var c_attr = {};

                    for (var app in attr[0]) {
                        if (app == 'param') {
                            c_attr[app] = values[0];
                        } else {
                            c_attr[app] = attr[0][app];
                        }
                    }

                    var opt = view1.submenusList.get(c_attr.id);

                    var keys = _.omit(opt && opt.toJSON(), 'selected');
                    // c_attr["param"] = values[0];
                    if (keys && keys.param && c_attr.id == "rsi") {
                        keys.param = values[0] || keys.param;
                    }

                    indicator = new IndicatorModel(_.extend(c_attr, keys));

                    view1.indicatorsList.add(indicator);

                    var indicatorView = new IndicatorsView({
                        model: indicator,
                        serie: primarySerie,
                        config: view1.config,
                        charts: view1.chartRefList,
                        xHairs: view1.xHairsList,

                        selectedRangeBtn: selBtnOpt,
                        getExtremes: getExtremes,
                        dataGrouping: dataGrouping,

                        addCrosshair: view1.addCrosshair,
                        manageMouseMove: view1.manageMouseMove,
                        //syncExtremes: this.syncExtremes
                    });

                    view1.renderCharts({
                        view: indicatorView
                    });

                } catch (e) {
                    error = e;
                    message = e.message;
                    msgType = 'error';

                    view1.indicatorsList.remove(indicator);
                } finally {
                    if (!error) {
                        //store the selection
                        if (!view1.remaining && view1.stateModel) {
                            view1.stateModel.add('indicators', indicator.pluckState());
                        }

                        args._finally && args._finally() || view1.submenusList.select([indicator.id]);
                    }

                    if (!args.uploading || error) {
                        var data = (indicator && indicator.attributes || c_attr);
                        view1.messenger[msgType]({
                            msg: message || data.value + " indicator added successfully",
                            error: error,
                            on: 'adding ' + data.value + ' indicator',
                            data: data
                        });
                    }

                    if (!args.uploading && error) {
                        view1.model.loaded();
                    }
                }
            }
            for (var m = 0, len = attr.length; m < len; m++) {
                if (attr && attr[m] && attr[m].popup) {
                    //attr = attr[m];
                    this.renderPopup({
                        param: attr[m].param,
                        id: attr[m].id,
                        popupOpt: attr[m].popupOptions,
                        name: attr[m].value,
                        loaded: _.bind(this.model.loaded, this.model), // Fix- loading screen now disappears on popup cancel 
                        callback: callback
                    });
                } else {
                    var param = args.param;
                    if (param instanceof Array) {
                        for (var i = 0, len = param.length; i < len; i++) {
                            attr = [param[i]];
                            callback();
                        }
                    } else {
                        callback();
                    }
                    break;
                }
            }
        },

        /**
         *  This method removes all or desired indicators from the chart
         *
         *  @method remove_indicators
         *  @param {Object} [args] args should contain a model key with value as an submenu or indicator Model
         *  @param {Boolean} [skipMsg] whether to display a message
         *  @public
         */
        remove_indicators: function(args, skipMsg) {
            try {
                var message, msgType = 'success',
                    error = false,
                    ids;
                if (!args) {
                    //remove all indicators
                    args = this.indicatorsList.pluck('id');
                    if (!args.length) {
                        skipMsg = true;
                        return;
                    }
                    this.indicatorsList.remove(args);
                    ids = 'All';

                    //logic for unsetting the submenu
                    this.submenusList.trigger('reset', 'indicators');
                    this.stateModel && this.stateModel.reset('indicators');

                } else {
                    //remove a particular instance
                    var indicator = (args.model) ? args.model : this.indicatorsList.get(args.attr.id);
                    var indicatorName = indicator.get('value');
                    this.indicatorsList.remove(indicator);
                    ids = indicator.get('id');

                    this.stateModel && this.stateModel.remove('indicators', ids);

                    args._finally && args._finally();
                }
            } catch (e) {
                error = e;
                msgType = 'error';
                message = e.message;
            } finally {
                !skipMsg && this.messenger[msgType]({
                    error: error,
                    msg: (message || indicatorName || ids) + ' indicator removed successfully',
                    on: 'removing indicators',
                    loaded: true
                });
            }
        },

        /**
         *  This method toggles the visibility of all the indicators
         *
         *  @method toggle_indicators
         *  @public
         */
        toggle_indicators: function() {
            if (this.indicatorsList && this.indicatorsList.length) {
                var view = this;
                this.indicatorsList.each(function(indicator) {
                    indicator.toggle();
                    view.stateModel && view.stateModel.update('indicators', indicator.pluckState());
                });
            }
        },

        /**
         *  This method changes the chartType of the graph. Current options - line, ohlc, candlestick
         *
         *  @method change_chartType
         *  @param {Object} [args] args should contain a model key with value as an submenu or indicator Model
         *  @public
         */
        change_chartType: function(args) {

            args = args || {};
            if ($('#weekly')[0] && $('#weekly')[0].classList[1]) {
                args.ids = 'weekly';
            } else if ($('#monthly')[0] && $('#monthly')[0].classList[1]) {
                args.ids = 'monthly';
            } else if ($('#daily')[0] && $('#daily')[0].classList[1]) {
                args.ids = 'daily';
            } else {
                args.ids = 'daily';
            }
            var currentSerie = this.model.getPrimarySerie(),
                currChartType = currentSerie.get('chartType'),
                redraw = args.redraw || false,
                error, message, msgType = 'success',
                skipMsg = args.skipMsg,
                to;
            if (args.attr) {
                var selected = args.attr.selected;
                to = args.attr.subtype;
            } else if (typeof args.param === 'string') {
                to = args.param;
            }
            if (selected !== true) {
                if (currChartType !== to) {
                    if (to == 'line' || to == 'candlestick' || to == 'ohlc') {
                        try {
                            currentSerie.updateData({
                                chartType: to,
                                lineType: args.ids,
                                ids: args.ids,
                                isHist: this.model.isHist(),
                                redraw: redraw
                            }); //!!!redraw

                            currentSerie.set({
                                'chartType': to
                            }, {
                                'lineType': args.ids
                            }, {
                                'ids': args.ids
                            }, {
                                silent: args.silent || false
                            });

                        } catch (e) {
                            error = e;
                            message = e.message;
                            msgType = 'error';
                        } finally {

                            if (args.uploading) {
                                skipMsg = true;
                            }
                            if (!skipMsg || error) {
                                this.messenger[msgType]({
                                    error: error,
                                    msg: message || 'Chart type changed successfully to ' + to,
                                    on: 'changing chartType to ' + to
                                });
                            }

                            if (!args.uploading && error) {
                                this.model.loaded();
                            }

                            !error && this.stateModel && this.stateModel.toggle('chartType', to);
                        }
                    }
                }
            }

            //if successful
            !error && args._finally && args._finally();
        },
        /**
         *  This method updates the chartType between line & others types when switching between ranges & when in compare mode
         *  Currently, in intra/week or compare mode only line type is allowed. This is used internally & makes use of toggleSave method
         *
         *  @method toggle_chartType
         *  @param {Boolean} update whether to update the chart
         *  @param {Boolean} redraw whether to redraw the chart
         *  @private
         *  @see {@link toggleSave toggleSave}
         */
        toggle_chartType: function(update, redraw, args) {
            var currentSerie = this.model.getPrimarySerie(),
                currChartType = currentSerie.get('chartType');
            var alreadyStored = this.toggleSave(this.config.chart.toggleChartTypeKey, currChartType);
            var inCompareMode = !!args.inCompareMode;
            if (update) {
                //var serie = currentSerie.get('serie');
                var isHist = this.model.isHist();
                if (!alreadyStored && currChartType !== 'line') {
                    //change to line
                    currentSerie.updateData({
                        chartType: 'line',
                        isHist: isHist,
                        redraw: redraw || false
                    });
                } else {
                    currentSerie.updateData({
                        chartType: (inCompareMode) ? 'line' : (alreadyStored || currChartType),
                        isHist: isHist,
                        redraw: redraw || false
                    });
                }
            }
            return alreadyStored;
        },
        /**
         *  This method is the event callback/handler for any user draw menu interaction.
         *  It basically grabs the 2 type of x,y coordinates of the event: position in the chart (pos) & values of the coordinates at the event position (coord)
         *  Internally, it will call the necessary handler specific to the current draw mode & is passed various args.
         *  All draw event use this same function. Used Internally
         *
         *  @method event_handler
         *  @param {Object} e jQuery event handler
         *  @private
         */
        event_handler: function(e) {
            //<i>this</i> is bound to the event context
            var result = {},
                coord, pos,
                context = this,
                eData = e.data,
                chart = eData.chart,
                pointer = chart.pointer,
                isKeyEvent = /mousedown|mouseup|touchstart|touchend/i.exec(e.type),
                isMoveEvent = /mousemove|touchmove/i.exec(e.type);

            if (e.type === "touchend") {
                //console.log("touchend");
            }
            var f = pointer.normalize(e);
            if (isKeyEvent || isMoveEvent) {

                //iPAD BUG FIX: Trendlines are not inserted because touchend event has an empty touches list
                //hence chartX, chartY position in 'f' are wrong
                //This issue was logged on Highcharts but they didn't reply to it: https://github.com/highslide-software/highcharts.com/issues/2757
                if (e.type === "touchend") {
                    var chartPosition = $(chart.container).offset(),
                        ePos = f.changedTouches[0],
                        chartX = Math.round(ePos.pageX - chartPosition.left);
                    chartY = Math.round(ePos.pageY - chartPosition.top);


                    //console.log("Before", e.type, f, f.changedTouches);
                    f.chartX = chartX;
                    f.chartY = chartY;
                    //console.log(f);
                }

                var coord = pointer.getCoordinates(f);
                pos = {
                    x: f.chartX,
                    y: f.chartY
                };
            } else if (e.type === 'click') {
                coord = e;
            }

            var xC = coord.xAxis[0],
                yC = coord.yAxis[0],
                x_coord, y_coord;

            if (eData.eventType === 'crosshair') {
                x_coord = xC.value;
                y_coord = yC.value;
            } else {
                //BUG FIX: trendline shift
                //xC.value had decimal points which meant some timeshift in the date
                //Fixing it by adjusting that timestamp to the start of the day
                x_coord = Date.parse(new Date(xC.value).toDateString()),
                    y_coord = yC.value;


                if (isKeyEvent) { //if its the first point or the last point
                    //adjust for holidays
                    x_coord = holidays.getNearestDate(x_coord);
                }

                //replacing pos
                //When x_coord is adjusted pos values also needs to get adjusted else there would be a small jump 
                //when the serie is inserted
                //CON: Dragging is not as smooth as before
                pos = {
                    x: xC.axis.toPixels(x_coord),
                    y: yC.axis.toPixels(y_coord)
                }
            }

            coord = {
                x: x_coord,
                y: y_coord
            }

            result.coord = coord;
            result.pos = pos;

            var isInsidePlot = chart.isInsidePlot(f.chartX - chart.plotLeft, f.chartY - chart.plotTop);
            if (!isInsidePlot || result.coord.y < 0) {
                //other yAxis clicked;
                return false;
            }

            var cb = eData.callback;
            if (cb) {
                cb({
                    param: result,
                    context: context,
                    chart: chart,
                    collection: eData.collection
                });
            }
        },

        /**
         *  This function is used by trendlines & retracements to start drawing the lines.
         *  The actual drawing of lines is handled by respective models when they are initialized. It even adds event listeners for dragging
         *
         *  @method start_drawlines
         *  @param {Object} args
         *  @private
         */
        start_drawlines: function(args) {
            //<i>this</i> is bound to the stockwidget_view object
            args = args || {};
            // console.log(args, 'start_drawlines');
            var param = args.param,
                context = args.context,
                chart = args.chart,
                collection = args.collection;

            if (param && param.coord && param.coord.x && param.coord.y) {
                var len = collection.length;
                collection.add({
                    init: param
                });
                var newLen = collection.length;

                if (newLen > len || collection.update) {
                    //attach a new mousemove event
                    $(context).bind(this.eventMap.move, {
                        callback: this.drag_drawlines,
                        chart: chart,
                        collection: collection
                    }, this.event_handler);
                }
            }
        },

        /**
         *  Used Internally for dragging lines. Calls the drag method of the current model
         *
         *  @method drag_drawlines
         *  @param {Object} args
         *  @private
         */
        drag_drawlines: function(args) {
            args = args || {};
            var param = args.param,
                context = args.context,
                chart = args.chart,
                collection = args.collection;


            if (param && param.coord && param.coord.x && param.coord.y) {
                var model = collection.getCurrent();
                if (model) {
                    model.drag(param);
                }
            }
        },

        /**
         *  This method adds x,y crosshair lines on the chart & even updates the localStorage. Used Internally.
         *  This function is invoked in two ways-
         *      1. Through the 'mouseup' event/user interaction on the chart
         *      2. Through uploadSelection (any prev crosshairs) stored in the localStorage
         *
         *  @method add_crosshairs
         *  @param {Object} args
         *  @private
         */
        add_crosshairs: function(args) {
            //<i>this</i> is bound to the view object
            args = args || {};
            var param = args.param,
                context = args.context,
                chart = args.chart,
                collection = args.collection;

            try {
                if (param instanceof Array) {
                    this.crosshairsList.add(param, args.redraw);
                } else if (param && param.coord && !_.isUndefined(param.coord.x && param.coord.y)) {
                    //only crosshairList.add returns the added model
                    var model = this.crosshairsList.add(param.coord);

                    if (model && this.stateModel) {
                        //We store the priSerie name in the localStorage as all the draw instances are for that particular serie only
                        var priSerie = this.model.getPrimarySerie()
                        this.stateModel.updateSerie(priSerie.get('name'));

                        this.stateModel.add('crosshairs', model.pluckState());
                    }
                }
            } catch (e) {
                this.messenger.error({
                    msg: e.message,
                    on: "adding crosshair",
                    data: param,
                    error: e
                });
            }
        },
        /**
         *  This method removes all the crosshairs from the chart
         *
         *  @method remove_crosshairs
         *  @public
         */
        remove_crosshairs: function(args) {
            try {
                args = args || {};

                args.loaded !== false && this.model.loading();

                var msgType = 'success',
                    message,
                    skipMsg = args.skipMsg || false,
                    error = false,
                    hasInstances = this.crosshairsList.length;

                if (!hasInstances) {
                    skipMsg = true;
                    return;
                }

                this.crosshairsList.reset();

                if (!this.crosshairsList.length) {
                    this.stateModel && this.stateModel.reset('crosshairs');
                } else {
                    throw new Error("Unable to delete all crosshairs")
                }
            } catch (e) {
                message = e.message;
                error = e;
                msgType = 'error';
            } finally {
                !skipMsg && this.messenger[msgType]({
                    msg: message || 'Crosshairs removed successfully',
                    on: "resetting crosshair",
                    error: error
                });

                if (args.loaded !== false) {
                    this.model.loaded();
                }
            }
        },

        /**
         *  This method adds the dragged trendline into the chart as a serie (handled by the trendline model internally)
         *  Currently, the drgged line is an SVG rendered line and when dropped it is added as a serie in the chart. Used internally
         *
         *  This function is invoked in two ways-
         *      1. Through the 'mouseup' event/user interaction on the chart
         *      2. Through uploadSelection (any prev trendlines) stored in the localStorage
         *
         *  @method add_trendlines
         *  @private
         */
        add_trendlines: function(args) {
            //unbind mousemove, if any
            try {
                //console.log("In Add trendlines");
                args = args || {};
                var param = args.param,
                    context = args.context,
                    chart = args.chart,
                    collection = args.collection;

                if (context) {
                    $(context).unbind(this.eventMap.move, this.event_handler);
                }

                if (param instanceof Array) {
                    this.trendlinesList.add(param, args.redraw);

                } else if (param && param.coord && !_.isUndefined(param.coord.x && param.coord.y)) {
                    var model = this.trendlinesList.getCurrent();

                    //console.log("Add trendlines", model);
                    if (model) {
                        model.final(param);
                        if (this.stateModel) {
                            var priSerie = this.model.getPrimarySerie()
                            this.stateModel.updateSerie(priSerie.get('name'));
                            this.stateModel.add('trendlines', model.pluckState());
                        }
                    }
                }
            } catch (e) {
                this.messenger.error({
                    msg: e.message,
                    on: "adding trendlines",
                    data: param,
                    error: e
                });
            }
        },

        /**
         *  Removes all the trendlines from the chart
         *
         *  @method remove_trendlines
         *  @public
         */
        remove_trendlines: function(args) {

            try {
                args = args || {};
                // console.log(this, 'in trendlines');
                args.loaded !== false && this.model.loading();

                var msgType = 'success',
                    message,
                    skipMsg = args.skipMsg || false,
                    error = false,
                    config = this.config,
                    hasInstances = this.trendlinesList.length;

                if (!hasInstances) {
                    skipMsg = true;
                    return;
                }

                this.trendlinesList.reset();

                if (!this.trendlinesList.length) {
                    this.stateModel && this.stateModel.reset('trendlines');

                    //redraw the chart
                    if (args.redraw) {
                        this.mainChartView.chartRef.redraw();
                    }
                } else {
                    throw new Error('Unable to delete all trendlines');
                }


                // ANKITZ
                if (this.trendlinesIndicatorList && config.chart.allowTrendlineOnIndicators) {

                    this.trendlinesIndicatorList.reset();

                    this.indicatorsList.each(function(model) {

                        var indicatorID = 'section#' + model.get('id');
                        var indicatorChartRef = model.view.chartRef;
                        var indicatorContainer = indicatorChartRef.container;


                        indicatorChartRef.redraw();




                    }, this);

                }









            } catch (e) {
                error = e;
                msgType = 'error';
                message = e.message
            } finally {
                !skipMsg && this.messenger[msgType]({
                    msg: message || 'Trendlines removed successfully',
                    on: "resetting trendlines",
                    error: error
                });

                if (args.loaded !== false) {
                    this.model.loaded();
                }
            }
        },

        /**
         *  This method adds the dragged retracements into the chart as a serie (handled by the retracement model internally)
         *  Currently, the drgged lines are an SVG rendered lines and when dropped they are added as series in the chart. Used internally
         *  This function is invoked in two ways-
         *      1. Through the 'mouseup' event/user interaction on the chart
         *      2. Through uploadSelection (any prev retracements) stored in the localStorage
         *
         *  @method add_trendlines
         *  @private
         */
        add_retracements: function(args) {
            //unbind mousemove, if any
            try {
                args = args || {};
                var param = args.param,
                    context = args.context,
                    chart = args.chart,
                    collection = args.collection;

                if (context) {
                    $(context).unbind(this.eventMap.move, this.event_handler);
                }

                if (param instanceof Array) {
                    this.retracementsList.add(param);

                } else if (param && param.coord && !_.isUndefined(param.coord.x && param.coord.y)) {
                    var model = this.retracementsList.getCurrent();
                    if (model) {
                        model.final(param);
                        if (this.stateModel) {
                            var priSerie = this.model.getPrimarySerie();
                            this.stateModel.updateSerie(priSerie.get('name'));
                            this.stateModel.add('retracements', model.pluckState());
                            this.getChartRef().yAxis[0]
                        }
                    }
                }
            } catch (e) {
                this.messenger.error({
                    msg: e.message,
                    on: "adding retracements",
                    data: param,
                    error: e
                });
            }
        },

        /**
         *  Removes all the retracements from the chart
         *
         *  @method remove_retracements
         *  @public
         */
        remove_retracements: function(args) {
            try {
                args = args || {};
                args.loaded !== false && this.model.loading();

                var msgType = 'success',
                    message,
                    skipMsg = args.skipMsg || false,
                    error = false,
                    hasInstances = this.retracementsList.length;

                if (!hasInstances) {
                    skipMsg = true;
                    return;
                }

                this.retracementsList.reset();
                if (!this.retracementsList.length) {
                    this.stateModel && this.stateModel.reset('retracements');

                    //redraw the chart
                    if (args.redraw) {
                        this.mainChartView.chartRef.redraw();
                    }
                } else {
                    throw new Error('Unable to delete all retracements');
                }
            } catch (e) {
                error = e;
                msgType = 'error';
                message = e.message
            } finally {
                !skipMsg && this.messenger[msgType]({
                    msg: message || 'Retracements removed successfully',
                    on: "resetting retracements",
                    error: error
                });

                if (args.loaded !== false) {
                    this.model.loaded();
                }
            }
        },

        /**
         *  Removes all the draw instances - crosshairs, trendlines, retracements from the chart
         *  @method remove_allDrawInstances
         *  @param {Boolean} showLoading - whether to show the loading screen
         *  @param {Boolean} skipMsg - whether to skip the msg for individual type
         *  @public
         */
        remove_allDrawInstances: function(showLoading, skipMsg) {
            showLoading && this.model.loading();

            this.remove_crosshairs({
                redraw: false,
                loaded: false,
                skipMsg: skipMsg
            });
            this.remove_trendlines({
                redraw: false,
                loaded: false,
                skipMsg: skipMsg
            });
            this.remove_retracements({
                redraw: false,
                loaded: false,
                skipMsg: skipMsg
            });
            //remove annotations

            showLoading && this.model.loaded();
        },

        /**
         *  This method is called through 'Draw' submenu click -> manageOperation. It changes the chart to that particular mode (trendline/crosshair/retracement/none)
         *  It bind various user mouse events with the chart
         *
         *  @method add_draw
         *  @private
         *  @todo Need to add support for touch events
         */
        add_draw: function(args) {
            try {
                args = args || {};

                var subtype = (typeof args.param === 'string') ? args.param : args.attr && args.attr.subtype,
                    chartView = this.mainChartView,
                    chart = this.getChartRef(),
                    config = this.config,
                    container = chart && chart.container,
                    eventMap = this.eventMap,
                    start = eventMap.start,
                    move = eventMap.move,
                    stop = eventMap.stop,
                    handles = this.isTouch ? ['on' + start, 'on' + move, 'onmousemove', 'onmousedown', 'touchend'] : ['on' + move], //touch devices has three events
                    error = false,
                    msgType = 'success',
                    customMsg = '';

                switch (subtype) {
                    case 'none':
                        chartView.reBindEvent(handles);

                        if (config.chart.allowTrendlineOnIndicators) {


                            this.indicatorsList.each(function(model) {

                                var indicatorID = 'section#' + model.get('id');
                                var indicatorChartRef = model.view.chartRef;
                                var indicatorContainer = indicatorChartRef.container;


                                indicatorContainer[handles] = model.get('moveHandler');



                                chartView.reBindEvent.call({
                                    defaultHandlers: chartView.defaultHandlers,
                                    chartRef: {
                                        container: indicatorContainer
                                    }
                                }, handles);

                            }, this);


                        }



                        break;

                    case 'trendline':

                        // BINDING EVENTS FOR MAIN CHART
                        chartView.unBindEvent(handles);
                        $(container).bind(start, {
                            callback: this.start_drawlines,
                            chart: chart,
                            collection: this.trendlinesList,
                            eventType: 'trendline'
                        }, this.event_handler);
                        $(container).bind(stop, {
                            callback: this.add_trendlines,

                            chart: chart
                        }, this.event_handler);


                        //BINDING EVENTS FOR INDICATORS CHARTS
                        if (config.chart.allowTrendlineOnIndicators) {

                            this.indicatorsList.each(function(model) {

                                var indicatorID = 'section#' + model.get('id');
                                var indicatorChartRef = model.view.chartRef;
                                var indicatorContainer = indicatorChartRef.container;


                                // Saving the Highchart onMove function on the model itself
                                // It will be useful when rebinding the function
                                model.set('moveHandler', indicatorContainer[handles]);

                                indicatorContainer[handles] = function(evt) {
                                    evt.preventDefault();
                                    return false;
                                };


                                // STEP1: UNBIND MOUSEMOVE
                                // UNBIND MOUSEMOVE ON TRENDLINE  
                                // chartView.unBindEvent.call({
                                //     defaultHandlers: _.clone(chartView.defaultHandlers),
                                //     chartRef: {
                                //         container: indicatorContainer
                                //     }
                                // }, handles);



                                // STEP2: BIND MOUSE DOWN
                                $(indicatorContainer).bind(start, {
                                    callback: this.start_drawlines_on_indicator,
                                    chart: indicatorChartRef,
                                    collection: this.trendlinesIndicatorList,
                                    eventType: 'trendlineIndicator'
                                }, this.event_handler);


                                // STEP3: BIND MOUSE UP AND CREATE A LINE SERIES AND APPEND TO indicatorChartRef
                                $(indicatorContainer).bind(stop, {
                                    callback: this.add_trendlines_on_indicator,
                                    chart: indicatorChartRef
                                }, this.event_handler);
                            }, this);
                        }


                        //$(container).on('touchend', {callback: this.add_trendlines, chart: chart}, this.event_handler);
                        customMsg = '(Tooltip will not be visible)';
                        break;

                    case 'crosshair':
                        chartView.reBindEvent(handles);
                        $(chart).bind('click', {
                            callback: this.add_crosshairs,
                            chart: chart,
                            eventType: 'crosshair'
                        }, this.event_handler);
                        break;

                    case 'retracement':
                        chartView.unBindEvent(handles);
                        $(container).bind(start, {
                            callback: this.start_drawlines,
                            chart: chart,
                            collection: this.retracementsList,
                            eventType: 'retracement'
                        }, this.event_handler);
                        $(container).bind(stop, {
                            callback: this.add_retracements,
                            chart: chart
                        }, this.event_handler);
                        customMsg = '(Tooltip will not be visible)';
                        break;
                    default:
                        break;
                }

                if (this.stateModel) {
                    this.stateModel.toggle('drawType', subtype);
                }

                args._finally && args._finally() || this.submenusList.select(subtype);
            } catch (e) {
                error = e;
                msgType = 'error';
            } finally {
                if (!args.value) { // only when its through the menu
                    this.messenger[msgType]({
                        msg: 'Switched to ' + subtype + ' mode ' + customMsg,
                        error: error,
                        on: 'switching to ' + subtype,
                        loaded: true
                    });
                }
            }
        },

        /**
         *  This function is used by trendlines & retracements to start drawing the lines.
         *  The actual drawing of lines is handled by respective models when they are initialized. It even adds event listeners for dragging
         *
         *  @method start_drawlines
         *  @param {Object} args
         *  @private
         */
        start_drawlines_on_indicator: function(args) {
            //<i>this</i> is bound to the stockwidget_view object
            args = args || {};
            // console.log(args, 'start_drawlines');
            var param = args.param,
                context = args.context,
                chart = args.chart,
                collection = args.collection;

            if (param && param.coord && param.coord.x && param.coord.y) {
                var len = collection.length;
                collection.add({
                    init: param
                });
                var newLen = collection.length;

                if (newLen > len || collection.update) {
                    //attach a new mousemove event
                    $(context).bind(this.eventMap.move, {
                        callback: this.drag_drawlines_on_indicator,

                        chart: chart,
                        collection: collection
                    }, this.event_handler);
                }
            }
        },

        /**
         *  Used Internally for dragging lines. Calls the drag method of the current model
         *
         *  @method drag_drawlines
         *  @param {Object} args
         *  @private
         */
        drag_drawlines_on_indicator: function(args) {
            args = args || {};
            var param = args.param,
                context = args.context,
                chart = args.chart,
                collection = args.collection;


            if (param && param.coord && param.coord.x && param.coord.y) {
                var model = collection.getCurrent();
                if (model) {
                    model.drag(param);
                    model.draw(args.chart.renderer, param);
                }
            }
        },
        add_trendlines_on_indicator: function(args) {
            //unbind mousemove, if any
            try {
                //console.log("In Add trendlines");
                args = args || {};
                var param = args.param,
                    context = args.context,
                    chart = args.chart,
                    collection = args.collection;

                if (context) {
                    $(context).unbind(this.eventMap.move, this.event_handler);
                }

                if (param instanceof Array) {
                    this.trendlinesIndicatorList.add(param, args.redraw);

                } else if (param && param.coord && !_.isUndefined(param.coord.x && param.coord.y)) {
                    var model = this.trendlinesIndicatorList.getCurrent();

                    //console.log("Add trendlines", model);
                    if (model) {
                        model.final(param);
                        // ANKITZ - Calling the Model's 'insert' function manually with the Highchart Context & final param
                        model.insert(args.chart, param);
                        if (this.stateModel) {
                            var priSerie = this.model.getPrimarySerie()
                            this.stateModel.updateSerie(priSerie.get('name'));
                            this.stateModel.add('trendlines', model.pluckState());
                        }
                    }
                }
            } catch (e) {
                this.messenger.error({
                    msg: e.message,
                    on: "adding trendlines",
                    data: param,
                    error: e
                });
            }
        },

        /**
         *  This method adds x,y crosshair lines on the chart & even updates the localStorage. Used Internally.
         *  This function is invoked in two ways-
         *      1. Through the 'mouseup' event/user interaction on the chart
         *      2. Through uploadSelection (any prev crosshairs) stored in the localStorage
         *
         *  @method add_crosshairs
         *  @param {Object} args
         *  @private
         */

        /**
         *  This method removes the chart from a particular mode. It undoes the changes made for that mode through the above add_draw method
         *
         *  @method remove_draw
         *  @private
         */
        remove_draw: function(args) {
            args = args || {};

            var subtype = args.attr && args.attr.subtype,
                chart = this.getChartRef(),
                container = chart && chart.container,
                config = this.config,
                start = this.eventMap.start,
                stop = this.eventMap.stop;

            switch (subtype) {
                case 'none':
                    break;

                case 'trendline':
                    $(container).unbind(start, this.event_handler);
                    $(container).unbind(stop, this.event_handler);

                    if (config.chart.allowTrendlineOnIndicators) {

                        this.indicatorsList.each(function(model) {

                            var indicatorID = 'section#' + model.get('id');
                            var indicatorChartRef = model.view.chartRef;
                            var indicatorContainer = indicatorChartRef.container;

                            $(indicatorContainer).unbind(start, this.event_handler);
                            $(indicatorContainer).unbind(stop, this.event_handler);

                        }, this);
                    }
                    break;

                case 'crosshair':
                    $(chart).unbind('click', this.event_handler);
                    break;

                case 'retracement':
                    $(container).unbind(start, this.event_handler);
                    $(container).unbind(stop, this.event_handler);
                    break;
                default:
                    break;
            }

            args._finally && args._finally();
        },

        /**
         *  This method is used when we switch between ranges & switching compare modes.
         *  1. It locally stores/retrieves the current/previous draw mode
         *  2. It switches the draw mode of the chart between none & the previously selected/locally stored
         *  3. It toggles the display of all the draw instances
         *
         *  @method toggle_draw
         *  @private
         */
        toggle_draw: function(args) {

            //toggle draw event
            var currentMode = this.submenusList.findWhere({
                type: 'draw',
                selected: true
            });
            if (!currentMode) {
                return;
            }
            var c_id = currentMode.get('id'),
                none_id = this.config.defaults.drawType,
                opt;
            var none = this.submenusList.get(none_id);

            //if(args.hideComponents){
            opt = true;
            //}

            var alreadyStored = this.toggleSave(this.config.chart.toggleDrawKey, c_id);
            if (!alreadyStored && c_id !== none_id) {
                //Select none, this will automatically undo the current selection
                //if 'none' is currently selected, there won't be any effect
                currentMode.unclick(opt);
                none.click(opt);
            } else if (alreadyStored) {
                var toMode = this.submenusList.get(alreadyStored);
                none.unclick(opt);
                toMode.click(opt);
            }

            //toggle crosshairs
            this.crosshairsList.toggleAll();

            //toggle trendlines
            this.trendlinesList.toggleAll();

            //toggle retracements
            this.retracementsList.toggleAll();

            //toggle annotations

            //redraw the chart
            if (args.redraw) {
                this.mainChartView.chartRef.redraw();
            }
        },

        /**
         *  This method is toggles the visibility of a type of flag or all flags. If no param are passed then it toggles all the flags.
         *
         *  @method toggle_events
         *  @public
         */
        toggle_events: function(args) {
            args = args || {};
            if (!this.model.get('hasFlags')) {
                return;
            }
            var CanvasHeight = this.config.chart.canvasHeight
            var NavHeight = CanvasHeight - 50;

            var id = args && args.attr && args.attr.subtype;
            var mychart = this.getChartRef()
            if (id) {


                //toggle an individual flag
                this.flags.toggle(id, args.redraw);
                if (id === "NavR") {

                    if (chk == true) {

                        // // this.$('.footer').hide();
                        // this.$('.footer').css({
                        //     position: 'relative'
                        // }).animate({
                        //     top: '-50px',
                        //     zIndex: -100
                        // }, function() {
                        //     $(this).hide()
                        // }); //ankitz: added jquery animation
                        mychart.scroller.series.hide();
                        this.$('.footer').hide();
                        mychart.scroller.series.hide();
                        mychart.scroller.scrollbarGroup.hide();
                        mychart.scroller.navigatorGroup.hide();
                        mychart.scroller.scrollbar.hide();
                        mychart.scroller.xAxis.labelGroup.hide();
                        mychart.scroller.xAxis.gridGroup.hide();

                        this.$('.highcharts-scrollbar').hide();
                        this.$('section.canvas').height(NavHeight);
                        this.$('#highcharts-0').height(NavHeight + 7);

                        $.each(mychart.scroller.elementsToDestroy, function(i, elem) {
                            elem.hide();
                        });
                        //mychart.setSize(955, 250);

                        //this.$('.indicators chart /*hide*/').attr('transform','translate(10,100)');


                        chk = false;
                    } else {

                        // //this.$('.footer').show();
                        // this.$('.footer').show().animate({
                        //     zIndex: +100
                        // }).animate({
                        //     top: '0px'
                        // }); //ankitz: added jquery animation

                        mychart.scroller.series.show();
                        this.$('.footer').show();

                        mychart.scroller.series.show();
                        mychart.scroller.scrollbarGroup.show();
                        mychart.scroller.navigatorGroup.show();
                        mychart.scroller.scrollbar.show();
                        mychart.scroller.xAxis.labelGroup.show();
                        mychart.scroller.xAxis.gridGroup.show();
                        $.each(mychart.scroller.elementsToDestroy, function(i, elem) {
                            elem.show();
                        })
                        this.$('.highcharts-scrollbar').show();
                        this.$('section.canvas').height(CanvasHeight);
                        this.$('#highcharts-0').height(CanvasHeight + 7);
                        chk = true;
                    }
                    //this.model.set('hasNavigator', !(this.model.get('hasNavigator')));
                }


            } else {
                //toggle all flags
                var op = (args.operation) ? args.operation + 'All' : 'toggleAll';
                this.flags[op](args.redraw);
            }

            if (this.stateModel) {
                this.stateModel.update('flags', this.flags.pluckState(id));
            }

            //if successful
            if (args._finally) {
                args._finally();
            }
        },

        /**
         *  This method adds a serie to the chart for comparison asynchronously. It hides various components as well as the readings bar and adds snapshot for respective series in the readings bar for their current values
         *  It uses addSeries method of the view_chart file. Needs a param attribute with the necessary details for the serie. This function fails gracefully
         *      args ->
         *
         *  @method add_compare
         *  @param {Object} args { <br>
         *          param: [{code: 1234, name: 'abc', exchange: 'NSE', ....}, {.....}, {},....], //an array of objects for series to add <br>
         *          compareType: {String} 'percent' or 'value' // check HighStock API for similar key <br>
         *          stackingType: {String} 'percent' or 'normal' // check HighStock API for similar key. Default from chartOptions in config <br>
         *          compareVolume: {Boolean} // whether to compare volumes while in compare mode <br>
         *      }
         *  @public
         */
        add_compare: function(args) {

            args = args || {};
            var view = this,
                model = this.model;

            model.loading();

            var isOnLoad = this.model.get('onLoad'),
                chartOpt = this.config.chart,
                isHist = this.model.isHist(),
                toCompareMode = true,
                mainChart = view.mainChartView,
                type = args.compareType || chartOpt.compareType || 'percent',
                stacking = args.stackingType || chartOpt.stackingType || 'normal',
                compareVolume = args.compareVolume || chartOpt.compareVolume;

            mainChart.addSeries({
                param: args.param,
                setAsPrimary: false,
                toCompare: toCompareMode,
                compareVolume: compareVolume,
                colourCount: this.colourCount,
                callback: function(error, data, range, newFile, skipMsg) {
                    //<i>this</i> is bound to the Serie instance
                    try {
                        //BUG FIX: compare - onload - missing file handling 
                        //We throw an error only if its not onLoad
                        if (error && !isOnLoad) {
                            this.set('hasError', true);
                            //for angel
                            //This will remove the last added series from the collection if data is corrupt/invalid/empty
                            this.collection.remove(this.collection.models[this.collection.models.length - 1]);

                            throw (error instanceof Error) ? error: new Error("Error : cannot compare");
                        }

                        var compare = model.inCompareMode(),
                            message, msgType = 'success';
                        //START: only ONCE, if not in compare mode currently
                        if (!compare) {

                            //toggle chartType only if not already toggled
                            if (!model.areComponentsHidden()) {
                                //ankitz added third parameter
                                view.toggle_chartType(true, false, {
                                    isHist: isHist,
                                    inCompareMode: toCompareMode,
                                    isNewRange: false
                                });
                                view.toggle_lineType(true, true, {
                                    isHist: isHist,
                                    inCompareMode: toCompareMode,
                                    isNewRange: false
                                });
                            }

                            //toggle the components
                            model.hideComponents({
                                redraw: false
                            }); //!!!redraw

                            //hide header
                            view.readings.hide();

                            //switch to compare mode
                            var chartLoaded = mainChart.toggleCompareMode({
                                type: type,
                                stacking: stacking,
                                compareVolume: compareVolume
                            });

                            if (!chartLoaded) {
                                skipMsg = false;
                                throw new Error('Chart Not Loaded Yet');
                            }

                            //add snapshot for primary series
                            var priSerie = model.getPrimarySerie();
                            view.add_snapshot(priSerie);
                        }
                        //END: ONCE

                        var serieObj = this.getHighstockSeriesObject({
                            toCompareMode: toCompareMode,
                            type: type,
                            stacking: stacking,
                            compareVolume: compareVolume,
                            isHist: isHist
                        });

                        mainChart.plotSerie({
                            model: this,
                            object: serieObj,
                            redraw: false,
                            last_redraw: true // this key will redraw the chart on adding the last serie
                        });

                        //add the snapshot
                        view.add_snapshot(this);

                        //BUG FIX: compare - onload - missing file handling 
                        //disable the serie if error has occured
                        if (error && isOnLoad) {
                            this.disable();
                            msgType = 'error';
                            message = error.message;
                        }

                        //grab readings
                        view.currentReadings();
                    } catch (e) {
                        error = e;
                        message = e.message;
                        msgType = 'error';

                        /*if(isOnLoad){
                            //ERROR while fetching file, removing the model
                            view.seriesList.remove(this);

                        }else{*/
                        view.remove_compare(this.get('id'), true);
                        //}

                    } finally {
                        //add to LS
                        var atr = this.attributes;
                        //BUG FIX: !atr.fromDeclaration will make sure serie is not stored when its passed as a param onLoad 
                        !error && !atr.fromDeclaration && view.stateModel && view.stateModel.add('compare', this.pluckState());

                        !skipMsg && view.messenger[msgType]({
                            error: error,
                            msg: message || atr.name + ' serie added successfully for comparision',
                            on: 'adding ' + atr.name + ' for comparing: ' + error.message,
                            data: atr
                        })

                        model.loaded();
                    }
                }
            });
        },

        /**
         *  This method is used by remove_compare to remove some series from the chart along with their readings's snapshot. Used internally
         *  Note: primary serie is never removed from the chart, it is just marked as stale. While coming out of compare mode, that stale primary is replaced with the remaining serie
         *
         *  @method removeSerie
         *  @param {Array|String|Undefined} names string/list of serie ids to remove, if undefined all extra serues will be removed
         *  @param {SerieModel} priSerie
         *  @private
         */
        removeSerie: function(names, priSerie) {
            var priName = priSerie && priSerie.get('name');
            if (!names) {
                //create a list of all series names without primary
                names = _.without(this.seriesList.pluck('name'), priName);
            }

            for (var i = 0, len = names.length; i < len; i++) {
                //if(this.seriesList.length > 1){
                var remove_name = names[i];

                if (remove_name === priName) {
                    //"remove" the primary serie
                    priSerie.stale();
                    priSerie.trigger('remove-snapshot');
                    //var nextEligibleSerie=this.seriesList && typeof this.seriesList.models[1]!=="undefined" && this.seriesList.models[1];
                    // this.switchPrimary(nextEligibleSerie, priSerie, true);//ankitz: changing the primary to the next adjacent company when the primary is removed 
                    // this.seriesList.remove(nextEligibleSerie.get('name'));//ankitz: removing the duplicate eligible serie since it has already been copied in the primar
                } else {
                    this.seriesList.remove(remove_name);
                }

                //remove from LS
                this.stateModel && this.stateModel.remove('compare', remove_name);
                //}
            }
        },

        /**
         *  This method is used to remove a serie from the chart while in compare mode. If all but one serie remains then it even switches out of compare mode
         *  If name is undefied then it removes all the additional series from the chart. Pass id/name of the series here.
         *  This method is bound to the click event of the 'x' button in the serie's reading's snapshot.
         *
         *  @method remove_compare
         *  @param {String|String[]|Undefined} [name]
         *  @param {Boolean} [skipMsg=false] whether to skip the notification message
         *  @param {Boolean} [skipReload] whether to skip reloading the chart. Used if error while adding a serie to the chart through add_compare
         *  @public
         */
        remove_compare: function(name, skipMsg, skipReload) {
            try {
                var model = this.model,
                    view = this,
                    chartType,
                    message, error, msgType = 'success';
                if (!model.inCompareMode()) {
                    if (!skipMsg) {
                        msgType = 'warn';
                        throw new Error("Cannot remove series as Widget not in compare mode");
                    }
                    return;
                }

                model.loading();


                var priSerie = model.getPrimarySerie(),
                    names;

                if (name instanceof Serie) {
                    names = [name.get('id')];
                } else if (name && typeof name === 'string') {
                    //remove a particular compare series
                    names = [name];
                } else { //} if(name && name.length > 0){ 
                    // remove all or an array of compare series
                    // name is undefined or a non-empty array
                    names = name;
                }
                this.removeSerie(names, priSerie);

                //ONLY ONCE
                var series = this.seriesList.where({
                    isStale: false
                });
                if (series.length === 1) {
                    message = 'Out of compare mode';
                    var newSerie = series[0] || this.seriesList.at(0);

                    if (priSerie.get('isStale')) {
                        //priSerie = this.seriesList.findWhere({isStale : false});
                        //model.updatePrimarySeries( priSerie );
                        this.seriesList.remove(newSerie);
                        this.switchPrimary(newSerie, priSerie, true);

                        message += '. Setting ' + newSerie.get('name') + ' as the primary serie';
                    } else {
                        //remove snapshot for last serie
                        newSerie.trigger('remove-snapshot');
                    }


                    //toggle/ show chart components
                    this.mainChartView.toggleCompareMode({});

                    //show components
                    model.showComponents({
                        mode: 'compare',
                        redraw: false
                    });

                    //toggle components
                    if (!model.areComponentsHidden()) {
                        //ankitz added third parameter
                        chartType = view.toggle_chartType(true, false, {
                            isHist: model.isHist(),
                            inCompareMode: false,
                            isNewRange: false
                        });
                        lineType = view.toggle_lineType(true, false, {
                            isHist: model.isHist(),
                            inCompareMode: false,
                            isNewRange: false
                        });


                        //is.nav.subMenuClicked({target:{id:newSerie.get('chartType') || this.config.defaults.chartType}});
                        //is.nav.subMenuClicked({target:{id:newSerie.get('lineType') || this.config.defaults.lineType}})

                        // newSerie.updateData({
                        //     chartType: newSerie.get('chartType') || this.config.defaults.chartType,
                        //  lineType: newSerie.get('lineType') || this.config.defaults.lineType, 
                        //  ids: newSerie.get('lineType') || this.config.defaults.lineType, 
                        //   isHist: true,
                        //    redraw: true});
                    }

                    if (!skipReload) {
                        this.reload({
                            purgeData: false, // IMPORTANT, keep false here
                            chartType: this.model.get('chartType') || this.config.defaults.chartType,
                            lineType: this.model.get('lineType') || this.config.defaults.lineType,
                            on: 'removing compare',
                            skipMsg: true,
                            //reloadLinetype:false, //ankitz :reloadLinetype=true  added so as to not redraw the chart 
                            redraw: true

                        });
                    }

                    //reset compare list from LS
                    this.stateModel && this.stateModel.reset('compare');
                } else {
                    //BUG FIX: On Removing the serie but still comparing, we were not redrawing the chart
                    this.mainChartView.chartRef.redraw();
                }
            } catch (e) {
                error = e;
                messenger = e.message;
                msgType = 'error';
            } finally {
                if (!skipMsg) {
                    this.messenger[msgType]({
                        error: error,
                        msg: message || names.join(',') + ' series removed successfully',
                        on: 'removing compare',
                        loaded: !skipReload
                    });
                }
            }
        },

        /**
         *  This method is used to toggle the visibility of various components of the chart - nav, overlays, indicators, flags, draw mode
         *  Its used when switching between range types and compare mode. This method is bound to componentsHidden key of the StockWidget Model
         *  Do not use this externally , instead use hideComponents & showComponents methods on the StockWidgetModel (this.model)
         *
         *  @method toggleComponents
         *  @private
         */
        toggleComponents: function(model, value, options) {
            //var fromUpdateRange = (options && options.mode === 'updateRange');
            var hasMode = (options && options.mode);
            var args = {
                operation: (value) ? 'hide' : 'show',
                silent: hasMode, //fromUpdateRange,
                hideComponents: value,
                redraw: options.redraw
            };

            //disable Nav
            this.nav && this.nav.toggleNav();

            //readings bar needs to be toggled separately as this method only toggles common components
            //readings bar needs to be displayed with only certain readings while in intra/week mode

            //toggle overlays
            this.toggle_overlays();

            //toggle indicators
            this.toggle_indicators();

            //toggle flags 
            if (!hasMode) {
                this.toggle_events(args);
            }

            //hide draw events
            this.toggle_draw(args);

            //if error toggle componentsHidden  
        },

        /**
         *   This function switches the primary series & even updates the colour of the navigator series
         *  Note: This function does not add any series to the chart. It only changes the primary to a new one.
         *  Note: We do not delete the priSerie from the chart. Only hide it, replace the model & the serie with newSerie's params
         *  Note: Can be used publically but need to be careful of the arguments. @todo - Can modify the function to allow passing seriemodel's id instead of entire model
         *
         *  @method switchPrimary
         *  @param {SerieModel} newSerie
         *  @param {SerieModel} [priSerie]
         *  @param {Boolean} [colourSwap=false] - whether to change the colour of the priSerie to that of the newSerie
         *  @private
         */
        switchPrimary: function(newSerie, priSerie, colourSwap) {

            if (!(newSerie instanceof Serie)) {
                throw new Error('newSerie should be an instance of Serie Model');
            }

            priSerie = priSerie || this.model.getPrimarySerie();
            var isHist = this.model.isHist(),
                chartType, lineType;
            if (!isHist) {
                chartType = 'line';
                lineType = 'daily'; //ankitz
            }

            //purge unique instances of the old primary serie
            if (this.config && this.config.chart.isPurgingEnabled) {

                //if purging is enabled then check if Instances(trendline/fibonacci/crosshair) has to be enabled
                if (this.config && !this.config.chart.isInstancesPurgeable) {
                    this.remove_allDrawInstances(false, true);
                }

            } else {
                //ankitz :purging is made configurable so on series replace we can keep the previouly selected overlays/indicators 
                this.purge(false);
            }


            var prop = priSerie.pickProperties() || {}, //Grab the current primary serie's properties
                priattr = priSerie.toJSON(),
                colour;

            if (!colourSwap) {
                //if colourSwap is false then use priSerie's colour
                colour = prop.colour;
            }

            //clear the primary serie model of old values
            priSerie.clear();
            //now set it to newSerie params
            // we will be updating the same serie reference in the callback to avoid bugs


            priSerie.set(
                _.defaults({
                        isPrimary: true,
                        serie: priattr.serie,
                        volume: priattr.volume,
                        currTimeRange: this.model.getCurrentRange(),
                        colour: colour,
                        chartType: (isHist) ? prop.chartType : chartType,
                        lineType: (isHist) ? prop.lineType : lineType,
                        // Setting this key will make sure that flags are loaded when priSerie is switched in non-hist mode 
                        //updateFlags: true, 
                        updateFlags: !isHist && true,
                        refresh: true // setting a new key to indicate if primary was switched
                    },
                    newSerie.toJSON(),
                    prop)
            );

            //update navigator colour
            if (this.model.get('hasNavigator')) {
                var chart = this.getChartRef();
                var scroller = chart.get(navigatorId);
                scroller.update({
                    lineColor: priSerie.get('colour')
                }, false);
            }
        },

        /**
         *   This function purges the chart of some/all user settings - compare, overlays, indicators, flags, range, draw instances
         *   Useful when we want to get back to default state.
         *
         *  @method purge
         *   @param {Boolean} [restoreDefault=true] - if this is set then the chart is restored to default settings
         *  @param {Boolean} [skipMsg]
         *  @public
         */
        purge: function(restoreDefault, skipMsg) {
            // a new serie is being added, so delete all unique instances 
            this.remove_allDrawInstances(false, skipMsg);

            //remove any other unique instances, if any

            restoreDefault = _.isUndefined(restoreDefault) ? true : restoreDefault;

            if (restoreDefault) {

                this.remove_compare(null, true);

                //reset overlays 
                this.remove_overlays(null, true);

                // remove indicators
                this.remove_indicators(null, true);

                var defaults = this.config.defaults,
                    nav = this.nav,
                    clicks = [];

                //ankitz: enabling top nav bar on resetting the charts                
                if (this.nav.isDisabled) {
                    this.nav.toggleNav();
                }

                var unselectedFlags = this.submenusList.where({
                        type: this.config.chart.flagsMenuType,
                        selected: false
                    }),
                    flagsIds = _.pluck(unselectedFlags, 'id');

                if (nav) {
                    //toggle chartType to default
                    clicks.push(defaults.chartType);
                    //toggle drawType
                    clicks.push(defaults.drawType);
                    //toggle lineType to default
                    clicks.push(defaults.lineType); //ankitz: on reset lineType sets to default

                    clicks = clicks.concat(flagsIds);
                }

                // events
                if (this.flags && !nav) {
                    this.flags.add_selection(defaults.flags);
                }

                if (nav) {
                    for (var i = 0, len = clicks.length; i < len; i++) {
                        nav.subMenuClicked({
                            target: {
                                id: clicks[i]
                            }
                        });
                    }
                }
                //TODO: default flag selection

                //switch to default range
                var range = this.rangeButtons.findWhere({
                    index: defaults.rangeSelected
                });
                range && range.click();
            } else {
                this.remove_compare(null, true);

                //reset overlays 
                this.remove_overlays(null, true);

                // remove indicators
                this.remove_indicators(null, true);

                //ankitz disabled this temporarily, need to enable it later
                //this.add_overlays()

                var defaults = this.config.defaults,
                    nav = this.nav,
                    clicks = [];

                var unselectedFlags = this.submenusList.where({
                        type: this.config.chart.flagsMenuType,
                        selected: false
                    }),
                    flagsIds = _.pluck(unselectedFlags, 'id');

                if (nav) {
                    //toggle chartType to default
                    clicks.push(defaults.chartType);
                    //toggle drawType
                    clicks.push(defaults.drawType);

                    clicks = clicks.concat(flagsIds);
                }

                // events
                if (this.flags && !nav) {
                    this.flags.add_selection(defaults.flags);
                }

                if (nav) {
                    for (var i = 0, len = clicks.length; i < len; i++) {
                        nav.subMenuClicked({
                            target: {
                                id: clicks[i]
                            }
                        });
                    }
                }
                //TODO: default flag selection

                //switch to default range
                var range = this.rangeButtons.findWhere({
                    index: defaults.rangeSelected
                });
                range && range.click();

            }
        },

        /**
         *   This function reloads the a single or all the series of the chart after optionally fetching new data for them
         *
         *  @method reload
         *  @param {Object} args { <br>
         *      serie : {SerieModel} to reload - reloads only that particular serie <br>
         *      purgeData: {Boolean} - whether to clear the existing data & hence fetch new data (when reloading all series) <br>
         *      hideReadings: {Boolean} //useful while in compare mode <br>
         *      skipMsg: whether to skip the notification msg<br>
         *      on: - brief msg describing what is that module actually doing; used for notification; check Messenger for explanation <br>
         *      msg: msg to display in the notification <br>
         *  }
         *  @public
         */
        reload: function(args) {
            // console.log(args, 'in reloadddddddd');
            var hasInput = args; // HACK!!! to make sure overlays, indicators are reloaded when we call reload explicitly
            args = args || {};
            var serie = args.serie;
            if (typeof serie === 'string') {
                serie = this.seriesList.get(serie)
            }

            var model = this.model;
            model.loading();

            var hasFlags = model.get('hasFlags'),
                flags = this.flags,
                inCompareMode = model.inCompareMode(),
                purgeData = args.purgeData,
                redraw = typeof args.redraw !== 'undefined' ? args.redraw : true,
                view = this,
                len, isLast,
                isHist;
            var changeLineType = (typeof args.reloadLinetype == "undefined" || args.reloadLinetype == true) ? true : false; //ankitz: this will make sure not to reload data wen coming out of compare

            var args = {
                newTimeRange: this.model.getCurrentRange(),
                skipMsg: args.skipMsg,
                msg: args.msg,
                on: args.on,
                hideReadings: args.hideReadings,
                callback: function(error, data, range, newFile) {
                    try {
                        var msgType = 'success',
                            msg, error;
                        var refreshed = this.get('refresh'),
                            isPrimary = this.get('isPrimary'),
                            serieRef = this.get('serie'),
                            volumeRef = this.get('volume'),
                            operation, serieOpt, volumeOpt;

                        isHist = isHist || model.isHist(range);

                        if (refreshed) {
                            //if the serie was refreshed
                            operation = 'update';

                            var graphObj = this.getHighstockSeriesObject({
                                isHist: isHist,
                                data: data
                            });

                            serieOpt = graphObj && graphObj[0];
                            volumeOpt = graphObj && graphObj[1];

                        } else {
                            operation = 'setData';
                            var dataType = this.getDataType({
                                isHist: isHist
                            });
                            serieOpt = data[dataType];
                            volumeOpt = data.volume;

                        }

                        //Updating the highchart serie references with new data 
                        if (changeLineType) { //ankitz: added changeLineType this will either change or skip the serie 'lineType' change  
                            if (volumeRef && volumeOpt) {
                                volumeRef[operation](volumeOpt, false)
                            }

                            if (serieRef && serieOpt) {
                                serieRef[operation](serieOpt, false);
                            }
                        }


                        if (isPrimary && hasFlags && flags && isHist) {
                            //flags should be updated only for primary series
                            var name = this.get('id') || this.get('name');

                            flags.update({
                                onSeries: name,
                                data: data,
                                visible: isHist && !inCompareMode,
                                redraw: false
                            });
                        }

                        if (refreshed || !hasInput) {

                            //Trigger a 'refresh' event on the priSerie
                            //Readings Bar, Indicators, Overlays should be listening to this event
                            //They should do redraw  themselves to the updated priSerie
                            this.trigger('refresh', this);
                            this.unset('refresh');
                        }

                        if (isLast) {
                            if (!inCompareMode) {
                                //if(isHist){
                                //This makes sure we reload only when in hist
                                view.overlayView && view.overlayView.reload();

                                view.indicatorsList.each(function(i) {
                                    i.reload();
                                });
                                //}

                                view.uploadSelection(false);

                                !args.hideReadings && view.readings && view.readings.show();
                            }

                            //redraw the chart
                            if (redraw) {
                                view.getChartRef().redraw();
                            }

                            view.currentReadings();
                        }
                    } catch (e) {
                        msgType = 'error';
                        error = e;
                        msg = e.message;
                    } finally {
                        if (!args.skipMsg) {
                            view.messenger[msgType]({
                                on: args.on || 'reloading',
                                msg: msg || args.msg || 'Chart reloaded successfully',
                                error: error,
                                loaded: true
                            })
                        }
                    }
                }
            };


            if (serie) {
                if (!(serie instanceof Serie)) {
                    throw new Error('Input is not a serie model');
                }
                //reload a particular serie
                len = 1;
                isLast = true;
                serie.purgeData();
                serie.getRangeData(args);
            } else {
                //reload all series
                purgeData = _.isUndefined(purgeData) ? true : purgeData;
                len = this.seriesList.length;
                this.seriesList.each(function(serie, i) {
                    if (purgeData) {
                        serie.purgeData();
                    }

                    isLast = len - 1 === i;
                    serie.getRangeData(args);
                });
            }
        },

        /**
         *  It adds a timer to the chart & reloads the chart automatically after every time ms. Use it just like JavaScript's setInterval
         *  @method setInterval
         *  @param {Number} time in ms
         *  @public
         */
        setInterval: function(time) {
            this.timer = setInterval(_.bind(this.reload, this), time);
        },

        /**
         *  It clears any timer set using setInterval
         *
         *  @method clearInterval
         *  @public
         */
        clearInterval: function() {
            clearInterval(this.timer);
        },

        /**
         *   This function replaces the chart with a new serie & removes compare. It uses update method & always removes the chart out of compare mode
         *   @method replace
         *  @param {Object} newSerie - pass params of serie to update to
         *  @public
         */
        replace: function(param) {
            this.update(param, true);
        },

        /**
         *   This function updates the chart with a new serie
         *  Cases:
         *       1. Loading a completely new serie
         *       2. Updating an existing non-primary serie with new params
         *       3. Updating the primary serie with new params
         *  USE this function ONLY when you want to update an important param of the serie (that would affect the graph) or replace with a new serie
         *
         *  @method update
         *  @param {Object} newSerie - pass params of serie to update to
         *   @param {Boolean} [removeCompare=false] - whether to remove compare
         *  @public
         */
        update: function(newSerie, removeCompare) {
            try {
                //Cases:
                // 1. Loading a completely new serie
                // 2. Updating an existing non-primary serie with new params
                // 3. Updating the primary serie with new params

                var model = this.model;
                model.loading();

                var priSerie = model.getPrimarySerie(),
                    priName = priSerie.get('name'),
                    isSerie = (newSerie instanceof Serie),
                    param = isSerie && newSerie.toJSON() || newSerie || {}, // if input is a serie model, grab its attr else input
                    id = param.name || param.id,
                    isPrimary = priName === id,
                    serie = this.seriesList.get(id),
                    isNew = !serie,
                    inCompareMode = model.inCompareMode(),
                    removeCompare = removeCompare || false,
                    view = this;

                if (inCompareMode && removeCompare) {
                    //here we will always remove out of compare, even though we want to update to a existing non-primary serie
                    //this will make sure we don't have duplicate series
                    //switchPrimary won't be called through this remove_compare call
                    this.remove_compare(null, null, true);
                } else if (inCompareMode && !removeCompare && serie && !isPrimary) {
                    //if removeCompare = false && the serie already exists
                    //i.e. we want to update to a non-primary serie

                    //we remove only that serie from the chart
                    this.remove_compare(id, null, true); //serie.get(id)
                }

                if (isPrimary) {
                    //case 3: update the primary model
                    priSerie.set(newSerie, {
                        validate: true
                    });
                    newSerie = priSerie;
                } else if (!isPrimary && !isSerie) {
                    //create a new serieModel if not one
                    newSerie = new Serie(_.extend({}, param, {
                        id: id
                    }), {
                        validate: true
                    });
                } else if (serie) {
                    newSerie = serie;
                }

                if (newSerie.validationError) {
                    throw new Error(newSerie.validationError);
                }

                if (!isPrimary) {
                    //now update the current primary with the new serie
                    //Cases 1,2 handled here
                    this.switchPrimary(newSerie, priSerie, false);
                }

                // All necessary settings have been made, now reload the chart
                this.reload({
                    on: 'Updating'
                });

            } catch (e) {
                //notify only error here
                this.messenger.error({
                    error: e,
                    data: newSerie,
                    msg: 'Error while updating the chart to ' + id,
                    on: 'reloading the chart',
                    loaded: true
                });
            }
        },

        /**
         *  This method removes all the chart components & the chart itself from the DOM. To make sure the stockwidget is garbage collected completely,
         *  you will need to delete the key or the variable where the reference to this chart widget view object is stored. (this file's instance)
         *  @todo: need to do a profile & memory test to see if there are memory leaks
         *
         *  @method destroy
         *  @public
         */
        destroy: function() {
            this.remove_overlays();
            //this.overlayView && this.overlayView.remove();

            this.remove_indicators();
            this.remove_allDrawInstances();

            this.seriesList.each(function(serie) {
                this.remove(serie);
            }, this.seriesList);

            this.getChartRef() && this.getChartRef().destroy();
            //this.mainChartView.remove();

            //this.nav && this.nav.remove();
            //this.readings && this.readings.remove();
            //this.rangeSelector && this.rangeSelector.remove();

            this.stateModel.destroy();
            delete this.messenger;

            widgetDB.remove(this.model);
            delete this.model;
            this.remove();
        },

        /**
         *  This method is used internally to update the chart's current plotted range to that selected from the calender by the user.
         *  This function is bound to the rangeSelector's 'change' event. See 'initialize' of this file.
         *  Note: If there are any bugs related to calender, do check this function as well as view_calender &/or view_rangeSelector
         *
         *  @method updateExtremes
         *  @param {String} type - to or from
         *  @param {Number} value
         *  @private
         */
        updateExtremes: function(type, value) {
            var chart = this.getChartRef(),
                xAxis = chart && chart.xAxis[0],
                extremes = xAxis && xAxis.getExtremes(),
                model = this.model,
                isHist = model.isHist(),
                min, max;


            if (extremes) {
                min = (type === 'from') ? value : extremes.min;
                max = (type === 'to') ? value : extremes.max;

                var diff = max - min,
                    isLatest = new Date(max).toDateString() === new Date(extremes.dataMax).toDateString();
                // NOTE: isLatest will give wrong result with data grouping

                if (!isHist && diff > ONE_WEEK) {
                    // chart not in hist mode && not latest or range > 1 week. Therefore switch to hist
                    var btn = this.rangeButtons.findWhere({
                        type: 'year',
                        count: 1
                    });
                    this.updateRange(btn, {
                        min: min,
                        max: max,
                        blur: true
                    });
                } else if (isLatest && diff >= ONE_DAY && diff < ONE_WEEK /*) || (!isHist && !isLatest && diff <= ONE_WEEK) */ ) {
                    // switch to Week
                    var btn = this.rangeButtons.findWhere({
                        type: 'week',
                        count: 1
                    });

                    if (isHist) {
                        //add one day if currenly widget is in hist mode; as the latest day may not show there
                        max += ONE_DAY - ONE_MIN;
                    }
                    this.updateRange(btn, {
                        min: min,
                        max: max
                    });
                } else if (isLatest && (diff === 0 || diff < ONE_DAY)) {
                    //diff >0 , switch to Intra
                    var btn = this.rangeButtons.findWhere({
                        type: 'day',
                        count: 1
                    });
                    this.updateRange(btn);
                } else {
                    xAxis.setExtremes(min, max);
                    this.rangeButtons.trigger('blurRS');
                }

            } else {
                // trigger an error
            }
        },

        /**
         *  This method basically switches the chart between intra, week & hist mode. Used Internally
         *  Note: Lots of things happen here, so please do not change something unless you are 100% sure. (Atleast keep a backup)
         *
         *  @method updateRange
         *  @param {Model}
         *  @private
         */
        updateRange: function(innerModel, options) {
            if (!innerModel) {
                //error
                return false;
            }
            var model = this.model;
            model.loading();

            options = options || {};

            var currentRange = model.getCurrentRange(),
                attr = innerModel.attributes,
                newRange = attr.range,
                view = this,
                chartRef = view.mainChartView.chartRef,
                //hist = this.config.chart.timeRanges[2],
                isNewRange = currentRange !== newRange,
                isHist = model.isHist(newRange),
                isIntra = model.isIntra(newRange),
                isCurrentHist = model.isHist(currentRange),
                inCompareMode = model.inCompareMode(),
                toggleComponents = (isNewRange && (isCurrentHist || isHist)),
                operation = (isHist) ? 'show' : 'hide',
                config = this.config,
                once = _.once(function() {

                    model.set({
                        'currentRange': newRange,
                        'rangeSelected': attr.index
                    });
                    /*                   //if(toggleComponents){
                                        var op = ((isHist) ? 'show' : 'hide') + 'Components';
                                        console.log(op, 'op');
                                        model[op]({
                                            mode: 'updateRange',
                                            isHist: isHist,
                                            redraw: false
                                        }); //!!!redraw
                //}*/


                    chartRef && chartRef.redraw();

                    // update the range
                    view.mainChartView.updateRangeSelector(attr, options.min, options.max); //!!!redraw

                    //update LS
                    view.stateModel && view.stateModel.save({
                        'currentRange': newRange,
                        'rangeSelected': attr.index
                    });

                    //upload pre selection
                    view.uploadSelection();

                    //show the latest readings
                    view.currentReadings();

                    //select the button
                    view.rangeSelector && view.rangeSelector.update(attr.id, options.blur);

                    //ankitz
                    //view.customiseNavigationBar({isHist:isHist});  

                });

            if (!isNewRange && !model.get('fatalError')) {
                once();
                model.loaded();
            } else if (isNewRange) {
                var series = this.seriesList.where({
                        isStale: false
                    }),
                    len = series.length;
                _.each(series, function(serieModel, i) {
                    serieModel.getRangeData({
                        newTimeRange: newRange,
                        updateRange: true,
                        callback: function(error, data, range, newFile, skipMsg) {
                            //<i>this</i> is bound to the serie model

                            var isLast = i === len - 1,
                                chartType = 'line',
                                lineType = 'daily';

                            if (error) {
                                if (inCompareMode) {
                                    this.disable();
                                    chartRef && chartRef.redraw();
                                }!skipMsg && view.messenger.error({
                                    msg: 'Error while switching ' + this.get('id') + ' to ' + range + ' mode: ' + error.message,
                                    on: 'updating range to ' + range,
                                    source: 'updateRange',
                                    loaded: !inCompareMode || (inCompareMode && isLast)
                                });
                                if (!inCompareMode) {
                                    return;
                                }
                            }

                            if (i === 0 && !inCompareMode) {
                                //ankitz added if(isHist), so only wen chart is in Hist mode that it will save the ChartType/LineType
                                if (isHist) {
                                    //ankitz added third parameter
                                    var chartType = view.toggle_chartType(false, false, {
                                        isHist: isHist,
                                        inCompareMode: inCompareMode,
                                        isNewRange: isNewRange
                                    }) || model.getPrimarySerie().get('chartType') || chartType; //!!!redraw
                                    lineType = view.toggle_lineType(false, false, {
                                        isHist: isHist,
                                        inCompareMode: inCompareMode,
                                        isNewRange: isNewRange
                                    }) || model.getPrimarySerie().get('lineType') || lineType; //ankitz
                                }

                                //chartType = view.toggle_chartType(false, false) || chartType; //!!!redraw
                                //toggle flags
                                // BUG : if scroller right end shifted then in intra navigator goes flat
                                // Fix : toggle flags before setting the data or updating chart range
                                view.toggle_events({
                                    operation: operation,
                                    redraw: false
                                }); //!!!redraw
                            }

                            if (data) {
                                //update flags
                                if (model.get('hasFlags') && (this.get('updateFlags') || newFile) && isHist && !model.inCompareMode()) {
                                    view.flags.update({
                                            onSeries: this.get('id'),
                                            data: data,
                                            visible: isHist,
                                            redraw: false
                                        }) //!!!redraw

                                    //flags updated, so delete the key
                                    this.unset('updateFlags');
                                }

                                //ankitz: created customiseNavigationBar() to allow show/hide of submenus
                                view.customiseNavigationBar({
                                    isHist: isHist,
                                    newRange: newRange
                                });



                                //update series
                                var success = this.updateData({
                                    ids: (isHist) ? lineType : "daily", //ankit if historical=>any lineType else Intra/week=>"daily" 
                                    data: data,
                                    isHist: isHist,
                                    isIntra: isIntra,
                                    isNewRange: isNewRange,
                                    isDisabled: false,
                                    redraw: (isLast),
                                    chartType: (isHist) ? chartType : config.defaults.chartType, //ankitz: use default ChartType when 1d/1w
                                    lineType: (isHist) ? lineType : config.defaults.lineType,
                                    visible: true,
                                    redraw: false
                                });
                            }


                            if (success) {
                                this.updateTimeRange(newRange);
                            }
                            //Execute once for the last iteration
                            if (isLast) {
                                once();


                                //BUG FIX
                                //if in compare mode, set the extremes to the first & the last values
                                //if (inCompareMode && !isHist && data && data.array.length) {
                                if (!isHist && data && data.array.length) { //ankitz removed inCompareMode checking    
                                    var dataLen = data.array.length,
                                        start = data.array[0][0],
                                        end = data.array[dataLen - 1][0];

                                    chartRef && chartRef.xAxis[0].setExtremes(start, end);
                                }
                                model.loaded();
                            }
                        }
                    });

                });
            }
        },


        /**
         *  This method changes the lineType of the graph. Current options - daily,weekly,monthly
         *
         *  @method change_lineType
         *  @param {Object} [args] args should contain a model key with value as an submenu or indicator Model
         *  @public
         */
        change_lineType: function(args) {

            args = args || {};
            var currentSerie = this.model.getPrimarySerie(),
                currChartType = currentSerie.get('chartType'),
                //currlineType = currentSerie.get('ids'),
                currlineType = currentSerie.get('lineType'),
                redraw = args.redraw || false,
                error, message, msgType = 'success',
                skipMsg = args.skipMsg,
                to;

            //ankitz
            if ($('#weekly')[0] && $('#weekly')[0].classList[1]) {
                currlineType = 'weekly';
            } else if ($('#monthly')[0] && $('#monthly')[0].classList[1]) {
                currlineType = 'monthly';
            } else if ($('#daily')[0] && $('#daily')[0].classList[1]) {
                currlineType = 'daily';
            } else {
                currlineType = 'daily';
            }

            if (args.attr) {
                var selected = args.attr.selected;
                to = args.attr.subtype;
            } else if (typeof args.param === 'string') {
                to = args.param;
            }
            //if (selected !== true) {
            if (currlineType !== to) {
                if (to == 'monthly' || to == 'weekly' || to == 'daily') {
                    try { //ankitz
                        currentSerie.updateData({
                            chartType: currChartType,
                            //lineType: currlineType,
                            lineType: to, //ankitz
                            ids: to,
                            isHist: this.model.isHist(),
                            redraw: redraw
                        });
                        currentSerie.set({
                            'lineType': to
                        }, {
                            'chartType': currChartType
                        }, {
                            'ids': to
                        }, {
                            silent: args.silent || false
                        });
                    } catch (e) {
                        error = e;
                        message = e.message;
                        msgType = 'error';
                    } finally {
                        //ankitz
                        this.stateModel && this.stateModel.toggle('lineType', to);
                        //if successful
                        !error && args._finally && args._finally();

                    }
                }
            }

        },
        /**
         *  This method updates the lineType between daily ,monthly & weekly when switching between ranges & when in compare mode
         *  Currently, in intra/week or compare mode only daily is allowed. This is used internally & makes use of toggleSave method
         *
         *  @method toggle_lineType
         *  @param {Boolean} update whether to update the chart
         *  @param {Boolean} redraw whether to redraw the chart
         *  @private
         *  @see {@link toggleSave toggleSave}
         */
        toggle_lineType: function(update, redraw, args) {
            var currentSerie = this.model.getPrimarySerie(),
                currlineType = currentSerie.get('lineType'),
                alreadyStored = this.toggleSave(this.config.chart.togglelineTypeKey, currlineType),
                inCompareMode = !!args.inCompareMode; //ankitz

            if (update) {
                //var serie = currentSerie.get('serie');
                var isHist = this.model.isHist();
                if (!alreadyStored && currlineType !== 'daily') {
                    //change to line
                    currentSerie.updateData({
                        lineType: 'daily',
                        ids: 'daily', //ankitz
                        inCompareMode: inCompareMode,
                        isHist: isHist,
                        redraw: redraw || false
                    });
                } else {
                    currentSerie.updateData({
                        lineType: (inCompareMode) ? 'daily' : (alreadyStored || currlineType),
                        ids: (inCompareMode) ? 'daily' : (alreadyStored || currlineType),
                        inCompareMode: inCompareMode,
                        isHist: isHist,
                        redraw: redraw || false
                    });
                }
            }
            return alreadyStored;
        },
        /**
         *  This method customizes the Navigation bar depending on the 'range' or 'client configuration' etc.
         *  Note: directly show/hide the view
         *
         *  @method customiseNavigationBar
         *  @param {args}
         *  @private
         */
        customiseNavigationBar: function(args) {
            var config = this.config;
            //ankitz: This will show/hide the chartType/LineType view when on 1D/1W
            if (args.isHist) {
                $($('#chartType')[0]).removeClass(config.chart.classNames.disabled);
                $($('#lineType')[0]).removeClass(config.chart.classNames.disabled);
                $($('#overlays')[0]).removeClass(config.chart.classNames.disabled);
                $($('#indicators')[0]).removeClass(config.chart.classNames.disabled);
                $($('#draw.entryDiv')[0]).removeClass(config.chart.classNames.disabled);
            } else {
                if (typeof config.chart.isChartTypeIntraWeekEnabled != "undefined" && !config.chart.isChartTypeIntraWeekEnabled) {
                    $($('#chartType')[0]).addClass(config.chart.classNames.disabled);
                }
                if (typeof config.chart.isLineTypeIntraWeekEnabled != "undefined" && !config.chart.isLineTypeIntraWeekEnabled) {
                    $($('#lineType')[0]).addClass(config.chart.classNames.disabled);
                }
                // ankitz: disabling Overlays/Indicators in INTRA/WEEK if config.js says so
                if (!config.chart.isOverlaysIntraWeekEnabled) {
                    $($('#overlays')[0]).addClass(config.chart.classNames.disabled);
                }

                if (!config.chart.isIndicatorsIntraWeekEnabled) {
                    $($('#indicators')[0]).addClass(config.chart.classNames.disabled);
                }

                if (!config.chart.isDrawInstancesIntraWeekEnabled) {
                    $($('#draw.entryDiv')[0]).addClass(config.chart.classNames.disabled);
                }
            }

            $($('#lineType')[0]).addClass(config.chart.classNames.disabled); //ankitz hiding lineType temporily till issue solves                                                       

        }
    });
});
