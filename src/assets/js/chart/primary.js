import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';
import event from '../event';
import zoomBehavior from '../behavior/zoom';
import yAxisChart from './yAxis';

function getExtentAccessors(multiSeries) {
    return multiSeries.reduce(function(extentAccessors, series) {
        if (series.extentAccessor) {
            return extentAccessors.concat(series.extentAccessor);
        } else {
            return extentAccessors;
        }
    }, []);
}

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

export default function() {
    var dispatch = d3.dispatch(event.viewChange, event.crosshairChange);

    var currentSeries;
    var currentYValueAccessor = function(d) { return d.close; };
    var currentIndicators = [];
    var zoomWidth;

    var crosshairData = [];
    var crosshair = fc.tool.crosshair()
        .xLabel('')
        .yLabel('')
        .on('trackingmove', function(updatedCrosshairData) {
            if (updatedCrosshairData.length > 0) {
                dispatch.crosshairChange(updatedCrosshairData[0].datum);
            } else {
                dispatch.crosshairChange(undefined);
            }
        })
        .on('trackingend', function() {
            dispatch.crosshairChange(undefined);
        });
    crosshair.id = util.uid();

    var gridlines = fc.annotation.gridline()
      .xTicks(0);
    var closeLine = fc.annotation.line()
      .orient('horizontal')
      .value(currentYValueAccessor)
      .label('')
      .decorate(function(g) {
          g.classed('close-line', true);
      });
    closeLine.id = util.uid();

    var multi = fc.series.multi()
        .key(function(series) { return series.id; })
        .mapping(function(series) {
            switch (series) {
            case closeLine:
                return [this.data[this.data.length - 1]];
            case crosshair:
                return crosshairData;
            default:
                return this.data;
            }
        });

    var xScale = fc.scale.dateTime();
    var yScale = d3.scale.linear();

    var primaryChart = fc.chart.cartesian(xScale, yScale)
        .xTicks(0)
        .yTicks(0)
        .margin({
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        });

    var yAxis = yAxisChart(yScale);

    // Create and apply the Moving Average
    var movingAverage = fc.indicator.algorithm.movingAverage();
    var bollingerAlgorithm = fc.indicator.algorithm.bollingerBands();

    function updateMultiSeries() {
        var baseChart = [gridlines, currentSeries.option, closeLine];
        var indicators = currentIndicators.map(function(indicator) { return indicator.option; });
        return baseChart.concat(indicators, crosshair);
    }

    function updateYValueAccessorUsed() {
        movingAverage.value(currentYValueAccessor);
        bollingerAlgorithm.value(currentYValueAccessor);
        closeLine.value(currentYValueAccessor);
        switch (currentSeries.valueString) {
        case 'line':
        case 'point':
        case 'area':
            currentSeries.option.yValue(currentYValueAccessor);
            break;
        default:
            break;
        }
    }

    // Call when what to display on the chart is modified (ie series, options)
    function selectorsChanged(model) {
        currentSeries = model.series;
        currentYValueAccessor = model.yValueAccessor.option;
        currentIndicators = model.indicators;
        updateYValueAccessorUsed();
        multi.series(updateMultiSeries());
        model.selectorsChanged = false;
    }

    function bandCrosshair(data) {
        var width = currentSeries.option.width(data);

        crosshair.decorate(function(selection) {
            selection.classed('band', true);

            selection.selectAll('.vertical > line')
              .style('stroke-width', width);
        });
    }

    function lineCrosshair(selection) {
        selection.classed('band', false)
            .selectAll('line')
            .style('stroke-width', null);
    }

    function updateCrosshairDecorate(data) {
        if (currentSeries.valueString === 'candlestick' || currentSeries.valueString === 'ohlc') {
            bandCrosshair(data);
        } else {
            crosshair.decorate(lineCrosshair);
        }
    }

    function primary(selection) {
        var chartSelection = selection.select('#primary-container');
        var yAxisSelection = selection.select('#y-axis-container');
        var model = chartSelection.datum();

        if (model.selectorsChanged) {
            selectorsChanged(model);
        }

        primaryChart.xDomain(model.viewDomain);

        xScale.discontinuityProvider(model.discontinuityProvider);

        crosshair.snap(fc.util.seriesPointSnapXOnly(currentSeries.option, model.data));
        updateCrosshairDecorate(model.data);

        movingAverage(model.data);
        bollingerAlgorithm(model.data);

        // Scale y axis
        var visibleData = util.domain.filterDataInDateRange(primaryChart.xDomain(), model.data);

        // Add percentage padding either side of extreme high/lows
        var extentAccessors = getExtentAccessors(multi.series());
        var paddedYExtent = fc.util.extent()
            .fields(extentAccessors)
            .pad(0.08)(visibleData);

        yScale.domain(paddedYExtent);
        primaryChart.yDomain(paddedYExtent);

        // Find current tick values and add close price to this list, then set it explicitly below
        var latestPrice = currentYValueAccessor(model.data[model.data.length - 1]);
        var tickValues = produceAnnotatedTickValues(yScale, [latestPrice]);

        yAxis.yTickValues(tickValues)
            .yTickFormat(model.product.priceFormat)
            .closePrice(latestPrice)
            .yDomain(paddedYExtent);

        gridlines.yTicks(tickValues.length - 1);

        // Redraw
        primaryChart.plotArea(multi);
        chartSelection.call(primaryChart);
        yAxisSelection.call(yAxis);

        var zoom = zoomBehavior(zoomWidth)
            .scale(xScale)
            .trackingLatest(model.trackingLatest)
            .on('zoom', function(domain) {
                dispatch[event.viewChange](domain);
            });

        chartSelection.select('.plot-area')
          .call(zoom);

    }

    d3.rebind(primary, dispatch, 'on');

    // Call when the main layout is modified
    primary.dimensionChanged = function(container) {
        zoomWidth = util.width(container.select('#primary-container').node());
        yAxis.dimensionChanged(container.select('.y-axis-row'));
    };

    return primary;
}
