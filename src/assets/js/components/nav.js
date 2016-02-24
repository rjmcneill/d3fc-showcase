import d3 from 'd3';
import fc from 'd3fc';

export default function(xScale, yScale, viewScale) {
    viewScale = viewScale || fc.scale.dateTime();

    var dispatch = d3.dispatch('navigationstart', 'navigation', 'navigationend');

    var navChart = fc.chart.cartesian(xScale, yScale);

    var area = fc.series.area();
    var line = fc.series.line();
    var gridlines = fc.annotation.gridline()
        .xScale(xScale)
        .yScale(yScale);
    var brush = d3.svg.brush();
    var navMulti = fc.series.multi()
        .series([gridlines, area, line, brush])
        .mapping(function(series) {
            if (series === brush) {
                brush.extent([
                    [viewScale.domain()[0], navChart.yDomain()[0]],
                    [viewScale.domain()[1], navChart.yDomain()[1]]
                ]);
            } else {
                // This stops the brush data being overwritten by the point data
                return this.data;
            }
        });

    // Exposed variables
    var viewDomain;
    var xGridlines = 0;
    var yGridlines = 0;
    var yValue = function(d) { return d.y; };
    var xValue = function(d) { return d.x; };

    function nav(selection) {
        selection.each(function() {
            viewScale.domain(viewDomain);

            area.xValue(xValue)
                .yValue(yValue);
            line.xValue(xValue)
                .yValue(yValue);

            // Dispatch the brush events as navigation events
            brush.on('brushstart', function() { dispatch.navigationstart(); })
            .on('brush', function() { dispatch.navigation(); })
            .on('brushend', function() { dispatch.navigationend(); });

            gridlines.xTicks(xGridlines)
                .yTicks(yGridlines);

            navChart.plotArea(navMulti);
            selection.call(navChart);
        });
    }

    nav.viewDomain = function(x) {
        if (!arguments.length) {
            return viewDomain;
        }
        viewDomain = x;
        return nav;
    };

    nav.xGridlines = function(x) {
        if (!arguments.length) {
            return xGridlines;
        }
        xGridlines = x;
        return nav;
    };

    nav.yGridlines = function(x) {
        if (!arguments.length) {
            return yGridlines;
        }
        yGridlines = x;
        return nav;
    };

    nav.yValue = function(x) {
        if (!arguments.length) {
            return yValue;
        }
        yValue = x;
        return nav;
    };

    nav.xValue = function(x) {
        if (!arguments.length) {
            return xValue;
        }
        xValue = x;
        return nav;
    };

    d3.rebind(nav, dispatch, 'on');
    d3.rebind(nav, navChart, 'xDomain', 'yDomain', 'xTicks', 'yTicks', 'xTickValues',
        'yTickValues', 'xTickFormat', 'yTickFormat', 'margin', 'decorate');
    d3.rebind(nav, brush, 'extent');

    return nav;
}
