/**
*	/js/views/view_rangeSelector.js
*/

define([
		'jquery', 'underscore', 'backbone',
	//views
		'view_rangeButtons', 'view_calenderButtons'
	], function(
		$, _, Backbone,
	//views
		ButtonsView, CalenderView
	){
	
		return Backbone.View.extend({
			tagName: 'div',
			
			initialize: function(options){
				var chartOpt = options.config.chart,
					classNames = chartOpt.classNames;

				this.el.className = classNames.rangeSelector+' '+classNames.rangeSelector+'-'+options.mode;
				_.bindAll(this, 'buttonClicked', 'blur', 'toggleCalender', 'update', 'updateDate', 'onChange');

//				console.log("RangeSelector View initialized");
				if(typeof options.select === 'number'){
					var sel = this.collection.findWhere({index: options.select});
					sel && sel.select(true);
				}

				//Since the event's css selector is dynamic we attach the listener explicitly
				var events = {}
				eventsKey1 = 'click .'+classNames.rangeButtons;
				eventsKey2 = 'click .'+classNames.calenderButtons;

				events[eventsKey1] = 'buttonClicked';
				events[eventsKey2] = 'toggleCalender';

				this.events = events;

				this.listenTo(this.collection, 'blurRS', this.blur);
				this.render(chartOpt);
			},
			
			render: function(chartOpt){
				var collection = this.collection,
					len = collection.length,
					classNames = chartOpt.classNames,
					idSuffixes = chartOpt.idSuffixes,
					mode = this.options.mode,
					view = [];
				
				//add the range buttons
				for(var i=0; i < len; i++){
					var btnView = new ButtonsView({
						model : collection.at(i),
						mode  : mode,
						classNames: classNames
					});
					view.push(btnView.el);
				}

				if(this.options.hasDateView){
					this.hasCalender = this.options.hasCalender;
					//add the calender buttons

					var fromBtn = new CalenderView({
						type: 'from',
						enableCalender: this.hasCalender,
						classNames: classNames,
						idSuffixes: idSuffixes,
						todayBtn	: false, // #BUG FIX: disabling today btn for from. 
											 // bug occurs when to date is set to some value in the past
						onChange	: this.onChange 
					});
					this.fromBtn = fromBtn;
					view.push(fromBtn.el);

					var toBtn = new CalenderView({
						type: 'to',
						enableCalender: this.hasCalender,
						classNames: classNames,
						idSuffixes: idSuffixes,
						todayBtn	: 'Today',
						onChange	: this.onChange 	
					});
					this.toBtn = toBtn;
					view.push(toBtn.el);
				}


				this.$el.append(view);
				
			},

			buttonClicked : function(e){
				var next = this.collection.get(e.target.id);
				next.click();
			},

			toggleCalender: function(e){
				if(e && this.hasCalender){
					e.stopPropagation();
					this[e.currentTarget.id+'Btn'].toggle();
				}
			},

			update: function(id, blur){
				this.blur();

				if(!blur){
					var next = this.collection.get(id);
					next.select();
				}
			},

			blur: function(arg){
				var current = this.collection.findWhere({'selected': true});
				if(current){
					current.deselect();
				}

			},

			//update the date in the Date section of the calender
			updateDate: function(e){
				//console.log(e, 'update ');
				this.updating = true;
				if(this.currentMin !== e.min){
					this.fromBtn.update(e.min);
					this.currentMin = e.min;
				}
				if(this.currentMax !== e.max){
					this.toBtn.update(e.max);
					this.currentMax = e.max;
				}
				this.updating = false;
			},

			//This is called when a user changes the date in the calender
			onChange: function(type, value){
				var toType, setRange, currBtn;
				if(type === 'from'){
					toType = 'to';
					setRange = 'min';
				}else{
					toType = 'from';
					setRange = 'max';
				}
				currBtn = this[toType+'Btn'];
				currBtn && currBtn['set_'+setRange](value);

				if(this.updating){
					return;
				}

				this.trigger('change', type, value);
			}	
			
		});
});