import d3 from 'd3';
import fc from 'd3fc';

var tickTextHeight;
var resized = false;

function calculateCloseAxisTagPath(width, height) {
    var h2 = height / 2;
    return [
        [0, 0],
        [h2, -h2],
        [width, -h2],
        [width, h2],
        [h2, h2],
        [0, 0]
    ];
}

function removeTicksNearExtent(selection, yTickValues, yDomain, containerHeight) {
    var ratio = (yDomain[1] - yDomain[0]) / containerHeight;

    // Select all needed to avoid rebinding all of the container's data to the first tick
    var textSelection = selection.selectAll('text');

    if (textSelection[0][0] && resized) {
        var tickHeightStr = textSelection.style('height');
        tickHeightStr = tickHeightStr.replace(/[A-Za-z$-]/g, '');
        tickTextHeight = parseInt(tickHeightStr, 10);
        resized = false;
    }

    // Remove ticks too close to lower extents
    yTickValues.forEach(function(tickValue, index) {
        if (tickValue < (yDomain[0] + (tickTextHeight * ratio) / 2)) {
            yTickValues.splice(index, 1);
        }
    });

    //Remove ticks too close to upper extents
    yTickValues.forEach(function(tickValue, index) {
        if (tickValue > (yDomain[1] - (tickTextHeight * ratio) / 2)) {
            yTickValues.splice(yTickValues.splice(index, 1));
        }
    });

    return yTickValues;
}

export default function(yScale, orient) {
    yScale = yScale || d3.scale.linear();
    orient = orient || 'right';

    var yTickValues;
    var yDomain;
    var latestPrice;
    var yTickFormat;
    var yTicks;

    var yAxisWidth = 60;
    var containerHeight;

    function yAxisChart(selection) {
        yScale.domain(yDomain);

        if (yTickValues) {
            yTickValues = removeTicksNearExtent(selection, yTickValues, yDomain, containerHeight);
        }

        var yAxis = fc.svg.axis()
            .scale(yScale)
            .orient(orient)
            .ticks(yTicks)
            .tickValues(yTickValues)
            .tickFormat(yTickFormat);

        if (latestPrice) {
            yAxis.decorate(function(s) {
                var closePriceTick = s
                    .filter(function(d) {
                        return d === latestPrice;
                    })
                    .classed('close-line', true);

                var calloutHeight = 18;
                closePriceTick.select('path')
                    .attr('d', function() {
                        return d3.svg.area()(calculateCloseAxisTagPath(yAxisWidth, calloutHeight));
                    });
                closePriceTick.select('text')
                    .attr('transform', 'translate(' + calloutHeight / 2 + ',1)');
            });
        }

        selection.call(yAxis);
    }

    yAxisChart.yTicks = function(x) {
        if (!arguments.length) {
            return yTicks;
        }
        yTicks = x;
        return yAxisChart;
    };

    yAxisChart.yTickValues = function(x) {
        if (!arguments.length) {
            return yTickValues;
        }
        yTickValues = x;
        return yAxisChart;
    };

    yAxisChart.yTickFormat = function(x) {
        if (!arguments.length) {
            return yTickFormat;
        }
        yTickFormat = x;
        return yAxisChart;
    };

    yAxisChart.yDomain = function(x) {
        if (!arguments.length) {
            return yDomain;
        }
        yDomain = x;
        return yAxisChart;
    };

    yAxisChart.closePrice = function(x) {
        if (!arguments.length) {
            return latestPrice;
        }
        latestPrice = x;
        return yAxisChart;
    };

    yAxisChart.dimensionChanged = function(container) {
        resized = true;
        containerHeight = parseInt(container.style('height'), 10);
        yScale.range([parseInt(container.style('height'), 10), 0]);
    };

    return yAxisChart;
}
