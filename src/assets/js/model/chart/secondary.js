export default function(initialProduct, initialPeriod, minimumVisiblePeriods) {
    return {
        data: [],
        viewDomain: [],
        trackingLatest: true,
        product: initialProduct,
        period: initialPeriod,
        minimumVisiblePeriods: minimumVisiblePeriods
    };
}
