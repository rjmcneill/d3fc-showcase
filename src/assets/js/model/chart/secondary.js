export default function(initialProduct, initialDiscontinuityProvider, initialPeriod, minimumVisiblePeriods) {
    return {
        data: [],
        visibleData: [],
        viewDomain: [],
        trackingLatest: true,
        product: initialProduct,
        discontinuityProvider: initialDiscontinuityProvider,
        indicators: [],
        period: initialPeriod,
        minimumVisiblePeriods: minimumVisiblePeriods
    };
}
