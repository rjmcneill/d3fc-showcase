(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('d3')) :
	typeof define === 'function' && define.amd ? define(['d3'], factory) :
	factory(global.d3);
}(this, function (d3) { 'use strict';

	d3 = 'default' in d3 ? d3['default'] : d3;

	function __commonjs(fn, module) { return module = { exports: {} }, fn(module, module.exports), module.exports; }

	/**
	 * An overload of the d3.rebind method which allows the source methods
	 * to be rebound to the target with a different name. In the mappings object
	 * keys represent the target method names and values represent the source
	 * object names.
	 */
	function rebind(target, source, mappings) {
	    if (typeof(mappings) !== 'object') {
	        return d3.rebind.apply(d3, arguments);
	    }
	    Object.keys(mappings)
	        .forEach(function(targetName) {
	            var method = source[mappings[targetName]];
	            if (typeof method !== 'function') {
	                throw new Error('The method ' + mappings[targetName] + ' does not exist on the source object');
	            }
	            target[targetName] = function() {
	                var value = method.apply(source, arguments);
	                return value === source ? target : value;
	            };
	        });
	    return target;
	}

	function capitalizeFirstLetter(str) {
	    return str[0].toUpperCase() + str.slice(1);
	}

	/**
	 * Rebinds all the methods from the source component, adding the given prefix. An
	 * optional exclusions parameter can be used to specify methods which should not
	 * be rebound.
	 */
	function rebindAll(target, source, prefix, exclusions) {
	    prefix = typeof prefix !== 'undefined' ? prefix : '';

	    // if exclusions isn't an array, construct it
	    if (!(arguments.length === 4 && Array.isArray(exclusions))) {
	        exclusions = Array.prototype.slice.call(arguments, 3);
	    }

	    exclusions = exclusions.map(function(exclusion) {
	        if (typeof(exclusion) === 'string') {
	            if (!source.hasOwnProperty(exclusion)) {
	                throw new Error('The method ' + exclusion + ' does not exist on the source object');
	            }
	            exclusion = new RegExp('^' + exclusion + '$');
	        }
	        return exclusion;
	    });

	    function exclude(testedProperty) {
	        return exclusions.some(function(exclusion) {
	            return testedProperty.match(exclusion);
	        });
	    }

	    function reboundPropertyName(inputProperty) {
	        return prefix !== '' ? prefix + capitalizeFirstLetter(inputProperty) : inputProperty;
	    }

	    var bindings = {};
	    for (var property in source) {
	        if (source.hasOwnProperty(property) && !exclude(property)) {
	            bindings[reboundPropertyName(property)] = property;
	        }
	    }

	    rebind(target, source, bindings);
	}

	function minimum(data, accessor) {
	    return data.map(function(dataPoint) {
	        return [accessor(dataPoint), dataPoint];
	    }).reduce(function(accumulator, dataPoint) {
	        return accumulator[0] > dataPoint[0] ? dataPoint : accumulator;
	    }, [Number.MAX_VALUE, null])[1];
	}

	function isIntersecting(a, b) {
	    return !(a.x >= (b.x + b.width) ||
	       (a.x + a.width) <= b.x ||
	       a.y >= (b.y + b.height) ||
	       (a.y + a.height) <= b.y);
	}

	function areaOfIntersection(a, b) {
	    var left = Math.max(a.x, b.x);
	    var right = Math.min(a.x + a.width, b.x + b.width);
	    var top = Math.max(a.y, b.y);
	    var bottom = Math.min(a.y + a.height, b.y + b.height);
	    return (right - left) * (bottom - top);
	}

	function collidingWith(rectangles, index) {
	    var rectangle = rectangles[index];

	    // Filter all rectangles that aren't the selected rectangle
	    // and the filter if they intersect.
	    return rectangles.filter(function(_, i) {
	        return index !== i;
	    }).filter(function(d) {
	        return isIntersecting(d, rectangle);
	    });
	}

	function collisionArea(rectangles, index) {
	    var rectangle = rectangles[index];
	    var collisions = collidingWith(rectangles, index);

	    return d3.sum(collisions.map(function(d) {
	        return areaOfIntersection(rectangle, d);
	    }));
	}

	function totalCollisionArea(rectangles) {
	    return d3.sum(rectangles.map(function(_, i) {
	        return collisionArea(rectangles, i);
	    }));
	}

	function containerUtils() {
	    var containerWidth = 0,
	        containerHeight = 0;

	    var container = function(point) {
	        return !(point.x < 0 || point.y < 0 ||
	            point.x > containerWidth || point.y > containerHeight ||
	            (point.x + point.width) > containerWidth ||
	            (point.y + point.height) > containerHeight);
	    };

	    container.containerWidth = function(value) {
	        if (!arguments.length) {
	            return containerWidth;
	        }
	        containerWidth = value;
	        return container;
	    };

	    container.containerHeight = function(value) {
	        if (!arguments.length) {
	            return containerHeight;
	        }
	        containerHeight = value;
	        return container;
	    };

	    return container;
	}

	function getAllPlacements(label) {
	    var x = label.x;
	    var y = label.y;
	    var width = label.width;
	    var height = label.height;
	    return [
	        getPlacement(x, y, width, height), // Same location
	        getPlacement(x - width, y, width, height), // Left
	        getPlacement(x - width, y - height, width, height), // Up, left
	        getPlacement(x, y - height, width, height), // Up
	        getPlacement(x, y - height / 2, width, height), // Half up
	        getPlacement(x - width / 2, y, width, height), // Half left
	        getPlacement(x - width, y - height / 2, width, height), // Full left, half up
	        getPlacement(x - width / 2, y - height, width, height) // Full up, half left
	    ];
	}

	function getPlacement(x, y, width, height) {
	    return {
	        x: x,
	        y: y,
	        width: width,
	        height: height
	    };
	}

	function randomItem(array) {
	    return array[randomIndex(array)];
	}

	function randomIndex(array) {
	    return Math.floor(Math.random() * array.length);
	}

	function cloneAndReplace(array, index, replacement) {
	    var clone = array.slice();
	    clone[index] = replacement;
	    return clone;
	}


	var array = Object.freeze({
	    randomItem: randomItem,
	    randomIndex: randomIndex,
	    cloneAndReplace: cloneAndReplace
	});

	function annealing() {

	    var container = containerUtils();
	    var temperature = 1000;
	    var cooling = 1;

	    var strategy = function(data) {

	        var originalData = data;
	        var iteratedData = data;

	        var lastScore = Infinity;
	        var currentTemperature = temperature;
	        while (currentTemperature > 0) {

	            var potentialReplacement = getPotentialState(originalData, iteratedData);

	            var potentialScore = scorer(potentialReplacement);

	            // Accept the state if it's a better state
	            // or at random based off of the difference between scores.
	            // This random % helps the algorithm break out of local minima
	            var probablityOfChoosing = Math.exp((lastScore - potentialScore) / currentTemperature);
	            if (potentialScore < lastScore || probablityOfChoosing > Math.random()) {
	                iteratedData = potentialReplacement;
	                lastScore = potentialScore;
	            }

	            currentTemperature -= cooling;
	        }
	        return iteratedData;
	    };

	    strategy.temperature = function(i) {
	        if (!arguments.length) {
	            return temperature;
	        }

	        temperature = i;
	        return strategy;
	    };

	    strategy.cooling = function(i) {
	        if (!arguments.length) {
	            return cooling;
	        }

	        cooling = i;
	        return strategy;
	    };

	    function getPotentialState(originalData, iteratedData) {
	        // For one point choose a random other placement.

	        var victimLabelIndex = randomIndex(originalData);
	        var label = originalData[victimLabelIndex];

	        var replacements = getAllPlacements(label);
	        var replacement = randomItem(replacements);

	        return cloneAndReplace(iteratedData, victimLabelIndex, replacement);
	    }

	    d3.rebind(strategy, container, 'containerWidth');
	    d3.rebind(strategy, container, 'containerHeight');

	    function scorer(placement) {
	        var collisionArea = totalCollisionArea(placement);
	        var pointsOnScreen = 1;
	        for (var i = 0; i < placement.length; i++) {
	            var point = placement[i];
	            pointsOnScreen += container(point) ? 0 : 100;
	        }
	        return collisionArea * pointsOnScreen;
	    }

	    return strategy;
	}

	function local() {

	    var container = containerUtils();
	    var iterations = 1;

	    var strategy = function(data) {

	        var originalData = data;
	        var iteratedData = data;

	        var thisIterationScore = Number.MAX_VALUE;
	        var lastIterationScore = Infinity;
	        var iteration = 0;

	        // Keep going until there's no more iterations to do or
	        // the solution is a local minimum
	        while (iteration < iterations && thisIterationScore < lastIterationScore) {
	            lastIterationScore = thisIterationScore;

	            iteratedData = iterate(originalData, iteratedData);

	            thisIterationScore = totalCollisionArea(iteratedData);
	            iteration++;
	        }
	        return iteratedData;
	    };

	    strategy.iterations = function(i) {
	        if (!arguments.length) {
	            return iterations;
	        }

	        iterations = i;
	        return strategy;
	    };

	    function iterate(originalData, iteratedData) {

	        // Find rectangles with collisions or are outside of the bounds of the container
	        iteratedData.map(function(d, i) {
	            return [d, i];
	        }).filter(function(d, i) {
	            return collidingWith(iteratedData, d[1]).length || !container(d[0]);
	        }).forEach(function(d) {

	            // Use original data to stop wandering rectangles with each iteration
	            var placements = getAllPlacements(originalData[d[1]]);

	            // Create different states the algorithm could transition to
	            var candidateReplacements = placements.map(function(placement) {
	                return cloneAndReplace(iteratedData, d[1], placement);
	            });

	            // Choose the best state.
	            var bestPlacement = minimum(candidateReplacements, function(placement) {
	                var areaOfCollisions = collisionArea(placement, d[1]);
	                var isOnScreen = container(placement[d[1]]);
	                return areaOfCollisions + (isOnScreen ? 0 : Number.MAX_VALUE);
	            });

	            iteratedData = bestPlacement;
	        });
	        return iteratedData;
	    }

	    d3.rebind(strategy, container, 'containerWidth');
	    d3.rebind(strategy, container, 'containerHeight');

	    return strategy;
	}

	function greedy() {

	    var container = containerUtils();

	    var strategy = function(data) {
	        var builtPoints = [];

	        data.forEach(function(point) {
	            var allPointPlacements = getAllPlacements(point);
	            var candidateReplacements = allPointPlacements.map(function(placement) {
	                return getCandidateReplacement(builtPoints, placement);
	            });

	            builtPoints = minimum(candidateReplacements, scorer);
	        });

	        return builtPoints;
	    };

	    d3.rebind(strategy, container, 'containerWidth');
	    d3.rebind(strategy, container, 'containerHeight');

	    function getCandidateReplacement(allPoints, point) {
	        var allPointsCopy = allPoints.slice();
	        allPointsCopy.push(point);

	        return allPointsCopy;
	    }

	    function scorer(placement) {
	        var areaOfCollisions = totalCollisionArea(placement);
	        var isOnScreen = true;
	        for (var i = 0; i < placement.length && isOnScreen; i++) {
	            var point = placement[i];
	            isOnScreen = container(point);
	        }
	        return areaOfCollisions + (isOnScreen ? 0 : Infinity);
	    }

	    return strategy;
	}

	function boundingBox() {

	    var containerWidth = 1,
	        containerHeight = 1;

	    var strategy = function(data) {
	        return data.map(function(d, i) {

	            var tx = d.x, ty = d.y;
	            if (tx + d.width > containerWidth) {
	                tx -= d.width;
	            }

	            if (ty + d.height > containerHeight) {
	                ty -= d.height;
	            }
	            return {x: tx, y: ty};
	        });
	    };

	    strategy.containerWidth = function(value) {
	        if (!arguments.length) {
	            return containerWidth;
	        }
	        containerWidth = value;
	        return strategy;
	    };

	    strategy.containerHeight = function(value) {
	        if (!arguments.length) {
	            return containerHeight;
	        }
	        containerHeight = value;
	        return strategy;
	    };

	    return strategy;
	}

	var strategy = {
	    boundingBox: boundingBox,
	    greedy: greedy,
	    local: local,
	    annealing: annealing
	};

	function context() {
	    return this;
	}

	function identity(d) {
	    return d;
	}

	function index(d, i) {
	    return i;
	}

	function noop(d) {}


	var fn = Object.freeze({
	    context: context,
	    identity: identity,
	    index: index,
	    noop: noop
	});

	// "Caution: avoid interpolating to or from the number zero when the interpolator is used to generate
	// a string (such as with attr).
	// Very small values, when stringified, may be converted to scientific notation and
	// cause a temporarily invalid attribute or style property value.
	// For example, the number 0.0000001 is converted to the string "1e-7".
	// This is particularly noticeable when interpolating opacity values.
	// To avoid scientific notation, start or end the transition at 1e-6,
	// which is the smallest value that is not stringified in exponential notation."
	// - https://github.com/mbostock/d3/wiki/Transitions#d3_interpolateNumber
	var effectivelyZero = 1e-6;

	// Wrapper around d3's selectAll/data data-join, which allows decoration of the result.
	// This is achieved by appending the element to the enter selection before exposing it.
	// A default transition of fade in/out is also implicitly added but can be modified.

	function _dataJoin() {
	    var selector = 'g',
	        children = false,
	        element = 'g',
	        attr = {},
	        key = index;

	    var dataJoin = function(container, data) {

	        var joinedData = data || identity;

	        // Can't use instanceof d3.selection (see #458)
	        if (!(container.selectAll && container.node)) {
	            container = d3.select(container);
	        }

	        // update
	        var selection = container.selectAll(selector);
	        if (children) {
	            // in order to support nested selections, they can be filtered
	            // to only return immediate children of the container
	            selection = selection.filter(function() {
	                return this.parentNode === container.node();
	            });
	        }
	        var updateSelection = selection.data(joinedData, key);

	        // enter
	        // when container is a transition, entering elements fade in (from transparent to opaque)
	        // N.B. insert() is used to create new elements, rather than append(). insert() behaves in a special manner
	        // on enter selections - entering elements will be inserted immediately before the next following sibling
	        // in the update selection, if any.
	        // This helps order the elements in an order consistent with the data, but doesn't guarantee the ordering;
	        // if the updating elements change order then selection.order() would be required to update the order.
	        // (#528)
	        var enterSelection = updateSelection.enter()
	            .insert(element) // <<<--- this is the secret sauce of this whole file
	            .attr(attr)
	            .style('opacity', effectivelyZero);

	        // exit
	        // when container is a transition, exiting elements fade out (from opaque to transparent)
	        var exitSelection = d3.transition(updateSelection.exit())
	            .style('opacity', effectivelyZero)
	            .remove();

	        // when container is a transition, all properties of the transition (which can be interpolated)
	        // will transition
	        updateSelection = d3.transition(updateSelection)
	            .style('opacity', 1);

	        updateSelection.enter = d3.functor(enterSelection);
	        updateSelection.exit = d3.functor(exitSelection);
	        return updateSelection;
	    };

	    dataJoin.selector = function(x) {
	        if (!arguments.length) {
	            return selector;
	        }
	        selector = x;
	        return dataJoin;
	    };
	    dataJoin.children = function(x) {
	        if (!arguments.length) {
	            return children;
	        }
	        children = x;
	        return dataJoin;
	    };
	    dataJoin.element = function(x) {
	        if (!arguments.length) {
	            return element;
	        }
	        element = x;
	        return dataJoin;
	    };
	    dataJoin.attr = function(x) {
	        if (!arguments.length) {
	            return attr;
	        }

	        if (arguments.length === 1) {
	            attr = arguments[0];
	        } else if (arguments.length === 2) {
	            var dataKey = arguments[0];
	            var value = arguments[1];

	            attr[dataKey] = value;
	        }

	        return dataJoin;
	    };
	    dataJoin.key = function(x) {
	        if (!arguments.length) {
	            return key;
	        }
	        key = x;
	        return dataJoin;
	    };

	    return dataJoin;
	}

	function isOrdinal(scale) {
	    return scale.rangeExtent;
	}

	// ordinal axes have a rangeExtent function, this adds any padding that
	// was applied to the range. This functions returns the rangeExtent
	// if present, or range otherwise
	///
	// NOTE: d3 uses very similar logic here:
	// https://github.com/mbostock/d3/blob/5b981a18db32938206b3579248c47205ecc94123/src/scale/scale.js#L8
	function scaleRange(scale) {
	    // for non ordinal, simply return the range
	    if (!isOrdinal(scale)) {
	        return scale.range();
	    }

	    // For ordinal, use the rangeExtent. However, rangeExtent always provides
	    // a non inverted range (i.e. extent[0] < extent[1]) regardless of the
	    // range set on the scale. The logic below detects the inverted case.
	    //
	    // The d3 code that tackles the same issue doesn't have to deal with the inverted case.
	    var scaleRange = scale.range();
	    var extent = scale.rangeExtent();
	    if (scaleRange.length <= 1) {
	        // we cannot detect the inverted case if the range (and domain) has
	        // a single item in it.
	        return extent;
	    }

	    var inverted = scaleRange[0] > scaleRange[1];
	    return inverted ? [extent[1], extent[0]] : extent;
	}

	// Ordinal and quantitative scales have different methods for setting the range. This
	// function detects the scale type and sets the range accordingly.
	function setRange(scale, scaleRange) {
	    if (isOrdinal(scale)) {
	        scale.rangePoints(scaleRange, 1);
	    } else {
	        scale.range(scaleRange);
	    }
	}


	var scale$1 = Object.freeze({
	    isOrdinal: isOrdinal,
	    range: scaleRange,
	    setRange: setRange
	});

	// applies the d3.functor to each element of an array, allowing a mixed
	// of functions and constants, e.g.
	// [0, function(d) { return d.foo; }]
	function functoredArray(x) {
	    var functoredItems = x.map(function(item) {
	        return d3.functor(item);
	    });
	    return function(d, i) {
	        return functoredItems.map(function(j) {
	            return j(d, i);
	        });
	    };
	}

	function rectangles(layoutStrategy) {

	    var size = d3.functor([0, 0]),
	        position = function(d, i) { return [d.x, d.y]; };

	    var xScale = d3.scale.identity(),
	        yScale = d3.scale.identity(),
	        anchor = noop,
	        strategy = layoutStrategy || identity,
	        component = noop;

	    var dataJoin = _dataJoin()
	        .selector('g.rectangle')
	        .element('g')
	        .attr('class', 'rectangle');

	    var rectangles = function(selection) {

	        var xRange = scaleRange(xScale),
	            yRange = scaleRange(yScale);

	        if (strategy.containerWidth) {
	            strategy.containerWidth(Math.max(xRange[0], xRange[1]));
	        }
	        if (strategy.containerHeight) {
	            strategy.containerHeight(Math.max(yRange[0], yRange[1]));
	        }

	        selection.each(function(data, index) {
	            var g = dataJoin(this, data);

	            // obtain the rectangular bounding boxes for each child
	            var childRects = data.map(function(d, i) {
	                var childPos = position(d, i);
	                var childSize = size(d, i);
	                return {
	                    x: childPos[0],
	                    y: childPos[1],
	                    width: childSize[0],
	                    height: childSize[1]
	                };
	            });

	            // apply the strategy to derive the layout
	            var layout = strategy(childRects);

	            // offset each rectangle accordingly
	            g.attr('transform', function(d, i) {
	                var offset = layout[i];
	                return 'translate(' + offset.x + ', ' + offset.y + ')';
	            });

	            // set the anchor-point for each rectangle
	            data.forEach(function(d, i) {
	                var pos = position(d, i);
	                var relativeAnchorPosition = [pos[0] - layout[i].x, pos[1] - layout[i].y];
	                anchor(d, i, relativeAnchorPosition);
	            });

	            // set the layout width / height so that children can use SVG layout if required
	            g.attr({
	                'layout-width': function(d, i) { return childRects[i].width; },
	                'layout-height': function(d, i) { return childRects[i].height; }
	            });

	            g.call(component);
	        });
	    };

	    rebindAll(rectangles, strategy);

	    rectangles.size = function(x) {
	        if (!arguments.length) {
	            return size;
	        }
	        size = functoredArray(x);
	        return rectangles;
	    };

	    rectangles.position = function(x) {
	        if (!arguments.length) {
	            return position;
	        }
	        position = functoredArray(x);
	        return rectangles;
	    };

	    rectangles.anchor = function(x) {
	        if (!arguments.length) {
	            return anchor;
	        }
	        anchor = x;
	        return rectangles;
	    };

	    rectangles.xScale = function(value) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = value;
	        return rectangles;
	    };

	    rectangles.yScale = function(value) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = value;
	        return rectangles;
	    };

	    rectangles.component = function(value) {
	        if (!arguments.length) {
	            return component;
	        }
	        component = value;
	        return rectangles;
	    };

	    return rectangles;
	}

	var layout$2 = {
	    rectangles: rectangles,
	    strategy: strategy
	};

	/* global requestAnimationFrame:false */

	// Debounce render to only occur once per frame
	function render(renderInternal) {
	    var rafId = null;
	    return function() {
	        if (rafId == null) {
	            rafId = requestAnimationFrame(function() {
	                rafId = null;
	                renderInternal();
	            });
	        }
	    };
	}

	function noSnap(xScale, yScale) {
	    return function(xPixel, yPixel) {
	        return {
	            x: xPixel,
	            y: yPixel
	        };
	    };
	}

	function pointSnap(xScale, yScale, xValue, yValue, data, objectiveFunction) {
	    // a default function that computes the distance between two points
	    objectiveFunction = objectiveFunction || function(x, y, cx, cy) {
	        var dx = x - cx,
	            dy = y - cy;
	        return dx * dx + dy * dy;
	    };

	    return function(xPixel, yPixel) {
	        var nearest = data.map(function(d) {
	            var diff = objectiveFunction(xPixel, yPixel, xScale(xValue(d)), yScale(yValue(d)));
	            return [diff, d];
	        })
	        .reduce(function(accumulator, value) {
	            return accumulator[0] > value[0] ? value : accumulator;
	        }, [Number.MAX_VALUE, null])[1];

	        return {
	            datum: nearest,
	            x: nearest ? xScale(xValue(nearest)) : xPixel,
	            y: nearest ? yScale(yValue(nearest)) : yPixel
	        };
	    };
	}

	function seriesPointSnap(series, data, objectiveFunction) {
	    return function(xPixel, yPixel) {
	        var xScale = series.xScale(),
	            yScale = series.yScale(),
	            xValue = series.xValue(),
	            yValue = (series.yValue || series.yCloseValue).call(series);
	        return pointSnap(xScale, yScale, xValue, yValue, data, objectiveFunction)(xPixel, yPixel);
	    };
	}

	function seriesPointSnapXOnly(series, data) {
	    function objectiveFunction(x, y, cx, cy) {
	        var dx = x - cx;
	        return Math.abs(dx);
	    }
	    return seriesPointSnap(series, data, objectiveFunction);
	}

	function seriesPointSnapYOnly(series, data) {
	    function objectiveFunction(x, y, cx, cy) {
	        var dy = y - cy;
	        return Math.abs(dy);
	    }
	    return seriesPointSnap(series, data, objectiveFunction);
	}

	// returns the width and height of the given element minus the padding.
	function innerDimensions(element) {
	    var style = element.ownerDocument.defaultView.getComputedStyle(element);
	    return {
	        width: parseFloat(style.width) - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
	        height: parseFloat(style.height) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
	    };
	}

	// the barWidth property of the various series takes a function which, when given an
	// array of x values, returns a suitable width. This function creates a width which is
	// equal to the smallest distance between neighbouring datapoints multiplied
	// by the given factor
	function fractionalBarWidth(fraction) {

	    return function(pixelValues) {
	        // return some default value if there are not enough datapoints to compute the width
	        if (pixelValues.length <= 1) {
	            return 10;
	        }

	        pixelValues.sort();

	        // compute the distance between neighbouring items
	        var neighbourDistances = d3.pairs(pixelValues)
	            .map(function(tuple) {
	                return Math.abs(tuple[0] - tuple[1]);
	            });

	        var minDistance = d3.min(neighbourDistances);
	        return fraction * minDistance;
	    };
	}

	/**
	 * The extent function enhances the functionality of the equivalent D3 extent function, allowing
	 * you to pass an array of fields, or accessors, which will be used to derive the extent of the supplied array. For
	 * example, if you have an array of items with properties of 'high' and 'low', you
	 * can use <code>fc.util.extent().fields(['high', 'low'])(data)</code> to compute the extent of your data.
	 *
	 * @memberof fc.util
	 */
	function extent() {

	    var fields = [],
	        extraPoint = null,
	        padUnit = 'percent',
	        pad = 0,
	        symmetricalAbout = null;

	    /**
	    * @param {array} data an array of data points, or an array of arrays of data points
	    */
	    var extents = function(data) {

	        // we need an array of arrays if we don't have one already
	        if (!Array.isArray(data[0])) {
	            data = [data];
	        }

	        // the fields can be a mixed array of property names or accessor functions
	        fields = fields.map(function(field) {
	            if (typeof field !== 'string') {
	                return field;
	            }
	            return function(d) {
	                return d[field];
	            };
	        });

	        var dataMin = d3.min(data, function(d0) {
	            return d3.min(d0, function(d1) {
	                return d3.min(fields.map(function(f) {
	                    return f(d1);
	                }));
	            });
	        });

	        var dataMax = d3.max(data, function(d0) {
	            return d3.max(d0, function(d1) {
	                return d3.max(fields.map(function(f) {
	                    return f(d1);
	                }));
	            });
	        });

	        var dateExtent = Object.prototype.toString.call(dataMin) === '[object Date]';

	        var min = dateExtent ? dataMin.getTime() : dataMin;
	        var max = dateExtent ? dataMax.getTime() : dataMax;

	        // apply symmetry rules
	        if (symmetricalAbout != null) {
	            var symmetrical = dateExtent ? symmetricalAbout.getTime() : symmetricalAbout;
	            var distanceFromMax = Math.abs(max - symmetrical),
	                distanceFromMin = Math.abs(min - symmetrical),
	                halfRange = Math.max(distanceFromMax, distanceFromMin);

	            min = symmetrical - halfRange;
	            max = symmetrical + halfRange;
	        }

	        if (padUnit === 'domain') {
	            // pad absolutely
	            if (Array.isArray(pad)) {
	                min -= pad[0];
	                max += pad[1];
	            } else {
	                min -= pad;
	                max += pad;
	            }
	        } else if (padUnit === 'percent') {
	            // pad percentagely
	            if (Array.isArray(pad)) {
	                var deltaArray = [pad[0] * (max - min), pad[1] * (max - min)];
	                min -= deltaArray[0];
	                max += deltaArray[1];
	            } else {
	                var delta = pad * (max - min) / 2;
	                min -= delta;
	                max += delta;
	            }
	        }

	        // Include the specified point in the range
	        if (extraPoint !== null) {
	            if (extraPoint < min) {
	                min = extraPoint;
	            } else if (extraPoint > max) {
	                max = extraPoint;
	            }
	        }

	        if (dateExtent) {
	            min = new Date(min);
	            max = new Date(max);
	        }

	        // Return the smallest and largest
	        return [min, max];
	    };

	    /*
	    * @param {array} fields the names of object properties that represent field values, or accessor functions.
	    */
	    extents.fields = function(x) {
	        if (!arguments.length) {
	            return fields;
	        }

	        // the fields parameter must be an array of field names,
	        // but we can pass non-array types in
	        if (!Array.isArray(x)) {
	            x = [x];
	        }

	        fields = x;
	        return extents;
	    };

	    extents.include = function(x) {
	        if (!arguments.length) {
	            return extraPoint;
	        }
	        extraPoint = x;
	        return extents;
	    };

	    extents.padUnit = function(x) {
	        if (!arguments.length) {
	            return padUnit;
	        }
	        padUnit = x;
	        return extents;
	    };

	    extents.pad = function(x) {
	        if (!arguments.length) {
	            return pad;
	        }
	        pad = x;
	        return extents;
	    };

	    extents.symmetricalAbout = function(x) {
	        if (!arguments.length) {
	            return symmetricalAbout;
	        }
	        symmetricalAbout = x;
	        return extents;
	    };

	    return extents;
	}

	// A rectangle is an object with top, left, bottom and right properties. Component
	// margin or padding properties can accept an integer, which is converted to a rectangle where each
	// property equals the given value. Also, a margin / padding may have properties missing, in
	// which case they default to zero.
	// This function expand an integer to a rectangle and fills missing properties.
	function expandRect(margin) {
	    var expandedRect = margin;
	    if (typeof(expandedRect) === 'number') {
	        expandedRect = {
	            top: margin,
	            bottom: margin,
	            left: margin,
	            right: margin
	        };
	    }
	    ['top', 'bottom', 'left', 'right'].forEach(function(direction) {
	        if (!expandedRect[direction]) {
	            expandedRect[direction] = 0;
	        }
	    });
	    return expandedRect;
	}

	var util$1 = {
	    dataJoin: _dataJoin,
	    expandRect: expandRect,
	    extent: extent,
	    fn: fn,
	    minimum: minimum,
	    fractionalBarWidth: fractionalBarWidth,
	    innerDimensions: innerDimensions,
	    rebind: rebind,
	    rebindAll: rebindAll,
	    scale: scale$1,
	    noSnap: noSnap,
	    pointSnap: pointSnap,
	    seriesPointSnap: seriesPointSnap,
	    seriesPointSnapXOnly: seriesPointSnapXOnly,
	    seriesPointSnapYOnly: seriesPointSnapYOnly,
	    render: render,
	    arrayFunctor: functoredArray,
	    array: array
	};

	function measure() {

	    var event = d3.dispatch('measuresource', 'measuretarget', 'measureclear'),
	        xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        snap = function(_x, _y) {
	            return noSnap(xScale, yScale)(_x, _y);
	        },
	        decorate = noop,
	        xLabel = d3.functor(''),
	        yLabel = d3.functor(''),
	        padding = d3.functor(2);

	    var x = function(d) { return d.x; },
	        y = function(d) { return d.y; };

	    var dataJoin = _dataJoin()
	        .selector('g.measure')
	        .element('g')
	        .attr('class', 'measure');

	    var measure = function(selection) {

	        selection.each(function(data, index) {

	            var container = d3.select(this)
	                .style('pointer-events', 'all')
	                .on('mouseenter.measure', mouseenter);

	            var overlay = container.selectAll('rect')
	                .data([data]);

	            overlay.enter()
	                .append('rect')
	                .style('visibility', 'hidden');

	            container.select('rect')
	                .attr('x', xScale.range()[0])
	                .attr('y', yScale.range()[1])
	                .attr('width', xScale.range()[1])
	                .attr('height', yScale.range()[0]);

	            var g = dataJoin(container, data);

	            var enter = g.enter();
	            enter.append('line')
	                .attr('class', 'tangent');
	            enter.append('line')
	                .attr('class', 'horizontal');
	            enter.append('line')
	                .attr('class', 'vertical');
	            enter.append('text')
	                .attr('class', 'horizontal');
	            enter.append('text')
	                .attr('class', 'vertical');

	            g.select('line.tangent')
	                .attr('x1', function(d) { return x(d.source); })
	                .attr('y1', function(d) { return y(d.source); })
	                .attr('x2', function(d) { return x(d.target); })
	                .attr('y2', function(d) { return y(d.target); });

	            g.select('line.horizontal')
	                .attr('x1', function(d) { return x(d.source); })
	                .attr('y1', function(d) { return y(d.source); })
	                .attr('x2', function(d) { return x(d.target); })
	                .attr('y2', function(d) { return y(d.source); })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; });

	            g.select('line.vertical')
	                .attr('x1', function(d) { return x(d.target); })
	                .attr('y1', function(d) { return y(d.target); })
	                .attr('x2', function(d) { return x(d.target); })
	                .attr('y2', function(d) { return y(d.source); })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; });

	            var paddingValue = padding.apply(this, arguments);

	            g.select('text.horizontal')
	                .attr('x', function(d) { return x(d.source) + (x(d.target) - x(d.source)) / 2; })
	                .attr('y', function(d) { return y(d.source) - paddingValue; })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; })
	                .text(xLabel);

	            g.select('text.vertical')
	                .attr('x', function(d) { return x(d.target) + paddingValue; })
	                .attr('y', function(d) { return y(d.source) + (y(d.target) - y(d.source)) / 2; })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; })
	                .text(yLabel);

	            decorate(g, data, index);
	        });
	    };

	    function updatePositions() {
	        var container = d3.select(this);
	        var datum = container.datum()[0];
	        if (datum.state !== 'DONE') {
	            var mouse = d3.mouse(this);
	            var snapped = snap.apply(this, mouse);
	            if (datum.state === 'SELECT_SOURCE') {
	                datum.source = datum.target = snapped;
	            } else if (datum.state === 'SELECT_TARGET') {
	                datum.target = snapped;
	            } else {
	                throw new Error('Unknown state ' + datum.state);
	            }
	        }
	    }

	    function mouseenter() {
	        var container = d3.select(this)
	            .on('click.measure', mouseclick)
	            .on('mousemove.measure', mousemove)
	            .on('mouseleave.measure', mouseleave);
	        var data = container.datum();
	        if (data[0] == null) {
	            data.push({
	                state: 'SELECT_SOURCE'
	            });
	        }
	        updatePositions.call(this);
	        container.call(measure);
	    }

	    function mousemove() {
	        var container = d3.select(this);
	        updatePositions.call(this);
	        container.call(measure);
	    }

	    function mouseleave() {
	        var container = d3.select(this);
	        var data = container.datum();
	        if (data[0] != null && data[0].state === 'SELECT_SOURCE') {
	            data.pop();
	        }
	        container.on('click.measure', null)
	            .on('mousemove.measure', null)
	            .on('mouseleave.measure', null);
	    }

	    function mouseclick() {
	        var container = d3.select(this);
	        var datum = container.datum()[0];
	        switch (datum.state) {
	        case 'SELECT_SOURCE':
	            updatePositions.call(this);
	            event.measuresource.apply(this, arguments);
	            datum.state = 'SELECT_TARGET';
	            break;
	        case 'SELECT_TARGET':
	            updatePositions.call(this);
	            event.measuretarget.apply(this, arguments);
	            datum.state = 'DONE';
	            break;
	        case 'DONE':
	            event.measureclear.apply(this, arguments);
	            datum.state = 'SELECT_SOURCE';
	            updatePositions.call(this);
	            break;
	        default:
	            throw new Error('Unknown state ' + datum.state);
	        }
	        container.call(measure);
	    }

	    measure.xScale = function(_x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = _x;
	        return measure;
	    };
	    measure.yScale = function(_x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = _x;
	        return measure;
	    };
	    measure.snap = function(_x) {
	        if (!arguments.length) {
	            return snap;
	        }
	        snap = _x;
	        return measure;
	    };
	    measure.decorate = function(_x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = _x;
	        return measure;
	    };
	    measure.xLabel = function(_x) {
	        if (!arguments.length) {
	            return xLabel;
	        }
	        xLabel = d3.functor(_x);
	        return measure;
	    };
	    measure.yLabel = function(_x) {
	        if (!arguments.length) {
	            return yLabel;
	        }
	        yLabel = d3.functor(_x);
	        return measure;
	    };
	    measure.padding = function(_x) {
	        if (!arguments.length) {
	            return padding;
	        }
	        padding = d3.functor(_x);
	        return measure;
	    };

	    d3.rebind(measure, event, 'on');

	    return measure;
	}

	function container() {

	    var padding = 0,
	        component = noop,
	        decorate = noop;

	    var dataJoin = _dataJoin()
	        .selector('g.container')
	        .element('g')
	        .attr({
	            'class': 'container',
	            'layout-style': 'flex: 1'
	        });

	    var container = function(selection) {
	        selection.each(function(data, index) {
	            var expandedPadding = expandRect(padding);

	            var g = dataJoin(this, [data]);

	            g.enter()
	                .append('rect')
	                .layout('flex', 1);

	            g.enter()
	                .append('g')
	                .layout({
	                    position: 'absolute',
	                    top: expandedPadding.top,
	                    left: expandedPadding.left,
	                    bottom: expandedPadding.bottom,
	                    right: expandedPadding.right
	                });

	            d3.select(this).layout();

	            g.select('g').call(component);

	            decorate(g, data, index);
	        });
	    };

	    container.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return container;
	    };

	    container.padding = function(x) {
	        if (!arguments.length) {
	            return padding;
	        }
	        padding = x;
	        return container;
	    };

	    container.component = function(x) {
	        if (!arguments.length) {
	            return component;
	        }
	        component = x;
	        return container;
	    };

	    return container;
	}

	function fibonacciFan() {

	    var event = d3.dispatch('fansource', 'fantarget', 'fanclear'),
	        xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        snap = function(_x, _y) {
	            return noSnap(xScale, yScale)(_x, _y);
	        },
	        decorate = noop;

	    var x = function(d) { return d.x; },
	        y = function(d) { return d.y; };

	    var dataJoin = _dataJoin()
	        .selector('g.fan')
	        .element('g')
	        .attr('class', 'fan');

	    var fan = function(selection) {

	        selection.each(function(data, index) {

	            var container = d3.select(this)
	                .style('pointer-events', 'all')
	                .on('mouseenter.fan', mouseenter);

	            var overlay = container.selectAll('rect')
	                .data([data]);

	            overlay.enter()
	                .append('rect')
	                .style('visibility', 'hidden');

	            container.select('rect')
	                .attr('x', xScale.range()[0])
	                .attr('y', yScale.range()[1])
	                .attr('width', xScale.range()[1])
	                .attr('height', yScale.range()[0]);

	            var g = dataJoin(container, data);

	            g.each(function(d) {
	                d.x = xScale.range()[1];
	                d.ay = d.by = d.cy = y(d.target);

	                if (x(d.source) !== x(d.target)) {

	                    if (d.state === 'DONE' && x(d.source) > x(d.target)) {
	                        var temp = d.source;
	                        d.source = d.target;
	                        d.target = temp;
	                    }

	                    var gradient = (y(d.target) - y(d.source)) /
	                        (x(d.target) - x(d.source));
	                    var deltaX = d.x - x(d.source);
	                    var deltaY = gradient * deltaX;
	                    d.ay = 0.618 * deltaY + y(d.source);
	                    d.by = 0.500 * deltaY + y(d.source);
	                    d.cy = 0.382 * deltaY + y(d.source);
	                }
	            });

	            var enter = g.enter();
	            enter.append('line')
	                .attr('class', 'trend');
	            enter.append('line')
	                .attr('class', 'a');
	            enter.append('line')
	                .attr('class', 'b');
	            enter.append('line')
	                .attr('class', 'c');
	            enter.append('polygon')
	                .attr('class', 'area');

	            g.select('line.trend')
	                .attr('x1', function(d) { return x(d.source); })
	                .attr('y1', function(d) { return y(d.source); })
	                .attr('x2', function(d) { return x(d.target); })
	                .attr('y2', function(d) { return y(d.target); });

	            g.select('line.a')
	                .attr('x1', function(d) { return x(d.source); })
	                .attr('y1', function(d) { return y(d.source); })
	                .attr('x2', function(d) { return d.x; })
	                .attr('y2', function(d) { return d.ay; })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; });

	            g.select('line.b')
	                .attr('x1', function(d) { return x(d.source); })
	                .attr('y1', function(d) { return y(d.source); })
	                .attr('x2', function(d) { return d.x; })
	                .attr('y2', function(d) { return d.by; })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; });

	            g.select('line.c')
	                .attr('x1', function(d) { return x(d.source); })
	                .attr('y1', function(d) { return y(d.source); })
	                .attr('x2', function(d) { return d.x; })
	                .attr('y2', function(d) { return d.cy; })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; });

	            g.select('polygon.area')
	                .attr('points', function(d) {
	                    return x(d.source) + ',' + y(d.source) + ' ' +
	                        d.x + ',' + d.ay + ' ' +
	                        d.x + ',' + d.cy;
	                })
	                .style('visibility', function(d) { return d.state !== 'DONE' ? 'hidden' : 'visible'; });

	            decorate(g, data, index);
	        });
	    };

	    function updatePositions() {
	        var container = d3.select(this);
	        var datum = container.datum()[0];
	        if (datum.state !== 'DONE') {
	            var mouse = d3.mouse(this);
	            var snapped = snap.apply(this, mouse);
	            if (datum.state === 'SELECT_SOURCE') {
	                datum.source = datum.target = snapped;
	            } else if (datum.state === 'SELECT_TARGET') {
	                datum.target = snapped;
	            } else {
	                throw new Error('Unknown state ' + datum.state);
	            }
	        }
	    }

	    function mouseenter() {
	        var container = d3.select(this)
	            .on('click.fan', mouseclick)
	            .on('mousemove.fan', mousemove)
	            .on('mouseleave.fan', mouseleave);
	        var data = container.datum();
	        if (data[0] == null) {
	            data.push({
	                state: 'SELECT_SOURCE'
	            });
	        }
	        updatePositions.call(this);
	        container.call(fan);
	    }

	    function mousemove() {
	        var container = d3.select(this);
	        updatePositions.call(this);
	        container.call(fan);
	    }

	    function mouseleave() {
	        var container = d3.select(this);
	        var data = container.datum();
	        if (data[0] != null && data[0].state === 'SELECT_SOURCE') {
	            data.pop();
	        }
	        container.on('click.fan', null)
	            .on('mousemove.fan', null)
	            .on('mouseleave.fan', null);
	    }

	    function mouseclick() {
	        var container = d3.select(this);
	        var datum = container.datum()[0];
	        switch (datum.state) {
	        case 'SELECT_SOURCE':
	            updatePositions.call(this);
	            event.fansource.apply(this, arguments);
	            datum.state = 'SELECT_TARGET';
	            break;
	        case 'SELECT_TARGET':
	            updatePositions.call(this);
	            event.fantarget.apply(this, arguments);
	            datum.state = 'DONE';
	            break;
	        case 'DONE':
	            event.fanclear.apply(this, arguments);
	            datum.state = 'SELECT_SOURCE';
	            updatePositions.call(this);
	            break;
	        default:
	            throw new Error('Unknown state ' + datum.state);
	        }
	        container.call(fan);
	    }

	    fan.xScale = function(_x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = _x;
	        return fan;
	    };
	    fan.yScale = function(_x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = _x;
	        return fan;
	    };
	    fan.snap = function(_x) {
	        if (!arguments.length) {
	            return snap;
	        }
	        snap = _x;
	        return fan;
	    };
	    fan.decorate = function(_x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = _x;
	        return fan;
	    };

	    d3.rebind(fan, event, 'on');

	    return fan;
	}

	function annotationLine() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        value = identity,
	        keyValue = index,
	        label = value,
	        decorate = noop,
	        orient = 'horizontal';

	    var dataJoin = _dataJoin()
	        .selector('g.annotation')
	        .element('g');

	    var line = function(selection) {
	        selection.each(function(data, selectionIndex) {

	            // the value scale which the annotation 'value' relates to, the crossScale
	            // is the other. Which is which depends on the orienation!
	            var valueScale, crossScale, translation, lineProperty,
	                handleOne, handleTwo,
	                textAttributes = {x: -5, y: -5};
	            switch (orient) {
	            case 'horizontal':
	                translation = function(a, b) { return 'translate(' + a + ', ' + b + ')'; };
	                lineProperty = 'x2';
	                crossScale = xScale;
	                valueScale = yScale;
	                handleOne = 'left-handle';
	                handleTwo = 'right-handle';
	                break;

	            case 'vertical':
	                translation = function(a, b) { return 'translate(' + b + ', ' + a + ')'; };
	                lineProperty = 'y2';
	                crossScale = yScale;
	                valueScale = xScale;
	                textAttributes.transform = 'rotate(-90)';
	                handleOne = 'bottom-handle';
	                handleTwo = 'top-handle';
	                break;

	            default:
	                throw new Error('Invalid orientation');
	            }

	            var scaleRange$$ = scaleRange(crossScale),
	                // the transform that sets the 'origin' of the annotation
	                containerTransform = function(d) {
	                    var transform = valueScale(value(d));
	                    return translation(scaleRange$$[0], transform);
	                },
	                scaleWidth = scaleRange$$[1] - scaleRange$$[0];

	            var container = d3.select(this);

	            // Create a group for each line
	            dataJoin.attr('class', 'annotation ' + orient);
	            var g = dataJoin(container, data);

	            // create the outer container and line
	            var enter = g.enter()
	                .attr('transform', containerTransform);
	            enter.append('line')
	                .attr(lineProperty, scaleWidth);

	            // create containers at each end of the annotation
	            enter.append('g')
	                .classed(handleOne, true);

	            enter.append('g')
	                .classed(handleTwo, true)
	                .attr('transform', translation(scaleWidth, 0))
	                .append('text')
	                .attr(textAttributes);

	            // Update

	            // translate the parent container to the left hand edge of the annotation
	            g.attr('transform', containerTransform);

	            // update the elements that depend on scale width
	            g.select('line')
	                .attr(lineProperty, scaleWidth);
	            g.select('g.' + handleTwo)
	                .attr('transform', translation(scaleWidth, 0));

	            // Update the text label
	            g.select('text')
	                .text(label);

	            decorate(g, data, selectionIndex);
	        });
	    };

	    line.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return line;
	    };
	    line.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return line;
	    };
	    line.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }
	        value = d3.functor(x);
	        return line;
	    };
	    line.keyValue = function(x) {
	        if (!arguments.length) {
	            return keyValue;
	        }
	        keyValue = d3.functor(x);
	        return line;
	    };
	    line.label = function(x) {
	        if (!arguments.length) {
	            return label;
	        }
	        label = d3.functor(x);
	        return line;
	    };
	    line.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return line;
	    };
	    line.orient = function(x) {
	        if (!arguments.length) {
	            return orient;
	        }
	        orient = x;
	        return line;
	    };
	    return line;
	}

	// The multi series does some data-join gymnastics to ensure we don't -
	// * Create unnecessary intermediate DOM nodes
	// * Manipulate the data specified by the user
	// This is achieved by data joining the series array to the container but
	// overriding where the series value is stored on the node (__series__) and
	// forcing the node datum (__data__) to be the user supplied data (via mapping).

	function _multi() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        series = [],
	        mapping = context,
	        key = index,
	        decorate = noop;

	    var dataJoin = _dataJoin()
	        .selector('g.multi')
	        .children(true)
	        .attr('class', 'multi')
	        .element('g')
	        .key(function(d, i) {
	            // This function is invoked twice, the first pass is to pull the key
	            // value from the DOM nodes and the second pass is to pull the key
	            // value from the data values.
	            // As we store the series as an additional property on the node, we
	            // look for that first and if we find it assume we're being called
	            // during the first pass. Otherwise we assume it's the second pass
	            // and pull the series from the data value.
	            var dataSeries = this.__series__ || d;
	            return key.call(this, dataSeries, i);
	        });

	    var multi = function(selection) {

	        selection.each(function(data) {

	            var g = dataJoin(this, series);

	            g.each(function(dataSeries, i) {
	                // We must always assign the series to the node, as the order
	                // may have changed. N.B. in such a case the output is most
	                // likely garbage (containers should not be re-used) but by
	                // doing this we at least make it debuggable garbage :)
	                this.__series__ = dataSeries;

	                (dataSeries.xScale || dataSeries.x).call(dataSeries, xScale);
	                (dataSeries.yScale || dataSeries.y).call(dataSeries, yScale);

	                d3.select(this)
	                    .datum(mapping.call(data, dataSeries, i))
	                    .call(dataSeries);
	            });

	            // order is not available on a transition selection
	            d3.selection.prototype.order.call(g);

	            decorate(g);
	        });
	    };

	    multi.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return multi;
	    };
	    multi.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return multi;
	    };
	    multi.series = function(x) {
	        if (!arguments.length) {
	            return series;
	        }
	        series = x;
	        return multi;
	    };
	    multi.mapping = function(x) {
	        if (!arguments.length) {
	            return mapping;
	        }
	        mapping = x;
	        return multi;
	    };
	    multi.key = function(x) {
	        if (!arguments.length) {
	            return key;
	        }
	        key = x;
	        return multi;
	    };
	    multi.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return multi;
	    };

	    return multi;
	}

	function xyBase() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        y0Value = d3.functor(0),
	        x0Value = d3.functor(0),
	        xValue = function(d, i) { return d.date; },
	        yValue = function(d, i) { return d.close; };

	    function base() { }

	    base.x0 = function(d, i) {
	        return xScale(x0Value(d, i));
	    };
	    base.y0 = function(d, i) {
	        return yScale(y0Value(d, i));
	    };
	    base.x = base.x1 = function(d, i) {
	        return xScale(xValue(d, i));
	    };
	    base.y = base.y1 = function(d, i) {
	        return yScale(yValue(d, i));
	    };
	    base.defined = function(d, i) {
	        return x0Value(d, i) != null && y0Value(d, i) != null &&
	            xValue(d, i) != null && yValue(d, i) != null;
	    };

	    base.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return base;
	    };
	    base.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return base;
	    };
	    base.x0Value = function(x) {
	        if (!arguments.length) {
	            return x0Value;
	        }
	        x0Value = d3.functor(x);
	        return base;
	    };
	    base.y0Value = function(x) {
	        if (!arguments.length) {
	            return y0Value;
	        }
	        y0Value = d3.functor(x);
	        return base;
	    };
	    base.xValue = base.x1Value = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = d3.functor(x);
	        return base;
	    };
	    base.yValue = base.y1Value = function(x) {
	        if (!arguments.length) {
	            return yValue;
	        }
	        yValue = d3.functor(x);
	        return base;
	    };

	    return base;
	}

	function point() {

	    var decorate = noop,
	        symbol = d3.svg.symbol();

	    var base = xyBase();

	    var dataJoin = _dataJoin()
	        .selector('g.point')
	        .element('g')
	        .attr('class', 'point');

	    var containerTransform = function(d, i) {
	        return 'translate(' + base.x(d, i) + ', ' + base.y(d, i) + ')';
	    };

	    var point = function(selection) {

	        selection.each(function(data, index) {

	            var filteredData = data.filter(base.defined);

	            var g = dataJoin(this, filteredData);
	            g.enter()
	                .attr('transform', containerTransform)
	                .append('path');

	            g.attr('transform', containerTransform)
	                .select('path')
	                .attr('d', symbol);

	            decorate(g, data, index);
	        });
	    };

	    point.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return point;
	    };

	    d3.rebind(point, base, 'xScale', 'xValue', 'yScale', 'yValue');
	    d3.rebind(point, dataJoin, 'key');
	    d3.rebind(point, symbol, 'size', 'type');

	    return point;
	}

	function crosshair() {

	    var event = d3.dispatch('trackingstart', 'trackingmove', 'trackingend'),
	        xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        snap = function(_x, _y) {
	            return noSnap(xScale, yScale)(_x, _y);
	        },
	        decorate = noop;

	    var x = function(d) { return d.x; },
	        y = function(d) { return d.y; };

	    var dataJoin = _dataJoin()
	        .children(true)
	        .selector('g.crosshair')
	        .element('g')
	        .attr('class', 'crosshair');

	    var pointSeries = point()
	        .xValue(x)
	        .yValue(y);

	    var horizontalLine = annotationLine()
	        .value(y)
	        .label(function(d) { return d.y; });

	    var verticalLine = annotationLine()
	        .orient('vertical')
	        .value(x)
	        .label(function(d) { return d.x; });

	    // the line annotations used to render the crosshair are positioned using
	    // screen coordinates. This function constructs a suitable scale for rendering
	    // these annotations.
	    function identityScale(scale) {
	        return d3.scale.identity()
	            .range(scaleRange(scale));
	    }

	    var crosshair = function(selection) {

	        selection.each(function(data, index) {

	            var container = d3.select(this)
	                .style('pointer-events', 'all')
	                .on('mouseenter.crosshair', mouseenter)
	                .on('mousemove.crosshair', mousemove)
	                .on('mouseleave.crosshair', mouseleave);

	            var overlay = container.selectAll('rect')
	                .data([data]);

	            overlay.enter()
	                .append('rect')
	                .style('visibility', 'hidden');

	            container.select('rect')
	                .attr('x', scaleRange(xScale)[0])
	                .attr('y', scaleRange(yScale)[1])
	                .attr('width', scaleRange(xScale)[1])
	                .attr('height', scaleRange(yScale)[0]);

	            var crosshairElement = dataJoin(container, data);

	            crosshairElement.enter()
	                .style('pointer-events', 'none');

	            var multi = _multi()
	                .series([horizontalLine, verticalLine, pointSeries])
	                .xScale(identityScale(xScale))
	                .yScale(identityScale(yScale))
	                .mapping(function() {
	                    return [this];
	                });

	            crosshairElement.call(multi);

	            decorate(crosshairElement, data, index);
	        });
	    };

	    function mouseenter() {
	        var mouse = d3.mouse(this);
	        var container = d3.select(this);
	        var snapped = snap.apply(this, mouse);
	        var data = container.datum();
	        data.push(snapped);
	        container.call(crosshair);
	        event.trackingstart.apply(this, arguments);
	    }

	    function mousemove() {
	        var mouse = d3.mouse(this);
	        var container = d3.select(this);
	        var snapped = snap.apply(this, mouse);
	        var data = container.datum();
	        data[data.length - 1] = snapped;
	        container.call(crosshair);
	        event.trackingmove.apply(this, arguments);
	    }

	    function mouseleave() {
	        var container = d3.select(this);
	        var data = container.datum();
	        data.pop();
	        container.call(crosshair);
	        event.trackingend.apply(this, arguments);
	    }

	    crosshair.xScale = function(_x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = _x;
	        return crosshair;
	    };
	    crosshair.yScale = function(_x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = _x;
	        return crosshair;
	    };
	    crosshair.snap = function(_x) {
	        if (!arguments.length) {
	            return snap;
	        }
	        snap = _x;
	        return crosshair;
	    };
	    crosshair.decorate = function(_x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = _x;
	        return crosshair;
	    };

	    d3.rebind(crosshair, event, 'on');

	    rebind(crosshair, horizontalLine, {
	        yLabel: 'label'
	    });

	    rebind(crosshair, verticalLine, {
	        xLabel: 'label'
	    });

	    return crosshair;
	}

	var tool = {
	    crosshair: crosshair,
	    fibonacciFan: fibonacciFan,
	    container: container,
	    measure: measure
	};

	// Renders an error bar series as an SVG path based on the given array of datapoints.
	function svgErrorBar() {

	    var x = function(d, i) { return d.x; },
	        y = function(d, i) { return d.y; },
	        errorHigh = function(d, i) { return d.errorHigh; },
	        errorLow = function(d, i) { return d.errorLow; },
	        orient = 'vertical',
	        barWidth = d3.functor(5);

	    var errorBar = function(data) {

	        return data.map(function(d, i) {
	            var halfWidth = barWidth(d, i) / 2,
	                errorTotal = errorHigh(d, i) - errorLow(d, i),
	                yBottom = y(d, i) - errorLow(d, i),
	                yTop = errorHigh(d, i) - y(d, i),
	                xBottom = x(d, i) - errorLow(d, i),
	                xTop = errorHigh(d, i) - x(d, i);

	            var errorVertical = '';
	            var errorHorizontal = '';

	            if (orient === 'vertical') {
	                var horizontalBar = 'h' + (-halfWidth) + 'h' + (2 * halfWidth) + 'h' + (-halfWidth),
	                    verticalToHigh = 'v' + (-errorTotal);
	                errorVertical = 'M0,' + yBottom + horizontalBar + verticalToHigh + horizontalBar + 'M0,' + yTop;
	            } else {
	                var verticalBar = 'v' + (-halfWidth) + 'v' + (2 * halfWidth) + 'v' + (-halfWidth),
	                    horizontalToHigh = 'h' + (-errorTotal);
	                errorHorizontal = 'M' + xBottom + ',0' + verticalBar + horizontalToHigh + verticalBar + 'M' + xTop + ',0';
	            }

	            return errorVertical + errorHorizontal;
	        })
	        .join('');
	    };

	    errorBar.x = function(_x) {
	        if (!arguments.length) {
	            return x;
	        }
	        x = d3.functor(_x);
	        return errorBar;
	    };
	    errorBar.y = function(_x) {
	        if (!arguments.length) {
	            return y;
	        }
	        y = d3.functor(_x);
	        return errorBar;
	    };
	    errorBar.errorHigh = function(_x) {
	        if (!arguments.length) {
	            return errorHigh;
	        }
	        errorHigh = d3.functor(_x);
	        return errorBar;
	    };
	    errorBar.errorLow = function(_x) {
	        if (!arguments.length) {
	            return errorLow;
	        }
	        errorLow = d3.functor(_x);
	        return errorBar;
	    };
	    errorBar.barWidth = function(_x) {
	        if (!arguments.length) {
	            return barWidth;
	        }
	        barWidth = d3.functor(_x);
	        return errorBar;
	    };
	    errorBar.orient = function(_x) {
	        if (!arguments.length) {
	            return orient;
	        }
	        orient = _x;
	        return errorBar;
	    };

	    return errorBar;

	}

	// Renders an OHLC as an SVG path based on the given array of datapoints. Each
	// OHLC has a fixed width, whilst the x, open, high, low and close positions are
	// obtained from each point via the supplied accessor functions.
	function svgOhlc() {

	    var x = function(d, i) { return d.date; },
	        open = function(d, i) { return d.open; },
	        high = function(d, i) { return d.high; },
	        low = function(d, i) { return d.low; },
	        close = function(d, i) { return d.close; },
	        width = d3.functor(3);

	    var ohlc = function(data) {

	        return data.map(function(d, i) {
	            var xValue = x(d, i),
	                yOpen = open(d, i),
	                yHigh = high(d, i),
	                yLow = low(d, i),
	                yClose = close(d, i),
	                halfWidth = width(d, i) / 2;

	            var moveToLow = 'M' + xValue + ',' + yLow,
	                verticalToHigh = 'V' + yHigh,
	                openTick = 'M' + xValue + ',' + yOpen + 'h' + (-halfWidth),
	                closeTick = 'M' + xValue + ',' + yClose + 'h' + halfWidth;
	            return moveToLow + verticalToHigh + openTick + closeTick;
	        })
	        .join('');
	    };

	    ohlc.x = function(_x) {
	        if (!arguments.length) {
	            return x;
	        }
	        x = d3.functor(_x);
	        return ohlc;
	    };
	    ohlc.open = function(_x) {
	        if (!arguments.length) {
	            return open;
	        }
	        open = d3.functor(_x);
	        return ohlc;
	    };
	    ohlc.high = function(_x) {
	        if (!arguments.length) {
	            return high;
	        }
	        high = d3.functor(_x);
	        return ohlc;
	    };
	    ohlc.low = function(_x) {
	        if (!arguments.length) {
	            return low;
	        }
	        low = d3.functor(_x);
	        return ohlc;
	    };
	    ohlc.close = function(_x) {
	        if (!arguments.length) {
	            return close;
	        }
	        close = d3.functor(_x);
	        return ohlc;
	    };
	    ohlc.width = function(_x) {
	        if (!arguments.length) {
	            return width;
	        }
	        width = d3.functor(_x);
	        return ohlc;
	    };

	    return ohlc;

	}

	// Renders a candlestick as an SVG path based on the given array of datapoints. Each
	// candlestick has a fixed width, whilst the x, open, high, low and close positions are
	// obtained from each point via the supplied accessor functions.
	function candlestickSvg() {

	    var x = function(d, i) { return d.date; },
	        open = function(d, i) { return d.open; },
	        high = function(d, i) { return d.high; },
	        low = function(d, i) { return d.low; },
	        close = function(d, i) { return d.close; },
	        width = d3.functor(3);

	    var candlestick = function(data) {

	        return data.map(function(d, i) {
	            var xValue = x(d, i),
	                yOpen = open(d, i),
	                yHigh = high(d, i),
	                yLow = low(d, i),
	                yClose = close(d, i),
	                barWidth = width(d, i);

	            // Move to the opening price
	            var body = 'M' + (xValue - barWidth / 2) + ',' + yOpen +
	                // Draw the width
	                'h' + barWidth +
	                // Draw to the closing price (vertically)
	                'V' + yClose +
	                // Draw the width
	                'h' + -barWidth +
	                // Move back to the opening price
	                'V' + yOpen +
	                // Close the path
	                'z';

	            // Move to the max price of close or open; draw the high wick
	            // N.B. Math.min() is used as we're dealing with pixel values,
	            // the lower the pixel value, the higher the price!
	            var highWick = 'M' + xValue + ',' + Math.min(yClose, yOpen) +
	                'V' + yHigh;

	            // Move to the min price of close or open; draw the low wick
	            // N.B. Math.max() is used as we're dealing with pixel values,
	            // the higher the pixel value, the lower the price!
	            var lowWick = 'M' + xValue + ',' + Math.max(yClose, yOpen) +
	                'V' + yLow;

	            return body + highWick + lowWick;
	        })
	        .join('');
	    };

	    candlestick.x = function(_x) {
	        if (!arguments.length) {
	            return x;
	        }
	        x = d3.functor(_x);
	        return candlestick;
	    };
	    candlestick.open = function(_x) {
	        if (!arguments.length) {
	            return open;
	        }
	        open = d3.functor(_x);
	        return candlestick;
	    };
	    candlestick.high = function(_x) {
	        if (!arguments.length) {
	            return high;
	        }
	        high = d3.functor(_x);
	        return candlestick;
	    };
	    candlestick.low = function(_x) {
	        if (!arguments.length) {
	            return low;
	        }
	        low = d3.functor(_x);
	        return candlestick;
	    };
	    candlestick.close = function(_x) {
	        if (!arguments.length) {
	            return close;
	        }
	        close = d3.functor(_x);
	        return candlestick;
	    };
	    candlestick.width = function(_x) {
	        if (!arguments.length) {
	            return width;
	        }
	        width = d3.functor(_x);
	        return candlestick;
	    };

	    return candlestick;

	}

	// Renders a bar series as an SVG path based on the given array of datapoints. Each
	// bar has a fixed width, whilst the x, y and height are obtained from each data
	// point via the supplied accessor functions.
	function svgBar() {

	    var x = function(d, i) { return d.x; },
	        y = function(d, i) { return d.y; },
	        horizontalAlign = 'center',
	        verticalAlign = 'center',
	        height = function(d, i) { return d.height; },
	        width = d3.functor(3);

	    var bar = function(data, index) {

	        return data.map(function(d, i) {
	            var xValue = x.call(this, d, index || i),
	                yValue = y.call(this, d, index || i),
	                barHeight = height.call(this, d, index || i),
	                barWidth = width.call(this, d, index || i);

	            var horizontalOffset;
	            switch (horizontalAlign) {
	            case 'left':
	                horizontalOffset = barWidth;
	                break;
	            case 'right':
	                horizontalOffset = 0;
	                break;
	            case 'center':
	                horizontalOffset = barWidth / 2;
	                break;
	            default:
	                throw new Error('Invalid horizontal alignment ' + horizontalAlign);
	            }

	            var verticalOffset;
	            switch (verticalAlign) {
	            case 'bottom':
	                verticalOffset = -barHeight;
	                break;
	            case 'top':
	                verticalOffset = 0;
	                break;
	            case 'center':
	                verticalOffset = barHeight / 2;
	                break;
	            default:
	                throw new Error('Invalid vertical alignment ' + verticalAlign);
	            }

	            // Move to the start location
	            var body = 'M' + (xValue - horizontalOffset) + ',' + (yValue - verticalOffset) +
	                // Draw the width
	                'h' + barWidth +
	                // Draw to the top
	                'v' + barHeight +
	                // Draw the width
	                'h' + -barWidth +
	                // Close the path
	                'z';
	            return body;
	        }, this)
	        .join('');
	    };

	    bar.x = function(_x) {
	        if (!arguments.length) {
	            return x;
	        }
	        x = d3.functor(_x);
	        return bar;
	    };
	    bar.y = function(_x) {
	        if (!arguments.length) {
	            return y;
	        }
	        y = d3.functor(_x);
	        return bar;
	    };
	    bar.width = function(_x) {
	        if (!arguments.length) {
	            return width;
	        }
	        width = d3.functor(_x);
	        return bar;
	    };
	    bar.horizontalAlign = function(_x) {
	        if (!arguments.length) {
	            return horizontalAlign;
	        }
	        horizontalAlign = _x;
	        return bar;
	    };
	    bar.height = function(_x) {
	        if (!arguments.length) {
	            return height;
	        }
	        height = d3.functor(_x);
	        return bar;
	    };
	    bar.verticalAlign = function(_x) {
	        if (!arguments.length) {
	            return verticalAlign;
	        }
	        verticalAlign = _x;
	        return bar;
	    };
	    return bar;

	}

	// A drop-in replacement for the D3 axis, supporting the decorate pattern.
	function axisSvg() {

	    var scale = d3.scale.identity(),
	        decorate = noop,
	        orient = 'bottom',
	        tickArguments = [10],
	        tickValues = null,
	        tickFormat = null,
	        outerTickSize = 6,
	        innerTickSize = 6,
	        tickPadding = 3,
	        svgDomainLine = d3.svg.line();

	    var dataJoin = _dataJoin()
	        .selector('g.tick')
	        .element('g')
	        .key(identity)
	        .attr('class', 'tick');

	    var domainPathDataJoin = _dataJoin()
	        .selector('path.domain')
	        .element('path')
	        .attr('class', 'domain');

	    // returns a function that creates a translation based on
	    // the bound data
	    function containerTranslate(s, trans) {
	        return function(d) {
	            return trans(s(d), 0);
	        };
	    }

	    function translate(x, y) {
	        if (isVertical()) {
	            return 'translate(' + y + ', ' + x + ')';
	        } else {
	            return 'translate(' + x + ', ' + y + ')';
	        }
	    }

	    function pathTranspose(arr) {
	        if (isVertical()) {
	            return arr.map(function(d) {
	                return [d[1], d[0]];
	            });
	        } else {
	            return arr;
	        }
	    }

	    function isVertical() {
	        return orient === 'left' || orient === 'right';
	    }

	    function tryApply(fn, defaultVal) {
	        return scale[fn] ? scale[fn].apply(scale, tickArguments) : defaultVal;
	    }

	    var axis = function(selection) {

	        selection.each(function(data, index) {

	            // Stash a snapshot of the new scale, and retrieve the old snapshot.
	            var scaleOld = this.__chart__ || scale;
	            this.__chart__ = scale.copy();

	            var ticksArray = tickValues == null ? tryApply('ticks', scale.domain()) : tickValues;
	            var tickFormatter = tickFormat == null ? tryApply('tickFormat', identity) : tickFormat;
	            var sign = orient === 'bottom' || orient === 'right' ? 1 : -1;
	            var container = d3.select(this);

	            // add the domain line
	            var range = scaleRange(scale);
	            var domainPathData = pathTranspose([
	                [range[0], sign * outerTickSize],
	                [range[0], 0],
	                [range[1], 0],
	                [range[1], sign * outerTickSize]
	            ]);

	            var domainLine = domainPathDataJoin(container, [data]);
	            domainLine
	                .attr('d', svgDomainLine(domainPathData));

	            // datajoin and construct the ticks / label
	            dataJoin.attr({
	                // set the initial tick position based on the previous scale
	                // in order to get the correct enter transition - however, for ordinal
	                // scales the tick will not exist on the old scale, so use the current position
	                'transform': containerTranslate(isOrdinal(scale) ? scale : scaleOld, translate)
	            });

	            var g = dataJoin(container, ticksArray);

	            // enter
	            g.enter().append('path');

	            var labelOffset = sign * (innerTickSize + tickPadding);
	            g.enter()
	                .append('text')
	                .attr('transform', translate(0, labelOffset));

	            // update
	            g.attr('class', 'tick orient-' + orient);

	            g.attr('transform', containerTranslate(scale, translate));

	            g.selectAll('path')
	                .attr('d', function(d) {
	                    return svgDomainLine(pathTranspose([
	                        [0, 0], [0, sign * innerTickSize]
	                    ]));
	                });

	            g.selectAll('text')
	               .attr('transform', translate(0, labelOffset))
	               .text(tickFormatter);

	            // exit - for non ordinal scales, exit by animating the tick to its new location
	            if (!isOrdinal(scale)) {
	                g.exit()
	                    .attr('transform', containerTranslate(scale, translate));
	            }

	            decorate(g, data, index);
	        });
	    };

	    axis.scale = function(x) {
	        if (!arguments.length) {
	            return scale;
	        }
	        scale = x;
	        return axis;
	    };

	    axis.ticks = function(x) {
	        if (!arguments.length) {
	            return tickArguments;
	        }
	        tickArguments = arguments;
	        return axis;
	    };

	    axis.tickValues = function(x) {
	        if (!arguments.length) {
	            return tickValues;
	        }
	        tickValues = x;
	        return axis;
	    };

	    axis.tickFormat = function(x) {
	        if (!arguments.length) {
	            return tickFormat;
	        }
	        tickFormat = x;
	        return axis;
	    };

	    axis.tickSize = function(x) {
	        var n = arguments.length;
	        if (!n) {
	            return innerTickSize;
	        }
	        innerTickSize = Number(x);
	        outerTickSize = Number(arguments[n - 1]);
	        return axis;
	    };

	    axis.innerTickSize = function(x) {
	        if (!arguments.length) {
	            return innerTickSize;
	        }
	        innerTickSize = Number(x);
	        return axis;
	    };

	    axis.outerTickSize = function(x) {
	        if (!arguments.length) {
	            return outerTickSize;
	        }
	        outerTickSize = Number(x);
	        return axis;
	    };

	    axis.tickPadding = function(x) {
	        if (!arguments.length) {
	            return tickPadding;
	        }
	        tickPadding = x;
	        return axis;
	    };

	    axis.orient = function(x) {
	        if (!arguments.length) {
	            return orient;
	        }
	        orient = x;
	        return axis;
	    };

	    axis.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return axis;
	    };

	    return axis;
	}

	var svg = {
	    axis: axisSvg,
	    bar: svgBar,
	    candlestick: candlestickSvg,
	    ohlc: svgOhlc,
	    errorBar: svgErrorBar
	};

	function waterfall$1() {

	    var xValueKey = '',
	        yValue = function(d) { return d.y; },
	        startsWithTotal = false,
	        totals = function(d, i, data) {
	            if (i === data.length - 1) {
	                return 'Final';
	            }
	        },
	        directions = {
	            up: 'up',
	            down: 'down',
	            unchanged: 'unchanged'
	        };

	    var waterfall = function(data) {
	        var length = data.length,
	            i = 0,
	            previousEnd = 0,
	            start,
	            end,
	            total,
	            result = [],
	            finalIndex = length - 1;

	        if (startsWithTotal) {
	            // First value is a total
	            previousEnd = yValue(data[0]);
	            result.push({
	                x: data[0][xValueKey],
	                y0: 0,
	                y1: previousEnd,
	                direction: directions.unchanged
	            });
	            i = 1;
	        }

	        for (i; i < length; i += 1) {
	            start = previousEnd;
	            end = yValue(data[i]) + previousEnd;

	            result.push({
	                x: data[i][xValueKey],
	                y0: start,
	                y1: end,
	                direction: end - start > 0 ? directions.up : directions.down
	            });

	            total = totals(data[i], i, data);
	            if (total) {
	                // Insert a total value here
	                result.push({
	                    x: total,
	                    y0: 0,
	                    y1: end,
	                    direction: directions.unchanged
	                });
	            }

	            previousEnd = end;
	        }

	        return result;
	    };

	    waterfall.xValueKey = function(x) {
	        if (!arguments.length) {
	            return xValueKey;
	        }
	        xValueKey = x;
	        return waterfall;
	    };

	    waterfall.yValue = function(x) {
	        if (!arguments.length) {
	            return yValue;
	        }
	        yValue = x;
	        return waterfall;
	    };

	    waterfall.total = function(x) {
	        if (!arguments.length) {
	            return totals;
	        }
	        totals = x;
	        return waterfall;
	    };

	    waterfall.startsWithTotal = function(x) {
	        if (!arguments.length) {
	            return startsWithTotal;
	        }
	        startsWithTotal = x;
	        return waterfall;
	    };

	    return waterfall;
	}

	var algorithm$1 = {
	    waterfall: waterfall$1
	};

	// The bar series renders a vertical (column) or horizontal (bar) series. In order
	// to provide a common implementation there are a number of functions that specialise
	// the rendering logic based on the 'orient' property.
	function _bar() {

	    var decorate = noop,
	        barWidth = fractionalBarWidth(0.75),
	        orient = 'vertical',
	        pathGenerator = svgBar();

	    var base = xyBase()
	      .xValue(function(d, i) { return orient === 'vertical' ? d.date : d.close; })
	      .yValue(function(d, i) { return orient === 'vertical' ? d.close : d.date; });

	    var dataJoin = _dataJoin()
	        .selector('g.bar')
	        .element('g');

	    function containerTranslation(d, i) {
	        if (orient === 'vertical') {
	            return 'translate(' + base.x1(d, i) + ', ' + base.y0(d, i) + ')';
	        } else {
	            return 'translate(' + base.x0(d, i) + ', ' + base.y1(d, i) + ')';
	        }
	    }

	    function barHeight(d, i) {
	        if (orient === 'vertical') {
	            return base.y1(d, i) - base.y0(d, i);
	        } else {
	            return base.x1(d, i) - base.x0(d, i);
	        }
	    }

	    function valueAxisDimension(generator) {
	        if (orient === 'vertical') {
	            return generator.height;
	        } else {
	            return generator.width;
	        }
	    }

	    function crossAxisDimension(generator) {
	        if (orient === 'vertical') {
	            return generator.width;
	        } else {
	            return generator.height;
	        }
	    }

	    function crossAxisValueFunction() {
	        return orient === 'vertical' ? base.x : base.y;
	    }

	    var bar = function(selection) {
	        selection.each(function(data, index) {

	            if (orient !== 'vertical' && orient !== 'horizontal') {
	                throw new Error('The bar series does not support an orientation of ' + orient);
	            }

	            dataJoin.attr('class', 'bar ' + orient);

	            var filteredData = data.filter(base.defined);

	            pathGenerator.x(0)
	                .y(0)
	                .width(0)
	                .height(0);

	            if (orient === 'vertical') {
	                pathGenerator.verticalAlign('top');
	            } else {
	                pathGenerator.horizontalAlign('right');
	            }

	            // set the width of the bars
	            var width = barWidth(filteredData.map(crossAxisValueFunction()));
	            crossAxisDimension(pathGenerator)(width);

	            var g = dataJoin(this, filteredData);

	            // within the enter selection the pathGenerator creates a zero
	            // height bar. As a result, when used with a transition the bar grows
	            // from y0 to y1 (y)
	            g.enter()
	                .attr('transform', containerTranslation)
	                .append('path')
	                .attr('d', function(d) { return pathGenerator([d]); });

	            // set the bar to its correct height
	            valueAxisDimension(pathGenerator)(barHeight);

	            g.attr('transform', containerTranslation)
	                .select('path')
	                .attr('d', function(d) { return pathGenerator([d]); });

	            decorate(g, filteredData, index);
	        });
	    };

	    bar.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return bar;
	    };
	    bar.barWidth = function(x) {
	        if (!arguments.length) {
	            return barWidth;
	        }
	        barWidth = d3.functor(x);
	        return bar;
	    };
	    bar.orient = function(x) {
	        if (!arguments.length) {
	            return orient;
	        }
	        orient = x;
	        return bar;
	    };

	    d3.rebind(bar, base, 'xScale', 'xValue', 'x1Value', 'x0Value', 'yScale', 'yValue', 'y1Value', 'y0Value');
	    d3.rebind(bar, dataJoin, 'key');

	    return bar;
	}

	function waterfall() {

	    function isVertical() {
	        return bar.orient() === 'vertical';
	    }

	    var bar = _bar();

	    var waterfall = function(selection) {
	        bar
	            .xValue(function(d, i) { return isVertical() ? d.x : d.y1; })
	            .yValue(function(d, i) { return isVertical() ? d.y1 : d.x; })
	            .x0Value(function(d, i) { return isVertical() ? 0 : d.y0; })
	            .y0Value(function(d, i) { return isVertical() ? d.y0 : 0; })
	            .decorate(function(g, d1, i) {
	                g.enter()
	                    .attr('class', 'waterfall ' + bar.orient())
	                    .classed('up', function(d) { return d.direction === 'up'; })
	                    .classed('down', function(d) { return d.direction === 'down'; });
	            });

	        bar(selection);
	    };

	    rebindAll(waterfall, bar);

	    return waterfall;
	}

	function errorBase() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        errorHigh = d3.functor(0),
	        errorLow = d3.functor(0),
	        xValue = function(d, i) { return d.date; },
	        yValue = function(d, i) { return d.close; },
	        orient = 'vertical',
	        barWidth = d3.functor(5);

	    function base() { }

	    base.width = function(data, orientation) {
	        if (orientation === 'vertical') {
	            return barWidth(data.map(function(d, i) {
	                return xScale(xValue(d, i));
	            }));
	        } else {
	            return barWidth(data.map(function(d, i) {
	                return yScale(yValue(d, i));
	            }));
	        }
	    };

	    base.values = function(d, i) {
	        if (orient === 'vertical') {
	            return {
	                x: xScale(xValue(d, i)),
	                y: yScale(yValue(d, i)),
	                errorHigh: yScale(errorHigh(d, i)),
	                errorLow: yScale(errorLow(d, i))
	            };
	        } else {
	            return {
	                x: xScale(xValue(d, i)),
	                y: yScale(yValue(d, i)),
	                errorHigh: xScale(errorHigh(d, i)),
	                errorLow: xScale(errorLow(d, i))
	            };
	        }
	    };
	    base.defined = function(d, i) {
	        return errorLow(d, i) != null && errorHigh(d, i) != null
	            && xValue(d, i) != null && yValue(d, i) != null;
	    };

	    base.orient = function(x) {
	        if (!arguments.length) {
	            return orient;
	        }
	        orient = x;
	        return base;
	    };
	    base.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return base;
	    };
	    base.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return base;
	    };
	    base.errorLow = function(x) {
	        if (!arguments.length) {
	            return errorLow;
	        }
	        errorLow = d3.functor(x);
	        return base;
	    };
	    base.errorHigh = function(x) {
	        if (!arguments.length) {
	            return errorHigh;
	        }
	        errorHigh = d3.functor(x);
	        return base;
	    };
	    base.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = d3.functor(x);
	        return base;
	    };
	    base.yValue = function(x) {
	        if (!arguments.length) {
	            return yValue;
	        }
	        yValue = d3.functor(x);
	        return base;
	    };
	    base.barWidth = function(x) {
	        if (!arguments.length) {
	            return barWidth;
	        }
	        barWidth = d3.functor(x);
	        return base;
	    };

	    return base;
	}

	function errorBar() {

	    var decorate = noop,
	        barWidth = 5,
	        orient = 'vertical',
	        base = errorBase();

	    var dataJoin = _dataJoin()
	        .selector('g.errorBar')
	        .element('g')
	        .attr('class', 'errorBar');

	    var errorBar = function(selection) {
	        base.orient(errorBar.orient());
	        selection.each(function(data, index) {

	            var filteredData = data.filter(base.defined);

	            var g = dataJoin(this, filteredData);

	            g.enter()
	                .append('path');

	            var pathGenerator = svgErrorBar()
	                .orient(errorBar.orient())
	                .barWidth(base.width(filteredData));

	            g.each(function(d, i) {
	                var values = base.values(d, i);

	                var gErrorBar = d3.select(this)
	                    .attr('transform', 'translate(' + values.x + ', ' + values.y + ')');

	                pathGenerator
	                    .x(values.x)
	                    .errorHigh(values.errorHigh)
	                    .errorLow(values.errorLow)
	                    .y(values.y);

	                gErrorBar.select('path')
	                    .attr('d', pathGenerator([d]))
	                    .attr('stroke', 'black');
	            });

	            decorate(g, data, index);
	        });
	    };

	    errorBar.barWidth = function(x) {
	        if (!arguments.length) {
	            return barWidth;
	        }
	        barWidth = x;
	        return errorBar;
	    };

	    errorBar.orient = function(x) {
	        if (!arguments.length) {
	            return orient;
	        }
	        orient = x;
	        return errorBar;
	    };

	    errorBar.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return errorBar;
	    };

	    d3.rebind(errorBar, dataJoin, 'key');
	    rebindAll(errorBar, base);

	    return errorBar;
	}

	function ohlcBase() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        xValue = function(d, i) { return d.date; },
	        yOpenValue = function(d, i) { return d.open; },
	        yHighValue = function(d, i) { return d.high; },
	        yLowValue = function(d, i) { return d.low; },
	        yCloseValue = function(d, i) { return d.close; },
	        barWidth = fractionalBarWidth(0.75),
	        xValueScaled = function(d, i) {
	            return xScale(xValue(d, i));
	        };

	    function base() { }

	    base.width = function(data) {
	        return barWidth(data.map(xValueScaled));
	    };

	    base.defined = function(d, i) {
	        return xValue(d, i) != null && yOpenValue(d, i) != null &&
	            yLowValue(d, i) != null && yHighValue(d, i) != null &&
	            yCloseValue(d, i) != null;
	    };

	    base.values = function(d, i) {
	        var yCloseRaw = yCloseValue(d, i),
	            yOpenRaw = yOpenValue(d, i);

	        var direction = '';
	        if (yCloseRaw > yOpenRaw) {
	            direction = 'up';
	        } else if (yCloseRaw < yOpenRaw) {
	            direction = 'down';
	        }

	        return {
	            x: xValueScaled(d, i),
	            yOpen: yScale(yOpenRaw),
	            yHigh: yScale(yHighValue(d, i)),
	            yLow: yScale(yLowValue(d, i)),
	            yClose: yScale(yCloseRaw),
	            direction: direction
	        };
	    };

	    base.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return base;
	    };
	    base.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return base;
	    };
	    base.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = x;
	        return base;
	    };
	    base.yOpenValue = function(x) {
	        if (!arguments.length) {
	            return yOpenValue;
	        }
	        yOpenValue = x;
	        return base;
	    };
	    base.yHighValue = function(x) {
	        if (!arguments.length) {
	            return yHighValue;
	        }
	        yHighValue = x;
	        return base;
	    };
	    base.yLowValue = function(x) {
	        if (!arguments.length) {
	            return yLowValue;
	        }
	        yLowValue = x;
	        return base;
	    };
	    base.yValue = base.yCloseValue = function(x) {
	        if (!arguments.length) {
	            return yCloseValue;
	        }
	        yCloseValue = x;
	        return base;
	    };
	    base.barWidth = function(x) {
	        if (!arguments.length) {
	            return barWidth;
	        }
	        barWidth = d3.functor(x);
	        return base;
	    };

	    return base;
	}

	function groupedBar() {

	    var bar = _bar(),
	        barWidth = fractionalBarWidth(0.75),
	        decorate = noop,
	        xScale = d3.scale.linear(),
	        offsetScale = d3.scale.linear(),
	        values = function(d) { return d.values; };

	    var dataJoin = _dataJoin()
	        .selector('g.stacked')
	        .element('g')
	        .attr('class', 'stacked');

	    var x = function(d, i) { return xScale(bar.xValue()(d, i)); };

	    var groupedBar = function(selection) {
	        selection.each(function(data) {

	            var width = barWidth(values(data[0]).map(x));
	            var subBarWidth = width / (data.length - 1);
	            bar.barWidth(subBarWidth);

	            var halfWidth = width / 2;
	            offsetScale.domain([0, data.length - 1])
	                .range([-halfWidth, halfWidth]);

	            var g = dataJoin(this, data);

	            g.enter().append('g');

	            g.select('g')
	                .datum(values)
	                .each(function(series, index) {
	                    var container = d3.select(this);

	                    // create a composite scale that applies the required offset
	                    var compositeScale = function(_x) {
	                        return xScale(_x) + offsetScale(index);
	                    };
	                    bar.xScale(compositeScale);

	                    // adapt the decorate function to give each series the correct index
	                    bar.decorate(function(s, d) {
	                        decorate(s, d, index);
	                    });

	                    container.call(bar);
	                });
	        });
	    };

	    groupedBar.decorate = function(_x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = _x;
	        return groupedBar;
	    };
	    groupedBar.xScale = function(_x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = _x;
	        return groupedBar;
	    };
	    groupedBar.values = function(_x) {
	        if (!arguments.length) {
	            return values;
	        }
	        values = _x;
	        return groupedBar;
	    };

	    d3.rebind(groupedBar, bar, 'yValue', 'xValue', 'yScale');

	    return groupedBar;
	}

	function _line() {

	    var decorate = noop;

	    var base = xyBase();

	    var lineData = d3.svg.line()
	        .defined(base.defined)
	        .x(base.x)
	        .y(base.y);

	    var dataJoin = _dataJoin()
	        .selector('path.line')
	        .element('path')
	        .attr('class', 'line');

	    var line = function(selection) {

	        selection.each(function(data, index) {

	            var path = dataJoin(this, [data]);
	            path.attr('d', lineData);

	            decorate(path, data, index);
	        });
	    };

	    line.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return line;
	    };

	    d3.rebind(line, base, 'xScale', 'xValue', 'yScale', 'yValue');
	    d3.rebind(line, dataJoin, 'key');
	    d3.rebind(line, lineData, 'interpolate', 'tension');

	    return line;
	}

	function _stack() {

	    var series = noop,
	        values = function(d) { return d.values; };

	    var stack = function(selection) {

	        selection.each(function(data) {

	            var container = d3.select(this);

	            var dataJoin = _dataJoin()
	                .selector('g.stacked')
	                .element('g')
	                .attr('class', 'stacked');

	            var g = dataJoin(container, data);

	            g.enter().append('g');
	            g.select('g')
	                .datum(values)
	                .call(series);
	        });
	    };

	    stack.series = function(x) {
	        if (!arguments.length) {
	            return series;
	        }
	        series = x;
	        return stack;
	    };
	    stack.values = function(x) {
	        if (!arguments.length) {
	            return values;
	        }
	        values = x;
	        return stack;
	    };

	    return stack;
	}

	function line() {

	    var line = _line()
	        .yValue(function(d) { return d.y0 + d.y; });

	    var stack = _stack()
	        .series(line);

	    var stackedLine = function(selection) {
	        selection.call(stack);
	    };

	    rebindAll(stackedLine, line);

	    return stackedLine;
	}

	function bar() {

	    var bar = _bar()
	        .yValue(function(d) { return d.y0 + d.y; })
	        .y0Value(function(d) { return d.y0; });

	    var stack = _stack()
	        .series(bar);

	    var stackedBar = function(selection) {
	        selection.call(stack);
	    };

	    rebindAll(stackedBar, bar);

	    return stackedBar;
	}

	function _area() {

	    var decorate = noop;

	    var base = xyBase();

	    var areaData = d3.svg.area()
	        .defined(base.defined)
	        .x(base.x)
	        .y0(base.y0)
	        .y1(base.y1);

	    var dataJoin = _dataJoin()
	        .selector('path.area')
	        .element('path')
	        .attr('class', 'area');

	    var area = function(selection) {

	        selection.each(function(data, index) {

	            var path = dataJoin(this, [data]);
	            path.attr('d', areaData);

	            decorate(path, data, index);
	        });
	    };

	    area.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return area;
	    };

	    d3.rebind(area, base, 'xScale', 'xValue', 'yScale', 'yValue', 'y1Value', 'y0Value');
	    d3.rebind(area, dataJoin, 'key');
	    d3.rebind(area, areaData, 'interpolate', 'tension');

	    return area;
	}

	function area() {

	    var area = _area()
	        .yValue(function(d) { return d.y0 + d.y; })
	        .y0Value(function(d) { return d.y0; });

	    var stack = _stack()
	        .series(area);

	    var stackedArea = function(selection) {
	        selection.call(stack);
	    };

	    rebindAll(stackedArea, area);

	    return stackedArea;
	}

	var stacked = {
	    area: area,
	    bar: bar,
	    stack: _stack,
	    line: line
	};

	function ohlc(drawMethod) {

	    var decorate = noop,
	        base = ohlcBase();

	    var dataJoin = _dataJoin()
	        .selector('g.ohlc')
	        .element('g')
	        .attr('class', 'ohlc');

	    function containerTranslation(values) {
	        return 'translate(' + values.x + ', ' + values.yHigh + ')';
	    }

	    var ohlc = function(selection) {
	        selection.each(function(data, index) {

	            var filteredData = data.filter(base.defined);

	            var g = dataJoin(this, filteredData);

	            g.enter()
	                .attr('transform', function(d, i) {
	                    return containerTranslation(base.values(d, i)) + ' scale(1e-6, 1)';
	                })
	                .append('path');

	            var pathGenerator = svgOhlc()
	                    .width(base.width(filteredData));

	            g.each(function(d, i) {
	                var values = base.values(d, i);

	                var graph = d3.transition(d3.select(this))
	                    .attr({
	                        'class': 'ohlc ' + values.direction,
	                        'transform': function() { return containerTranslation(values) + ' scale(1)'; }
	                    });

	                pathGenerator.x(d3.functor(0))
	                    .open(function() { return values.yOpen - values.yHigh; })
	                    .high(function() { return values.yHigh - values.yHigh; })
	                    .low(function() { return values.yLow - values.yHigh; })
	                    .close(function() { return values.yClose - values.yHigh; });

	                graph.select('path')
	                    .attr('d', pathGenerator([d]));
	            });

	            decorate(g, data, index);
	        });
	    };

	    ohlc.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return ohlc;
	    };

	    d3.rebind(ohlc, dataJoin, 'key');
	    rebindAll(ohlc, base);

	    return ohlc;
	}

	function cycle() {

	    var decorate = noop,
	        xScale = d3.scale.linear(),
	        yScale = d3.scale.linear(),
	        xValue = function(d, i) { return d.date.getDay(); },
	        subScale = d3.scale.linear(),
	        subSeries = _line(),
	        barWidth = fractionalBarWidth(0.75);

	    var dataJoin = _dataJoin()
	        .selector('g.cycle')
	        .element('g')
	        .attr('class', 'cycle');

	    var cycle = function(selection) {

	        selection.each(function(data, index) {

	            var dataByX = d3.nest()
	                .key(xValue)
	                .map(data);

	            var xValues = Object.keys(dataByX);

	            var width = barWidth(xValues.map(xScale)),
	                halfWidth = width / 2;

	            var g = dataJoin(this, xValues);

	            g.each(function(d, i) {

	                var graph = d3.select(this);

	                graph.attr('transform', 'translate(' + xScale(d) + ', 0)');

	                (subScale.rangeBands || subScale.range)([-halfWidth, halfWidth]);

	                subSeries.xScale(subScale)
	                    .yScale(yScale);

	                d3.select(this)
	                    .datum(dataByX[d])
	                    .call(subSeries);

	            });

	            decorate(g, xValues, index);
	        });
	    };

	    cycle.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return cycle;
	    };
	    cycle.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return cycle;
	    };
	    cycle.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return cycle;
	    };
	    cycle.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = x;
	        return cycle;
	    };
	    cycle.subScale = function(x) {
	        if (!arguments.length) {
	            return subScale;
	        }
	        subScale = x;
	        return cycle;
	    };
	    cycle.subSeries = function(x) {
	        if (!arguments.length) {
	            return subSeries;
	        }
	        subSeries = x;
	        return cycle;
	    };
	    cycle.barWidth = function(x) {
	        if (!arguments.length) {
	            return barWidth;
	        }
	        barWidth = d3.functor(x);
	        return cycle;
	    };

	    d3.rebind(cycle, dataJoin, 'key');

	    return cycle;

	}

	function candlestick() {

	    var decorate = noop,
	        base = ohlcBase();

	    var dataJoin = _dataJoin()
	        .selector('g.candlestick')
	        .element('g')
	        .attr('class', 'candlestick');

	    function containerTranslation(values) {
	        return 'translate(' + values.x + ', ' + values.yHigh + ')';
	    }

	    var candlestick = function(selection) {

	        selection.each(function(data, index) {

	            var filteredData = data.filter(base.defined);

	            var g = dataJoin(this, filteredData);

	            g.enter()
	                .attr('transform', function(d, i) {
	                    return containerTranslation(base.values(d, i)) + ' scale(1e-6, 1)';
	                })
	                .append('path');

	            var pathGenerator = candlestickSvg()
	                    .width(base.width(filteredData));

	            g.each(function(d, i) {

	                var values = base.values(d, i);

	                var graph = d3.transition(d3.select(this))
	                    .attr({
	                        'class': 'candlestick ' + values.direction,
	                        'transform': function() { return containerTranslation(values) + ' scale(1)'; }
	                    });

	                pathGenerator.x(d3.functor(0))
	                    .open(function() { return values.yOpen - values.yHigh; })
	                    .high(function() { return values.yHigh - values.yHigh; })
	                    .low(function() { return values.yLow - values.yHigh; })
	                    .close(function() { return values.yClose - values.yHigh; });

	                graph.select('path')
	                    .attr('d', pathGenerator([d]));
	            });

	            decorate(g, data, index);
	        });
	    };

	    candlestick.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return candlestick;
	    };

	    d3.rebind(candlestick, dataJoin, 'key');
	    rebindAll(candlestick, base);

	    return candlestick;

	}

	// Adapts a fc.svg.axis for use as a series (i.e. accepts xScale/yScale). Only required when
	// you want an axis to appear in the middle of a chart e.g. as part of a cycle plot. Otherwise
	// prefer using the fc.svg.axis directly.
	function axis() {

	    var axis = axisSvg(),
	        baseline = d3.functor(0),
	        decorate = noop,
	        xScale = d3.time.scale(),
	        yScale = d3.scale.linear();

	    var dataJoin = _dataJoin()
	        .selector('g.axis-adapter')
	        .element('g')
	        .attr({'class': 'axis axis-adapter'});

	    var axisAdapter = function(selection) {

	        selection.each(function(data, index) {

	            var g = dataJoin(this, [data]);

	            var translation;
	            switch (axisAdapter.orient()) {
	            case 'top':
	            case 'bottom':
	                translation = 'translate(0,' + yScale(baseline(data)) + ')';
	                axis.scale(xScale);
	                break;

	            case 'left':
	            case 'right':
	                translation = 'translate(' + xScale(baseline(data)) + ',0)';
	                axis.scale(yScale);
	                break;

	            default:
	                throw new Error('Invalid orientation');
	            }

	            g.enter().attr('transform', translation);
	            g.attr('transform', translation);

	            g.call(axis);

	            decorate(g, data, index);
	        });
	    };

	    axisAdapter.baseline = function(x) {
	        if (!arguments.length) {
	            return baseline;
	        }
	        baseline = d3.functor(x);
	        return axisAdapter;
	    };
	    axisAdapter.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return axisAdapter;
	    };
	    axisAdapter.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return axisAdapter;
	    };
	    axisAdapter.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return axisAdapter;
	    };

	    return d3.rebind(axisAdapter, axis, 'orient', 'ticks', 'tickValues', 'tickSize',
	        'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat');
	}

	var series = {
	    area: _area,
	    axis: axis,
	    bar: _bar,
	    candlestick: candlestick,
	    cycle: cycle,
	    line: _line,
	    multi: _multi,
	    ohlc: ohlc,
	    point: point,
	    stacked: stacked,
	    groupedBar: groupedBar,
	    xyBase: xyBase,
	    ohlcBase: ohlcBase,
	    errorBar: errorBar,
	    waterfall: waterfall,
	    algorithm: algorithm$1
	};

	function identity$1() {

	    var identity$$ = {};

	    identity$$.distance = function(startDate, endDate) {
	        return endDate.getTime() - startDate.getTime();
	    };

	    identity$$.offset = function(startDate, ms) {
	        return new Date(startDate.getTime() + ms);
	    };

	    identity$$.clampUp = identity;

	    identity$$.clampDown = identity;

	    identity$$.copy = function() { return identity$$; };

	    return identity$$;
	}

	// obtains the ticks from the given scale, transforming the result to ensure
	// it does not include any discontinuities
	function tickTransformer(ticks, discontinuityProvider, domain) {
	    var clampedTicks = ticks.map(function(tick, index) {
	        if (index < ticks.length - 1) {
	            return discontinuityProvider.clampUp(tick);
	        } else {
	            var clampedTick = discontinuityProvider.clampUp(tick);
	            return clampedTick < domain[1] ?
	                clampedTick : discontinuityProvider.clampDown(tick);
	        }
	    });
	    var uniqueTicks = clampedTicks.reduce(function(arr, tick) {
	        if (arr.filter(function(f) { return f.getTime() === tick.getTime(); }).length === 0) {
	            arr.push(tick);
	        }
	        return arr;
	    }, []);
	    return uniqueTicks;
	}

	/**
	* The `fc.scale.dateTime` scale renders a discontinuous date time scale, i.e. a time scale that incorporates gaps.
	* As an example, you can use this scale to render a chart where the weekends are skipped.
	*
	* @type {object}
	* @memberof fc.scale
	* @class fc.scale.dateTime
	*/
	function dateTimeScale(adaptedScale, discontinuityProvider) {

	    if (!arguments.length) {
	        adaptedScale = d3.time.scale();
	        discontinuityProvider = identity$1();
	    }

	    function scale(date) {
	        var domain = adaptedScale.domain();
	        var range = adaptedScale.range();

	        // The discontinuityProvider is responsible for determine the distance between two points
	        // along a scale that has discontinuities (i.e. sections that have been removed).
	        // the scale for the given point 'x' is calculated as the ratio of the discontinuous distance
	        // over the domain of this axis, versus the discontinuous distance to 'x'
	        var totalDomainDistance = discontinuityProvider.distance(domain[0], domain[1]);
	        var distanceToX = discontinuityProvider.distance(domain[0], date);
	        var ratioToX = distanceToX / totalDomainDistance;
	        var scaledByRange = ratioToX * (range[1] - range[0]) + range[0];
	        return scaledByRange;
	    }

	    scale.invert = function(x) {
	        var domain = adaptedScale.domain();
	        var range = adaptedScale.range();

	        var ratioToX = (x - range[0]) / (range[1] - range[0]);
	        var totalDomainDistance = discontinuityProvider.distance(domain[0], domain[1]);
	        var distanceToX = ratioToX * totalDomainDistance;
	        return discontinuityProvider.offset(domain[0], distanceToX);
	    };

	    scale.domain = function(x) {
	        if (!arguments.length) {
	            return adaptedScale.domain();
	        }
	        // clamp the upper and lower domain values to ensure they
	        // do not fall within a discontinuity
	        var domainLower = discontinuityProvider.clampUp(x[0]);
	        var domainUpper = discontinuityProvider.clampDown(x[1]);
	        adaptedScale.domain([domainLower, domainUpper]);
	        return scale;
	    };

	    scale.nice = function() {
	        adaptedScale.nice();
	        var domain = adaptedScale.domain();
	        var domainLower = discontinuityProvider.clampUp(domain[0]);
	        var domainUpper = discontinuityProvider.clampDown(domain[1]);
	        adaptedScale.domain([domainLower, domainUpper]);
	        return scale;
	    };

	    scale.ticks = function() {
	        var ticks = adaptedScale.ticks.apply(this, arguments);
	        return tickTransformer(ticks, discontinuityProvider, scale.domain());
	    };

	    scale.copy = function() {
	        return dateTimeScale(adaptedScale.copy(), discontinuityProvider.copy());
	    };

	    scale.discontinuityProvider = function(x) {
	        if (!arguments.length) {
	            return discontinuityProvider;
	        }
	        discontinuityProvider = x;
	        return scale;
	    };

	    return d3.rebind(scale, adaptedScale, 'range', 'rangeRound', 'interpolate', 'clamp',
	        'tickFormat');
	}

	function exportedScale() {
	    return dateTimeScale();
	}
	exportedScale.tickTransformer = tickTransformer;

	function skipWeekends() {
	    var millisPerDay = 24 * 3600 * 1000;
	    var millisPerWorkWeek = millisPerDay * 5;
	    var millisPerWeek = millisPerDay * 7;

	    var skipWeekends = {};

	    function isWeekend(date) {
	        return date.getDay() === 0 || date.getDay() === 6;
	    }

	    skipWeekends.clampDown = function(date) {
	        if (date && isWeekend(date)) {
	            var daysToSubtract = date.getDay() === 0 ? 2 : 1;
	            // round the date up to midnight
	            var newDate = d3.time.day.ceil(date);
	            // then subtract the required number of days
	            return d3.time.day.offset(newDate, -daysToSubtract);
	        } else {
	            return date;
	        }
	    };

	    skipWeekends.clampUp = function(date) {
	        if (date && isWeekend(date)) {
	            var daysToAdd = date.getDay() === 0 ? 1 : 2;
	            // round the date down to midnight
	            var newDate = d3.time.day.floor(date);
	            // then add the required number of days
	            return d3.time.day.offset(newDate, daysToAdd);
	        } else {
	            return date;
	        }
	    };

	    // returns the number of included milliseconds (i.e. those which do not fall)
	    // within discontinuities, along this scale
	    skipWeekends.distance = function(startDate, endDate) {
	        startDate = skipWeekends.clampUp(startDate);
	        endDate = skipWeekends.clampDown(endDate);

	        // move the start date to the end of week boundary
	        var offsetStart = d3.time.saturday.ceil(startDate);
	        if (endDate < offsetStart) {
	            return endDate.getTime() - startDate.getTime();
	        }

	        var msAdded = offsetStart.getTime() - startDate.getTime();

	        // move the end date to the end of week boundary
	        var offsetEnd = d3.time.saturday.ceil(endDate);
	        var msRemoved = offsetEnd.getTime() - endDate.getTime();

	        // determine how many weeks there are between these two dates
	        var weeks = (offsetEnd.getTime() - offsetStart.getTime()) / millisPerWeek;

	        return weeks * millisPerWorkWeek + msAdded - msRemoved;
	    };

	    skipWeekends.offset = function(startDate, ms) {
	        var date = isWeekend(startDate) ? skipWeekends.clampUp(startDate) : startDate;
	        var remainingms = ms;

	        // move to the end of week boundary
	        var endOfWeek = d3.time.saturday.ceil(date);
	        remainingms -= (endOfWeek.getTime() - date.getTime());

	        // if the distance to the boundary is greater than the number of ms
	        // simply add the ms to the current date
	        if (remainingms < 0) {
	            return new Date(date.getTime() + ms);
	        }

	        // skip the weekend
	        date = d3.time.day.offset(endOfWeek, 2);

	        // add all of the complete weeks to the date
	        var completeWeeks = Math.floor(remainingms / millisPerWorkWeek);
	        date = d3.time.day.offset(date, completeWeeks * 7);
	        remainingms -= completeWeeks * millisPerWorkWeek;

	        // add the remaining time
	        date = new Date(date.getTime() + remainingms);
	        return date;
	    };

	    skipWeekends.copy = function() { return skipWeekends; };

	    return skipWeekends;
	}

	var scale = {
	    discontinuity: {
	        identity: identity$1,
	        skipWeekends: skipWeekends
	    },
	    dateTime: exportedScale
	};

	function elderRay() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        xValue = function(d) { return d.date; },
	        root = function(d) { return d.elderRay; },
	        bullBar = _bar(),
	        bearBar = _bar(),
	        bullBarTop = _bar(),
	        bearBarTop = _bar(),
	        multi = _multi(),
	        decorate = noop;

	    var elderRay = function(selection) {

	        function isTop(input, comparison) {
	            // The values share parity and the input is smaller than the comparison
	            return (input * comparison > 0 && Math.abs(input) < Math.abs(comparison));
	        }

	        bullBar
	            .xValue(xValue)
	            .yValue(function(d, i) {
	                return isTop(root(d).bullPower, root(d).bearPower) ? undefined : root(d).bullPower;
	            });

	        bearBar
	            .xValue(xValue)
	            .yValue(function(d, i) {
	                return isTop(root(d).bearPower, root(d).bullPower) ? undefined : root(d).bearPower;
	            });

	        bullBarTop
	            .xValue(xValue)
	            .yValue(function(d, i) {
	                return isTop(root(d).bullPower, root(d).bearPower) ? root(d).bullPower : undefined;
	            });

	        bearBarTop
	            .xValue(xValue)
	            .yValue(function(d, i) {
	                return isTop(root(d).bearPower, root(d).bullPower) ? root(d).bearPower : undefined;
	            });

	        multi
	            .xScale(xScale)
	            .yScale(yScale)
	            .series([bullBar, bearBar, bullBarTop, bearBarTop])
	            .decorate(function(g, data, index) {
	                g.enter()
	                    .attr('class', function(d, i) {
	                        return 'multi ' + ['bull', 'bear', 'bull top', 'bear top'][i];
	                    });
	                decorate(g, data, index);
	            });

	        selection.call(multi);
	    };

	    elderRay.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return elderRay;
	    };
	    elderRay.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = x;
	        return elderRay;
	    };
	    elderRay.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return elderRay;
	    };
	    elderRay.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return elderRay;
	    };

	    return elderRay;
	}

	function envelope() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        yValue = function(d, i) { return d.close; },
	        xValue = function(d, i) { return d.date; },
	        root = function(d) { return d.envelope; },
	        decorate = noop;

	    var area = _area()
	        .y0Value(function(d, i) {
	            return root(d).upper;
	        })
	        .y1Value(function(d, i) {
	            return root(d).lower;
	        });

	    var upperLine = _line()
	        .yValue(function(d, i) {
	            return root(d).upper;
	        });

	    var lowerLine = _line()
	        .yValue(function(d, i) {
	            return root(d).lower;
	        });

	    var envelope = function(selection) {

	        var multi = _multi()
	            .xScale(xScale)
	            .yScale(yScale)
	            .series([area, upperLine, lowerLine])
	            .decorate(function(g, data, index) {
	                g.enter()
	                    .attr('class', function(d, i) {
	                        return 'multi envelope ' + ['area', 'upper', 'lower'][i];
	                    });
	                decorate(g, data, index);
	            });

	        area.xValue(xValue);
	        upperLine.xValue(xValue);
	        lowerLine.xValue(xValue);

	        selection.call(multi);
	    };

	    envelope.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return envelope;
	    };
	    envelope.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return envelope;
	    };
	    envelope.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = x;
	        return envelope;
	    };
	    envelope.yValue = function(x) {
	        if (!arguments.length) {
	            return yValue;
	        }
	        yValue = x;
	        return envelope;
	    };
	    envelope.root = function(x) {
	        if (!arguments.length) {
	            return root;
	        }
	        root = x;
	        return envelope;
	    };
	    envelope.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return envelope;
	    };

	    return envelope;
	}

	function forceIndex() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        multiSeries = _multi(),
	        decorate = noop;

	    var annotations = annotationLine();

	    var forceLine = _line()
	        .yValue(function(d, i) {
	            return d.force;
	        });

	    var force = function(selection) {

	        multiSeries.xScale(xScale)
	            .yScale(yScale)
	            .series([annotations, forceLine])
	            .mapping(function(series) {
	                if (series === annotations) {
	                    return [
	                        0
	                    ];
	                }
	                return this;
	            })
	            .decorate(function(g, data, index) {
	                g.enter()
	                    .attr('class', function(d, i) {
	                        return 'multi ' + ['annotations', 'indicator'][i];
	                    });
	                decorate(g, data, index);
	            });

	        selection.call(multiSeries);
	    };

	    force.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        annotations.xScale(x);
	        return force;
	    };
	    force.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        annotations.yScale(x);
	        return force;
	    };
	    force.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return force;
	    };

	    d3.rebind(force, forceLine, 'yValue', 'xValue');

	    return force;
	}

	function stochasticOscillator() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        upperValue = 80,
	        lowerValue = 20,
	        multi = _multi(),
	        decorate = noop;

	    var annotations = annotationLine();
	    var dLine = _line()
	        .yValue(function(d, i) {
	            return d.stochastic.d;
	        });

	    var kLine = _line()
	        .yValue(function(d, i) {
	            return d.stochastic.k;
	        });

	    var stochastic = function(selection) {

	        multi.xScale(xScale)
	            .yScale(yScale)
	            .series([annotations, dLine, kLine])
	            .mapping(function(series) {
	                if (series === annotations) {
	                    return [
	                        upperValue,
	                        lowerValue
	                    ];
	                }
	                return this;
	            })
	            .decorate(function(g, data, index) {
	                g.enter()
	                    .attr('class', function(d, i) {
	                        return 'multi stochastic ' + ['annotations', 'stochastic-d', 'stochastic-k'][i];
	                    });
	                decorate(g, data, index);
	            });

	        selection.call(multi);
	    };

	    stochastic.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return stochastic;
	    };
	    stochastic.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return stochastic;
	    };
	    stochastic.upperValue = function(x) {
	        if (!arguments.length) {
	            return upperValue;
	        }
	        upperValue = x;
	        return stochastic;
	    };
	    stochastic.lowerValue = function(x) {
	        if (!arguments.length) {
	            return lowerValue;
	        }
	        lowerValue = x;
	        return stochastic;
	    };
	    stochastic.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return stochastic;
	    };

	    d3.rebind(stochastic, dLine, 'yDValue', 'xDValue');

	    d3.rebind(stochastic, kLine, 'yKValue', 'xKValue');

	    return stochastic;
	}

	function relativeStrengthIndex() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        upperValue = 70,
	        lowerValue = 30,
	        multiSeries = _multi(),
	        decorate = noop;

	    var annotations = annotationLine();
	    var rsiLine = _line()
	        .yValue(function(d, i) { return d.rsi; });

	    var rsi = function(selection) {

	        multiSeries.xScale(xScale)
	            .yScale(yScale)
	            .series([rsiLine, annotations])
	            .mapping(function(series) {
	                if (series === annotations) {
	                    return [
	                        upperValue,
	                        50,
	                        lowerValue
	                    ];
	                }
	                return this;
	            })
	            .decorate(function(g, data, index) {
	                g.enter()
	                    .attr('class', function(d, i) {
	                        return 'multi rsi ' + ['indicator', 'annotations'][i];
	                    });
	                decorate(g, data, index);
	            });

	        selection.call(multiSeries);
	    };

	    rsi.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return rsi;
	    };
	    rsi.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return rsi;
	    };
	    rsi.upperValue = function(x) {
	        if (!arguments.length) {
	            return upperValue;
	        }
	        upperValue = x;
	        return rsi;
	    };
	    rsi.lowerValue = function(x) {
	        if (!arguments.length) {
	            return lowerValue;
	        }
	        lowerValue = x;
	        return rsi;
	    };
	    rsi.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return rsi;
	    };

	    d3.rebind(rsi, rsiLine, 'yValue', 'xValue');

	    return rsi;
	}

	function macd$1() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        xValue = function(d) { return d.date; },
	        root = function(d) { return d.macd; },
	        macdLine = _line(),
	        signalLine = _line(),
	        divergenceBar = _bar(),
	        multiSeries = _multi(),
	        decorate = noop;

	    var macd = function(selection) {

	        macdLine.xValue(xValue)
	            .yValue(function(d, i) { return root(d).macd; });

	        signalLine.xValue(xValue)
	            .yValue(function(d, i) { return root(d).signal; });

	        divergenceBar.xValue(xValue)
	            .yValue(function(d, i) { return root(d).divergence; });

	        multiSeries.xScale(xScale)
	            .yScale(yScale)
	            .series([divergenceBar, macdLine, signalLine])
	            .decorate(function(g, data, index) {
	                g.enter()
	                    .attr('class', function(d, i) {
	                        return 'multi ' + ['macd-divergence', 'macd', 'macd-signal'][i];
	                    });
	                decorate(g, data, index);
	            });

	        selection.call(multiSeries);
	    };

	    macd.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return macd;
	    };
	    macd.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = x;
	        return macd;
	    };
	    macd.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return macd;
	    };
	    macd.root = function(x) {
	        if (!arguments.length) {
	            return root;
	        }
	        root = x;
	        return macd;
	    };
	    macd.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return macd;
	    };

	    return macd;
	}

	function bollingerBands() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        yValue = function(d, i) { return d.close; },
	        xValue = function(d, i) { return d.date; },
	        root = function(d) { return d.bollingerBands; },
	        decorate = noop;

	    var area = _area()
	        .y0Value(function(d, i) {
	            return root(d).upper;
	        })
	        .y1Value(function(d, i) {
	            return root(d).lower;
	        });

	    var upperLine = _line()
	        .yValue(function(d, i) {
	            return root(d).upper;
	        });

	    var averageLine = _line()
	        .yValue(function(d, i) {
	            return root(d).average;
	        });

	    var lowerLine = _line()
	        .yValue(function(d, i) {
	            return root(d).lower;
	        });

	    var bollingerBands = function(selection) {

	        var multi = _multi()
	            .xScale(xScale)
	            .yScale(yScale)
	            .series([area, upperLine, lowerLine, averageLine])
	            .decorate(function(g, data, index) {
	                g.enter()
	                    .attr('class', function(d, i) {
	                        return 'multi bollinger ' + ['area', 'upper', 'lower', 'average'][i];
	                    });
	                decorate(g, data, index);
	            });

	        area.xValue(xValue);
	        upperLine.xValue(xValue);
	        averageLine.xValue(xValue);
	        lowerLine.xValue(xValue);

	        selection.call(multi);
	    };

	    bollingerBands.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return bollingerBands;
	    };
	    bollingerBands.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return bollingerBands;
	    };
	    bollingerBands.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = x;
	        return bollingerBands;
	    };
	    bollingerBands.yValue = function(x) {
	        if (!arguments.length) {
	            return yValue;
	        }
	        yValue = x;
	        return bollingerBands;
	    };
	    bollingerBands.root = function(x) {
	        if (!arguments.length) {
	            return root;
	        }
	        root = x;
	        return bollingerBands;
	    };
	    bollingerBands.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return bollingerBands;
	    };

	    return bollingerBands;
	}

	var renderer = {
	    bollingerBands: bollingerBands,
	    macd: macd$1,
	    relativeStrengthIndex: relativeStrengthIndex,
	    stochasticOscillator: stochasticOscillator,
	    forceIndex: forceIndex,
	    envelope: envelope,
	    elderRay: elderRay
	};

	function exponentialMovingAverage$1() {

	    var windowSize = 9,
	        value = identity;

	    var exponentialMovingAverage = function(data) {

	        var alpha = 2 / (windowSize + 1);
	        var previous;
	        var initialAccumulator = 0;

	        return data.map(function(d, i) {
	            if (i < windowSize - 1) {
	                initialAccumulator += value(d, i);
	                return undefined;
	            } else if (i === windowSize - 1) {
	                initialAccumulator += value(d, i);
	                var initialValue = initialAccumulator / windowSize;
	                previous = initialValue;
	                return initialValue;
	            } else {
	                var nextValue = value(d, i) * alpha + (1 - alpha) * previous;
	                previous = nextValue;
	                return nextValue;
	            }
	        });
	    };

	    exponentialMovingAverage.windowSize = function(x) {
	        if (!arguments.length) {
	            return windowSize;
	        }
	        windowSize = x;
	        return exponentialMovingAverage;
	    };

	    exponentialMovingAverage.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }
	        value = x;
	        return exponentialMovingAverage;
	    };

	    return exponentialMovingAverage;
	}

	function elderRay$2() {

	    var value = identity;

	    var highValue = function(d, i) { return d.high; },
	        lowValue = function(d, i) { return d.low; };

	    var emaComputer = exponentialMovingAverage$1()
	        .windowSize(13);

	    var elderRay = function(data) {

	        emaComputer.value(value);
	        var ema = emaComputer(data);

	        var indicator = d3.zip(data, ema)
	            .map(function(d) {
	                return {
	                    bullPower: d[1] ? highValue(d[0]) - d[1] : undefined,
	                    bearPower: d[1] ? lowValue(d[0]) - d[1] : undefined
	                };
	            });

	        return indicator;
	    };

	    elderRay.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }
	        value = x;
	        return elderRay;
	    };

	    elderRay.highValue = function(x) {
	        if (!arguments.length) {
	            return highValue;
	        }
	        highValue = x;
	        return elderRay;
	    };
	    elderRay.lowValue = function(x) {
	        if (!arguments.length) {
	            return highValue;
	        }
	        lowValue = x;
	        return elderRay;
	    };

	    rebind(elderRay, emaComputer, {
	        period: 'windowSize'
	    });

	    return elderRay;
	}

	function slidingWindow() {

	    var undefinedValue = d3.functor(undefined),
	        windowSize = d3.functor(10),
	        accumulator = noop,
	        value = identity;

	    var slidingWindow = function(data) {
	        var size = windowSize.apply(this, arguments);
	        var windowData = data.slice(0, size).map(value);
	        return data.map(function(d, i) {
	            if (i < size - 1) {
	                return undefinedValue(d, i);
	            }
	            if (i >= size) {
	                // Treat windowData as FIFO rolling buffer
	                windowData.shift();
	                windowData.push(value(d, i));
	            }
	            return accumulator(windowData);
	        });
	    };

	    slidingWindow.undefinedValue = function(x) {
	        if (!arguments.length) {
	            return undefinedValue;
	        }
	        undefinedValue = d3.functor(x);
	        return slidingWindow;
	    };
	    slidingWindow.windowSize = function(x) {
	        if (!arguments.length) {
	            return windowSize;
	        }
	        windowSize = d3.functor(x);
	        return slidingWindow;
	    };
	    slidingWindow.accumulator = function(x) {
	        if (!arguments.length) {
	            return accumulator;
	        }
	        accumulator = x;
	        return slidingWindow;
	    };
	    slidingWindow.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }
	        value = x;
	        return slidingWindow;
	    };

	    return slidingWindow;
	}

	// applies an algorithm to an array, merging the result back into
	// the source array using the given merge function.
	function merge() {

	    var merge = noop,
	        algorithm = slidingWindow();

	    var mergeCompute = function(data) {
	        return d3.zip(data, algorithm(data))
	            .forEach(function(tuple) {
	                merge(tuple[0], tuple[1]);
	            });
	    };

	    mergeCompute.algorithm = function(x) {
	        if (!arguments.length) {
	            return algorithm;
	        }
	        algorithm = x;
	        return mergeCompute;
	    };

	    mergeCompute.merge = function(x) {
	        if (!arguments.length) {
	            return merge;
	        }
	        merge = x;
	        return mergeCompute;
	    };

	    return mergeCompute;
	}

	function elderRay$1() {

	    var elderRayAlgorithm = elderRay$2()
	        .value(function(d) { return d.close; });

	    var mergedAlgorithm = merge()
	            .algorithm(elderRayAlgorithm)
	            .merge(function(datum, indicator) { datum.elderRay = indicator; });

	    var elderRay = function(data) {
	        return mergedAlgorithm(data);
	    };

	    d3.rebind(elderRay, mergedAlgorithm, 'merge');
	    d3.rebind(elderRay, elderRayAlgorithm, 'highValue', 'lowValue', 'period', 'value');

	    return elderRay;
	}

	function envelope$2() {

	    var factor = 0.1,
	        value = identity;

	    var envelope = function(data) {
	        return data.map(function(s) {
	            return {
	                lower: value(s) * (1.0 - factor),
	                upper: value(s) * (1.0 + factor)
	            };
	        });
	    };

	    envelope.factor = function(x) {
	        if (!arguments.length) {
	            return factor;
	        }
	        factor = x;
	        return envelope;
	    };

	    envelope.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }
	        value = d3.functor(x);
	        return envelope;
	    };

	    return envelope;
	}

	// Indicator algorithms are not designed to accomodate leading 'undefined' value.
	// This adapter adds that functionality by adding a corresponding number
	// of 'undefined' values to the output.
	function undefinedInputAdapter() {

	    var algorithm = slidingWindow()
	        .accumulator(d3.mean);
	    var undefinedValue = d3.functor(undefined),
	        defined = function(value) {
	            return algorithm.value()(value) == null;
	        };

	    function undefinedArrayOfLength(length) {
	        return Array.apply(null, new Array(length)).map(undefinedValue);
	    }

	    var undefinedInputAdapter = function(data) {
	        var undefinedCount = 0;
	        while (defined(data[undefinedCount]) && undefinedCount < data.length) {
	            undefinedCount ++;
	        }

	        var nonUndefinedData = data.slice(undefinedCount);

	        return undefinedArrayOfLength(undefinedCount).concat(algorithm(nonUndefinedData));
	    };

	    undefinedInputAdapter.algorithm = function(x) {
	        if (!arguments.length) {
	            return algorithm;
	        }
	        algorithm = x;
	        return undefinedInputAdapter;
	    };
	    undefinedInputAdapter.undefinedValue = function(x) {
	        if (!arguments.length) {
	            return undefinedValue;
	        }
	        undefinedValue = d3.functor(x);
	        return undefinedInputAdapter;
	    };
	    undefinedInputAdapter.defined = function(x) {
	        if (!arguments.length) {
	            return defined;
	        }
	        defined = x;
	        return undefinedInputAdapter;
	    };

	    return undefinedInputAdapter;
	}

	function envelope$1() {

	    var envelopeAlgorithm = envelope$2();

	    var adaptedEnvelope = undefinedInputAdapter()
	        .undefinedValue({
	            lower: undefined,
	            upper: undefined
	        })
	        .algorithm(envelopeAlgorithm);

	    var mergedAlgorithm = merge()
	            .algorithm(adaptedEnvelope)
	            .merge(function(datum, env) { datum.envelope = env; });

	    var envelope = function(data) {
	        return mergedAlgorithm(data);
	    };

	    envelope.root = function(d) {
	        return d.envelope;
	    };

	    d3.rebind(envelope, mergedAlgorithm, 'merge');
	    d3.rebind(envelope, envelopeAlgorithm, 'value', 'factor');

	    return envelope;
	}

	function forceIndex$2() {

	    var volumeValue = function(d, i) { return d.volume; },
	        closeValue = function(d, i) { return d.close; };

	    var slidingWindow$$ = slidingWindow()
	        .windowSize(2)
	        .accumulator(function(values) {
	            return (closeValue(values[1]) - closeValue(values[0])) * volumeValue(values[1]);
	        });

	    var force = function(data) {
	        return slidingWindow$$(data);
	    };

	    force.volumeValue = function(x) {
	        if (!arguments.length) {
	            return volumeValue;
	        }
	        volumeValue = x;
	        return force;
	    };
	    force.closeValue = function(x) {
	        if (!arguments.length) {
	            return closeValue;
	        }
	        closeValue = x;
	        return force;
	    };

	    d3.rebind(force, slidingWindow$$, 'windowSize');

	    return force;
	}

	function forceIndex$1() {

	    var force = forceIndex$2();

	    var mergedAlgorithm = merge()
	        .algorithm(force)
	        .merge(function(datum, indicator) {
	            datum.force = indicator;
	        });

	    var forceIndex = function(data) {
	        return mergedAlgorithm(data);
	    };

	    d3.rebind(forceIndex, mergedAlgorithm, 'merge');
	    d3.rebind(forceIndex, force, 'windowSize', 'volumeValue', 'closeValue');

	    return forceIndex;
	}

	function stochasticOscillator$2() {

	    var closeValue = function(d, i) { return d.close; },
	        highValue = function(d, i) { return d.high; },
	        lowValue = function(d, i) { return d.low; };

	    var kWindow = slidingWindow()
	        .windowSize(5)
	        .accumulator(function(values) {
	            var maxHigh = d3.max(values, highValue);
	            var minLow = d3.min(values, lowValue);
	            return 100 * (closeValue(values[values.length - 1]) - minLow) / (maxHigh - minLow);
	        });

	    var dWindow = slidingWindow()
	        .windowSize(3)
	        .accumulator(function(values) {
	            if (values[0] === undefined) {
	                return undefined;
	            }
	            return d3.mean(values);
	        });

	    var stochastic = function(data) {
	        var kValues = kWindow(data);
	        var dValues = dWindow(kValues);
	        return kValues.map(function(k, i) {
	            var d = dValues[i];
	            return { k: k, d: d };
	        });
	    };

	    stochastic.closeValue = function(x) {
	        if (!arguments.length) {
	            return closeValue;
	        }
	        closeValue = x;
	        return stochastic;
	    };
	    stochastic.highValue = function(x) {
	        if (!arguments.length) {
	            return highValue;
	        }
	        highValue = x;
	        return stochastic;
	    };
	    stochastic.lowValue = function(x) {
	        if (!arguments.length) {
	            return highValue;
	        }
	        lowValue = x;
	        return stochastic;
	    };

	    rebind(stochastic, kWindow, {
	        kWindowSize: 'windowSize'
	    });

	    rebind(stochastic, dWindow, {
	        dWindowSize: 'windowSize'
	    });

	    return stochastic;
	}

	function stochasticOscillator$1() {

	    var stoc = stochasticOscillator$2();

	    var mergedAlgorithm = merge()
	            .algorithm(stoc)
	            .merge(function(datum, indicator) { datum.stochastic = indicator; });

	    var stochasticOscillator = function(data) {
	        return mergedAlgorithm(data);
	    };

	    d3.rebind(stochasticOscillator, mergedAlgorithm, 'merge');
	    d3.rebind(stochasticOscillator, stoc, 'kWindowSize', 'dWindowSize', 'lowValue', 'closeValue', 'highValue');

	    return stochasticOscillator;
	}

	function relativeStrengthIndex$2() {

	    var closeValue = function(d, i) { return d.close; },
	        wildersSmoothing = function(values, prevAvg) {
	            var result = prevAvg + ((values[values.length - 1] - prevAvg) / values.length);
	            return result;
	        },
	        sum = function(a, b) { return a + b; },
	        prevClose,
	        prevDownChangesAvg,
	        prevUpChangesAvg;

	    var slidingWindow$$ = slidingWindow()
	        .windowSize(14)
	        .accumulator(function(values) {
	            var closes = values.map(closeValue);

	            if (!prevClose) {
	                prevClose = closes[0];
	                return undefined;
	            }

	            var downChanges = [];
	            var upChanges = [];

	            closes.forEach(function(close) {
	                var downChange = prevClose > close ? prevClose - close : 0;
	                var upChange = prevClose < close ? close - prevClose : 0;

	                downChanges.push(downChange);
	                upChanges.push(upChange);

	                prevClose = close;
	            });

	            var downChangesAvg = prevDownChangesAvg ? wildersSmoothing(downChanges, prevDownChangesAvg) :
	                downChanges.reduce(sum) / closes.length;

	            var upChangesAvg = prevUpChangesAvg ? wildersSmoothing(upChanges, prevUpChangesAvg) :
	                upChanges.reduce(sum) / closes.length;

	            prevDownChangesAvg = downChangesAvg;
	            prevUpChangesAvg = upChangesAvg;

	            var rs = upChangesAvg / downChangesAvg;
	            return 100 - (100 / (1 + rs));
	        });

	    var rsi = function(data) {
	        return slidingWindow$$(data);
	    };

	    rsi.closeValue = function(x) {
	        if (!arguments.length) {
	            return closeValue;
	        }
	        closeValue = x;
	        return rsi;
	    };

	    d3.rebind(rsi, slidingWindow$$, 'windowSize');

	    return rsi;
	}

	function relativeStrengthIndex$1() {

	    var rsi = relativeStrengthIndex$2();

	    var mergedAlgorithm = merge()
	            .algorithm(rsi)
	            .merge(function(datum, indicator) { datum.rsi = indicator; });

	    var relativeStrengthIndex = function(data) {
	        return mergedAlgorithm(data);
	    };

	    d3.rebind(relativeStrengthIndex, mergedAlgorithm, 'merge');
	    d3.rebind(relativeStrengthIndex, rsi, 'windowSize', 'closeValue');

	    return relativeStrengthIndex;
	}

	function movingAverage() {

	    var ma = slidingWindow()
	            .accumulator(d3.mean)
	            .value(function(d) { return d.close; });

	    var mergedAlgorithm = merge()
	            .algorithm(ma)
	            .merge(function(datum, indicator) { datum.movingAverage = indicator; });

	    var movingAverage = function(data) {
	        return mergedAlgorithm(data);
	    };

	    d3.rebind(movingAverage, mergedAlgorithm, 'merge');
	    d3.rebind(movingAverage, ma, 'windowSize', 'undefinedValue', 'value');

	    return movingAverage;
	}

	function macd$3() {

	    var value = identity;

	    var fastEMA = exponentialMovingAverage$1()
	        .windowSize(12);
	    var slowEMA = exponentialMovingAverage$1()
	        .windowSize(29);
	    var signalEMA = exponentialMovingAverage$1()
	        .windowSize(9);
	    var adaptedSignalEMA = undefinedInputAdapter()
	        .algorithm(signalEMA);

	    var macd = function(data) {

	        fastEMA.value(value);
	        slowEMA.value(value);

	        var diff = d3.zip(fastEMA(data), slowEMA(data))
	            .map(function(d) {
	                if (d[0] !== undefined && d[1] !== undefined) {
	                    return d[0] - d[1];
	                } else {
	                    return undefined;
	                }
	            });

	        var averageDiff = adaptedSignalEMA(diff);

	        return d3.zip(diff, averageDiff)
	            .map(function(d) {
	                return {
	                    macd: d[0],
	                    signal: d[1],
	                    divergence: d[0] !== undefined && d[1] !== undefined ? d[0] - d[1] : undefined
	                };
	            });
	    };

	    macd.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }
	        value = x;
	        return macd;
	    };

	    rebind(macd, fastEMA, {
	        fastPeriod: 'windowSize'
	    });

	    rebind(macd, slowEMA, {
	        slowPeriod: 'windowSize'
	    });

	    rebind(macd, signalEMA, {
	        signalPeriod: 'windowSize'
	    });

	    return macd;
	}

	function macd$2() {

	    var macdAlgorithm = macd$3()
	        .value(function(d) { return d.close; });

	    var mergedAlgorithm = merge()
	            .algorithm(macdAlgorithm)
	            .merge(function(datum, indicator) { datum.macd = indicator; });

	    var macd = function(data) {
	        return mergedAlgorithm(data);
	    };

	    d3.rebind(macd, mergedAlgorithm, 'merge');
	    d3.rebind(macd, macdAlgorithm, 'fastPeriod', 'slowPeriod', 'signalPeriod', 'value');

	    return macd;
	}

	function exponentialMovingAverage() {

	    var ema = exponentialMovingAverage$1()
	            .value(function(d) { return d.close; });

	    var mergedAlgorithm = merge()
	            .algorithm(ema)
	            .merge(function(datum, indicator) { datum.exponentialMovingAverage = indicator; });

	    var exponentialMovingAverage = function(data) {
	        return mergedAlgorithm(data);
	    };

	    d3.rebind(exponentialMovingAverage, mergedAlgorithm, 'merge');
	    d3.rebind(exponentialMovingAverage, ema, 'windowSize', 'value');

	    return exponentialMovingAverage;
	}

	function percentageChange() {

	    var baseIndex = d3.functor(0),
	        value = identity;

	    var percentageChange = function(data) {

	        if (data.length === 0) {
	            return [];
	        }

	        var baseValue = value(data[baseIndex(data)]);

	        return data.map(function(d, i) {
	            return (value(d, i) - baseValue) / baseValue;
	        });
	    };

	    percentageChange.baseIndex = function(x) {
	        if (!arguments.length) {
	            return baseIndex;
	        }
	        baseIndex = d3.functor(x);
	        return percentageChange;
	    };
	    percentageChange.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }
	        value = x;
	        return percentageChange;
	    };

	    return percentageChange;
	}

	function bollingerBands$2() {

	    var multiplier = 2;

	    var slidingWindow$$ = slidingWindow()
	        .undefinedValue({
	            upper: undefined,
	            average: undefined,
	            lower: undefined
	        })
	        .accumulator(function(values) {
	            var avg = d3.mean(values);
	            var stdDev = d3.deviation(values);
	            return {
	                upper: avg + multiplier * stdDev,
	                average: avg,
	                lower: avg - multiplier * stdDev
	            };
	        });

	    var bollingerBands = function(data) {
	        return slidingWindow$$(data);
	    };

	    bollingerBands.multiplier = function(x) {
	        if (!arguments.length) {
	            return multiplier;
	        }
	        multiplier = x;
	        return bollingerBands;
	    };

	    d3.rebind(bollingerBands, slidingWindow$$, 'windowSize', 'value');

	    return bollingerBands;
	}

	var calculator = {
	    bollingerBands: bollingerBands$2,
	    exponentialMovingAverage: exponentialMovingAverage$1,
	    macd: macd$3,
	    percentageChange: percentageChange,
	    relativeStrengthIndex: relativeStrengthIndex$2,
	    stochasticOscillator: stochasticOscillator$2,
	    slidingWindow: slidingWindow,
	    undefinedInputAdapter: undefinedInputAdapter,
	    forceIndex: forceIndex$2,
	    envelope: envelope$2,
	    elderRay: elderRay$2
	};

	function bollingerBands$1() {

	    var bollingerAlgorithm = bollingerBands$2()
	        .value(function(d) { return d.close; });

	    var mergedAlgorithm = merge()
	            .algorithm(bollingerAlgorithm)
	            .merge(function(datum, indicator) { datum.bollingerBands = indicator; });

	    var bollingerBands = function(data) {
	        return mergedAlgorithm(data);
	    };

	    bollingerBands.root = function(d) {
	        return d.bollingerBands;
	    };

	    d3.rebind(bollingerBands, mergedAlgorithm, 'merge');
	    d3.rebind(bollingerBands, bollingerAlgorithm, 'windowSize', 'value', 'multiplier');

	    return bollingerBands;
	}

	var algorithm = {
	    bollingerBands: bollingerBands$1,
	    calculator: calculator,
	    exponentialMovingAverage: exponentialMovingAverage,
	    macd: macd$2,
	    merge: merge,
	    movingAverage: movingAverage,
	    relativeStrengthIndex: relativeStrengthIndex$1,
	    stochasticOscillator: stochasticOscillator$1,
	    forceIndex: forceIndex$1,
	    envelope: envelope$1,
	    elderRay: elderRay$1
	};

	var indicator = {
	    algorithm: algorithm,
	    renderer: renderer
	};

	function bucket() {

	    var bucketSize = 10;

	    var bucket = function(data) {
	        var numberOfBuckets = Math.ceil(data.length / bucketSize);

	        var buckets = [];
	        for (var i = 0; i < numberOfBuckets; i++) {
	            buckets.push(data.slice(i * bucketSize, (i + 1) * bucketSize));
	        }
	        return buckets;
	    };

	    bucket.bucketSize = function(x) {
	        if (!arguments.length) {
	            return bucketSize;
	        }

	        bucketSize = x;
	        return bucket;
	    };

	    return bucket;
	}

	function largestTriangleOneBucket() {

	    var dataBucketer = bucket(),
	        x = identity,
	        y = identity;

	    var largestTriangleOneBucket = function(data) {

	        if (dataBucketer.bucketSize() >= data.length) {
	            return data;
	        }

	        var pointAreas = calculateAreaOfPoints(data);
	        var pointAreaBuckets = dataBucketer(pointAreas);

	        var buckets = dataBucketer(data.slice(1, data.length - 1));

	        var subsampledData = buckets.map(function(thisBucket, i) {

	            var pointAreaBucket = pointAreaBuckets[i];
	            var maxArea = d3.max(pointAreaBucket);
	            var currentMaxIndex = pointAreaBucket.indexOf(maxArea);

	            return thisBucket[currentMaxIndex];
	        });

	        // First and last data points are their own buckets.
	        return [].concat(data[0], subsampledData, data[data.length - 1]);
	    };

	    function calculateAreaOfPoints(data) {

	        var xyData = data.map(function(point) {
	            return [x(point), y(point)];
	        });

	        var pointAreas = [];

	        for (var i = 1; i < xyData.length - 1; i++) {
	            var lastPoint = xyData[i - 1];
	            var thisPoint = xyData[i];
	            var nextPoint = xyData[i + 1];

	            var base = (lastPoint[0] - nextPoint[0]) * (thisPoint[1] - lastPoint[1]);
	            var height = (lastPoint[0] - thisPoint[0]) * (nextPoint[1] - lastPoint[1]);

	            var area = Math.abs(0.5 * base * height);

	            pointAreas.push(area);
	        }

	        return pointAreas;
	    }

	    d3.rebind(largestTriangleOneBucket, dataBucketer, 'bucketSize');

	    largestTriangleOneBucket.x = function(d) {
	        if (!arguments.length) {
	            return x;
	        }

	        x = d;

	        return largestTriangleOneBucket;
	    };

	    largestTriangleOneBucket.y = function(d) {
	        if (!arguments.length) {
	            return y;
	        }

	        y = d;

	        return largestTriangleOneBucket;
	    };

	    return largestTriangleOneBucket;
	}

	function largestTriangleThreeBucket() {

	    var x = identity,
	        y = identity,
	        dataBucketer = bucket();

	    var largestTriangleThreeBucket = function(data) {

	        if (dataBucketer.bucketSize() >= data.length) {
	            return data;
	        }

	        var buckets = dataBucketer(data.slice(1, data.length - 1));
	        var firstBucket = data[0];
	        var lastBucket = data[data.length - 1];

	        // Keep track of the last selected bucket info and all buckets
	        // (for the next bucket average)
	        var allBuckets = [].concat(firstBucket, buckets, lastBucket);

	        var lastSelectedX = x(firstBucket),
	            lastSelectedY = y(firstBucket);

	        var subsampledData = buckets.map(function(thisBucket, i) {

	            var highestArea = -Infinity;
	            var highestItem;
	            var nextAvgX = d3.mean(allBuckets[i + 1], x);
	            var nextAvgY = d3.mean(allBuckets[i + 1], y);

	            for (var j = 0; j < thisBucket.length; j++) {
	                var thisX = x(thisBucket[j]),
	                    thisY = y(thisBucket[j]);

	                var base = (lastSelectedX - nextAvgX) * (thisY - lastSelectedY);
	                var height = (lastSelectedX - thisX) * (nextAvgY - lastSelectedY);

	                var area = Math.abs(0.5 * base * height);

	                if (area > highestArea) {
	                    highestArea = area;
	                    highestItem = thisBucket[j];
	                }
	            }

	            lastSelectedX = x(highestItem);
	            lastSelectedY = y(highestItem);

	            return highestItem;
	        });

	        // First and last data points are their own buckets.
	        return [].concat(data[0], subsampledData, data[data.length - 1]);
	    };

	    d3.rebind(largestTriangleThreeBucket, dataBucketer, 'bucketSize');

	    largestTriangleThreeBucket.x = function(d) {
	        if (!arguments.length) {
	            return x;
	        }

	        x = d;

	        return largestTriangleThreeBucket;
	    };

	    largestTriangleThreeBucket.y = function(d) {
	        if (!arguments.length) {
	            return y;
	        }

	        y = d;

	        return largestTriangleThreeBucket;
	    };

	    return largestTriangleThreeBucket;
	}

	function modeMedian() {

	    var dataBucketer = bucket(),
	        value = identity;

	    var modeMedian = function(data) {

	        if (dataBucketer.bucketSize() > data.length) {
	            return data;
	        }

	        var minMax = d3.extent(data);
	        var buckets = dataBucketer(data.slice(1, data.length - 1));

	        var subsampledData = buckets.map(function(thisBucket, i) {

	            var frequencies = {};
	            var mostFrequent;
	            var mostFrequentIndex;
	            var singleMostFrequent = true;

	            for (var j = 0; j < thisBucket.length; j++) {
	                var item = value(thisBucket[j]);
	                if (item === minMax[0] || item === minMax[1]) {
	                    return thisBucket[j];
	                }

	                if (frequencies[item] === undefined) {
	                    frequencies[item] = 0;
	                }
	                frequencies[item]++;

	                if (frequencies[item] > frequencies[mostFrequent] || mostFrequent === undefined) {
	                    mostFrequent = item;
	                    mostFrequentIndex = j;
	                    singleMostFrequent = true;
	                } else if (frequencies[item] === frequencies[mostFrequent]) {
	                    singleMostFrequent = false;
	                }
	            }

	            if (singleMostFrequent) {
	                return thisBucket[mostFrequentIndex];
	            } else {
	                return thisBucket[Math.floor(thisBucket.length / 2)];
	            }
	        });

	        // First and last data points are their own buckets.
	        return [].concat(data[0], subsampledData, data[data.length - 1]);
	    };

	    modeMedian.bucketSize = function() {
	        dataBucketer.bucketSize.apply(this, arguments);
	        return modeMedian;
	    };

	    modeMedian.value = function(x) {
	        if (!arguments.length) {
	            return value;
	        }

	        value = x;

	        return modeMedian;
	    };

	    return modeMedian;
	}

	var sampler = {
	    modeMedian: modeMedian,
	    largestTriangleThreeBucket: largestTriangleThreeBucket,
	    largestTriangleOneBucket: largestTriangleOneBucket,
	    bucket: bucket
	};

	// the D3 CSV loader / parser converts each row into an object with property names
	// derived from the headings in the CSV. The spread component converts this into an
	// array of series; one per column (vertical spread), or one per row (horizontal spread).
	function spread() {

	    var xValueKey = '',
	        orient = 'vertical',
	        yValue = function(row, key) {
	            // D3 CSV returns all values as strings, this converts them to numbers
	            // by default.
	            return Number(row[key]);
	        };

	    function verticalSpread(data) {
	        var series = Object.keys(data[0])
	            .filter(function(key) {
	                return key !== xValueKey;
	            })
	            .map(function(key) {
	                var values = data.filter(function(row) {
	                    return row[key];
	                }).map(function(row) {
	                    return {
	                        x: row[xValueKey],
	                        y: yValue(row, key)
	                    };
	                });
	                return {
	                    key: key,
	                    values: values
	                };
	            });

	        return series;
	    }

	    function horizontalSpread(data) {

	        var series = data.map(function(row) {
	            var keys = Object.keys(row).filter(function(d) {
	                return d !== xValueKey;
	            });

	            return {
	                key: row[xValueKey],
	                values: keys.map(function(key) {
	                    return {
	                        x: key,
	                        y: yValue(row, key)
	                    };
	                })
	            };
	        });

	        return series;
	    }

	    var spread = function(data) {
	        return orient === 'vertical' ? verticalSpread(data) : horizontalSpread(data);
	    };

	    spread.xValueKey = function(x) {
	        if (!arguments.length) {
	            return xValueKey;
	        }
	        xValueKey = x;
	        return spread;
	    };

	    spread.yValue = function(x) {
	        if (!arguments.length) {
	            return yValue;
	        }
	        yValue = x;
	        return spread;
	    };

	    spread.orient = function(x) {
	        if (!arguments.length) {
	            return orient;
	        }
	        orient = x;
	        return spread;
	    };

	    return spread;
	}

	function walk() {
	    var period = 1,
	        steps = 20,
	        mu = 0.1,
	        sigma = 0.1;

	    var walk = function(initial) {
	        var randomNormal = d3.random.normal(),
	            timeStep = period / steps,
	            increments = new Array(steps + 1),
	            increment,
	            step;

	        // Compute step increments for the discretized GBM model.
	        for (step = 1; step < increments.length; step += 1) {
	            increment = randomNormal();
	            increment *= Math.sqrt(timeStep);
	            increment *= sigma;
	            increment += (mu - ((sigma * sigma) / 2)) * timeStep;
	            increments[step] = Math.exp(increment);
	        }
	        // Return the cumulative product of increments from initial value.
	        increments[0] = initial;
	        for (step = 1; step < increments.length; step += 1) {
	            increments[step] = increments[step - 1] * increments[step];
	        }
	        return increments;
	    };

	    walk.period = function(x) {
	        if (!arguments.length) {
	            return period;
	        }
	        period = x;
	        return walk;
	    };

	    walk.steps = function(x) {
	        if (!arguments.length) {
	            return steps;
	        }
	        steps = x;
	        return walk;
	    };

	    walk.mu = function(x) {
	        if (!arguments.length) {
	            return mu;
	        }
	        mu = x;
	        return walk;
	    };

	    walk.sigma = function(x) {
	        if (!arguments.length) {
	            return sigma;
	        }
	        sigma = x;
	        return walk;
	    };

	    return walk;
	}

	function financial() {

	    var mu = 0.1,
	        sigma = 0.1,
	        startPrice = 100,
	        startVolume = 100000,
	        startDate = new Date(),
	        stepsPerDay = 50,
	        volumeNoiseFactor = 0.3,
	        filter = function(d) { return true; };

	    var calculateOHLC = function(days, prices, volumes) {

	        var ohlcv = [],
	            daySteps,
	            currentStep = 0,
	            currentIntraStep = 0;

	        while (ohlcv.length < days) {
	            daySteps = prices.slice(currentIntraStep, currentIntraStep + stepsPerDay);
	            ohlcv.push({
	                date: new Date(startDate.getTime()),
	                open: daySteps[0],
	                high: Math.max.apply({}, daySteps),
	                low: Math.min.apply({}, daySteps),
	                close: daySteps[stepsPerDay - 1],
	                volume: volumes[currentStep]
	            });
	            currentIntraStep += stepsPerDay;
	            currentStep += 1;
	            startDate.setUTCDate(startDate.getUTCDate() + 1);
	        }
	        return ohlcv;
	    };

	    function calculateInterval(start, days) {
	        var millisecondsPerYear = 3.15569e10;

	        var toDate = new Date(start.getTime());
	        toDate.setUTCDate(start.getUTCDate() + days);

	        return {
	            toDate: toDate,
	            years: (toDate.getTime() - start.getTime()) / millisecondsPerYear
	        };
	    }

	    function dataGenerator(days, years) {

	        var prices = walk()
	            .period(years)
	            .steps(days * stepsPerDay)
	            .mu(mu)
	            .sigma(sigma)(startPrice);

	        var volumes = walk()
	            .period(years)
	            .steps(days)
	            .mu(0)
	            .sigma(sigma)(startVolume);

	        // Add random noise
	        volumes = volumes.map(function(vol) {
	            var boundedNoiseFactor = Math.min(0, Math.max(volumeNoiseFactor, 1));
	            var multiplier = 1 + (boundedNoiseFactor * (1 - 2 * Math.random()));
	            return Math.floor(vol * multiplier);
	        });

	        // Save the new start values
	        startPrice = prices[prices.length - 1];
	        startVolume = volumes[volumes.length - 1];

	        return calculateOHLC(days, prices, volumes).filter(function(d) {
	            return filter(d.date);
	        });
	    }

	    var gen = function(days) {
	        var date = startDate,
	            remainingDays = days,
	            result = [],
	            interval;

	        do {
	            interval = calculateInterval(date, remainingDays);
	            result = result.concat(dataGenerator(remainingDays, interval.years));
	            date = interval.toDate;
	            remainingDays = days - result.length;
	        }
	        while (result.length < days);

	        return result;
	    };

	    gen.mu = function(x) {
	        if (!arguments.length) {
	            return mu;
	        }
	        mu = x;
	        return gen;
	    };
	    gen.sigma = function(x) {
	        if (!arguments.length) {
	            return sigma;
	        }
	        sigma = x;
	        return gen;
	    };
	    gen.startPrice = function(x) {
	        if (!arguments.length) {
	            return startPrice;
	        }
	        startPrice = x;
	        return gen;
	    };
	    gen.startVolume = function(x) {
	        if (!arguments.length) {
	            return startVolume;
	        }
	        startVolume = x;
	        return gen;
	    };
	    gen.startDate = function(x) {
	        if (!arguments.length) {
	            return startDate;
	        }
	        startDate = x;
	        return gen;
	    };
	    gen.stepsPerDay = function(x) {
	        if (!arguments.length) {
	            return stepsPerDay;
	        }
	        stepsPerDay = x;
	        return gen;
	    };
	    gen.volumeNoiseFactor = function(x) {
	        if (!arguments.length) {
	            return volumeNoiseFactor;
	        }
	        volumeNoiseFactor = x;
	        return gen;
	    };
	    gen.filter = function(x) {
	        if (!arguments.length) {
	            return filter;
	        }
	        filter = x;
	        return gen;
	    };

	    return gen;
	}

	function skipWeekends$1() {
	    return function(date) {
	        var day = date.getDay();
	        return !(day === 0 || day === 6);
	    };
	}

	var random = {
	    filter: {
	        skipWeekends: skipWeekends$1
	    },
	    financial: financial,
	    walk: walk
	};

	//  https://www.quandl.com/docs/api#datasets
	function quandl() {

	    function defaultColumnNameMap(colName) {
	        return colName[0].toLowerCase() + colName.substr(1);
	    }

	    var database = 'YAHOO',
	        dataset = 'GOOG',
	        apiKey = null,
	        start = null,
	        end = null,
	        rows = null,
	        descending = false,
	        collapse = null,
	        columnNameMap = defaultColumnNameMap;

	    var quandl = function(cb) {
	        var params = [];
	        if (apiKey != null) {
	            params.push('api_key=' + apiKey);
	        }
	        if (start != null) {
	            params.push('start_date=' + start.toISOString().substring(0, 10));
	        }
	        if (end != null) {
	            params.push('end_date=' + end.toISOString().substring(0, 10));
	        }
	        if (rows != null) {
	            params.push('rows=' + rows);
	        }
	        if (!descending) {
	            params.push('order=asc');
	        }
	        if (collapse != null) {
	            params.push('collapse=' + collapse);
	        }

	        var url = 'https://www.quandl.com/api/v3/datasets/' + database + '/' + dataset + '/data.json?' + params.join('&');

	        d3.json(url, function(error, data) {
	            if (error) {
	                cb(error);
	                return;
	            }

	            var datasetData = data.dataset_data;

	            var nameMapping = columnNameMap || function(n) { return n; };
	            var colNames = datasetData.column_names
	                .map(function(n, i) { return [i, nameMapping(n)]; })
	                .filter(function(v) { return v[1]; });

	            var mappedData = datasetData.data.map(function(d) {
	                var output = {};
	                colNames.forEach(function(v) {
	                    output[v[1]] = v[0] === 0 ? new Date(d[v[0]]) : d[v[0]];
	                });
	                return output;
	            });

	            cb(error, mappedData);
	        });
	    };

	    // Unique Database Code (e.g. WIKI)
	    quandl.database = function(x) {
	        if (!arguments.length) {
	            return database;
	        }
	        database = x;
	        return quandl;
	    };
	    // Unique Dataset Code (e.g. AAPL)
	    quandl.dataset = function(x) {
	        if (!arguments.length) {
	            return dataset;
	        }
	        dataset = x;
	        return quandl;
	    };
	    // Set To Use API Key In Request (needed for premium set or high frequency requests)
	    quandl.apiKey = function(x) {
	        if (!arguments.length) {
	            return apiKey;
	        }
	        apiKey = x;
	        return quandl;
	    };
	    // Start Date of Data Series
	    quandl.start = function(x) {
	        if (!arguments.length) {
	            return start;
	        }
	        start = x;
	        return quandl;
	    };
	    // End Date of Data Series
	    quandl.end = function(x) {
	        if (!arguments.length) {
	            return end;
	        }
	        end = x;
	        return quandl;
	    };
	    // Limit Number of Rows
	    quandl.rows = function(x) {
	        if (!arguments.length) {
	            return rows;
	        }
	        rows = x;
	        return quandl;
	    };
	    // Return Results In Descending Order (true) or Ascending (false)
	    quandl.descending = function(x) {
	        if (!arguments.length) {
	            return descending;
	        }
	        descending = x;
	        return quandl;
	    };
	    // Periodicity of Data (daily | weekly | monthly | quarterly | annual)
	    quandl.collapse = function(x) {
	        if (!arguments.length) {
	            return collapse;
	        }
	        collapse = x;
	        return quandl;
	    };
	    // Function Used to Normalise the Quandl Column Name To Field Name, Return Null To Skip Field
	    quandl.columnNameMap = function(x) {
	        if (!arguments.length) {
	            return columnNameMap;
	        }
	        columnNameMap = x;
	        return quandl;
	    };
	    // Expose default column name map
	    quandl.defaultColumnNameMap = defaultColumnNameMap;

	    return quandl;
	}

	// https://docs.exchange.coinbase.com/#market-data
	function coinbase() {

	    var product = 'BTC-USD',
	        start = null,
	        end = null,
	        granularity = null;

	    var coinbase = function(cb) {
	        var params = [];
	        if (start != null) {
	            params.push('start=' + start.toISOString());
	        }
	        if (end != null) {
	            params.push('end=' + end.toISOString());
	        }
	        if (granularity != null) {
	            params.push('granularity=' + granularity);
	        }
	        var url = 'https://api.exchange.coinbase.com/products/' + product + '/candles?' + params.join('&');
	        d3.json(url, function(error, data) {
	            if (error) {
	                cb(error);
	                return;
	            }
	            data = data.map(function(d) {
	                return {
	                    date: new Date(d[0] * 1000),
	                    open: d[3],
	                    high: d[2],
	                    low: d[1],
	                    close: d[4],
	                    volume: d[5]
	                };
	            });
	            cb(error, data);
	        });
	    };

	    coinbase.product = function(x) {
	        if (!arguments.length) {
	            return product;
	        }
	        product = x;
	        return coinbase;
	    };
	    coinbase.start = function(x) {
	        if (!arguments.length) {
	            return start;
	        }
	        start = x;
	        return coinbase;
	    };
	    coinbase.end = function(x) {
	        if (!arguments.length) {
	            return end;
	        }
	        end = x;
	        return coinbase;
	    };
	    coinbase.granularity = function(x) {
	        if (!arguments.length) {
	            return granularity;
	        }
	        granularity = x;
	        return coinbase;
	    };

	    return coinbase;
	}

	var feed = {
	    coinbase: coinbase,
	    quandl: quandl
	};

	var data$1 = {
	    feed: feed,
	    random: random,
	    spread: spread,
	    sampler: sampler
	};

	function smallMultiples(xScale, yScale) {

	    xScale = xScale || d3.scale.linear();
	    yScale = yScale || d3.scale.linear();

	    var padding = 10,
	        columns = 9,
	        decorate = noop,
	        plotArea = _line(),
	        margin = {
	            bottom: 30,
	            right: 30
	        },
	        values = function(d) { return d.values; },
	        key = function(d) { return d.key; };

	    var xAxis = axisSvg()
	        .ticks(2);
	    var yAxis = axisSvg()
	        .orient('right')
	        .ticks(3);

	    function classedDataJoin(clazz) {
	        return _dataJoin()
	            .selector('g.' + clazz)
	            .element('g')
	            .attr('class', clazz);
	    }

	    var dataJoin = classedDataJoin('multiple'),
	        xAxisDataJoin = classedDataJoin('x-axis'),
	        yAxisDataJoin = classedDataJoin('y-axis');

	    var multiples = function(selection) {
	        selection.each(function(data, index) {

	            var container = d3.select(this);

	            var expandedMargin = expandRect(margin);
	            expandedMargin.position = 'absolute';

	            var svg = container.selectAll('svg')
	                .data([data]);
	            svg.enter()
	                .append('svg')
	                .layout('flex', 1)
	                .append('g')
	                .attr('class', 'multiples-chart');

	            var plotAreaContainer = svg.select('g')
	                .layout(expandedMargin);

	            container.layout();

	            var rows = Math.ceil(data.length / columns);
	            var multipleWidth = plotAreaContainer.layout('width') / columns - padding;
	            var multipleHeight = plotAreaContainer.layout('height') / rows - padding;

	            function translationForMultiple(row, column) {
	                return {
	                    xOffset: (multipleWidth + padding) * row,
	                    yOffset: (multipleHeight + padding) * column
	                };
	            }

	            setRange(xScale, [0, multipleWidth]);
	            setRange(yScale, [multipleHeight, 0]);

	            plotArea.xScale(xScale)
	                .yScale(yScale);

	            // create a container for each multiple chart
	            var multipleContainer = dataJoin(plotAreaContainer, data);
	            multipleContainer.attr('transform', function(d, i) {
	                var translation = translationForMultiple(i % columns, Math.floor(i / columns));
	                return 'translate(' + translation.xOffset + ',' + translation.yOffset + ')';
	            });

	            // within each, add an inner 'g' and background rect
	            var inner = multipleContainer.enter()
	                .append('g');
	            inner.append('rect')
	                .attr('class', 'background');
	            inner.append('g')
	                .attr('transform', 'translate(' + (multipleWidth / 2) + ', 0)')
	                .append('text')
	                .attr('class', 'label')
	                .text(key);

	            // on update, call the plotArea and size the rect element
	            multipleContainer.select('g')
	                .datum(values)
	                .call(plotArea);
	            multipleContainer.select('rect')
	                .attr({width: multipleWidth, height: multipleHeight});

	            decorate(multipleContainer, data, index);

	            var xAxisContainer = xAxisDataJoin(plotAreaContainer, d3.range(columns));
	            xAxisContainer.attr('transform', function(d, i) {
	                var row = xAxis.orient() === 'bottom' ? rows : 0;
	                var offset = xAxis.orient() === 'bottom' ? 0 : -padding;
	                var translation = translationForMultiple(i, row);
	                return 'translate(' + translation.xOffset + ',' + (translation.yOffset + offset) + ')';
	            });
	            xAxis.scale(xScale);
	            xAxisContainer.call(xAxis);

	            var yAxisContainer = yAxisDataJoin(plotAreaContainer, d3.range(rows));
	            yAxisContainer.attr('transform', function(d, i) {
	                var column = yAxis.orient() === 'left' ? 0 : columns;
	                var offset = yAxis.orient() === 'left' ? -padding : 0;
	                var translation = translationForMultiple(column, i);
	                return 'translate(' + (translation.xOffset + offset) + ',' + translation.yOffset + ')';
	            });
	            yAxis.scale(yScale);
	            yAxisContainer.call(yAxis);
	        });
	    };

	    var scaleExclusions = [
	        /range\w*/,   // the scale range is set via the component layout
	        /tickFormat/  // use axis.tickFormat instead (only present on linear scales)
	    ];
	    rebindAll(multiples, xScale, 'x', scaleExclusions);
	    rebindAll(multiples, yScale, 'y', scaleExclusions);

	    rebindAll(multiples, xAxis, 'x');
	    rebindAll(multiples, yAxis, 'y');

	    multiples.columns = function(x) {
	        if (!arguments.length) {
	            return columns;
	        }
	        columns = x;
	        return multiples;
	    };

	    multiples.margin = function(x) {
	        if (!arguments.length) {
	            return margin;
	        }
	        margin = x;
	        return multiples;
	    };

	    multiples.padding = function(x) {
	        if (!arguments.length) {
	            return padding;
	        }
	        padding = x;
	        return multiples;
	    };

	    multiples.plotArea = function(x) {
	        if (!arguments.length) {
	            return plotArea;
	        }
	        plotArea = x;
	        return multiples;
	    };

	    multiples.values = function(x) {
	        if (!arguments.length) {
	            return values;
	        }
	        values = x;
	        return multiples;
	    };

	    multiples.key = function(x) {
	        if (!arguments.length) {
	            return key;
	        }
	        key = x;
	        return multiples;
	    };

	    multiples.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return multiples;
	    };

	    return multiples;
	}

	function tooltip() {

	    var split = 50,
	        decorate = noop;

	    var items = [
	        ['datum:', function(d) { return d.datum; }]
	    ];

	    var dataJoin = _dataJoin()
	        .selector('g.cell')
	        .element('g')
	        .attr('class', 'cell tooltip');

	    var tooltip = function(selection) {
	        selection.each(function(data, index) {
	            var container = d3.select(this);

	            var legendData = items.map(function(item, i) {
	                return {
	                    datum: data,
	                    label: d3.functor(item[0]),
	                    value: d3.functor(item[1])
	                };
	            });

	            var g = dataJoin(container, legendData);

	            g.enter()
	                .layout({
	                    'flex': 1,
	                    'flexDirection': 'row'
	                });

	            g.enter().append('text')
	                .attr('class', 'label')
	                .layout('flex', split);
	            g.enter().append('text')
	                .attr('class', 'value')
	                .layout('flex', 100 - split);

	            g.select('.label')
	                .text(function(d, i) {
	                    return d.label.call(this, d.datum, i);
	                });

	            g.select('.value')
	                .text(function(d, i) {
	                    return d.value.call(this, d.datum, i);
	                });

	            decorate(g, data, index);

	            container.layout();
	        });
	    };

	    tooltip.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return tooltip;
	    };

	    tooltip.split = function(x) {
	        if (!arguments.length) {
	            return split;
	        }
	        split = x;
	        return tooltip;
	    };

	    tooltip.items = function(x) {
	        if (!arguments.length) {
	            return items;
	        }
	        items = x;
	        return tooltip;
	    };

	    return tooltip;
	}

	function sparkline() {

	    // creates an array with four elements, representing the high, low, open and close
	    // values of the given array
	    function highLowOpenClose(data) {
	        var xValueAccessor = sparkline.xValue(),
	            yValueAccessor = sparkline.yValue();

	        var high = d3.max(data, yValueAccessor);
	        var low = d3.min(data, yValueAccessor);

	        function elementWithYValue(value) {
	            return data.filter(function(d) {
	                return yValueAccessor(d) === value;
	            })[0];
	        }

	        return [{
	            x: xValueAccessor(data[0]),
	            y: yValueAccessor(data[0])
	        }, {
	            x: xValueAccessor(elementWithYValue(high)),
	            y: high
	        }, {
	            x: xValueAccessor(elementWithYValue(low)),
	            y: low
	        }, {
	            x: xValueAccessor(data[data.length - 1]),
	            y: yValueAccessor(data[data.length - 1])
	        }];
	    }

	    var xScale = exportedScale();
	    var yScale = d3.scale.linear();
	    var radius = 2;
	    var line = _line();

	    // configure the point series to render the data from the
	    // highLowOpenClose function
	    var point$$ = point()
	        .xValue(function(d) { return d.x; })
	        .yValue(function(d) { return d.y; })
	        .decorate(function(sel) {
	            sel.attr('class', function(d, i) {
	                switch (i) {
	                case 0: return 'open';
	                case 1: return 'high';
	                case 2: return 'low';
	                case 3: return 'close';
	                }
	            });
	        });

	    var multi = _multi()
	        .series([line, point$$])
	        .mapping(function(series) {
	            switch (series) {
	            case point$$:
	                return highLowOpenClose(this);
	            default:
	                return this;
	            }
	        });

	    var sparkline = function(selection) {

	        point$$.size(radius * radius * Math.PI);

	        selection.each(function(data) {

	            var container = d3.select(this);
	            var dimensions = innerDimensions(this);
	            var margin = radius;

	            xScale.range([margin, dimensions.width - margin]);
	            yScale.range([dimensions.height - margin, margin]);

	            multi.xScale(xScale)
	                .yScale(yScale);

	            container.call(multi);

	        });
	    };

	    rebind(sparkline, xScale, {
	        xDiscontinuityProvider: 'discontinuityProvider',
	        xDomain: 'domain'
	    });

	    rebind(sparkline, yScale, {
	        yDomain: 'domain'
	    });

	    rebind(sparkline, line, 'xValue', 'yValue');

	    sparkline.xScale = function() { return xScale; };
	    sparkline.yScale = function() { return yScale; };
	    sparkline.radius = function(x) {
	        if (!arguments.length) {
	            return radius;
	        }
	        radius = x;
	        return sparkline;
	    };

	    return sparkline;
	}

	/**
	 * innerHTML property for SVGElement
	 * Copyright(c) 2010, Jeff Schiller
	 *
	 * Licensed under the Apache License, Version 2
	 *
	 * Minor modifications by Chris Price to only polyfill when required.
	 */
	(function(SVGElement) {
	  if (!SVGElement || 'innerHTML' in SVGElement.prototype) {
	    return;
	  }
	  var serializeXML = function(node, output) {
	    var nodeType = node.nodeType;
	    if (nodeType == 3) { // TEXT nodes.
	      // Replace special XML characters with their entities.
	      output.push(node.textContent.replace(/&/, '&amp;').replace(/</, '&lt;').replace('>', '&gt;'));
	    } else if (nodeType == 1) { // ELEMENT nodes.
	      // Serialize Element nodes.
	      output.push('<', node.tagName);
	      if (node.hasAttributes()) {
	        var attrMap = node.attributes;
	        for (var i = 0, len = attrMap.length; i < len; ++i) {
	          var attrNode = attrMap.item(i);
	          output.push(' ', attrNode.name, '=\'', attrNode.value, '\'');
	        }
	      }
	      if (node.hasChildNodes()) {
	        output.push('>');
	        var childNodes = node.childNodes;
	        for (var i = 0, len = childNodes.length; i < len; ++i) {
	          serializeXML(childNodes.item(i), output);
	        }
	        output.push('</', node.tagName, '>');
	      } else {
	        output.push('/>');
	      }
	    } else if (nodeType == 8) {
	      // TODO(codedread): Replace special characters with XML entities?
	      output.push('<!--', node.nodeValue, '-->');
	    } else {
	      // TODO: Handle CDATA nodes.
	      // TODO: Handle ENTITY nodes.
	      // TODO: Handle DOCUMENT nodes.
	      throw 'Error serializing XML. Unhandled node of type: ' + nodeType;
	    }
	  }
	  // The innerHTML DOM property for SVGElement.
	  Object.defineProperty(SVGElement.prototype, 'innerHTML', {
	    get: function() {
	      var output = [];
	      var childNode = this.firstChild;
	      while (childNode) {
	        serializeXML(childNode, output);
	        childNode = childNode.nextSibling;
	      }
	      return output.join('');
	    },
	    set: function(markupText) {
	      // Wipe out the current contents of the element.
	      while (this.firstChild) {
	        this.removeChild(this.firstChild);
	      }

	      try {
	        // Parse the markup into valid nodes.
	        var dXML = new DOMParser();
	        dXML.async = false;
	        // Wrap the markup into a SVG node to ensure parsing works.
	        sXML = '<svg xmlns=\'http://www.w3.org/2000/svg\'>' + markupText + '</svg>';
	        var svgDocElement = dXML.parseFromString(sXML, 'text/xml').documentElement;

	        // Now take each node, import it and append to this element.
	        var childNode = svgDocElement.firstChild;
	        while(childNode) {
	          this.appendChild(this.ownerDocument.importNode(childNode, true));
	          childNode = childNode.nextSibling;
	        }
	      } catch(e) {
	        throw new Error('Error parsing XML string');
	      };
	    }
	  });
	})((1, eval)('this').SVGElement);

	function cartesian(xScale, yScale) {

	    xScale = xScale || d3.scale.linear();
	    yScale = yScale || d3.scale.linear();

	    var margin = {
	            bottom: 30,
	            right: 30
	        },
	        yLabel = '',
	        xLabel = '',
	        xBaseline = null,
	        yBaseline = null,
	        chartLabel = '',
	        plotArea = _line(),
	        decorate = noop;

	    // Each axis-series has a cross-scale which is defined as an identity
	    // scale. If no baseline function is supplied, the axis is positioned
	    // using the cross-scale range extents. If a baseline function is supplied
	    // it is transformed via the respective scale.
	    var xAxis = axis()
	        .orient('bottom')
	        .baseline(function() {
	            if (xBaseline !== null) {
	                return yScale(xBaseline.apply(this, arguments));
	            } else {
	                var r = scaleRange(yScale);
	                return xAxis.orient() === 'bottom' ? r[0] : r[1];
	            }
	        });

	    var yAxis = axis()
	        .orient('right')
	        .baseline(function() {
	            if (yBaseline !== null) {
	                return xScale(yBaseline.apply(this, arguments));
	            } else {
	                var r = scaleRange(xScale);
	                return yAxis.orient() === 'left' ? r[0] : r[1];
	            }
	        });

	    var containerDataJoin = _dataJoin()
	        .selector('svg.cartesian-chart')
	        .element('svg')
	        .attr({'class': 'cartesian-chart', 'layout-style': 'flex: 1'});


	    var cartesian = function(selection) {

	        selection.each(function(data, index) {

	            var container = d3.select(this);

	            var svg = containerDataJoin(container, [data]);
	            svg.enter().html(
	                '<g class="plot-area-container"> \
                    <rect class="background" \
                        layout-style="position: absolute; top: 0; bottom: 0; left: 0; right: 0"/> \
                    <g class="axes-container" \
                        layout-style="position: absolute; top: 0; bottom: 0; left: 0; right: 0"> \
                        <g class="x-axis" layout-style="height: 0; width: 0"/> \
                        <g class="y-axis" layout-style="height: 0; width: 0"/> \
                    </g> \
                    <svg class="plot-area" \
                        layout-style="position: absolute; top: 0; bottom: 0; left: 0; right: 0"/> \
                </g> \
                <g class="x-axis label-container"> \
                    <g layout-style="height: 0; width: 0"> \
                        <text class="label"/> \
                    </g> \
                </g> \
                <g class="y-axis label-container"> \
                    <g layout-style="height: 0; width: 0"> \
                        <text class="label"/> \
                    </g> \
                </g> \
                <g class="title label-container"> \
                    <g layout-style="height: 0; width: 0"> \
                        <text class="label"/> \
                    </g> \
                </g>');

	            var expandedMargin = expandRect(margin);

	            svg.select('.plot-area-container')
	                .layout({
	                    position: 'absolute',
	                    top: expandedMargin.top,
	                    left: expandedMargin.left,
	                    bottom: expandedMargin.bottom,
	                    right: expandedMargin.right
	                });

	            svg.select('.title')
	                .layout({
	                    position: 'absolute',
	                    top: 0,
	                    alignItems: 'center',
	                    left: expandedMargin.left,
	                    right: expandedMargin.right
	                });

	            var yAxisLayout = {
	                position: 'absolute',
	                top: expandedMargin.top,
	                bottom: expandedMargin.bottom,
	                alignItems: 'center',
	                flexDirection: 'row'
	            };
	            yAxisLayout[yAxis.orient()] = 0;
	            svg.select('.y-axis.label-container')
	                .attr('class', 'y-axis label-container ' + yAxis.orient())
	                .layout(yAxisLayout);

	            var xAxisLayout = {
	                position: 'absolute',
	                left: expandedMargin.left,
	                right: expandedMargin.right,
	                alignItems: 'center'
	            };
	            xAxisLayout[xAxis.orient()] = 0;
	            svg.select('.x-axis.label-container')
	                .attr('class', 'x-axis label-container ' + xAxis.orient())
	                .layout(xAxisLayout);

	            // perform the flexbox / css layout
	            container.layout();

	            // update the label text
	            svg.select('.title .label')
	                .text(chartLabel);

	            svg.select('.y-axis.label-container .label')
	                .text(yLabel)
	                .attr('transform', yAxis.orient() === 'right' ? 'rotate(90)' : 'rotate(-90)');

	            svg.select('.x-axis.label-container .label')
	                .text(xLabel);

	            // set the axis ranges
	            var plotAreaContainer = svg.select('.plot-area');
	            setRange(xScale, [0, plotAreaContainer.layout('width')]);
	            setRange(yScale, [plotAreaContainer.layout('height'), 0]);

	            // render the axes
	            xAxis.xScale(xScale)
	                .yScale(d3.scale.identity());

	            yAxis.yScale(yScale)
	                .xScale(d3.scale.identity());

	            svg.select('.axes-container .x-axis')
	                .call(xAxis);

	            svg.select('.axes-container .y-axis')
	                .call(yAxis);

	            // render the plot area
	            plotArea.xScale(xScale)
	                .yScale(yScale);
	            plotAreaContainer.call(plotArea);

	            decorate(svg, data, index);
	        });
	    };

	    var scaleExclusions = [
	        /range\w*/,   // the scale range is set via the component layout
	        /tickFormat/  // use axis.tickFormat instead (only present on linear scales)
	    ];
	    rebindAll(cartesian, xScale, 'x', scaleExclusions);
	    rebindAll(cartesian, yScale, 'y', scaleExclusions);

	    var axisExclusions = [
	        'baseline',         // the axis baseline is adapted so is not exposed directly
	        'xScale', 'yScale'  // these are set by this components
	    ];
	    rebindAll(cartesian, xAxis, 'x', axisExclusions);
	    rebindAll(cartesian, yAxis, 'y', axisExclusions);

	    cartesian.xBaseline = function(x) {
	        if (!arguments.length) {
	            return xBaseline;
	        }
	        xBaseline = d3.functor(x);
	        return cartesian;
	    };
	    cartesian.yBaseline = function(x) {
	        if (!arguments.length) {
	            return yBaseline;
	        }
	        yBaseline = d3.functor(x);
	        return cartesian;
	    };
	    cartesian.chartLabel = function(x) {
	        if (!arguments.length) {
	            return chartLabel;
	        }
	        chartLabel = x;
	        return cartesian;
	    };
	    cartesian.plotArea = function(x) {
	        if (!arguments.length) {
	            return plotArea;
	        }
	        plotArea = x;
	        return cartesian;
	    };
	    cartesian.xLabel = function(x) {
	        if (!arguments.length) {
	            return xLabel;
	        }
	        xLabel = x;
	        return cartesian;
	    };
	    cartesian.margin = function(x) {
	        if (!arguments.length) {
	            return margin;
	        }
	        margin = x;
	        return cartesian;
	    };
	    cartesian.yLabel = function(x) {
	        if (!arguments.length) {
	            return yLabel;
	        }
	        yLabel = x;
	        return cartesian;
	    };
	    cartesian.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return cartesian;
	    };

	    return cartesian;
	}

	var chart$2 = {
	    cartesian: cartesian,
	    sparkline: sparkline,
	    tooltip: tooltip,
	    smallMultiples: smallMultiples
	};

	function gridline() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        xTicks = 10,
	        yTicks = 10;

	    var xDecorate = noop,
	        yDecorate = noop;

	    var xLineDataJoin = _dataJoin()
	        .selector('line.x')
	        .element('line')
	        .attr('class', 'x gridline');

	    var yLineDataJoin = _dataJoin()
	        .selector('line.y')
	        .element('line')
	        .attr('class', 'y gridline');

	    var gridlines = function(selection) {

	        selection.each(function(data, index) {

	            var xData = xScale.ticks(xTicks);
	            var xLines = xLineDataJoin(this, xData);

	            xLines.attr({
	                'x1': xScale,
	                'x2': xScale,
	                'y1': yScale.range()[0],
	                'y2': yScale.range()[1]
	            });

	            xDecorate(xLines, xData, index);

	            var yData = yScale.ticks(yTicks);
	            var yLines = yLineDataJoin(this, yData);

	            yLines.attr({
	                'x1': xScale.range()[0],
	                'x2': xScale.range()[1],
	                'y1': yScale,
	                'y2': yScale
	            });

	            yDecorate(yLines, yData, index);

	        });
	    };

	    gridlines.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return gridlines;
	    };
	    gridlines.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return gridlines;
	    };
	    gridlines.xTicks = function(x) {
	        if (!arguments.length) {
	            return xTicks;
	        }
	        xTicks = x;
	        return gridlines;
	    };
	    gridlines.yTicks = function(x) {
	        if (!arguments.length) {
	            return yTicks;
	        }
	        yTicks = x;
	        return gridlines;
	    };
	    gridlines.yDecorate = function(x) {
	        if (!arguments.length) {
	            return yDecorate;
	        }
	        yDecorate = x;
	        return gridlines;
	    };
	    gridlines.xDecorate = function(x) {
	        if (!arguments.length) {
	            return xDecorate;
	        }
	        xDecorate = x;
	        return gridlines;
	    };

	    rebind(gridlines, xLineDataJoin, {'xKey': 'key'});
	    rebind(gridlines, yLineDataJoin, {'yKey': 'key'});

	    return gridlines;
	}

	function band() {

	    var xScale = d3.time.scale(),
	        yScale = d3.scale.linear(),
	        x0, x1, y0, y1,
	        x0Scaled = function() {
	            return scaleRange(xScale)[0];
	        },
	        x1Scaled = function() {
	            return scaleRange(xScale)[1];
	        },
	        y0Scaled = function() {
	            return scaleRange(yScale)[0];
	        },
	        y1Scaled = function() {
	            return scaleRange(yScale)[1];
	        },
	        decorate = noop;

	    var dataJoin = _dataJoin()
	        .selector('g.annotation')
	        .element('g')
	        .attr('class', 'annotation');

	    var band = function(selection) {
	        selection.each(function(data, index) {

	            var container = d3.select(this);

	            var g = dataJoin(container, data);

	            g.enter()
	                .append('path')
	                .classed('band', true);

	            var pathGenerator = svgBar()
	                .horizontalAlign('right')
	                .verticalAlign('top')
	                .x(x0Scaled)
	                .y(y0Scaled)
	                .height(function() {
	                    return y1Scaled.apply(this, arguments) - y0Scaled.apply(this, arguments);
	                })
	                .width(function() {
	                    return x1Scaled.apply(this, arguments) - x0Scaled.apply(this, arguments);
	                });

	            g.select('path')
	                .attr('d', function(d, i) {
	                    // the path generator is being used to render a single path, hence
	                    // an explicit index is provided
	                    return pathGenerator.call(this, [d], i);
	                });

	            decorate(g, data, index);
	        });
	    };

	    band.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return band;
	    };
	    band.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return band;
	    };
	    band.decorate = function(x) {
	        if (!arguments.length) {
	            return decorate;
	        }
	        decorate = x;
	        return band;
	    };
	    band.x0 = function(x) {
	        if (!arguments.length) {
	            return x0;
	        }
	        x0 = d3.functor(x);
	        x0Scaled = function() {
	            return xScale(x0.apply(this, arguments));
	        };
	        return band;
	    };
	    band.x1 = function(x) {
	        if (!arguments.length) {
	            return x1;
	        }
	        x1 = d3.functor(x);
	        x1Scaled = function() {
	            return xScale(x1.apply(this, arguments));
	        };
	        return band;
	    };
	    band.y0 = function(x) {
	        if (!arguments.length) {
	            return y0;
	        }
	        y0 = d3.functor(x);
	        y0Scaled = function() {
	            return yScale(y0.apply(this, arguments));
	        };
	        return band;
	    };
	    band.y1 = function(x) {
	        if (!arguments.length) {
	            return y1;
	        }
	        y1 = d3.functor(x);
	        y1Scaled = function() {
	            return yScale(y1.apply(this, arguments));
	        };
	        return band;
	    };
	    return band;
	}

	var annotation = {
	    band: band,
	    gridline: gridline,
	    line: annotationLine
	};

	var cssLayout = __commonjs(function (module, exports) {
	// UMD (Universal Module Definition)
	// See https://github.com/umdjs/umd for reference
	//
	// This file uses the following specific UMD implementation:
	// https://github.com/umdjs/umd/blob/master/returnExports.js
	(function(root, factory) {
	  if (typeof define === 'function' && define.amd) {
	    // AMD. Register as an anonymous module.
	    define([], factory);
	  } else if (typeof exports === 'object') {
	    // Node. Does not work with strict CommonJS, but
	    // only CommonJS-like environments that support module.exports,
	    // like Node.
	    module.exports = factory();
	  } else {
	    // Browser globals (root is window)
	    root.computeLayout = factory();
	  }
	}(this, function() {
	  /**
	 * Copyright (c) 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * LICENSE file in the root directory of this source tree. An additional grant
	 * of patent rights can be found in the PATENTS file in the same directory.
	 */

	var computeLayout = (function() {

	  var CSS_UNDEFINED;

	  var CSS_DIRECTION_INHERIT = 'inherit';
	  var CSS_DIRECTION_LTR = 'ltr';
	  var CSS_DIRECTION_RTL = 'rtl';

	  var CSS_FLEX_DIRECTION_ROW = 'row';
	  var CSS_FLEX_DIRECTION_ROW_REVERSE = 'row-reverse';
	  var CSS_FLEX_DIRECTION_COLUMN = 'column';
	  var CSS_FLEX_DIRECTION_COLUMN_REVERSE = 'column-reverse';

	  var CSS_JUSTIFY_FLEX_START = 'flex-start';
	  var CSS_JUSTIFY_CENTER = 'center';
	  var CSS_JUSTIFY_FLEX_END = 'flex-end';
	  var CSS_JUSTIFY_SPACE_BETWEEN = 'space-between';
	  var CSS_JUSTIFY_SPACE_AROUND = 'space-around';

	  var CSS_ALIGN_FLEX_START = 'flex-start';
	  var CSS_ALIGN_CENTER = 'center';
	  var CSS_ALIGN_FLEX_END = 'flex-end';
	  var CSS_ALIGN_STRETCH = 'stretch';

	  var CSS_POSITION_RELATIVE = 'relative';
	  var CSS_POSITION_ABSOLUTE = 'absolute';

	  var leading = {
	    'row': 'left',
	    'row-reverse': 'right',
	    'column': 'top',
	    'column-reverse': 'bottom'
	  };
	  var trailing = {
	    'row': 'right',
	    'row-reverse': 'left',
	    'column': 'bottom',
	    'column-reverse': 'top'
	  };
	  var pos = {
	    'row': 'left',
	    'row-reverse': 'right',
	    'column': 'top',
	    'column-reverse': 'bottom'
	  };
	  var dim = {
	    'row': 'width',
	    'row-reverse': 'width',
	    'column': 'height',
	    'column-reverse': 'height'
	  };

	  // When transpiled to Java / C the node type has layout, children and style
	  // properties. For the JavaScript version this function adds these properties
	  // if they don't already exist.
	  function fillNodes(node) {
	    if (!node.layout || node.isDirty) {
	      node.layout = {
	        width: undefined,
	        height: undefined,
	        top: 0,
	        left: 0,
	        right: 0,
	        bottom: 0
	      };
	    }

	    if (!node.style) {
	      node.style = {};
	    }

	    if (!node.children) {
	      node.children = [];
	    }
	    node.children.forEach(fillNodes);
	    return node;
	  }

	  function isUndefined(value) {
	    return value === undefined;
	  }

	  function isRowDirection(flexDirection) {
	    return flexDirection === CSS_FLEX_DIRECTION_ROW ||
	           flexDirection === CSS_FLEX_DIRECTION_ROW_REVERSE;
	  }

	  function isColumnDirection(flexDirection) {
	    return flexDirection === CSS_FLEX_DIRECTION_COLUMN ||
	           flexDirection === CSS_FLEX_DIRECTION_COLUMN_REVERSE;
	  }

	  function getLeadingMargin(node, axis) {
	    if (node.style.marginStart !== undefined && isRowDirection(axis)) {
	      return node.style.marginStart;
	    }

	    var value = null;
	    switch (axis) {
	      case 'row':            value = node.style.marginLeft;   break;
	      case 'row-reverse':    value = node.style.marginRight;  break;
	      case 'column':         value = node.style.marginTop;    break;
	      case 'column-reverse': value = node.style.marginBottom; break;
	    }

	    if (value !== undefined) {
	      return value;
	    }

	    if (node.style.margin !== undefined) {
	      return node.style.margin;
	    }

	    return 0;
	  }

	  function getTrailingMargin(node, axis) {
	    if (node.style.marginEnd !== undefined && isRowDirection(axis)) {
	      return node.style.marginEnd;
	    }

	    var value = null;
	    switch (axis) {
	      case 'row':            value = node.style.marginRight;  break;
	      case 'row-reverse':    value = node.style.marginLeft;   break;
	      case 'column':         value = node.style.marginBottom; break;
	      case 'column-reverse': value = node.style.marginTop;    break;
	    }

	    if (value != null) {
	      return value;
	    }

	    if (node.style.margin !== undefined) {
	      return node.style.margin;
	    }

	    return 0;
	  }

	  function getLeadingPadding(node, axis) {
	    if (node.style.paddingStart !== undefined && node.style.paddingStart >= 0
	        && isRowDirection(axis)) {
	      return node.style.paddingStart;
	    }

	    var value = null;
	    switch (axis) {
	      case 'row':            value = node.style.paddingLeft;   break;
	      case 'row-reverse':    value = node.style.paddingRight;  break;
	      case 'column':         value = node.style.paddingTop;    break;
	      case 'column-reverse': value = node.style.paddingBottom; break;
	    }

	    if (value != null && value >= 0) {
	      return value;
	    }

	    if (node.style.padding !== undefined && node.style.padding >= 0) {
	      return node.style.padding;
	    }

	    return 0;
	  }

	  function getTrailingPadding(node, axis) {
	    if (node.style.paddingEnd !== undefined && node.style.paddingEnd >= 0
	        && isRowDirection(axis)) {
	      return node.style.paddingEnd;
	    }

	    var value = null;
	    switch (axis) {
	      case 'row':            value = node.style.paddingRight;  break;
	      case 'row-reverse':    value = node.style.paddingLeft;   break;
	      case 'column':         value = node.style.paddingBottom; break;
	      case 'column-reverse': value = node.style.paddingTop;    break;
	    }

	    if (value != null && value >= 0) {
	      return value;
	    }

	    if (node.style.padding !== undefined && node.style.padding >= 0) {
	      return node.style.padding;
	    }

	    return 0;
	  }

	  function getLeadingBorder(node, axis) {
	    if (node.style.borderStartWidth !== undefined && node.style.borderStartWidth >= 0
	        && isRowDirection(axis)) {
	      return node.style.borderStartWidth;
	    }

	    var value = null;
	    switch (axis) {
	      case 'row':            value = node.style.borderLeftWidth;   break;
	      case 'row-reverse':    value = node.style.borderRightWidth;  break;
	      case 'column':         value = node.style.borderTopWidth;    break;
	      case 'column-reverse': value = node.style.borderBottomWidth; break;
	    }

	    if (value != null && value >= 0) {
	      return value;
	    }

	    if (node.style.borderWidth !== undefined && node.style.borderWidth >= 0) {
	      return node.style.borderWidth;
	    }

	    return 0;
	  }

	  function getTrailingBorder(node, axis) {
	    if (node.style.borderEndWidth !== undefined && node.style.borderEndWidth >= 0
	        && isRowDirection(axis)) {
	      return node.style.borderEndWidth;
	    }

	    var value = null;
	    switch (axis) {
	      case 'row':            value = node.style.borderRightWidth;  break;
	      case 'row-reverse':    value = node.style.borderLeftWidth;   break;
	      case 'column':         value = node.style.borderBottomWidth; break;
	      case 'column-reverse': value = node.style.borderTopWidth;    break;
	    }

	    if (value != null && value >= 0) {
	      return value;
	    }

	    if (node.style.borderWidth !== undefined && node.style.borderWidth >= 0) {
	      return node.style.borderWidth;
	    }

	    return 0;
	  }

	  function getLeadingPaddingAndBorder(node, axis) {
	    return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
	  }

	  function getTrailingPaddingAndBorder(node, axis) {
	    return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
	  }

	  function getBorderAxis(node, axis) {
	    return getLeadingBorder(node, axis) + getTrailingBorder(node, axis);
	  }

	  function getMarginAxis(node, axis) {
	    return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
	  }

	  function getPaddingAndBorderAxis(node, axis) {
	    return getLeadingPaddingAndBorder(node, axis) +
	        getTrailingPaddingAndBorder(node, axis);
	  }

	  function getJustifyContent(node) {
	    if (node.style.justifyContent) {
	      return node.style.justifyContent;
	    }
	    return 'flex-start';
	  }

	  function getAlignContent(node) {
	    if (node.style.alignContent) {
	      return node.style.alignContent;
	    }
	    return 'flex-start';
	  }

	  function getAlignItem(node, child) {
	    if (child.style.alignSelf) {
	      return child.style.alignSelf;
	    }
	    if (node.style.alignItems) {
	      return node.style.alignItems;
	    }
	    return 'stretch';
	  }

	  function resolveAxis(axis, direction) {
	    if (direction === CSS_DIRECTION_RTL) {
	      if (axis === CSS_FLEX_DIRECTION_ROW) {
	        return CSS_FLEX_DIRECTION_ROW_REVERSE;
	      } else if (axis === CSS_FLEX_DIRECTION_ROW_REVERSE) {
	        return CSS_FLEX_DIRECTION_ROW;
	      }
	    }

	    return axis;
	  }

	  function resolveDirection(node, parentDirection) {
	    var direction;
	    if (node.style.direction) {
	      direction = node.style.direction;
	    } else {
	      direction = CSS_DIRECTION_INHERIT;
	    }

	    if (direction === CSS_DIRECTION_INHERIT) {
	      direction = (parentDirection === undefined ? CSS_DIRECTION_LTR : parentDirection);
	    }

	    return direction;
	  }

	  function getFlexDirection(node) {
	    if (node.style.flexDirection) {
	      return node.style.flexDirection;
	    }
	    return CSS_FLEX_DIRECTION_COLUMN;
	  }

	  function getCrossFlexDirection(flexDirection, direction) {
	    if (isColumnDirection(flexDirection)) {
	      return resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);
	    } else {
	      return CSS_FLEX_DIRECTION_COLUMN;
	    }
	  }

	  function getPositionType(node) {
	    if (node.style.position) {
	      return node.style.position;
	    }
	    return 'relative';
	  }

	  function isFlex(node) {
	    return (
	      getPositionType(node) === CSS_POSITION_RELATIVE &&
	      node.style.flex > 0
	    );
	  }

	  function isFlexWrap(node) {
	    return node.style.flexWrap === 'wrap';
	  }

	  function getDimWithMargin(node, axis) {
	    return node.layout[dim[axis]] + getMarginAxis(node, axis);
	  }

	  function isDimDefined(node, axis) {
	    return node.style[dim[axis]] !== undefined && node.style[dim[axis]] >= 0;
	  }

	  function isPosDefined(node, pos) {
	    return node.style[pos] !== undefined;
	  }

	  function isMeasureDefined(node) {
	    return node.style.measure !== undefined;
	  }

	  function getPosition(node, pos) {
	    if (node.style[pos] !== undefined) {
	      return node.style[pos];
	    }
	    return 0;
	  }

	  function boundAxis(node, axis, value) {
	    var min = {
	      'row': node.style.minWidth,
	      'row-reverse': node.style.minWidth,
	      'column': node.style.minHeight,
	      'column-reverse': node.style.minHeight
	    }[axis];

	    var max = {
	      'row': node.style.maxWidth,
	      'row-reverse': node.style.maxWidth,
	      'column': node.style.maxHeight,
	      'column-reverse': node.style.maxHeight
	    }[axis];

	    var boundValue = value;
	    if (max !== undefined && max >= 0 && boundValue > max) {
	      boundValue = max;
	    }
	    if (min !== undefined && min >= 0 && boundValue < min) {
	      boundValue = min;
	    }
	    return boundValue;
	  }

	  function fmaxf(a, b) {
	    if (a > b) {
	      return a;
	    }
	    return b;
	  }

	  // When the user specifically sets a value for width or height
	  function setDimensionFromStyle(node, axis) {
	    // The parent already computed us a width or height. We just skip it
	    if (node.layout[dim[axis]] !== undefined) {
	      return;
	    }
	    // We only run if there's a width or height defined
	    if (!isDimDefined(node, axis)) {
	      return;
	    }

	    // The dimensions can never be smaller than the padding and border
	    node.layout[dim[axis]] = fmaxf(
	      boundAxis(node, axis, node.style[dim[axis]]),
	      getPaddingAndBorderAxis(node, axis)
	    );
	  }

	  function setTrailingPosition(node, child, axis) {
	    child.layout[trailing[axis]] = node.layout[dim[axis]] -
	        child.layout[dim[axis]] - child.layout[pos[axis]];
	  }

	  // If both left and right are defined, then use left. Otherwise return
	  // +left or -right depending on which is defined.
	  function getRelativePosition(node, axis) {
	    if (node.style[leading[axis]] !== undefined) {
	      return getPosition(node, leading[axis]);
	    }
	    return -getPosition(node, trailing[axis]);
	  }

	  function layoutNodeImpl(node, parentMaxWidth, /*css_direction_t*/parentDirection) {
	    var/*css_direction_t*/ direction = resolveDirection(node, parentDirection);
	    var/*(c)!css_flex_direction_t*//*(java)!int*/ mainAxis = resolveAxis(getFlexDirection(node), direction);
	    var/*(c)!css_flex_direction_t*//*(java)!int*/ crossAxis = getCrossFlexDirection(mainAxis, direction);
	    var/*(c)!css_flex_direction_t*//*(java)!int*/ resolvedRowAxis = resolveAxis(CSS_FLEX_DIRECTION_ROW, direction);

	    // Handle width and height style attributes
	    setDimensionFromStyle(node, mainAxis);
	    setDimensionFromStyle(node, crossAxis);

	    // Set the resolved resolution in the node's layout
	    node.layout.direction = direction;

	    // The position is set by the parent, but we need to complete it with a
	    // delta composed of the margin and left/top/right/bottom
	    node.layout[leading[mainAxis]] += getLeadingMargin(node, mainAxis) +
	      getRelativePosition(node, mainAxis);
	    node.layout[trailing[mainAxis]] += getTrailingMargin(node, mainAxis) +
	      getRelativePosition(node, mainAxis);
	    node.layout[leading[crossAxis]] += getLeadingMargin(node, crossAxis) +
	      getRelativePosition(node, crossAxis);
	    node.layout[trailing[crossAxis]] += getTrailingMargin(node, crossAxis) +
	      getRelativePosition(node, crossAxis);

	    // Inline immutable values from the target node to avoid excessive method
	    // invocations during the layout calculation.
	    var/*int*/ childCount = node.children.length;
	    var/*float*/ paddingAndBorderAxisResolvedRow = getPaddingAndBorderAxis(node, resolvedRowAxis);

	    if (isMeasureDefined(node)) {
	      var/*bool*/ isResolvedRowDimDefined = !isUndefined(node.layout[dim[resolvedRowAxis]]);

	      var/*float*/ width = CSS_UNDEFINED;
	      if (isDimDefined(node, resolvedRowAxis)) {
	        width = node.style.width;
	      } else if (isResolvedRowDimDefined) {
	        width = node.layout[dim[resolvedRowAxis]];
	      } else {
	        width = parentMaxWidth -
	          getMarginAxis(node, resolvedRowAxis);
	      }
	      width -= paddingAndBorderAxisResolvedRow;

	      // We only need to give a dimension for the text if we haven't got any
	      // for it computed yet. It can either be from the style attribute or because
	      // the element is flexible.
	      var/*bool*/ isRowUndefined = !isDimDefined(node, resolvedRowAxis) && !isResolvedRowDimDefined;
	      var/*bool*/ isColumnUndefined = !isDimDefined(node, CSS_FLEX_DIRECTION_COLUMN) &&
	        isUndefined(node.layout[dim[CSS_FLEX_DIRECTION_COLUMN]]);

	      // Let's not measure the text if we already know both dimensions
	      if (isRowUndefined || isColumnUndefined) {
	        var/*css_dim_t*/ measureDim = node.style.measure(
	          /*(c)!node->context,*/
	          /*(java)!layoutContext.measureOutput,*/
	          width
	        );
	        if (isRowUndefined) {
	          node.layout.width = measureDim.width +
	            paddingAndBorderAxisResolvedRow;
	        }
	        if (isColumnUndefined) {
	          node.layout.height = measureDim.height +
	            getPaddingAndBorderAxis(node, CSS_FLEX_DIRECTION_COLUMN);
	        }
	      }
	      if (childCount === 0) {
	        return;
	      }
	    }

	    var/*bool*/ isNodeFlexWrap = isFlexWrap(node);

	    var/*css_justify_t*/ justifyContent = getJustifyContent(node);

	    var/*float*/ leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
	    var/*float*/ leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
	    var/*float*/ paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
	    var/*float*/ paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

	    var/*bool*/ isMainDimDefined = !isUndefined(node.layout[dim[mainAxis]]);
	    var/*bool*/ isCrossDimDefined = !isUndefined(node.layout[dim[crossAxis]]);
	    var/*bool*/ isMainRowDirection = isRowDirection(mainAxis);

	    var/*int*/ i;
	    var/*int*/ ii;
	    var/*css_node_t**/ child;
	    var/*(c)!css_flex_direction_t*//*(java)!int*/ axis;

	    var/*css_node_t**/ firstAbsoluteChild = null;
	    var/*css_node_t**/ currentAbsoluteChild = null;

	    var/*float*/ definedMainDim = CSS_UNDEFINED;
	    if (isMainDimDefined) {
	      definedMainDim = node.layout[dim[mainAxis]] - paddingAndBorderAxisMain;
	    }

	    // We want to execute the next two loops one per line with flex-wrap
	    var/*int*/ startLine = 0;
	    var/*int*/ endLine = 0;
	    // var/*int*/ nextOffset = 0;
	    var/*int*/ alreadyComputedNextLayout = 0;
	    // We aggregate the total dimensions of the container in those two variables
	    var/*float*/ linesCrossDim = 0;
	    var/*float*/ linesMainDim = 0;
	    var/*int*/ linesCount = 0;
	    while (endLine < childCount) {
	      // <Loop A> Layout non flexible children and count children by type

	      // mainContentDim is accumulation of the dimensions and margin of all the
	      // non flexible children. This will be used in order to either set the
	      // dimensions of the node if none already exist, or to compute the
	      // remaining space left for the flexible children.
	      var/*float*/ mainContentDim = 0;

	      // There are three kind of children, non flexible, flexible and absolute.
	      // We need to know how many there are in order to distribute the space.
	      var/*int*/ flexibleChildrenCount = 0;
	      var/*float*/ totalFlexible = 0;
	      var/*int*/ nonFlexibleChildrenCount = 0;

	      // Use the line loop to position children in the main axis for as long
	      // as they are using a simple stacking behaviour. Children that are
	      // immediately stacked in the initial loop will not be touched again
	      // in <Loop C>.
	      var/*bool*/ isSimpleStackMain =
	          (isMainDimDefined && justifyContent === CSS_JUSTIFY_FLEX_START) ||
	          (!isMainDimDefined && justifyContent !== CSS_JUSTIFY_CENTER);
	      var/*int*/ firstComplexMain = (isSimpleStackMain ? childCount : startLine);

	      // Use the initial line loop to position children in the cross axis for
	      // as long as they are relatively positioned with alignment STRETCH or
	      // FLEX_START. Children that are immediately stacked in the initial loop
	      // will not be touched again in <Loop D>.
	      var/*bool*/ isSimpleStackCross = true;
	      var/*int*/ firstComplexCross = childCount;

	      var/*css_node_t**/ firstFlexChild = null;
	      var/*css_node_t**/ currentFlexChild = null;

	      var/*float*/ mainDim = leadingPaddingAndBorderMain;
	      var/*float*/ crossDim = 0;

	      var/*float*/ maxWidth;
	      for (i = startLine; i < childCount; ++i) {
	        child = node.children[i];
	        child.lineIndex = linesCount;

	        child.nextAbsoluteChild = null;
	        child.nextFlexChild = null;

	        var/*css_align_t*/ alignItem = getAlignItem(node, child);

	        // Pre-fill cross axis dimensions when the child is using stretch before
	        // we call the recursive layout pass
	        if (alignItem === CSS_ALIGN_STRETCH &&
	            getPositionType(child) === CSS_POSITION_RELATIVE &&
	            isCrossDimDefined &&
	            !isDimDefined(child, crossAxis)) {
	          child.layout[dim[crossAxis]] = fmaxf(
	            boundAxis(child, crossAxis, node.layout[dim[crossAxis]] -
	              paddingAndBorderAxisCross - getMarginAxis(child, crossAxis)),
	            // You never want to go smaller than padding
	            getPaddingAndBorderAxis(child, crossAxis)
	          );
	        } else if (getPositionType(child) === CSS_POSITION_ABSOLUTE) {
	          // Store a private linked list of absolutely positioned children
	          // so that we can efficiently traverse them later.
	          if (firstAbsoluteChild === null) {
	            firstAbsoluteChild = child;
	          }
	          if (currentAbsoluteChild !== null) {
	            currentAbsoluteChild.nextAbsoluteChild = child;
	          }
	          currentAbsoluteChild = child;

	          // Pre-fill dimensions when using absolute position and both offsets for the axis are defined (either both
	          // left and right or top and bottom).
	          for (ii = 0; ii < 2; ii++) {
	            axis = (ii !== 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;
	            if (!isUndefined(node.layout[dim[axis]]) &&
	                !isDimDefined(child, axis) &&
	                isPosDefined(child, leading[axis]) &&
	                isPosDefined(child, trailing[axis])) {
	              child.layout[dim[axis]] = fmaxf(
	                boundAxis(child, axis, node.layout[dim[axis]] -
	                  getPaddingAndBorderAxis(node, axis) -
	                  getMarginAxis(child, axis) -
	                  getPosition(child, leading[axis]) -
	                  getPosition(child, trailing[axis])),
	                // You never want to go smaller than padding
	                getPaddingAndBorderAxis(child, axis)
	              );
	            }
	          }
	        }

	        var/*float*/ nextContentDim = 0;

	        // It only makes sense to consider a child flexible if we have a computed
	        // dimension for the node.
	        if (isMainDimDefined && isFlex(child)) {
	          flexibleChildrenCount++;
	          totalFlexible += child.style.flex;

	          // Store a private linked list of flexible children so that we can
	          // efficiently traverse them later.
	          if (firstFlexChild === null) {
	            firstFlexChild = child;
	          }
	          if (currentFlexChild !== null) {
	            currentFlexChild.nextFlexChild = child;
	          }
	          currentFlexChild = child;

	          // Even if we don't know its exact size yet, we already know the padding,
	          // border and margin. We'll use this partial information, which represents
	          // the smallest possible size for the child, to compute the remaining
	          // available space.
	          nextContentDim = getPaddingAndBorderAxis(child, mainAxis) +
	            getMarginAxis(child, mainAxis);

	        } else {
	          maxWidth = CSS_UNDEFINED;
	          if (!isMainRowDirection) {
	            if (isDimDefined(node, resolvedRowAxis)) {
	              maxWidth = node.layout[dim[resolvedRowAxis]] -
	                paddingAndBorderAxisResolvedRow;
	            } else {
	              maxWidth = parentMaxWidth -
	                getMarginAxis(node, resolvedRowAxis) -
	                paddingAndBorderAxisResolvedRow;
	            }
	          }

	          // This is the main recursive call. We layout non flexible children.
	          if (alreadyComputedNextLayout === 0) {
	            layoutNode(/*(java)!layoutContext, */child, maxWidth, direction);
	          }

	          // Absolute positioned elements do not take part of the layout, so we
	          // don't use them to compute mainContentDim
	          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
	            nonFlexibleChildrenCount++;
	            // At this point we know the final size and margin of the element.
	            nextContentDim = getDimWithMargin(child, mainAxis);
	          }
	        }

	        // The element we are about to add would make us go to the next line
	        if (isNodeFlexWrap &&
	            isMainDimDefined &&
	            mainContentDim + nextContentDim > definedMainDim &&
	            // If there's only one element, then it's bigger than the content
	            // and needs its own line
	            i !== startLine) {
	          nonFlexibleChildrenCount--;
	          alreadyComputedNextLayout = 1;
	          break;
	        }

	        // Disable simple stacking in the main axis for the current line as
	        // we found a non-trivial child. The remaining children will be laid out
	        // in <Loop C>.
	        if (isSimpleStackMain &&
	            (getPositionType(child) !== CSS_POSITION_RELATIVE || isFlex(child))) {
	          isSimpleStackMain = false;
	          firstComplexMain = i;
	        }

	        // Disable simple stacking in the cross axis for the current line as
	        // we found a non-trivial child. The remaining children will be laid out
	        // in <Loop D>.
	        if (isSimpleStackCross &&
	            (getPositionType(child) !== CSS_POSITION_RELATIVE ||
	                (alignItem !== CSS_ALIGN_STRETCH && alignItem !== CSS_ALIGN_FLEX_START) ||
	                isUndefined(child.layout[dim[crossAxis]]))) {
	          isSimpleStackCross = false;
	          firstComplexCross = i;
	        }

	        if (isSimpleStackMain) {
	          child.layout[pos[mainAxis]] += mainDim;
	          if (isMainDimDefined) {
	            setTrailingPosition(node, child, mainAxis);
	          }

	          mainDim += getDimWithMargin(child, mainAxis);
	          crossDim = fmaxf(crossDim, boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis)));
	        }

	        if (isSimpleStackCross) {
	          child.layout[pos[crossAxis]] += linesCrossDim + leadingPaddingAndBorderCross;
	          if (isCrossDimDefined) {
	            setTrailingPosition(node, child, crossAxis);
	          }
	        }

	        alreadyComputedNextLayout = 0;
	        mainContentDim += nextContentDim;
	        endLine = i + 1;
	      }

	      // <Loop B> Layout flexible children and allocate empty space

	      // In order to position the elements in the main axis, we have two
	      // controls. The space between the beginning and the first element
	      // and the space between each two elements.
	      var/*float*/ leadingMainDim = 0;
	      var/*float*/ betweenMainDim = 0;

	      // The remaining available space that needs to be allocated
	      var/*float*/ remainingMainDim = 0;
	      if (isMainDimDefined) {
	        remainingMainDim = definedMainDim - mainContentDim;
	      } else {
	        remainingMainDim = fmaxf(mainContentDim, 0) - mainContentDim;
	      }

	      // If there are flexible children in the mix, they are going to fill the
	      // remaining space
	      if (flexibleChildrenCount !== 0) {
	        var/*float*/ flexibleMainDim = remainingMainDim / totalFlexible;
	        var/*float*/ baseMainDim;
	        var/*float*/ boundMainDim;

	        // If the flex share of remaining space doesn't meet min/max bounds,
	        // remove this child from flex calculations.
	        currentFlexChild = firstFlexChild;
	        while (currentFlexChild !== null) {
	          baseMainDim = flexibleMainDim * currentFlexChild.style.flex +
	              getPaddingAndBorderAxis(currentFlexChild, mainAxis);
	          boundMainDim = boundAxis(currentFlexChild, mainAxis, baseMainDim);

	          if (baseMainDim !== boundMainDim) {
	            remainingMainDim -= boundMainDim;
	            totalFlexible -= currentFlexChild.style.flex;
	          }

	          currentFlexChild = currentFlexChild.nextFlexChild;
	        }
	        flexibleMainDim = remainingMainDim / totalFlexible;

	        // The non flexible children can overflow the container, in this case
	        // we should just assume that there is no space available.
	        if (flexibleMainDim < 0) {
	          flexibleMainDim = 0;
	        }

	        currentFlexChild = firstFlexChild;
	        while (currentFlexChild !== null) {
	          // At this point we know the final size of the element in the main
	          // dimension
	          currentFlexChild.layout[dim[mainAxis]] = boundAxis(currentFlexChild, mainAxis,
	            flexibleMainDim * currentFlexChild.style.flex +
	                getPaddingAndBorderAxis(currentFlexChild, mainAxis)
	          );

	          maxWidth = CSS_UNDEFINED;
	          if (isDimDefined(node, resolvedRowAxis)) {
	            maxWidth = node.layout[dim[resolvedRowAxis]] -
	              paddingAndBorderAxisResolvedRow;
	          } else if (!isMainRowDirection) {
	            maxWidth = parentMaxWidth -
	              getMarginAxis(node, resolvedRowAxis) -
	              paddingAndBorderAxisResolvedRow;
	          }

	          // And we recursively call the layout algorithm for this child
	          layoutNode(/*(java)!layoutContext, */currentFlexChild, maxWidth, direction);

	          child = currentFlexChild;
	          currentFlexChild = currentFlexChild.nextFlexChild;
	          child.nextFlexChild = null;
	        }

	      // We use justifyContent to figure out how to allocate the remaining
	      // space available
	      } else if (justifyContent !== CSS_JUSTIFY_FLEX_START) {
	        if (justifyContent === CSS_JUSTIFY_CENTER) {
	          leadingMainDim = remainingMainDim / 2;
	        } else if (justifyContent === CSS_JUSTIFY_FLEX_END) {
	          leadingMainDim = remainingMainDim;
	        } else if (justifyContent === CSS_JUSTIFY_SPACE_BETWEEN) {
	          remainingMainDim = fmaxf(remainingMainDim, 0);
	          if (flexibleChildrenCount + nonFlexibleChildrenCount - 1 !== 0) {
	            betweenMainDim = remainingMainDim /
	              (flexibleChildrenCount + nonFlexibleChildrenCount - 1);
	          } else {
	            betweenMainDim = 0;
	          }
	        } else if (justifyContent === CSS_JUSTIFY_SPACE_AROUND) {
	          // Space on the edges is half of the space between elements
	          betweenMainDim = remainingMainDim /
	            (flexibleChildrenCount + nonFlexibleChildrenCount);
	          leadingMainDim = betweenMainDim / 2;
	        }
	      }

	      // <Loop C> Position elements in the main axis and compute dimensions

	      // At this point, all the children have their dimensions set. We need to
	      // find their position. In order to do that, we accumulate data in
	      // variables that are also useful to compute the total dimensions of the
	      // container!
	      mainDim += leadingMainDim;

	      for (i = firstComplexMain; i < endLine; ++i) {
	        child = node.children[i];

	        if (getPositionType(child) === CSS_POSITION_ABSOLUTE &&
	            isPosDefined(child, leading[mainAxis])) {
	          // In case the child is position absolute and has left/top being
	          // defined, we override the position to whatever the user said
	          // (and margin/border).
	          child.layout[pos[mainAxis]] = getPosition(child, leading[mainAxis]) +
	            getLeadingBorder(node, mainAxis) +
	            getLeadingMargin(child, mainAxis);
	        } else {
	          // If the child is position absolute (without top/left) or relative,
	          // we put it at the current accumulated offset.
	          child.layout[pos[mainAxis]] += mainDim;

	          // Define the trailing position accordingly.
	          if (isMainDimDefined) {
	            setTrailingPosition(node, child, mainAxis);
	          }

	          // Now that we placed the element, we need to update the variables
	          // We only need to do that for relative elements. Absolute elements
	          // do not take part in that phase.
	          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
	            // The main dimension is the sum of all the elements dimension plus
	            // the spacing.
	            mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);
	            // The cross dimension is the max of the elements dimension since there
	            // can only be one element in that cross dimension.
	            crossDim = fmaxf(crossDim, boundAxis(child, crossAxis, getDimWithMargin(child, crossAxis)));
	          }
	        }
	      }

	      var/*float*/ containerCrossAxis = node.layout[dim[crossAxis]];
	      if (!isCrossDimDefined) {
	        containerCrossAxis = fmaxf(
	          // For the cross dim, we add both sides at the end because the value
	          // is aggregate via a max function. Intermediate negative values
	          // can mess this computation otherwise
	          boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross),
	          paddingAndBorderAxisCross
	        );
	      }

	      // <Loop D> Position elements in the cross axis
	      for (i = firstComplexCross; i < endLine; ++i) {
	        child = node.children[i];

	        if (getPositionType(child) === CSS_POSITION_ABSOLUTE &&
	            isPosDefined(child, leading[crossAxis])) {
	          // In case the child is absolutely positionned and has a
	          // top/left/bottom/right being set, we override all the previously
	          // computed positions to set it correctly.
	          child.layout[pos[crossAxis]] = getPosition(child, leading[crossAxis]) +
	            getLeadingBorder(node, crossAxis) +
	            getLeadingMargin(child, crossAxis);

	        } else {
	          var/*float*/ leadingCrossDim = leadingPaddingAndBorderCross;

	          // For a relative children, we're either using alignItems (parent) or
	          // alignSelf (child) in order to determine the position in the cross axis
	          if (getPositionType(child) === CSS_POSITION_RELATIVE) {
	            /*eslint-disable */
	            // This variable is intentionally re-defined as the code is transpiled to a block scope language
	            var/*css_align_t*/ alignItem = getAlignItem(node, child);
	            /*eslint-enable */
	            if (alignItem === CSS_ALIGN_STRETCH) {
	              // You can only stretch if the dimension has not already been set
	              // previously.
	              if (isUndefined(child.layout[dim[crossAxis]])) {
	                child.layout[dim[crossAxis]] = fmaxf(
	                  boundAxis(child, crossAxis, containerCrossAxis -
	                    paddingAndBorderAxisCross - getMarginAxis(child, crossAxis)),
	                  // You never want to go smaller than padding
	                  getPaddingAndBorderAxis(child, crossAxis)
	                );
	              }
	            } else if (alignItem !== CSS_ALIGN_FLEX_START) {
	              // The remaining space between the parent dimensions+padding and child
	              // dimensions+margin.
	              var/*float*/ remainingCrossDim = containerCrossAxis -
	                paddingAndBorderAxisCross - getDimWithMargin(child, crossAxis);

	              if (alignItem === CSS_ALIGN_CENTER) {
	                leadingCrossDim += remainingCrossDim / 2;
	              } else { // CSS_ALIGN_FLEX_END
	                leadingCrossDim += remainingCrossDim;
	              }
	            }
	          }

	          // And we apply the position
	          child.layout[pos[crossAxis]] += linesCrossDim + leadingCrossDim;

	          // Define the trailing position accordingly.
	          if (isCrossDimDefined) {
	            setTrailingPosition(node, child, crossAxis);
	          }
	        }
	      }

	      linesCrossDim += crossDim;
	      linesMainDim = fmaxf(linesMainDim, mainDim);
	      linesCount += 1;
	      startLine = endLine;
	    }

	    // <Loop E>
	    //
	    // Note(prenaux): More than one line, we need to layout the crossAxis
	    // according to alignContent.
	    //
	    // Note that we could probably remove <Loop D> and handle the one line case
	    // here too, but for the moment this is safer since it won't interfere with
	    // previously working code.
	    //
	    // See specs:
	    // http://www.w3.org/TR/2012/CR-css3-flexbox-20120918/#layout-algorithm
	    // section 9.4
	    //
	    if (linesCount > 1 && isCrossDimDefined) {
	      var/*float*/ nodeCrossAxisInnerSize = node.layout[dim[crossAxis]] -
	          paddingAndBorderAxisCross;
	      var/*float*/ remainingAlignContentDim = nodeCrossAxisInnerSize - linesCrossDim;

	      var/*float*/ crossDimLead = 0;
	      var/*float*/ currentLead = leadingPaddingAndBorderCross;

	      var/*css_align_t*/ alignContent = getAlignContent(node);
	      if (alignContent === CSS_ALIGN_FLEX_END) {
	        currentLead += remainingAlignContentDim;
	      } else if (alignContent === CSS_ALIGN_CENTER) {
	        currentLead += remainingAlignContentDim / 2;
	      } else if (alignContent === CSS_ALIGN_STRETCH) {
	        if (nodeCrossAxisInnerSize > linesCrossDim) {
	          crossDimLead = (remainingAlignContentDim / linesCount);
	        }
	      }

	      var/*int*/ endIndex = 0;
	      for (i = 0; i < linesCount; ++i) {
	        var/*int*/ startIndex = endIndex;

	        // compute the line's height and find the endIndex
	        var/*float*/ lineHeight = 0;
	        for (ii = startIndex; ii < childCount; ++ii) {
	          child = node.children[ii];
	          if (getPositionType(child) !== CSS_POSITION_RELATIVE) {
	            continue;
	          }
	          if (child.lineIndex !== i) {
	            break;
	          }
	          if (!isUndefined(child.layout[dim[crossAxis]])) {
	            lineHeight = fmaxf(
	              lineHeight,
	              child.layout[dim[crossAxis]] + getMarginAxis(child, crossAxis)
	            );
	          }
	        }
	        endIndex = ii;
	        lineHeight += crossDimLead;

	        for (ii = startIndex; ii < endIndex; ++ii) {
	          child = node.children[ii];
	          if (getPositionType(child) !== CSS_POSITION_RELATIVE) {
	            continue;
	          }

	          var/*css_align_t*/ alignContentAlignItem = getAlignItem(node, child);
	          if (alignContentAlignItem === CSS_ALIGN_FLEX_START) {
	            child.layout[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
	          } else if (alignContentAlignItem === CSS_ALIGN_FLEX_END) {
	            child.layout[pos[crossAxis]] = currentLead + lineHeight - getTrailingMargin(child, crossAxis) - child.layout[dim[crossAxis]];
	          } else if (alignContentAlignItem === CSS_ALIGN_CENTER) {
	            var/*float*/ childHeight = child.layout[dim[crossAxis]];
	            child.layout[pos[crossAxis]] = currentLead + (lineHeight - childHeight) / 2;
	          } else if (alignContentAlignItem === CSS_ALIGN_STRETCH) {
	            child.layout[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
	            // TODO(prenaux): Correctly set the height of items with undefined
	            //                (auto) crossAxis dimension.
	          }
	        }

	        currentLead += lineHeight;
	      }
	    }

	    var/*bool*/ needsMainTrailingPos = false;
	    var/*bool*/ needsCrossTrailingPos = false;

	    // If the user didn't specify a width or height, and it has not been set
	    // by the container, then we set it via the children.
	    if (!isMainDimDefined) {
	      node.layout[dim[mainAxis]] = fmaxf(
	        // We're missing the last padding at this point to get the final
	        // dimension
	        boundAxis(node, mainAxis, linesMainDim + getTrailingPaddingAndBorder(node, mainAxis)),
	        // We can never assign a width smaller than the padding and borders
	        paddingAndBorderAxisMain
	      );

	      if (mainAxis === CSS_FLEX_DIRECTION_ROW_REVERSE ||
	          mainAxis === CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
	        needsMainTrailingPos = true;
	      }
	    }

	    if (!isCrossDimDefined) {
	      node.layout[dim[crossAxis]] = fmaxf(
	        // For the cross dim, we add both sides at the end because the value
	        // is aggregate via a max function. Intermediate negative values
	        // can mess this computation otherwise
	        boundAxis(node, crossAxis, linesCrossDim + paddingAndBorderAxisCross),
	        paddingAndBorderAxisCross
	      );

	      if (crossAxis === CSS_FLEX_DIRECTION_ROW_REVERSE ||
	          crossAxis === CSS_FLEX_DIRECTION_COLUMN_REVERSE) {
	        needsCrossTrailingPos = true;
	      }
	    }

	    // <Loop F> Set trailing position if necessary
	    if (needsMainTrailingPos || needsCrossTrailingPos) {
	      for (i = 0; i < childCount; ++i) {
	        child = node.children[i];

	        if (needsMainTrailingPos) {
	          setTrailingPosition(node, child, mainAxis);
	        }

	        if (needsCrossTrailingPos) {
	          setTrailingPosition(node, child, crossAxis);
	        }
	      }
	    }

	    // <Loop G> Calculate dimensions for absolutely positioned elements
	    currentAbsoluteChild = firstAbsoluteChild;
	    while (currentAbsoluteChild !== null) {
	      // Pre-fill dimensions when using absolute position and both offsets for
	      // the axis are defined (either both left and right or top and bottom).
	      for (ii = 0; ii < 2; ii++) {
	        axis = (ii !== 0) ? CSS_FLEX_DIRECTION_ROW : CSS_FLEX_DIRECTION_COLUMN;

	        if (!isUndefined(node.layout[dim[axis]]) &&
	            !isDimDefined(currentAbsoluteChild, axis) &&
	            isPosDefined(currentAbsoluteChild, leading[axis]) &&
	            isPosDefined(currentAbsoluteChild, trailing[axis])) {
	          currentAbsoluteChild.layout[dim[axis]] = fmaxf(
	            boundAxis(currentAbsoluteChild, axis, node.layout[dim[axis]] -
	              getBorderAxis(node, axis) -
	              getMarginAxis(currentAbsoluteChild, axis) -
	              getPosition(currentAbsoluteChild, leading[axis]) -
	              getPosition(currentAbsoluteChild, trailing[axis])
	            ),
	            // You never want to go smaller than padding
	            getPaddingAndBorderAxis(currentAbsoluteChild, axis)
	          );
	        }

	        if (isPosDefined(currentAbsoluteChild, trailing[axis]) &&
	            !isPosDefined(currentAbsoluteChild, leading[axis])) {
	          currentAbsoluteChild.layout[leading[axis]] =
	            node.layout[dim[axis]] -
	            currentAbsoluteChild.layout[dim[axis]] -
	            getPosition(currentAbsoluteChild, trailing[axis]);
	        }
	      }

	      child = currentAbsoluteChild;
	      currentAbsoluteChild = currentAbsoluteChild.nextAbsoluteChild;
	      child.nextAbsoluteChild = null;
	    }
	  }

	  function layoutNode(node, parentMaxWidth, parentDirection) {
	    node.shouldUpdate = true;

	    var direction = node.style.direction || CSS_DIRECTION_LTR;
	    var skipLayout =
	      !node.isDirty &&
	      node.lastLayout &&
	      node.lastLayout.requestedHeight === node.layout.height &&
	      node.lastLayout.requestedWidth === node.layout.width &&
	      node.lastLayout.parentMaxWidth === parentMaxWidth &&
	      node.lastLayout.direction === direction;

	    if (skipLayout) {
	      node.layout.width = node.lastLayout.width;
	      node.layout.height = node.lastLayout.height;
	      node.layout.top = node.lastLayout.top;
	      node.layout.left = node.lastLayout.left;
	    } else {
	      if (!node.lastLayout) {
	        node.lastLayout = {};
	      }

	      node.lastLayout.requestedWidth = node.layout.width;
	      node.lastLayout.requestedHeight = node.layout.height;
	      node.lastLayout.parentMaxWidth = parentMaxWidth;
	      node.lastLayout.direction = direction;

	      // Reset child layouts
	      node.children.forEach(function(child) {
	        child.layout.width = undefined;
	        child.layout.height = undefined;
	        child.layout.top = 0;
	        child.layout.left = 0;
	      });

	      layoutNodeImpl(node, parentMaxWidth, parentDirection);

	      node.lastLayout.width = node.layout.width;
	      node.lastLayout.height = node.layout.height;
	      node.lastLayout.top = node.layout.top;
	      node.lastLayout.left = node.layout.left;
	    }
	  }

	  return {
	    layoutNodeImpl: layoutNodeImpl,
	    computeLayout: layoutNode,
	    fillNodes: fillNodes
	  };
	})();

	// This module export is only used for the purposes of unit testing this file. When
	// the library is packaged this file is included within css-layout.js which forms
	// the public API.
	if (typeof exports === 'object') {
	  module.exports = computeLayout;
	}


	  return function(node) {
	    /*eslint-disable */
	    // disabling ESLint because this code relies on the above include
	    computeLayout.fillNodes(node);
	    computeLayout.computeLayout(node);
	    /*eslint-enable */
	  };
	}));
	});

	var computeLayout = (cssLayout && typeof cssLayout === 'object' && 'default' in cssLayout ? cssLayout['default'] : cssLayout);

	function ownerSVGElement(node) {
	    while (node.ownerSVGElement) {
	        node = node.ownerSVGElement;
	    }
	    return node;
	}

	// parses the style attribute, converting it into a JavaScript object
	function parseStyle(style) {
	    if (!style) {
	        return {};
	    }
	    var properties = style.split(';');
	    var json = {};
	    properties.forEach(function(property) {
	        var components = property.split(':');
	        if (components.length === 2) {
	            var name = components[0].trim();
	            var value = components[1].trim();
	            json[name] = isNaN(value) ? value : Number(value);
	        }
	    });
	    return json;
	}

	// creates the structure required by the layout engine
	function createNodes(el) {
	    function getChildNodes() {
	        var children = [];
	        for (var i = 0; i < el.childNodes.length; i++) {
	            var child = el.childNodes[i];
	            if (child.nodeType === 1) {
	                if (child.getAttribute('layout-style')) {
	                    children.push(createNodes(child));
	                }
	            }
	        }
	        return children;
	    }
	    return {
	        style: parseStyle(el.getAttribute('layout-style')),
	        children: getChildNodes(el),
	        element: el
	    };
	}

	// takes the result of layout and applied it to the SVG elements
	function applyLayout(node, subtree) {
	    // don't set layout-width/height on layout root node
	    if (subtree) {
	        node.element.setAttribute('layout-width', node.layout.width);
	        node.element.setAttribute('layout-height', node.layout.height);
	    }

	    node.element.setAttribute('layout-x', node.layout.left);
	    node.element.setAttribute('layout-y', node.layout.top);

	    var rectOrSvg = node.element.nodeName.match(/(?:svg|rect)/i);

	    //for svg / rect set the dimensions via width/height properties
	    if (rectOrSvg) {
	        node.element.setAttribute('width', node.layout.width);
	        node.element.setAttribute('height', node.layout.height);
	    }

	    //for non-root svg / rect set the offset via x/y properties
	    if (rectOrSvg && subtree) {
	        node.element.setAttribute('x', node.layout.left);
	        node.element.setAttribute('y', node.layout.top);
	    }

	    // for all other non-root elements apply a transform
	    if (!rectOrSvg && subtree) {
	        node.element.setAttribute('transform',
	            'translate(' + node.layout.left + ', ' + node.layout.top + ')');
	    }

	    node.children.forEach(function(childNode) {
	        applyLayout(childNode, true);
	    });
	}

	function computeDimensions(node) {
	    if (node.hasAttribute('layout-width') && node.hasAttribute('layout-height')) {
	        return {
	            width: Number(node.getAttribute('layout-width')),
	            height: Number(node.getAttribute('layout-height'))
	        };
	    } else {
	        return innerDimensions(node);
	    }
	}

	function computePosition(node) {
	    if (node.hasAttribute('layout-x') && node.hasAttribute('layout-y')) {
	        return {
	            x: Number(node.getAttribute('layout-x')),
	            y: Number(node.getAttribute('layout-y'))
	        };
	    } else {
	        return { x: 0, y: 0 };
	    }
	}

	function layout$1(node) {
	    if (ownerSVGElement(node).__layout__ === 'suspended') {
	        return;
	    }

	    var dimensions = computeDimensions(node);

	    var position = computePosition(node);

	    // create the layout nodes
	    var layoutNodes = createNodes(node);

	    // set the dimensions / position of the root
	    layoutNodes.style.width = dimensions.width;
	    layoutNodes.style.height = dimensions.height;
	    layoutNodes.style.left = position.x;
	    layoutNodes.style.top = position.y;

	    // use the Facebook CSS goodness
	    computeLayout(layoutNodes);

	    // apply the resultant layout
	    applyLayout(layoutNodes);
	}

	function layoutSuspended(x) {
	    if (!arguments.length) {
	        return Boolean(ownerSVGElement(this.node()).__layout__);
	    }
	    return this.each(function() {
	        ownerSVGElement(this).__layout__ = x ? 'suspended' : '';
	    });
	}

	d3.selection.prototype.layoutSuspended = layoutSuspended;
	d3.transition.prototype.layoutSuspended = layoutSuspended;

	function layoutSelection(name, value) {
	    var argsLength = arguments.length;

	    // For layout(string), return the lyout value for the first node
	    if (argsLength === 1 && typeof name === 'string') {
	        var node = this.node();
	        return Number(node.getAttribute('layout-' + name));
	    }

	    // for all other invocations, iterate over each item in the selection
	    return this.each(function() {
	        if (argsLength === 2) {
	            if (typeof name !== 'string') {
	                // layout(number, number) - sets the width and height and performs layout
	                this.setAttribute('layout-width', name);
	                this.setAttribute('layout-height', value);
	                layout$1(this);
	            } else {
	                // layout(name, value) - sets a layout- attribute
	                this.setAttribute('layout-style', name + ':' + value);
	            }
	        } else if (argsLength === 1) {
	            if (typeof name !== 'string') {
	                // layout(object) - sets the layout-style property to the given object
	                var currentStyle = parseStyle(this.getAttribute('layout-style'));
	                var styleDiff = name;
	                Object.keys(styleDiff)
	                    .forEach(function(property) {
	                        currentStyle[property] = styleDiff[property];
	                    });
	                var layoutCss = Object.keys(currentStyle)
	                    .map(function(property) {
	                        return property + ':' + currentStyle[property];
	                    })
	                    .join(';');
	                this.setAttribute('layout-style', layoutCss);
	            }
	        } else if (argsLength === 0) {
	            // layout() - executes layout
	            layout$1(this);
	        }
	    });
	}

	d3.selection.prototype.layout = layoutSelection;
	d3.transition.prototype.layout = layoutSelection;

	// Needs to be defined like this so that the grunt task can update it
	var version = 'development';

	var fc = {
	    annotation: annotation,
	    chart: chart$2,
	    data: data$1,
	    indicator: indicator,
	    scale: scale,
	    series: series,
	    svg: svg,
	    tool: tool,
	    util: util$1,
	    version: version,
	    layout: layout$2
	};

	var id = 0;
	function uid() {
	    return ++id;
	}

	var renderedOnce = false;

	function layout(containers, charts) {

	    function getSecondaryContainer(chartIndex) {
	        return containers.secondaries.filter(function(d, index) { return index === chartIndex; });
	    }

	    var secondaryChartsShown = 0;
	    for (var j = 0; j < charts.secondaries.length; j++) {
	        if (charts.secondaries[j]) {
	            secondaryChartsShown++;
	        }
	    }
	    containers.secondaries
	        .filter(function(d, index) { return index < secondaryChartsShown; })
	        .style('flex', '1');
	    containers.secondaries
	        .filter(function(d, index) { return index >= secondaryChartsShown; })
	        .style('flex', '0');
	    containers.overlaySecondaries
	        .filter(function(d, index) { return index < secondaryChartsShown; })
	        .style('flex', '1');
	    containers.overlaySecondaries
	        .filter(function(d, index) { return index >= secondaryChartsShown; })
	        .style('flex', '0');

	    var headRowHeight = parseInt(containers.app.select('.head-row').style('height'), 10);
	    if (!renderedOnce) {
	        headRowHeight +=
	          parseInt(containers.app.select('.head-row').style('padding-top'), 10) +
	          parseInt(containers.app.select('.head-row').style('padding-bottom'), 10) +
	          parseInt(containers.app.select('.head-row').style('margin-bottom'), 10);
	        renderedOnce = true;
	    }

	    var useableHeight = fc.util.innerDimensions(containers.app.node()).height - headRowHeight;

	    containers.chartsAndOverlay.style('height', useableHeight + 'px');

	    charts.xAxis.dimensionChanged(containers.xAxis);
	    charts.navbar.dimensionChanged(containers.navbar);
	    charts.primary.dimensionChanged(containers.primary);
	    for (var i = 0; i < charts.secondaries.length; i++) {
	        charts.secondaries[i].option.dimensionChanged(getSecondaryContainer(i));
	    }
	}

	function trackingLatestData(domain, data) {
	    var latestViewedTime = d3.max(domain, function(d) { return d.getTime(); });
	    var latestDatumTime = d3.max(data, function(d) { return d.date.getTime(); });
	    return latestViewedTime === latestDatumTime;
	}

	function moveToLatest(domain, data, ratio) {
	    if (arguments.length < 3) {
	        ratio = 1;
	    }
	    var dataExtent = fc.util.extent()
	      .fields('date')(data);
	    var dataTimeExtent = (dataExtent[1].getTime() - dataExtent[0].getTime()) / 1000;
	    var domainTimes = domain.map(function(d) { return d.getTime(); });
	    var scaledDomainTimeDifference = ratio * (d3.max(domainTimes) - d3.min(domainTimes)) / 1000;
	    var scaledLiveDataDomain = scaledDomainTimeDifference < dataTimeExtent ?
	      [d3.time.second.offset(dataExtent[1], -scaledDomainTimeDifference), dataExtent[1]] : dataExtent;
	    return scaledLiveDataDomain;
	}

	function filterDataInDateRange(domain, data) {
	    var startDate = d3.min(domain, function(d) { return d.getTime(); });
	    var endDate = d3.max(domain, function(d) { return d.getTime(); });

	    var dataSortedByDate = data.sort(function(a, b) {
	        return a.date - b.date;
	    });

	    var bisector = d3.bisector(function(d) { return d.date; });
	    var filteredData = data.slice(
	      // Pad and clamp the bisector values to ensure extents can be calculated
	      Math.max(0, bisector.left(dataSortedByDate, startDate) - 1),
	      Math.min(bisector.right(dataSortedByDate, endDate) + 1, dataSortedByDate.length)
	    );
	    return filteredData;
	}

	function centerOnDate(domain, data, centerDate) {
	    var dataExtent = fc.util.extent()
	      .fields('date')(data);
	    var domainTimes = domain.map(function(d) { return d.getTime(); });
	    var domainTimeDifference = (d3.max(domainTimes) - d3.min(domainTimes)) / 1000;

	    if (centerDate.getTime() < dataExtent[0] || centerDate.getTime() > dataExtent[1]) {
	        return [new Date(d3.min(domainTimes)), new Date(d3.max(domainTimes))];
	    }

	    var centeredDataDomain = [d3.time.second.offset(centerDate, -domainTimeDifference / 2),
	        d3.time.second.offset(centerDate, domainTimeDifference / 2)];
	    var timeShift = 0;
	    if (centeredDataDomain[1].getTime() > dataExtent[1].getTime()) {
	        timeShift = (dataExtent[1].getTime() - centeredDataDomain[1].getTime()) / 1000;
	    } else if (centeredDataDomain[0].getTime() < dataExtent[0].getTime()) {
	        timeShift = (dataExtent[0].getTime() - centeredDataDomain[0].getTime()) / 1000;
	    }

	    return [d3.time.second.offset(centeredDataDomain[0], timeShift),
	        d3.time.second.offset(centeredDataDomain[1], timeShift)];
	}

	var domain = {
	    centerOnDate: centerOnDate,
	    filterDataInDateRange: filterDataInDateRange,
	    moveToLatest: moveToLatest,
	    trackingLatestData: trackingLatestData
	};

	var util = {
	    domain: domain,
	    layout: layout,
	    uid: uid
	};

	var event = {
	    crosshairChange: 'crosshairChange',
	    viewChange: 'viewChange',
	    newTrade: 'newTrade',
	    historicDataLoaded: 'historicDataLoaded',
	    historicFeedError: 'historicFeedError',
	    streamingFeedError: 'streamingFeedError',
	    streamingFeedClose: 'streamingFeedClose',
	    dataProductChange: 'dataProductChange',
	    dataPeriodChange: 'dataPeriodChange',
	    resetToLatest: 'resetToLatest',
	    clearAllPrimaryChartIndicatorsAndSecondaryCharts: 'clearAllPrimaryChartIndicatorsAndSecondaryCharts',
	    primaryChartSeriesChange: 'primaryChartSeriesChange',
	    primaryChartYValueAccessorChange: 'primaryChartYValueAccessorChange',
	    primaryChartIndicatorChange: 'primaryChartIndicatorChange',
	    secondaryChartChange: 'secondaryChartChange',
	    indicatorChange: 'indicatorChange',
	    notificationClose: 'notificationClose'
	};

	function zoomBehavior(width) {

	    var dispatch = d3.dispatch('zoom');

	    var zoomBehavior = d3.behavior.zoom();
	    var scale;

	    var allowPan = true;
	    var allowZoom = true;
	    var trackingLatest = true;

	    function controlPan(zoomExtent) {
	        // Don't pan off sides
	        if (zoomExtent[0] >= 0) {
	            return -zoomExtent[0];
	        } else if (zoomExtent[1] <= 0) {
	            return -zoomExtent[1];
	        }
	        return 0;
	    }

	    function controlZoom(zoomExtent) {
	        // If zooming, and about to pan off screen, do nothing
	        return (zoomExtent[0] > 0 && zoomExtent[1] < 0);
	    }

	    function translateXZoom(translation) {
	        var tx = zoomBehavior.translate()[0];
	        tx += translation;
	        zoomBehavior.translate([tx, 0]);
	    }

	    function resetBehaviour() {
	        zoomBehavior.translate([0, 0]);
	        zoomBehavior.scale(1);
	    }

	    function zoom(selection) {

	        var xExtent = fc.util.extent()
	          .fields('date')(selection.datum().data);

	        zoomBehavior.x(scale)
	          .on('zoom', function() {
	              var min = scale(xExtent[0]);
	              var max = scale(xExtent[1]);

	              var maxDomainViewed = controlZoom([min, max - width]);
	              var panningRestriction = controlPan([min, max - width]);
	              translateXZoom(panningRestriction);

	              var panned = (zoomBehavior.scale() === 1);
	              var zoomed = (zoomBehavior.scale() !== 1);

	              if ((panned && allowPan) || (zoomed && allowZoom)) {
	                  var domain = scale.domain();
	                  if (maxDomainViewed) {
	                      domain = xExtent;
	                  } else if (zoomed && trackingLatest) {
	                      domain = util.domain.moveToLatest(domain, selection.datum().data);
	                  }

	                  if (domain[0].getTime() !== domain[1].getTime()) {
	                      dispatch.zoom(domain);
	                  } else {
	                      // Ensure the user can't zoom-in infinitely, causing the chart to fail to render
	                      // #168, #411
	                      resetBehaviour();
	                  }
	              } else {
	                  resetBehaviour();
	              }
	          });

	        selection.call(zoomBehavior);
	    }

	    zoom.allowPan = function(x) {
	        if (!arguments.length) {
	            return allowPan;
	        }
	        allowPan = x;
	        return zoom;
	    };

	    zoom.allowZoom = function(x) {
	        if (!arguments.length) {
	            return allowZoom;
	        }
	        allowZoom = x;
	        return zoom;
	    };

	    zoom.trackingLatest = function(x) {
	        if (!arguments.length) {
	            return trackingLatest;
	        }
	        trackingLatest = x;
	        return zoom;
	    };

	    zoom.scale = function(x) {
	        if (!arguments.length) {
	            return scale;
	        }
	        scale = x;
	        return zoom;
	    };

	    d3.rebind(zoom, dispatch, 'on');

	    return zoom;
	}

	function base() {
	    var dispatch = d3.dispatch(event.viewChange);
	    var xScale = fc.scale.dateTime();
	    var yScale = d3.scale.linear();
	    var trackingLatest = true;
	    var yAxisWidth = 60;

	    var multi = fc.series.multi();
	    var chart = fc.chart.cartesian(xScale, yScale)
	      .plotArea(multi)
	      .xTicks(0)
	      .yOrient('right')
	      .margin({
	          top: 0,
	          left: 0,
	          bottom: 0,
	          right: yAxisWidth
	      });
	    var zoomWidth;

	    function secondary(selection) {
	        selection.each(function(data) {
	            var container = d3.select(this)
	              .call(chart);

	            var zoom = zoomBehavior(zoomWidth)
	              .scale(xScale)
	              .trackingLatest(trackingLatest)
	              .on('zoom', function(domain) {
	                  dispatch[event.viewChange](domain);
	              });

	            container.select('.plot-area-container')
	              .datum({data: selection.datum()})
	              .call(zoom);
	        });
	    }

	    secondary.trackingLatest = function(x) {
	        if (!arguments.length) {
	            return trackingLatest;
	        }
	        trackingLatest = x;
	        return secondary;
	    };

	    d3.rebind(secondary, dispatch, 'on');
	    d3.rebind(secondary, multi, 'series', 'mapping', 'decorate');
	    d3.rebind(secondary, chart, 'yTickValues', 'yTickFormat', 'yTicks', 'xDomain', 'yDomain');

	    secondary.dimensionChanged = function(container) {
	        zoomWidth = parseInt(container.style('width'), 10) - yAxisWidth;
	    };

	    return secondary;
	}

	function volume() {
	    var dispatch = d3.dispatch(event.viewChange);
	    var volumeBar = fc.series.bar()
	      .yValue(function(d) { return d.volume; });

	    var chart = base()
	      .series([volumeBar])
	      .yTicks(4)
	      .on(event.viewChange, function(domain) {
	          dispatch[event.viewChange](domain);
	      });

	    function volume(selection) {
	        selection.each(function(model) {
	            var paddedYExtent = fc.util.extent()
	                .fields('volume')
	                .pad(0.08)(model.data);
	            if (paddedYExtent[0] < 0) {
	                paddedYExtent[0] = 0;
	            }
	            chart.yTickFormat(model.product.volumeFormat)
	                .trackingLatest(model.trackingLatest)
	                .xDomain(model.viewDomain)
	                .yDomain(paddedYExtent);

	            selection.datum(model.data)
	                .call(chart);
	        });
	    }

	    d3.rebind(volume, dispatch, 'on');

	    volume.dimensionChanged = function(container) {
	        chart.dimensionChanged(container);
	    };

	    return volume;
	}

	function rsi() {
	    var dispatch = d3.dispatch(event.viewChange);
	    var renderer = fc.indicator.renderer.relativeStrengthIndex();
	    var algorithm = fc.indicator.algorithm.relativeStrengthIndex();
	    var tickValues = [renderer.lowerValue(), 50, renderer.upperValue()];

	    var chart = base()
	      .series([renderer])
	      .yTickValues(tickValues)
	      .on(event.viewChange, function(domain) {
	          dispatch[event.viewChange](domain);
	      });

	    function rsi(selection) {
	        var model = selection.datum();
	        algorithm(model.data);

	        chart.trackingLatest(model.trackingLatest)
	          .xDomain(model.viewDomain)
	          .yDomain([0, 100]);

	        selection.datum(model.data)
	          .call(chart);
	    }

	    d3.rebind(rsi, dispatch, 'on');

	    rsi.dimensionChanged = function(container) {
	        chart.dimensionChanged(container);
	    };

	    return rsi;
	}

	function macd() {
	    var dispatch = d3.dispatch(event.viewChange);
	    var zeroLine = fc.annotation.line()
	      .value(0)
	      .label('');
	    var renderer = fc.indicator.renderer.macd();
	    var algorithm = fc.indicator.algorithm.macd();

	    var chart = base()
	      .series([zeroLine, renderer])
	      .yTicks(5)
	      .mapping(function(series) {
	          return series === zeroLine ? [0] : this;
	      })
	      .decorate(function(g) {
	          g.enter()
	            .attr('class', function(d, i) {
	                return ['multi zero', 'multi'][i];
	            });
	      })
	      .on(event.viewChange, function(domain) {
	          dispatch[event.viewChange](domain);
	      });

	    function macd(selection) {
	        var model = selection.datum();
	        algorithm(model.data);

	        var paddedYExtent = fc.util.extent()
	            .fields('macd')
	            .symmetricalAbout(0)
	            .pad(0.08)(model.data.map(function(d) { return d.macd; }));
	        chart.trackingLatest(model.trackingLatest)
	          .xDomain(model.viewDomain)
	          .yDomain(paddedYExtent);

	        selection.datum(model.data)
	          .call(chart);
	    }

	    d3.rebind(macd, dispatch, 'on');

	    macd.dimensionChanged = function(container) {
	        chart.dimensionChanged(container);
	    };

	    return macd;
	}

	var secondary = {
	    base: base,
	    macd: macd,
	    rsi: rsi,
	    volume: volume
	};

	function xAxis() {
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

	    function xAxisChart(selection) {
	        var model = selection.datum();
	        xScale.domain(model.viewDomain);
	        preventTicksMoreFrequentThanPeriod(model.period);
	        selection.call(xAxis);
	    }

	    xAxisChart.dimensionChanged = function(container) {
	        xScale.range([0, parseInt(container.style('width'), 10)]);
	    };

	    return xAxisChart;
	}

	function option(displayString, valueString, option, icon, isPrimary) {
	    return {
	        displayString: displayString, // TODO: is 'displayName' better?
	        valueString: valueString, // TODO: is this an id?
	        option: option, // TODO: Ideally, remove.
	        isSelected: false,
	        icon: icon,
	        isPrimary: isPrimary
	    };
	}

	function candlestickSeries() {
	    var xScale = fc.scale.dateTime();
	    var yScale = d3.scale.linear();
	    var barWidth = fc.util.fractionalBarWidth(0.75);
	    var xValue = function(d, i) { return d.date; };
	    var xValueScaled = function(d, i) { return xScale(xValue(d, i)); };
	    var yLowValue = function(d) { return d.low; };
	    var yHighValue = function(d) { return d.high; };
	    var yCloseValue = function(d, i) { return d.close; };

	    var candlestickSvg = fc.svg.candlestick()
	      .x(function(d) { return xScale(d.date); })
	      .open(function(d) { return yScale(d.open); })
	      .high(function(d) { return yScale(yHighValue(d)); })
	      .low(function(d) { return yScale(yLowValue(d)); })
	      .close(function(d) { return yScale(d.close); });

	    var upDataJoin = fc.util.dataJoin()
	      .selector('path.up')
	      .element('path')
	      .attr('class', 'up');

	    var downDataJoin = fc.util.dataJoin()
	      .selector('path.down')
	      .element('path')
	      .attr('class', 'down');

	    var candlestick = function(selection) {
	        selection.each(function(data) {
	            candlestickSvg.width(barWidth(data.map(xValueScaled)));

	            var upData = data.filter(function(d) { return d.open < d.close; });
	            var downData = data.filter(function(d) { return d.open >= d.close; });

	            upDataJoin(this, [upData])
	              .attr('d', candlestickSvg);

	            downDataJoin(this, [downData])
	              .attr('d', candlestickSvg);
	        });
	    };

	    candlestick.xScale = function(x) {
	        if (!arguments.length) {
	            return xScale;
	        }
	        xScale = x;
	        return candlestick;
	    };
	    candlestick.yScale = function(x) {
	        if (!arguments.length) {
	            return yScale;
	        }
	        yScale = x;
	        return candlestick;
	    };
	    candlestick.xValue = function(x) {
	        if (!arguments.length) {
	            return xValue;
	        }
	        xValue = x;
	        return candlestick;
	    };
	    candlestick.yLowValue = function(x) {
	        if (!arguments.length) {
	            return yLowValue;
	        }
	        yLowValue = x;
	        return candlestick;
	    };
	    candlestick.yHighValue = function(x) {
	        if (!arguments.length) {
	            return yHighValue;
	        }
	        yHighValue = x;
	        return candlestick;
	    };
	    candlestick.yCloseValue = function(x) {
	        if (!arguments.length) {
	            return yCloseValue;
	        }
	        yCloseValue = x;
	        return candlestick;
	    };
	    candlestick.width = function(data) {
	        return barWidth(data.map(xValueScaled));
	    };

	    return candlestick;
	}

	function calculateCloseAxisTagPath(width, height) {
	    var h2 = height / 2;
	    return [
	        [0, 0],
	        [h2, -h2],
	        [width, -h2],
	        [width, h2],
	        [h2, h2],
	        [0, 0]
	    ];
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

	function getExtentAccessors(multiSeries) {
	    return multiSeries.reduce(function(extentAccessors, series) {
	        if (series.extentAccessor) {
	            return extentAccessors.concat(series.extentAccessor);
	        } else {
	            return extentAccessors;
	        }
	    }, []);
	}

	function primary() {

	    var yAxisWidth = 60;
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
	      .yTicks(5)
	      .xTicks(0);
	    var closeLine = fc.annotation.line()
	      .orient('horizontal')
	      .value(currentYValueAccessor)
	      .label('');
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
	      .yOrient('right')
	      .margin({
	          top: 0,
	          left: 0,
	          bottom: 0,
	          right: yAxisWidth
	      });

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
	        primaryChart.yTickFormat(model.product.priceFormat);
	        model.selectorsChanged = false;
	    }

	    function bandCrosshair(data) {
	        var width = currentSeries.option.width(data);

	        crosshair.decorate(function(selection) {
	            selection.classed('band hidden-xs hidden-sm', true);

	            selection.selectAll('.vertical > line')
	              .style('stroke-width', width);
	        });
	    }

	    function lineCrosshair(selection) {
	        selection.classed('band', false)
	            .classed('hidden-xs hidden-sm', true)
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
	        var model = selection.datum();

	        if (model.selectorsChanged) {
	            selectorsChanged(model);
	        }

	        primaryChart.xDomain(model.viewDomain);

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
	        primaryChart.yDomain(paddedYExtent);

	        // Find current tick values and add close price to this list, then set it explicitly below
	        var latestPrice = currentYValueAccessor(model.data[model.data.length - 1]);
	        var tickValues = produceAnnotatedTickValues(yScale, [latestPrice]);
	        primaryChart.yTickValues(tickValues)
	          .yDecorate(function(s) {
	              var closePriceTick = s.selectAll('.tick')
	                .filter(function(d) { return d === latestPrice; })
	                .classed('closeLine', true);

	              var calloutHeight = 18;
	              closePriceTick.select('path')
	                .attr('d', function(d) {
	                    return d3.svg.area()(calculateCloseAxisTagPath(yAxisWidth, calloutHeight));
	                });
	              closePriceTick.select('text')
	                .attr('transform', 'translate(' + calloutHeight / 2 + ',1)');
	          });

	        // Redraw
	        primaryChart.plotArea(multi);
	        selection.call(primaryChart);

	        var zoom = zoomBehavior(zoomWidth)
	          .scale(xScale)
	          .trackingLatest(model.trackingLatest)
	          .on('zoom', function(domain) {
	              dispatch[event.viewChange](domain);
	          });

	        selection.select('.plot-area')
	          .call(zoom);
	    }

	    d3.rebind(primary, dispatch, 'on');

	    // Call when the main layout is modified
	    primary.dimensionChanged = function(container) {
	        zoomWidth = parseInt(container.style('width'), 10) - yAxisWidth;
	    };

	    return primary;
	}

	var jquery = __commonjs(function (module) {
	/*!
	 * jQuery JavaScript Library v2.2.0
	 * http://jquery.com/
	 *
	 * Includes Sizzle.js
	 * http://sizzlejs.com/
	 *
	 * Copyright jQuery Foundation and other contributors
	 * Released under the MIT license
	 * http://jquery.org/license
	 *
	 * Date: 2016-01-08T20:02Z
	 */

	(function( global, factory ) {

		if ( typeof module === "object" && typeof module.exports === "object" ) {
			// For CommonJS and CommonJS-like environments where a proper `window`
			// is present, execute the factory and get jQuery.
			// For environments that do not have a `window` with a `document`
			// (such as Node.js), expose a factory as module.exports.
			// This accentuates the need for the creation of a real `window`.
			// e.g. var jQuery = require("jquery")(window);
			// See ticket #14549 for more info.
			module.exports = global.document ?
				factory( global, true ) :
				function( w ) {
					if ( !w.document ) {
						throw new Error( "jQuery requires a window with a document" );
					}
					return factory( w );
				};
		} else {
			factory( global );
		}

	// Pass this if window is not defined yet
	}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

	// Support: Firefox 18+
	// Can't be in strict mode, several libs including ASP.NET trace
	// the stack via arguments.caller.callee and Firefox dies if
	// you try to trace through "use strict" call chains. (#13335)
	//"use strict";
	var arr = [];

	var document = window.document;

	var slice = arr.slice;

	var concat = arr.concat;

	var push = arr.push;

	var indexOf = arr.indexOf;

	var class2type = {};

	var toString = class2type.toString;

	var hasOwn = class2type.hasOwnProperty;

	var support = {};



	var
		version = "2.2.0",

		// Define a local copy of jQuery
		jQuery = function( selector, context ) {

			// The jQuery object is actually just the init constructor 'enhanced'
			// Need init if jQuery is called (just allow error to be thrown if not included)
			return new jQuery.fn.init( selector, context );
		},

		// Support: Android<4.1
		// Make sure we trim BOM and NBSP
		rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

		// Matches dashed string for camelizing
		rmsPrefix = /^-ms-/,
		rdashAlpha = /-([\da-z])/gi,

		// Used by jQuery.camelCase as callback to replace()
		fcamelCase = function( all, letter ) {
			return letter.toUpperCase();
		};

	jQuery.fn = jQuery.prototype = {

		// The current version of jQuery being used
		jquery: version,

		constructor: jQuery,

		// Start with an empty selector
		selector: "",

		// The default length of a jQuery object is 0
		length: 0,

		toArray: function() {
			return slice.call( this );
		},

		// Get the Nth element in the matched element set OR
		// Get the whole matched element set as a clean array
		get: function( num ) {
			return num != null ?

				// Return just the one element from the set
				( num < 0 ? this[ num + this.length ] : this[ num ] ) :

				// Return all the elements in a clean array
				slice.call( this );
		},

		// Take an array of elements and push it onto the stack
		// (returning the new matched element set)
		pushStack: function( elems ) {

			// Build a new jQuery matched element set
			var ret = jQuery.merge( this.constructor(), elems );

			// Add the old object onto the stack (as a reference)
			ret.prevObject = this;
			ret.context = this.context;

			// Return the newly-formed element set
			return ret;
		},

		// Execute a callback for every element in the matched set.
		each: function( callback ) {
			return jQuery.each( this, callback );
		},

		map: function( callback ) {
			return this.pushStack( jQuery.map( this, function( elem, i ) {
				return callback.call( elem, i, elem );
			} ) );
		},

		slice: function() {
			return this.pushStack( slice.apply( this, arguments ) );
		},

		first: function() {
			return this.eq( 0 );
		},

		last: function() {
			return this.eq( -1 );
		},

		eq: function( i ) {
			var len = this.length,
				j = +i + ( i < 0 ? len : 0 );
			return this.pushStack( j >= 0 && j < len ? [ this[ j ] ] : [] );
		},

		end: function() {
			return this.prevObject || this.constructor();
		},

		// For internal use only.
		// Behaves like an Array's method, not like a jQuery method.
		push: push,
		sort: arr.sort,
		splice: arr.splice
	};

	jQuery.extend = jQuery.fn.extend = function() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[ 0 ] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if ( typeof target === "boolean" ) {
			deep = target;

			// Skip the boolean and the target
			target = arguments[ i ] || {};
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
			target = {};
		}

		// Extend jQuery itself if only one argument is passed
		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {

			// Only deal with non-null/undefined values
			if ( ( options = arguments[ i ] ) != null ) {

				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if ( deep && copy && ( jQuery.isPlainObject( copy ) ||
						( copyIsArray = jQuery.isArray( copy ) ) ) ) {

						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && jQuery.isArray( src ) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject( src ) ? src : {};
						}

						// Never move original objects, clone them
						target[ name ] = jQuery.extend( deep, clone, copy );

					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	};

	jQuery.extend( {

		// Unique for each copy of jQuery on the page
		expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

		// Assume jQuery is ready without the ready module
		isReady: true,

		error: function( msg ) {
			throw new Error( msg );
		},

		noop: function() {},

		isFunction: function( obj ) {
			return jQuery.type( obj ) === "function";
		},

		isArray: Array.isArray,

		isWindow: function( obj ) {
			return obj != null && obj === obj.window;
		},

		isNumeric: function( obj ) {

			// parseFloat NaNs numeric-cast false positives (null|true|false|"")
			// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
			// subtraction forces infinities to NaN
			// adding 1 corrects loss of precision from parseFloat (#15100)
			var realStringObj = obj && obj.toString();
			return !jQuery.isArray( obj ) && ( realStringObj - parseFloat( realStringObj ) + 1 ) >= 0;
		},

		isPlainObject: function( obj ) {

			// Not plain objects:
			// - Any object or value whose internal [[Class]] property is not "[object Object]"
			// - DOM nodes
			// - window
			if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
				return false;
			}

			if ( obj.constructor &&
					!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}

			// If the function hasn't returned already, we're confident that
			// |obj| is a plain object, created by {} or constructed with new Object
			return true;
		},

		isEmptyObject: function( obj ) {
			var name;
			for ( name in obj ) {
				return false;
			}
			return true;
		},

		type: function( obj ) {
			if ( obj == null ) {
				return obj + "";
			}

			// Support: Android<4.0, iOS<6 (functionish RegExp)
			return typeof obj === "object" || typeof obj === "function" ?
				class2type[ toString.call( obj ) ] || "object" :
				typeof obj;
		},

		// Evaluates a script in a global context
		globalEval: function( code ) {
			var script,
				indirect = eval;

			code = jQuery.trim( code );

			if ( code ) {

				// If the code includes a valid, prologue position
				// strict mode pragma, execute code by injecting a
				// script tag into the document.
				if ( code.indexOf( "use strict" ) === 1 ) {
					script = document.createElement( "script" );
					script.text = code;
					document.head.appendChild( script ).parentNode.removeChild( script );
				} else {

					// Otherwise, avoid the DOM node creation, insertion
					// and removal by using an indirect global eval

					indirect( code );
				}
			}
		},

		// Convert dashed to camelCase; used by the css and data modules
		// Support: IE9-11+
		// Microsoft forgot to hump their vendor prefix (#9572)
		camelCase: function( string ) {
			return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
		},

		nodeName: function( elem, name ) {
			return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
		},

		each: function( obj, callback ) {
			var length, i = 0;

			if ( isArrayLike( obj ) ) {
				length = obj.length;
				for ( ; i < length; i++ ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
						break;
					}
				}
			}

			return obj;
		},

		// Support: Android<4.1
		trim: function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

		// results is for internal usage only
		makeArray: function( arr, results ) {
			var ret = results || [];

			if ( arr != null ) {
				if ( isArrayLike( Object( arr ) ) ) {
					jQuery.merge( ret,
						typeof arr === "string" ?
						[ arr ] : arr
					);
				} else {
					push.call( ret, arr );
				}
			}

			return ret;
		},

		inArray: function( elem, arr, i ) {
			return arr == null ? -1 : indexOf.call( arr, elem, i );
		},

		merge: function( first, second ) {
			var len = +second.length,
				j = 0,
				i = first.length;

			for ( ; j < len; j++ ) {
				first[ i++ ] = second[ j ];
			}

			first.length = i;

			return first;
		},

		grep: function( elems, callback, invert ) {
			var callbackInverse,
				matches = [],
				i = 0,
				length = elems.length,
				callbackExpect = !invert;

			// Go through the array, only saving the items
			// that pass the validator function
			for ( ; i < length; i++ ) {
				callbackInverse = !callback( elems[ i ], i );
				if ( callbackInverse !== callbackExpect ) {
					matches.push( elems[ i ] );
				}
			}

			return matches;
		},

		// arg is for internal usage only
		map: function( elems, callback, arg ) {
			var length, value,
				i = 0,
				ret = [];

			// Go through the array, translating each of the items to their new values
			if ( isArrayLike( elems ) ) {
				length = elems.length;
				for ( ; i < length; i++ ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}

			// Go through every key on the object,
			} else {
				for ( i in elems ) {
					value = callback( elems[ i ], i, arg );

					if ( value != null ) {
						ret.push( value );
					}
				}
			}

			// Flatten any nested arrays
			return concat.apply( [], ret );
		},

		// A global GUID counter for objects
		guid: 1,

		// Bind a function to a context, optionally partially applying any
		// arguments.
		proxy: function( fn, context ) {
			var tmp, args, proxy;

			if ( typeof context === "string" ) {
				tmp = fn[ context ];
				context = fn;
				fn = tmp;
			}

			// Quick check to determine if target is callable, in the spec
			// this throws a TypeError, but we will just return undefined.
			if ( !jQuery.isFunction( fn ) ) {
				return undefined;
			}

			// Simulated bind
			args = slice.call( arguments, 2 );
			proxy = function() {
				return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
			};

			// Set the guid of unique handler to the same of original handler, so it can be removed
			proxy.guid = fn.guid = fn.guid || jQuery.guid++;

			return proxy;
		},

		now: Date.now,

		// jQuery.support is not used in Core but other projects attach their
		// properties to it so it needs to exist.
		support: support
	} );

	// JSHint would error on this code due to the Symbol not being defined in ES5.
	// Defining this global in .jshintrc would create a danger of using the global
	// unguarded in another place, it seems safer to just disable JSHint for these
	// three lines.
	/* jshint ignore: start */
	if ( typeof Symbol === "function" ) {
		jQuery.fn[ Symbol.iterator ] = arr[ Symbol.iterator ];
	}
	/* jshint ignore: end */

	// Populate the class2type map
	jQuery.each( "Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ),
	function( i, name ) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	} );

	function isArrayLike( obj ) {

		// Support: iOS 8.2 (not reproducible in simulator)
		// `in` check used to prevent JIT error (gh-2145)
		// hasOwn isn't used here due to false negatives
		// regarding Nodelist length in IE
		var length = !!obj && "length" in obj && obj.length,
			type = jQuery.type( obj );

		if ( type === "function" || jQuery.isWindow( obj ) ) {
			return false;
		}

		return type === "array" || length === 0 ||
			typeof length === "number" && length > 0 && ( length - 1 ) in obj;
	}
	var Sizzle =
	/*!
	 * Sizzle CSS Selector Engine v2.2.1
	 * http://sizzlejs.com/
	 *
	 * Copyright jQuery Foundation and other contributors
	 * Released under the MIT license
	 * http://jquery.org/license
	 *
	 * Date: 2015-10-17
	 */
	(function( window ) {

	var i,
		support,
		Expr,
		getText,
		isXML,
		tokenize,
		compile,
		select,
		outermostContext,
		sortInput,
		hasDuplicate,

		// Local document vars
		setDocument,
		document,
		docElem,
		documentIsHTML,
		rbuggyQSA,
		rbuggyMatches,
		matches,
		contains,

		// Instance-specific data
		expando = "sizzle" + 1 * new Date(),
		preferredDoc = window.document,
		dirruns = 0,
		done = 0,
		classCache = createCache(),
		tokenCache = createCache(),
		compilerCache = createCache(),
		sortOrder = function( a, b ) {
			if ( a === b ) {
				hasDuplicate = true;
			}
			return 0;
		},

		// General-purpose constants
		MAX_NEGATIVE = 1 << 31,

		// Instance methods
		hasOwn = ({}).hasOwnProperty,
		arr = [],
		pop = arr.pop,
		push_native = arr.push,
		push = arr.push,
		slice = arr.slice,
		// Use a stripped-down indexOf as it's faster than native
		// http://jsperf.com/thor-indexof-vs-for/5
		indexOf = function( list, elem ) {
			var i = 0,
				len = list.length;
			for ( ; i < len; i++ ) {
				if ( list[i] === elem ) {
					return i;
				}
			}
			return -1;
		},

		booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

		// Regular expressions

		// http://www.w3.org/TR/css3-selectors/#whitespace
		whitespace = "[\\x20\\t\\r\\n\\f]",

		// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
		identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

		// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
		attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
			// Operator (capture 2)
			"*([*^$|!~]?=)" + whitespace +
			// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
			"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
			"*\\]",

		pseudos = ":(" + identifier + ")(?:\\((" +
			// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
			// 1. quoted (capture 3; capture 4 or capture 5)
			"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
			// 2. simple (capture 6)
			"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
			// 3. anything else (capture 2)
			".*" +
			")\\)|)",

		// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
		rwhitespace = new RegExp( whitespace + "+", "g" ),
		rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

		rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
		rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

		rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

		rpseudo = new RegExp( pseudos ),
		ridentifier = new RegExp( "^" + identifier + "$" ),

		matchExpr = {
			"ID": new RegExp( "^#(" + identifier + ")" ),
			"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
			"TAG": new RegExp( "^(" + identifier + "|[*])" ),
			"ATTR": new RegExp( "^" + attributes ),
			"PSEUDO": new RegExp( "^" + pseudos ),
			"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
				"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
				"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
			"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
			// For use in libraries implementing .is()
			// We use this for POS matching in `select`
			"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
				whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
		},

		rinputs = /^(?:input|select|textarea|button)$/i,
		rheader = /^h\d$/i,

		rnative = /^[^{]+\{\s*\[native \w/,

		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

		rsibling = /[+~]/,
		rescape = /'|\\/g,

		// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
		runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
		funescape = function( _, escaped, escapedWhitespace ) {
			var high = "0x" + escaped - 0x10000;
			// NaN means non-codepoint
			// Support: Firefox<24
			// Workaround erroneous numeric interpretation of +"0x"
			return high !== high || escapedWhitespace ?
				escaped :
				high < 0 ?
					// BMP codepoint
					String.fromCharCode( high + 0x10000 ) :
					// Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
		},

		// Used for iframes
		// See setDocument()
		// Removing the function wrapper causes a "Permission Denied"
		// error in IE
		unloadHandler = function() {
			setDocument();
		};

	// Optimize for push.apply( _, NodeList )
	try {
		push.apply(
			(arr = slice.call( preferredDoc.childNodes )),
			preferredDoc.childNodes
		);
		// Support: Android<4.0
		// Detect silently failing push.apply
		arr[ preferredDoc.childNodes.length ].nodeType;
	} catch ( e ) {
		push = { apply: arr.length ?

			// Leverage slice if possible
			function( target, els ) {
				push_native.apply( target, slice.call(els) );
			} :

			// Support: IE<9
			// Otherwise append directly
			function( target, els ) {
				var j = target.length,
					i = 0;
				// Can't trust NodeList.length
				while ( (target[j++] = els[i++]) ) {}
				target.length = j - 1;
			}
		};
	}

	function Sizzle( selector, context, results, seed ) {
		var m, i, elem, nid, nidselect, match, groups, newSelector,
			newContext = context && context.ownerDocument,

			// nodeType defaults to 9, since context defaults to document
			nodeType = context ? context.nodeType : 9;

		results = results || [];

		// Return early from calls with invalid selector or context
		if ( typeof selector !== "string" || !selector ||
			nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

			return results;
		}

		// Try to shortcut find operations (as opposed to filters) in HTML documents
		if ( !seed ) {

			if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
				setDocument( context );
			}
			context = context || document;

			if ( documentIsHTML ) {

				// If the selector is sufficiently simple, try using a "get*By*" DOM method
				// (excepting DocumentFragment context, where the methods don't exist)
				if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

					// ID selector
					if ( (m = match[1]) ) {

						// Document context
						if ( nodeType === 9 ) {
							if ( (elem = context.getElementById( m )) ) {

								// Support: IE, Opera, Webkit
								// TODO: identify versions
								// getElementById can match elements by name instead of ID
								if ( elem.id === m ) {
									results.push( elem );
									return results;
								}
							} else {
								return results;
							}

						// Element context
						} else {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( newContext && (elem = newContext.getElementById( m )) &&
								contains( context, elem ) &&
								elem.id === m ) {

								results.push( elem );
								return results;
							}
						}

					// Type selector
					} else if ( match[2] ) {
						push.apply( results, context.getElementsByTagName( selector ) );
						return results;

					// Class selector
					} else if ( (m = match[3]) && support.getElementsByClassName &&
						context.getElementsByClassName ) {

						push.apply( results, context.getElementsByClassName( m ) );
						return results;
					}
				}

				// Take advantage of querySelectorAll
				if ( support.qsa &&
					!compilerCache[ selector + " " ] &&
					(!rbuggyQSA || !rbuggyQSA.test( selector )) ) {

					if ( nodeType !== 1 ) {
						newContext = context;
						newSelector = selector;

					// qSA looks outside Element context, which is not what we want
					// Thanks to Andrew Dupont for this workaround technique
					// Support: IE <=8
					// Exclude object elements
					} else if ( context.nodeName.toLowerCase() !== "object" ) {

						// Capture the context ID, setting it first if necessary
						if ( (nid = context.getAttribute( "id" )) ) {
							nid = nid.replace( rescape, "\\$&" );
						} else {
							context.setAttribute( "id", (nid = expando) );
						}

						// Prefix every selector in the list
						groups = tokenize( selector );
						i = groups.length;
						nidselect = ridentifier.test( nid ) ? "#" + nid : "[id='" + nid + "']";
						while ( i-- ) {
							groups[i] = nidselect + " " + toSelector( groups[i] );
						}
						newSelector = groups.join( "," );

						// Expand context for sibling selectors
						newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
							context;
					}

					if ( newSelector ) {
						try {
							push.apply( results,
								newContext.querySelectorAll( newSelector )
							);
							return results;
						} catch ( qsaError ) {
						} finally {
							if ( nid === expando ) {
								context.removeAttribute( "id" );
							}
						}
					}
				}
			}
		}

		// All others
		return select( selector.replace( rtrim, "$1" ), context, results, seed );
	}

	/**
	 * Create key-value caches of limited size
	 * @returns {function(string, object)} Returns the Object data after storing it on itself with
	 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
	 *	deleting the oldest entry
	 */
	function createCache() {
		var keys = [];

		function cache( key, value ) {
			// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
			if ( keys.push( key + " " ) > Expr.cacheLength ) {
				// Only keep the most recent entries
				delete cache[ keys.shift() ];
			}
			return (cache[ key + " " ] = value);
		}
		return cache;
	}

	/**
	 * Mark a function for special use by Sizzle
	 * @param {Function} fn The function to mark
	 */
	function markFunction( fn ) {
		fn[ expando ] = true;
		return fn;
	}

	/**
	 * Support testing using an element
	 * @param {Function} fn Passed the created div and expects a boolean result
	 */
	function assert( fn ) {
		var div = document.createElement("div");

		try {
			return !!fn( div );
		} catch (e) {
			return false;
		} finally {
			// Remove from its parent by default
			if ( div.parentNode ) {
				div.parentNode.removeChild( div );
			}
			// release memory in IE
			div = null;
		}
	}

	/**
	 * Adds the same handler for all of the specified attrs
	 * @param {String} attrs Pipe-separated list of attributes
	 * @param {Function} handler The method that will be applied
	 */
	function addHandle( attrs, handler ) {
		var arr = attrs.split("|"),
			i = arr.length;

		while ( i-- ) {
			Expr.attrHandle[ arr[i] ] = handler;
		}
	}

	/**
	 * Checks document order of two siblings
	 * @param {Element} a
	 * @param {Element} b
	 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
	 */
	function siblingCheck( a, b ) {
		var cur = b && a,
			diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
				( ~b.sourceIndex || MAX_NEGATIVE ) -
				( ~a.sourceIndex || MAX_NEGATIVE );

		// Use IE sourceIndex if available on both nodes
		if ( diff ) {
			return diff;
		}

		// Check if b follows a
		if ( cur ) {
			while ( (cur = cur.nextSibling) ) {
				if ( cur === b ) {
					return -1;
				}
			}
		}

		return a ? 1 : -1;
	}

	/**
	 * Returns a function to use in pseudos for input types
	 * @param {String} type
	 */
	function createInputPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for buttons
	 * @param {String} type
	 */
	function createButtonPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for positionals
	 * @param {Function} fn
	 */
	function createPositionalPseudo( fn ) {
		return markFunction(function( argument ) {
			argument = +argument;
			return markFunction(function( seed, matches ) {
				var j,
					matchIndexes = fn( [], seed.length, argument ),
					i = matchIndexes.length;

				// Match elements found at the specified indexes
				while ( i-- ) {
					if ( seed[ (j = matchIndexes[i]) ] ) {
						seed[j] = !(matches[j] = seed[j]);
					}
				}
			});
		});
	}

	/**
	 * Checks a node for validity as a Sizzle context
	 * @param {Element|Object=} context
	 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
	 */
	function testContext( context ) {
		return context && typeof context.getElementsByTagName !== "undefined" && context;
	}

	// Expose support vars for convenience
	support = Sizzle.support = {};

	/**
	 * Detects XML nodes
	 * @param {Element|Object} elem An element or a document
	 * @returns {Boolean} True iff elem is a non-HTML XML node
	 */
	isXML = Sizzle.isXML = function( elem ) {
		// documentElement is verified for cases where it doesn't yet exist
		// (such as loading iframes in IE - #4833)
		var documentElement = elem && (elem.ownerDocument || elem).documentElement;
		return documentElement ? documentElement.nodeName !== "HTML" : false;
	};

	/**
	 * Sets document-related variables once based on the current document
	 * @param {Element|Object} [doc] An element or document object to use to set the document
	 * @returns {Object} Returns the current document
	 */
	setDocument = Sizzle.setDocument = function( node ) {
		var hasCompare, parent,
			doc = node ? node.ownerDocument || node : preferredDoc;

		// Return early if doc is invalid or already selected
		if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
			return document;
		}

		// Update global variables
		document = doc;
		docElem = document.documentElement;
		documentIsHTML = !isXML( document );

		// Support: IE 9-11, Edge
		// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
		if ( (parent = document.defaultView) && parent.top !== parent ) {
			// Support: IE 11
			if ( parent.addEventListener ) {
				parent.addEventListener( "unload", unloadHandler, false );

			// Support: IE 9 - 10 only
			} else if ( parent.attachEvent ) {
				parent.attachEvent( "onunload", unloadHandler );
			}
		}

		/* Attributes
		---------------------------------------------------------------------- */

		// Support: IE<8
		// Verify that getAttribute really returns attributes and not properties
		// (excepting IE8 booleans)
		support.attributes = assert(function( div ) {
			div.className = "i";
			return !div.getAttribute("className");
		});

		/* getElement(s)By*
		---------------------------------------------------------------------- */

		// Check if getElementsByTagName("*") returns only elements
		support.getElementsByTagName = assert(function( div ) {
			div.appendChild( document.createComment("") );
			return !div.getElementsByTagName("*").length;
		});

		// Support: IE<9
		support.getElementsByClassName = rnative.test( document.getElementsByClassName );

		// Support: IE<10
		// Check if getElementById returns elements by name
		// The broken getElementById methods don't pick up programatically-set names,
		// so use a roundabout getElementsByName test
		support.getById = assert(function( div ) {
			docElem.appendChild( div ).id = expando;
			return !document.getElementsByName || !document.getElementsByName( expando ).length;
		});

		// ID find and filter
		if ( support.getById ) {
			Expr.find["ID"] = function( id, context ) {
				if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
					var m = context.getElementById( id );
					return m ? [ m ] : [];
				}
			};
			Expr.filter["ID"] = function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					return elem.getAttribute("id") === attrId;
				};
			};
		} else {
			// Support: IE6/7
			// getElementById is not reliable as a find shortcut
			delete Expr.find["ID"];

			Expr.filter["ID"] =  function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					var node = typeof elem.getAttributeNode !== "undefined" &&
						elem.getAttributeNode("id");
					return node && node.value === attrId;
				};
			};
		}

		// Tag
		Expr.find["TAG"] = support.getElementsByTagName ?
			function( tag, context ) {
				if ( typeof context.getElementsByTagName !== "undefined" ) {
					return context.getElementsByTagName( tag );

				// DocumentFragment nodes don't have gEBTN
				} else if ( support.qsa ) {
					return context.querySelectorAll( tag );
				}
			} :

			function( tag, context ) {
				var elem,
					tmp = [],
					i = 0,
					// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
					results = context.getElementsByTagName( tag );

				// Filter out possible comments
				if ( tag === "*" ) {
					while ( (elem = results[i++]) ) {
						if ( elem.nodeType === 1 ) {
							tmp.push( elem );
						}
					}

					return tmp;
				}
				return results;
			};

		// Class
		Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
			if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
				return context.getElementsByClassName( className );
			}
		};

		/* QSA/matchesSelector
		---------------------------------------------------------------------- */

		// QSA and matchesSelector support

		// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
		rbuggyMatches = [];

		// qSa(:focus) reports false when true (Chrome 21)
		// We allow this because of a bug in IE8/9 that throws an error
		// whenever `document.activeElement` is accessed on an iframe
		// So, we allow :focus to pass through QSA all the time to avoid the IE error
		// See http://bugs.jquery.com/ticket/13378
		rbuggyQSA = [];

		if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			assert(function( div ) {
				// Select is set to empty string on purpose
				// This is to test IE's treatment of not explicitly
				// setting a boolean content attribute,
				// since its presence should be enough
				// http://bugs.jquery.com/ticket/12359
				docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
					"<select id='" + expando + "-\r\\' msallowcapture=''>" +
					"<option selected=''></option></select>";

				// Support: IE8, Opera 11-12.16
				// Nothing should be selected when empty strings follow ^= or $= or *=
				// The test attribute must be unknown in Opera but "safe" for WinRT
				// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
				if ( div.querySelectorAll("[msallowcapture^='']").length ) {
					rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
				}

				// Support: IE8
				// Boolean attributes and "value" are not treated correctly
				if ( !div.querySelectorAll("[selected]").length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
				}

				// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
				if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
					rbuggyQSA.push("~=");
				}

				// Webkit/Opera - :checked should return selected option elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":checked").length ) {
					rbuggyQSA.push(":checked");
				}

				// Support: Safari 8+, iOS 8+
				// https://bugs.webkit.org/show_bug.cgi?id=136851
				// In-page `selector#id sibing-combinator selector` fails
				if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
					rbuggyQSA.push(".#.+[+~]");
				}
			});

			assert(function( div ) {
				// Support: Windows 8 Native Apps
				// The type and name attributes are restricted during .innerHTML assignment
				var input = document.createElement("input");
				input.setAttribute( "type", "hidden" );
				div.appendChild( input ).setAttribute( "name", "D" );

				// Support: IE8
				// Enforce case-sensitivity of name attribute
				if ( div.querySelectorAll("[name=d]").length ) {
					rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
				}

				// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":enabled").length ) {
					rbuggyQSA.push( ":enabled", ":disabled" );
				}

				// Opera 10-11 does not throw on post-comma invalid pseudos
				div.querySelectorAll("*,:x");
				rbuggyQSA.push(",.*:");
			});
		}

		if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
			docElem.webkitMatchesSelector ||
			docElem.mozMatchesSelector ||
			docElem.oMatchesSelector ||
			docElem.msMatchesSelector) )) ) {

			assert(function( div ) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				support.disconnectedMatch = matches.call( div, "div" );

				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call( div, "[s!='']:x" );
				rbuggyMatches.push( "!=", pseudos );
			});
		}

		rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
		rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

		/* Contains
		---------------------------------------------------------------------- */
		hasCompare = rnative.test( docElem.compareDocumentPosition );

		// Element contains another
		// Purposefully self-exclusive
		// As in, an element does not contain itself
		contains = hasCompare || rnative.test( docElem.contains ) ?
			function( a, b ) {
				var adown = a.nodeType === 9 ? a.documentElement : a,
					bup = b && b.parentNode;
				return a === bup || !!( bup && bup.nodeType === 1 && (
					adown.contains ?
						adown.contains( bup ) :
						a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
				));
			} :
			function( a, b ) {
				if ( b ) {
					while ( (b = b.parentNode) ) {
						if ( b === a ) {
							return true;
						}
					}
				}
				return false;
			};

		/* Sorting
		---------------------------------------------------------------------- */

		// Document order sorting
		sortOrder = hasCompare ?
		function( a, b ) {

			// Flag for duplicate removal
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			// Sort on method existence if only one input has compareDocumentPosition
			var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
			if ( compare ) {
				return compare;
			}

			// Calculate position if both inputs belong to the same document
			compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
				a.compareDocumentPosition( b ) :

				// Otherwise we know they are disconnected
				1;

			// Disconnected nodes
			if ( compare & 1 ||
				(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

				// Choose the first element that is related to our preferred document
				if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		} :
		function( a, b ) {
			// Exit early if the nodes are identical
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			var cur,
				i = 0,
				aup = a.parentNode,
				bup = b.parentNode,
				ap = [ a ],
				bp = [ b ];

			// Parentless nodes are either documents or disconnected
			if ( !aup || !bup ) {
				return a === document ? -1 :
					b === document ? 1 :
					aup ? -1 :
					bup ? 1 :
					sortInput ?
					( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
					0;

			// If the nodes are siblings, we can do a quick check
			} else if ( aup === bup ) {
				return siblingCheck( a, b );
			}

			// Otherwise we need full lists of their ancestors for comparison
			cur = a;
			while ( (cur = cur.parentNode) ) {
				ap.unshift( cur );
			}
			cur = b;
			while ( (cur = cur.parentNode) ) {
				bp.unshift( cur );
			}

			// Walk down the tree looking for a discrepancy
			while ( ap[i] === bp[i] ) {
				i++;
			}

			return i ?
				// Do a sibling check if the nodes have a common ancestor
				siblingCheck( ap[i], bp[i] ) :

				// Otherwise nodes in our document sort first
				ap[i] === preferredDoc ? -1 :
				bp[i] === preferredDoc ? 1 :
				0;
		};

		return document;
	};

	Sizzle.matches = function( expr, elements ) {
		return Sizzle( expr, null, null, elements );
	};

	Sizzle.matchesSelector = function( elem, expr ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}

		// Make sure that attribute selectors are quoted
		expr = expr.replace( rattributeQuotes, "='$1']" );

		if ( support.matchesSelector && documentIsHTML &&
			!compilerCache[ expr + " " ] &&
			( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
			( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

			try {
				var ret = matches.call( elem, expr );

				// IE 9's matchesSelector returns false on disconnected nodes
				if ( ret || support.disconnectedMatch ||
						// As well, disconnected nodes are said to be in a document
						// fragment in IE 9
						elem.document && elem.document.nodeType !== 11 ) {
					return ret;
				}
			} catch (e) {}
		}

		return Sizzle( expr, document, null, [ elem ] ).length > 0;
	};

	Sizzle.contains = function( context, elem ) {
		// Set document vars if needed
		if ( ( context.ownerDocument || context ) !== document ) {
			setDocument( context );
		}
		return contains( context, elem );
	};

	Sizzle.attr = function( elem, name ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}

		var fn = Expr.attrHandle[ name.toLowerCase() ],
			// Don't get fooled by Object.prototype properties (jQuery #13807)
			val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
				fn( elem, name, !documentIsHTML ) :
				undefined;

		return val !== undefined ?
			val :
			support.attributes || !documentIsHTML ?
				elem.getAttribute( name ) :
				(val = elem.getAttributeNode(name)) && val.specified ?
					val.value :
					null;
	};

	Sizzle.error = function( msg ) {
		throw new Error( "Syntax error, unrecognized expression: " + msg );
	};

	/**
	 * Document sorting and removing duplicates
	 * @param {ArrayLike} results
	 */
	Sizzle.uniqueSort = function( results ) {
		var elem,
			duplicates = [],
			j = 0,
			i = 0;

		// Unless we *know* we can detect duplicates, assume their presence
		hasDuplicate = !support.detectDuplicates;
		sortInput = !support.sortStable && results.slice( 0 );
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			while ( (elem = results[i++]) ) {
				if ( elem === results[ i ] ) {
					j = duplicates.push( i );
				}
			}
			while ( j-- ) {
				results.splice( duplicates[ j ], 1 );
			}
		}

		// Clear input after sorting to release objects
		// See https://github.com/jquery/sizzle/pull/225
		sortInput = null;

		return results;
	};

	/**
	 * Utility function for retrieving the text value of an array of DOM nodes
	 * @param {Array|Element} elem
	 */
	getText = Sizzle.getText = function( elem ) {
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		if ( !nodeType ) {
			// If no nodeType, this is expected to be an array
			while ( (node = elem[i++]) ) {
				// Do not traverse comment nodes
				ret += getText( node );
			}
		} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (jQuery #11153)
			if ( typeof elem.textContent === "string" ) {
				return elem.textContent;
			} else {
				// Traverse its children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
		// Do not include comment or processing instruction nodes

		return ret;
	};

	Expr = Sizzle.selectors = {

		// Can be adjusted by the user
		cacheLength: 50,

		createPseudo: markFunction,

		match: matchExpr,

		attrHandle: {},

		find: {},

		relative: {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},

		preFilter: {
			"ATTR": function( match ) {
				match[1] = match[1].replace( runescape, funescape );

				// Move the given value to match[3] whether quoted or unquoted
				match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

				if ( match[2] === "~=" ) {
					match[3] = " " + match[3] + " ";
				}

				return match.slice( 0, 4 );
			},

			"CHILD": function( match ) {
				/* matches from matchExpr["CHILD"]
					1 type (only|nth|...)
					2 what (child|of-type)
					3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
					4 xn-component of xn+y argument ([+-]?\d*n|)
					5 sign of xn-component
					6 x of xn-component
					7 sign of y-component
					8 y of y-component
				*/
				match[1] = match[1].toLowerCase();

				if ( match[1].slice( 0, 3 ) === "nth" ) {
					// nth-* requires argument
					if ( !match[3] ) {
						Sizzle.error( match[0] );
					}

					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
					match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

				// other types prohibit arguments
				} else if ( match[3] ) {
					Sizzle.error( match[0] );
				}

				return match;
			},

			"PSEUDO": function( match ) {
				var excess,
					unquoted = !match[6] && match[2];

				if ( matchExpr["CHILD"].test( match[0] ) ) {
					return null;
				}

				// Accept quoted arguments as-is
				if ( match[3] ) {
					match[2] = match[4] || match[5] || "";

				// Strip excess characters from unquoted arguments
				} else if ( unquoted && rpseudo.test( unquoted ) &&
					// Get excess from tokenize (recursively)
					(excess = tokenize( unquoted, true )) &&
					// advance to the next closing parenthesis
					(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

					// excess is a negative index
					match[0] = match[0].slice( 0, excess );
					match[2] = unquoted.slice( 0, excess );
				}

				// Return only captures needed by the pseudo filter method (type and argument)
				return match.slice( 0, 3 );
			}
		},

		filter: {

			"TAG": function( nodeNameSelector ) {
				var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
				return nodeNameSelector === "*" ?
					function() { return true; } :
					function( elem ) {
						return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
					};
			},

			"CLASS": function( className ) {
				var pattern = classCache[ className + " " ];

				return pattern ||
					(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
					classCache( className, function( elem ) {
						return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
					});
			},

			"ATTR": function( name, operator, check ) {
				return function( elem ) {
					var result = Sizzle.attr( elem, name );

					if ( result == null ) {
						return operator === "!=";
					}
					if ( !operator ) {
						return true;
					}

					result += "";

					return operator === "=" ? result === check :
						operator === "!=" ? result !== check :
						operator === "^=" ? check && result.indexOf( check ) === 0 :
						operator === "*=" ? check && result.indexOf( check ) > -1 :
						operator === "$=" ? check && result.slice( -check.length ) === check :
						operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
						operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
						false;
				};
			},

			"CHILD": function( type, what, argument, first, last ) {
				var simple = type.slice( 0, 3 ) !== "nth",
					forward = type.slice( -4 ) !== "last",
					ofType = what === "of-type";

				return first === 1 && last === 0 ?

					// Shortcut for :nth-*(n)
					function( elem ) {
						return !!elem.parentNode;
					} :

					function( elem, context, xml ) {
						var cache, uniqueCache, outerCache, node, nodeIndex, start,
							dir = simple !== forward ? "nextSibling" : "previousSibling",
							parent = elem.parentNode,
							name = ofType && elem.nodeName.toLowerCase(),
							useCache = !xml && !ofType,
							diff = false;

						if ( parent ) {

							// :(first|last|only)-(child|of-type)
							if ( simple ) {
								while ( dir ) {
									node = elem;
									while ( (node = node[ dir ]) ) {
										if ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) {

											return false;
										}
									}
									// Reverse direction for :only-* (if we haven't yet done so)
									start = dir = type === "only" && !start && "nextSibling";
								}
								return true;
							}

							start = [ forward ? parent.firstChild : parent.lastChild ];

							// non-xml :nth-child(...) stores cache data on `parent`
							if ( forward && useCache ) {

								// Seek `elem` from a previously-cached index

								// ...in a gzip-friendly way
								node = parent;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex && cache[ 2 ];
								node = nodeIndex && parent.childNodes[ nodeIndex ];

								while ( (node = ++nodeIndex && node && node[ dir ] ||

									// Fallback to seeking `elem` from the start
									(diff = nodeIndex = 0) || start.pop()) ) {

									// When found, cache indexes on `parent` and break
									if ( node.nodeType === 1 && ++diff && node === elem ) {
										uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
										break;
									}
								}

							} else {
								// Use previously-cached element index if available
								if ( useCache ) {
									// ...in a gzip-friendly way
									node = elem;
									outerCache = node[ expando ] || (node[ expando ] = {});

									// Support: IE <9 only
									// Defend against cloned attroperties (jQuery gh-1709)
									uniqueCache = outerCache[ node.uniqueID ] ||
										(outerCache[ node.uniqueID ] = {});

									cache = uniqueCache[ type ] || [];
									nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
									diff = nodeIndex;
								}

								// xml :nth-child(...)
								// or :nth-last-child(...) or :nth(-last)?-of-type(...)
								if ( diff === false ) {
									// Use the same loop as above to seek `elem` from the start
									while ( (node = ++nodeIndex && node && node[ dir ] ||
										(diff = nodeIndex = 0) || start.pop()) ) {

										if ( ( ofType ?
											node.nodeName.toLowerCase() === name :
											node.nodeType === 1 ) &&
											++diff ) {

											// Cache the index of each encountered element
											if ( useCache ) {
												outerCache = node[ expando ] || (node[ expando ] = {});

												// Support: IE <9 only
												// Defend against cloned attroperties (jQuery gh-1709)
												uniqueCache = outerCache[ node.uniqueID ] ||
													(outerCache[ node.uniqueID ] = {});

												uniqueCache[ type ] = [ dirruns, diff ];
											}

											if ( node === elem ) {
												break;
											}
										}
									}
								}
							}

							// Incorporate the offset, then check against cycle size
							diff -= last;
							return diff === first || ( diff % first === 0 && diff / first >= 0 );
						}
					};
			},

			"PSEUDO": function( pseudo, argument ) {
				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				// Remember that setFilters inherits from pseudos
				var args,
					fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
						Sizzle.error( "unsupported pseudo: " + pseudo );

				// The user may use createPseudo to indicate that
				// arguments are needed to create the filter function
				// just as Sizzle does
				if ( fn[ expando ] ) {
					return fn( argument );
				}

				// But maintain support for old signatures
				if ( fn.length > 1 ) {
					args = [ pseudo, pseudo, "", argument ];
					return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
						markFunction(function( seed, matches ) {
							var idx,
								matched = fn( seed, argument ),
								i = matched.length;
							while ( i-- ) {
								idx = indexOf( seed, matched[i] );
								seed[ idx ] = !( matches[ idx ] = matched[i] );
							}
						}) :
						function( elem ) {
							return fn( elem, 0, args );
						};
				}

				return fn;
			}
		},

		pseudos: {
			// Potentially complex pseudos
			"not": markFunction(function( selector ) {
				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var input = [],
					results = [],
					matcher = compile( selector.replace( rtrim, "$1" ) );

				return matcher[ expando ] ?
					markFunction(function( seed, matches, context, xml ) {
						var elem,
							unmatched = matcher( seed, null, xml, [] ),
							i = seed.length;

						// Match elements unmatched by `matcher`
						while ( i-- ) {
							if ( (elem = unmatched[i]) ) {
								seed[i] = !(matches[i] = elem);
							}
						}
					}) :
					function( elem, context, xml ) {
						input[0] = elem;
						matcher( input, null, xml, results );
						// Don't keep the element (issue #299)
						input[0] = null;
						return !results.pop();
					};
			}),

			"has": markFunction(function( selector ) {
				return function( elem ) {
					return Sizzle( selector, elem ).length > 0;
				};
			}),

			"contains": markFunction(function( text ) {
				text = text.replace( runescape, funescape );
				return function( elem ) {
					return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
				};
			}),

			// "Whether an element is represented by a :lang() selector
			// is based solely on the element's language value
			// being equal to the identifier C,
			// or beginning with the identifier C immediately followed by "-".
			// The matching of C against the element's language value is performed case-insensitively.
			// The identifier C does not have to be a valid language name."
			// http://www.w3.org/TR/selectors/#lang-pseudo
			"lang": markFunction( function( lang ) {
				// lang value must be a valid identifier
				if ( !ridentifier.test(lang || "") ) {
					Sizzle.error( "unsupported lang: " + lang );
				}
				lang = lang.replace( runescape, funescape ).toLowerCase();
				return function( elem ) {
					var elemLang;
					do {
						if ( (elemLang = documentIsHTML ?
							elem.lang :
							elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
						}
					} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
					return false;
				};
			}),

			// Miscellaneous
			"target": function( elem ) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice( 1 ) === elem.id;
			},

			"root": function( elem ) {
				return elem === docElem;
			},

			"focus": function( elem ) {
				return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},

			// Boolean properties
			"enabled": function( elem ) {
				return elem.disabled === false;
			},

			"disabled": function( elem ) {
				return elem.disabled === true;
			},

			"checked": function( elem ) {
				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
			},

			"selected": function( elem ) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.parentNode ) {
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			// Contents
			"empty": function( elem ) {
				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
				//   but not by others (comment: 8; processing instruction: 7; etc.)
				// nodeType < 6 works because attributes (2) do not appear as children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					if ( elem.nodeType < 6 ) {
						return false;
					}
				}
				return true;
			},

			"parent": function( elem ) {
				return !Expr.pseudos["empty"]( elem );
			},

			// Element/input types
			"header": function( elem ) {
				return rheader.test( elem.nodeName );
			},

			"input": function( elem ) {
				return rinputs.test( elem.nodeName );
			},

			"button": function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			"text": function( elem ) {
				var attr;
				return elem.nodeName.toLowerCase() === "input" &&
					elem.type === "text" &&

					// Support: IE<8
					// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
					( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
			},

			// Position-in-collection
			"first": createPositionalPseudo(function() {
				return [ 0 ];
			}),

			"last": createPositionalPseudo(function( matchIndexes, length ) {
				return [ length - 1 ];
			}),

			"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
				return [ argument < 0 ? argument + length : argument ];
			}),

			"even": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 0;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"odd": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 1;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; --i >= 0; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; ++i < length; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			})
		}
	};

	Expr.pseudos["nth"] = Expr.pseudos["eq"];

	// Add button/input type pseudos
	for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
		Expr.pseudos[ i ] = createInputPseudo( i );
	}
	for ( i in { submit: true, reset: true } ) {
		Expr.pseudos[ i ] = createButtonPseudo( i );
	}

	// Easy API for creating new setFilters
	function setFilters() {}
	setFilters.prototype = Expr.filters = Expr.pseudos;
	Expr.setFilters = new setFilters();

	tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
		var matched, match, tokens, type,
			soFar, groups, preFilters,
			cached = tokenCache[ selector + " " ];

		if ( cached ) {
			return parseOnly ? 0 : cached.slice( 0 );
		}

		soFar = selector;
		groups = [];
		preFilters = Expr.preFilter;

		while ( soFar ) {

			// Comma and first run
			if ( !matched || (match = rcomma.exec( soFar )) ) {
				if ( match ) {
					// Don't consume trailing commas as valid
					soFar = soFar.slice( match[0].length ) || soFar;
				}
				groups.push( (tokens = []) );
			}

			matched = false;

			// Combinators
			if ( (match = rcombinators.exec( soFar )) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					// Cast descendant combinators to space
					type: match[0].replace( rtrim, " " )
				});
				soFar = soFar.slice( matched.length );
			}

			// Filters
			for ( type in Expr.filter ) {
				if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
					(match = preFilters[ type ]( match ))) ) {
					matched = match.shift();
					tokens.push({
						value: matched,
						type: type,
						matches: match
					});
					soFar = soFar.slice( matched.length );
				}
			}

			if ( !matched ) {
				break;
			}
		}

		// Return the length of the invalid excess
		// if we're just parsing
		// Otherwise, throw an error or return tokens
		return parseOnly ?
			soFar.length :
			soFar ?
				Sizzle.error( selector ) :
				// Cache the tokens
				tokenCache( selector, groups ).slice( 0 );
	};

	function toSelector( tokens ) {
		var i = 0,
			len = tokens.length,
			selector = "";
		for ( ; i < len; i++ ) {
			selector += tokens[i].value;
		}
		return selector;
	}

	function addCombinator( matcher, combinator, base ) {
		var dir = combinator.dir,
			checkNonElements = base && dir === "parentNode",
			doneName = done++;

		return combinator.first ?
			// Check against closest ancestor/preceding element
			function( elem, context, xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						return matcher( elem, context, xml );
					}
				}
			} :

			// Check against all ancestor/preceding elements
			function( elem, context, xml ) {
				var oldCache, uniqueCache, outerCache,
					newCache = [ dirruns, doneName ];

				// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
				if ( xml ) {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							if ( matcher( elem, context, xml ) ) {
								return true;
							}
						}
					}
				} else {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							outerCache = elem[ expando ] || (elem[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

							if ( (oldCache = uniqueCache[ dir ]) &&
								oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

								// Assign to newCache so results back-propagate to previous elements
								return (newCache[ 2 ] = oldCache[ 2 ]);
							} else {
								// Reuse newcache so results back-propagate to previous elements
								uniqueCache[ dir ] = newCache;

								// A match means we're done; a fail means we have to keep checking
								if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
									return true;
								}
							}
						}
					}
				}
			};
	}

	function elementMatcher( matchers ) {
		return matchers.length > 1 ?
			function( elem, context, xml ) {
				var i = matchers.length;
				while ( i-- ) {
					if ( !matchers[i]( elem, context, xml ) ) {
						return false;
					}
				}
				return true;
			} :
			matchers[0];
	}

	function multipleContexts( selector, contexts, results ) {
		var i = 0,
			len = contexts.length;
		for ( ; i < len; i++ ) {
			Sizzle( selector, contexts[i], results );
		}
		return results;
	}

	function condense( unmatched, map, filter, context, xml ) {
		var elem,
			newUnmatched = [],
			i = 0,
			len = unmatched.length,
			mapped = map != null;

		for ( ; i < len; i++ ) {
			if ( (elem = unmatched[i]) ) {
				if ( !filter || filter( elem, context, xml ) ) {
					newUnmatched.push( elem );
					if ( mapped ) {
						map.push( i );
					}
				}
			}
		}

		return newUnmatched;
	}

	function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
		if ( postFilter && !postFilter[ expando ] ) {
			postFilter = setMatcher( postFilter );
		}
		if ( postFinder && !postFinder[ expando ] ) {
			postFinder = setMatcher( postFinder, postSelector );
		}
		return markFunction(function( seed, results, context, xml ) {
			var temp, i, elem,
				preMap = [],
				postMap = [],
				preexisting = results.length,

				// Get initial elements from seed or context
				elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

				// Prefilter to get matcher input, preserving a map for seed-results synchronization
				matcherIn = preFilter && ( seed || !selector ) ?
					condense( elems, preMap, preFilter, context, xml ) :
					elems,

				matcherOut = matcher ?
					// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
					postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

						// ...intermediate processing is necessary
						[] :

						// ...otherwise use results directly
						results :
					matcherIn;

			// Find primary matches
			if ( matcher ) {
				matcher( matcherIn, matcherOut, context, xml );
			}

			// Apply postFilter
			if ( postFilter ) {
				temp = condense( matcherOut, postMap );
				postFilter( temp, [], context, xml );

				// Un-match failing elements by moving them back to matcherIn
				i = temp.length;
				while ( i-- ) {
					if ( (elem = temp[i]) ) {
						matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
					}
				}
			}

			if ( seed ) {
				if ( postFinder || preFilter ) {
					if ( postFinder ) {
						// Get the final matcherOut by condensing this intermediate into postFinder contexts
						temp = [];
						i = matcherOut.length;
						while ( i-- ) {
							if ( (elem = matcherOut[i]) ) {
								// Restore matcherIn since elem is not yet a final match
								temp.push( (matcherIn[i] = elem) );
							}
						}
						postFinder( null, (matcherOut = []), temp, xml );
					}

					// Move matched elements from seed to results to keep them synchronized
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) &&
							(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

							seed[temp] = !(results[temp] = elem);
						}
					}
				}

			// Add elements to results, through postFinder if defined
			} else {
				matcherOut = condense(
					matcherOut === results ?
						matcherOut.splice( preexisting, matcherOut.length ) :
						matcherOut
				);
				if ( postFinder ) {
					postFinder( null, results, matcherOut, xml );
				} else {
					push.apply( results, matcherOut );
				}
			}
		});
	}

	function matcherFromTokens( tokens ) {
		var checkContext, matcher, j,
			len = tokens.length,
			leadingRelative = Expr.relative[ tokens[0].type ],
			implicitRelative = leadingRelative || Expr.relative[" "],
			i = leadingRelative ? 1 : 0,

			// The foundational matcher ensures that elements are reachable from top-level context(s)
			matchContext = addCombinator( function( elem ) {
				return elem === checkContext;
			}, implicitRelative, true ),
			matchAnyContext = addCombinator( function( elem ) {
				return indexOf( checkContext, elem ) > -1;
			}, implicitRelative, true ),
			matchers = [ function( elem, context, xml ) {
				var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
					(checkContext = context).nodeType ?
						matchContext( elem, context, xml ) :
						matchAnyContext( elem, context, xml ) );
				// Avoid hanging onto element (issue #299)
				checkContext = null;
				return ret;
			} ];

		for ( ; i < len; i++ ) {
			if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
				matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
			} else {
				matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

				// Return special upon seeing a positional matcher
				if ( matcher[ expando ] ) {
					// Find the next relative operator (if any) for proper handling
					j = ++i;
					for ( ; j < len; j++ ) {
						if ( Expr.relative[ tokens[j].type ] ) {
							break;
						}
					}
					return setMatcher(
						i > 1 && elementMatcher( matchers ),
						i > 1 && toSelector(
							// If the preceding token was a descendant combinator, insert an implicit any-element `*`
							tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
						).replace( rtrim, "$1" ),
						matcher,
						i < j && matcherFromTokens( tokens.slice( i, j ) ),
						j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
						j < len && toSelector( tokens )
					);
				}
				matchers.push( matcher );
			}
		}

		return elementMatcher( matchers );
	}

	function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
		var bySet = setMatchers.length > 0,
			byElement = elementMatchers.length > 0,
			superMatcher = function( seed, context, xml, results, outermost ) {
				var elem, j, matcher,
					matchedCount = 0,
					i = "0",
					unmatched = seed && [],
					setMatched = [],
					contextBackup = outermostContext,
					// We must always have either seed elements or outermost context
					elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
					// Use integer dirruns iff this is the outermost matcher
					dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
					len = elems.length;

				if ( outermost ) {
					outermostContext = context === document || context || outermost;
				}

				// Add elements passing elementMatchers directly to results
				// Support: IE<9, Safari
				// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
				for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
					if ( byElement && elem ) {
						j = 0;
						if ( !context && elem.ownerDocument !== document ) {
							setDocument( elem );
							xml = !documentIsHTML;
						}
						while ( (matcher = elementMatchers[j++]) ) {
							if ( matcher( elem, context || document, xml) ) {
								results.push( elem );
								break;
							}
						}
						if ( outermost ) {
							dirruns = dirrunsUnique;
						}
					}

					// Track unmatched elements for set filters
					if ( bySet ) {
						// They will have gone through all possible matchers
						if ( (elem = !matcher && elem) ) {
							matchedCount--;
						}

						// Lengthen the array for every element, matched or not
						if ( seed ) {
							unmatched.push( elem );
						}
					}
				}

				// `i` is now the count of elements visited above, and adding it to `matchedCount`
				// makes the latter nonnegative.
				matchedCount += i;

				// Apply set filters to unmatched elements
				// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
				// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
				// no element matchers and no seed.
				// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
				// case, which will result in a "00" `matchedCount` that differs from `i` but is also
				// numerically zero.
				if ( bySet && i !== matchedCount ) {
					j = 0;
					while ( (matcher = setMatchers[j++]) ) {
						matcher( unmatched, setMatched, context, xml );
					}

					if ( seed ) {
						// Reintegrate element matches to eliminate the need for sorting
						if ( matchedCount > 0 ) {
							while ( i-- ) {
								if ( !(unmatched[i] || setMatched[i]) ) {
									setMatched[i] = pop.call( results );
								}
							}
						}

						// Discard index placeholder values to get only actual matches
						setMatched = condense( setMatched );
					}

					// Add matches to results
					push.apply( results, setMatched );

					// Seedless set matches succeeding multiple successful matchers stipulate sorting
					if ( outermost && !seed && setMatched.length > 0 &&
						( matchedCount + setMatchers.length ) > 1 ) {

						Sizzle.uniqueSort( results );
					}
				}

				// Override manipulation of globals by nested matchers
				if ( outermost ) {
					dirruns = dirrunsUnique;
					outermostContext = contextBackup;
				}

				return unmatched;
			};

		return bySet ?
			markFunction( superMatcher ) :
			superMatcher;
	}

	compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
		var i,
			setMatchers = [],
			elementMatchers = [],
			cached = compilerCache[ selector + " " ];

		if ( !cached ) {
			// Generate a function of recursive functions that can be used to check each element
			if ( !match ) {
				match = tokenize( selector );
			}
			i = match.length;
			while ( i-- ) {
				cached = matcherFromTokens( match[i] );
				if ( cached[ expando ] ) {
					setMatchers.push( cached );
				} else {
					elementMatchers.push( cached );
				}
			}

			// Cache the compiled function
			cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

			// Save selector and tokenization
			cached.selector = selector;
		}
		return cached;
	};

	/**
	 * A low-level selection function that works with Sizzle's compiled
	 *  selector functions
	 * @param {String|Function} selector A selector or a pre-compiled
	 *  selector function built with Sizzle.compile
	 * @param {Element} context
	 * @param {Array} [results]
	 * @param {Array} [seed] A set of elements to match against
	 */
	select = Sizzle.select = function( selector, context, results, seed ) {
		var i, tokens, token, type, find,
			compiled = typeof selector === "function" && selector,
			match = !seed && tokenize( (selector = compiled.selector || selector) );

		results = results || [];

		// Try to minimize operations if there is only one selector in the list and no seed
		// (the latter of which guarantees us context)
		if ( match.length === 1 ) {

			// Reduce context if the leading compound selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;

				// Precompiled matchers will still verify ancestry, so step up a level
				} else if ( compiled ) {
					context = context.parentNode;
				}

				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}

		// Compile and execute a filtering function if one is not provided
		// Provide `match` to avoid retokenization if we modified the selector above
		( compiled || compile( selector, match ) )(
			seed,
			context,
			!documentIsHTML,
			results,
			!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
		);
		return results;
	};

	// One-time assignments

	// Sort stability
	support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

	// Support: Chrome 14-35+
	// Always assume duplicates if they aren't passed to the comparison function
	support.detectDuplicates = !!hasDuplicate;

	// Initialize against the default document
	setDocument();

	// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
	// Detached nodes confoundingly follow *each other*
	support.sortDetached = assert(function( div1 ) {
		// Should return 1, but returns 4 (following)
		return div1.compareDocumentPosition( document.createElement("div") ) & 1;
	});

	// Support: IE<8
	// Prevent attribute/property "interpolation"
	// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
	if ( !assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild.getAttribute("href") === "#" ;
	}) ) {
		addHandle( "type|href|height|width", function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
			}
		});
	}

	// Support: IE<9
	// Use defaultValue in place of getAttribute("value")
	if ( !support.attributes || !assert(function( div ) {
		div.innerHTML = "<input/>";
		div.firstChild.setAttribute( "value", "" );
		return div.firstChild.getAttribute( "value" ) === "";
	}) ) {
		addHandle( "value", function( elem, name, isXML ) {
			if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
				return elem.defaultValue;
			}
		});
	}

	// Support: IE<9
	// Use getAttributeNode to fetch booleans when getAttribute lies
	if ( !assert(function( div ) {
		return div.getAttribute("disabled") == null;
	}) ) {
		addHandle( booleans, function( elem, name, isXML ) {
			var val;
			if ( !isXML ) {
				return elem[ name ] === true ? name.toLowerCase() :
						(val = elem.getAttributeNode( name )) && val.specified ?
						val.value :
					null;
			}
		});
	}

	return Sizzle;

	})( window );



	jQuery.find = Sizzle;
	jQuery.expr = Sizzle.selectors;
	jQuery.expr[ ":" ] = jQuery.expr.pseudos;
	jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
	jQuery.text = Sizzle.getText;
	jQuery.isXMLDoc = Sizzle.isXML;
	jQuery.contains = Sizzle.contains;



	var dir = function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( ( elem = elem[ dir ] ) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	};


	var siblings = function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	};


	var rneedsContext = jQuery.expr.match.needsContext;

	var rsingleTag = ( /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/ );



	var risSimple = /^.[^:#\[\.,]*$/;

	// Implement the identical functionality for filter and not
	function winnow( elements, qualifier, not ) {
		if ( jQuery.isFunction( qualifier ) ) {
			return jQuery.grep( elements, function( elem, i ) {
				/* jshint -W018 */
				return !!qualifier.call( elem, i, elem ) !== not;
			} );

		}

		if ( qualifier.nodeType ) {
			return jQuery.grep( elements, function( elem ) {
				return ( elem === qualifier ) !== not;
			} );

		}

		if ( typeof qualifier === "string" ) {
			if ( risSimple.test( qualifier ) ) {
				return jQuery.filter( qualifier, elements, not );
			}

			qualifier = jQuery.filter( qualifier, elements );
		}

		return jQuery.grep( elements, function( elem ) {
			return ( indexOf.call( qualifier, elem ) > -1 ) !== not;
		} );
	}

	jQuery.filter = function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 && elem.nodeType === 1 ?
			jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
			jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
				return elem.nodeType === 1;
			} ) );
	};

	jQuery.fn.extend( {
		find: function( selector ) {
			var i,
				len = this.length,
				ret = [],
				self = this;

			if ( typeof selector !== "string" ) {
				return this.pushStack( jQuery( selector ).filter( function() {
					for ( i = 0; i < len; i++ ) {
						if ( jQuery.contains( self[ i ], this ) ) {
							return true;
						}
					}
				} ) );
			}

			for ( i = 0; i < len; i++ ) {
				jQuery.find( selector, self[ i ], ret );
			}

			// Needed because $( selector, context ) becomes $( context ).find( selector )
			ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
			ret.selector = this.selector ? this.selector + " " + selector : selector;
			return ret;
		},
		filter: function( selector ) {
			return this.pushStack( winnow( this, selector || [], false ) );
		},
		not: function( selector ) {
			return this.pushStack( winnow( this, selector || [], true ) );
		},
		is: function( selector ) {
			return !!winnow(
				this,

				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				typeof selector === "string" && rneedsContext.test( selector ) ?
					jQuery( selector ) :
					selector || [],
				false
			).length;
		}
	} );


	// Initialize a jQuery object


	// A central reference to the root jQuery(document)
	var rootjQuery,

		// A simple way to check for HTML strings
		// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
		// Strict HTML recognition (#11290: must start with <)
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

		init = jQuery.fn.init = function( selector, context, root ) {
			var match, elem;

			// HANDLE: $(""), $(null), $(undefined), $(false)
			if ( !selector ) {
				return this;
			}

			// Method init() accepts an alternate rootjQuery
			// so migrate can support jQuery.sub (gh-2101)
			root = root || rootjQuery;

			// Handle HTML strings
			if ( typeof selector === "string" ) {
				if ( selector[ 0 ] === "<" &&
					selector[ selector.length - 1 ] === ">" &&
					selector.length >= 3 ) {

					// Assume that strings that start and end with <> are HTML and skip the regex check
					match = [ null, selector, null ];

				} else {
					match = rquickExpr.exec( selector );
				}

				// Match html or make sure no context is specified for #id
				if ( match && ( match[ 1 ] || !context ) ) {

					// HANDLE: $(html) -> $(array)
					if ( match[ 1 ] ) {
						context = context instanceof jQuery ? context[ 0 ] : context;

						// Option to run scripts is true for back-compat
						// Intentionally let the error be thrown if parseHTML is not present
						jQuery.merge( this, jQuery.parseHTML(
							match[ 1 ],
							context && context.nodeType ? context.ownerDocument || context : document,
							true
						) );

						// HANDLE: $(html, props)
						if ( rsingleTag.test( match[ 1 ] ) && jQuery.isPlainObject( context ) ) {
							for ( match in context ) {

								// Properties of context are called as methods if possible
								if ( jQuery.isFunction( this[ match ] ) ) {
									this[ match ]( context[ match ] );

								// ...and otherwise set as attributes
								} else {
									this.attr( match, context[ match ] );
								}
							}
						}

						return this;

					// HANDLE: $(#id)
					} else {
						elem = document.getElementById( match[ 2 ] );

						// Support: Blackberry 4.6
						// gEBID returns nodes no longer in the document (#6963)
						if ( elem && elem.parentNode ) {

							// Inject the element directly into the jQuery object
							this.length = 1;
							this[ 0 ] = elem;
						}

						this.context = document;
						this.selector = selector;
						return this;
					}

				// HANDLE: $(expr, $(...))
				} else if ( !context || context.jquery ) {
					return ( context || root ).find( selector );

				// HANDLE: $(expr, context)
				// (which is just equivalent to: $(context).find(expr)
				} else {
					return this.constructor( context ).find( selector );
				}

			// HANDLE: $(DOMElement)
			} else if ( selector.nodeType ) {
				this.context = this[ 0 ] = selector;
				this.length = 1;
				return this;

			// HANDLE: $(function)
			// Shortcut for document ready
			} else if ( jQuery.isFunction( selector ) ) {
				return root.ready !== undefined ?
					root.ready( selector ) :

					// Execute immediately if ready is not present
					selector( jQuery );
			}

			if ( selector.selector !== undefined ) {
				this.selector = selector.selector;
				this.context = selector.context;
			}

			return jQuery.makeArray( selector, this );
		};

	// Give the init function the jQuery prototype for later instantiation
	init.prototype = jQuery.fn;

	// Initialize central reference
	rootjQuery = jQuery( document );


	var rparentsprev = /^(?:parents|prev(?:Until|All))/,

		// Methods guaranteed to produce a unique set when starting from a unique set
		guaranteedUnique = {
			children: true,
			contents: true,
			next: true,
			prev: true
		};

	jQuery.fn.extend( {
		has: function( target ) {
			var targets = jQuery( target, this ),
				l = targets.length;

			return this.filter( function() {
				var i = 0;
				for ( ; i < l; i++ ) {
					if ( jQuery.contains( this, targets[ i ] ) ) {
						return true;
					}
				}
			} );
		},

		closest: function( selectors, context ) {
			var cur,
				i = 0,
				l = this.length,
				matched = [],
				pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
					jQuery( selectors, context || this.context ) :
					0;

			for ( ; i < l; i++ ) {
				for ( cur = this[ i ]; cur && cur !== context; cur = cur.parentNode ) {

					// Always skip document fragments
					if ( cur.nodeType < 11 && ( pos ?
						pos.index( cur ) > -1 :

						// Don't pass non-elements to Sizzle
						cur.nodeType === 1 &&
							jQuery.find.matchesSelector( cur, selectors ) ) ) {

						matched.push( cur );
						break;
					}
				}
			}

			return this.pushStack( matched.length > 1 ? jQuery.uniqueSort( matched ) : matched );
		},

		// Determine the position of an element within the set
		index: function( elem ) {

			// No argument, return index in parent
			if ( !elem ) {
				return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
			}

			// Index in selector
			if ( typeof elem === "string" ) {
				return indexOf.call( jQuery( elem ), this[ 0 ] );
			}

			// Locate the position of the desired element
			return indexOf.call( this,

				// If it receives a jQuery object, the first element is used
				elem.jquery ? elem[ 0 ] : elem
			);
		},

		add: function( selector, context ) {
			return this.pushStack(
				jQuery.uniqueSort(
					jQuery.merge( this.get(), jQuery( selector, context ) )
				)
			);
		},

		addBack: function( selector ) {
			return this.add( selector == null ?
				this.prevObject : this.prevObject.filter( selector )
			);
		}
	} );

	function sibling( cur, dir ) {
		while ( ( cur = cur[ dir ] ) && cur.nodeType !== 1 ) {}
		return cur;
	}

	jQuery.each( {
		parent: function( elem ) {
			var parent = elem.parentNode;
			return parent && parent.nodeType !== 11 ? parent : null;
		},
		parents: function( elem ) {
			return dir( elem, "parentNode" );
		},
		parentsUntil: function( elem, i, until ) {
			return dir( elem, "parentNode", until );
		},
		next: function( elem ) {
			return sibling( elem, "nextSibling" );
		},
		prev: function( elem ) {
			return sibling( elem, "previousSibling" );
		},
		nextAll: function( elem ) {
			return dir( elem, "nextSibling" );
		},
		prevAll: function( elem ) {
			return dir( elem, "previousSibling" );
		},
		nextUntil: function( elem, i, until ) {
			return dir( elem, "nextSibling", until );
		},
		prevUntil: function( elem, i, until ) {
			return dir( elem, "previousSibling", until );
		},
		siblings: function( elem ) {
			return siblings( ( elem.parentNode || {} ).firstChild, elem );
		},
		children: function( elem ) {
			return siblings( elem.firstChild );
		},
		contents: function( elem ) {
			return elem.contentDocument || jQuery.merge( [], elem.childNodes );
		}
	}, function( name, fn ) {
		jQuery.fn[ name ] = function( until, selector ) {
			var matched = jQuery.map( this, fn, until );

			if ( name.slice( -5 ) !== "Until" ) {
				selector = until;
			}

			if ( selector && typeof selector === "string" ) {
				matched = jQuery.filter( selector, matched );
			}

			if ( this.length > 1 ) {

				// Remove duplicates
				if ( !guaranteedUnique[ name ] ) {
					jQuery.uniqueSort( matched );
				}

				// Reverse order for parents* and prev-derivatives
				if ( rparentsprev.test( name ) ) {
					matched.reverse();
				}
			}

			return this.pushStack( matched );
		};
	} );
	var rnotwhite = ( /\S+/g );



	// Convert String-formatted options into Object-formatted ones
	function createOptions( options ) {
		var object = {};
		jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
			object[ flag ] = true;
		} );
		return object;
	}

	/*
	 * Create a callback list using the following parameters:
	 *
	 *	options: an optional list of space-separated options that will change how
	 *			the callback list behaves or a more traditional option object
	 *
	 * By default a callback list will act like an event callback list and can be
	 * "fired" multiple times.
	 *
	 * Possible options:
	 *
	 *	once:			will ensure the callback list can only be fired once (like a Deferred)
	 *
	 *	memory:			will keep track of previous values and will call any callback added
	 *					after the list has been fired right away with the latest "memorized"
	 *					values (like a Deferred)
	 *
	 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
	 *
	 *	stopOnFalse:	interrupt callings when a callback returns false
	 *
	 */
	jQuery.Callbacks = function( options ) {

		// Convert options from String-formatted to Object-formatted if needed
		// (we check in cache first)
		options = typeof options === "string" ?
			createOptions( options ) :
			jQuery.extend( {}, options );

		var // Flag to know if list is currently firing
			firing,

			// Last fire value for non-forgettable lists
			memory,

			// Flag to know if list was already fired
			fired,

			// Flag to prevent firing
			locked,

			// Actual callback list
			list = [],

			// Queue of execution data for repeatable lists
			queue = [],

			// Index of currently firing callback (modified by add/remove as needed)
			firingIndex = -1,

			// Fire callbacks
			fire = function() {

				// Enforce single-firing
				locked = options.once;

				// Execute callbacks for all pending executions,
				// respecting firingIndex overrides and runtime changes
				fired = firing = true;
				for ( ; queue.length; firingIndex = -1 ) {
					memory = queue.shift();
					while ( ++firingIndex < list.length ) {

						// Run callback and check for early termination
						if ( list[ firingIndex ].apply( memory[ 0 ], memory[ 1 ] ) === false &&
							options.stopOnFalse ) {

							// Jump to end and forget the data so .add doesn't re-fire
							firingIndex = list.length;
							memory = false;
						}
					}
				}

				// Forget the data if we're done with it
				if ( !options.memory ) {
					memory = false;
				}

				firing = false;

				// Clean up if we're done firing for good
				if ( locked ) {

					// Keep an empty list if we have data for future add calls
					if ( memory ) {
						list = [];

					// Otherwise, this object is spent
					} else {
						list = "";
					}
				}
			},

			// Actual Callbacks object
			self = {

				// Add a callback or a collection of callbacks to the list
				add: function() {
					if ( list ) {

						// If we have memory from a past run, we should fire after adding
						if ( memory && !firing ) {
							firingIndex = list.length - 1;
							queue.push( memory );
						}

						( function add( args ) {
							jQuery.each( args, function( _, arg ) {
								if ( jQuery.isFunction( arg ) ) {
									if ( !options.unique || !self.has( arg ) ) {
										list.push( arg );
									}
								} else if ( arg && arg.length && jQuery.type( arg ) !== "string" ) {

									// Inspect recursively
									add( arg );
								}
							} );
						} )( arguments );

						if ( memory && !firing ) {
							fire();
						}
					}
					return this;
				},

				// Remove a callback from the list
				remove: function() {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );

							// Handle firing indexes
							if ( index <= firingIndex ) {
								firingIndex--;
							}
						}
					} );
					return this;
				},

				// Check if a given callback is in the list.
				// If no argument is given, return whether or not list has callbacks attached.
				has: function( fn ) {
					return fn ?
						jQuery.inArray( fn, list ) > -1 :
						list.length > 0;
				},

				// Remove all callbacks from the list
				empty: function() {
					if ( list ) {
						list = [];
					}
					return this;
				},

				// Disable .fire and .add
				// Abort any current/pending executions
				// Clear all callbacks and values
				disable: function() {
					locked = queue = [];
					list = memory = "";
					return this;
				},
				disabled: function() {
					return !list;
				},

				// Disable .fire
				// Also disable .add unless we have memory (since it would have no effect)
				// Abort any pending executions
				lock: function() {
					locked = queue = [];
					if ( !memory ) {
						list = memory = "";
					}
					return this;
				},
				locked: function() {
					return !!locked;
				},

				// Call all callbacks with the given context and arguments
				fireWith: function( context, args ) {
					if ( !locked ) {
						args = args || [];
						args = [ context, args.slice ? args.slice() : args ];
						queue.push( args );
						if ( !firing ) {
							fire();
						}
					}
					return this;
				},

				// Call all the callbacks with the given arguments
				fire: function() {
					self.fireWith( this, arguments );
					return this;
				},

				// To know if the callbacks have already been called at least once
				fired: function() {
					return !!fired;
				}
			};

		return self;
	};


	jQuery.extend( {

		Deferred: function( func ) {
			var tuples = [

					// action, add listener, listener list, final state
					[ "resolve", "done", jQuery.Callbacks( "once memory" ), "resolved" ],
					[ "reject", "fail", jQuery.Callbacks( "once memory" ), "rejected" ],
					[ "notify", "progress", jQuery.Callbacks( "memory" ) ]
				],
				state = "pending",
				promise = {
					state: function() {
						return state;
					},
					always: function() {
						deferred.done( arguments ).fail( arguments );
						return this;
					},
					then: function( /* fnDone, fnFail, fnProgress */ ) {
						var fns = arguments;
						return jQuery.Deferred( function( newDefer ) {
							jQuery.each( tuples, function( i, tuple ) {
								var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];

								// deferred[ done | fail | progress ] for forwarding actions to newDefer
								deferred[ tuple[ 1 ] ]( function() {
									var returned = fn && fn.apply( this, arguments );
									if ( returned && jQuery.isFunction( returned.promise ) ) {
										returned.promise()
											.progress( newDefer.notify )
											.done( newDefer.resolve )
											.fail( newDefer.reject );
									} else {
										newDefer[ tuple[ 0 ] + "With" ](
											this === promise ? newDefer.promise() : this,
											fn ? [ returned ] : arguments
										);
									}
								} );
							} );
							fns = null;
						} ).promise();
					},

					// Get a promise for this deferred
					// If obj is provided, the promise aspect is added to the object
					promise: function( obj ) {
						return obj != null ? jQuery.extend( obj, promise ) : promise;
					}
				},
				deferred = {};

			// Keep pipe for back-compat
			promise.pipe = promise.then;

			// Add list-specific methods
			jQuery.each( tuples, function( i, tuple ) {
				var list = tuple[ 2 ],
					stateString = tuple[ 3 ];

				// promise[ done | fail | progress ] = list.add
				promise[ tuple[ 1 ] ] = list.add;

				// Handle state
				if ( stateString ) {
					list.add( function() {

						// state = [ resolved | rejected ]
						state = stateString;

					// [ reject_list | resolve_list ].disable; progress_list.lock
					}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
				}

				// deferred[ resolve | reject | notify ]
				deferred[ tuple[ 0 ] ] = function() {
					deferred[ tuple[ 0 ] + "With" ]( this === deferred ? promise : this, arguments );
					return this;
				};
				deferred[ tuple[ 0 ] + "With" ] = list.fireWith;
			} );

			// Make the deferred a promise
			promise.promise( deferred );

			// Call given func if any
			if ( func ) {
				func.call( deferred, deferred );
			}

			// All done!
			return deferred;
		},

		// Deferred helper
		when: function( subordinate /* , ..., subordinateN */ ) {
			var i = 0,
				resolveValues = slice.call( arguments ),
				length = resolveValues.length,

				// the count of uncompleted subordinates
				remaining = length !== 1 ||
					( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

				// the master Deferred.
				// If resolveValues consist of only a single Deferred, just use that.
				deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

				// Update function for both resolve and progress values
				updateFunc = function( i, contexts, values ) {
					return function( value ) {
						contexts[ i ] = this;
						values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
						if ( values === progressValues ) {
							deferred.notifyWith( contexts, values );
						} else if ( !( --remaining ) ) {
							deferred.resolveWith( contexts, values );
						}
					};
				},

				progressValues, progressContexts, resolveContexts;

			// Add listeners to Deferred subordinates; treat others as resolved
			if ( length > 1 ) {
				progressValues = new Array( length );
				progressContexts = new Array( length );
				resolveContexts = new Array( length );
				for ( ; i < length; i++ ) {
					if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
						resolveValues[ i ].promise()
							.progress( updateFunc( i, progressContexts, progressValues ) )
							.done( updateFunc( i, resolveContexts, resolveValues ) )
							.fail( deferred.reject );
					} else {
						--remaining;
					}
				}
			}

			// If we're not waiting on anything, resolve the master
			if ( !remaining ) {
				deferred.resolveWith( resolveContexts, resolveValues );
			}

			return deferred.promise();
		}
	} );


	// The deferred used on DOM ready
	var readyList;

	jQuery.fn.ready = function( fn ) {

		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	};

	jQuery.extend( {

		// Is the DOM ready to be used? Set to true once it occurs.
		isReady: false,

		// A counter to track how many items to wait for before
		// the ready event fires. See #6781
		readyWait: 1,

		// Hold (or release) the ready event
		holdReady: function( hold ) {
			if ( hold ) {
				jQuery.readyWait++;
			} else {
				jQuery.ready( true );
			}
		},

		// Handle when the DOM is ready
		ready: function( wait ) {

			// Abort if there are pending holds or we're already ready
			if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
				return;
			}

			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If a normal DOM Ready event fired, decrement, and wait if need be
			if ( wait !== true && --jQuery.readyWait > 0 ) {
				return;
			}

			// If there are functions bound, to execute
			readyList.resolveWith( document, [ jQuery ] );

			// Trigger any bound ready events
			if ( jQuery.fn.triggerHandler ) {
				jQuery( document ).triggerHandler( "ready" );
				jQuery( document ).off( "ready" );
			}
		}
	} );

	/**
	 * The ready event handler and self cleanup method
	 */
	function completed() {
		document.removeEventListener( "DOMContentLoaded", completed );
		window.removeEventListener( "load", completed );
		jQuery.ready();
	}

	jQuery.ready.promise = function( obj ) {
		if ( !readyList ) {

			readyList = jQuery.Deferred();

			// Catch cases where $(document).ready() is called
			// after the browser event has already occurred.
			// Support: IE9-10 only
			// Older IE sometimes signals "interactive" too soon
			if ( document.readyState === "complete" ||
				( document.readyState !== "loading" && !document.documentElement.doScroll ) ) {

				// Handle it asynchronously to allow scripts the opportunity to delay ready
				window.setTimeout( jQuery.ready );

			} else {

				// Use the handy event callback
				document.addEventListener( "DOMContentLoaded", completed );

				// A fallback to window.onload, that will always work
				window.addEventListener( "load", completed );
			}
		}
		return readyList.promise( obj );
	};

	// Kick off the DOM ready check even if the user does not
	jQuery.ready.promise();




	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	var access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			len = elems.length,
			bulk = key == null;

		// Sets many values
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				access( elems, fn, i, key[ i ], true, emptyGet, raw );
			}

		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {

				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < len; i++ ) {
					fn(
						elems[ i ], key, raw ?
						value :
						value.call( elems[ i ], i, fn( elems[ i ], key ) )
					);
				}
			}
		}

		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				len ? fn( elems[ 0 ], key ) : emptyGet;
	};
	var acceptData = function( owner ) {

		// Accepts only:
		//  - Node
		//    - Node.ELEMENT_NODE
		//    - Node.DOCUMENT_NODE
		//  - Object
		//    - Any
		/* jshint -W018 */
		return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
	};




	function Data() {
		this.expando = jQuery.expando + Data.uid++;
	}

	Data.uid = 1;

	Data.prototype = {

		register: function( owner, initial ) {
			var value = initial || {};

			// If it is a node unlikely to be stringify-ed or looped over
			// use plain assignment
			if ( owner.nodeType ) {
				owner[ this.expando ] = value;

			// Otherwise secure it in a non-enumerable, non-writable property
			// configurability must be true to allow the property to be
			// deleted with the delete operator
			} else {
				Object.defineProperty( owner, this.expando, {
					value: value,
					writable: true,
					configurable: true
				} );
			}
			return owner[ this.expando ];
		},
		cache: function( owner ) {

			// We can accept data for non-element nodes in modern browsers,
			// but we should not, see #8335.
			// Always return an empty object.
			if ( !acceptData( owner ) ) {
				return {};
			}

			// Check if the owner object already has a cache
			var value = owner[ this.expando ];

			// If not, create one
			if ( !value ) {
				value = {};

				// We can accept data for non-element nodes in modern browsers,
				// but we should not, see #8335.
				// Always return an empty object.
				if ( acceptData( owner ) ) {

					// If it is a node unlikely to be stringify-ed or looped over
					// use plain assignment
					if ( owner.nodeType ) {
						owner[ this.expando ] = value;

					// Otherwise secure it in a non-enumerable property
					// configurable must be true to allow the property to be
					// deleted when data is removed
					} else {
						Object.defineProperty( owner, this.expando, {
							value: value,
							configurable: true
						} );
					}
				}
			}

			return value;
		},
		set: function( owner, data, value ) {
			var prop,
				cache = this.cache( owner );

			// Handle: [ owner, key, value ] args
			if ( typeof data === "string" ) {
				cache[ data ] = value;

			// Handle: [ owner, { properties } ] args
			} else {

				// Copy the properties one-by-one to the cache object
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
			return cache;
		},
		get: function( owner, key ) {
			return key === undefined ?
				this.cache( owner ) :
				owner[ this.expando ] && owner[ this.expando ][ key ];
		},
		access: function( owner, key, value ) {
			var stored;

			// In cases where either:
			//
			//   1. No key was specified
			//   2. A string key was specified, but no value provided
			//
			// Take the "read" path and allow the get method to determine
			// which value to return, respectively either:
			//
			//   1. The entire cache object
			//   2. The data stored at the key
			//
			if ( key === undefined ||
					( ( key && typeof key === "string" ) && value === undefined ) ) {

				stored = this.get( owner, key );

				return stored !== undefined ?
					stored : this.get( owner, jQuery.camelCase( key ) );
			}

			// When the key is not a string, or both a key and value
			// are specified, set or extend (existing objects) with either:
			//
			//   1. An object of properties
			//   2. A key and value
			//
			this.set( owner, key, value );

			// Since the "set" path can have two possible entry points
			// return the expected data based on which path was taken[*]
			return value !== undefined ? value : key;
		},
		remove: function( owner, key ) {
			var i, name, camel,
				cache = owner[ this.expando ];

			if ( cache === undefined ) {
				return;
			}

			if ( key === undefined ) {
				this.register( owner );

			} else {

				// Support array or space separated string of keys
				if ( jQuery.isArray( key ) ) {

					// If "name" is an array of keys...
					// When data is initially created, via ("key", "val") signature,
					// keys will be converted to camelCase.
					// Since there is no way to tell _how_ a key was added, remove
					// both plain key and camelCase key. #12786
					// This will only penalize the array argument path.
					name = key.concat( key.map( jQuery.camelCase ) );
				} else {
					camel = jQuery.camelCase( key );

					// Try the string as a key before any manipulation
					if ( key in cache ) {
						name = [ key, camel ];
					} else {

						// If a key with the spaces exists, use it.
						// Otherwise, create an array by matching non-whitespace
						name = camel;
						name = name in cache ?
							[ name ] : ( name.match( rnotwhite ) || [] );
					}
				}

				i = name.length;

				while ( i-- ) {
					delete cache[ name[ i ] ];
				}
			}

			// Remove the expando if there's no more data
			if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

				// Support: Chrome <= 35-45+
				// Webkit & Blink performance suffers when deleting properties
				// from DOM nodes, so set to undefined instead
				// https://code.google.com/p/chromium/issues/detail?id=378607
				if ( owner.nodeType ) {
					owner[ this.expando ] = undefined;
				} else {
					delete owner[ this.expando ];
				}
			}
		},
		hasData: function( owner ) {
			var cache = owner[ this.expando ];
			return cache !== undefined && !jQuery.isEmptyObject( cache );
		}
	};
	var dataPriv = new Data();

	var dataUser = new Data();



	//	Implementation Summary
	//
	//	1. Enforce API surface and semantic compatibility with 1.9.x branch
	//	2. Improve the module's maintainability by reducing the storage
	//		paths to a single mechanism.
	//	3. Use the same single mechanism to support "private" and "user" data.
	//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	//	5. Avoid exposing implementation details on user objects (eg. expando properties)
	//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

	var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
		rmultiDash = /[A-Z]/g;

	function dataAttr( elem, key, data ) {
		var name;

		// If nothing was found internally, try to fetch any
		// data from the HTML5 data-* attribute
		if ( data === undefined && elem.nodeType === 1 ) {
			name = "data-" + key.replace( rmultiDash, "-$&" ).toLowerCase();
			data = elem.getAttribute( name );

			if ( typeof data === "string" ) {
				try {
					data = data === "true" ? true :
						data === "false" ? false :
						data === "null" ? null :

						// Only convert to a number if it doesn't change the string
						+data + "" === data ? +data :
						rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
				} catch ( e ) {}

				// Make sure we set the data so it isn't changed later
				dataUser.set( elem, key, data );
			} else {
				data = undefined;
			}
		}
		return data;
	}

	jQuery.extend( {
		hasData: function( elem ) {
			return dataUser.hasData( elem ) || dataPriv.hasData( elem );
		},

		data: function( elem, name, data ) {
			return dataUser.access( elem, name, data );
		},

		removeData: function( elem, name ) {
			dataUser.remove( elem, name );
		},

		// TODO: Now that all calls to _data and _removeData have been replaced
		// with direct calls to dataPriv methods, these can be deprecated.
		_data: function( elem, name, data ) {
			return dataPriv.access( elem, name, data );
		},

		_removeData: function( elem, name ) {
			dataPriv.remove( elem, name );
		}
	} );

	jQuery.fn.extend( {
		data: function( key, value ) {
			var i, name, data,
				elem = this[ 0 ],
				attrs = elem && elem.attributes;

			// Gets all values
			if ( key === undefined ) {
				if ( this.length ) {
					data = dataUser.get( elem );

					if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
						i = attrs.length;
						while ( i-- ) {

							// Support: IE11+
							// The attrs elements can be null (#14894)
							if ( attrs[ i ] ) {
								name = attrs[ i ].name;
								if ( name.indexOf( "data-" ) === 0 ) {
									name = jQuery.camelCase( name.slice( 5 ) );
									dataAttr( elem, name, data[ name ] );
								}
							}
						}
						dataPriv.set( elem, "hasDataAttrs", true );
					}
				}

				return data;
			}

			// Sets multiple values
			if ( typeof key === "object" ) {
				return this.each( function() {
					dataUser.set( this, key );
				} );
			}

			return access( this, function( value ) {
				var data, camelKey;

				// The calling jQuery object (element matches) is not empty
				// (and therefore has an element appears at this[ 0 ]) and the
				// `value` parameter was not undefined. An empty jQuery object
				// will result in `undefined` for elem = this[ 0 ] which will
				// throw an exception if an attempt to read a data cache is made.
				if ( elem && value === undefined ) {

					// Attempt to get data from the cache
					// with the key as-is
					data = dataUser.get( elem, key ) ||

						// Try to find dashed key if it exists (gh-2779)
						// This is for 2.2.x only
						dataUser.get( elem, key.replace( rmultiDash, "-$&" ).toLowerCase() );

					if ( data !== undefined ) {
						return data;
					}

					camelKey = jQuery.camelCase( key );

					// Attempt to get data from the cache
					// with the key camelized
					data = dataUser.get( elem, camelKey );
					if ( data !== undefined ) {
						return data;
					}

					// Attempt to "discover" the data in
					// HTML5 custom data-* attrs
					data = dataAttr( elem, camelKey, undefined );
					if ( data !== undefined ) {
						return data;
					}

					// We tried really hard, but the data doesn't exist.
					return;
				}

				// Set the data...
				camelKey = jQuery.camelCase( key );
				this.each( function() {

					// First, attempt to store a copy or reference of any
					// data that might've been store with a camelCased key.
					var data = dataUser.get( this, camelKey );

					// For HTML5 data-* attribute interop, we have to
					// store property names with dashes in a camelCase form.
					// This might not apply to all properties...*
					dataUser.set( this, camelKey, value );

					// *... In the case of properties that might _actually_
					// have dashes, we need to also store a copy of that
					// unchanged property.
					if ( key.indexOf( "-" ) > -1 && data !== undefined ) {
						dataUser.set( this, key, value );
					}
				} );
			}, null, value, arguments.length > 1, null, true );
		},

		removeData: function( key ) {
			return this.each( function() {
				dataUser.remove( this, key );
			} );
		}
	} );


	jQuery.extend( {
		queue: function( elem, type, data ) {
			var queue;

			if ( elem ) {
				type = ( type || "fx" ) + "queue";
				queue = dataPriv.get( elem, type );

				// Speed up dequeue by getting out quickly if this is just a lookup
				if ( data ) {
					if ( !queue || jQuery.isArray( data ) ) {
						queue = dataPriv.access( elem, type, jQuery.makeArray( data ) );
					} else {
						queue.push( data );
					}
				}
				return queue || [];
			}
		},

		dequeue: function( elem, type ) {
			type = type || "fx";

			var queue = jQuery.queue( elem, type ),
				startLength = queue.length,
				fn = queue.shift(),
				hooks = jQuery._queueHooks( elem, type ),
				next = function() {
					jQuery.dequeue( elem, type );
				};

			// If the fx queue is dequeued, always remove the progress sentinel
			if ( fn === "inprogress" ) {
				fn = queue.shift();
				startLength--;
			}

			if ( fn ) {

				// Add a progress sentinel to prevent the fx queue from being
				// automatically dequeued
				if ( type === "fx" ) {
					queue.unshift( "inprogress" );
				}

				// Clear up the last queue stop function
				delete hooks.stop;
				fn.call( elem, next, hooks );
			}

			if ( !startLength && hooks ) {
				hooks.empty.fire();
			}
		},

		// Not public - generate a queueHooks object, or return the current one
		_queueHooks: function( elem, type ) {
			var key = type + "queueHooks";
			return dataPriv.get( elem, key ) || dataPriv.access( elem, key, {
				empty: jQuery.Callbacks( "once memory" ).add( function() {
					dataPriv.remove( elem, [ type + "queue", key ] );
				} )
			} );
		}
	} );

	jQuery.fn.extend( {
		queue: function( type, data ) {
			var setter = 2;

			if ( typeof type !== "string" ) {
				data = type;
				type = "fx";
				setter--;
			}

			if ( arguments.length < setter ) {
				return jQuery.queue( this[ 0 ], type );
			}

			return data === undefined ?
				this :
				this.each( function() {
					var queue = jQuery.queue( this, type, data );

					// Ensure a hooks for this queue
					jQuery._queueHooks( this, type );

					if ( type === "fx" && queue[ 0 ] !== "inprogress" ) {
						jQuery.dequeue( this, type );
					}
				} );
		},
		dequeue: function( type ) {
			return this.each( function() {
				jQuery.dequeue( this, type );
			} );
		},
		clearQueue: function( type ) {
			return this.queue( type || "fx", [] );
		},

		// Get a promise resolved when queues of a certain type
		// are emptied (fx is the type by default)
		promise: function( type, obj ) {
			var tmp,
				count = 1,
				defer = jQuery.Deferred(),
				elements = this,
				i = this.length,
				resolve = function() {
					if ( !( --count ) ) {
						defer.resolveWith( elements, [ elements ] );
					}
				};

			if ( typeof type !== "string" ) {
				obj = type;
				type = undefined;
			}
			type = type || "fx";

			while ( i-- ) {
				tmp = dataPriv.get( elements[ i ], type + "queueHooks" );
				if ( tmp && tmp.empty ) {
					count++;
					tmp.empty.add( resolve );
				}
			}
			resolve();
			return defer.promise( obj );
		}
	} );
	var pnum = ( /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/ ).source;

	var rcssNum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" );


	var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

	var isHidden = function( elem, el ) {

			// isHidden might be called from jQuery#filter function;
			// in that case, element will be second argument
			elem = el || elem;
			return jQuery.css( elem, "display" ) === "none" ||
				!jQuery.contains( elem.ownerDocument, elem );
		};



	function adjustCSS( elem, prop, valueParts, tween ) {
		var adjusted,
			scale = 1,
			maxIterations = 20,
			currentValue = tween ?
				function() { return tween.cur(); } :
				function() { return jQuery.css( elem, prop, "" ); },
			initial = currentValue(),
			unit = valueParts && valueParts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

			// Starting value computation is required for potential unit mismatches
			initialInUnit = ( jQuery.cssNumber[ prop ] || unit !== "px" && +initial ) &&
				rcssNum.exec( jQuery.css( elem, prop ) );

		if ( initialInUnit && initialInUnit[ 3 ] !== unit ) {

			// Trust units reported by jQuery.css
			unit = unit || initialInUnit[ 3 ];

			// Make sure we update the tween properties later on
			valueParts = valueParts || [];

			// Iteratively approximate from a nonzero starting point
			initialInUnit = +initial || 1;

			do {

				// If previous iteration zeroed out, double until we get *something*.
				// Use string for doubling so we don't accidentally see scale as unchanged below
				scale = scale || ".5";

				// Adjust and apply
				initialInUnit = initialInUnit / scale;
				jQuery.style( elem, prop, initialInUnit + unit );

			// Update scale, tolerating zero or NaN from tween.cur()
			// Break the loop if scale is unchanged or perfect, or if we've just had enough.
			} while (
				scale !== ( scale = currentValue() / initial ) && scale !== 1 && --maxIterations
			);
		}

		if ( valueParts ) {
			initialInUnit = +initialInUnit || +initial || 0;

			// Apply relative offset (+=/-=) if specified
			adjusted = valueParts[ 1 ] ?
				initialInUnit + ( valueParts[ 1 ] + 1 ) * valueParts[ 2 ] :
				+valueParts[ 2 ];
			if ( tween ) {
				tween.unit = unit;
				tween.start = initialInUnit;
				tween.end = adjusted;
			}
		}
		return adjusted;
	}
	var rcheckableType = ( /^(?:checkbox|radio)$/i );

	var rtagName = ( /<([\w:-]+)/ );

	var rscriptType = ( /^$|\/(?:java|ecma)script/i );



	// We have to close these tags to support XHTML (#13200)
	var wrapMap = {

		// Support: IE9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		// XHTML parsers do not magically insert elements in the
		// same way that tag soup parsers do. So we cannot shorten
		// this by omitting <tbody> or other required elements.
		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

	// Support: IE9
	wrapMap.optgroup = wrapMap.option;

	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;


	function getAll( context, tag ) {

		// Support: IE9-11+
		// Use typeof to avoid zero-argument method invocation on host objects (#15151)
		var ret = typeof context.getElementsByTagName !== "undefined" ?
				context.getElementsByTagName( tag || "*" ) :
				typeof context.querySelectorAll !== "undefined" ?
					context.querySelectorAll( tag || "*" ) :
				[];

		return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
			jQuery.merge( [ context ], ret ) :
			ret;
	}


	// Mark scripts as having already been evaluated
	function setGlobalEval( elems, refElements ) {
		var i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			dataPriv.set(
				elems[ i ],
				"globalEval",
				!refElements || dataPriv.get( refElements[ i ], "globalEval" )
			);
		}
	}


	var rhtml = /<|&#?\w+;/;

	function buildFragment( elems, context, scripts, selection, ignored ) {
		var elem, tmp, tag, wrap, contains, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {

					// Support: Android<4.1, PhantomJS<2
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + jQuery.htmlPrefilter( elem ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: Android<4.1, PhantomJS<2
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Ensure the created nodes are orphaned (#12392)
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( ( elem = nodes[ i++ ] ) ) {

			// Skip elements already in the context collection (trac-4087)
			if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
				if ( ignored ) {
					ignored.push( elem );
				}
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( ( elem = tmp[ j++ ] ) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	}


	( function() {
		var fragment = document.createDocumentFragment(),
			div = fragment.appendChild( document.createElement( "div" ) ),
			input = document.createElement( "input" );

		// Support: Android 4.0-4.3, Safari<=5.1
		// Check state lost if the name is set (#11217)
		// Support: Windows Web Apps (WWA)
		// `name` and `type` must use .setAttribute for WWA (#14901)
		input.setAttribute( "type", "radio" );
		input.setAttribute( "checked", "checked" );
		input.setAttribute( "name", "t" );

		div.appendChild( input );

		// Support: Safari<=5.1, Android<4.2
		// Older WebKit doesn't clone checked state correctly in fragments
		support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

		// Support: IE<=11+
		// Make sure textarea (and checkbox) defaultValue is properly cloned
		div.innerHTML = "<textarea>x</textarea>";
		support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
	} )();


	var
		rkeyEvent = /^key/,
		rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
		rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

	function returnTrue() {
		return true;
	}

	function returnFalse() {
		return false;
	}

	// Support: IE9
	// See #13393 for more info
	function safeActiveElement() {
		try {
			return document.activeElement;
		} catch ( err ) { }
	}

	function on( elem, types, selector, data, fn, one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {

			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {

				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				on( elem, type, selector, data, types[ type ], one );
			}
			return elem;
		}

		if ( data == null && fn == null ) {

			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {

				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {

				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {

				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};

			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return elem.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		} );
	}

	/*
	 * Helper functions for managing events -- not part of the public interface.
	 * Props to Dean Edwards' addEvent library for many of the ideas.
	 */
	jQuery.event = {

		global: {},

		add: function( elem, types, handler, data, selector ) {

			var handleObjIn, eventHandle, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.get( elem );

			// Don't attach events to noData or text/comment nodes (but allow plain objects)
			if ( !elemData ) {
				return;
			}

			// Caller can pass in an object of custom data in lieu of the handler
			if ( handler.handler ) {
				handleObjIn = handler;
				handler = handleObjIn.handler;
				selector = handleObjIn.selector;
			}

			// Make sure that the handler has a unique ID, used to find/remove it later
			if ( !handler.guid ) {
				handler.guid = jQuery.guid++;
			}

			// Init the element's event structure and main handler, if this is the first
			if ( !( events = elemData.events ) ) {
				events = elemData.events = {};
			}
			if ( !( eventHandle = elemData.handle ) ) {
				eventHandle = elemData.handle = function( e ) {

					// Discard the second event of a jQuery.event.trigger() and
					// when an event is called after a page has unloaded
					return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
						jQuery.event.dispatch.apply( elem, arguments ) : undefined;
				};
			}

			// Handle multiple events separated by a space
			types = ( types || "" ).match( rnotwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// There *must* be a type, no attaching namespace-only handlers
				if ( !type ) {
					continue;
				}

				// If event changes its type, use the special event handlers for the changed type
				special = jQuery.event.special[ type ] || {};

				// If selector defined, determine special event api type, otherwise given type
				type = ( selector ? special.delegateType : special.bindType ) || type;

				// Update special based on newly reset type
				special = jQuery.event.special[ type ] || {};

				// handleObj is passed to all event handlers
				handleObj = jQuery.extend( {
					type: type,
					origType: origType,
					data: data,
					handler: handler,
					guid: handler.guid,
					selector: selector,
					needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
					namespace: namespaces.join( "." )
				}, handleObjIn );

				// Init the event handler queue if we're the first
				if ( !( handlers = events[ type ] ) ) {
					handlers = events[ type ] = [];
					handlers.delegateCount = 0;

					// Only use addEventListener if the special events handler returns false
					if ( !special.setup ||
						special.setup.call( elem, data, namespaces, eventHandle ) === false ) {

						if ( elem.addEventListener ) {
							elem.addEventListener( type, eventHandle );
						}
					}
				}

				if ( special.add ) {
					special.add.call( elem, handleObj );

					if ( !handleObj.handler.guid ) {
						handleObj.handler.guid = handler.guid;
					}
				}

				// Add to the element's handler list, delegates in front
				if ( selector ) {
					handlers.splice( handlers.delegateCount++, 0, handleObj );
				} else {
					handlers.push( handleObj );
				}

				// Keep track of which events have ever been used, for event optimization
				jQuery.event.global[ type ] = true;
			}

		},

		// Detach an event or set of events from an element
		remove: function( elem, types, handler, selector, mappedTypes ) {

			var j, origCount, tmp,
				events, t, handleObj,
				special, handlers, type, namespaces, origType,
				elemData = dataPriv.hasData( elem ) && dataPriv.get( elem );

			if ( !elemData || !( events = elemData.events ) ) {
				return;
			}

			// Once for each type.namespace in types; type may be omitted
			types = ( types || "" ).match( rnotwhite ) || [ "" ];
			t = types.length;
			while ( t-- ) {
				tmp = rtypenamespace.exec( types[ t ] ) || [];
				type = origType = tmp[ 1 ];
				namespaces = ( tmp[ 2 ] || "" ).split( "." ).sort();

				// Unbind all events (on this namespace, if provided) for the element
				if ( !type ) {
					for ( type in events ) {
						jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
					}
					continue;
				}

				special = jQuery.event.special[ type ] || {};
				type = ( selector ? special.delegateType : special.bindType ) || type;
				handlers = events[ type ] || [];
				tmp = tmp[ 2 ] &&
					new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" );

				// Remove matching events
				origCount = j = handlers.length;
				while ( j-- ) {
					handleObj = handlers[ j ];

					if ( ( mappedTypes || origType === handleObj.origType ) &&
						( !handler || handler.guid === handleObj.guid ) &&
						( !tmp || tmp.test( handleObj.namespace ) ) &&
						( !selector || selector === handleObj.selector ||
							selector === "**" && handleObj.selector ) ) {
						handlers.splice( j, 1 );

						if ( handleObj.selector ) {
							handlers.delegateCount--;
						}
						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}
				}

				// Remove generic event handler if we removed something and no more handlers exist
				// (avoids potential for endless recursion during removal of special event handlers)
				if ( origCount && !handlers.length ) {
					if ( !special.teardown ||
						special.teardown.call( elem, namespaces, elemData.handle ) === false ) {

						jQuery.removeEvent( elem, type, elemData.handle );
					}

					delete events[ type ];
				}
			}

			// Remove data and the expando if it's no longer used
			if ( jQuery.isEmptyObject( events ) ) {
				dataPriv.remove( elem, "handle events" );
			}
		},

		dispatch: function( event ) {

			// Make a writable jQuery.Event from the native event object
			event = jQuery.event.fix( event );

			var i, j, ret, matched, handleObj,
				handlerQueue = [],
				args = slice.call( arguments ),
				handlers = ( dataPriv.get( this, "events" ) || {} )[ event.type ] || [],
				special = jQuery.event.special[ event.type ] || {};

			// Use the fix-ed jQuery.Event rather than the (read-only) native event
			args[ 0 ] = event;
			event.delegateTarget = this;

			// Call the preDispatch hook for the mapped type, and let it bail if desired
			if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
				return;
			}

			// Determine handlers
			handlerQueue = jQuery.event.handlers.call( this, event, handlers );

			// Run delegates first; they may want to stop propagation beneath us
			i = 0;
			while ( ( matched = handlerQueue[ i++ ] ) && !event.isPropagationStopped() ) {
				event.currentTarget = matched.elem;

				j = 0;
				while ( ( handleObj = matched.handlers[ j++ ] ) &&
					!event.isImmediatePropagationStopped() ) {

					// Triggered event must either 1) have no namespace, or 2) have namespace(s)
					// a subset or equal to those in the bound event (both can have no namespace).
					if ( !event.rnamespace || event.rnamespace.test( handleObj.namespace ) ) {

						event.handleObj = handleObj;
						event.data = handleObj.data;

						ret = ( ( jQuery.event.special[ handleObj.origType ] || {} ).handle ||
							handleObj.handler ).apply( matched.elem, args );

						if ( ret !== undefined ) {
							if ( ( event.result = ret ) === false ) {
								event.preventDefault();
								event.stopPropagation();
							}
						}
					}
				}
			}

			// Call the postDispatch hook for the mapped type
			if ( special.postDispatch ) {
				special.postDispatch.call( this, event );
			}

			return event.result;
		},

		handlers: function( event, handlers ) {
			var i, matches, sel, handleObj,
				handlerQueue = [],
				delegateCount = handlers.delegateCount,
				cur = event.target;

			// Support (at least): Chrome, IE9
			// Find delegate handlers
			// Black-hole SVG <use> instance trees (#13180)
			//
			// Support: Firefox<=42+
			// Avoid non-left-click in FF but don't block IE radio events (#3861, gh-2343)
			if ( delegateCount && cur.nodeType &&
				( event.type !== "click" || isNaN( event.button ) || event.button < 1 ) ) {

				for ( ; cur !== this; cur = cur.parentNode || this ) {

					// Don't check non-elements (#13208)
					// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
					if ( cur.nodeType === 1 && ( cur.disabled !== true || event.type !== "click" ) ) {
						matches = [];
						for ( i = 0; i < delegateCount; i++ ) {
							handleObj = handlers[ i ];

							// Don't conflict with Object.prototype properties (#13203)
							sel = handleObj.selector + " ";

							if ( matches[ sel ] === undefined ) {
								matches[ sel ] = handleObj.needsContext ?
									jQuery( sel, this ).index( cur ) > -1 :
									jQuery.find( sel, this, null, [ cur ] ).length;
							}
							if ( matches[ sel ] ) {
								matches.push( handleObj );
							}
						}
						if ( matches.length ) {
							handlerQueue.push( { elem: cur, handlers: matches } );
						}
					}
				}
			}

			// Add the remaining (directly-bound) handlers
			if ( delegateCount < handlers.length ) {
				handlerQueue.push( { elem: this, handlers: handlers.slice( delegateCount ) } );
			}

			return handlerQueue;
		},

		// Includes some event props shared by KeyEvent and MouseEvent
		props: ( "altKey bubbles cancelable ctrlKey currentTarget detail eventPhase " +
			"metaKey relatedTarget shiftKey target timeStamp view which" ).split( " " ),

		fixHooks: {},

		keyHooks: {
			props: "char charCode key keyCode".split( " " ),
			filter: function( event, original ) {

				// Add which for key events
				if ( event.which == null ) {
					event.which = original.charCode != null ? original.charCode : original.keyCode;
				}

				return event;
			}
		},

		mouseHooks: {
			props: ( "button buttons clientX clientY offsetX offsetY pageX pageY " +
				"screenX screenY toElement" ).split( " " ),
			filter: function( event, original ) {
				var eventDoc, doc, body,
					button = original.button;

				// Calculate pageX/Y if missing and clientX/Y available
				if ( event.pageX == null && original.clientX != null ) {
					eventDoc = event.target.ownerDocument || document;
					doc = eventDoc.documentElement;
					body = eventDoc.body;

					event.pageX = original.clientX +
						( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
						( doc && doc.clientLeft || body && body.clientLeft || 0 );
					event.pageY = original.clientY +
						( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
						( doc && doc.clientTop  || body && body.clientTop  || 0 );
				}

				// Add which for click: 1 === left; 2 === middle; 3 === right
				// Note: button is not normalized, so don't use it
				if ( !event.which && button !== undefined ) {
					event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
				}

				return event;
			}
		},

		fix: function( event ) {
			if ( event[ jQuery.expando ] ) {
				return event;
			}

			// Create a writable copy of the event object and normalize some properties
			var i, prop, copy,
				type = event.type,
				originalEvent = event,
				fixHook = this.fixHooks[ type ];

			if ( !fixHook ) {
				this.fixHooks[ type ] = fixHook =
					rmouseEvent.test( type ) ? this.mouseHooks :
					rkeyEvent.test( type ) ? this.keyHooks :
					{};
			}
			copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

			event = new jQuery.Event( originalEvent );

			i = copy.length;
			while ( i-- ) {
				prop = copy[ i ];
				event[ prop ] = originalEvent[ prop ];
			}

			// Support: Cordova 2.5 (WebKit) (#13255)
			// All events should have a target; Cordova deviceready doesn't
			if ( !event.target ) {
				event.target = document;
			}

			// Support: Safari 6.0+, Chrome<28
			// Target should not be a text node (#504, #13143)
			if ( event.target.nodeType === 3 ) {
				event.target = event.target.parentNode;
			}

			return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
		},

		special: {
			load: {

				// Prevent triggered image.load events from bubbling to window.load
				noBubble: true
			},
			focus: {

				// Fire native event if possible so blur/focus sequence is correct
				trigger: function() {
					if ( this !== safeActiveElement() && this.focus ) {
						this.focus();
						return false;
					}
				},
				delegateType: "focusin"
			},
			blur: {
				trigger: function() {
					if ( this === safeActiveElement() && this.blur ) {
						this.blur();
						return false;
					}
				},
				delegateType: "focusout"
			},
			click: {

				// For checkbox, fire native event so checked state will be right
				trigger: function() {
					if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
						this.click();
						return false;
					}
				},

				// For cross-browser consistency, don't fire native .click() on links
				_default: function( event ) {
					return jQuery.nodeName( event.target, "a" );
				}
			},

			beforeunload: {
				postDispatch: function( event ) {

					// Support: Firefox 20+
					// Firefox doesn't alert if the returnValue field is not set.
					if ( event.result !== undefined && event.originalEvent ) {
						event.originalEvent.returnValue = event.result;
					}
				}
			}
		}
	};

	jQuery.removeEvent = function( elem, type, handle ) {

		// This "if" is needed for plain objects
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle );
		}
	};

	jQuery.Event = function( src, props ) {

		// Allow instantiation without the 'new' keyword
		if ( !( this instanceof jQuery.Event ) ) {
			return new jQuery.Event( src, props );
		}

		// Event object
		if ( src && src.type ) {
			this.originalEvent = src;
			this.type = src.type;

			// Events bubbling up the document may have been marked as prevented
			// by a handler lower down the tree; reflect the correct value.
			this.isDefaultPrevented = src.defaultPrevented ||
					src.defaultPrevented === undefined &&

					// Support: Android<4.0
					src.returnValue === false ?
				returnTrue :
				returnFalse;

		// Event type
		} else {
			this.type = src;
		}

		// Put explicitly provided properties onto the event object
		if ( props ) {
			jQuery.extend( this, props );
		}

		// Create a timestamp if incoming event doesn't have one
		this.timeStamp = src && src.timeStamp || jQuery.now();

		// Mark it as fixed
		this[ jQuery.expando ] = true;
	};

	// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
	// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
	jQuery.Event.prototype = {
		constructor: jQuery.Event,
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse,

		preventDefault: function() {
			var e = this.originalEvent;

			this.isDefaultPrevented = returnTrue;

			if ( e ) {
				e.preventDefault();
			}
		},
		stopPropagation: function() {
			var e = this.originalEvent;

			this.isPropagationStopped = returnTrue;

			if ( e ) {
				e.stopPropagation();
			}
		},
		stopImmediatePropagation: function() {
			var e = this.originalEvent;

			this.isImmediatePropagationStopped = returnTrue;

			if ( e ) {
				e.stopImmediatePropagation();
			}

			this.stopPropagation();
		}
	};

	// Create mouseenter/leave events using mouseover/out and event-time checks
	// so that event delegation works in jQuery.
	// Do the same for pointerenter/pointerleave and pointerover/pointerout
	//
	// Support: Safari 7 only
	// Safari sends mouseenter too often; see:
	// https://code.google.com/p/chromium/issues/detail?id=470258
	// for the description of the bug (it existed in older Chrome versions as well).
	jQuery.each( {
		mouseenter: "mouseover",
		mouseleave: "mouseout",
		pointerenter: "pointerover",
		pointerleave: "pointerout"
	}, function( orig, fix ) {
		jQuery.event.special[ orig ] = {
			delegateType: fix,
			bindType: fix,

			handle: function( event ) {
				var ret,
					target = this,
					related = event.relatedTarget,
					handleObj = event.handleObj;

				// For mouseenter/leave call the handler if related is outside the target.
				// NB: No relatedTarget if the mouse left/entered the browser window
				if ( !related || ( related !== target && !jQuery.contains( target, related ) ) ) {
					event.type = handleObj.origType;
					ret = handleObj.handler.apply( this, arguments );
					event.type = fix;
				}
				return ret;
			}
		};
	} );

	jQuery.fn.extend( {
		on: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn );
		},
		one: function( types, selector, data, fn ) {
			return on( this, types, selector, data, fn, 1 );
		},
		off: function( types, selector, fn ) {
			var handleObj, type;
			if ( types && types.preventDefault && types.handleObj ) {

				// ( event )  dispatched jQuery.Event
				handleObj = types.handleObj;
				jQuery( types.delegateTarget ).off(
					handleObj.namespace ?
						handleObj.origType + "." + handleObj.namespace :
						handleObj.origType,
					handleObj.selector,
					handleObj.handler
				);
				return this;
			}
			if ( typeof types === "object" ) {

				// ( types-object [, selector] )
				for ( type in types ) {
					this.off( type, selector, types[ type ] );
				}
				return this;
			}
			if ( selector === false || typeof selector === "function" ) {

				// ( types [, fn] )
				fn = selector;
				selector = undefined;
			}
			if ( fn === false ) {
				fn = returnFalse;
			}
			return this.each( function() {
				jQuery.event.remove( this, types, fn, selector );
			} );
		}
	} );


	var
		rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,

		// Support: IE 10-11, Edge 10240+
		// In IE/Edge using regex groups here causes severe slowdowns.
		// See https://connect.microsoft.com/IE/feedback/details/1736512/
		rnoInnerhtml = /<script|<style|<link/i,

		// checked="checked" or checked
		rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
		rscriptTypeMasked = /^true\/(.*)/,
		rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

	function manipulationTarget( elem, content ) {
		if ( jQuery.nodeName( elem, "table" ) &&
			jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ) {

			return elem.getElementsByTagName( "tbody" )[ 0 ] || elem;
		}

		return elem;
	}

	// Replace/restore the type attribute of script elements for safe DOM manipulation
	function disableScript( elem ) {
		elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
		return elem;
	}
	function restoreScript( elem ) {
		var match = rscriptTypeMasked.exec( elem.type );

		if ( match ) {
			elem.type = match[ 1 ];
		} else {
			elem.removeAttribute( "type" );
		}

		return elem;
	}

	function cloneCopyEvent( src, dest ) {
		var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

		if ( dest.nodeType !== 1 ) {
			return;
		}

		// 1. Copy private data: events, handlers, etc.
		if ( dataPriv.hasData( src ) ) {
			pdataOld = dataPriv.access( src );
			pdataCur = dataPriv.set( dest, pdataOld );
			events = pdataOld.events;

			if ( events ) {
				delete pdataCur.handle;
				pdataCur.events = {};

				for ( type in events ) {
					for ( i = 0, l = events[ type ].length; i < l; i++ ) {
						jQuery.event.add( dest, type, events[ type ][ i ] );
					}
				}
			}
		}

		// 2. Copy user data
		if ( dataUser.hasData( src ) ) {
			udataOld = dataUser.access( src );
			udataCur = jQuery.extend( {}, udataOld );

			dataUser.set( dest, udataCur );
		}
	}

	// Fix IE bugs, see support tests
	function fixInput( src, dest ) {
		var nodeName = dest.nodeName.toLowerCase();

		// Fails to persist the checked state of a cloned checkbox or radio button.
		if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
			dest.checked = src.checked;

		// Fails to return the selected option to the default selected state when cloning options
		} else if ( nodeName === "input" || nodeName === "textarea" ) {
			dest.defaultValue = src.defaultValue;
		}
	}

	function domManip( collection, args, callback, ignored ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = collection.length,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return collection.each( function( index ) {
				var self = collection.eq( index );
				if ( isFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				domManip( self, args, callback, ignored );
			} );
		}

		if ( l ) {
			fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			// Require either new content or an interest in ignored elements to invoke the callback
			if ( first || ignored ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item
				// instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {

							// Support: Android<4.1, PhantomJS<2
							// push.apply(_, arraylike) throws on ancient WebKit
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( collection[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!dataPriv.access( node, "globalEval" ) &&
							jQuery.contains( doc, node ) ) {

							if ( node.src ) {

								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}

		return collection;
	}

	function remove( elem, selector, keepData ) {
		var node,
			nodes = selector ? jQuery.filter( selector, elem ) : elem,
			i = 0;

		for ( ; ( node = nodes[ i ] ) != null; i++ ) {
			if ( !keepData && node.nodeType === 1 ) {
				jQuery.cleanData( getAll( node ) );
			}

			if ( node.parentNode ) {
				if ( keepData && jQuery.contains( node.ownerDocument, node ) ) {
					setGlobalEval( getAll( node, "script" ) );
				}
				node.parentNode.removeChild( node );
			}
		}

		return elem;
	}

	jQuery.extend( {
		htmlPrefilter: function( html ) {
			return html.replace( rxhtmlTag, "<$1></$2>" );
		},

		clone: function( elem, dataAndEvents, deepDataAndEvents ) {
			var i, l, srcElements, destElements,
				clone = elem.cloneNode( true ),
				inPage = jQuery.contains( elem.ownerDocument, elem );

			// Fix IE cloning issues
			if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
					!jQuery.isXMLDoc( elem ) ) {

				// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
				destElements = getAll( clone );
				srcElements = getAll( elem );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					fixInput( srcElements[ i ], destElements[ i ] );
				}
			}

			// Copy the events from the original to the clone
			if ( dataAndEvents ) {
				if ( deepDataAndEvents ) {
					srcElements = srcElements || getAll( elem );
					destElements = destElements || getAll( clone );

					for ( i = 0, l = srcElements.length; i < l; i++ ) {
						cloneCopyEvent( srcElements[ i ], destElements[ i ] );
					}
				} else {
					cloneCopyEvent( elem, clone );
				}
			}

			// Preserve script evaluation history
			destElements = getAll( clone, "script" );
			if ( destElements.length > 0 ) {
				setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
			}

			// Return the cloned set
			return clone;
		},

		cleanData: function( elems ) {
			var data, elem, type,
				special = jQuery.event.special,
				i = 0;

			for ( ; ( elem = elems[ i ] ) !== undefined; i++ ) {
				if ( acceptData( elem ) ) {
					if ( ( data = elem[ dataPriv.expando ] ) ) {
						if ( data.events ) {
							for ( type in data.events ) {
								if ( special[ type ] ) {
									jQuery.event.remove( elem, type );

								// This is a shortcut to avoid jQuery.event.remove's overhead
								} else {
									jQuery.removeEvent( elem, type, data.handle );
								}
							}
						}

						// Support: Chrome <= 35-45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataPriv.expando ] = undefined;
					}
					if ( elem[ dataUser.expando ] ) {

						// Support: Chrome <= 35-45+
						// Assign undefined instead of using delete, see Data#remove
						elem[ dataUser.expando ] = undefined;
					}
				}
			}
		}
	} );

	jQuery.fn.extend( {

		// Keep domManip exposed until 3.0 (gh-2225)
		domManip: domManip,

		detach: function( selector ) {
			return remove( this, selector, true );
		},

		remove: function( selector ) {
			return remove( this, selector );
		},

		text: function( value ) {
			return access( this, function( value ) {
				return value === undefined ?
					jQuery.text( this ) :
					this.empty().each( function() {
						if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
							this.textContent = value;
						}
					} );
			}, null, value, arguments.length );
		},

		append: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.appendChild( elem );
				}
			} );
		},

		prepend: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
					var target = manipulationTarget( this, elem );
					target.insertBefore( elem, target.firstChild );
				}
			} );
		},

		before: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this );
				}
			} );
		},

		after: function() {
			return domManip( this, arguments, function( elem ) {
				if ( this.parentNode ) {
					this.parentNode.insertBefore( elem, this.nextSibling );
				}
			} );
		},

		empty: function() {
			var elem,
				i = 0;

			for ( ; ( elem = this[ i ] ) != null; i++ ) {
				if ( elem.nodeType === 1 ) {

					// Prevent memory leaks
					jQuery.cleanData( getAll( elem, false ) );

					// Remove any remaining nodes
					elem.textContent = "";
				}
			}

			return this;
		},

		clone: function( dataAndEvents, deepDataAndEvents ) {
			dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
			deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

			return this.map( function() {
				return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
			} );
		},

		html: function( value ) {
			return access( this, function( value ) {
				var elem = this[ 0 ] || {},
					i = 0,
					l = this.length;

				if ( value === undefined && elem.nodeType === 1 ) {
					return elem.innerHTML;
				}

				// See if we can take a shortcut and just use innerHTML
				if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
					!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

					value = jQuery.htmlPrefilter( value );

					try {
						for ( ; i < l; i++ ) {
							elem = this[ i ] || {};

							// Remove element nodes and prevent memory leaks
							if ( elem.nodeType === 1 ) {
								jQuery.cleanData( getAll( elem, false ) );
								elem.innerHTML = value;
							}
						}

						elem = 0;

					// If using innerHTML throws an exception, use the fallback method
					} catch ( e ) {}
				}

				if ( elem ) {
					this.empty().append( value );
				}
			}, null, value, arguments.length );
		},

		replaceWith: function() {
			var ignored = [];

			// Make the changes, replacing each non-ignored context element with the new content
			return domManip( this, arguments, function( elem ) {
				var parent = this.parentNode;

				if ( jQuery.inArray( this, ignored ) < 0 ) {
					jQuery.cleanData( getAll( this ) );
					if ( parent ) {
						parent.replaceChild( elem, this );
					}
				}

			// Force callback invocation
			}, ignored );
		}
	} );

	jQuery.each( {
		appendTo: "append",
		prependTo: "prepend",
		insertBefore: "before",
		insertAfter: "after",
		replaceAll: "replaceWith"
	}, function( name, original ) {
		jQuery.fn[ name ] = function( selector ) {
			var elems,
				ret = [],
				insert = jQuery( selector ),
				last = insert.length - 1,
				i = 0;

			for ( ; i <= last; i++ ) {
				elems = i === last ? this : this.clone( true );
				jQuery( insert[ i ] )[ original ]( elems );

				// Support: QtWebKit
				// .get() because push.apply(_, arraylike) throws
				push.apply( ret, elems.get() );
			}

			return this.pushStack( ret );
		};
	} );


	var iframe,
		elemdisplay = {

			// Support: Firefox
			// We have to pre-define these values for FF (#10227)
			HTML: "block",
			BODY: "block"
		};

	/**
	 * Retrieve the actual display of a element
	 * @param {String} name nodeName of the element
	 * @param {Object} doc Document object
	 */

	// Called only from within defaultDisplay
	function actualDisplay( name, doc ) {
		var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

			display = jQuery.css( elem[ 0 ], "display" );

		// We don't have any data stored on the element,
		// so use "detach" method as fast way to get rid of the element
		elem.detach();

		return display;
	}

	/**
	 * Try to determine the default display value of an element
	 * @param {String} nodeName
	 */
	function defaultDisplay( nodeName ) {
		var doc = document,
			display = elemdisplay[ nodeName ];

		if ( !display ) {
			display = actualDisplay( nodeName, doc );

			// If the simple way fails, read from inside an iframe
			if ( display === "none" || !display ) {

				// Use the already-created iframe if possible
				iframe = ( iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" ) )
					.appendTo( doc.documentElement );

				// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
				doc = iframe[ 0 ].contentDocument;

				// Support: IE
				doc.write();
				doc.close();

				display = actualDisplay( nodeName, doc );
				iframe.detach();
			}

			// Store the correct default display
			elemdisplay[ nodeName ] = display;
		}

		return display;
	}
	var rmargin = ( /^margin/ );

	var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

	var getStyles = function( elem ) {

			// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
			// IE throws on elements created in popups
			// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
			var view = elem.ownerDocument.defaultView;

			if ( !view.opener ) {
				view = window;
			}

			return view.getComputedStyle( elem );
		};

	var swap = function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.apply( elem, args || [] );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	};


	var documentElement = document.documentElement;



	( function() {
		var pixelPositionVal, boxSizingReliableVal, pixelMarginRightVal, reliableMarginLeftVal,
			container = document.createElement( "div" ),
			div = document.createElement( "div" );

		// Finish early in limited (non-browser) environments
		if ( !div.style ) {
			return;
		}

		// Support: IE9-11+
		// Style of cloned element affects source element cloned (#8908)
		div.style.backgroundClip = "content-box";
		div.cloneNode( true ).style.backgroundClip = "";
		support.clearCloneStyle = div.style.backgroundClip === "content-box";

		container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" +
			"padding:0;margin-top:1px;position:absolute";
		container.appendChild( div );

		// Executing both pixelPosition & boxSizingReliable tests require only one layout
		// so they're executed at the same time to save the second computation.
		function computeStyleTests() {
			div.style.cssText =

				// Support: Firefox<29, Android 2.3
				// Vendor-prefix box-sizing
				"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;" +
				"position:relative;display:block;" +
				"margin:auto;border:1px;padding:1px;" +
				"top:1%;width:50%";
			div.innerHTML = "";
			documentElement.appendChild( container );

			var divStyle = window.getComputedStyle( div );
			pixelPositionVal = divStyle.top !== "1%";
			reliableMarginLeftVal = divStyle.marginLeft === "2px";
			boxSizingReliableVal = divStyle.width === "4px";

			// Support: Android 4.0 - 4.3 only
			// Some styles come back with percentage values, even though they shouldn't
			div.style.marginRight = "50%";
			pixelMarginRightVal = divStyle.marginRight === "4px";

			documentElement.removeChild( container );
		}

		jQuery.extend( support, {
			pixelPosition: function() {

				// This test is executed only once but we still do memoizing
				// since we can use the boxSizingReliable pre-computing.
				// No need to check if the test was already performed, though.
				computeStyleTests();
				return pixelPositionVal;
			},
			boxSizingReliable: function() {
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return boxSizingReliableVal;
			},
			pixelMarginRight: function() {

				// Support: Android 4.0-4.3
				// We're checking for boxSizingReliableVal here instead of pixelMarginRightVal
				// since that compresses better and they're computed together anyway.
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return pixelMarginRightVal;
			},
			reliableMarginLeft: function() {

				// Support: IE <=8 only, Android 4.0 - 4.3 only, Firefox <=3 - 37
				if ( boxSizingReliableVal == null ) {
					computeStyleTests();
				}
				return reliableMarginLeftVal;
			},
			reliableMarginRight: function() {

				// Support: Android 2.3
				// Check if div with explicit width and no margin-right incorrectly
				// gets computed margin-right based on width of container. (#3333)
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// This support function is only executed once so no memoizing is needed.
				var ret,
					marginDiv = div.appendChild( document.createElement( "div" ) );

				// Reset CSS: box-sizing; display; margin; border; padding
				marginDiv.style.cssText = div.style.cssText =

					// Support: Android 2.3
					// Vendor-prefix box-sizing
					"-webkit-box-sizing:content-box;box-sizing:content-box;" +
					"display:block;margin:0;border:0;padding:0";
				marginDiv.style.marginRight = marginDiv.style.width = "0";
				div.style.width = "1px";
				documentElement.appendChild( container );

				ret = !parseFloat( window.getComputedStyle( marginDiv ).marginRight );

				documentElement.removeChild( container );
				div.removeChild( marginDiv );

				return ret;
			}
		} );
	} )();


	function curCSS( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			style = elem.style;

		computed = computed || getStyles( elem );

		// Support: IE9
		// getPropertyValue is only needed for .css('filter') (#12537)
		if ( computed ) {
			ret = computed.getPropertyValue( name ) || computed[ name ];

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Android Browser returns percentage for some values,
			// but width seems to be reliably pixels.
			// This is against the CSSOM draft spec:
			// http://dev.w3.org/csswg/cssom/#resolved-values
			if ( !support.pixelMarginRight() && rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret !== undefined ?

			// Support: IE9-11+
			// IE returns zIndex value as an integer.
			ret + "" :
			ret;
	}


	function addGetHookIf( conditionFn, hookFn ) {

		// Define the hook, we'll check on the first run if it's really needed.
		return {
			get: function() {
				if ( conditionFn() ) {

					// Hook not needed (or it's not possible to use it due
					// to missing dependency), remove it.
					delete this.get;
					return;
				}

				// Hook needed; redefine it so that the support test is not executed again.
				return ( this.get = hookFn ).apply( this, arguments );
			}
		};
	}


	var

		// Swappable if display is none or starts with table
		// except "table", "table-cell", or "table-caption"
		// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
		rdisplayswap = /^(none|table(?!-c[ea]).+)/,

		cssShow = { position: "absolute", visibility: "hidden", display: "block" },
		cssNormalTransform = {
			letterSpacing: "0",
			fontWeight: "400"
		},

		cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],
		emptyStyle = document.createElement( "div" ).style;

	// Return a css property mapped to a potentially vendor prefixed property
	function vendorPropName( name ) {

		// Shortcut for names that are not vendor prefixed
		if ( name in emptyStyle ) {
			return name;
		}

		// Check for vendor prefixed names
		var capName = name[ 0 ].toUpperCase() + name.slice( 1 ),
			i = cssPrefixes.length;

		while ( i-- ) {
			name = cssPrefixes[ i ] + capName;
			if ( name in emptyStyle ) {
				return name;
			}
		}
	}

	function setPositiveNumber( elem, value, subtract ) {

		// Any relative (+/-) values have already been
		// normalized at this point
		var matches = rcssNum.exec( value );
		return matches ?

			// Guard against undefined "subtract", e.g., when used as in cssHooks
			Math.max( 0, matches[ 2 ] - ( subtract || 0 ) ) + ( matches[ 3 ] || "px" ) :
			value;
	}

	function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
		var i = extra === ( isBorderBox ? "border" : "content" ) ?

			// If we already have the right measurement, avoid augmentation
			4 :

			// Otherwise initialize for horizontal or vertical properties
			name === "width" ? 1 : 0,

			val = 0;

		for ( ; i < 4; i += 2 ) {

			// Both box models exclude margin, so add it if we want it
			if ( extra === "margin" ) {
				val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
			}

			if ( isBorderBox ) {

				// border-box includes padding, so remove it if we want content
				if ( extra === "content" ) {
					val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
				}

				// At this point, extra isn't border nor margin, so remove border
				if ( extra !== "margin" ) {
					val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			} else {

				// At this point, extra isn't content, so add padding
				val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

				// At this point, extra isn't content nor padding, so add border
				if ( extra !== "padding" ) {
					val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
				}
			}
		}

		return val;
	}

	function getWidthOrHeight( elem, name, extra ) {

		// Start with offset property, which is equivalent to the border-box value
		var valueIsBorderBox = true,
			val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
			styles = getStyles( elem ),
			isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

		// Support: IE11 only
		// In IE 11 fullscreen elements inside of an iframe have
		// 100x too small dimensions (gh-1764).
		if ( document.msFullscreenElement && window.top !== window ) {

			// Support: IE11 only
			// Running getBoundingClientRect on a disconnected node
			// in IE throws an error.
			if ( elem.getClientRects().length ) {
				val = Math.round( elem.getBoundingClientRect()[ name ] * 100 );
			}
		}

		// Some non-html elements return undefined for offsetWidth, so check for null/undefined
		// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
		// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
		if ( val <= 0 || val == null ) {

			// Fall back to computed then uncomputed css if necessary
			val = curCSS( elem, name, styles );
			if ( val < 0 || val == null ) {
				val = elem.style[ name ];
			}

			// Computed unit is not pixels. Stop here and return.
			if ( rnumnonpx.test( val ) ) {
				return val;
			}

			// Check for style in case a browser which returns unreliable values
			// for getComputedStyle silently falls back to the reliable elem.style
			valueIsBorderBox = isBorderBox &&
				( support.boxSizingReliable() || val === elem.style[ name ] );

			// Normalize "", auto, and prepare for extra
			val = parseFloat( val ) || 0;
		}

		// Use the active box-sizing model to add/subtract irrelevant styles
		return ( val +
			augmentWidthOrHeight(
				elem,
				name,
				extra || ( isBorderBox ? "border" : "content" ),
				valueIsBorderBox,
				styles
			)
		) + "px";
	}

	function showHide( elements, show ) {
		var display, elem, hidden,
			values = [],
			index = 0,
			length = elements.length;

		for ( ; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}

			values[ index ] = dataPriv.get( elem, "olddisplay" );
			display = elem.style.display;
			if ( show ) {

				// Reset the inline display of this element to learn if it is
				// being hidden by cascaded rules or not
				if ( !values[ index ] && display === "none" ) {
					elem.style.display = "";
				}

				// Set elements which have been overridden with display: none
				// in a stylesheet to whatever the default browser style is
				// for such an element
				if ( elem.style.display === "" && isHidden( elem ) ) {
					values[ index ] = dataPriv.access(
						elem,
						"olddisplay",
						defaultDisplay( elem.nodeName )
					);
				}
			} else {
				hidden = isHidden( elem );

				if ( display !== "none" || !hidden ) {
					dataPriv.set(
						elem,
						"olddisplay",
						hidden ? display : jQuery.css( elem, "display" )
					);
				}
			}
		}

		// Set the display of most of the elements in a second loop
		// to avoid the constant reflow
		for ( index = 0; index < length; index++ ) {
			elem = elements[ index ];
			if ( !elem.style ) {
				continue;
			}
			if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
				elem.style.display = show ? values[ index ] || "" : "none";
			}
		}

		return elements;
	}

	jQuery.extend( {

		// Add in style property hooks for overriding the default
		// behavior of getting and setting a style property
		cssHooks: {
			opacity: {
				get: function( elem, computed ) {
					if ( computed ) {

						// We should always get a number back from opacity
						var ret = curCSS( elem, "opacity" );
						return ret === "" ? "1" : ret;
					}
				}
			}
		},

		// Don't automatically add "px" to these possibly-unitless properties
		cssNumber: {
			"animationIterationCount": true,
			"columnCount": true,
			"fillOpacity": true,
			"flexGrow": true,
			"flexShrink": true,
			"fontWeight": true,
			"lineHeight": true,
			"opacity": true,
			"order": true,
			"orphans": true,
			"widows": true,
			"zIndex": true,
			"zoom": true
		},

		// Add in properties whose names you wish to fix before
		// setting or getting the value
		cssProps: {
			"float": "cssFloat"
		},

		// Get and set the style property on a DOM Node
		style: function( elem, name, value, extra ) {

			// Don't set styles on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
				return;
			}

			// Make sure that we're working with the right name
			var ret, type, hooks,
				origName = jQuery.camelCase( name ),
				style = elem.style;

			name = jQuery.cssProps[ origName ] ||
				( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

			// Gets hook for the prefixed version, then unprefixed version
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// Check if we're setting a value
			if ( value !== undefined ) {
				type = typeof value;

				// Convert "+=" or "-=" to relative numbers (#7345)
				if ( type === "string" && ( ret = rcssNum.exec( value ) ) && ret[ 1 ] ) {
					value = adjustCSS( elem, name, ret );

					// Fixes bug #9237
					type = "number";
				}

				// Make sure that null and NaN values aren't set (#7116)
				if ( value == null || value !== value ) {
					return;
				}

				// If a number was passed in, add the unit (except for certain CSS properties)
				if ( type === "number" ) {
					value += ret && ret[ 3 ] || ( jQuery.cssNumber[ origName ] ? "" : "px" );
				}

				// Support: IE9-11+
				// background-* props affect original clone's values
				if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
					style[ name ] = "inherit";
				}

				// If a hook was provided, use that value, otherwise just set the specified value
				if ( !hooks || !( "set" in hooks ) ||
					( value = hooks.set( elem, value, extra ) ) !== undefined ) {

					style[ name ] = value;
				}

			} else {

				// If a hook was provided get the non-computed value from there
				if ( hooks && "get" in hooks &&
					( ret = hooks.get( elem, false, extra ) ) !== undefined ) {

					return ret;
				}

				// Otherwise just get the value from the style object
				return style[ name ];
			}
		},

		css: function( elem, name, extra, styles ) {
			var val, num, hooks,
				origName = jQuery.camelCase( name );

			// Make sure that we're working with the right name
			name = jQuery.cssProps[ origName ] ||
				( jQuery.cssProps[ origName ] = vendorPropName( origName ) || origName );

			// Try prefixed name followed by the unprefixed name
			hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

			// If a hook was provided get the computed value from there
			if ( hooks && "get" in hooks ) {
				val = hooks.get( elem, true, extra );
			}

			// Otherwise, if a way to get the computed value exists, use that
			if ( val === undefined ) {
				val = curCSS( elem, name, styles );
			}

			// Convert "normal" to computed value
			if ( val === "normal" && name in cssNormalTransform ) {
				val = cssNormalTransform[ name ];
			}

			// Make numeric if forced or a qualifier was provided and val looks numeric
			if ( extra === "" || extra ) {
				num = parseFloat( val );
				return extra === true || isFinite( num ) ? num || 0 : val;
			}
			return val;
		}
	} );

	jQuery.each( [ "height", "width" ], function( i, name ) {
		jQuery.cssHooks[ name ] = {
			get: function( elem, computed, extra ) {
				if ( computed ) {

					// Certain elements can have dimension info if we invisibly show them
					// but it must have a current display style that would benefit
					return rdisplayswap.test( jQuery.css( elem, "display" ) ) &&
						elem.offsetWidth === 0 ?
							swap( elem, cssShow, function() {
								return getWidthOrHeight( elem, name, extra );
							} ) :
							getWidthOrHeight( elem, name, extra );
				}
			},

			set: function( elem, value, extra ) {
				var matches,
					styles = extra && getStyles( elem ),
					subtract = extra && augmentWidthOrHeight(
						elem,
						name,
						extra,
						jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
						styles
					);

				// Convert to pixels if value adjustment is needed
				if ( subtract && ( matches = rcssNum.exec( value ) ) &&
					( matches[ 3 ] || "px" ) !== "px" ) {

					elem.style[ name ] = value;
					value = jQuery.css( elem, name );
				}

				return setPositiveNumber( elem, value, subtract );
			}
		};
	} );

	jQuery.cssHooks.marginLeft = addGetHookIf( support.reliableMarginLeft,
		function( elem, computed ) {
			if ( computed ) {
				return ( parseFloat( curCSS( elem, "marginLeft" ) ) ||
					elem.getBoundingClientRect().left -
						swap( elem, { marginLeft: 0 }, function() {
							return elem.getBoundingClientRect().left;
						} )
					) + "px";
			}
		}
	);

	// Support: Android 2.3
	jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
		function( elem, computed ) {
			if ( computed ) {
				return swap( elem, { "display": "inline-block" },
					curCSS, [ elem, "marginRight" ] );
			}
		}
	);

	// These hooks are used by animate to expand properties
	jQuery.each( {
		margin: "",
		padding: "",
		border: "Width"
	}, function( prefix, suffix ) {
		jQuery.cssHooks[ prefix + suffix ] = {
			expand: function( value ) {
				var i = 0,
					expanded = {},

					// Assumes a single number if not a string
					parts = typeof value === "string" ? value.split( " " ) : [ value ];

				for ( ; i < 4; i++ ) {
					expanded[ prefix + cssExpand[ i ] + suffix ] =
						parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
				}

				return expanded;
			}
		};

		if ( !rmargin.test( prefix ) ) {
			jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
		}
	} );

	jQuery.fn.extend( {
		css: function( name, value ) {
			return access( this, function( elem, name, value ) {
				var styles, len,
					map = {},
					i = 0;

				if ( jQuery.isArray( name ) ) {
					styles = getStyles( elem );
					len = name.length;

					for ( ; i < len; i++ ) {
						map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
					}

					return map;
				}

				return value !== undefined ?
					jQuery.style( elem, name, value ) :
					jQuery.css( elem, name );
			}, name, value, arguments.length > 1 );
		},
		show: function() {
			return showHide( this, true );
		},
		hide: function() {
			return showHide( this );
		},
		toggle: function( state ) {
			if ( typeof state === "boolean" ) {
				return state ? this.show() : this.hide();
			}

			return this.each( function() {
				if ( isHidden( this ) ) {
					jQuery( this ).show();
				} else {
					jQuery( this ).hide();
				}
			} );
		}
	} );


	function Tween( elem, options, prop, end, easing ) {
		return new Tween.prototype.init( elem, options, prop, end, easing );
	}
	jQuery.Tween = Tween;

	Tween.prototype = {
		constructor: Tween,
		init: function( elem, options, prop, end, easing, unit ) {
			this.elem = elem;
			this.prop = prop;
			this.easing = easing || jQuery.easing._default;
			this.options = options;
			this.start = this.now = this.cur();
			this.end = end;
			this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
		},
		cur: function() {
			var hooks = Tween.propHooks[ this.prop ];

			return hooks && hooks.get ?
				hooks.get( this ) :
				Tween.propHooks._default.get( this );
		},
		run: function( percent ) {
			var eased,
				hooks = Tween.propHooks[ this.prop ];

			if ( this.options.duration ) {
				this.pos = eased = jQuery.easing[ this.easing ](
					percent, this.options.duration * percent, 0, 1, this.options.duration
				);
			} else {
				this.pos = eased = percent;
			}
			this.now = ( this.end - this.start ) * eased + this.start;

			if ( this.options.step ) {
				this.options.step.call( this.elem, this.now, this );
			}

			if ( hooks && hooks.set ) {
				hooks.set( this );
			} else {
				Tween.propHooks._default.set( this );
			}
			return this;
		}
	};

	Tween.prototype.init.prototype = Tween.prototype;

	Tween.propHooks = {
		_default: {
			get: function( tween ) {
				var result;

				// Use a property on the element directly when it is not a DOM element,
				// or when there is no matching style property that exists.
				if ( tween.elem.nodeType !== 1 ||
					tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
					return tween.elem[ tween.prop ];
				}

				// Passing an empty string as a 3rd parameter to .css will automatically
				// attempt a parseFloat and fallback to a string if the parse fails.
				// Simple values such as "10px" are parsed to Float;
				// complex values such as "rotate(1rad)" are returned as-is.
				result = jQuery.css( tween.elem, tween.prop, "" );

				// Empty strings, null, undefined and "auto" are converted to 0.
				return !result || result === "auto" ? 0 : result;
			},
			set: function( tween ) {

				// Use step hook for back compat.
				// Use cssHook if its there.
				// Use .style if available and use plain properties where available.
				if ( jQuery.fx.step[ tween.prop ] ) {
					jQuery.fx.step[ tween.prop ]( tween );
				} else if ( tween.elem.nodeType === 1 &&
					( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null ||
						jQuery.cssHooks[ tween.prop ] ) ) {
					jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
				} else {
					tween.elem[ tween.prop ] = tween.now;
				}
			}
		}
	};

	// Support: IE9
	// Panic based approach to setting things on disconnected nodes
	Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
		set: function( tween ) {
			if ( tween.elem.nodeType && tween.elem.parentNode ) {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	};

	jQuery.easing = {
		linear: function( p ) {
			return p;
		},
		swing: function( p ) {
			return 0.5 - Math.cos( p * Math.PI ) / 2;
		},
		_default: "swing"
	};

	jQuery.fx = Tween.prototype.init;

	// Back Compat <1.8 extension point
	jQuery.fx.step = {};




	var
		fxNow, timerId,
		rfxtypes = /^(?:toggle|show|hide)$/,
		rrun = /queueHooks$/;

	// Animations created synchronously will run synchronously
	function createFxNow() {
		window.setTimeout( function() {
			fxNow = undefined;
		} );
		return ( fxNow = jQuery.now() );
	}

	// Generate parameters to create a standard animation
	function genFx( type, includeWidth ) {
		var which,
			i = 0,
			attrs = { height: type };

		// If we include width, step value is 1 to do all cssExpand values,
		// otherwise step value is 2 to skip over Left and Right
		includeWidth = includeWidth ? 1 : 0;
		for ( ; i < 4 ; i += 2 - includeWidth ) {
			which = cssExpand[ i ];
			attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
		}

		if ( includeWidth ) {
			attrs.opacity = attrs.width = type;
		}

		return attrs;
	}

	function createTween( value, prop, animation ) {
		var tween,
			collection = ( Animation.tweeners[ prop ] || [] ).concat( Animation.tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( ( tween = collection[ index ].call( animation, prop, value ) ) ) {

				// We're done with this property
				return tween;
			}
		}
	}

	function defaultPrefilter( elem, props, opts ) {
		/* jshint validthis: true */
		var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
			anim = this,
			orig = {},
			style = elem.style,
			hidden = elem.nodeType && isHidden( elem ),
			dataShow = dataPriv.get( elem, "fxshow" );

		// Handle queue: false promises
		if ( !opts.queue ) {
			hooks = jQuery._queueHooks( elem, "fx" );
			if ( hooks.unqueued == null ) {
				hooks.unqueued = 0;
				oldfire = hooks.empty.fire;
				hooks.empty.fire = function() {
					if ( !hooks.unqueued ) {
						oldfire();
					}
				};
			}
			hooks.unqueued++;

			anim.always( function() {

				// Ensure the complete handler is called before this completes
				anim.always( function() {
					hooks.unqueued--;
					if ( !jQuery.queue( elem, "fx" ).length ) {
						hooks.empty.fire();
					}
				} );
			} );
		}

		// Height/width overflow pass
		if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {

			// Make sure that nothing sneaks out
			// Record all 3 overflow attributes because IE9-10 do not
			// change the overflow attribute when overflowX and
			// overflowY are set to the same value
			opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

			// Set display property to inline-block for height/width
			// animations on inline elements that are having width/height animated
			display = jQuery.css( elem, "display" );

			// Test default display if display is currently "none"
			checkDisplay = display === "none" ?
				dataPriv.get( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;

			if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {
				style.display = "inline-block";
			}
		}

		if ( opts.overflow ) {
			style.overflow = "hidden";
			anim.always( function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			} );
		}

		// show/hide pass
		for ( prop in props ) {
			value = props[ prop ];
			if ( rfxtypes.exec( value ) ) {
				delete props[ prop ];
				toggle = toggle || value === "toggle";
				if ( value === ( hidden ? "hide" : "show" ) ) {

					// If there is dataShow left over from a stopped hide or show
					// and we are going to proceed with show, we should pretend to be hidden
					if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
						hidden = true;
					} else {
						continue;
					}
				}
				orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

			// Any non-fx value stops us from restoring the original display value
			} else {
				display = undefined;
			}
		}

		if ( !jQuery.isEmptyObject( orig ) ) {
			if ( dataShow ) {
				if ( "hidden" in dataShow ) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.access( elem, "fxshow", {} );
			}

			// Store state if its toggle - enables .stop().toggle() to "reverse"
			if ( toggle ) {
				dataShow.hidden = !hidden;
			}
			if ( hidden ) {
				jQuery( elem ).show();
			} else {
				anim.done( function() {
					jQuery( elem ).hide();
				} );
			}
			anim.done( function() {
				var prop;

				dataPriv.remove( elem, "fxshow" );
				for ( prop in orig ) {
					jQuery.style( elem, prop, orig[ prop ] );
				}
			} );
			for ( prop in orig ) {
				tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

				if ( !( prop in dataShow ) ) {
					dataShow[ prop ] = tween.start;
					if ( hidden ) {
						tween.end = tween.start;
						tween.start = prop === "width" || prop === "height" ? 1 : 0;
					}
				}
			}

		// If this is a noop like .hide().hide(), restore an overwritten display value
		} else if ( ( display === "none" ? defaultDisplay( elem.nodeName ) : display ) === "inline" ) {
			style.display = display;
		}
	}

	function propFilter( props, specialEasing ) {
		var index, name, easing, value, hooks;

		// camelCase, specialEasing and expand cssHook pass
		for ( index in props ) {
			name = jQuery.camelCase( index );
			easing = specialEasing[ name ];
			value = props[ index ];
			if ( jQuery.isArray( value ) ) {
				easing = value[ 1 ];
				value = props[ index ] = value[ 0 ];
			}

			if ( index !== name ) {
				props[ name ] = value;
				delete props[ index ];
			}

			hooks = jQuery.cssHooks[ name ];
			if ( hooks && "expand" in hooks ) {
				value = hooks.expand( value );
				delete props[ name ];

				// Not quite $.extend, this won't overwrite existing keys.
				// Reusing 'index' because we have the correct "name"
				for ( index in value ) {
					if ( !( index in props ) ) {
						props[ index ] = value[ index ];
						specialEasing[ index ] = easing;
					}
				}
			} else {
				specialEasing[ name ] = easing;
			}
		}
	}

	function Animation( elem, properties, options ) {
		var result,
			stopped,
			index = 0,
			length = Animation.prefilters.length,
			deferred = jQuery.Deferred().always( function() {

				// Don't match elem in the :animated selector
				delete tick.elem;
			} ),
			tick = function() {
				if ( stopped ) {
					return false;
				}
				var currentTime = fxNow || createFxNow(),
					remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),

					// Support: Android 2.3
					// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
					temp = remaining / animation.duration || 0,
					percent = 1 - temp,
					index = 0,
					length = animation.tweens.length;

				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( percent );
				}

				deferred.notifyWith( elem, [ animation, percent, remaining ] );

				if ( percent < 1 && length ) {
					return remaining;
				} else {
					deferred.resolveWith( elem, [ animation ] );
					return false;
				}
			},
			animation = deferred.promise( {
				elem: elem,
				props: jQuery.extend( {}, properties ),
				opts: jQuery.extend( true, {
					specialEasing: {},
					easing: jQuery.easing._default
				}, options ),
				originalProperties: properties,
				originalOptions: options,
				startTime: fxNow || createFxNow(),
				duration: options.duration,
				tweens: [],
				createTween: function( prop, end ) {
					var tween = jQuery.Tween( elem, animation.opts, prop, end,
							animation.opts.specialEasing[ prop ] || animation.opts.easing );
					animation.tweens.push( tween );
					return tween;
				},
				stop: function( gotoEnd ) {
					var index = 0,

						// If we are going to the end, we want to run all the tweens
						// otherwise we skip this part
						length = gotoEnd ? animation.tweens.length : 0;
					if ( stopped ) {
						return this;
					}
					stopped = true;
					for ( ; index < length ; index++ ) {
						animation.tweens[ index ].run( 1 );
					}

					// Resolve when we played the last frame; otherwise, reject
					if ( gotoEnd ) {
						deferred.notifyWith( elem, [ animation, 1, 0 ] );
						deferred.resolveWith( elem, [ animation, gotoEnd ] );
					} else {
						deferred.rejectWith( elem, [ animation, gotoEnd ] );
					}
					return this;
				}
			} ),
			props = animation.props;

		propFilter( props, animation.opts.specialEasing );

		for ( ; index < length ; index++ ) {
			result = Animation.prefilters[ index ].call( animation, elem, props, animation.opts );
			if ( result ) {
				if ( jQuery.isFunction( result.stop ) ) {
					jQuery._queueHooks( animation.elem, animation.opts.queue ).stop =
						jQuery.proxy( result.stop, result );
				}
				return result;
			}
		}

		jQuery.map( props, createTween, animation );

		if ( jQuery.isFunction( animation.opts.start ) ) {
			animation.opts.start.call( elem, animation );
		}

		jQuery.fx.timer(
			jQuery.extend( tick, {
				elem: elem,
				anim: animation,
				queue: animation.opts.queue
			} )
		);

		// attach callbacks from options
		return animation.progress( animation.opts.progress )
			.done( animation.opts.done, animation.opts.complete )
			.fail( animation.opts.fail )
			.always( animation.opts.always );
	}

	jQuery.Animation = jQuery.extend( Animation, {
		tweeners: {
			"*": [ function( prop, value ) {
				var tween = this.createTween( prop, value );
				adjustCSS( tween.elem, prop, rcssNum.exec( value ), tween );
				return tween;
			} ]
		},

		tweener: function( props, callback ) {
			if ( jQuery.isFunction( props ) ) {
				callback = props;
				props = [ "*" ];
			} else {
				props = props.match( rnotwhite );
			}

			var prop,
				index = 0,
				length = props.length;

			for ( ; index < length ; index++ ) {
				prop = props[ index ];
				Animation.tweeners[ prop ] = Animation.tweeners[ prop ] || [];
				Animation.tweeners[ prop ].unshift( callback );
			}
		},

		prefilters: [ defaultPrefilter ],

		prefilter: function( callback, prepend ) {
			if ( prepend ) {
				Animation.prefilters.unshift( callback );
			} else {
				Animation.prefilters.push( callback );
			}
		}
	} );

	jQuery.speed = function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
		};

		opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ?
			opt.duration : opt.duration in jQuery.fx.speeds ?
				jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

		// Normalize opt.queue - true/undefined/null -> "fx"
		if ( opt.queue == null || opt.queue === true ) {
			opt.queue = "fx";
		}

		// Queueing
		opt.old = opt.complete;

		opt.complete = function() {
			if ( jQuery.isFunction( opt.old ) ) {
				opt.old.call( this );
			}

			if ( opt.queue ) {
				jQuery.dequeue( this, opt.queue );
			}
		};

		return opt;
	};

	jQuery.fn.extend( {
		fadeTo: function( speed, to, easing, callback ) {

			// Show any hidden elements after setting opacity to 0
			return this.filter( isHidden ).css( "opacity", 0 ).show()

				// Animate to the value specified
				.end().animate( { opacity: to }, speed, easing, callback );
		},
		animate: function( prop, speed, easing, callback ) {
			var empty = jQuery.isEmptyObject( prop ),
				optall = jQuery.speed( speed, easing, callback ),
				doAnimation = function() {

					// Operate on a copy of prop so per-property easing won't be lost
					var anim = Animation( this, jQuery.extend( {}, prop ), optall );

					// Empty animations, or finishing resolves immediately
					if ( empty || dataPriv.get( this, "finish" ) ) {
						anim.stop( true );
					}
				};
				doAnimation.finish = doAnimation;

			return empty || optall.queue === false ?
				this.each( doAnimation ) :
				this.queue( optall.queue, doAnimation );
		},
		stop: function( type, clearQueue, gotoEnd ) {
			var stopQueue = function( hooks ) {
				var stop = hooks.stop;
				delete hooks.stop;
				stop( gotoEnd );
			};

			if ( typeof type !== "string" ) {
				gotoEnd = clearQueue;
				clearQueue = type;
				type = undefined;
			}
			if ( clearQueue && type !== false ) {
				this.queue( type || "fx", [] );
			}

			return this.each( function() {
				var dequeue = true,
					index = type != null && type + "queueHooks",
					timers = jQuery.timers,
					data = dataPriv.get( this );

				if ( index ) {
					if ( data[ index ] && data[ index ].stop ) {
						stopQueue( data[ index ] );
					}
				} else {
					for ( index in data ) {
						if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
							stopQueue( data[ index ] );
						}
					}
				}

				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this &&
						( type == null || timers[ index ].queue === type ) ) {

						timers[ index ].anim.stop( gotoEnd );
						dequeue = false;
						timers.splice( index, 1 );
					}
				}

				// Start the next in the queue if the last step wasn't forced.
				// Timers currently will call their complete callbacks, which
				// will dequeue but only if they were gotoEnd.
				if ( dequeue || !gotoEnd ) {
					jQuery.dequeue( this, type );
				}
			} );
		},
		finish: function( type ) {
			if ( type !== false ) {
				type = type || "fx";
			}
			return this.each( function() {
				var index,
					data = dataPriv.get( this ),
					queue = data[ type + "queue" ],
					hooks = data[ type + "queueHooks" ],
					timers = jQuery.timers,
					length = queue ? queue.length : 0;

				// Enable finishing flag on private data
				data.finish = true;

				// Empty the queue first
				jQuery.queue( this, type, [] );

				if ( hooks && hooks.stop ) {
					hooks.stop.call( this, true );
				}

				// Look for any active animations, and finish them
				for ( index = timers.length; index--; ) {
					if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
						timers[ index ].anim.stop( true );
						timers.splice( index, 1 );
					}
				}

				// Look for any animations in the old queue and finish them
				for ( index = 0; index < length; index++ ) {
					if ( queue[ index ] && queue[ index ].finish ) {
						queue[ index ].finish.call( this );
					}
				}

				// Turn off finishing flag
				delete data.finish;
			} );
		}
	} );

	jQuery.each( [ "toggle", "show", "hide" ], function( i, name ) {
		var cssFn = jQuery.fn[ name ];
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return speed == null || typeof speed === "boolean" ?
				cssFn.apply( this, arguments ) :
				this.animate( genFx( name, true ), speed, easing, callback );
		};
	} );

	// Generate shortcuts for custom animations
	jQuery.each( {
		slideDown: genFx( "show" ),
		slideUp: genFx( "hide" ),
		slideToggle: genFx( "toggle" ),
		fadeIn: { opacity: "show" },
		fadeOut: { opacity: "hide" },
		fadeToggle: { opacity: "toggle" }
	}, function( name, props ) {
		jQuery.fn[ name ] = function( speed, easing, callback ) {
			return this.animate( props, speed, easing, callback );
		};
	} );

	jQuery.timers = [];
	jQuery.fx.tick = function() {
		var timer,
			i = 0,
			timers = jQuery.timers;

		fxNow = jQuery.now();

		for ( ; i < timers.length; i++ ) {
			timer = timers[ i ];

			// Checks the timer has not already been removed
			if ( !timer() && timers[ i ] === timer ) {
				timers.splice( i--, 1 );
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
		fxNow = undefined;
	};

	jQuery.fx.timer = function( timer ) {
		jQuery.timers.push( timer );
		if ( timer() ) {
			jQuery.fx.start();
		} else {
			jQuery.timers.pop();
		}
	};

	jQuery.fx.interval = 13;
	jQuery.fx.start = function() {
		if ( !timerId ) {
			timerId = window.setInterval( jQuery.fx.tick, jQuery.fx.interval );
		}
	};

	jQuery.fx.stop = function() {
		window.clearInterval( timerId );

		timerId = null;
	};

	jQuery.fx.speeds = {
		slow: 600,
		fast: 200,

		// Default speed
		_default: 400
	};


	// Based off of the plugin by Clint Helfers, with permission.
	// http://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
	jQuery.fn.delay = function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = window.setTimeout( next, time );
			hooks.stop = function() {
				window.clearTimeout( timeout );
			};
		} );
	};


	( function() {
		var input = document.createElement( "input" ),
			select = document.createElement( "select" ),
			opt = select.appendChild( document.createElement( "option" ) );

		input.type = "checkbox";

		// Support: iOS<=5.1, Android<=4.2+
		// Default value for a checkbox should be "on"
		support.checkOn = input.value !== "";

		// Support: IE<=11+
		// Must access selectedIndex to make default options select
		support.optSelected = opt.selected;

		// Support: Android<=2.3
		// Options inside disabled selects are incorrectly marked as disabled
		select.disabled = true;
		support.optDisabled = !opt.disabled;

		// Support: IE<=11+
		// An input loses its value after becoming a radio
		input = document.createElement( "input" );
		input.value = "t";
		input.type = "radio";
		support.radioValue = input.value === "t";
	} )();


	var boolHook,
		attrHandle = jQuery.expr.attrHandle;

	jQuery.fn.extend( {
		attr: function( name, value ) {
			return access( this, jQuery.attr, name, value, arguments.length > 1 );
		},

		removeAttr: function( name ) {
			return this.each( function() {
				jQuery.removeAttr( this, name );
			} );
		}
	} );

	jQuery.extend( {
		attr: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set attributes on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			// Fallback to prop when attributes are not supported
			if ( typeof elem.getAttribute === "undefined" ) {
				return jQuery.prop( elem, name, value );
			}

			// All attributes are lowercase
			// Grab necessary hook if one is defined
			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
				name = name.toLowerCase();
				hooks = jQuery.attrHooks[ name ] ||
					( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
			}

			if ( value !== undefined ) {
				if ( value === null ) {
					jQuery.removeAttr( elem, name );
					return;
				}

				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				elem.setAttribute( name, value + "" );
				return value;
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ? undefined : ret;
		},

		attrHooks: {
			type: {
				set: function( elem, value ) {
					if ( !support.radioValue && value === "radio" &&
						jQuery.nodeName( elem, "input" ) ) {
						var val = elem.value;
						elem.setAttribute( "type", value );
						if ( val ) {
							elem.value = val;
						}
						return value;
					}
				}
			}
		},

		removeAttr: function( elem, value ) {
			var name, propName,
				i = 0,
				attrNames = value && value.match( rnotwhite );

			if ( attrNames && elem.nodeType === 1 ) {
				while ( ( name = attrNames[ i++ ] ) ) {
					propName = jQuery.propFix[ name ] || name;

					// Boolean attributes get special treatment (#10870)
					if ( jQuery.expr.match.bool.test( name ) ) {

						// Set corresponding property to false
						elem[ propName ] = false;
					}

					elem.removeAttribute( name );
				}
			}
		}
	} );

	// Hooks for boolean attributes
	boolHook = {
		set: function( elem, value, name ) {
			if ( value === false ) {

				// Remove boolean attributes when set to false
				jQuery.removeAttr( elem, name );
			} else {
				elem.setAttribute( name, name );
			}
			return name;
		}
	};
	jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
		var getter = attrHandle[ name ] || jQuery.find.attr;

		attrHandle[ name ] = function( elem, name, isXML ) {
			var ret, handle;
			if ( !isXML ) {

				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ name ];
				attrHandle[ name ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					name.toLowerCase() :
					null;
				attrHandle[ name ] = handle;
			}
			return ret;
		};
	} );




	var rfocusable = /^(?:input|select|textarea|button)$/i,
		rclickable = /^(?:a|area)$/i;

	jQuery.fn.extend( {
		prop: function( name, value ) {
			return access( this, jQuery.prop, name, value, arguments.length > 1 );
		},

		removeProp: function( name ) {
			return this.each( function() {
				delete this[ jQuery.propFix[ name ] || name ];
			} );
		}
	} );

	jQuery.extend( {
		prop: function( elem, name, value ) {
			var ret, hooks,
				nType = elem.nodeType;

			// Don't get/set properties on text, comment and attribute nodes
			if ( nType === 3 || nType === 8 || nType === 2 ) {
				return;
			}

			if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {

				// Fix name and attach hooks
				name = jQuery.propFix[ name ] || name;
				hooks = jQuery.propHooks[ name ];
			}

			if ( value !== undefined ) {
				if ( hooks && "set" in hooks &&
					( ret = hooks.set( elem, value, name ) ) !== undefined ) {
					return ret;
				}

				return ( elem[ name ] = value );
			}

			if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
				return ret;
			}

			return elem[ name ];
		},

		propHooks: {
			tabIndex: {
				get: function( elem ) {

					// elem.tabIndex doesn't always return the
					// correct value when it hasn't been explicitly set
					// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
					// Use proper attribute retrieval(#12072)
					var tabindex = jQuery.find.attr( elem, "tabindex" );

					return tabindex ?
						parseInt( tabindex, 10 ) :
						rfocusable.test( elem.nodeName ) ||
							rclickable.test( elem.nodeName ) && elem.href ?
								0 :
								-1;
				}
			}
		},

		propFix: {
			"for": "htmlFor",
			"class": "className"
		}
	} );

	if ( !support.optSelected ) {
		jQuery.propHooks.selected = {
			get: function( elem ) {
				var parent = elem.parentNode;
				if ( parent && parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
				return null;
			}
		};
	}

	jQuery.each( [
		"tabIndex",
		"readOnly",
		"maxLength",
		"cellSpacing",
		"cellPadding",
		"rowSpan",
		"colSpan",
		"useMap",
		"frameBorder",
		"contentEditable"
	], function() {
		jQuery.propFix[ this.toLowerCase() ] = this;
	} );




	var rclass = /[\t\r\n\f]/g;

	function getClass( elem ) {
		return elem.getAttribute && elem.getAttribute( "class" ) || "";
	}

	jQuery.fn.extend( {
		addClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;

			if ( jQuery.isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).addClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			if ( typeof value === "string" && value ) {
				classes = value.match( rnotwhite ) || [];

				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );
					cur = elem.nodeType === 1 &&
						( " " + curValue + " " ).replace( rclass, " " );

					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {
							if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
								cur += clazz + " ";
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = jQuery.trim( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}

			return this;
		},

		removeClass: function( value ) {
			var classes, elem, cur, curValue, clazz, j, finalValue,
				i = 0;

			if ( jQuery.isFunction( value ) ) {
				return this.each( function( j ) {
					jQuery( this ).removeClass( value.call( this, j, getClass( this ) ) );
				} );
			}

			if ( !arguments.length ) {
				return this.attr( "class", "" );
			}

			if ( typeof value === "string" && value ) {
				classes = value.match( rnotwhite ) || [];

				while ( ( elem = this[ i++ ] ) ) {
					curValue = getClass( elem );

					// This expression is here for better compressibility (see addClass)
					cur = elem.nodeType === 1 &&
						( " " + curValue + " " ).replace( rclass, " " );

					if ( cur ) {
						j = 0;
						while ( ( clazz = classes[ j++ ] ) ) {

							// Remove *all* instances
							while ( cur.indexOf( " " + clazz + " " ) > -1 ) {
								cur = cur.replace( " " + clazz + " ", " " );
							}
						}

						// Only assign if different to avoid unneeded rendering.
						finalValue = jQuery.trim( cur );
						if ( curValue !== finalValue ) {
							elem.setAttribute( "class", finalValue );
						}
					}
				}
			}

			return this;
		},

		toggleClass: function( value, stateVal ) {
			var type = typeof value;

			if ( typeof stateVal === "boolean" && type === "string" ) {
				return stateVal ? this.addClass( value ) : this.removeClass( value );
			}

			if ( jQuery.isFunction( value ) ) {
				return this.each( function( i ) {
					jQuery( this ).toggleClass(
						value.call( this, i, getClass( this ), stateVal ),
						stateVal
					);
				} );
			}

			return this.each( function() {
				var className, i, self, classNames;

				if ( type === "string" ) {

					// Toggle individual class names
					i = 0;
					self = jQuery( this );
					classNames = value.match( rnotwhite ) || [];

					while ( ( className = classNames[ i++ ] ) ) {

						// Check each className given, space separated list
						if ( self.hasClass( className ) ) {
							self.removeClass( className );
						} else {
							self.addClass( className );
						}
					}

				// Toggle whole class name
				} else if ( value === undefined || type === "boolean" ) {
					className = getClass( this );
					if ( className ) {

						// Store className if set
						dataPriv.set( this, "__className__", className );
					}

					// If the element has a class name or if we're passed `false`,
					// then remove the whole classname (if there was one, the above saved it).
					// Otherwise bring back whatever was previously saved (if anything),
					// falling back to the empty string if nothing was stored.
					if ( this.setAttribute ) {
						this.setAttribute( "class",
							className || value === false ?
							"" :
							dataPriv.get( this, "__className__" ) || ""
						);
					}
				}
			} );
		},

		hasClass: function( selector ) {
			var className, elem,
				i = 0;

			className = " " + selector + " ";
			while ( ( elem = this[ i++ ] ) ) {
				if ( elem.nodeType === 1 &&
					( " " + getClass( elem ) + " " ).replace( rclass, " " )
						.indexOf( className ) > -1
				) {
					return true;
				}
			}

			return false;
		}
	} );




	var rreturn = /\r/g;

	jQuery.fn.extend( {
		val: function( value ) {
			var hooks, ret, isFunction,
				elem = this[ 0 ];

			if ( !arguments.length ) {
				if ( elem ) {
					hooks = jQuery.valHooks[ elem.type ] ||
						jQuery.valHooks[ elem.nodeName.toLowerCase() ];

					if ( hooks &&
						"get" in hooks &&
						( ret = hooks.get( elem, "value" ) ) !== undefined
					) {
						return ret;
					}

					ret = elem.value;

					return typeof ret === "string" ?

						// Handle most common string cases
						ret.replace( rreturn, "" ) :

						// Handle cases where value is null/undef or number
						ret == null ? "" : ret;
				}

				return;
			}

			isFunction = jQuery.isFunction( value );

			return this.each( function( i ) {
				var val;

				if ( this.nodeType !== 1 ) {
					return;
				}

				if ( isFunction ) {
					val = value.call( this, i, jQuery( this ).val() );
				} else {
					val = value;
				}

				// Treat null/undefined as ""; convert numbers to string
				if ( val == null ) {
					val = "";

				} else if ( typeof val === "number" ) {
					val += "";

				} else if ( jQuery.isArray( val ) ) {
					val = jQuery.map( val, function( value ) {
						return value == null ? "" : value + "";
					} );
				}

				hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

				// If set returns undefined, fall back to normal setting
				if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
					this.value = val;
				}
			} );
		}
	} );

	jQuery.extend( {
		valHooks: {
			option: {
				get: function( elem ) {

					// Support: IE<11
					// option.value not trimmed (#14858)
					return jQuery.trim( elem.value );
				}
			},
			select: {
				get: function( elem ) {
					var value, option,
						options = elem.options,
						index = elem.selectedIndex,
						one = elem.type === "select-one" || index < 0,
						values = one ? null : [],
						max = one ? index + 1 : options.length,
						i = index < 0 ?
							max :
							one ? index : 0;

					// Loop through all the selected options
					for ( ; i < max; i++ ) {
						option = options[ i ];

						// IE8-9 doesn't update selected after form reset (#2551)
						if ( ( option.selected || i === index ) &&

								// Don't return options that are disabled or in a disabled optgroup
								( support.optDisabled ?
									!option.disabled : option.getAttribute( "disabled" ) === null ) &&
								( !option.parentNode.disabled ||
									!jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

							// Get the specific value for the option
							value = jQuery( option ).val();

							// We don't need an array for one selects
							if ( one ) {
								return value;
							}

							// Multi-Selects return an array
							values.push( value );
						}
					}

					return values;
				},

				set: function( elem, value ) {
					var optionSet, option,
						options = elem.options,
						values = jQuery.makeArray( value ),
						i = options.length;

					while ( i-- ) {
						option = options[ i ];
						if ( option.selected =
								jQuery.inArray( jQuery.valHooks.option.get( option ), values ) > -1
						) {
							optionSet = true;
						}
					}

					// Force browsers to behave consistently when non-matching value is set
					if ( !optionSet ) {
						elem.selectedIndex = -1;
					}
					return values;
				}
			}
		}
	} );

	// Radios and checkboxes getter/setter
	jQuery.each( [ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			set: function( elem, value ) {
				if ( jQuery.isArray( value ) ) {
					return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
				}
			}
		};
		if ( !support.checkOn ) {
			jQuery.valHooks[ this ].get = function( elem ) {
				return elem.getAttribute( "value" ) === null ? "on" : elem.value;
			};
		}
	} );




	// Return jQuery for attributes-only inclusion


	var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;

	jQuery.extend( jQuery.event, {

		trigger: function( event, data, elem, onlyHandlers ) {

			var i, cur, tmp, bubbleType, ontype, handle, special,
				eventPath = [ elem || document ],
				type = hasOwn.call( event, "type" ) ? event.type : event,
				namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

			cur = tmp = elem = elem || document;

			// Don't do events on text and comment nodes
			if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
				return;
			}

			// focus/blur morphs to focusin/out; ensure we're not firing them right now
			if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
				return;
			}

			if ( type.indexOf( "." ) > -1 ) {

				// Namespaced trigger; create a regexp to match event type in handle()
				namespaces = type.split( "." );
				type = namespaces.shift();
				namespaces.sort();
			}
			ontype = type.indexOf( ":" ) < 0 && "on" + type;

			// Caller can pass in a jQuery.Event object, Object, or just an event type string
			event = event[ jQuery.expando ] ?
				event :
				new jQuery.Event( type, typeof event === "object" && event );

			// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
			event.isTrigger = onlyHandlers ? 2 : 3;
			event.namespace = namespaces.join( "." );
			event.rnamespace = event.namespace ?
				new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
				null;

			// Clean up the event in case it is being reused
			event.result = undefined;
			if ( !event.target ) {
				event.target = elem;
			}

			// Clone any incoming data and prepend the event, creating the handler arg list
			data = data == null ?
				[ event ] :
				jQuery.makeArray( data, [ event ] );

			// Allow special events to draw outside the lines
			special = jQuery.event.special[ type ] || {};
			if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
				return;
			}

			// Determine event propagation path in advance, per W3C events spec (#9951)
			// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
			if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

				bubbleType = special.delegateType || type;
				if ( !rfocusMorph.test( bubbleType + type ) ) {
					cur = cur.parentNode;
				}
				for ( ; cur; cur = cur.parentNode ) {
					eventPath.push( cur );
					tmp = cur;
				}

				// Only add window if we got to document (e.g., not plain obj or detached DOM)
				if ( tmp === ( elem.ownerDocument || document ) ) {
					eventPath.push( tmp.defaultView || tmp.parentWindow || window );
				}
			}

			// Fire handlers on the event path
			i = 0;
			while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {

				event.type = i > 1 ?
					bubbleType :
					special.bindType || type;

				// jQuery handler
				handle = ( dataPriv.get( cur, "events" ) || {} )[ event.type ] &&
					dataPriv.get( cur, "handle" );
				if ( handle ) {
					handle.apply( cur, data );
				}

				// Native handler
				handle = ontype && cur[ ontype ];
				if ( handle && handle.apply && acceptData( cur ) ) {
					event.result = handle.apply( cur, data );
					if ( event.result === false ) {
						event.preventDefault();
					}
				}
			}
			event.type = type;

			// If nobody prevented the default action, do it now
			if ( !onlyHandlers && !event.isDefaultPrevented() ) {

				if ( ( !special._default ||
					special._default.apply( eventPath.pop(), data ) === false ) &&
					acceptData( elem ) ) {

					// Call a native DOM method on the target with the same name name as the event.
					// Don't do default actions on window, that's where global variables be (#6170)
					if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

						// Don't re-trigger an onFOO event when we call its FOO() method
						tmp = elem[ ontype ];

						if ( tmp ) {
							elem[ ontype ] = null;
						}

						// Prevent re-triggering of the same event, since we already bubbled it above
						jQuery.event.triggered = type;
						elem[ type ]();
						jQuery.event.triggered = undefined;

						if ( tmp ) {
							elem[ ontype ] = tmp;
						}
					}
				}
			}

			return event.result;
		},

		// Piggyback on a donor event to simulate a different one
		simulate: function( type, elem, event ) {
			var e = jQuery.extend(
				new jQuery.Event(),
				event,
				{
					type: type,
					isSimulated: true

					// Previously, `originalEvent: {}` was set here, so stopPropagation call
					// would not be triggered on donor event, since in our own
					// jQuery.event.stopPropagation function we had a check for existence of
					// originalEvent.stopPropagation method, so, consequently it would be a noop.
					//
					// But now, this "simulate" function is used only for events
					// for which stopPropagation() is noop, so there is no need for that anymore.
					//
					// For the compat branch though, guard for "click" and "submit"
					// events is still used, but was moved to jQuery.event.stopPropagation function
					// because `originalEvent` should point to the original event for the constancy
					// with other events and for more focused logic
				}
			);

			jQuery.event.trigger( e, null, elem );

			if ( e.isDefaultPrevented() ) {
				event.preventDefault();
			}
		}

	} );

	jQuery.fn.extend( {

		trigger: function( type, data ) {
			return this.each( function() {
				jQuery.event.trigger( type, data, this );
			} );
		},
		triggerHandler: function( type, data ) {
			var elem = this[ 0 ];
			if ( elem ) {
				return jQuery.event.trigger( type, data, elem, true );
			}
		}
	} );


	jQuery.each( ( "blur focus focusin focusout load resize scroll unload click dblclick " +
		"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
		"change select submit keydown keypress keyup error contextmenu" ).split( " " ),
		function( i, name ) {

		// Handle event binding
		jQuery.fn[ name ] = function( data, fn ) {
			return arguments.length > 0 ?
				this.on( name, null, data, fn ) :
				this.trigger( name );
		};
	} );

	jQuery.fn.extend( {
		hover: function( fnOver, fnOut ) {
			return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
		}
	} );




	support.focusin = "onfocusin" in window;


	// Support: Firefox
	// Firefox doesn't have focus(in | out) events
	// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
	//
	// Support: Chrome, Safari
	// focus(in | out) events fire after focus & blur events,
	// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
	// Related ticket - https://code.google.com/p/chromium/issues/detail?id=449857
	if ( !support.focusin ) {
		jQuery.each( { focus: "focusin", blur: "focusout" }, function( orig, fix ) {

			// Attach a single capturing handler on the document while someone wants focusin/focusout
			var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ) );
			};

			jQuery.event.special[ fix ] = {
				setup: function() {
					var doc = this.ownerDocument || this,
						attaches = dataPriv.access( doc, fix );

					if ( !attaches ) {
						doc.addEventListener( orig, handler, true );
					}
					dataPriv.access( doc, fix, ( attaches || 0 ) + 1 );
				},
				teardown: function() {
					var doc = this.ownerDocument || this,
						attaches = dataPriv.access( doc, fix ) - 1;

					if ( !attaches ) {
						doc.removeEventListener( orig, handler, true );
						dataPriv.remove( doc, fix );

					} else {
						dataPriv.access( doc, fix, attaches );
					}
				}
			};
		} );
	}
	var location = window.location;

	var nonce = jQuery.now();

	var rquery = ( /\?/ );



	// Support: Android 2.3
	// Workaround failure to string-cast null input
	jQuery.parseJSON = function( data ) {
		return JSON.parse( data + "" );
	};


	// Cross-browser xml parsing
	jQuery.parseXML = function( data ) {
		var xml;
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		// Support: IE9
		try {
			xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
		} catch ( e ) {
			xml = undefined;
		}

		if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	};


	var
		rhash = /#.*$/,
		rts = /([?&])_=[^&]*/,
		rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

		// #7653, #8125, #8152: local protocol detection
		rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
		rnoContent = /^(?:GET|HEAD)$/,
		rprotocol = /^\/\//,

		/* Prefilters
		 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
		 * 2) These are called:
		 *    - BEFORE asking for a transport
		 *    - AFTER param serialization (s.data is a string if s.processData is true)
		 * 3) key is the dataType
		 * 4) the catchall symbol "*" can be used
		 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
		 */
		prefilters = {},

		/* Transports bindings
		 * 1) key is the dataType
		 * 2) the catchall symbol "*" can be used
		 * 3) selection will start with transport dataType and THEN go to "*" if needed
		 */
		transports = {},

		// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
		allTypes = "*/".concat( "*" ),

		// Anchor tag for parsing the document origin
		originAnchor = document.createElement( "a" );
		originAnchor.href = location.href;

	// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
	function addToPrefiltersOrTransports( structure ) {

		// dataTypeExpression is optional and defaults to "*"
		return function( dataTypeExpression, func ) {

			if ( typeof dataTypeExpression !== "string" ) {
				func = dataTypeExpression;
				dataTypeExpression = "*";
			}

			var dataType,
				i = 0,
				dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

			if ( jQuery.isFunction( func ) ) {

				// For each dataType in the dataTypeExpression
				while ( ( dataType = dataTypes[ i++ ] ) ) {

					// Prepend if requested
					if ( dataType[ 0 ] === "+" ) {
						dataType = dataType.slice( 1 ) || "*";
						( structure[ dataType ] = structure[ dataType ] || [] ).unshift( func );

					// Otherwise append
					} else {
						( structure[ dataType ] = structure[ dataType ] || [] ).push( func );
					}
				}
			}
		};
	}

	// Base inspection function for prefilters and transports
	function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

		var inspected = {},
			seekingTransport = ( structure === transports );

		function inspect( dataType ) {
			var selected;
			inspected[ dataType ] = true;
			jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
				var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
				if ( typeof dataTypeOrTransport === "string" &&
					!seekingTransport && !inspected[ dataTypeOrTransport ] ) {

					options.dataTypes.unshift( dataTypeOrTransport );
					inspect( dataTypeOrTransport );
					return false;
				} else if ( seekingTransport ) {
					return !( selected = dataTypeOrTransport );
				}
			} );
			return selected;
		}

		return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
	}

	// A special extend for ajax options
	// that takes "flat" options (not to be deep extended)
	// Fixes #9887
	function ajaxExtend( target, src ) {
		var key, deep,
			flatOptions = jQuery.ajaxSettings.flatOptions || {};

		for ( key in src ) {
			if ( src[ key ] !== undefined ) {
				( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
			}
		}
		if ( deep ) {
			jQuery.extend( true, target, deep );
		}

		return target;
	}

	/* Handles responses to an ajax request:
	 * - finds the right dataType (mediates between content-type and expected dataType)
	 * - returns the corresponding response
	 */
	function ajaxHandleResponses( s, jqXHR, responses ) {

		var ct, type, finalDataType, firstDataType,
			contents = s.contents,
			dataTypes = s.dataTypes;

		// Remove auto dataType and get content-type in the process
		while ( dataTypes[ 0 ] === "*" ) {
			dataTypes.shift();
			if ( ct === undefined ) {
				ct = s.mimeType || jqXHR.getResponseHeader( "Content-Type" );
			}
		}

		// Check if we're dealing with a known content-type
		if ( ct ) {
			for ( type in contents ) {
				if ( contents[ type ] && contents[ type ].test( ct ) ) {
					dataTypes.unshift( type );
					break;
				}
			}
		}

		// Check to see if we have a response for the expected dataType
		if ( dataTypes[ 0 ] in responses ) {
			finalDataType = dataTypes[ 0 ];
		} else {

			// Try convertible dataTypes
			for ( type in responses ) {
				if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[ 0 ] ] ) {
					finalDataType = type;
					break;
				}
				if ( !firstDataType ) {
					firstDataType = type;
				}
			}

			// Or just use first one
			finalDataType = finalDataType || firstDataType;
		}

		// If we found a dataType
		// We add the dataType to the list if needed
		// and return the corresponding response
		if ( finalDataType ) {
			if ( finalDataType !== dataTypes[ 0 ] ) {
				dataTypes.unshift( finalDataType );
			}
			return responses[ finalDataType ];
		}
	}

	/* Chain conversions given the request and the original response
	 * Also sets the responseXXX fields on the jqXHR instance
	 */
	function ajaxConvert( s, response, jqXHR, isSuccess ) {
		var conv2, current, conv, tmp, prev,
			converters = {},

			// Work with a copy of dataTypes in case we need to modify it for conversion
			dataTypes = s.dataTypes.slice();

		// Create converters map with lowercased keys
		if ( dataTypes[ 1 ] ) {
			for ( conv in s.converters ) {
				converters[ conv.toLowerCase() ] = s.converters[ conv ];
			}
		}

		current = dataTypes.shift();

		// Convert to each sequential dataType
		while ( current ) {

			if ( s.responseFields[ current ] ) {
				jqXHR[ s.responseFields[ current ] ] = response;
			}

			// Apply the dataFilter if provided
			if ( !prev && isSuccess && s.dataFilter ) {
				response = s.dataFilter( response, s.dataType );
			}

			prev = current;
			current = dataTypes.shift();

			if ( current ) {

			// There's only work to do if current dataType is non-auto
				if ( current === "*" ) {

					current = prev;

				// Convert response if prev dataType is non-auto and differs from current
				} else if ( prev !== "*" && prev !== current ) {

					// Seek a direct converter
					conv = converters[ prev + " " + current ] || converters[ "* " + current ];

					// If none found, seek a pair
					if ( !conv ) {
						for ( conv2 in converters ) {

							// If conv2 outputs current
							tmp = conv2.split( " " );
							if ( tmp[ 1 ] === current ) {

								// If prev can be converted to accepted input
								conv = converters[ prev + " " + tmp[ 0 ] ] ||
									converters[ "* " + tmp[ 0 ] ];
								if ( conv ) {

									// Condense equivalence converters
									if ( conv === true ) {
										conv = converters[ conv2 ];

									// Otherwise, insert the intermediate dataType
									} else if ( converters[ conv2 ] !== true ) {
										current = tmp[ 0 ];
										dataTypes.unshift( tmp[ 1 ] );
									}
									break;
								}
							}
						}
					}

					// Apply converter (if not an equivalence)
					if ( conv !== true ) {

						// Unless errors are allowed to bubble, catch and return them
						if ( conv && s.throws ) {
							response = conv( response );
						} else {
							try {
								response = conv( response );
							} catch ( e ) {
								return {
									state: "parsererror",
									error: conv ? e : "No conversion from " + prev + " to " + current
								};
							}
						}
					}
				}
			}
		}

		return { state: "success", data: response };
	}

	jQuery.extend( {

		// Counter for holding the number of active queries
		active: 0,

		// Last-Modified header cache for next request
		lastModified: {},
		etag: {},

		ajaxSettings: {
			url: location.href,
			type: "GET",
			isLocal: rlocalProtocol.test( location.protocol ),
			global: true,
			processData: true,
			async: true,
			contentType: "application/x-www-form-urlencoded; charset=UTF-8",
			/*
			timeout: 0,
			data: null,
			dataType: null,
			username: null,
			password: null,
			cache: null,
			throws: false,
			traditional: false,
			headers: {},
			*/

			accepts: {
				"*": allTypes,
				text: "text/plain",
				html: "text/html",
				xml: "application/xml, text/xml",
				json: "application/json, text/javascript"
			},

			contents: {
				xml: /\bxml\b/,
				html: /\bhtml/,
				json: /\bjson\b/
			},

			responseFields: {
				xml: "responseXML",
				text: "responseText",
				json: "responseJSON"
			},

			// Data converters
			// Keys separate source (or catchall "*") and destination types with a single space
			converters: {

				// Convert anything to text
				"* text": String,

				// Text to html (true = no transformation)
				"text html": true,

				// Evaluate text as a json expression
				"text json": jQuery.parseJSON,

				// Parse text as xml
				"text xml": jQuery.parseXML
			},

			// For options that shouldn't be deep extended:
			// you can add your own custom options here if
			// and when you create one that shouldn't be
			// deep extended (see ajaxExtend)
			flatOptions: {
				url: true,
				context: true
			}
		},

		// Creates a full fledged settings object into target
		// with both ajaxSettings and settings fields.
		// If target is omitted, writes into ajaxSettings.
		ajaxSetup: function( target, settings ) {
			return settings ?

				// Building a settings object
				ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

				// Extending ajaxSettings
				ajaxExtend( jQuery.ajaxSettings, target );
		},

		ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
		ajaxTransport: addToPrefiltersOrTransports( transports ),

		// Main method
		ajax: function( url, options ) {

			// If url is an object, simulate pre-1.5 signature
			if ( typeof url === "object" ) {
				options = url;
				url = undefined;
			}

			// Force options to be an object
			options = options || {};

			var transport,

				// URL without anti-cache param
				cacheURL,

				// Response headers
				responseHeadersString,
				responseHeaders,

				// timeout handle
				timeoutTimer,

				// Url cleanup var
				urlAnchor,

				// To know if global events are to be dispatched
				fireGlobals,

				// Loop variable
				i,

				// Create the final options object
				s = jQuery.ajaxSetup( {}, options ),

				// Callbacks context
				callbackContext = s.context || s,

				// Context for global events is callbackContext if it is a DOM node or jQuery collection
				globalEventContext = s.context &&
					( callbackContext.nodeType || callbackContext.jquery ) ?
						jQuery( callbackContext ) :
						jQuery.event,

				// Deferreds
				deferred = jQuery.Deferred(),
				completeDeferred = jQuery.Callbacks( "once memory" ),

				// Status-dependent callbacks
				statusCode = s.statusCode || {},

				// Headers (they are sent all at once)
				requestHeaders = {},
				requestHeadersNames = {},

				// The jqXHR state
				state = 0,

				// Default abort message
				strAbort = "canceled",

				// Fake xhr
				jqXHR = {
					readyState: 0,

					// Builds headers hashtable if needed
					getResponseHeader: function( key ) {
						var match;
						if ( state === 2 ) {
							if ( !responseHeaders ) {
								responseHeaders = {};
								while ( ( match = rheaders.exec( responseHeadersString ) ) ) {
									responseHeaders[ match[ 1 ].toLowerCase() ] = match[ 2 ];
								}
							}
							match = responseHeaders[ key.toLowerCase() ];
						}
						return match == null ? null : match;
					},

					// Raw string
					getAllResponseHeaders: function() {
						return state === 2 ? responseHeadersString : null;
					},

					// Caches the header
					setRequestHeader: function( name, value ) {
						var lname = name.toLowerCase();
						if ( !state ) {
							name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
							requestHeaders[ name ] = value;
						}
						return this;
					},

					// Overrides response content-type header
					overrideMimeType: function( type ) {
						if ( !state ) {
							s.mimeType = type;
						}
						return this;
					},

					// Status-dependent callbacks
					statusCode: function( map ) {
						var code;
						if ( map ) {
							if ( state < 2 ) {
								for ( code in map ) {

									// Lazy-add the new callback in a way that preserves old ones
									statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
								}
							} else {

								// Execute the appropriate callbacks
								jqXHR.always( map[ jqXHR.status ] );
							}
						}
						return this;
					},

					// Cancel the request
					abort: function( statusText ) {
						var finalText = statusText || strAbort;
						if ( transport ) {
							transport.abort( finalText );
						}
						done( 0, finalText );
						return this;
					}
				};

			// Attach deferreds
			deferred.promise( jqXHR ).complete = completeDeferred.add;
			jqXHR.success = jqXHR.done;
			jqXHR.error = jqXHR.fail;

			// Remove hash character (#7531: and string promotion)
			// Add protocol if not provided (prefilters might expect it)
			// Handle falsy url in the settings object (#10093: consistency with old signature)
			// We also use the url parameter if available
			s.url = ( ( url || s.url || location.href ) + "" ).replace( rhash, "" )
				.replace( rprotocol, location.protocol + "//" );

			// Alias method option to type as per ticket #12004
			s.type = options.method || options.type || s.method || s.type;

			// Extract dataTypes list
			s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

			// A cross-domain request is in order when the origin doesn't match the current origin.
			if ( s.crossDomain == null ) {
				urlAnchor = document.createElement( "a" );

				// Support: IE8-11+
				// IE throws exception if url is malformed, e.g. http://example.com:80x/
				try {
					urlAnchor.href = s.url;

					// Support: IE8-11+
					// Anchor's host property isn't correctly set when s.url is relative
					urlAnchor.href = urlAnchor.href;
					s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
						urlAnchor.protocol + "//" + urlAnchor.host;
				} catch ( e ) {

					// If there is an error parsing the URL, assume it is crossDomain,
					// it can be rejected by the transport if it is invalid
					s.crossDomain = true;
				}
			}

			// Convert data if not already a string
			if ( s.data && s.processData && typeof s.data !== "string" ) {
				s.data = jQuery.param( s.data, s.traditional );
			}

			// Apply prefilters
			inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

			// If request was aborted inside a prefilter, stop there
			if ( state === 2 ) {
				return jqXHR;
			}

			// We can fire global events as of now if asked to
			// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
			fireGlobals = jQuery.event && s.global;

			// Watch for a new set of requests
			if ( fireGlobals && jQuery.active++ === 0 ) {
				jQuery.event.trigger( "ajaxStart" );
			}

			// Uppercase the type
			s.type = s.type.toUpperCase();

			// Determine if request has content
			s.hasContent = !rnoContent.test( s.type );

			// Save the URL in case we're toying with the If-Modified-Since
			// and/or If-None-Match header later on
			cacheURL = s.url;

			// More options handling for requests with no content
			if ( !s.hasContent ) {

				// If data is available, append data to url
				if ( s.data ) {
					cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );

					// #9682: remove data so that it's not used in an eventual retry
					delete s.data;
				}

				// Add anti-cache in url if needed
				if ( s.cache === false ) {
					s.url = rts.test( cacheURL ) ?

						// If there is already a '_' parameter, set its value
						cacheURL.replace( rts, "$1_=" + nonce++ ) :

						// Otherwise add one to the end
						cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
				}
			}

			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				if ( jQuery.lastModified[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
				}
				if ( jQuery.etag[ cacheURL ] ) {
					jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
				}
			}

			// Set the correct header, if data is being sent
			if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
				jqXHR.setRequestHeader( "Content-Type", s.contentType );
			}

			// Set the Accepts header for the server, depending on the dataType
			jqXHR.setRequestHeader(
				"Accept",
				s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[ 0 ] ] ?
					s.accepts[ s.dataTypes[ 0 ] ] +
						( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
					s.accepts[ "*" ]
			);

			// Check for headers option
			for ( i in s.headers ) {
				jqXHR.setRequestHeader( i, s.headers[ i ] );
			}

			// Allow custom headers/mimetypes and early abort
			if ( s.beforeSend &&
				( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {

				// Abort if not done already and return
				return jqXHR.abort();
			}

			// Aborting is no longer a cancellation
			strAbort = "abort";

			// Install callbacks on deferreds
			for ( i in { success: 1, error: 1, complete: 1 } ) {
				jqXHR[ i ]( s[ i ] );
			}

			// Get transport
			transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

			// If no transport, we auto-abort
			if ( !transport ) {
				done( -1, "No Transport" );
			} else {
				jqXHR.readyState = 1;

				// Send global event
				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
				}

				// If request was aborted inside ajaxSend, stop there
				if ( state === 2 ) {
					return jqXHR;
				}

				// Timeout
				if ( s.async && s.timeout > 0 ) {
					timeoutTimer = window.setTimeout( function() {
						jqXHR.abort( "timeout" );
					}, s.timeout );
				}

				try {
					state = 1;
					transport.send( requestHeaders, done );
				} catch ( e ) {

					// Propagate exception as error if not done
					if ( state < 2 ) {
						done( -1, e );

					// Simply rethrow otherwise
					} else {
						throw e;
					}
				}
			}

			// Callback for when everything is done
			function done( status, nativeStatusText, responses, headers ) {
				var isSuccess, success, error, response, modified,
					statusText = nativeStatusText;

				// Called once
				if ( state === 2 ) {
					return;
				}

				// State is "done" now
				state = 2;

				// Clear timeout if it exists
				if ( timeoutTimer ) {
					window.clearTimeout( timeoutTimer );
				}

				// Dereference transport for early garbage collection
				// (no matter how long the jqXHR object will be used)
				transport = undefined;

				// Cache response headers
				responseHeadersString = headers || "";

				// Set readyState
				jqXHR.readyState = status > 0 ? 4 : 0;

				// Determine if successful
				isSuccess = status >= 200 && status < 300 || status === 304;

				// Get response data
				if ( responses ) {
					response = ajaxHandleResponses( s, jqXHR, responses );
				}

				// Convert no matter what (that way responseXXX fields are always set)
				response = ajaxConvert( s, response, jqXHR, isSuccess );

				// If successful, handle type chaining
				if ( isSuccess ) {

					// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
					if ( s.ifModified ) {
						modified = jqXHR.getResponseHeader( "Last-Modified" );
						if ( modified ) {
							jQuery.lastModified[ cacheURL ] = modified;
						}
						modified = jqXHR.getResponseHeader( "etag" );
						if ( modified ) {
							jQuery.etag[ cacheURL ] = modified;
						}
					}

					// if no content
					if ( status === 204 || s.type === "HEAD" ) {
						statusText = "nocontent";

					// if not modified
					} else if ( status === 304 ) {
						statusText = "notmodified";

					// If we have data, let's convert it
					} else {
						statusText = response.state;
						success = response.data;
						error = response.error;
						isSuccess = !error;
					}
				} else {

					// Extract error from statusText and normalize for non-aborts
					error = statusText;
					if ( status || !statusText ) {
						statusText = "error";
						if ( status < 0 ) {
							status = 0;
						}
					}
				}

				// Set data for the fake xhr object
				jqXHR.status = status;
				jqXHR.statusText = ( nativeStatusText || statusText ) + "";

				// Success/Error
				if ( isSuccess ) {
					deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
				} else {
					deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
				}

				// Status-dependent callbacks
				jqXHR.statusCode( statusCode );
				statusCode = undefined;

				if ( fireGlobals ) {
					globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
						[ jqXHR, s, isSuccess ? success : error ] );
				}

				// Complete
				completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

				if ( fireGlobals ) {
					globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );

					// Handle the global AJAX counter
					if ( !( --jQuery.active ) ) {
						jQuery.event.trigger( "ajaxStop" );
					}
				}
			}

			return jqXHR;
		},

		getJSON: function( url, data, callback ) {
			return jQuery.get( url, data, callback, "json" );
		},

		getScript: function( url, callback ) {
			return jQuery.get( url, undefined, callback, "script" );
		}
	} );

	jQuery.each( [ "get", "post" ], function( i, method ) {
		jQuery[ method ] = function( url, data, callback, type ) {

			// Shift arguments if data argument was omitted
			if ( jQuery.isFunction( data ) ) {
				type = type || callback;
				callback = data;
				data = undefined;
			}

			// The url can be an options object (which then must have .url)
			return jQuery.ajax( jQuery.extend( {
				url: url,
				type: method,
				dataType: type,
				data: data,
				success: callback
			}, jQuery.isPlainObject( url ) && url ) );
		};
	} );


	jQuery._evalUrl = function( url ) {
		return jQuery.ajax( {
			url: url,

			// Make this explicit, since user can override this through ajaxSetup (#11264)
			type: "GET",
			dataType: "script",
			async: false,
			global: false,
			"throws": true
		} );
	};


	jQuery.fn.extend( {
		wrapAll: function( html ) {
			var wrap;

			if ( jQuery.isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapAll( html.call( this, i ) );
				} );
			}

			if ( this[ 0 ] ) {

				// The elements to wrap the target around
				wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

				if ( this[ 0 ].parentNode ) {
					wrap.insertBefore( this[ 0 ] );
				}

				wrap.map( function() {
					var elem = this;

					while ( elem.firstElementChild ) {
						elem = elem.firstElementChild;
					}

					return elem;
				} ).append( this );
			}

			return this;
		},

		wrapInner: function( html ) {
			if ( jQuery.isFunction( html ) ) {
				return this.each( function( i ) {
					jQuery( this ).wrapInner( html.call( this, i ) );
				} );
			}

			return this.each( function() {
				var self = jQuery( this ),
					contents = self.contents();

				if ( contents.length ) {
					contents.wrapAll( html );

				} else {
					self.append( html );
				}
			} );
		},

		wrap: function( html ) {
			var isFunction = jQuery.isFunction( html );

			return this.each( function( i ) {
				jQuery( this ).wrapAll( isFunction ? html.call( this, i ) : html );
			} );
		},

		unwrap: function() {
			return this.parent().each( function() {
				if ( !jQuery.nodeName( this, "body" ) ) {
					jQuery( this ).replaceWith( this.childNodes );
				}
			} ).end();
		}
	} );


	jQuery.expr.filters.hidden = function( elem ) {
		return !jQuery.expr.filters.visible( elem );
	};
	jQuery.expr.filters.visible = function( elem ) {

		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		// Use OR instead of AND as the element is not visible if either is true
		// See tickets #10406 and #13132
		return elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
	};




	var r20 = /%20/g,
		rbracket = /\[\]$/,
		rCRLF = /\r?\n/g,
		rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
		rsubmittable = /^(?:input|select|textarea|keygen)/i;

	function buildParams( prefix, obj, traditional, add ) {
		var name;

		if ( jQuery.isArray( obj ) ) {

			// Serialize array item.
			jQuery.each( obj, function( i, v ) {
				if ( traditional || rbracket.test( prefix ) ) {

					// Treat each array item as a scalar.
					add( prefix, v );

				} else {

					// Item is non-scalar (array or object), encode its numeric index.
					buildParams(
						prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]",
						v,
						traditional,
						add
					);
				}
			} );

		} else if ( !traditional && jQuery.type( obj ) === "object" ) {

			// Serialize object item.
			for ( name in obj ) {
				buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
			}

		} else {

			// Serialize scalar item.
			add( prefix, obj );
		}
	}

	// Serialize an array of form elements or a set of
	// key/values into a query string
	jQuery.param = function( a, traditional ) {
		var prefix,
			s = [],
			add = function( key, value ) {

				// If value is a function, invoke it and return its value
				value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
				s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
			};

		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if ( traditional === undefined ) {
			traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
		}

		// If an array was passed in, assume that it is an array of form elements.
		if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {

			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			} );

		} else {

			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( prefix in a ) {
				buildParams( prefix, a[ prefix ], traditional, add );
			}
		}

		// Return the resulting serialization
		return s.join( "&" ).replace( r20, "+" );
	};

	jQuery.fn.extend( {
		serialize: function() {
			return jQuery.param( this.serializeArray() );
		},
		serializeArray: function() {
			return this.map( function() {

				// Can add propHook for "elements" to filter or add form elements
				var elements = jQuery.prop( this, "elements" );
				return elements ? jQuery.makeArray( elements ) : this;
			} )
			.filter( function() {
				var type = this.type;

				// Use .is( ":disabled" ) so that fieldset[disabled] works
				return this.name && !jQuery( this ).is( ":disabled" ) &&
					rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
					( this.checked || !rcheckableType.test( type ) );
			} )
			.map( function( i, elem ) {
				var val = jQuery( this ).val();

				return val == null ?
					null :
					jQuery.isArray( val ) ?
						jQuery.map( val, function( val ) {
							return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
						} ) :
						{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
			} ).get();
		}
	} );


	jQuery.ajaxSettings.xhr = function() {
		try {
			return new window.XMLHttpRequest();
		} catch ( e ) {}
	};

	var xhrSuccessStatus = {

			// File protocol always yields status code 0, assume 200
			0: 200,

			// Support: IE9
			// #1450: sometimes IE returns 1223 when it should be 204
			1223: 204
		},
		xhrSupported = jQuery.ajaxSettings.xhr();

	support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
	support.ajax = xhrSupported = !!xhrSupported;

	jQuery.ajaxTransport( function( options ) {
		var callback, errorCallback;

		// Cross domain only allowed if supported through XMLHttpRequest
		if ( support.cors || xhrSupported && !options.crossDomain ) {
			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr();

					xhr.open(
						options.type,
						options.url,
						options.async,
						options.username,
						options.password
					);

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers[ "X-Requested-With" ] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {
						xhr.setRequestHeader( i, headers[ i ] );
					}

					// Callback
					callback = function( type ) {
						return function() {
							if ( callback ) {
								callback = errorCallback = xhr.onload =
									xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;

								if ( type === "abort" ) {
									xhr.abort();
								} else if ( type === "error" ) {

									// Support: IE9
									// On a manual native abort, IE9 throws
									// errors on any property access that is not readyState
									if ( typeof xhr.status !== "number" ) {
										complete( 0, "error" );
									} else {
										complete(

											// File: protocol always yields status 0; see #8605, #14207
											xhr.status,
											xhr.statusText
										);
									}
								} else {
									complete(
										xhrSuccessStatus[ xhr.status ] || xhr.status,
										xhr.statusText,

										// Support: IE9 only
										// IE9 has no XHR2 but throws on binary (trac-11426)
										// For XHR2 non-text, let the caller handle it (gh-2498)
										( xhr.responseType || "text" ) !== "text"  ||
										typeof xhr.responseText !== "string" ?
											{ binary: xhr.response } :
											{ text: xhr.responseText },
										xhr.getAllResponseHeaders()
									);
								}
							}
						};
					};

					// Listen to events
					xhr.onload = callback();
					errorCallback = xhr.onerror = callback( "error" );

					// Support: IE9
					// Use onreadystatechange to replace onabort
					// to handle uncaught aborts
					if ( xhr.onabort !== undefined ) {
						xhr.onabort = errorCallback;
					} else {
						xhr.onreadystatechange = function() {

							// Check readyState before timeout as it changes
							if ( xhr.readyState === 4 ) {

								// Allow onerror to be called first,
								// but that will not handle a native abort
								// Also, save errorCallback to a variable
								// as xhr.onerror cannot be accessed
								window.setTimeout( function() {
									if ( callback ) {
										errorCallback();
									}
								} );
							}
						};
					}

					// Create the abort callback
					callback = callback( "abort" );

					try {

						// Do send the request (this may raise an exception)
						xhr.send( options.hasContent && options.data || null );
					} catch ( e ) {

						// #14683: Only rethrow if this hasn't been notified as an error yet
						if ( callback ) {
							throw e;
						}
					}
				},

				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




	// Install script dataType
	jQuery.ajaxSetup( {
		accepts: {
			script: "text/javascript, application/javascript, " +
				"application/ecmascript, application/x-ecmascript"
		},
		contents: {
			script: /\b(?:java|ecma)script\b/
		},
		converters: {
			"text script": function( text ) {
				jQuery.globalEval( text );
				return text;
			}
		}
	} );

	// Handle cache's special case and crossDomain
	jQuery.ajaxPrefilter( "script", function( s ) {
		if ( s.cache === undefined ) {
			s.cache = false;
		}
		if ( s.crossDomain ) {
			s.type = "GET";
		}
	} );

	// Bind script tag hack transport
	jQuery.ajaxTransport( "script", function( s ) {

		// This transport only deals with cross domain requests
		if ( s.crossDomain ) {
			var script, callback;
			return {
				send: function( _, complete ) {
					script = jQuery( "<script>" ).prop( {
						charset: s.scriptCharset,
						src: s.url
					} ).on(
						"load error",
						callback = function( evt ) {
							script.remove();
							callback = null;
							if ( evt ) {
								complete( evt.type === "error" ? 404 : 200, evt.type );
							}
						}
					);

					// Use native DOM manipulation to avoid our domManip AJAX trickery
					document.head.appendChild( script[ 0 ] );
				},
				abort: function() {
					if ( callback ) {
						callback();
					}
				}
			};
		}
	} );




	var oldCallbacks = [],
		rjsonp = /(=)\?(?=&|$)|\?\?/;

	// Default jsonp settings
	jQuery.ajaxSetup( {
		jsonp: "callback",
		jsonpCallback: function() {
			var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
			this[ callback ] = true;
			return callback;
		}
	} );

	// Detect, normalize options and install callbacks for jsonp requests
	jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

		var callbackName, overwritten, responseContainer,
			jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
				"url" :
				typeof s.data === "string" &&
					( s.contentType || "" )
						.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
					rjsonp.test( s.data ) && "data"
			);

		// Handle iff the expected data type is "jsonp" or we have a parameter to set
		if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

			// Get callback name, remembering preexisting value associated with it
			callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
				s.jsonpCallback() :
				s.jsonpCallback;

			// Insert callback into url or form data
			if ( jsonProp ) {
				s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
			} else if ( s.jsonp !== false ) {
				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
			}

			// Use data converter to retrieve json after script execution
			s.converters[ "script json" ] = function() {
				if ( !responseContainer ) {
					jQuery.error( callbackName + " was not called" );
				}
				return responseContainer[ 0 ];
			};

			// Force json dataType
			s.dataTypes[ 0 ] = "json";

			// Install callback
			overwritten = window[ callbackName ];
			window[ callbackName ] = function() {
				responseContainer = arguments;
			};

			// Clean-up function (fires after converters)
			jqXHR.always( function() {

				// If previous value didn't exist - remove it
				if ( overwritten === undefined ) {
					jQuery( window ).removeProp( callbackName );

				// Otherwise restore preexisting value
				} else {
					window[ callbackName ] = overwritten;
				}

				// Save back as free
				if ( s[ callbackName ] ) {

					// Make sure that re-using the options doesn't screw things around
					s.jsonpCallback = originalSettings.jsonpCallback;

					// Save the callback name for future use
					oldCallbacks.push( callbackName );
				}

				// Call if it was a function and we have a response
				if ( responseContainer && jQuery.isFunction( overwritten ) ) {
					overwritten( responseContainer[ 0 ] );
				}

				responseContainer = overwritten = undefined;
			} );

			// Delegate to script
			return "script";
		}
	} );




	// Support: Safari 8+
	// In Safari 8 documents created via document.implementation.createHTMLDocument
	// collapse sibling forms: the second one becomes a child of the first one.
	// Because of that, this security measure has to be disabled in Safari 8.
	// https://bugs.webkit.org/show_bug.cgi?id=137337
	support.createHTMLDocument = ( function() {
		var body = document.implementation.createHTMLDocument( "" ).body;
		body.innerHTML = "<form></form><form></form>";
		return body.childNodes.length === 2;
	} )();


	// Argument "data" should be string of html
	// context (optional): If specified, the fragment will be created in this context,
	// defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	jQuery.parseHTML = function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}

		// Stop scripts or inline event handlers from being executed immediately
		// by using document.implementation
		context = context || ( support.createHTMLDocument ?
			document.implementation.createHTMLDocument( "" ) :
			document );

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[ 1 ] ) ];
		}

		parsed = buildFragment( [ data ], context, scripts );

		if ( scripts && scripts.length ) {
			jQuery( scripts ).remove();
		}

		return jQuery.merge( [], parsed.childNodes );
	};


	// Keep a copy of the old load method
	var _load = jQuery.fn.load;

	/**
	 * Load a url into a page
	 */
	jQuery.fn.load = function( url, params, callback ) {
		if ( typeof url !== "string" && _load ) {
			return _load.apply( this, arguments );
		}

		var selector, type, response,
			self = this,
			off = url.indexOf( " " );

		if ( off > -1 ) {
			selector = jQuery.trim( url.slice( off ) );
			url = url.slice( 0, off );
		}

		// If it's a function
		if ( jQuery.isFunction( params ) ) {

			// We assume that it's the callback
			callback = params;
			params = undefined;

		// Otherwise, build a param string
		} else if ( params && typeof params === "object" ) {
			type = "POST";
		}

		// If we have elements to modify, make the request
		if ( self.length > 0 ) {
			jQuery.ajax( {
				url: url,

				// If "type" variable is undefined, then "GET" method will be used.
				// Make value of this field explicit since
				// user can override it through ajaxSetup method
				type: type || "GET",
				dataType: "html",
				data: params
			} ).done( function( responseText ) {

				// Save response for use in complete callback
				response = arguments;

				self.html( selector ?

					// If a selector was specified, locate the right elements in a dummy div
					// Exclude scripts to avoid IE 'Permission Denied' errors
					jQuery( "<div>" ).append( jQuery.parseHTML( responseText ) ).find( selector ) :

					// Otherwise use the full result
					responseText );

			// If the request succeeds, this function gets "data", "status", "jqXHR"
			// but they are ignored because response was set above.
			// If it fails, this function gets "jqXHR", "status", "error"
			} ).always( callback && function( jqXHR, status ) {
				self.each( function() {
					callback.apply( self, response || [ jqXHR.responseText, status, jqXHR ] );
				} );
			} );
		}

		return this;
	};




	// Attach a bunch of functions for handling common AJAX events
	jQuery.each( [
		"ajaxStart",
		"ajaxStop",
		"ajaxComplete",
		"ajaxError",
		"ajaxSuccess",
		"ajaxSend"
	], function( i, type ) {
		jQuery.fn[ type ] = function( fn ) {
			return this.on( type, fn );
		};
	} );




	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep( jQuery.timers, function( fn ) {
			return elem === fn.elem;
		} ).length;
	};




	/**
	 * Gets a window from an element
	 */
	function getWindow( elem ) {
		return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
	}

	jQuery.offset = {
		setOffset: function( elem, options, i ) {
			var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
				position = jQuery.css( elem, "position" ),
				curElem = jQuery( elem ),
				props = {};

			// Set position first, in-case top/left are set even on static elem
			if ( position === "static" ) {
				elem.style.position = "relative";
			}

			curOffset = curElem.offset();
			curCSSTop = jQuery.css( elem, "top" );
			curCSSLeft = jQuery.css( elem, "left" );
			calculatePosition = ( position === "absolute" || position === "fixed" ) &&
				( curCSSTop + curCSSLeft ).indexOf( "auto" ) > -1;

			// Need to be able to calculate position if either
			// top or left is auto and position is either absolute or fixed
			if ( calculatePosition ) {
				curPosition = curElem.position();
				curTop = curPosition.top;
				curLeft = curPosition.left;

			} else {
				curTop = parseFloat( curCSSTop ) || 0;
				curLeft = parseFloat( curCSSLeft ) || 0;
			}

			if ( jQuery.isFunction( options ) ) {

				// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
				options = options.call( elem, i, jQuery.extend( {}, curOffset ) );
			}

			if ( options.top != null ) {
				props.top = ( options.top - curOffset.top ) + curTop;
			}
			if ( options.left != null ) {
				props.left = ( options.left - curOffset.left ) + curLeft;
			}

			if ( "using" in options ) {
				options.using.call( elem, props );

			} else {
				curElem.css( props );
			}
		}
	};

	jQuery.fn.extend( {
		offset: function( options ) {
			if ( arguments.length ) {
				return options === undefined ?
					this :
					this.each( function( i ) {
						jQuery.offset.setOffset( this, options, i );
					} );
			}

			var docElem, win,
				elem = this[ 0 ],
				box = { top: 0, left: 0 },
				doc = elem && elem.ownerDocument;

			if ( !doc ) {
				return;
			}

			docElem = doc.documentElement;

			// Make sure it's not a disconnected DOM node
			if ( !jQuery.contains( docElem, elem ) ) {
				return box;
			}

			box = elem.getBoundingClientRect();
			win = getWindow( doc );
			return {
				top: box.top + win.pageYOffset - docElem.clientTop,
				left: box.left + win.pageXOffset - docElem.clientLeft
			};
		},

		position: function() {
			if ( !this[ 0 ] ) {
				return;
			}

			var offsetParent, offset,
				elem = this[ 0 ],
				parentOffset = { top: 0, left: 0 };

			// Fixed elements are offset from window (parentOffset = {top:0, left: 0},
			// because it is its only offset parent
			if ( jQuery.css( elem, "position" ) === "fixed" ) {

				// Assume getBoundingClientRect is there when computed position is fixed
				offset = elem.getBoundingClientRect();

			} else {

				// Get *real* offsetParent
				offsetParent = this.offsetParent();

				// Get correct offsets
				offset = this.offset();
				if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
					parentOffset = offsetParent.offset();
				}

				// Add offsetParent borders
				// Subtract offsetParent scroll positions
				parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true ) -
					offsetParent.scrollTop();
				parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true ) -
					offsetParent.scrollLeft();
			}

			// Subtract parent offsets and element margins
			return {
				top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
				left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
			};
		},

		// This method will return documentElement in the following cases:
		// 1) For the element inside the iframe without offsetParent, this method will return
		//    documentElement of the parent window
		// 2) For the hidden or detached element
		// 3) For body or html element, i.e. in case of the html node - it will return itself
		//
		// but those exceptions were never presented as a real life use-cases
		// and might be considered as more preferable results.
		//
		// This logic, however, is not guaranteed and can change at any point in the future
		offsetParent: function() {
			return this.map( function() {
				var offsetParent = this.offsetParent;

				while ( offsetParent && jQuery.css( offsetParent, "position" ) === "static" ) {
					offsetParent = offsetParent.offsetParent;
				}

				return offsetParent || documentElement;
			} );
		}
	} );

	// Create scrollLeft and scrollTop methods
	jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
		var top = "pageYOffset" === prop;

		jQuery.fn[ method ] = function( val ) {
			return access( this, function( elem, method, val ) {
				var win = getWindow( elem );

				if ( val === undefined ) {
					return win ? win[ prop ] : elem[ method ];
				}

				if ( win ) {
					win.scrollTo(
						!top ? val : win.pageXOffset,
						top ? val : win.pageYOffset
					);

				} else {
					elem[ method ] = val;
				}
			}, method, val, arguments.length );
		};
	} );

	// Support: Safari<7-8+, Chrome<37-44+
	// Add the top/left cssHooks using jQuery.fn.position
	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
	// getComputedStyle returns percent when specified for top/left/bottom/right;
	// rather than make the css module depend on the offset module, just check for it here
	jQuery.each( [ "top", "left" ], function( i, prop ) {
		jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
			function( elem, computed ) {
				if ( computed ) {
					computed = curCSS( elem, prop );

					// If curCSS returns percentage, fallback to offset
					return rnumnonpx.test( computed ) ?
						jQuery( elem ).position()[ prop ] + "px" :
						computed;
				}
			}
		);
	} );


	// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
	jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
		jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name },
			function( defaultExtra, funcName ) {

			// Margin is only for outerHeight, outerWidth
			jQuery.fn[ funcName ] = function( margin, value ) {
				var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
					extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

				return access( this, function( elem, type, value ) {
					var doc;

					if ( jQuery.isWindow( elem ) ) {

						// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
						// isn't a whole lot we can do. See pull request at this URL for discussion:
						// https://github.com/jquery/jquery/pull/764
						return elem.document.documentElement[ "client" + name ];
					}

					// Get document width or height
					if ( elem.nodeType === 9 ) {
						doc = elem.documentElement;

						// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
						// whichever is greatest
						return Math.max(
							elem.body[ "scroll" + name ], doc[ "scroll" + name ],
							elem.body[ "offset" + name ], doc[ "offset" + name ],
							doc[ "client" + name ]
						);
					}

					return value === undefined ?

						// Get width or height on the element, requesting but not forcing parseFloat
						jQuery.css( elem, type, extra ) :

						// Set width or height on the element
						jQuery.style( elem, type, value, extra );
				}, type, chainable ? margin : undefined, chainable, null );
			};
		} );
	} );


	jQuery.fn.extend( {

		bind: function( types, data, fn ) {
			return this.on( types, null, data, fn );
		},
		unbind: function( types, fn ) {
			return this.off( types, null, fn );
		},

		delegate: function( selector, types, data, fn ) {
			return this.on( types, selector, data, fn );
		},
		undelegate: function( selector, types, fn ) {

			// ( namespace ) or ( selector, types [, fn] )
			return arguments.length === 1 ?
				this.off( selector, "**" ) :
				this.off( types, selector || "**", fn );
		},
		size: function() {
			return this.length;
		}
	} );

	jQuery.fn.andSelf = jQuery.fn.addBack;




	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.

	// Note that for maximum portability, libraries that are not jQuery should
	// declare themselves as anonymous modules, and avoid setting a global if an
	// AMD loader is present. jQuery is a special case. For more information, see
	// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

	if ( typeof define === "function" && define.amd ) {
		define( "jquery", [], function() {
			return jQuery;
		} );
	}



	var

		// Map over jQuery in case of overwrite
		_jQuery = window.jQuery,

		// Map over the $ in case of overwrite
		_$ = window.$;

	jQuery.noConflict = function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	};

	// Expose jQuery and $ identifiers, even in AMD
	// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
	// and CommonJS for browser emulators (#13566)
	if ( !noGlobal ) {
		window.jQuery = window.$ = jQuery;
	}

	return jQuery;
	}));
	});

	var $ = (jquery && typeof jquery === 'object' && 'default' in jquery ? jquery['default'] : jquery);

	// Returns the width of a passed element
	function width(element) {
	    return $(element).width();
	}

	function nav() {
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

	    var dispatch = d3.dispatch(event.viewChange);

	    var navChart = fc.chart.cartesian(fc.scale.dateTime(), d3.scale.linear())
	      .yTicks(0)
	      .margin({
	          bottom: bottomMargin      // Variable also in navigator.less - should be used once ported to flex
	      });

	    var viewScale = fc.scale.dateTime();

	    var area = fc.series.area()
	      .yValue(function(d) { return d.close; });
	    var line = fc.series.line()
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
	        maskYScale.domain(fc.util.extent().fields(['low', 'high'])(data));

	        selection.select('mask')
	            .datum(data)
	            .call(brushMask);
	    }

	    function nav(selection) {
	        var model = selection.datum();

	        createDefs(selection, model.data);

	        viewScale.domain(model.viewDomain);

	        var filteredData = util.domain.filterDataInDateRange(
	          fc.util.extent().fields('date')(model.data),
	          model.data);
	        var yExtent = fc.util.extent()
	          .fields(['low', 'high'])(filteredData);

	        var brushHide = false;

	        navChart.xDomain(fc.util.extent().fields('date')(model.data))
	          .yDomain(yExtent);

	        brush.on('brush', function() {
	            var brushExtentIsEmpty = xEmpty(brush);

	            // Hide the bar if the extent is empty
	            setHide(selection, brushExtentIsEmpty);
	            if (!brushExtentIsEmpty) {
	                dispatch[event.viewChange]([brush.extent()[0][0], brush.extent()[1][0]]);
	            }
	        })
	            .on('brushend', function() {
	                var brushExtentIsEmpty = xEmpty(brush);
	                setHide(selection, false);
	                if (brushExtentIsEmpty) {
	                    dispatch[event.viewChange](util.domain.centerOnDate(viewScale.domain(),
	                        model.data, brush.extent()[0][0]));
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
	        layoutWidth = width(container.node());
	        viewScale.range([0, layoutWidth]);
	        maskXScale.range([0, layoutWidth]);
	        maskYScale.range([navChartHeight, 0]);
	    };

	    return nav;
	}

	function legend() {
	    var formatPrice;
	    var formatVolume;
	    var formatTime;
	    var lastDataPointDisplayed;

	    var legendItems = [
	        'T',
	        function(d) { return formatTime(d.date); },
	        'O',
	        function(d) { return formatPrice(d.open); },
	        'H',
	        function(d) { return formatPrice(d.high); },
	        'L',
	        function(d) { return formatPrice(d.low); },
	        'C',
	        function(d) { return formatPrice(d.close); },
	        'V',
	        function(d) { return formatVolume(d.volume); }
	    ];

	    function legend(selection) {
	        selection.each(function(model) {
	            var container = d3.select(this);

	            formatPrice = model.product.priceFormat;
	            formatVolume = model.product.volumeFormat;
	            formatTime = model.period.timeFormat;

	            if (model.data == null || model.data !== lastDataPointDisplayed) {
	                lastDataPointDisplayed = model.data;

	                var span = container.selectAll('span')
	                  .data(legendItems);

	                span.enter()
	                  .append('span')
	                  .attr('class', function(d, i) { return i % 2 === 0 ? 'legendLabel' : 'legendValue'; });

	                span.text(function(d, i) {
	                    var text = '';
	                    if (i % 2 === 0) {
	                        return d;
	                    } else if (model.data) {
	                        return d(model.data);
	                    }
	                    return text;
	                });
	            }
	        });
	    }

	    return legend;
	}

	var chart = {
	    legend: legend,
	    nav: nav,
	    primary: primary,
	    xAxis: xAxis,
	    secondary: secondary
	};

	function editIndicatorGroup() {
	    var dispatch = d3.dispatch(event.indicatorChange);

	    function editIndicatorGroup(selection) {
	        selection.each(function(model) {
	            var sel = d3.select(this);

	            var div = sel.selectAll('div')
	                .data(model.selectedIndicators, function(d) {
	                    return d.valueString;
	                });

	            var containersEnter = div.enter()
	                .append('div')
	                .attr('class', 'edit-indicator');

	            containersEnter.append('span')
	                .attr('class', 'icon sc-icon-delete')
	                .on('click', dispatch.indicatorChange);

	            containersEnter.append('span')
	                .attr('class', 'indicator-label')
	                .text(function(d) {
	                    return d.displayString;
	                });

	            div.exit()
	                .remove();
	        });
	    }

	    d3.rebind(editIndicatorGroup, dispatch, 'on');

	    return editIndicatorGroup;

	}

	function overlay() {
	    var dispatch = d3.dispatch(
	        event.primaryChartIndicatorChange,
	        event.secondaryChartChange);

	    var primaryChartIndicatorToggle = editIndicatorGroup()
	        .on(event.indicatorChange, dispatch[event.primaryChartIndicatorChange]);

	    var secondaryChartToggle = editIndicatorGroup()
	        .on(event.indicatorChange, dispatch[event.secondaryChartChange]);

	    var overlay = function(selection) {
	        selection.each(function(model) {
	            var container = d3.select(this);

	            container.select('#overlay-primary-container .edit-indicator-container')
	                .datum({selectedIndicators: model.primaryIndicators})
	                .call(primaryChartIndicatorToggle);

	            container.selectAll('.overlay-secondary-container')
	                .each(function(d, i) {
	                    var currentSelection = d3.select(this);

	                    var selectedIndicators = model.secondaryIndicators[i] ? [model.secondaryIndicators[i]] : [];

	                    currentSelection.select('.edit-indicator-container')
	                        .datum({selectedIndicators: selectedIndicators})
	                        .call(secondaryChartToggle);
	                });
	        });
	    };

	    d3.rebind(overlay, dispatch, 'on');

	    return overlay;
	}

	function navigationReset() {

	    var dispatch = d3.dispatch(event.resetToLatest);

	    function navReset(selection) {
	        var model = selection.datum();

	        var resetButton = selection.selectAll('g')
	          .data([model]);

	        resetButton.enter()
	          .append('g')
	          .attr('class', 'reset-button')
	          .on('click', function() { dispatch[event.resetToLatest](); })
	          .append('path')
	          .attr('d', 'M1.5 1.5h13.438L23 20.218 14.937 38H1.5l9.406-17.782L1.5 1.5z');

	        resetButton.classed('active', !model.trackingLatest);
	    }

	    d3.rebind(navReset, dispatch, 'on');

	    return navReset;
	}

	function dropdown() {
	    var dispatch = d3.dispatch('optionChange');

	    var buttonDataJoin = fc.util.dataJoin()
	        .selector('button')
	        .element('button')
	        .attr({
	            'class': 'dropdown-toggle',
	            'type': 'button',
	            'data-toggle': 'dropdown'
	        });

	    var caretDataJoin = fc.util.dataJoin()
	        .selector('.caret')
	        .element('span')
	        .attr('class', 'caret');

	    var listDataJoin = fc.util.dataJoin()
	        .selector('ul')
	        .element('ul')
	        .attr('class', 'dropdown-menu');

	    var listItemsDataJoin = fc.util.dataJoin()
	        .selector('li')
	        .element('li')
	        .key(function(d) { return d.displayString; });

	    function dropdown(selection) {
	        var model = selection.datum();
	        var selectedIndex = model.selectedIndex || 0;
	        var config = model.config;

	        var button = buttonDataJoin(selection, [model.options]);

	        if (config.icon) {
	            var dropdownButtonIcon = button.selectAll('.icon')
	                .data([0]);
	            dropdownButtonIcon.enter()
	                .append('span');
	            dropdownButtonIcon.attr('class', 'icon ' + model.options[selectedIndex].icon);
	        } else {
	            button.select('.icon').remove();
	            button.text(function() {
	                return config.title || model.options[selectedIndex].displayString;
	            });
	        }

	        caretDataJoin(button, config.careted ? [0] : []);

	        var list = listDataJoin(selection, [model.options]);

	        var listItems = listItemsDataJoin(list, model.options);
	        var listItemAnchors = listItems.enter()
	            .on('click', dispatch.optionChange)
	            .append('a')
	            .attr('href', '#');

	        listItemAnchors.append('span')
	            .attr('class', 'icon');
	        listItemAnchors.append('span')
	            .attr('class', 'name');

	        listItems.selectAll('.icon')
	            .attr('class', function(d) { return 'icon ' + d.icon; });
	        listItems.selectAll('.name')
	            .text(function(d) { return d.displayString; });
	    }

	    d3.rebind(dropdown, dispatch, 'on');

	    return dropdown;
	}

	function selectors() {
	    var dispatch = d3.dispatch(
	        event.primaryChartSeriesChange,
	        event.primaryChartIndicatorChange,
	        event.secondaryChartChange);

	    var primaryChartSeriesButtons = dropdown()
	        .on('optionChange', dispatch[event.primaryChartSeriesChange]);

	    var indicatorToggle = dropdown()
	        .on('optionChange', function(indicator) {
	            if (indicator.isPrimary) {
	                dispatch[event.primaryChartIndicatorChange](indicator);
	            } else {
	                dispatch[event.secondaryChartChange](indicator);
	            }
	        });

	    var selectors = function(selection) {
	        selection.each(function(model) {
	            var container = d3.select(this);

	            var selectedSeriesIndex = model.seriesSelector.options.map(function(option) {
	                return option.isSelected;
	            }).indexOf(true);

	            container.select('#series-dropdown')
	                .datum({
	                    config: model.seriesSelector.config,
	                    options: model.seriesSelector.options,
	                    selectedIndex: selectedSeriesIndex
	                })
	                .call(primaryChartSeriesButtons);

	            var options = model.indicatorSelector.options;

	            var selectedIndicatorIndexes = options
	                .map(function(option, index) {
	                    return option.isSelected ? index : null;
	                })
	                .filter(function(option) {
	                    return option;
	                });

	            container.select('#indicator-dropdown')
	                .datum({
	                    config: model.indicatorSelector.config,
	                    options: options,
	                    selected: selectedIndicatorIndexes
	                })
	                .call(indicatorToggle);

	        });
	    };

	    d3.rebind(selectors, dispatch, 'on');

	    return selectors;
	}

	// Generates a menu option similar to those generated by sc.model.menu.option from a sc.model.data.product object
	function productAdaptor(product) {
	    return {
	        displayString: product.display,
	        option: product
	    };
	}

	// Generates a menu option similar to those generated by model.menu.option from a model.data.period object
	function periodAdaptor(period) {
	    return {
	        displayString: period.display,
	        option: period
	    };
	}

	function tabGroup() {
	    var dispatch = d3.dispatch('tabClick');
	    var dataJoin = fc.util.dataJoin()
	      .selector('ul')
	      .element('ul');

	    function tabGroup(selection) {
	        var selectedIndex = selection.datum().selectedIndex || 0;

	        var ul = dataJoin(selection, [selection.datum().options]);

	        ul.enter()
	            .append('ul');

	        var li = ul.selectAll('li')
	            .data(fc.util.fn.identity);

	        li.enter()
	            .append('li')
	            .append('a')
	            .attr('href', '#')
	            .on('click', dispatch.tabClick);

	        li.classed('active', function(d, i) { return i === selectedIndex; })
	            .select('a')
	            .text(function(option) { return option.displayString; });

	        li.exit()
	            .remove();
	    }

	    d3.rebind(tabGroup, dispatch, 'on');
	    return tabGroup;
	}

	function head() {

	    var dispatch = d3.dispatch(
	        event.dataProductChange,
	        event.dataPeriodChange,
	        event.clearAllPrimaryChartIndicatorsAndSecondaryCharts);

	    var dataProductDropdown = dropdown()
	        .on('optionChange', dispatch[event.dataProductChange]);

	    var dataPeriodSelector = tabGroup()
	        .on('tabClick', dispatch[event.dataPeriodChange]);

	    var dropdownPeriodSelector = dropdown()
	        .on('optionChange', dispatch[event.dataPeriodChange]);

	    var head = function(selection) {
	        selection.each(function(model) {
	            var container = d3.select(this);

	            var products = model.products;
	            container.select('#product-dropdown')
	                .datum({
	                    config: model.productConfig,
	                    options: products.map(productAdaptor),
	                    selectedIndex: products.map(function(p) { return p.id; }).indexOf(model.selectedProduct.id)
	                })
	                .call(dataProductDropdown);

	            var periods = model.selectedProduct.periods;
	            container.select('#period-selector')
	                .classed('hidden', periods.length <= 1) // TODO: get from model instead?
	                .datum({
	                    options: periods.map(periodAdaptor),
	                    selectedIndex: periods.indexOf(model.selectedPeriod)
	                })
	                .call(dataPeriodSelector);

	            container.select('#mobile-period-selector')
	                .classed('hidden', periods.length <= 1)
	                .datum({
	                    config: model.mobilePeriodConfig,
	                    options: periods.map(periodAdaptor),
	                    selectedIndex: periods.indexOf(model.selectedPeriod)
	                })
	                .call(dropdownPeriodSelector);

	            container.select('#clear-indicators')
	                .on('click', dispatch[event.clearAllPrimaryChartIndicatorsAndSecondaryCharts]);
	        });
	    };

	    d3.rebind(head, dispatch, 'on');

	    return head;
	}

	var menu = {
	    head: head,
	    selectors: selectors,
	    navigationReset: navigationReset,
	    overlay: overlay
	};

	function callbackInvalidator() {
	    var n = 0;

	    function callbackInvalidator(callback) {
	        var id = ++n;
	        return function(err, data) {
	            if (id < n) { return; }
	            callback(err, data);
	        };
	    }

	    callbackInvalidator.invalidateCallback = function() {
	        n++;
	        return callbackInvalidator;
	    };

	    return callbackInvalidator;
	}

	function collectOhlc() {

	    var date = function(d) { return d.date; };
	    var volume = function(d) { return Number(d.volume); };
	    var price = function(d) { return Number(d.price); };
	    var granularity = 60;

	    function getBucketStart(tradeDate) {
	        var granularityInMs = granularity * 1000;
	        return new Date(Math.floor(tradeDate.getTime() / granularityInMs) * granularityInMs);
	    }

	    var collectOhlc = function(data, trade) {
	        var bucketStart = getBucketStart(date(trade));
	        var tradePrice = price(trade);
	        var tradeVolume = volume(trade);
	        var bisectDate = d3.bisector(function(d) { return d.date; }).left;
	        var existing = data.filter(function(d) {
	            return d.date.getTime() === bucketStart.getTime();
	        })[0];
	        if (existing) {
	            existing.high = Math.max(tradePrice, existing.high);
	            existing.low = Math.min(tradePrice, existing.low);
	            existing.close = tradePrice;
	            existing.volume += tradeVolume;
	        } else {
	            data.splice(bisectDate(data, bucketStart), 0, {
	                date: bucketStart,
	                open: tradePrice,
	                high: tradePrice,
	                low: tradePrice,
	                close: tradePrice,
	                volume: tradeVolume
	            });
	        }
	    };

	    collectOhlc.granularity = function(x) {
	        if (!arguments.length) {
	            return granularity;
	        }
	        granularity = x;
	        return collectOhlc;
	    };

	    collectOhlc.price = function(x) {
	        if (!arguments.length) {
	            return price;
	        }
	        price = x;
	        return collectOhlc;
	    };

	    collectOhlc.volume = function(x) {
	        if (!arguments.length) {
	            return volume;
	        }
	        volume = x;
	        return collectOhlc;
	    };

	    collectOhlc.date = function(x) {
	        if (!arguments.length) {
	            return date;
	        }
	        date = x;
	        return collectOhlc;
	    };

	    return collectOhlc;
	}

	function dataInterface() {
	    var dispatch = d3.dispatch(
	        event.newTrade,
	        event.historicDataLoaded,
	        event.historicFeedError,
	        event.streamingFeedError,
	        event.streamingFeedClose);

	    var _collectOhlc = collectOhlc()
	        .date(function(d) {return new Date(d.time); })
	        .volume(function(d) {return Number(d.size); });

	    var source,
	        callbackGenerator = callbackInvalidator(),
	        candlesOfData = 200,
	        data = [];

	    function invalidate() {
	        if (source && source.streamingFeed) {
	            source.streamingFeed.close();
	        }
	        data = [];
	        callbackGenerator.invalidateCallback();
	    }

	    function dateSortAscending(dataToSort) {
	        return dataToSort.sort(function(a, b) {
	            return a.date - b.date;
	        });
	    }

	    function handleStreamingFeedEvents() {
	        if (source.streamingFeed != null) {
	            source.streamingFeed.on('message', function(trade) {
	                _collectOhlc(data, trade);
	                dispatch[event.newTrade](data, source);
	            })
	            .on('error', function(streamingFeedError) {
	                dispatch[event.streamingFeedError](streamingFeedError, source);
	            })
	            .on('close', function(closeEvent) {
	                dispatch[event.streamingFeedClose](closeEvent, source);
	            });
	            source.streamingFeed();
	        }
	    }

	    function dataInterface(granularity, product) {
	        invalidate();

	        if (arguments.length === 2) {
	            source = product.source;
	            source.historicFeed.product(product.id);

	            if (source.streamingFeed != null) {
	                source.streamingFeed.product(product.id);
	            }
	        }

	        var now = new Date();

	        source.historicFeed.end(now)
	            .candles(candlesOfData)
	            .granularity(granularity);

	        _collectOhlc.granularity(granularity);

	        source.historicFeed(callbackGenerator(function(historicFeedError, newData) {
	            if (!historicFeedError) {
	                data = dateSortAscending(newData);
	                dispatch[event.historicDataLoaded](data, source);
	                handleStreamingFeedEvents();
	            } else {
	                dispatch[event.historicFeedError](historicFeedError, source);
	            }
	        }));
	    }

	    d3.rebind(dataInterface, dispatch, 'on');

	    return dataInterface;
	}

	function toast() {

	    var dispatch = d3.dispatch(event.notificationClose);

	    var panelDataJoin = fc.util.dataJoin()
	        .selector('div.alert-content')
	        .element('div')
	        .attr('class', 'alert-content');

	    var toastDataJoin = fc.util.dataJoin()
	        .selector('div.alert')
	        .element('div')
	        .attr({'class': 'alert alert-info alert-dismissible', 'role': 'alert'})
	        .key(function(d) { return d.id; });

	    var toast = function(selection) {
	        selection.each(function(model) {
	            var container = d3.select(this);

	            var panel = panelDataJoin(container, [model]);
	            panel.enter().html('<div class="messages"></div>');

	            var toasts = toastDataJoin(panel.select('.messages'), model.messages);

	            var toastsEnter = toasts.enter();
	            toastsEnter.html(
	                '<button type="button" class="close" aria-label="Close"> \
                    <span aria-hidden="true">&times;</span> \
                </button> \
                <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> \
                <span class="sr-only">Error:</span> \
                <span class="message"></span>');

	            toastsEnter.select('.close')
	                .on('click', function(d) { dispatch[event.notificationClose](d.id); });

	            toasts.select('.message')
	                .text(function(d) { return d.message; });
	        });
	    };

	    d3.rebind(toast, dispatch, 'on');

	    return toast;
	}

	var notification = {
	    toast: toast
	};

	function message(message) {
	    return {
	        id: util.uid(),
	        message: message
	    };
	}

	function source(historicFeed, historicNotificationFormatter, streamingFeed, streamingNotificationFormatter) {
	    return {
	        historicFeed: historicFeed,
	        historicNotificationFormatter: historicNotificationFormatter,
	        streamingFeed: streamingFeed,
	        streamingNotificationFormatter: streamingNotificationFormatter
	    };
	}

	function product(id, display, periods, source, volumeFormat, priceFormat) {
	    return {
	        id: id,
	        display: display || 'Unspecified Product',
	        priceFormat: d3.format(priceFormat || '.2f'),
	        volumeFormat: d3.format(volumeFormat || '.2f'),
	        periods: periods || [],
	        source: source
	    };
	}

	function period(display, seconds, d3TimeInterval, timeFormat) {
	    return {
	        display: display || '1 day',
	        seconds: seconds || 60 * 60 * 24,
	        d3TimeInterval: d3TimeInterval || {unit: d3.time.day, value: 1},
	        timeFormat: d3.time.format(timeFormat || '%b %d')
	    };
	}

	var data = {
	    period: period,
	    product: product,
	    source: source
	};

	function webSocketCloseEventFormatter(event) {
	    var message;
	    if (event.wasClean === false && event.code !== 1000 && event.code !== 1006) {
	        var reason = event.reason || 'Unkown reason.';
	        message = 'Disconnected from live stream: ' + event.code + ' ' + reason;
	    }
	    return message;
	}

	function coinbaseStreamingErrorResponseFormatter(event) {
	    var message;
	    if (event.type === 'error' && event.message) {
	        message = 'Live stream error: ' + event.message;
	    } else if (event.type === 'close') {
	        // The WebSocket's error event doesn't contain much useful information,
	        // so the close event is used to report errors instead
	        message = webSocketCloseEventFormatter(event);
	    }
	    return message;
	}

	function messages() {
	    return {
	        messages: []
	    };
	}

	var notification$1 = {
	    message: message,
	    messages: messages
	};

	function xAxis$1(initialPeriod) {
	    return {
	        viewDomain: [],
	        period: initialPeriod
	    };
	}

	function secondary$1(initialProduct) {
	    return {
	        data: [],
	        viewDomain: [],
	        trackingLatest: true,
	        product: initialProduct
	    };
	}

	function primary$1(initialProduct) {
	    var model = {
	        data: [],
	        trackingLatest: true,
	        viewDomain: [],
	        selectorsChanged: true
	    };

	    var _product = initialProduct;
	    Object.defineProperty(model, 'product', {
	        get: function() { return _product; },
	        set: function(newValue) {
	            _product = newValue;
	            model.selectorsChanged = true;
	        }
	    });

	    var candlestick = candlestickSeries();
	    candlestick.id = util.uid();
	    var _series = option('Candlestick', 'candlestick', candlestick);
	    _series.option.extentAccessor = ['high', 'low'];
	    Object.defineProperty(model, 'series', {
	        get: function() { return _series; },
	        set: function(newValue) {
	            _series = newValue;
	            model.selectorsChanged = true;
	        }
	    });

	    var _yValueAccessor = {option: function(d) { return d.close; }};
	    Object.defineProperty(model, 'yValueAccessor', {
	        get: function() { return _yValueAccessor; },
	        set: function(newValue) {
	            _yValueAccessor = newValue;
	            model.selectorsChanged = true;
	        }
	    });

	    var _indicators = [];
	    Object.defineProperty(model, 'indicators', {
	        get: function() { return _indicators; },
	        set: function(newValue) {
	            _indicators = newValue;
	            model.selectorsChanged = true;
	        }
	    });

	    return model;
	}

	function navigationReset$1() {
	    return {
	        trackingLatest: true
	    };
	}

	function nav$1() {
	    return {
	        data: [],
	        viewDomain: [],
	        trackingLatest: true
	    };
	}

	function legend$1(initialProduct, initialPeriod) {
	    return {
	        data: undefined,
	        product: initialProduct,
	        period: initialPeriod
	    };
	}

	var chart$1 = {
	    legend: legend$1,
	    nav: nav$1,
	    navigationReset: navigationReset$1,
	    primary: primary$1,
	    secondary: secondary$1,
	    xAxis: xAxis$1
	};

	function selector(config, options) {
	    return {
	        config: config,
	        options: options
	    };
	}

	function dropdownConfig(title, careted, listIcons, icon) {
	    return {
	        title: title || null,
	        careted: careted || false,
	        listIcons: listIcons || false,
	        icon: icon || false
	    };
	}

	function overlay$1() {
	    return {
	        primaryIndicators: [],
	        secondaryIndicators: []
	    };
	}

	function head$1(initialProducts, initialSelectedProduct, initialSelectedPeriod) {
	    return {
	        productConfig: dropdownConfig(null, true),
	        mobilePeriodConfig: dropdownConfig(),
	        products: initialProducts,
	        selectedProduct: initialSelectedProduct,
	        selectedPeriod: initialSelectedPeriod,
	        alertMessages: []
	    };
	}

	var menu$1 = {
	    head: head$1,
	    periodAdaptor: periodAdaptor,
	    productAdaptor: productAdaptor,
	    overlay: overlay$1,
	    dropdownConfig: dropdownConfig,
	    option: option,
	    selector: selector
	};

	var model = {
	    menu: menu$1,
	    chart: chart$1,
	    data: data,
	    notification: notification$1
	};

	function dataGeneratorAdaptor() {

	    var dataGenerator = fc.data.random.financial(),
	        allowedPeriods = [60 * 60 * 24],
	        candles,
	        end,
	        granularity,
	        product = null;

	    var dataGeneratorAdaptor = function(cb) {
	        end.setHours(0, 0, 0, 0);
	        var millisecondsPerDay = 24 * 60 * 60 * 1000;
	        dataGenerator.startDate(new Date(end - (candles - 1) * millisecondsPerDay));

	        var data = dataGenerator(candles);
	        cb(null, data);
	    };

	    dataGeneratorAdaptor.candles = function(x) {
	        if (!arguments.length) {
	            return candles;
	        }
	        candles = x;
	        return dataGeneratorAdaptor;
	    };

	    dataGeneratorAdaptor.end = function(x) {
	        if (!arguments.length) {
	            return end;
	        }
	        end = x;
	        return dataGeneratorAdaptor;
	    };

	    dataGeneratorAdaptor.granularity = function(x) {
	        if (!arguments.length) {
	            return granularity;
	        }
	        if (allowedPeriods.indexOf(x) === -1) {
	            throw new Error('Granularity of ' + x + ' is not supported. '
	             + 'Random Financial Data Generator only supports daily data.');
	        }
	        granularity = x;
	        return dataGeneratorAdaptor;
	    };

	    dataGeneratorAdaptor.product = function(x) {
	        if (!arguments.length) {
	            return dataGeneratorAdaptor;
	        }
	        if (x !== null) {
	            throw new Error('Random Financial Data Generator does not support products.');
	        }
	        product = x;
	        return dataGeneratorAdaptor;
	    };

	    dataGeneratorAdaptor.apiKey = function() {
	        throw new Error('Not implemented.');
	    };

	    return dataGeneratorAdaptor;
	}

	// Inspired by underscore library implementation of debounce

	function debounce(func, wait, immediate) {
	    var timeout;
	    var args;
	    var timestamp;
	    var result;

	    var later = function() {
	        var last = new Date().getTime() - timestamp;

	        if (last < wait && last >= 0) {
	            timeout = setTimeout(later.bind(this), wait - last);
	        } else {
	            timeout = null;
	            if (!immediate) {
	                result = func.apply(this, args);
	                args = null;
	            }
	        }
	    };

	    return function() {
	        args = arguments;
	        timestamp = new Date().getTime();
	        var callNow = immediate && !timeout;

	        if (!timeout) {
	            timeout = setTimeout(later.bind(this), wait);
	        }
	        if (callNow) {
	            result = func.apply(this, args);
	            args = null;
	        }

	        return result;
	    };
	}

	function coinbaseAdaptor() {
	    var rateLimit = 1000;       // The coinbase API has a limit of 1 request per second

	    var historicFeed = fc.data.feed.coinbase(),
	        candles;

	    var coinbaseAdaptor = debounce(function coinbaseAdaptor(cb) {
	        var startDate = d3.time.second.offset(historicFeed.end(), -candles * historicFeed.granularity());
	        historicFeed.start(startDate);
	        historicFeed(cb);
	    }, rateLimit);

	    coinbaseAdaptor.candles = function(x) {
	        if (!arguments.length) {
	            return candles;
	        }
	        candles = x;
	        return coinbaseAdaptor;
	    };

	    coinbaseAdaptor.apiKey = function() {
	        throw new Error('Not implemented.');
	    };

	    d3.rebind(coinbaseAdaptor, historicFeed, 'end', 'granularity', 'product');

	    return coinbaseAdaptor;
	}

	function coinbaseHistoricErrorResponseFormatter(responseObject) {
	    var message;
	    if (responseObject) {
	        message = responseObject.message;
	    }
	    return message;
	}

	// https://docs.exchange.coinbase.com/#websocket-feed

	function coinbaseWebSocket() {

	    var product = 'BTC-USD';
	    var dispatch = d3.dispatch('open', 'close', 'error', 'message');
	    var messageType = 'match';
	    var socket;

	    var webSocket = function(url, subscribe) {
	        url = url || 'wss://ws-feed.exchange.coinbase.com';
	        subscribe = subscribe || {
	            'type': 'subscribe',
	            'product_id': product
	        };

	        socket = new WebSocket(url);

	        socket.onopen = function(event) {
	            socket.send(JSON.stringify(subscribe));
	            dispatch.open(event);
	        };
	        socket.onerror = function(event) {
	            dispatch.error(event);
	        };
	        socket.onclose = function(event) {
	            dispatch.close(event);
	        };
	        socket.onmessage = function(event) {
	            var msg = JSON.parse(event.data);
	            if (msg.type === messageType) {
	                dispatch.message(msg);
	            } else if (msg.type === 'error') {
	                dispatch.error(msg);
	            }
	        };
	    };

	    d3.rebind(webSocket, dispatch, 'on');

	    webSocket.close = function() {
	        // Only close the WebSocket if it is opening or open
	        if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
	            socket.close();
	        }
	    };

	    webSocket.messageType = function(x) {
	        if (!arguments.length) {
	            return messageType;
	        }
	        messageType = x;
	        return webSocket;
	    };

	    webSocket.product = function(x) {
	        if (!arguments.length) {
	            return product;
	        }
	        product = x;
	        return webSocket;
	    };

	    return webSocket;
	}

	function quandlAdaptor() {

	    var historicFeed = fc.data.feed.quandl(),
	        granularity,
	        candles;

	    // More options are allowed through the API; for now, only support daily and weekly
	    var allowedPeriods = d3.map();
	    allowedPeriods.set(60 * 60 * 24, 'daily');
	    allowedPeriods.set(60 * 60 * 24 * 7, 'weekly');

	    function quandlAdaptor(cb) {
	        var startDate = d3.time.second.offset(historicFeed.end(), -candles * granularity);
	        historicFeed.start(startDate)
	            .collapse(allowedPeriods.get(granularity));
	        historicFeed(cb);
	    }

	    quandlAdaptor.candles = function(x) {
	        if (!arguments.length) {
	            return candles;
	        }
	        candles = x;
	        return quandlAdaptor;
	    };

	    quandlAdaptor.granularity = function(x) {
	        if (!arguments.length) {
	            return granularity;
	        }
	        if (!allowedPeriods.has(x)) {
	            throw new Error('Granularity of ' + x + ' is not supported.');
	        }
	        granularity = x;
	        return quandlAdaptor;
	    };

	    fc.util.rebind(quandlAdaptor, historicFeed, {
	        end: 'end',
	        product: 'dataset',
	        apiKey: 'apiKey'
	    });

	    return quandlAdaptor;
	}

	function quandlHistoricErrorResponseFormatter(responseObject) {
	    var message;
	    if (responseObject && responseObject.quandl_error) {
	        message = responseObject.quandl_error.message;
	    }
	    return message;
	}

	function initialiseModel() {
	    function initPeriods() {
	        return {
	            week1: model.data.period('Weekly', 60 * 60 * 24 * 7, {unit: d3.time.week, value: 1}, '%b %d'),
	            day1: model.data.period('Daily', 60 * 60 * 24, {unit: d3.time.day, value: 1}, '%b %d'),
	            hour1: model.data.period('1 Hr', 60 * 60, {unit: d3.time.hour, value: 1}, '%b %d %Hh'),
	            minute5: model.data.period('5 Min', 60 * 5, {unit: d3.time.minute, value: 5}, '%H:%M'),
	            minute1: model.data.period('1 Min', 60, {unit: d3.time.minute, value: 1}, '%H:%M')
	        };
	    }

	    function initSources() {
	        return {
	            generated: model.data.source(dataGeneratorAdaptor(), null, null),
	            bitcoin: model.data.source(coinbaseAdaptor(), coinbaseHistoricErrorResponseFormatter, coinbaseWebSocket(),
	                coinbaseStreamingErrorResponseFormatter),
	            quandl: model.data.source(quandlAdaptor(), quandlHistoricErrorResponseFormatter, null, null)
	        };
	    }

	    function initProducts() {
	        return {
	            generated: model.data.product(null, 'Data Generator', [periods.day1], sources.generated, '.3s'),
	            quandl: model.data.product('GOOG', 'GOOG', [periods.day1, periods.week1], sources.quandl, '.3s')
	        };
	    }

	    function initSeriesSelector() {

	        var candlestick = candlestickSeries();
	        candlestick.id = util.uid();
	        var candlestickOption = model.menu.option(
	            'Candlestick',
	            'candlestick',
	            candlestick,
	            'sc-icon-candlestick-series');
	        candlestickOption.isSelected = true;
	        candlestickOption.option.extentAccessor = ['high', 'low'];

	        var ohlc = fc.series.ohlc();
	        ohlc.id = util.uid();
	        var ohlcOption = model.menu.option('OHLC', 'ohlc', ohlc, 'sc-icon-ohlc-series');
	        ohlcOption.option.extentAccessor = ['high', 'low'];

	        var line = fc.series.line();
	        line.id = util.uid();
	        var lineOption = model.menu.option('Line', 'line', line, 'sc-icon-line-series');
	        lineOption.option.extentAccessor = 'close';

	        var point = fc.series.point();
	        point.id = util.uid();
	        var pointOption = model.menu.option('Point', 'point', point, 'sc-icon-point-series');
	        pointOption.option.extentAccessor = 'close';

	        var area = fc.series.area();
	        area.id = util.uid();
	        var areaOption = model.menu.option('Area', 'area', area, 'sc-icon-area-series');
	        areaOption.option.extentAccessor = 'close';

	        var config = model.menu.dropdownConfig(null, false, true, true);

	        var options = [
	            candlestickOption,
	            ohlcOption,
	            lineOption,
	            pointOption,
	            areaOption
	        ];

	        return model.menu.selector(config, options);
	    }

	    function initIndicatorOptions() {
	        var secondary = chart.secondary;

	        var movingAverage = fc.series.line()
	            .decorate(function(select) {
	                select.enter()
	                    .classed('movingAverage', true);
	            })
	            .yValue(function(d) { return d.movingAverage; });
	        movingAverage.id = util.uid();

	        var movingAverageOption = model.menu.option('Moving Average', 'movingAverage',
	            movingAverage, 'sc-icon-moving-average-indicator', true);
	        movingAverageOption.option.extentAccessor = function(d) { return d.movingAverage; };

	        var bollingerBands = fc.indicator.renderer.bollingerBands();
	        bollingerBands.id = util.uid();

	        var bollingerBandsOption = model.menu.option('Bollinger Bands', 'bollinger',
	            bollingerBands, 'sc-icon-bollinger-bands-indicator', true);
	        bollingerBandsOption.option.extentAccessor = [function(d) { return d.bollingerBands.lower; },
	            function(d) { return d.bollingerBands.upper; }];

	        var indicators = [
	            movingAverageOption,
	            bollingerBandsOption,
	            model.menu.option('Relative Strength Index', 'secondary-rsi',
	                secondary.rsi(), 'sc-icon-rsi-indicator', false),
	            model.menu.option('MACD', 'secondary-macd',
	                secondary.macd(), 'sc-icon-macd-indicator', false),
	            model.menu.option('Volume', 'secondary-volume',
	                secondary.volume(), 'sc-icon-bar-series', false)
	        ];

	        return indicators;
	    }

	    function initIndicatorSelector() {
	        var config = model.menu.dropdownConfig('Add Indicator', false, true);

	        return model.menu.selector(config, initIndicatorOptions());
	    }

	    function initSelectors() {
	        return {
	            seriesSelector: initSeriesSelector(),
	            indicatorSelector: initIndicatorSelector()
	        };
	    }

	    var periods = initPeriods();
	    var sources = initSources();
	    var products = initProducts();

	    return {
	        periods: periods,
	        sources: sources,
	        primaryChart: model.chart.primary(products.generated),
	        secondaryChart: model.chart.secondary(products.generated),
	        selectors: initSelectors(),
	        xAxis: model.chart.xAxis(periods.day1),
	        nav: model.chart.nav(),
	        navReset: model.chart.navigationReset(),
	        headMenu: model.menu.head([products.generated, products.quandl], products.generated, periods.day1),
	        legend: model.chart.legend(products.generated, periods.day1),
	        overlay: model.menu.overlay(),
	        notificationMessages: model.notification.messages()
	    };
	}

	function getCoinbaseProducts(callback) {
	    d3.json('https://api.exchange.coinbase.com/products', function(error, response) {
	        if (error) {
	            callback(error);
	            return;
	        }
	        callback(error, response);
	    });
	}

	function formatCoinbaseProducts(products, source, defaultPeriods, productPeriodOverrides) {
	    return products.map(function(product) {
	        return model.data.product(product.id, product.id,
	            productPeriodOverrides.get(product.id) || defaultPeriods, source);
	    });
	}

	function app() {

	    var appTemplate = '<div class="container-fluid"> \
        <div id="notifications"></div> \
        <div id="loading-status-message"></div> \
        <div class="row head-menu head-row"> \
            <div class="col-md-12 head-sub-row"> \
                <div id="product-dropdown" class="dropdown product-dropdown"></div> \
                <div id="period-selector" class="hidden-xs hidden-sm"></div> \
                <div id="mobile-period-selector" class="hidden-md hidden-lg dropdown"></div> \
                <span id="clear-indicators" class="icon sc-icon-delete delete-button hidden-md hidden-lg"></span> \
            </div> \
        </div> \
        <div class="row primary-row"> \
            <div id="charts" class="col-md-12"> \
                <div id="charts-container"> \
                    <svg id="primary-container"></svg> \
                    <svg class="secondary-container"></svg> \
                    <svg class="secondary-container"></svg> \
                    <svg class="secondary-container"></svg> \
                    <div class="x-axis-row"> \
                        <svg id="x-axis-container"></svg> \
                    </div> \
                    <div id="navbar-row" class="hidden-xs hidden-sm"> \
                        <svg id="navbar-container"></svg> \
                        <svg id="navbar-reset"></svg> \
                    </div> \
                </div> \
                <div id="overlay"> \
                    <div id="overlay-primary-container"> \
                        <div id="overlay-primary-head"> \
                            <div id="selectors"> \
                                <div id="series-dropdown" class="dropdown selector-dropdown"></div> \
                                <div id="indicator-dropdown" class="dropdown selector-dropdown"></div> \
                            </div> \
                            <div id="legend" class="hidden-xs hidden-sm"></div> \
                        </div> \
                        <div id="overlay-primary-bottom"> \
                            <div class="edit-indicator-container"></div> \
                        </div> \
                    </div> \
                    <div class="overlay-secondary-container"> \
                        <div class="edit-indicator-container"></div> \
                    </div> \
                    <div class="overlay-secondary-container"> \
                        <div class="edit-indicator-container"></div> \
                    </div> \
                    <div class="overlay-secondary-container"> \
                        <div class="edit-indicator-container"></div> \
                    </div> \
                    <div class="x-axis-row"></div> \
                    <div id="overlay-navbar-row" class="hidden-xs hidden-sm"></div> \
                </div> \
            </div> \
        </div> \
    </div>';

	    var app = {};

	    var containers;

	    var model = initialiseModel();

	    var _dataInterface;

	    var charts = {
	        primary: undefined,
	        secondaries: [],
	        xAxis: chart.xAxis(),
	        navbar: undefined,
	        legend: chart.legend()
	    };

	    var overlay;
	    var headMenu;
	    var navReset;
	    var selectors;
	    var toastNotifications;

	    var fetchCoinbaseProducts = false;

	    var firstRender = true;
	    function renderInternal() {
	        if (firstRender) {
	            firstRender = false;
	        }
	        if (layoutRedrawnInNextRender) {
	            containers.suspendLayout(false);
	        }

	        containers.primary.datum(model.primaryChart)
	            .call(charts.primary);

	        containers.legend.datum(model.legend)
	            .call(charts.legend);

	        containers.secondaries.datum(model.secondaryChart)
	            // TODO: Add component: group of secondary charts.
	            // Then also move method layout.getSecondaryContainer into the group.
	            .filter(function(d, i) { return i < charts.secondaries.length; })
	            .each(function(d, i) {
	                d3.select(this)
	                    .attr('class', 'secondary-container ' + charts.secondaries[i].valueString)
	                    .call(charts.secondaries[i].option);
	            });

	        containers.xAxis.datum(model.xAxis)
	            .call(charts.xAxis);

	        containers.navbar.datum(model.nav)
	            .call(charts.navbar);

	        containers.app.select('#navbar-reset')
	            .datum(model.navReset)
	            .call(navReset);

	        containers.app.select('.head-menu')
	            .datum(model.headMenu)
	            .call(headMenu);

	        containers.app.select('#selectors')
	            .datum(model.selectors)
	            .call(selectors);

	        containers.app.select('#notifications')
	            .datum(model.notificationMessages)
	            .call(toastNotifications);

	        containers.overlay.datum(model.overlay)
	            .call(overlay);

	        if (layoutRedrawnInNextRender) {
	            containers.suspendLayout(true);
	            layoutRedrawnInNextRender = false;
	        }
	    }

	    var render = fc.util.render(renderInternal);

	    var layoutRedrawnInNextRender = true;

	    function updateLayout() {
	        layoutRedrawnInNextRender = true;
	        util.layout(containers, charts);
	    }

	    function initialiseResize() {
	        d3.select(window).on('resize', function() {
	            updateLayout();
	            render();
	        });
	    }

	    function addNotification(message$$) {
	        model.notificationMessages.messages.unshift(message(message$$));
	    }

	    function onViewChange(domain) {
	        var viewDomain = [domain[0], domain[1]];
	        model.primaryChart.viewDomain = viewDomain;
	        model.secondaryChart.viewDomain = viewDomain;
	        model.xAxis.viewDomain = viewDomain;
	        model.nav.viewDomain = viewDomain;

	        var trackingLatest = util.domain.trackingLatestData(
	            model.primaryChart.viewDomain,
	            model.primaryChart.data);
	        model.primaryChart.trackingLatest = trackingLatest;
	        model.secondaryChart.trackingLatest = trackingLatest;
	        model.nav.trackingLatest = trackingLatest;
	        model.navReset.trackingLatest = trackingLatest;
	        render();
	    }

	    function onPrimaryIndicatorChange(indicator) {
	        indicator.isSelected = !indicator.isSelected;
	        updatePrimaryChartIndicators();
	        render();
	    }

	    function onSecondaryChartChange(_chart) {
	        _chart.isSelected = !_chart.isSelected;
	        updateSecondaryCharts();
	        render();
	    }

	    function onCrosshairChange(dataPoint) {
	        model.legend.data = dataPoint;
	        render();
	    }

	    function onStreamingFeedCloseOrError(streamingEvent, source) {
	        var message$$;
	        if (source.streamingNotificationFormatter) {
	            message$$ = source.streamingNotificationFormatter(streamingEvent);
	        } else {
	            // #515 (https://github.com/ScottLogic/d3fc-showcase/issues/515)
	            // (TODO) prevents errors when formatting streaming close/error messages when product changes.
	            // As we only have a coinbase streaming source at the moment, this is a suitable fix for now
	            message$$ = coinbaseStreamingErrorResponseFormatter(streamingEvent);
	        }
	        if (message$$) {
	            addNotification(message$$);
	            render();
	        }
	    }

	    function resetToLatest() {
	        var data = model.primaryChart.data;
	        var dataDomain = fc.util.extent()
	            .fields('date')(data);
	        var navTimeDomain = util.domain.moveToLatest(dataDomain, data, 0.2);
	        onViewChange(navTimeDomain);
	    }

	    function loading(isLoading, error) {
	        var spinner = '<div class="spinner"></div>';
	        var errorMessage = '<div class="content alert alert-info">' + error + '</div>';

	        containers.app.select('#loading-status-message')
	            .classed('hidden', !(isLoading || error))
	            .html(error ? errorMessage : spinner);
	    }

	    function updateModelData(data) {
	        model.primaryChart.data = data;
	        model.secondaryChart.data = data;
	        model.nav.data = data;
	    }

	    function updateModelSelectedProduct(product) {
	        model.headMenu.selectedProduct = product;
	        model.primaryChart.product = product;
	        model.secondaryChart.product = product;
	        model.legend.product = product;
	    }

	    function updateModelSelectedPeriod(period) {
	        model.headMenu.selectedPeriod = period;
	        model.xAxis.period = period;
	        model.legend.period = period;
	    }

	    function changeProduct(product) {
	        loading(true);
	        updateModelSelectedProduct(product);
	        updateModelSelectedPeriod(product.periods[0]);
	        _dataInterface(product.periods[0].seconds, product);
	    }

	    function initialisePrimaryChart() {
	        return chart.primary()
	            .on(event.crosshairChange, onCrosshairChange)
	            .on(event.viewChange, onViewChange);
	    }

	    function initialiseNav() {
	        return chart.nav()
	            .on(event.viewChange, onViewChange);
	    }

	    function initialiseNavReset() {
	        return menu.navigationReset()
	            .on(event.resetToLatest, resetToLatest);
	    }

	    function initialiseDataInterface() {
	        return dataInterface()
	            .on(event.newTrade, function(data, source) {
	                updateModelData(data);
	                if (model.primaryChart.trackingLatest) {
	                    var newDomain = util.domain.moveToLatest(
	                        model.primaryChart.viewDomain,
	                        model.primaryChart.data);
	                    onViewChange(newDomain);
	                }
	            })
	            .on(event.historicDataLoaded, function(data, source) {
	                loading(false);
	                updateModelData(data);
	                model.legend.data = null;
	                resetToLatest();
	                updateLayout();
	            })
	            .on(event.historicFeedError, function(err, source) {
	                loading(false, 'Error loading data. Please make your selection again, or refresh the page.');
	                var responseText = '';
	                try {
	                    var responseObject = JSON.parse(err.responseText);
	                    var formattedMessage = source.historicNotificationFormatter(responseObject);
	                    if (formattedMessage) {
	                        responseText = '. ' + formattedMessage;
	                    }
	                } catch (e) {
	                    responseText = '';
	                }
	                var statusText = err.statusText || 'Unknown reason.';
	                var message$$ = 'Error getting historic data: ' + statusText + responseText;

	                addNotification(message$$);
	                render();
	            })
	            .on(event.streamingFeedError, onStreamingFeedCloseOrError)
	            .on(event.streamingFeedClose, onStreamingFeedCloseOrError);
	    }

	    function initialiseHeadMenu() {
	        return menu.head()
	            .on(event.dataProductChange, function(product) {
	                changeProduct(product.option);
	                render();
	            })
	            .on(event.dataPeriodChange, function(period) {
	                loading(true);
	                updateModelSelectedPeriod(period.option);
	                _dataInterface(period.option.seconds);
	                render();
	            })
	            .on(event.clearAllPrimaryChartIndicatorsAndSecondaryCharts, function() {
	                model.primaryChart.indicators.forEach(deselectOption);
	                charts.secondaries.forEach(deselectOption);

	                updatePrimaryChartIndicators();
	                updateSecondaryCharts();
	                render();
	            });
	    }

	    function selectOption(option, options) {
	        options.forEach(function(_option) {
	            _option.isSelected = false;
	        });
	        option.isSelected = true;
	    }

	    function deselectOption(option) { option.isSelected = false; }

	    function initialiseSelectors() {
	        return menu.selectors()
	            .on(event.primaryChartSeriesChange, function(series) {
	                model.primaryChart.series = series;
	                selectOption(series, model.selectors.seriesSelector.options);
	                render();
	            })
	            .on(event.primaryChartIndicatorChange, onPrimaryIndicatorChange)
	            .on(event.secondaryChartChange, onSecondaryChartChange);
	    }

	    function updatePrimaryChartIndicators() {
	        model.primaryChart.indicators =
	            model.selectors.indicatorSelector.options.filter(function(option) {
	                return option.isSelected && option.isPrimary;
	            });

	        model.overlay.primaryIndicators = model.primaryChart.indicators;
	    }

	    function updateSecondaryCharts() {
	        charts.secondaries =
	            model.selectors.indicatorSelector.options.filter(function(option) {
	                return option.isSelected && !option.isPrimary;
	            });
	        // TODO: This doesn't seem to be a concern of menu.
	        charts.secondaries.forEach(function(chartOption) {
	            chartOption.option.on(event.viewChange, onViewChange);
	        });

	        model.overlay.secondaryIndicators = charts.secondaries;
	        // TODO: Remove .remove! (could a secondary chart group component manage this?).
	        containers.secondaries.selectAll('*').remove();
	        updateLayout();
	    }

	    function initialiseOverlay() {
	        return menu.overlay()
	            .on(event.primaryChartIndicatorChange, onPrimaryIndicatorChange)
	            .on(event.secondaryChartChange, onSecondaryChartChange);
	    }

	    function onNotificationClose(id) {
	        model.notificationMessages.messages = model.notificationMessages.messages.filter(function(message$$) { return message$$.id !== id; });
	        render();
	    }

	    function initialiseNotifications() {
	        return notification.toast()
	            .on(event.notificationClose, onNotificationClose);
	    }

	    function addCoinbaseProducts(error, bitcoinProducts) {
	        if (error) {
	            var statusText = error.statusText || 'Unknown reason.';
	            var message$$ = 'Error retrieving Coinbase products: ' + statusText;
	            model.notificationMessages.messages.unshift(message(message$$));
	        } else {
	            var defaultPeriods = [model.periods.hour1, model.periods.day1];
	            var productPeriodOverrides = d3.map();
	            productPeriodOverrides.set('BTC-USD', [model.periods.minute1, model.periods.minute5, model.periods.hour1, model.periods.day1]);
	            var formattedProducts = formatCoinbaseProducts(bitcoinProducts, model.sources.bitcoin, defaultPeriods, productPeriodOverrides);
	            model.headMenu.products = model.headMenu.products.concat(formattedProducts);
	        }

	        render();
	    }

	    app.fetchCoinbaseProducts = function(x) {
	        if (!arguments.length) {
	            return fetchCoinbaseProducts;
	        }
	        fetchCoinbaseProducts = x;
	        return app;
	    };

	    app.changeQuandlProduct = function(productString) {
	        var product = data.product(productString, productString, [model.periods.day1], model.sources.quandl, '.3s');
	        var existsInHeadMenuProducts = model.headMenu.products.some(function(p) { return p.id === product.id; });

	        if (!existsInHeadMenuProducts) {
	            model.headMenu.products.push(product);
	        }

	        changeProduct(product);

	        if (!firstRender) {
	            render();
	        }
	    };

	    app.run = function(element) {
	        if (!element) {
	            throw new Error('An element must be specified when running the application.');
	        }

	        var appContainer = d3.select(element);
	        appContainer.html(appTemplate);

	        var chartsAndOverlayContainer = appContainer.select('#charts');
	        var chartsContainer = appContainer.select('#charts-container');
	        var overlayContainer = appContainer.select('#overlay');
	        containers = {
	            app: appContainer,
	            charts: chartsContainer,
	            chartsAndOverlay: chartsAndOverlayContainer,
	            primary: chartsContainer.select('#primary-container'),
	            secondaries: chartsContainer.selectAll('.secondary-container'),
	            xAxis: chartsContainer.select('#x-axis-container'),
	            navbar: chartsContainer.select('#navbar-container'),
	            overlay: overlayContainer,
	            overlaySecondaries: overlayContainer.selectAll('.overlay-secondary-container'),
	            legend: appContainer.select('#legend'),
	            suspendLayout: function(value) {
	                var self = this;
	                Object.keys(self).forEach(function(key) {
	                    if (typeof self[key] !== 'function') {
	                        self[key].layoutSuspended(value);
	                    }
	                });
	            }
	        };

	        charts.primary = initialisePrimaryChart();
	        charts.navbar = initialiseNav();

	        _dataInterface = initialiseDataInterface();
	        headMenu = initialiseHeadMenu();
	        navReset = initialiseNavReset();
	        selectors = initialiseSelectors();
	        overlay = initialiseOverlay();
	        toastNotifications = initialiseNotifications();

	        updateLayout();
	        initialiseResize();
	        _dataInterface(model.headMenu.selectedPeriod.seconds, model.headMenu.selectedProduct);

	        if (fetchCoinbaseProducts) {
	            getCoinbaseProducts(addCoinbaseProducts);
	        } else if (model.sources.bitcoin) {
	            delete model.sources.bitcoin;
	        }
	    };

	    fc.util.rebind(app, model.sources.quandl.historicFeed, {
	        quandlApiKey: 'apiKey'
	    });

	    return app;
	}

	var showcase = {
	    app: app
	};

	showcase.app()
	    .fetchCoinbaseProducts(true)
	    .run('#app-container');

}));