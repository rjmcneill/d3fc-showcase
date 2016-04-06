import d3 from 'd3';

export default function(domain, totalXExtent) {
    return [d3.max([totalXExtent[0], domain[0]]), d3.min([totalXExtent[1], domain[1]])];
}
