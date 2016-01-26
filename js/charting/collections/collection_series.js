/**
 *	/js/collections/collection_series.js
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'model_series'
], function($, _, Backbone, SeriesModel) {

    return Backbone.Collection.extend({
        initialize: function() {
            //console.log("New Widgets collection created");
        },
        model: SeriesModel
    });
})
