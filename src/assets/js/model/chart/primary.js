export default function(initialProduct, initialDiscontinuityProvider, initialPrimarySeries) {
    var model = {
        data: [],
        visibleData: [],
        crosshairData: null,
        trackingLatest: true,
        viewDomain: [],
        selectorsChanged: true,
        discontinuityProvider: initialDiscontinuityProvider
    };

    var _product = initialProduct;
    Object.defineProperty(model, 'product', {
        get: function() { return _product; },
        set: function(newValue) {
            _product = newValue;
            model.selectorsChanged = true;
        }
    });

    Object.defineProperty(model, 'series', {
        get: function() { return initialPrimarySeries; },
        set: function(newValue) {
            initialPrimarySeries = newValue;
            model.selectorsChanged = true;
        }
    });

    var _yValueAccessor = {option: function(d) { return d.close; }};
    Object.defineProperty(model, 'yValueAccessor', {
        get: function() { return _yValueAccessor; },
        set: function(newValue) {
            _yValueAccessor = newValue;
            model.selectorsChanged = true;
        }
    });

    var _indicators = [];
    Object.defineProperty(model, 'indicators', {
        get: function() { return _indicators; },
        set: function(newValue) {
            _indicators = newValue;
            model.selectorsChanged = true;
        }
    });

    return model;
}
