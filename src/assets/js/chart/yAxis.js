import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';

function produceAnnotatedTickValues(scale, annotation) {
    var annotatedTickValues = scale.ticks.apply(scale, []);

    var extent = scale.domain();
    for (var i = 0; i < annotation.length; i++) {
        if (annotation[i] > extent[0] && annotation[i] < extent[1]) {
            annotatedTickValues.push(annotation[i]);
        }
    }
    return annotatedTickValues;
}

function getExtentAccessors(multiSeries) {
    return multiSeries.reduce(function(extentAccessors, series) {
        if (series.extentAccessor) {
            return extentAccessors.concat(series.extentAccessor);
        } else {
            return extentAccessors;
        }
    }, []);
}

export default function() {
    var yScale = d3.scale.linear();
    var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient('right');

    function yAxisChart(selection) {
        var model = selection.datum();
        var currentYValueAccessor = function(d) { return d.close; };

        var latestPrice = currentYValueAccessor(model.data[model.data.length - 1]);
        var tickValues = produceAnnotatedTickValues(yScale, [latestPrice]);
        var visibleData = util.domain.filterDataInDateRange(model.viewDomain, model.data);
        var lowest;
        var highest;

        visibleData.forEach(function(dataPoint) {
            if (dataPoint.high > highest || !highest) {
                highest = dataPoint.high;
            }

            if (dataPoint.low < lowest || !lowest) {
                lowest = dataPoint.low;
            }
        });

        // console.log(lowest, highest);

        var dataRange = [Math.max.apply(Math, model.data), Math.min.apply(Math, model.data)];
        var extentAccessors = ['high', 'low'];      //TODO: Fix

        var paddedYExtent = fc.util.extent()
            .fields(extentAccessors)
            .pad(0.08)(visibleData);

        yScale.domain(paddedYExtent);

        yAxis.tickValues(tickValues);

        selection.call(yAxis);
    }

    yAxisChart.dimensionChanged = function(container) {
        yScale.range([parseInt(container.style('height'), 10), 0]);
    };

    return yAxisChart;
}
