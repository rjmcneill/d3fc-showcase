import d3 from 'd3';
import fc from 'd3fc';
import util from '../../util/util';
import event from '../../event';
import zoomBehavior from '../../behavior/zoom';
import yAxisChart from '../yAxis';

export default function() {
    var dispatch = d3.dispatch(event.viewChange);
    var xScale = fc.scale.dateTime();
    var yScale = d3.scale.linear();
    var trackingLatest = true;

    var multi = fc.series.multi();
    var yDomain;

    var chart = fc.chart.cartesian(xScale, yScale)
      .plotArea(multi)
      .xTicks(0)
      .margin({
          top: 0,
          left: 0,
          bottom: 0,
          right: 0
      });

    var yAxis = yAxisChart(yScale);

    var zoomWidth;

    function secondary(selection) {
        selection.each(function(model) {
            xScale.discontinuityProvider(model.discontinuityProvider);

            var chartSelection = selection.select('.secondary-container')
                .datum(model.data);
            var yAxisSelection = selection.select('#y-axis-container');

            chart.yDomain(yDomain);
            yAxis.yDomain(yDomain);

            var zoom = zoomBehavior(zoomWidth)
                .scale(xScale)
                .trackingLatest(trackingLatest)
                .on('zoom', function(domain) {
                    dispatch[event.viewChange](domain);
                });

            chartSelection.call(chart);
            yAxisSelection.call(yAxis);

            chartSelection.select('.plot-area-container')
                .datum(model)
                .call(zoom);
        });
    }

    secondary.trackingLatest = function(x) {
        if (!arguments.length) {
            return trackingLatest;
        }
        trackingLatest = x;
        return secondary;
    };

    secondary.yDomain = function(x) {
        if (!arguments.length) {
            return yDomain;
        }
        yDomain = x;
        return secondary;
    };

    d3.rebind(secondary, dispatch, 'on');
    d3.rebind(secondary, multi, 'series', 'mapping', 'decorate');
    d3.rebind(secondary, chart, 'xDomain');
    d3.rebind(secondary, yAxis, 'yTicks', 'yTickValues', 'yTickFormat');

    secondary.dimensionChanged = function(container) {
        zoomWidth = util.width(container.select('.secondary-container').node());
        yAxis.dimensionChanged(container.select('.y-axis-row'));
    };

    return secondary;
}
