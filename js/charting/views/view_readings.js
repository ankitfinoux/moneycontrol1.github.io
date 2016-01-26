/**
 *  /js/views/view_header.js
 */

define([
    //libraries
    'jquery', 'underscore', 'backbone',
    //template
    'text!readings_tmpl'
], function(
    //libraries
    $, _, Backbone,
    //template
    ReadingsTmpl
) {

    var readings_str = _.template(ReadingsTmpl);

    return Backbone.View.extend({
        initialize: function(options) {
            _.bindAll(this, 'update', 'redraw', 'attachListenerTo', 'refresh');

            var chartOpt = options.config,
                classNames = chartOpt.classNames;
            this.decimals = chartOpt.decimals;
            this.el.className = classNames.readings;

            this.hideClass = classNames.hide;
            this.isHidden = false;
            this.splitSubTitleFor = chartOpt.splitSubTitleFor;


            this.listenTo(this.model, 'change:currentRange', this.redraw);

            var priSerie = this.model.getPrimarySerie();

            this.attachListenerTo(priSerie);
            this.render(priSerie);
        },

        attachListenerTo: function(serie) {
            //stopListening to any previously bound events
            this.stopListening(this, 'reload-ohlc-readings');

            //re-attach the listener to the new serie
            this.listenTo(serie, 'reload-ohlc-readings', this.update);
            this.listenTo(serie, 'refresh', this.render);
        },

        getName: function(attr) {
            var name_split = attr.name.split('-'),
                title = attr.title || '',
                name = attr.name || '';

            if (name_split.length && _.indexOf(this.splitSubTitleFor, attr.asset) !== -1) {
                name = name_split[0];
                title = name_split[1];
            }

            return {
                name: name,
                title: title
            };
        },

        render: function(priSerie) {
            var attr = priSerie.toJSON(),
                options = this.options,
                asset = attr.asset, //options.asset,
                mode = options.mode,
                isAdvanced = mode === 'advanced',
                chartOpt = options.config,
                readings = chartOpt.readings,
                isHist = this.model.isHist(),
                showVolume = this.model.get('showVolumeReading'),
                subReadings = _.without(readings, chartOpt.plotOn),
                links = attr.links || {};
            //  page_link = links.page;// || _.template(chartOpt.link.page, {title: attr.title.replace(/^\s+|\.|\s+$/g, '').replace(/ /g, '-')}, {variable: 'data'});

            if (!isAdvanced) {
                this.el.className += ' ' + this.el.className + '-' + mode;
            }
            var head = this.getName(attr);

            var tmpl_str = readings_str({
                subReadings: subReadings,
                isHist: isHist,
                name: head.name,
                subtitle: head.title,
                mode: mode,
                isAdvanced: isAdvanced,
                link: {
                    company: links.company || './#',
                    buy: links.buy,
                    sell: links.sell
                },
                showVolume: showVolume,
                exchange: attr.exchange,
                classNames: chartOpt.classNames,
                idSuffixes: chartOpt.idSuffixes
            });

            this.$el.html(tmpl_str);


            //grabbing references for faster updates
            this.readings = readings
            this.plotOn = chartOpt.plotOn;
            this.core = this.$('.core');
            this.change = this.$('.change');
            this.arrow = this.$('.arrow');

            for (var i = 0, len = readings.length; i < len; i++) {
                var param = readings[i];
                this[param] = this.$('#' + param);
            }
        },

        //i think this is not being used now // @deprecated
        refresh: function(serieModel) {
            //this.attachListenerTo(serieModel);
            var attr = serieModel.toJSON();
            var head = this.getName(attr);
            //update the values
            this.$('.name').html(head.name);
            if (attr.exchange) {
                this.$('.exchange .val').html(attr.exchange).removeClass(this.hideClass);
            } else {
                this.$('.exchange .val').addClass(this.hideClass);
            }

            this.$('.subtitle').html(head.title);
        },

        /**
         *  Update the values on the readings bar
         */
        update: function(data) {

            if (!data.error) {
                this.$el.removeClass('reading-error');

                var value = (data[this.plotOn] || data.y).toIndian(this.decimals);
                this.core.html(value || '');

                var changeVal,
                    percentVal,
                    sign = '',
                    className = 'change',
                    arrow = 'arrow',
                    change, percent;

                if (data.change) {
                    changeVal = data.change.change;
                    percentVal = data.change.percent;
                }

                if (!_.isNull(changeVal) && !_.isUndefined(changeVal) && !_.isNaN(changeVal)) {
                    change = changeVal.toIndian(this.decimals);
                } else {
                    change = 'NA';
                }

                if (!_.isNull(percentVal) && !_.isUndefined(percentVal) && !_.isNaN(percentVal)) {
                    percent = percentVal.toIndian(this.decimals);
                } else {
                    percent = 'NA';
                }

                if (change > 0) {
                    sign = '+';
                    className = 'change green';
                    arrow = 'arrow up';
                } else if (change < 0) {
                    sign = '';
                    className = 'change red';
                    arrow = 'arrow down';
                }

                var changeTxt = sign + change + ' (' + sign + percent + '%)';
                this.change.attr('class', className).html(changeTxt);
                this.arrow.attr('class', arrow);

                var isHist = this.model.isHist(),
                    showVolume = this.model.get('showVolumeReading');
                for (var i = 0, len = this.readings.length; i < len; i++) {
                    var param = this.readings[i];
                    var data_param = data[param];
                    if (showVolume && i == 0) {
                        //last one, which should be volume
                        this[param].html(data_param && data_param.toIndian()); // no decimals here
                    } else if (isHist && i != 0) {
                        this[param].html(!_.isUndefined(data_param) ? data_param.toIndian(this.decimals) : '');
                    }
                }
            } else {
                this.$el.addClass('reading-error');
                console && console.warn("Error reading values ", data.error)
            }
        },

        /**
         *  While switching between intra/week & hist ranges some of the values are not to be show (eg. open, high, low).
         *  This function helps in redrawing of the readings bar
         */
        redraw: function() {
            var isHist = this.model.isHist(),
                hasVolume = this.model.get('hasVolume'),
                chartOpt = this.options.config,
                idSuffix = chartOpt.idSuffixes.readingsBox,
                hideClass = chartOpt.classNames.hide;

            for (var i = 0, len = this.readings.length; i < len; i++) {
                var param = this.readings[i];
                var node = this.$('#' + param + idSuffix);
                if (i == 0) {
                    // SHOW VOLUME FOR INTRA/WEEK/HIST
                    node.removeClass(hideClass);
                } else if (!isHist && i != 0) {
                    // DONT SHOW OPEN/HIGH/LOW IN INTRA/WEEK
                    node.addClass(hideClass);
                } else {
                    // SHOW OPEN / HIGH / LOW FOR ALL OTHER SITUATION
                    node.removeClass(hideClass);
                }
            }
        },

        hide: function() {
            this.isHidden = true;
            this.$el.addClass(this.hideClass);
        },

        show: function() {
            this.isHidden = false;
            this.$el.removeClass(this.hideClass);
        }

    });
});
