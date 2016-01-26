/**
*	/js/views/view_settings.js
*/

define([
	//libraries
		'jquery', 'underscore', 'backbone',
	//templates
		'text!settings_tmpl'
], function(
	//libraries
		$, _, Backbone,
	//templates
		SettingsTmpl
	){

	var template = _.template(SettingsTmpl);
	
	return Backbone.View.extend({
		tagName	: 'div',

		initialize: function(options){
			var classNames = options.classNames;
			this.el.className = classNames.settingsMenuWrpr+' '+classNames.hide;

			this.hideClass = classNames.hide;

			this.render(classNames);
		},

		render: function(classNames){
			var str = template({classNames : classNames, entries : this.collection});
			this.$el.append(str);
		},

		hide: function(){
			this.$el.addClass(this.hideClass);
		},

		show: function(){
			this.$el.removeClass(this.hideClass)
		},

		toggle: function(){
			if(this.$el.hasClass(this.hideClass)){
				this.show();
			}else{
				this.hide();
			}
		}
	});
});