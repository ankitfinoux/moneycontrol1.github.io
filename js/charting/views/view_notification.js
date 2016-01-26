/**
*	/js/views/view_notification.js
*/
define([
	'jquery', 'underscore', 'backbone'
], function($, _, Backbone){
	
	var notifyTmpl = _.template("<div class=<%=classNames.notifyMsg%>><%=msg%></div><div class='<%=classNames.notifyClose%>'></div>");
	
	return Backbone.View.extend({
		initialize: function(options){
			this.el.className = options.classNames.notify+' '+options.type;
			this.render(options);
		},
		events:{
			'click' : 'remove'
		},
		render: function(options){
			this.$el.append( notifyTmpl({classNames : options.classNames, msg: options.msg}) );
			//this.$el.html(options.msg);

			setTimeout(_.bind(function(){this.remove()}, this), options.time || 5000);
		}
	});
});