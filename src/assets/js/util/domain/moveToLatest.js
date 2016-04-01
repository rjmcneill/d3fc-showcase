import d3 from 'd3';
import fc from 'd3fc';
import util from '../util';

export default function(discontinuityProvider, domain, data, minimumVisiblePeriods, selectedPeriod, desiredRatio) {
    if (arguments.length < 6) {
        desiredRatio = 1;
    }
    var dataExtent = fc.util.extent()
        .fields('date')(data);

    var domainExtent = fc.util.extent()
        .fields(fc.util.fn.identity)(domain);

    var dataTimeExtent = discontinuityProvider.distance(dataExtent[0], dataExtent[1]);
    var scaledDomainTimeDifference = desiredRatio * discontinuityProvider.distance(domainExtent[0], domainExtent[1]);

    var scaledLiveDataDomain = scaledDomainTimeDifference < dataTimeExtent ?
      [discontinuityProvider.offset(dataExtent[1], -scaledDomainTimeDifference), dataExtent[1]] : dataExtent;
    var minimumPeriodMilliseconds = minimumVisiblePeriods * selectedPeriod * 1000;

    if (scaledLiveDataDomain[1].getTime() - scaledLiveDataDomain[0].getTime() < minimumPeriodMilliseconds) {
        var xExtentMilliseconds = util.domain.domainMilliseconds(dataExtent);
        minimumPeriodMilliseconds = xExtentMilliseconds < minimumPeriodMilliseconds ? xExtentMilliseconds : minimumPeriodMilliseconds;
        var lowerDate = new Date(scaledLiveDataDomain[1].getTime() - minimumPeriodMilliseconds);
        scaledLiveDataDomain = [lowerDate, scaledLiveDataDomain[1]];
    }

    return scaledLiveDataDomain;
}
