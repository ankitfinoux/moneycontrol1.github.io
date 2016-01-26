/**
*	/js/views/view_menu.js
*
*	This file has the class & its methods for creating menu
*/
define([
	//libraries
		'jquery', 'underscore', 'backbone',
	//collections
		'collection_submenus',
	//views
		'view_submenulist'
	], function(
	//libraries
		$, _, Backbone,
	//collections
		SubMenuList,
	//views
		SubMenuListView
		){
		
		return Backbone.View.extend({
			tagName	: 'li',

			template: _.template("<div id='<%=id%>' class='<%=className%>'><%=value%></div>"),

			initialize	: function(options){
				
				//Creating a new unqiue collection for the menu & storing it in the model
				var sublist = new SubMenuList (options.submenus);
				this.model.set('submenus', sublist);

				var chart = options.config.chart,
					classNames = chart.classNames,
					attr = this.model.toJSON();
				attr.className = classNames.navLiDiv;

				this.el.className = classNames.navLi;
				this.el.id = attr.id+chart.idSuffixes.navLi;

				_.bindAll(this, 'toggleSubMenu');			

				this.listenTo(this.model, 'change:subMenuHidden', this.toggleSubMenu );

				this.render(attr, classNames);
			},

			render		: function(attr, classNames){
				
				this.$el.html(this.template(attr));

				if(attr.hasSubMenu && attr.submenus.length){
					var config = this.options.config;
					this.subMenuListView = new SubMenuListView({
						submenus 	: this.options.submenus,
						config		: config,
						type 		: attr.id,
						layout 		: attr.navLayout || config.chart.navLayout,
						limit 		: attr.navLimit || config.chart.navLimit
 					});

					this.$('.'+attr.className).append(this.subMenuListView.el);
				}else{
					this.$el.addClass(classNames.disabled);
				}
			},

			toggleSubMenu: function(){
				if(this.subMenuListView){
					this.toggleSubMenu = function(){
						this.subMenuListView.toggleHide();
					}
				}else{
					this.toggleSubMenu = function(){ return false;}
				}
				this.toggleSubMenu();
			}

		});
});