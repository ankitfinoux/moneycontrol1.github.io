/**
 *	/js/views/view_menuSelector.js
 */

define([
    //libraries
    'jquery', 'underscore', 'backbone',
    //views
    'view_menu', 'view_settings',
    //template
    'text!nav_tmpl'
], function(
    //libraries
    $, _, Backbone,
    //views
    MenuView, SettingsView,
    //template
    NavTmpl

) {

    var tmpl_str = _.template(NavTmpl);

    return Backbone.View.extend({
        tagName: 'nav',

        template: tmpl_str,

        initialize: function(options) {

            this.isTouch = options.isTouch;

            var classNames = options.config.chart.classNames;
            this.classNames = classNames;
            this.el.className = classNames.nav;

            _.bindAll(this, 'refresh', 'attachListenerTo', 'detachMenuEvents', 'updateDate', 'subMenuClicked',
                'menuHandler', 'toggleNav', 'settingsHandler', 'settingClicked');

            this.attachListenerTo(options.priSerie);

            //add selected key to the submenus
            options.submenus.select(options.selected);
            this.evtMap = {
                'mouseenter': 'show',
                'touchstart': 'toggle'
            };


            //adding a "menu" namespace by attaching .classNames.navUl to the event
            //useful for selective unbinding of events
            var eventKey1, eventKey2, eventKey3, eventKey4, eventKey5, eventKey6;
            var navClass = classNames.navUl + ' .' + classNames.navLiDiv,
                subMenu = classNames.navUl + ' .' + classNames.subMenuDiv,
                settingClass = classNames.settings,
                settingsEntry = classNames.settingsEntry;
            if (true) {
                eventKey1 = 'mouseenter .' + navClass;
                eventKey2 = 'mouseleave .' + navClass;
                eventKey3 = 'click.' + subMenu;
                eventKey4 = 'mouseenter .' + settingClass;
                eventKey5 = 'mouseleave .' + settingClass;
                eventKey6 = 'click .' + settingsEntry;
            } else {
                //if touch
                eventKey1 = 'click .' + navClass;
                eventKey3 = 'touchstart .' + subMenu;
                eventKey4 = 'touchstart .' + settingClass;
                eventKey6 = 'touchstart .' + settingsEntry;
            }


            var events = {};
            //menu events
            events[eventKey1] = 'menuHandler';
            events[eventKey2] = 'menuHandler';
            events[eventKey3] = 'subMenuClicked';
            //settings events
            events[eventKey4] = 'settingsHandler';
            events[eventKey5] = 'settingsHandler';
            events[eventKey6] = 'settingClicked';

            this.events = events;

            this.render();
        },

        detachMenuEvents: function() {
            // this shall turn off all menu events
            this.$el.off('.' + this.classNames.navUl);
            return this;
        },

        render: function() {

            var collection = this.collection,
                len = collection.length,
                config = this.options.config,
                view = [],
                submenusCollection = this.options.submenus,
                classNames = this.classNames;

            this.$el.append(this.template({
                classNames: classNames
            }));

            for (var i = 0; i < len; i++) {
                var model = collection.at(i),
                    submenuList = submenusCollection.where({
                        type: model.get('id')
                    });

                var menuView = new MenuView({
                    model: model,
                    submenus: submenuList,
                    config: config
                });
                view.push(menuView.el);
            }
            this.$('.' + classNames.navUl).append(view);

            //settings
            this.settingView = new SettingsView({
                collection: this.options.settings,
                classNames: classNames
            })

            this.$('.' + classNames.settings).append(this.settingView.$el);
            //date
            this.date = this.$('.' + classNames.date);

        },

        attachListenerTo: function(serie) {
            //stopListening to any previously bound events
            this.stopListening(this, 'reload-date');

            //re-attach the listener to the new serie
            this.listenTo(serie, 'reload-date', this.updateDate);
        },

        refresh: function(serie) {
            this.attachListenerTo(serie);
        },

        menuHandler: function(e) {
            var menu = this.collection.get(e.currentTarget.id);
            menu.toggleSubMenu();
        },

        subMenuClicked: function(e) {
            var model = this.options.submenus.get(e.target.id);
            //				console.log(e.target.id, model)

            //grab the parent menu's model & call handleClick
            //handleClick will undo the currently
            var type = model.get('type');
            var menuModel = this.collection.get(type);
            menuModel.handleClick();

            model.click();
            if (this.isTouch && type !== 'radio') {
                return false;
            }
        },

        settingsHandler: function(e) {
            var mapSel = this.evtMap[e.type] || 'hide';

            //alert("setting: "+mapSel+e.type);
            this.settingView[mapSel]();
        },

        settingClicked: function(e) {

            //alert("setting click "+e.target.id)
            var model = this.options.settings.get(e.target.id);
            if (model)
                model.click();

            if (this.isTouch) {
                return false;
            }
        },

        toggleNav: function() {

            if (!this.isDisabled) {
                //hide any open submenu views
                var subMenusVisible = this.collection.where({
                    subMenuHidden: false
                });
                if (subMenusVisible.length)
                    _.each(subMenusVisible, function(model) {
                        model.toggleSubMenu();
                    });

                this.detachMenuEvents();
                this.isDisabled = true;
            } else {
                this.delegateEvents();
                this.isDisabled = false;
            }

            //disable the nav
            var menu = this.$('.' + this.classNames.navUl);
            menu.toggleClass(this.classNames.disabled);
        },

        updateDate: function(value) {
            //this.date.removeClass(this.classNames.hide)
            value = value || '-'
            this.date.html(value);
        }

    });
});
