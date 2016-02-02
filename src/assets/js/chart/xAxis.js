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
    var tickValues = [];
    var originalDomain;
    var tickSpacing;

    function calculateNumberOfTicks() {
        return Math.max(Math.ceil(containerWidth / 150), 2);
    }

    function calculateTickValues(model, numberOfTicks) {
        var lowerRoundedViewDomain = model.period.d3TimeInterval.unit.ceil(model.viewDomain[0]).getTime();
        var upperRoundedViewDomain = model.period.d3TimeInterval.unit.floor(model.viewDomain[1]).getTime();
        var viewDomainDifference = (upperRoundedViewDomain - lowerRoundedViewDomain);
        var zoomLevelChanged;

        if (originalDomain) {
            zoomLevelChanged = (originalDomain[1].getTime() - originalDomain[0].getTime() !== model.viewDomain[1].getTime() - model.viewDomain[0].getTime());
            if (zoomLevelChanged || containerWidthChanged) {
                // If they have zoomed, recalculate the tick spacing
                tickSpacing = util.domain.roundTimestampUp((viewDomainDifference / numberOfTicks), model.period.seconds * 1000);
                containerWidthChanged = false;
            }
        }

        if (!tickValues.length) {
            tickSpacing = util.domain.roundTimestampUp((viewDomainDifference / numberOfTicks), model.period.seconds * 1000);
        }

        var lowerRounded = util.domain.roundTimestampDown(lowerRoundedViewDomain, tickSpacing);
        var viewDomainChanged = false;

        if (originalDomain) {
            viewDomainChanged = (originalDomain[0].getTime() !== model.viewDomain[0].getTime()) ||
            (originalDomain[1].getTime() !== model.viewDomain[1].getTime());
        }

        if (tickValues.length !== numberOfTicks || viewDomainChanged || zoomLevelChanged) {
            tickValues = [];
            for (var i = 0; i <= numberOfTicks; i++) {
                var tickDate = (model.period.d3TimeInterval.unit.ceil(lowerRounded + (tickSpacing * i)));
                tickValues.push(tickDate);
            }
        }

        // Remove ticks lower than low view domain
        tickValues.forEach(function(tick) {
            if (tick < model.viewDomain[0]) {
                tickValues.splice(0, 1);
            }
        });

        // Remove ticks higher than high view domain
        for (var j = 0; j < tickValues.length; j++) {
            if (tickValues[j] > model.viewDomain[1]) {
                tickValues.splice(j, tickValues.length - j);
            }
        }

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
        var formatting;

        var yearInSeconds = 31557600;
        var monthInSeconds = 2592000;
        var dayInSeconds = 86400;
        var hourInSeconds = 3600;

        var withinYear = viewDomainDifference < yearInSeconds;
        var withinMonth = viewDomainDifference < monthInSeconds;
        var withinDay = viewDomainDifference < dayInSeconds;
        var withinHour = viewDomainDifference < hourInSeconds;

        var monthsDifference = Math.floor(viewDomainDifference / monthInSeconds);
        var daysDifference = Math.floor(viewDomainDifference / dayInSeconds);
        var hoursDifference = Math.floor(viewDomainDifference / hourInSeconds);

        if (withinHour) {
            formatting = 'minutes';
        } else if (withinDay) {
            if (minimumPeriod < hourInSeconds && hoursDifference < numberOfTicks) {
                formatting = 'minutes';
            } else {
                formatting = 'hours';
            }
        } else if (withinMonth) {
            if (minimumPeriod < dayInSeconds && daysDifference < numberOfTicks) {
                formatting = 'hours';
            } else {
                formatting = 'days';
            }
        } else if (withinYear) {
            if (monthsDifference >= numberOfTicks) {
                formatting = 'months';
            } else {
                formatting = 'days';
            }
        } else {
            xAxis.tickFormat(d3.time.format('%b %Y'));
        }

        switch (formatting) {
        case 'minutes':
            xAxis.tickFormat(d3.time.format('%_I:%M %p'));
            break;
        case 'hours':
            xAxis.tickFormat(d3.time.format('%a %_I %p'));
            break;
        case 'days':
            xAxis.tickFormat(d3.time.format('%b %e'));
            break;
        case 'months':
            xAxis.tickFormat(d3.time.format('%B'));
            break;
        }
    }

    function xAxisChart(selection) {
        var model = selection.datum();
        var numberOfTicks = calculateNumberOfTicks(model);
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
