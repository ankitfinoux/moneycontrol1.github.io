/**
*	/js/views/view_rangeButtons.js
*
*	This file has the class & its methods for creating rangeSelector buttons
*/
define([
		'jquery', 'underscore', 'backbone'
	], function($, _, Backbone){
		
		return Backbone.View.extend({
			initialize	: function(options){
//				console.log("Init: rangeButtons");
				
				this.listenTo( this.model, 'change:selected', function(model, value){
					this[(value)?'focus':'blur']();
				}, this );

				this.selectedClass = options.classNames.selectedButton;

				var attr = this.model.toJSON(),
					rangeButtons = options.classNames.rangeButtons,
					className = rangeButtons+' '+rangeButtons+'-'+options.mode;

				this.el.className = className;
				this.el.id = attr.id;

				this.render(attr.text);

				if(attr.selected){
					this.focus();
				}
			},
			render		: function(html){
				this.$el.html(html);
			},
			focus		: function(){
				this.$el.addClass(this.selectedClass);
			},
			blur		: function(){
				this.$el.removeClass(this.selectedClass);
			}
		});
});