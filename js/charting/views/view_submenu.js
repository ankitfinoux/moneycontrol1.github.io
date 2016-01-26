/**
*	/js/views/view_submenu.js
*/
define([
	//librraies
		'jquery', 'underscore', 'backbone'
	], function(
	//librraies
		$, _, Backbone
	){
		return Backbone.View.extend({
			tagName: 'li',
			
			initialize: function(options){
				
				_.bindAll(this, 'toggle');
				this.listenTo( this.model, 'change:selected', this.toggle);

				var chartConf =options.config.chart,
					classNames = chartConf.classNames,
					attr = this.model.toJSON();

				this.selectedClass = classNames.subMenuSelected;
				
				this.el.className = classNames.subMenuLi;
				this.el.id = attr.id+chartConf.idSuffixes.subMenuLi;
				
				this.template = _.template("<div class='"+classNames.subMenuDiv+"' id='<%=id%>'><div class='"+classNames.checkmark+"'></div><%=value%></div>");
				
				this.render(attr);

				if(attr.selected){
					this.toggle();
				}
			},
			render: function(attr){
				this.$el.append(this.template(attr));
			},
			toggle: function(){
				this.$('div').toggleClass( this.selectedClass );
			}
		});

});