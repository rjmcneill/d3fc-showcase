import d3 from 'd3';
import fc from 'd3fc';

export default function() {
    var yScale = fc.scale.linear();
    var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient('right');

    function preventTicksMoreFrequentThanPeriod(period) {
        var scaleTickSeconds = (yScale.ticks()[1] - yScale.ticks()[0]) / 1000;
        if (scaleTickSeconds < period.seconds) {
            yAxis.ticks(period.d3TimeInterval.unit, period.d3TimeInterval.value);
        } else {
            yAxis.ticks(6);
        }
    }

    function yAxisChart(selection) {
        var model = selection.datum();
        yScale.domain(model.viewDomain);
        preventTicksMoreFrequentThanPeriod(model.period);
        selection.call(yAxis);
    }

    yAxisChart.dimensionChanged = function(container) {
        yScale.range([0, parseInt(container.style('height'), 10)]);
    };

    return yAxisChart;
}
