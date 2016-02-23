import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';

export default function() {
    var xScale = fc.scale.dateTime();
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom');

    var containerWidth;
    var containerWidthChanged;
    var originalDomain;
    var tickPixelSpacing = 150;

    function calculateNumberOfTicks() {
        return Math.max(Math.ceil(containerWidth / tickPixelSpacing), 2);
    }

    function removeTickValuesOutsideDomain(viewDomain, tickValues) {
        // Remove ticks lower than low view domain
        tickValues.forEach(function(tick) {
            if (tick < viewDomain[0]) {
                tickValues.splice(0, 1);
            }
        });

        // Remove ticks higher than high view domain
        for (var j = 0; j < tickValues.length; j++) {
            if (tickValues[j] > viewDomain[1]) {
                tickValues.splice(j, tickValues.length - j);
            }
        }
        return tickValues;
    }

    function calculateTickValues(model, numberOfTicks) {
        var lowerRoundedViewDomain = model.period.d3TimeInterval.unit.ceil(model.viewDomain[0]).getTime();
        var upperRoundedViewDomain = model.period.d3TimeInterval.unit.floor(model.viewDomain[1]).getTime();
        var viewDomainDifference = (upperRoundedViewDomain - lowerRoundedViewDomain);
        var zoomLevelChanged;
        var viewDomainChanged = false;
        var tickValues = [];
        var tickSpacing;

        if (originalDomain) {
            zoomLevelChanged = (originalDomain[1].getTime() - originalDomain[0].getTime() !==
                model.viewDomain[1].getTime() - model.viewDomain[0].getTime());

            viewDomainChanged = (originalDomain[0].getTime() !== model.viewDomain[0].getTime()) ||
            (originalDomain[1].getTime() !== model.viewDomain[1].getTime());
        }

        if (!tickValues.length || zoomLevelChanged || containerWidthChanged) {
            tickSpacing = util.domain.roundTimestampUp((viewDomainDifference / numberOfTicks), model.period.seconds * 1000);
            containerWidthChanged = false;
        }

        var lowerRounded = util.domain.roundTimestampDown(lowerRoundedViewDomain, tickSpacing);

        if (tickValues.length !== numberOfTicks || viewDomainChanged || zoomLevelChanged) {
            tickValues = [];
            for (var i = 0; i <= numberOfTicks; i++) {
                var tickDate = (model.period.d3TimeInterval.unit.ceil(lowerRounded + (tickSpacing * i)));
                tickValues.push(tickDate);
            }
        }

        tickValues = removeTickValuesOutsideDomain(model.viewDomain, tickValues);

        if (viewDomainChanged || !originalDomain) {
            originalDomain = model.viewDomain;
        }

        return tickValues;
    }

    function adaptAxisFormat(model, numberOfTicks) {
        var lowerRoundedViewDomain = model.period.d3TimeInterval.unit.ceil(model.viewDomain[0]).getTime();
        var upperRoundedViewDomain = model.period.d3TimeInterval.unit.floor(model.viewDomain[1]).getTime();
        var viewDomainDifference = (upperRoundedViewDomain - lowerRoundedViewDomain) / 1000;

        var minimumPeriod = model.period.seconds;
        var timePeriods = [3600, 86400, 2592000];
        var tickFormats = [d3.time.format('%_I:%M %p'), d3.time.format('%a %_I %p'), d3.time.format('%b %e'), d3.time.format('%B %Y')];

        for (var i = 0; i < timePeriods.length; i++) {
            if (viewDomainDifference < timePeriods[i] ||
                ((i === timePeriods.length - 1 || minimumPeriod < timePeriods[i]) && Math.floor(viewDomainDifference / timePeriods[i]) < numberOfTicks)) {
                return tickFormats[i];
            }
        }
        return tickFormats[tickFormats.length - 1];
    }

    function xAxisChart(selection) {
        var model = selection.datum();
        var numberOfTicks = calculateNumberOfTicks();
        xScale.domain(model.viewDomain);
        xAxis.tickValues(calculateTickValues(model, numberOfTicks));
        xAxis.tickFormat(adaptAxisFormat(model, numberOfTicks));
        selection.call(xAxis);
    }

    xAxisChart.dimensionChanged = function(container) {
        containerWidth = util.width(container.node());
        xScale.range([0, containerWidth]);
        containerWidthChanged = true;
    };

    return xAxisChart;
}
