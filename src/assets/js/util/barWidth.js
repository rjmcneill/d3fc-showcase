import d3 from 'd3';
import fc from 'd3fc';

export default function(series, data, yValue) {
    var mapFunction = function(d, i) { return xScale(xValue(d, i)); };
    var barWidth = series.barWidth();
    var xValue = series.xValue();
    var y0Value = d3.functor(0);
    var x0Value = d3.functor(0);
    var xScale = series.xScale();
    var filteredData = data.filter(fc.util.fn.defined(x0Value, y0Value, xValue, yValue));

    return barWidth(filteredData.map(mapFunction));
}
