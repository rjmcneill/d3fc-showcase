import d3 from 'd3';
import fc from 'd3fc';
import event from '../event';

export default function() {
    var charts = [];
    var dispatch = d3.dispatch(event.viewChange, event.crosshairChange);

    function key(d) { return d.id; }

    var secDataJoin = fc.util.dataJoin()
        .children(true)
        .selector('.secondary-container')
        .element('svg')
        .attr('class', function(d) {
            return 'secondary-container secondary-' + d.name;
        })
        .key(function(d) {
            // Issue with elements being regenerated due to data being overwritten. See:
            // https://github.com/ScottLogic/d3fc/blob/0327890d48c9de73a41d901df02bac88dc83e398/src/series/multi.js#L26-L36
            return key(this.__secondaryChart__ || d);
        });

    function multiChart(selection) {
        selection.each(function(model) {
            var secondaries = secDataJoin(this, charts);

            secondaries.each(function(option) {
                this.__secondaryChart__ = option;

                option.on(event.viewChange, dispatch[event.viewChange])
                    .on(event.crosshairChange, dispatch[event.crosshairChange]);

                d3.select(this)
                    .datum(model)
                    .call(option);
            });
        });
    }

    multiChart.charts = function(x) {
        if (!arguments.length) {
            return charts;
        }
        charts = x;
        return multiChart;
    };

    d3.rebind(multiChart, dispatch, 'on');

    return multiChart;
}
