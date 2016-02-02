import d3 from 'd3';
import fc from 'd3fc';
import util from '../util';

export default function(domain, data, minimumVisiblePeriods, selectedPeriod, desiredRatio) {
    if (arguments.length < 5) {
        desiredRatio = 1;
    }

    var dataExtent = fc.util.extent()
      .fields('date')(data);
    var dataTimeExtent = (dataExtent[1].getTime() - dataExtent[0].getTime()) / 1000;
    var domainTimes = domain.map(function(d) { return d.getTime(); });
    var scaledDomainTimeDifference = desiredRatio * (d3.max(domainTimes) - d3.min(domainTimes)) / 1000;
    var scaledLiveDataDomain = scaledDomainTimeDifference < dataTimeExtent ?
      [d3.time.second.offset(dataExtent[1], -scaledDomainTimeDifference), dataExtent[1]] : dataExtent;
    var minimumPeriodMilliseconds = minimumVisiblePeriods * selectedPeriod * 1000;

    if (scaledLiveDataDomain[1].getTime() - scaledLiveDataDomain[0].getTime() < minimumPeriodMilliseconds) {
        var xExtent = fc.util.extent()
          .fields('date')(data);
        var xExtentMilliseconds = util.domain.domainMilliseconds(xExtent);
        minimumPeriodMilliseconds = xExtentMilliseconds < minimumPeriodMilliseconds ? xExtentMilliseconds : minimumPeriodMilliseconds;
        var lowerDate = new Date(scaledLiveDataDomain[1].getTime() - minimumPeriodMilliseconds);
        scaledLiveDataDomain = [lowerDate, scaledLiveDataDomain[1]];
    }

    return scaledLiveDataDomain;
}
