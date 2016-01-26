/**
*	Utility file for storing & fetching stored settings
*/
define([
	//libraries
		'jquery', 'underscore',
	//config
		'config'
	], function(
	//libraries
		$, _,
	//config
		config
		){

		if(typeof(Storage) !== 'undefined'){
			var key = config.localStorageKey;

			return {
				update: function(){

				},

				destroy: function(widget_name){
					/**
					*	@param {string} widget_name
					*/
					var stored = localStorage[key];
			
					if(stored & stored[widget_name]){
						delete stored[widget_name];
						return true;
					}
						
					return false;
				},
			
				fetch: function(widget_name, filter){
					/**
					*	@param {string} widget_name
					*	@param {array of strings | string} filter - sub selection to filter
					*/

					var stored = localStorage[key],
						selection = (stored) ? JSON.parse(stored) : null;
						
					if(selection && filter){
						var keys = _.isArray(filter)?filter.join(','): filter;
						selection[widget_name].selection = _.pick(selection[widget_name].selection, keys);
					}
					
					return (selection)?selection[widget_name]: null;
						
				}

			};

		}else{
			// Storage doesn't exists on your browser
           /* this.trigger('warn', {
            	str: "Storage doesn't exists on your browser",
            	on: 'initializing view storage'
            });*/
			return null;
		}
	});