/**
 *   /js/models/model_trendline.js
 */
define([
    //libraies
    'jquery', 'underscore', 'backbone'
], function(
    //libraries
    $, _, Backbone
) {

    return Backbone.Model.extend({
        defaults: {
            //coordinates
            init: null,
            drag: null,
            final: null,

            ref: null,
            path: null,
            group: null,

            visible: true,
            complete: false
        },
        insert: function(chart, value) {
            var attr = this.toJSON();
            if (!attr.final) {
                return;
            }

            var group = attr.group;

            if (!group && !attr.complete) {
                this.trigger('empty-model', this);
                return;
            }
            var init_coord = attr.init.coord,
                final_coord = attr.final.coord;

            var obj = this.createObject(init_coord, final_coord, attr.id, attr.type);

            var ref = chart.addSeries(obj, attr.redraw || true);

            group && group.destroy();
            this.set({
                'path': null,
                'group': null,
                'ref': ref,
                complete: true
            });
        },
        draw: function(renderer, value) {
            var attr = this.toJSON(),
                group = attr.group,
                path = attr.path,
                init_pos = attr.init.pos,
                drag_pos = attr.drag.pos;

            var x1 = init_pos.x,
                y1 = init_pos.y,
                x2 = drag_pos.x,
                y2 = drag_pos.y;

            if (path) {
                var d = "M " + x1 + " " + y1 + " L " + x2 + " " + y2;
                path.attr('d', d);
            } else {
                if (!group) {
                    group = renderer.g(attr.type).add();
                }

                path = renderer.path(['M', x1, y1, 'L', x2, y2])
                    .attr({
                        name: attr.type,
                        id: attr.id,
                        stroke: attr.colour || '#734242', //MONEYCONTROL
                        opacity: 0.5,
                        'stroke-width': 1
                    })
                    .add(group)
                    .toFront();

                this.set({
                    'path': path,
                    'group': group
                });
            }
        },
        createObject: function(init, _final, id, type) {
            var data;
            if (init.x > _final.x) {
                data = [_final, init];
            } else {
                data = [init, _final];
            }

            return {
                animation: false,
                color: '#734242', //MONEYCONTROL
                data: data,
                enableMouseTracking: false,
                id: id,
                name: type,
                showInLegend: false,
                lineWidth: 1
            }
        },
        drag: function(param) {
            this.set('drag', param);
        },
        final: function(param) {
            console.log("Final", param)
            this.set('final', param);
            this.set('drag', null);
        },
        toggle: function() {
            var ref = this.get('ref'),
                visible = this.get('visible');
            ref.setVisible(!visible, false);

            this.set('visible', !visible);
        },
        purge: function() {
            var ref = this.get('ref');
            if (ref) {
                ref.remove(false);
            }
        },
        pluckState: function() {
            var state = this.pick('id', 'init', 'final', 'visible', 'complete');
            return state;
        }
    });
});
