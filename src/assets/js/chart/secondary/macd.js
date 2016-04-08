import d3 from 'd3';
import fc from 'd3fc';
import jquery from 'jquery';
import util from '../../util/util';
import tool from '../../tool/tool';
import event from '../../event';
import base from './base';
import crosshairDecorator from '../../tool/decorator/crosshair/crosshairDecorator';

export default function() {
    var dispatch = d3.dispatch(event.viewChange, event.crosshairChange);
    var zeroLine = fc.annotation.line()
        .value(0)
        .label('');
    var renderer = fc.indicator.renderer.macd();
    var algorithm = fc.indicator.algorithm.macd();

    var crosshairData = [];
    var crosshair = tool.crosshair()
        .on(event.crosshairChange, dispatch.crosshairChange);

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

    function bandCrosshair(model) {
        var root = function(d) { return d.macd; };
        var yValue = function(d) { return root(d).macd; };
        var width = util.barWidth(renderer, model.data, yValue);
        crosshair.decorate(function(s) { crosshairDecorator.band(s, width); });
    }

    var initialised = false;
    var macdSeries;

    function initialiseSeries(primarySeries) {
        // Initialise the series to allow the secondaries to snap correctly
        // This is needed to ensure we can snap to data before the bar chart
        // part of the macd indicator starts.
        macdSeries = jquery.extend({}, primarySeries);
        macdSeries.xScale = renderer.xScale;
        macdSeries.yScale = renderer.yScale;
        macdSeries.xValue = renderer.xValue;
        macdSeries.yValue = renderer.yValue;
    }

    function macd(selection) {
        var model = selection.datum();

        if (!initialised) {
            initialiseSeries(model.primarySeries.option);
            initialised = true;
        }

        algorithm(model.data);

        crosshair.snap(fc.util.seriesPointSnapXOnly(macdSeries, model.data));
        bandCrosshair(model);

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
