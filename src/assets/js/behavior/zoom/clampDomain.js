import d3 from 'd3';

export default function(scale, domain, data, totalXExtent) {
    var clampedDomain = domain;

    if (scale(data[0].date) > 0) {
        clampedDomain[1] = scale.invert(scale(domain[1]) + scale(data[0].date));
    }

    clampedDomain[0] = d3.max([totalXExtent[0], clampedDomain[0]]);
    clampedDomain[1] = d3.min([totalXExtent[1], clampedDomain[1]]);

    return clampedDomain;
}
