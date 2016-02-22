import candlestickSeries from '../../series/candlestick';
import option from '../menu/option';
import util from '../../util/util';

export default function(initialProduct, initialDiscontinuityProvider) {
    var model = {
        data: [],
        visibleData: [],
        crosshairData: null,
        viewDomain: [],
        trackingLatest: true,
        product: initialProduct,
        discontinuityProvider: initialDiscontinuityProvider,
        indicators: []
    };

    var candlestick = candlestickSeries();
    candlestick.id = util.uid();
    var _primarySeries = option('Candlestick', 'candlestick', candlestick);
    _primarySeries.option.extentAccessor = ['high', 'low'];
    Object.defineProperty(model, 'primarySeries', {
        get: function() { return _primarySeries; },
        set: function(newValue) {
            _primarySeries = newValue;
            model.selectorsChanged = true;
        }
    });

    return model;
}
