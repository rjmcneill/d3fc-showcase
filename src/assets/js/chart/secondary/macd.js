import d3 from 'd3';
import fc from 'd3fc';
import util from '../../util/util';
import event from '../../event';
import base from './base';

export default function() {
    var dispatch = d3.dispatch(event.viewChange, event.crosshairChange);
    var zeroLine = fc.annotation.line()
        .value(0)
        .label('');
    var renderer = fc.indicator.renderer.macd();
    var algorithm = fc.indicator.algorithm.macd();

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
        .series([zeroLine, renderer, crosshair])
        .yTicks(5)
        .mapping(function(series) {
            switch (series) {
            case zeroLine:
                return [0];
            case crosshair:
                return crosshairData;
            default:
                return this;
            }
        })
        .decorate(function(g) {
            g.enter()
                .attr('class', function(d, i) {
                    return ['multi zero', 'multi', 'multi'][i];
                });
        })
        .on(event.viewChange, function(domain) {
            dispatch[event.viewChange](domain);
        });

    function bandCrosshair(selection, model) {
        var root = function(d) { return d.macd; };
        var mapFunction = function(d, i) { return xScale(xValue(d, i)); };
        var barWidth = renderer.barWidth();
        var xValue = renderer.xValue();
        var yValue = function(d) { return root(d).macd; };
        var y0Value = d3.functor(0);
        var x0Value = d3.functor(0);
        var xScale = renderer.xScale();

        var filteredData = model.data.filter(fc.util.fn.defined(x0Value, y0Value, xValue, yValue));
        var width = barWidth(filteredData.map(mapFunction));

        crosshair.decorate(function(s) {
            s.classed('band', true);

            s.selectAll('.vertical > line')
              .style('stroke-width', width);
        });
    }

    function macd(selection) {
        var model = selection.datum();

        // Adjust the primary series to allow the secondaries to snap correctly
        model.primarySeries.option.xScale = renderer.xScale;
        model.primarySeries.option.yScale = renderer.yScale;
        model.primarySeries.option.xValue = renderer.xValue;
        model.primarySeries.option.yValue = renderer.yValue;

        algorithm(model.data);

        crosshair.snap(fc.util.seriesPointSnapXOnly(model.primarySeries.option, model.data));
        bandCrosshair(selection, model);

        var paddedYExtent = fc.util.extent()
            .fields('macd')
            .symmetricalAbout(0)
            .pad(0.08)(model.data.map(function(d) { return d.macd; }));
        chart.trackingLatest(model.trackingLatest)
            .xDomain(model.viewDomain)
            .yDomain(paddedYExtent);

        selection.call(chart);
    }

    d3.rebind(macd, dispatch, 'on');

    macd.dimensionChanged = function(container) {
        chart.dimensionChanged(container);
    };

    return macd;
}
