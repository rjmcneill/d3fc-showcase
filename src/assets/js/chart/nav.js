import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';
import event from '../event';
import zoomBehavior from '../behavior/zoom';
import centerOnDate from '../util/domain/centerOnDate';

export default function() {
    var navHeight = 100; // Also maintain in variables.less
    var bottomMargin = 40; // Also maintain in variables.less
    var navChartHeight = navHeight - bottomMargin;
    var backgroundStrokeWidth = 2; // Also maintain in variables.less
    // Stroke is half inside half outside, so stroke/2 per border
    var borderWidth = backgroundStrokeWidth / 2;
    // should have been 2 * borderWidth, but for unknown reason it is incorrect in practice.
    var extentHeight = navChartHeight - borderWidth;
    var barHeight = extentHeight;
    var handleCircleCenter = borderWidth + barHeight / 2;
    var handleBarWidth = 2;
    var yExtentPadding = [0, 0.04];

    var originalExtent;

    var dispatch = d3.dispatch(event.viewChange);

    var navChart = fc.chart.cartesian(fc.scale.dateTime(), d3.scale.linear())
      .yTicks(0)
      .margin({
          bottom: bottomMargin      // Variable also in navigator.less - should be used once ported to flex
      });

    var viewScale = fc.scale.dateTime();

    var area = fc.series.area()
      .xValue(function(d) { return d.date; })
      .yValue(function(d) { return d.close; });
    var line = fc.series.line()
      .xValue(function(d) { return d.date; })
      .yValue(function(d) { return d.close; });
    var brush = d3.svg.brush();
    var navMulti = fc.series.multi()
      .series([area, line, brush])
      .decorate(function(selection) {
          var enter = selection.enter();

          selection.select('.extent')
            .attr('height', extentHeight)
            .attr('y', backgroundStrokeWidth / 2);

          // overload d3 styling for the brush handles
          // as Firefox does not react properly to setting these through less file.
          enter.selectAll('.resize.w>rect, .resize.e>rect')
            .attr('width', handleBarWidth)
            .attr('x', -handleBarWidth / 2);
          selection.selectAll('.resize.w>rect, .resize.e>rect')
            .attr('height', barHeight)
            .attr('y', borderWidth);
          enter.select('.extent')
            .attr('mask', 'url("#brush-mask")')
            .attr('fill', 'url("#brush-gradient")');

          // Adds the handles to the brush sides
          var handles = enter.selectAll('.e, .w');
          handles.append('circle')
            .attr('cy', handleCircleCenter)
            .attr('r', 7)
            .attr('class', 'outer-handle');
          handles.append('circle')
            .attr('cy', handleCircleCenter)
            .attr('r', 4)
            .attr('class', 'inner-handle');
      })
      .mapping(function(series) {
          if (series === brush) {
              brush.extent([
                  [viewScale.domain()[0], navChart.yDomain()[0]],
                  [viewScale.domain()[1], navChart.yDomain()[1]]
              ]);
          } else {
              // This stops the brush data being overwritten by the point data
              return this.data;
          }
      });

    var maskXScale = fc.scale.dateTime();
    var maskYScale = d3.scale.linear();

    var brushMask = fc.series.area()
      .xValue(function(d) { return d.date; })
      .yValue(function(d) { return d.close; })
      .xScale(maskXScale)
      .yScale(maskYScale);

    var layoutWidth;

    function setHide(selection, brushHide) {
        selection.select('.plot-area')
          .selectAll('.e, .w')
          .classed('hidden', brushHide);
    }

    function xEmpty(navBrush) {
        return ((navBrush.extent()[0][0] - navBrush.extent()[1][0]) === 0);
    }

    function createDefs(selection, data) {
        var defsEnter = selection.selectAll('defs')
          .data([0])
          .enter()
          .append('defs');

        defsEnter.html('<linearGradient id="brush-gradient" x1="0" x2="0" y1="0" y2="1"> \
              <stop offset="0%" class="brush-gradient-top" /> \
              <stop offset="100%" class="brush-gradient-bottom" /> \
          </linearGradient> \
          <mask id="brush-mask"> \
              <rect class="mask-background"></rect> \
          </mask>');

        selection.select('.mask-background').attr({
            width: layoutWidth,
            height: navChartHeight
        });

        maskXScale.domain(fc.util.extent().fields('date')(data));
        maskYScale.domain(fc.util.extent().fields(['low', 'high']).pad(yExtentPadding)(data));

        selection.select('mask')
            .datum(data)
            .call(brushMask);
    }

    function extentLessThanMinimumPeriods(minimumPeriodMilliSeconds) {
        return (brush.extent()[1][0].getTime() - brush.extent()[0][0].getTime() >=
            minimumPeriodMilliSeconds);
    }

    function setToMinPeriods(minimumPeriodMilliSeconds) {
        var newBrush = [];
        var overShoot = 0;

        var leftHandleMoved =
            brush.extent()[0][0].getTime() > originalExtent[0][0].getTime() &&
            brush.extent()[1][0].getTime() === originalExtent[1][0].getTime();

        var rightHandleMoved =
            brush.extent()[1][0].getTime() < originalExtent[1][0].getTime() &&
            brush.extent()[0][0].getTime() === originalExtent[0][0].getTime();

        if (leftHandleMoved) {
            newBrush[0] = new Date(brush.extent()[1][0].getTime() - minimumPeriodMilliSeconds);
            newBrush[1] = brush.extent()[1][0];
        } else if (rightHandleMoved) {
            newBrush[0] = brush.extent()[0][0];
            newBrush[1] = new Date(brush.extent()[0][0].getTime() + minimumPeriodMilliSeconds);
        } else {
            var centrePoint = (brush.extent()[0][0].getTime() +
                brush.extent()[1][0].getTime()) / 2;
            var minPeriodDistance = minimumPeriodMilliSeconds / 2;

            newBrush[0] = new Date(centrePoint - minPeriodDistance);
            newBrush[1] = new Date(centrePoint + minPeriodDistance);
        }

        return newBrush;
    }

    function nav(selection, period) {
        var model = selection.datum();

        var minimumPeriodMilliSeconds = model.period.seconds *
                    selection.datum().minimumPeriods * 1000;

        createDefs(selection, model.data);

        viewScale.domain(model.viewDomain);

        var filteredData = util.domain.filterDataInDateRange(
          fc.util.extent().fields('date')(model.data),
          model.data);
        var yExtent = fc.util.extent()
          .fields(['low', 'high']).pad(yExtentPadding)(filteredData);

        var brushHide = false;

        navChart.xDomain(fc.util.extent().fields('date')(model.data))
          .yDomain(yExtent);

        brush.on('brushstart', function() {
            d3.event.sourceEvent.stopPropagation();
            originalExtent = brush.extent();
        })
        .on('brush', function() {
            d3.event.sourceEvent.stopPropagation();
            var brushExtentIsEmpty = xEmpty(brush);

            // Hide the bar if the extent is empty
            setHide(selection, brushExtentIsEmpty);
            if (!brushExtentIsEmpty) {
                dispatch[event.viewChange]([brush.extent()[0][0],
                    brush.extent()[1][0]]);
            }
        }).on('brushend', function() {
            d3.event.sourceEvent.stopPropagation();
            var brushExtentIsEmpty = xEmpty(brush);
            var minimumBrush;
            setHide(selection, false);

            if (brushExtentIsEmpty) {
                dispatch[event.viewChange](centerOnDate([originalExtent[0][0],
                    originalExtent[1][0]], model.data, brush.extent()[0][0]));
            } else if (!extentLessThanMinimumPeriods(minimumPeriodMilliSeconds)) {
                minimumBrush = setToMinPeriods(minimumPeriodMilliSeconds);
                var centreDate = new Date((minimumBrush[1].getTime() + minimumBrush[0].getTime()) / 2);

                dispatch[event.viewChange](centerOnDate(minimumBrush,
                    model.data, centreDate));
            }
        });

        navChart.plotArea(navMulti);
        selection.call(navChart);

        // Allow to zoom using mouse, but disable panning
        var zoom = zoomBehavior(layoutWidth)
          .scale(viewScale)
          .trackingLatest(model.trackingLatest)
          .allowPan(false)
          .on('zoom', function(domain) {
              dispatch[event.viewChange](domain);
          });

        selection.select('.plot-area')
          .call(zoom);
    }

    d3.rebind(nav, dispatch, 'on');

    nav.dimensionChanged = function(container) {
        layoutWidth = util.width(container.node());
        viewScale.range([0, layoutWidth]);
        maskXScale.range([0, layoutWidth]);
        maskYScale.range([navChartHeight, 0]);
    };

    return nav;
}
