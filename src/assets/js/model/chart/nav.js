export default function(initialDiscontinuityProvider, initialPeriod, minimumVisiblePeriods) {
    return {
        data: [],
        viewDomain: [],
        period: initialPeriod,
        minimumVisiblePeriods: minimumVisiblePeriods,
        trackingLatest: true,
        discontinuityProvider: initialDiscontinuityProvider
    };
}
