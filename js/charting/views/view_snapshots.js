/**
*	/js/views/view_snapshots.js
*/

define([
	//libraries
		'jquery', 'underscore', 'backbone',
	//models
		'model_series',
	//templates
		'text!snapshot_tmpl'

	], function(
	//libraries
		$, _, Backbone,
	//models
		SerieModel,
	//templates
		SnapshotTmpl
	){
		var tmpl_str = _.template(SnapshotTmpl);

		return Backbone.View.extend({
			
			tagName: 'div',

			initialize: function(options){
				_.bindAll(this, 'removeSerie', 'update', '_delete', 'toggle', 'toggleSerie', 'enable', 'disable', 'updateName', 'updateColour');

				var chartOpt = options.config,
					classNames = chartOpt.classNames;
				this.decimals = chartOpt.decimals;
				this.el.className = classNames.snapshot+' '+classNames.snapshot+'-'+options.mode;
				this.hideClass = classNames.hide;
				this.disabledClass = classNames.disabled;
				
				this.listenTo( this.model, 'reload-readings', this.update);
				this.listenTo( this.model, 'change:visible', this.toggle);
				this.listenTo( this.model, 'change:hexColour', this.updateColour);
				this.listenTo( this.model, 'remove remove-snapshot', this._delete);
				this.listenTo( this.model, 'change:id', this.updateName);
				this.listenTo( this.model, 'enable', this.enable);
				this.listenTo( this.model, 'change:isDisabled', function(model, value){
					if(!value){
						this.enable();
					}else{
						this.disable();
					}
				});

				this.visible = true;
				this.disabled = false;

				this.render();
			},
			
			events: {
				'click .close': 'removeSerie',
				'click .inner-wrpr': 'toggleSerie'
			},
			
			render: function(){
				var attr = this.model.toJSON(),					
					colour = (attr.colour instanceof Array)? attr.colour[0] : attr.colour,
					isSerie = this.model instanceof SerieModel,
					hasVolume = isSerie && this.options.hasVolume; // only serie models have volumes
					//for angel
					exch="<div class='snapshot-exchange'>"+((attr.exchange)?" - "+attr.exchange.toUpperCase():"")+"</div>";;
					snapshotTitle="<div class='snapshot-company'>"+(isSerie? attr.name: attr.title)+"</div>";

				this.hasVolume = hasVolume;
				
				this.updateColour(this.model, colour);

				this.$el.append(tmpl_str({
					title:snapshotTitle+exch , //for angel snapshot name should appear as "Reliance Communi... - NSE"
					links: attr.links,
					hasChange: isSerie,
					serie : isSerie && 'serie',
					hasVolume: hasVolume,
					mode : this.options.mode
				}));

				this.value = this.$('.serie-readings .value');
				this.change = this.$('.serie-readings .change');
				this.volValue = this.$('.volume-readings .value');
				this.volChange = this.$('.volume-readings .change');

				this.name = this.$('.serieName');
			},

			removeSerie: function(e){
				e.stopPropagation();
				this.model.trigger('remove-view', this.model);
			},

			_delete: function(model){
				//remove the snapshot view
				this.remove();
			},

			updateColour: function(model, colour){
				this.$el.css({'background-color' : colour});
			},

			updateName: function(model, value){
				this.name.html(value);
			},

			update: function(vals){
				if(this.visible && !this.disabled && !vals.error){
					var value;
					if(vals.change){
						value = vals.y.toIndian(this.decimals);
						this.change.html('('+vals.change.toIndian(this.decimals)+'%)');
						
						if(this.hasVolume){
							this.volValue.html(vals.volY.toIndian());
							this.volChange.html('('+vals.volChange.toIndian(this.decimals)+'%)');
						}
					}else{
						var r = _.compact([
							vals.low && vals.low.toIndian(this.decimals), 
							vals.y && vals.y.toIndian(this.decimals), 
							vals.high && vals.high.toIndian(this.decimals)
						]);
						value = r.join(' / ');
					}

					if(vals.colour){
						this.updateColour(null, vals.colour);
					}
					this.value.html(value);

					//if(vals.colour)			
				}else if(vals && vals.error){
					console && console.warn("Error while reading value ", vals);
				}
				
			},

			toggle: function(model, value){
				var hide = !value;

				if(hide){
					this.$el.addClass(this.hideClass);
				}else{
					//removing even disabled class as we are NOT saving "legend toggle" state
					this.$el.removeClass(this.hideClass+" "+this.disabledClass);
					this.visible = true;
				}
			},

			toggleSerie: function(e){
				//state is NOT saved for "legend toggle"
				if(this.disabled){
					//do not undo its visibility if its disabled
					return;
				}

				var op = (this.visible) ? 'hide': 'show';
				this.model[op](true);
				this.visible = !this.visible;

				this.$el.toggleClass(this.disabledClass);
			},

			enable: function(){
				this.$el.removeClass(this.disabledClass);
				this.disabled = false;
			},

			disable: function(){
				this.$el.addClass(this.disabledClass);
				this.disabled = true;
			}
		});
});