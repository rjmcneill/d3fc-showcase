import d3 from 'd3';
import fc from 'd3fc';
import util from '../util';

export default function(discontinuityProvider, domain, data, minimumVisiblePeriods, selectedPeriod, ratio) {
    if (arguments.length < 6) {
        ratio = 1;
    }

    var dataExtent = fc.util.extent()
        .fields('date')(data);

    var domainExtent = fc.util.extent()
        .fields(fc.util.fn.identity)(domain);

    var dataTimeExtent = discontinuityProvider.distance(dataExtent[0], dataExtent[1]);
    var scaledDomainTimeDifference = ratio * discontinuityProvider.distance(domainExtent[0], domainExtent[1]);

    var scaledLiveDataDomain = scaledDomainTimeDifference < dataTimeExtent ?
        [discontinuityProvider.offset(dataExtent[1], -scaledDomainTimeDifference), dataExtent[1]] : dataExtent;
    var minimumPeriodMilliseconds = minimumVisiblePeriods * selectedPeriod * 1000;

    if (discontinuityProvider.distance(scaledLiveDataDomain[0], scaledLiveDataDomain[1]) < minimumPeriodMilliseconds) {
        var xExtentMilliseconds = util.domain.domainMilliseconds(dataExtent, discontinuityProvider);
        minimumPeriodMilliseconds = xExtentMilliseconds < minimumPeriodMilliseconds ? xExtentMilliseconds : minimumPeriodMilliseconds;
        var lowerDate = discontinuityProvider.offset(scaledLiveDataDomain[1], -minimumPeriodMilliseconds);
        scaledLiveDataDomain = [lowerDate, scaledLiveDataDomain[1]];
    }

    return scaledLiveDataDomain;
}
