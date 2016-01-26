/**
 *   /js/views/view_calenderButtons.js
 */

define([
    //libraries
    'jquery', 'underscore', 'backbone', 'picker', 'pickadate',
    //config
    'config',
    //template
    'text!calender_tmpl'
], function(
    //libraries
    $, _, Backbone, Picker, Pickadate,
    //config
    defaultConfig,
    //template
    CalenderTmpl
) {

    var tmplStr = _.template(CalenderTmpl),
        firstDate = defaultConfig.chart.firstDate;

    return Backbone.View.extend({
        initialize: function(options) {
            var classNames = options.classNames,
                className = classNames.calenderButtons + ' ' + options.type;

            if (options.enableCalender) {
                className += ' ' + classNames.pointer;
            }
            this.el.className = className;
            this.el.id = options.type;
            //ankitz added tooltip on the hovering of calender input
            this.el.title = "Select " + options.type + " Date";
            this.type = options.type;
            this.hide = classNames.hide;

            this.render(classNames);

        },
        render: function(classNames) {
            classNames = classNames || this.options.classNames;
            var html = tmplStr({
                classNames: classNames,
                enableCalender: this.options.enableCalender
            });

            this.$el.append(html);
            this.dateHidden = true;
            this.calenderHidden = true;

            this.$calenderPage = this.$('.' + classNames.calenderPage);
            this.$img = this.$('.' + classNames.calenderImg);
            this.$calender = this.$('.' + classNames.calender);

            //adding calender
            if (this.options.enableCalender) {
                var calInput = this.$('.' + classNames.calenderInput),
                    calWrpr = this.$('.' + classNames.calender);
                calInput.pickadate({
                    container: calWrpr,
                    max: true,
                    min: firstDate,
                    today: this.options.todayBtn,
                    selectYears: true,
                    selectMonths: true,
                    onSet: _.bind(function(event) {
                        if (event.select) {
                            //only if a date is selected
                            this.options.onChange(this.type, event.select);
                        }
                    }, this)
                });
                this.calenderRef = calInput.pickadate('picker');
            }

            this.$date = this.$('.date');
            this.$month = this.$('.month');
            this.$year = this.$('.year');
        },
        toggle: function() {
            if (this.calenderRef) {
                if (this.calenderRef.get('open')) {
                    this.calenderRef.close();
                } else {
                    this.calenderRef.open();
                }
            }
        },
        empty: function() {
            this.$calenderPage.addClass(this.hide);
            this.$img.removeClass(this.hide);
            this.dateHidden = true;
        },
        update: function(timeStamp) {
            var date = new Date(timeStamp);
            var d = date.toDateString().split(' ');
            if (d.length > 2) { // Not Invalid Date 

                this.$date.html(d[2]);
                this.$month.html(d[1]);
                this.$year.html(d[3]);

                if (this.dateHidden) {
                    this.$calenderPage.removeClass(this.hide);
                    this.$img.addClass(this.hide);
                    this.dateHidden = false;
                }

                //select the date in the calender
                this.calenderRef && this.calenderRef.set('select', date);

            } else {
                //show empty 
                this.empty();
            }
        },
        set_min: function(date) {
            if (date instanceof Date) {
                date = date;
            } else if (typeof date === 'number') {
                date = new Date(date);
            } else {
                date = firstDate;
            }
            this.calenderRef && this.calenderRef.set('min', date);
        },
        set_max: function(date) {
            if (date instanceof Date) {
                date = date;
            } else if (typeof date === 'number') {
                date = new Date(date);
            } else if (typeof date !== 'undefined') {
                date = date;
            } else {
                date = true;
            }

            this.calenderRef && this.calenderRef.set('max', date);
        }

    })
});
