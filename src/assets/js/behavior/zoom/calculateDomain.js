import util from '../../util/util';
import zoomUtils from './zoomUtils';

export default function(scale, data, discontinuityProvider, xExtent, zoomed, trackingLatest) {
    var domain = scale.domain();

    if (zoomed && trackingLatest) {
        domain = util.domain.moveToLatest(
            discontinuityProvider,
            domain,
            data);
    }

    return zoomUtils.clampDomain(scale, domain, data, xExtent);
}
