import d3 from 'd3';
import fc from 'd3fc';
import debounce from '../../../util/debounce';

export default function() {
    var rateLimit = 1000;       // The coinbase API has a limit of 1 request per second

    var historicFeed = fc.data.feed.coinbase(),
        candles,
        dateRange = [];

    var coinbaseAdaptor = debounce(function coinbaseAdaptor(cb) {
        var endDate = dateRange.length === 2 ? dateRange[1] : new Date();
        var startDate = dateRange.length === 2 ? dateRange[0] : (d3.time.second.offset(endDate, -candles * historicFeed.granularity()));

        historicFeed.start(startDate)
            .end(endDate);

        historicFeed(cb);
    }, rateLimit);

    coinbaseAdaptor.candles = function(x) {
        if (!arguments.length) {
            return candles;
        }
        candles = x;
        return coinbaseAdaptor;
    };

    coinbaseAdaptor.dateRange = function(x) {
        if (!arguments.length) {
            return dateRange;
        }
        dateRange = x;
        return coinbaseAdaptor;
    };

    coinbaseAdaptor.apiKey = function() {
        throw new Error('Not implemented.');
    };

    d3.rebind(coinbaseAdaptor, historicFeed, 'end', 'granularity', 'product');

    return coinbaseAdaptor;
}
