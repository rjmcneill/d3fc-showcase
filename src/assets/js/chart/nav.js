import d3 from 'd3';
import fc from 'd3fc';
import util from '../util/util';
import event from '../event';
import zoomBehavior from '../behavior/zoom';

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

    var minimumPeriods = 5;
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

    function checkMinPeriods() {
        var selectedPeriod = d3.select('.head-menu').datum().selectedPeriod.seconds * 1000;
        return ((brush.extent()[1][0].getTime() - brush.extent()[0][0].getTime() >= (selectedPeriod * minimumPeriods)));
    }

    function setMinPeriods() {
        var selectedPeriod = d3.select('.head-menu').datum().selectedPeriod.seconds * 1000;
        var newBrush = [];
        var overShoot = 0;

        // If they have just moved the left handle
        if (brush.extent()[0][0].getTime() > originalExtent[0][0].getTime() && brush.extent()[1][0].getTime() === originalExtent[1][0].getTime()) {
            newBrush[0] = new Date(brush.extent()[1][0].getTime() - selectedPeriod * minimumPeriods);
            newBrush[1] = brush.extent()[1][0];
        // If they have just moved the right handle
        } else if (brush.extent()[1][0].getTime() < originalExtent[1][0].getTime() && brush.extent()[0][0].getTime() === originalExtent[0][0].getTime()) {
            newBrush[0] = brush.extent()[0][0];
            newBrush[1] = new Date(brush.extent()[0][0].getTime() + selectedPeriod * minimumPeriods);
        // If they have moved both handles
        } else {
            var centrePoint = (((brush.extent()[1][0].getTime() - brush.extent()[0][0].getTime()) / 2) + brush.extent()[0][0].getTime());

            // If setting to the minimum periods would cause the lower handle to be before the first data point
            if ((centrePoint - (selectedPeriod * minimumPeriods / 2)) < navChart.xDomain()[0].getTime()) {
                overShoot = (centrePoint - (selectedPeriod * minimumPeriods / 2)) - navChart.xDomain()[0].getTime();
                newBrush[0] = navChart.xDomain()[0];
                newBrush[1] = new Date(centrePoint + (selectedPeriod * minimumPeriods / 2) - overShoot);
            // If setting to the minimum periods would cause the upper handle to be after the last data point
            } else if ((centrePoint + (selectedPeriod * minimumPeriods / 2)) > navChart.xDomain()[1]) {
                overShoot = (centrePoint + (selectedPeriod * minimumPeriods / 2)) - navChart.xDomain()[1].getTime();
                newBrush[0] = new Date(centrePoint - (selectedPeriod * minimumPeriods / 2) - overShoot);
                newBrush[1] = navChart.xDomain()[1];
            } else {
                newBrush[0] = new Date(centrePoint - (selectedPeriod * minimumPeriods / 2));
                newBrush[1] = new Date(centrePoint + (selectedPeriod * minimumPeriods / 2));
            }
        }

        dispatch[event.viewChange]([newBrush[0], newBrush[1]]);
    }

    function nav(selection) {
        var model = selection.datum();

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
                dispatch[event.viewChange]([brush.extent()[0][0], brush.extent()[1][0]]);
            }
        }).on('brushend', function() {
            d3.event.sourceEvent.stopPropagation();
            var brushExtentIsEmpty = xEmpty(brush);
            setHide(selection, false);

            if (brushExtentIsEmpty) {
                var previousWidth = originalExtent[1][0].getTime() - originalExtent[0][0].getTime();
                var newBrush = [new Date(brush.extent()[0][0].getTime() - previousWidth / 2),
                    new Date(brush.extent()[1][0].getTime() + previousWidth / 2)];

                dispatch[event.viewChange]([newBrush[0], newBrush[1]]);
            } else if (!checkMinPeriods()) {
                setMinPeriods();
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
