import d3 from 'd3';
import fc from 'd3fc';

export default function() {

    var dataGenerator = fc.data.random.financial(),
        allowedPeriods = [60 * 60 * 24],
        candles,
        granularity,
        product = null,
        dateRange = [];

    var dataGeneratorAdaptor = function(cb) {
        var millisecondsPerDay = 24 * 60 * 60 * 1000;
        var endDate = dateRange.length === 2 ? dateRange[1] : new Date();
        endDate.setHours(0, 0, 0, 0);
        var startDate = dateRange.length === 2 ? dateRange[0] : new Date(endDate - (candles - 1) * millisecondsPerDay);
        candles = dateRange.length === 2 ? Math.ceil((dateRange[1] - dateRange[0]) / millisecondsPerDay) : candles;

        dataGenerator.startDate(startDate);
        var data = dataGenerator(candles);
        cb(null, data);
    };

    dataGeneratorAdaptor.candles = function(x) {
        if (!arguments.length) {
            return candles;
        }
        candles = x;
        return dataGeneratorAdaptor;
    };

    dataGeneratorAdaptor.dateRange = function(x) {
        if (!arguments.length) {
            return dateRange;
        }
        dateRange = x;
        return dataGeneratorAdaptor;
    };

    dataGeneratorAdaptor.granularity = function(x) {
        if (!arguments.length) {
            return granularity;
        }
        if (allowedPeriods.indexOf(x) === -1) {
            throw new Error('Granularity of ' + x + ' is not supported. ' +
            'Random Financial Data Generator only supports daily data.');
        }
        granularity = x;
        return dataGeneratorAdaptor;
    };

    dataGeneratorAdaptor.product = function(x) {
        if (!arguments.length) {
            return dataGeneratorAdaptor;
        }
        if (x !== 'Data Generator') {
            throw new Error('Random Financial Data Generator does not support products.');
        }
        product = x;
        return dataGeneratorAdaptor;
    };

    dataGeneratorAdaptor.apiKey = function() {
        throw new Error('Not implemented.');
    };

    return dataGeneratorAdaptor;
}
