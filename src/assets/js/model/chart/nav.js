export default function(initialPeriod, minPeriods) {
    return {
        data: [],
        viewDomain: [],
        period: initialPeriod,
        minimumPeriods: minPeriods,
        trackingLatest: true
    };
}
