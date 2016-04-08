export default function(initialProduct, initialDiscontinuityProvider, initialPrimarySeries) {
    var model = {
        data: [],
        visibleData: [],
        crosshairData: null,
        viewDomain: [],
        trackingLatest: true,
        product: initialProduct,
        discontinuityProvider: initialDiscontinuityProvider,
        indicators: [],
        primarySeries: initialPrimarySeries
    };

    return model;
}
