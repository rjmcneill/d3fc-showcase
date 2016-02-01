import d3 from 'd3';
import fc from 'd3fc';

export default function(domain, data, centerDate) {
    var dataExtent = fc.util.extent()
        .fields('date')(data);
    var centeredDomain = [];
    var overShoot = 0;

    // If the left and right hand limits of the domain are not in chronological order, reorder them
    if (domain[0] > domain[1]) {
        domain.reverse();
    }

    var distanceAroundCenterDate = (domain[1].getTime() - domain[0].getTime()) / 2;
    centeredDomain[0] = new Date(centerDate.getTime() - distanceAroundCenterDate);
    centeredDomain[1] = new Date(centerDate.getTime() + distanceAroundCenterDate);

    if (centeredDomain[0] < dataExtent[0]) {
        overShoot = dataExtent[0].getTime() - domain[0].getTime();
        centeredDomain[0] = dataExtent[0];
        centeredDomain[1] = new Date(domain[1].getTime() + overShoot);
    } else if (centeredDomain[1] > dataExtent[1]) {
        overShoot = domain[1].getTime() - dataExtent[1].getTime();
        centeredDomain[0] = new Date(domain[0].getTime() - overShoot);
        centeredDomain[1] = dataExtent[1];
    }

    return centeredDomain;
}
