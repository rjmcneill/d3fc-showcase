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

export default function() {
    var yScale = d3.scale.linear();
    var yAxis = fc.svg.axis()
      .scale(yScale)
      .orient('right');

    var yAxisWidth = 60;

    function yAxisChart(selection) {
        var model = selection.datum();
        var currentYValueAccessor = function(d) { return d.close; };

        var latestPrice = currentYValueAccessor(model.data[model.data.length - 1]);
        var tickValues = produceAnnotatedTickValues(yScale, [latestPrice]);
        var visibleData = util.domain.filterDataInDateRange(model.viewDomain, model.data);

        yAxis.tickFormat(model.product.priceFormat);

        var extentAccessors = ['high', 'low'];      //TODO: Fix

        var paddedYExtent = fc.util.extent()
            .fields(extentAccessors)
            .pad(0.08)(visibleData);

        yScale.domain(paddedYExtent);

        yAxis.tickValues(tickValues)
            .decorate(function(s) {
                var closePriceTick = s
                    .filter(function(d) { return d === latestPrice; })
                    .classed('closeLine', true);

                var calloutHeight = 18;
                closePriceTick.select('path')
                    .attr('d', function() {
                        return d3.svg.area()(calculateCloseAxisTagPath(yAxisWidth, calloutHeight));
                    });
                closePriceTick.select('text')
                    .attr('transform', 'translate(' + calloutHeight / 2 + ',1)');
            });

        selection.call(yAxis);
    }

    yAxisChart.dimensionChanged = function(container) {
        yScale.range([parseInt(container.style('height'), 10), 0]);
    };

    return yAxisChart;
}
