import d3 from 'd3';
import fc from 'd3fc';

export default function(domain, data, centerDate) {
    var dataExtent = fc.util.extent()
        .fields('date')(data);
    var newBrush = [];
    var overShoot = 0;

    if (domain[0].getTime() > domain[1].getTime()) {
        var tempDomain = domain[0];
        domain[0] = domain[1];
        domain[1] = tempDomain;
    }

    var distanceAroundCenterDate = (domain[1].getTime() - domain[0].getTime()) / 2;
    newBrush[0] = new Date(centerDate.getTime() - distanceAroundCenterDate);
    newBrush[1] = new Date(centerDate.getTime() + distanceAroundCenterDate);

    if (newBrush[0].getTime() < dataExtent[0].getTime()) {
        overShoot = dataExtent[0].getTime() - domain[0].getTime();
        newBrush[0] = dataExtent[0];
        newBrush[1] = new Date(domain[1].getTime() + overShoot);
    } else if (newBrush[1].getTime() > dataExtent[1].getTime()) {
        overShoot = domain[1].getTime() - dataExtent[1].getTime();
        newBrush[0] = new Date(domain[0].getTime() - overShoot);
        newBrush[1] = dataExtent[1];
    }

    return newBrush;
}
