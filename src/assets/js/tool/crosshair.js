import d3 from 'd3';
import fc from 'd3fc';
import event from '../event';
import util from '../util/util';

export default function() {
    var dispatch = d3.dispatch(event.crosshairChange);

    var crosshair = fc.tool.crosshair()
        .xLabel('')
        .yLabel('')
        .on('trackingmove', function(updatedCrosshairData) {
            if (updatedCrosshairData.length > 0) {
                dispatch.crosshairChange(updatedCrosshairData[0].datum);
            } else {
                dispatch.crosshairChange(undefined);
            }
        })
        .on('trackingend', function() {
            dispatch.crosshairChange(undefined);
        });

    crosshair.id = util.uid();

    d3.rebind(crosshair, dispatch, 'on');

    return crosshair;
}
