import d3 from 'd3';
import fc from 'd3fc';
import util from '../../util/util';
import event from '../../event';
import base from './base';

export default function() {
    var dispatch = d3.dispatch(event.viewChange, event.crosshairChange);
    var volumeBar = fc.series.bar()
        .xValue(function(d) { return d.date; })
        .yValue(function(d) { return d.volume; });

    var crosshairData = [];
    var crosshair = util.crosshair()
        .on(event.crosshairChange, dispatch.crosshairChange);

    var chart = base()
        .series([volumeBar, crosshair])
        .yTicks(4)
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
    var volumeSeries = {};

    function initialiseSeries() {
        // Initialise the series to allow the secondaries to snap correctly
        volumeSeries.xScale = volumeBar.xScale;
        volumeSeries.yScale = volumeBar.yScale;
        volumeSeries.xValue = volumeBar.xValue;
        volumeSeries.yValue = volumeBar.yValue;
    }

    function bandCrosshair(model) {
        var mapFunction = function(d, i) { return xScale(xValue(d, i)); };
        var barWidth = volumeBar.barWidth();
        var xValue = volumeBar.xValue();
        var yValue = function(d) { return d.volume; };
        var y0Value = d3.functor(0);
        var x0Value = d3.functor(0);
        var xScale = volumeBar.xScale();

        var filteredData = model.data.filter(fc.util.fn.defined(x0Value, y0Value, xValue, yValue));
        var width = barWidth(filteredData.map(mapFunction));

        crosshair.decorate(function(s) {
            s.classed('band', true);

            s.selectAll('.vertical > line')
              .style('stroke-width', width);
        });
    }

    function volume(selection) {
        selection.each(function(model) {

            if (!initialised) {
                initialiseSeries();
                initialised = true;
            }

            crosshair.snap(fc.util.seriesPointSnapXOnly(volumeSeries, model.data));
            bandCrosshair(model);

            var paddedYExtent = fc.util.extent()
                .fields('volume')
                .pad(0.08)(model.data);
            if (paddedYExtent[0] < 0) {
                paddedYExtent[0] = 0;
            }

            chart.yTickFormat(model.product.volumeFormat)
                .trackingLatest(model.trackingLatest)
                .xDomain(model.viewDomain)
                .yDomain(paddedYExtent);

            selection.call(chart);
        });
    }

    d3.rebind(volume, dispatch, 'on');

    volume.dimensionChanged = function(container) {
        chart.dimensionChanged(container);
    };

    return volume;
}
