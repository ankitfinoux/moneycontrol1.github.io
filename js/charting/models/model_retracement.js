/**
*   /js/models/model_retracement.js
*/
define([
    //libraies
        'jquery', 'underscore', 'backbone'
    ], function(
    //libraries
        $, _ , Backbone
    ){

    return Backbone.Model.extend({
    	defaults:{
    		//coordinates
    		init: null,
    		drag: null,
    		final: null,
    		
    		ref: null,
    		path: null,
    		pathText: null,
    		group: null,
    		groupText: null,
    		data: null,

    		visible: true,
            complete: false
    	},
    	insert: function(chart, value, decimals){
    		var attr = this.toJSON();
            if(!attr.final){
                return;
            }

    		var	group = attr.group,
    			groupText = attr.groupText,
    			data = attr.data,
    			intervals = attr.intervals,
    			ref = attr.ref || [];

    		if(!group && !attr.complete){
    			this.trigger('empty-model', this);
    			return;
    		}
    		
    		for(var i=0, len = data.length; i< len; i++){
	    		if(!ref[i]){
	    			var obj = this.createObject(data[i], intervals[i], attr.id+i, attr.type, decimals);
	    			ref[i] = chart.addSeries(obj, false);
	    		}else{
	    			ref[i].setData(data[i], false);
	    		}
	    	};

	    	if(attr.redraw !== false){
                chart.redraw();
            }

    		group && group.destroy();
    		groupText && groupText.destroy();
    		this.set({
    			'ref': ref,
    			'path': [], 
    			'group': null, 
    			'groupText': null,
    			'pathText': [],
                complete: true
    		});
    	},
    	draw: function(renderer, value, decimals){

    		var attr = this.toJSON(),
    			group = attr.group,
    			groupText = attr.groupText,
    			path = attr.path || [],
    			pathText = attr.pathText || [],
    			intervals = attr.intervals,
    			data = attr.data || [],
    			len = intervals.length,
    			init_pos = attr.init.pos,
    			init_coord = attr.init.coord,
    			drag_pos = attr.drag.pos,
    			drag_coord = attr.drag.coord;
    		var x1 = init_pos.x,
    			y1 = init_pos.y,
    			x2 = drag_pos.x,
    			y2 = drag_pos.y,
    			x1value = init_coord.x,
    			y1value = init_coord.y,
    			x2value = drag_coord.x,
    			y2value = drag_coord.y,
    			xlow_value = x1value,
    			xhigh_value = x2value,
    			y_value = [];

    		var order = 0,
    			xlow = x1,
    			xhigh = x2;

    		if(y1 < y2){
    			order = len -1 -2;
    		}

    		if(x1 > x2){
    			xlow = x2;
    			xhigh = x1;
    			xlow_value = x2value;
    			xhigh_value = x1value;
    		}

    		for(var i =0; i < len; i++){
    			var val = intervals[order].value,
    				y = y1 + (y2 - y1) * val;
            
    			y_value[i] = y1value + (y2value - y1value) * val;
                if((i==7 || i==8) && y1< y2 ){
                    var val = intervals[i].value;
                    y_value[i] = ((y_value[6] - y_value[0]) * val) + y_value[0];
                }
    			data[i] = [ [xlow_value, y_value[i]], [xhigh_value, y_value[i]] ];                
    			var labelText = y_value[i].toIndian(decimals) +" ("+intervals[i].text+")";

    			//for next iteration
    			if(y1 < y2 && order!=0){
                   order--;
                }
               else if (y1 > y2){
                 order++;
               }


               

    			if(path[i]){
	    			var d = "M "+xlow+" "+y+" L "+xhigh+" "+y;
					path[i].attr('d', d);

					pathText[i].attr({
							text: labelText,
							x: xhigh -28,
							y: y-6
						}).css({
							fontSize: '11px',
							color: '#666'
						});
	    		}else{
	    			if(!group){
		    			group = renderer.g( attr.type ).add();
		    			groupText = renderer.g( attr.type+'-text' ).add();
		    		}

	    			path[i] = renderer.path(['M', xlow, y, 'L', xhigh, y])
								.attr({
									name	: attr.type,
									id		: attr.id+i,
									stroke	: intervals[i].colour,
									opacity : 0.75,
									'stroke-width'	: 1
								})
							   .add(group)
							   .toFront();

					pathText[i] = renderer.text(labelText, xhigh, y)
									.add(groupText);
	    		}
    		}

    		//throttle this
	    	this.set({'path':  path, 'pathText': pathText, 'group': group, 'groupText': groupText, data : data});
    	},
    	createObject: function(data, interval, id, type, decimals){
    		var obj = {
    			animation: false,
    			type: 'line',
	        	data: data,
	        	id: id,
	        	name: type,
	        	lineWidth: 1,
	        	color: interval.colour,
	        	enableMouseTracking: false,
	        	showInLegend : false,
	        	dataLabels:{
					enabled: true,
					formatter: function(){
						if(this.point === this.series.data[1]){
							return this.y.toIndian(decimals || 2)+' ('+this.series.options.unit+')' 
						}
					},
                    x: 12,
                    y: -1
				},
				unit : interval.text
    		};

    		return obj;

    	},
    	refresh: function(attr){
    		var init = attr.init || attr;
    		//resetting the final parameter so that collection.getCurrent() can fetch this one
    		this.set({'final': null, 'drag': null, data: []}, {silent: true});
    		this.set('init', init);
    	},
    	drag: function(param){
    		this.set('drag', param);
    	},
    	final: function(param){
    		this.set('final', param);
    		this.set('drag', null);
    	},
    	toggle: function(){
    		var refs = this.get('ref'),
    			visible = this.get('visible'),
                chart;
    		var op =  visible ? 'hide': 'show';
    		_.each(refs, function(ref){
            	if(ref){
    				ref.setVisible(!visible, false);
            	}
            });

    		this.set('visible', !visible);
    	},
        purge: function(){
            var refs = this.get('ref');
            _.each(refs, function(ref){
            	if(ref)
            		ref.remove();
            });
        },
        pluckState: function(){
            var state = this.pick('id', 'init', 'final', 'visible',  'data','complete');
            return state;
        }
    });
});