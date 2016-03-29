import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';

export default function() {
    var xScale = fc.scale.dateTime();

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient('bottom');

    function preventTicksMoreFrequentThanPeriod(period) {
        var scaleTickSeconds = (xScale.ticks()[1] - xScale.ticks()[0]) / 1000;

        if (scaleTickSeconds < period.seconds) {
            xAxis.ticks(period.d3TimeInterval.unit, period.d3TimeInterval.value);
        } else {
            xAxis.ticks(6);
        }
    }

    function adaptTickFormatting() {
        var scaleTickSeconds = (xScale.ticks()[1] - xScale.ticks()[0]) / 1000;

        if (scaleTickSeconds <= 1800) {
            xAxis.tickFormat(d3.time.format('%H:%M, %d %b'));
        } else if (scaleTickSeconds <= 21600) {
            xAxis.tickFormat(d3.time.format('%I %p, %a %d %b'));
        } else if (scaleTickSeconds <= 608400) {
            xAxis.tickFormat(d3.time.format('%a %d, %b %Y'));
        } else if (scaleTickSeconds <= 2592000) {
            xAxis.tickFormat(d3.time.format('%B, %Y'));
        }
    }

    function xAxisChart(selection) {
        var model = selection.datum();
        xScale.domain(model.viewDomain);

        xScale.discontinuityProvider(model.discontinuityProvider);

        preventTicksMoreFrequentThanPeriod(model.period);
        adaptTickFormatting();

        selection.call(xAxis);

        selection.selectAll('text')
            .call(function(text) {
                text.each(function() {
                    var _this = d3.select(this);
                    var split = _this.text().split(',');
                    _this.text(null);
                    _this.append('tspan')
                        .attr('class', 'axis-label-main')
                        .attr('dy', '0.6em')
                        .attr('x', 0)
                        .text(split[0]);
                    _this.append('tspan')
                        .attr('class', 'axis-label-secondary')
                        .attr('dy', '1em')
                        .attr('x', 0)
                        .text(split[1]);
                });
            });
    }

    xAxisChart.dimensionChanged = function(container) {
        xScale.range([0, util.width(container.node())]);
    };

    return xAxisChart;
}
