export default function(initialPeriod, minimumVisiblePeriods) {
    return {
        data: [],
        viewDomain: [],
        period: initialPeriod,
        minimumVisiblePeriods: minimumVisiblePeriods,
        trackingLatest: true
    };
}
