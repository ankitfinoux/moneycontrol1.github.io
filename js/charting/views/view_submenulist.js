/**
*	/js/views/view_submenulist.js
*/
define([
	//librraies
		'jquery', 'underscore', 'backbone',
	//views
		'view_submenu'
	], function(
	//librraies
		$, _, Backbone,
	//views
		SubMenuView
	){
		return Backbone.View.extend({
			tagName: 'div',
			
			initialize: function(options){
				var chart = options.config.chart,
					classNames = chart.classNames;
				this.el.className = classNames.subMenuWrpr+' '+classNames.hide;
				this.el.id = options.type+chart.idSuffixes.subMenuWrpr;

				this.hideClass = classNames.hide;

				this.render(classNames);
			},
			render: function(classNames){
				var options = this.options,
					submenus = options.submenus,
					len = submenus.length,
					limit = options.limit,
					col = 1,
					eachCol = len;
				//logic for multi-colum view
				if(options.layout === 'multi-column'){
					if(len> limit){
						col = Math.ceil( len / limit );
						eachCol = Math.floor(len / col);
						var rem = len % col;

					}
					var begin = 0;
					this.$el.append('<div class="'+classNames.innerSubMenuWrpr+'">');
					this.$wrpr = this.$('.'+classNames.innerSubMenuWrpr);
					for(var i=0; i < col; i++){
						this.$wrpr.append('<div class="'+classNames.subMenuCol+'" id="col'+i+'"><ul class="'+classNames.subMenuUl+'" id="navUl'+i+'"></ul></div>');
						var views = [],
							end = begin + eachCol;
						if(rem && i < rem){
							end ++;
						}

						var sublist = submenus.slice(begin, end);
						//	console.log(i, begin, end, sublist);
						_.each(sublist, function(model){
							var subV = new SubMenuView({
								model: model,
								config: options.config
							});
							views.push(subV.el);
						});

						this.$('#navUl'+i).append(views);

						begin = end;
					}

					
				}else{
					this.$el.append('<div class="'+classNames.innerSubMenuWrpr+'"><ul class="'+classNames.subMenuUl+'"></ul></div>')
					var views = [];
					_.each(this.options.submenus, function(model){
						var subV = new SubMenuView({
							model: model,
							config: options.config
						});
						views.push(subV.el);
					});

					this.$('.'+classNames.subMenuUl).append(views);
				}
			},
			toggleHide: function(){
				this.$el.toggleClass(this.hideClass);
			}
		});

});