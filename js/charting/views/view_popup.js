/**
*	/js/views/view_popup.js
*/
define([
	//libraries
		'jquery', 'underscore', 'backbone',
	//templates
		'text!popup_tmpl'
	], function(
	//libraries
		$, _, Backbone,
	//templates
		popup_tmpl
	){

		var tmpl = _.template(popup_tmpl),
			input_error = 'input-error';

		return Backbone.View.extend({
			tagName : 'section',

			className : 'widget-popup',

			template: tmpl,

			events: {
				'focus input'		: 'clearErrors',
				'blur input' 		: 'blur',
				'click .draw_btn'	: 'validate',
				'click .close'		: 'cancel',
				'click .text'		: 'select' ,
				'keypress' 			: 'isEnterKey'
			},

			initialize: function(options){
				_.bindAll(this, 'clearErrors', 'blur', 'validate', 'cancel', 'success', 'select', 'isEnterKey');

				if(!options.callback){
					//noop
					options.callback = function(){}
				}
				if(!options.name)
					options.name = 'Popup';


				if(options.popupOpt){
					var html = this.template(options);
					this.render(html);
				}else{
					console && console.warn("No popup options are specified");
					//this.remove();
				}
			},

			render: function(html){
				this.$el.append( html );
			},

			clearErrors: function(e){
				//add the focus class to the parent li
				$(e.target).parent('li').addClass('focus');
				
				if(this.error){
					this.$('input').removeClass(input_error).val('');

					this.error = false;
				}
			},

			blur: function(e){
				//remove the focus class to the parent li
				$(e.target).parent('li').removeClass('focus');
			},

			select: function(e){
				$(e.target).next().focus();
				this.clearErrors(e);
			},

			cancel: function(){
				this.remove();
				this.options.loaded(); //#loading screen fix
				return false;
			},

			isEnterKey: function(e){
				if(e.which === 13){
					this.validate();
				}
			},

			validate: function(){
				var values = [],
					errorInputs = [],
					pairCount = -1,
					prevPair = [],
					param = this.options.param,
					view = this,
					obj;

				_.each(this.options.popupOpt, function(each, i){
					var error = false,
						key = each.key,
						input = view.$('#'+key+i),
						val = input.val(),
						len = val.length,
						value = val;


					if(each._typeof === 'number'){
						value = (each.integer)? parseInt(val): parseFloat(val);

						if(each.allowNegative === false && value && value < 0){
							//input is negative
							error = true;
						}
					}

					if(!each.optional && !value){
						// Required
						error = true;
					}

					if(each.optional && !value && len){
						//optional, so empty is fine
						error = true;
					}

					if(!error && each._typeof && typeof value !== each._typeof) {
						error = true;
					}
					

					if(error){
						errorInputs.push(input);
					}

					if(!error && len){
					
						// ---- Logic for pairing the keys
						if( !prevPair.length){
							prevPair.push(key);
						}

						if(_.indexOf(prevPair, key) !== -1){
							//if same key repeats, create a new pair
							pairCount++;
							obj = {};
							obj[key] = value;
							values[pairCount] = obj;
						}else{
							//new key
							prevPair.push(key);
							//add to the current object
							values[pairCount][key] = value;
						}
						// ---- Logic for pairing the keys
					}
				});

				if(errorInputs.length){
					this.error = true;
					_.each(errorInputs, function(input){
						input.addClass(input_error).val('Invalid Input');
					});
				}else{
					values = _.map(values, function(e, i){
						return _.defaults(e, param);
					})
					this.success(values);
				}
			},

			success: function(values){
				
				//execute the callback
				this.options.callback(values);
				
				//remove the view/popup
				this.remove();
			}
		});
});