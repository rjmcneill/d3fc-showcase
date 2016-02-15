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
            tickSpacing = domain.roundTimestampUp((viewDomainDifference / numberOfTicks), model.period.seconds * 1000);
            containerWidthChanged = false;
        }

        var lowerRounded = domain.roundTimestampDown(lowerRoundedViewDomain, tickSpacing);

        if (tickValues.length !== numberOfTicks || viewDomainChanged || zoomLevelChanged) {
            tickValues = [];
            for (var i = 0; i <= numberOfTicks; i++) {
                var tickDate = (model.period.d3TimeInterval.unit.ceil(lowerRounded + (tickSpacing * i)));
                tickValues.push(tickDate);
            }
        }

        tickValues = removeTickValuesOutsideDomain(model.viewDomain, tickValues);
        xAxis.tickValues(tickValues);

        if (viewDomainChanged || !originalDomain) {
            originalDomain = model.viewDomain;
        }
    }

    function adaptAxisFormat(model, numberOfTicks) {
        var lowerRoundedViewDomain = model.period.d3TimeInterval.unit.ceil(model.viewDomain[0]).getTime();
        var upperRoundedViewDomain = model.period.d3TimeInterval.unit.floor(model.viewDomain[1]).getTime();
        var viewDomainDifference = (upperRoundedViewDomain - lowerRoundedViewDomain) / 1000;

        var minimumPeriod = model.period.seconds;
        var tickFormat;

        var yearInSeconds = 31557600;
        var monthInSeconds = 2592000;
        var dayInSeconds = 86400;
        var hourInSeconds = 3600;

        // var monthsDifference = Math.floor(viewDomainDifference / monthInSeconds);
        // var daysDifference = Math.floor(viewDomainDifference / dayInSeconds);
        // var hoursDifference = Math.floor(viewDomainDifference / hourInSeconds);

        if (viewDomainDifference < hourInSeconds) {
            tickFormat = d3.time.format('%_I:%M %p');
        } else if (viewDomainDifference < dayInSeconds) {
            if (minimumPeriod < hourInSeconds && (Math.floor(viewDomainDifference / hourInSeconds) < numberOfTicks)) {
                tickFormat = d3.time.format('%_I:%M %p');
            } else {
                tickFormat = d3.time.format('%a %_I %p');
            }
        } else if (viewDomainDifference < monthInSeconds) {
            if (minimumPeriod < dayInSeconds && (Math.floor(viewDomainDifference / dayInSeconds) < numberOfTicks)) {
                tickFormat = d3.time.format('%a %_I %p');
            } else {
                tickFormat = d3.time.format('%b %e');
            }
        } else if (viewDomainDifference < yearInSeconds) {
            if (Math.floor(viewDomainDifference / monthInSeconds) >= numberOfTicks) {
                tickFormat = d3.time.format('%B');
            } else {
                tickFormat = d3.time.format('%b %e');
            }
        } else {
            tickFormat = d3.time.format('%B');
        }

        xAxis.tickFormat(tickFormat);
    }

    function xAxisChart(selection) {
        var model = selection.datum();
        var numberOfTicks = calculateNumberOfTicks();
        xScale.domain(model.viewDomain);
        calculateTickValues(model, numberOfTicks);
        adaptAxisFormat(model, numberOfTicks);
        selection.call(xAxis);
    }

    xAxisChart.dimensionChanged = function(container) {
        containerWidth = util.width(container.node());
        xScale.range([0, containerWidth]);
        containerWidthChanged = true;
    };

    return xAxisChart;
}
