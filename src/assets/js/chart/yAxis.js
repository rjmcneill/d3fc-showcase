import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';

var tickTextHeight;
var resized = false;

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

function removeTicksNearExtent(selection, tickValues, paddedYExtent, height) {
    // var ratio = (paddedYExtent[1] - paddedYExtent[0]) / height;

    var textSelection = selection.select('text');

    // if (textSelection[0][0] && resized) {
    //     var tickHeightStr = textSelection.style('height');
    //     tickHeightStr = tickHeightStr.replace(/[A-Za-z$-]/g, '');
    //     tickTextHeight = parseInt(tickHeightStr, 10);
    //     resized = false;
    // }

    // // Remove ticks too close to lower extents
    // tickValues.forEach(function(tickValue, index) {
    //     if (tickValue < (paddedYExtent[0] + (tickTextHeight * ratio))) {
    //         console.log('HIT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    //         tickValues.splice(index, 1);
    //     }
    // });


    // // Remove ticks too close to upper extents
    // tickValues.forEach(function(tickValue, index) {
    //     if (tickValue > (paddedYExtent[1] - (tickTextHeight * ratio))) {
    //         console.log('HIT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    //         tickValues.splice(tickValues.splice(index, tickValues.length - index));
    //     }
    // });
}

export default function() {
    var yScale = d3.scale.linear();
    var yAxis = fc.svg.axis()
      .scale(yScale)
      .orient('right');

    var yAxisWidth = 60;
    var containerHeight;

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

        // removeTicksNearExtent(selection, tickValues, paddedYExtent, containerHeight);
        var textSelection = selection.select('text');

        yScale.domain(paddedYExtent);

        console.log(typeof(tickValues[0]), tickValues[0]);

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
        resized = true;
        containerHeight = parseInt(container.style('height'), 10);
        yScale.range([parseInt(container.style('height'), 10), 0]);
    };

    return yAxisChart;
}
