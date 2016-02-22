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

    function rsi(selection) {
        var model = selection.datum();

        // Adjust the primary series to allow the secondaries to snap correctly
        var rsiSeries = {
            xScale: renderer.xScale,
            yScale: renderer.yScale,
            xValue: renderer.xValue,
            yValue: renderer.yValue
        };

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
