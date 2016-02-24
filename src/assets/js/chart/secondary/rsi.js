import d3 from 'd3';
import fc from 'd3fc';
import event from '../../event';
import util from '../../util/util';
import base from './base';

export default function() {
    var dispatch = d3.dispatch(event.viewChange, event.crosshairChange);
    var renderer = fc.indicator.renderer.relativeStrengthIndex();
    var algorithm = fc.indicator.algorithm.relativeStrengthIndex();
    var tickValues = [renderer.lowerValue(), 50, renderer.upperValue()];

    var crosshairData = [];
    var crosshair = util.crosshair()
        .on(event.crosshairChange, dispatch.crosshairChange);

    var chart = base()
        .series([renderer, crosshair])
        .yTickValues(tickValues)
        .mapping(function(series) {
            switch (series) {
            case crosshair:
                return crosshairData;
            default:
                return this;
            }
        })
        .on(event.viewChange, function(domain) {
            dispatch[event.viewChange](domain);
        });

    var initialised = false;
    var rsiSeries = {};

    function initialiseSeries() {
        // Initialise the series to allow the secondaries to snap correctly
        rsiSeries.xScale = renderer.xScale;
        rsiSeries.yScale = renderer.yScale;
        rsiSeries.xValue = renderer.xValue;
        rsiSeries.yValue = renderer.yValue;
    }

    function rsi(selection) {
        var model = selection.datum();

        // Adjust the primary series to allow the secondaries to snap correctly
        if (!initialised) {
            initialiseSeries();
            initialised = true;
        }

        crosshair.snap(fc.util.seriesPointSnapXOnly(rsiSeries, model.data));
        algorithm(model.data);

        chart.trackingLatest(model.trackingLatest)
            .xDomain(model.viewDomain)
            .yDomain([0, 100]);

        selection.call(chart);
    }

    d3.rebind(rsi, dispatch, 'on');

    rsi.dimensionChanged = function(container) {
        chart.dimensionChanged(container);
    };

    return rsi;
}
