import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';

export default function(containerWidth) {
    var dispatch = d3.dispatch('zoom');

    var zoomBehavior = d3.behavior.zoom();
    var scale;

    var allowPan = true;
    var allowZoom = true;
    var trackingLatest = true;

    function controlPan(zoomExtent) {
        // Don't pan off sides
        if (zoomExtent[0] >= 0) {
            return -zoomExtent[0];
        } else if (zoomExtent[1] <= 0) {
            return -zoomExtent[1];
        }
        return 0;
    }

    function controlZoom(zoomExtent) {
        // If zooming, and about to pan off screen, do nothing
        return (zoomExtent[0] > 0 && zoomExtent[1] < 0);
    }

    function translateXZoom(translation) {
        var tx = zoomBehavior.translate()[0];
        tx += translation;
        zoomBehavior.translate([tx, 0]);
    }

    function resetBehaviour() {
        zoomBehavior.translate([0, 0]);
        zoomBehavior.scale(1);
    }

    function checkMinPeriods(domain, selectedPeriod, minimumPeriods) {
        return ((domain[1].getTime() - domain[0].getTime()) >= (selectedPeriod * minimumPeriods));
    }

    function zoom(selection) {
        var xExtent = fc.util.extent()
            .fields('date')(selection.datum().data);

        var selectedPeriod;
        var minimumPeriods;

        zoomBehavior.x(scale)
            .on('zoom', function() {
                var min = scale(xExtent[0]);
                var max = scale(xExtent[1]);

                if (selection.datum().period && selection.datum().minimumPeriods) {
                    selectedPeriod = selection.datum().period.seconds * 1000;
                    minimumPeriods = selection.datum().minimumPeriods;
                }

                var maxDomainViewed = controlZoom([min, max - containerWidth]);
                var panningRestriction = controlPan([min, max - containerWidth]);
                translateXZoom(panningRestriction);

                var panned = (zoomBehavior.scale() === 1);
                var zoomed = (zoomBehavior.scale() !== 1);

                if ((panned && allowPan) || (zoomed && allowZoom)) {
                    var domain = scale.domain();

                    if (maxDomainViewed) {
                        domain = xExtent;
                    } else if (zoomed && trackingLatest) {
                        domain = util.domain.moveToLatest(domain, selection.datum().data);
                    }

                    if (checkMinPeriods(domain, selectedPeriod, minimumPeriods)) {
                        dispatch.zoom(domain);
                    } else {
                        // Ensure the user can't zoom-in infinitely, causing the chart to fail to render
                        // #168, #411, #499
                        resetBehaviour();
                    }
                } else {
                    resetBehaviour();
                }
            });
        selection.call(zoomBehavior);
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
