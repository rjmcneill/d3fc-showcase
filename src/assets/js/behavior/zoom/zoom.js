import d3 from 'd3';
import fc from 'd3fc';
import zoomUtils from './zoomUtils';

export default function(width) {

    var dispatch = d3.dispatch('zoom');

    var zoomBehavior = d3.behavior.zoom();
    var scale;

    var allowPan = true;
    var allowZoom = true;
    var trackingLatest = true;

    function resetBehaviour() {
        zoomBehavior.translate([0, 0]);
        zoomBehavior.scale(1);
    }

    function zoom(selection) {
        var model = selection.datum();

        var xExtent = fc.util.extent()
            .fields('date')(model.data);

        var min = scale(xExtent[0]);
        var max = scale(xExtent[1]);
        var zoomPixelExtent = [min, max - width];

        zoomBehavior.x(scale)
            .on('zoom', function() {
                var t = d3.event.translate;
                var tx = zoomUtils.clamp(t[0], -zoomPixelExtent[1], -zoomPixelExtent[0]);
                zoomBehavior.translate([tx, 0]);

                var panned = (zoomBehavior.scale() === 1);
                var zoomed = (zoomBehavior.scale() !== 1);

                if ((panned && allowPan) || (zoomed && allowZoom)) {
                    var domain = zoomUtils.calculateDomain(
                        scale,
                        model.data,
                        model.discontinuityProvider,
                        xExtent,
                        zoomed,
                        trackingLatest);

                    // Avoid right handle moving in at left data extent
                    if (scale(model.data[0].date) > 0) {
                        domain[1] = scale.invert(scale(domain[1]) + scale(model.data[0].date));
                        domain = zoomUtils.clampDomain(domain, xExtent);
                    }

                    if (domain[0].getTime() !== domain[1].getTime()) {
                        dispatch.zoom(domain);
                    } else {
                        // Ensure the user can't zoom-in infinitely, causing the chart to fail to render
                        // #168, #411
                        resetBehaviour();
                    }
                } else {
                    resetBehaviour();
                }
            });

        selection.call(zoomBehavior)
            .on('dblclick.zoom', null);
    }

    zoom.allowPan = function(x) {
        if (!arguments.length) {
            return allowPan;
        }
        allowPan = x;
        return zoom;
    };

    zoom.allowZoom = function(x) {
        if (!arguments.length) {
            return allowZoom;
        }
        allowZoom = x;
        return zoom;
    };

    zoom.trackingLatest = function(x) {
        if (!arguments.length) {
            return trackingLatest;
        }
        trackingLatest = x;
        return zoom;
    };

    zoom.scale = function(x) {
        if (!arguments.length) {
            return scale;
        }
        scale = x;
        return zoom;
    };

    d3.rebind(zoom, dispatch, 'on');

    return zoom;
}
