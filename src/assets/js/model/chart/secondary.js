export default function(initialProduct, initialPeriod, minimumPeriods) {
    return {
        data: [],
        viewDomain: [],
        trackingLatest: true,
        product: initialProduct,
        period: initialPeriod,
        minimumPeriods: minimumPeriods
    };
}
