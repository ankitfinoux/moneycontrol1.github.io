/**
* /js/holidays.js
*/
define([
	'jquery', 'underscore', 'config'
	],function($, _, defaultConfig){

		var conf = defaultConfig.chart,
			holidays = conf.holidays || [],
			url = conf.exchangeHolidaysURL,
			defaultExchange = conf.defaultExchange,
			exchangeHolidays = {};

		exchangeHolidays[defaultExchange] = [];

		var ONE_DAY = conf.ONE_DAY;

		//write ajax function here
		if(url){
			$.ajax({
				dataType: 'json',
				url: url,
				success: function(data, statues, xhr){
					_.each(data, function(value, key){
						var timestamp = [];
						for(var i=0, len = value.length; i < len; i++){
							timestamp[i] = Date.parse(value[i].date)
						}
						exchangeHolidays[key] = timestamp;
					})
				},
				error: function(xhr, error, status){
					console && console.error("Error loading holiday list");
				}
			});
		}

		return {
			/**
			*	Returns whether a particular date was a holiday or not
			*
			*	@method isHoliday
			*	@param {Number|String|Date} date 
			*	@param {String} exchange  stock exchange to look for eg. NSE, BSE etc
			*	@returns {Boolean} isHoliday
			*	@public
			*/
			isHoliday: function(date, exchange){
				if(typeof date !== 'number'){
				//if(typeof date === 'string' || date instanceof Date){
					date = Date.parse(date); // convert to timestamp
					date = _.isNaN(date) ? false : date;
				}
				exchange = exchange || defaultExchange;
				exchange = exchange.toLowerCase()

				if(date){
					//Check if its a weekend holiday
					var day = new Date(date).getDay(),
						isWeekend = _.indexOf(holidays, day) !== -1;

					if(isWeekend){
						return isWeekend;
					}

					//Not a weekend, check if its an exchange holiday
					var data = exchangeHolidays[exchange];
					var isHoliday = _.indexOf(data, date) !== -1;
					
					return isHoliday;
				}
			},

			/**
			*	This function returns the nearest non-holiday date if its a holiday else returns the same date
			*
			*	@method getNearestDate
			*	@param {Number|String|Date} date
			*	@param {String} exchange
			*	@param {Boolean} [beforeOrAfter] nearest non-holiday date before or after the given date
			*	@returns {Date}
			*	@public
			*	@todo Need to add a robust logic here. Currently we just return a date which is not a Sat or Sun
			*/
			getNearestDate: function(date, exchange, beforeOrAfter){
				var isHoliday = this.isHoliday(date, exchange);
				if(isHoliday){
					//TODO: Temporary Logic. Pls change the logic later
					var nextDate = date+ONE_DAY,
						prevDate = date-ONE_DAY,
						day = new Date(date).getDay(),
						newDate;
						//nextDay = new Date(nextDate).getDay(),
						//prevDay = new Date(prevDate).getDay();

					if(day === 0){ // if sunday
						newDate = nextDate;
					}else{ //if(day === 6){ // if saturday
						newDate = prevDate;
					}
					//}else{
					//	newDate = prevDate;

					return newDate;
				}else{
					return date;
				}
			}
		}
	
});