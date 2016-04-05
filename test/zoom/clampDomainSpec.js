import fc from 'd3fc';
import makeDatum from '../helpers/makeDatum';
import clampDomain from '../../src/assets/js/behavior/clampDomain';
import skipWeekends from '../../src/assets/js/scale/discontinuity/skipWeekends';

describe('util/domain/trackingLatestData', function() {

    var monday = new Date(2015, 7, 17);
    var tuesday = new Date(2015, 7, 18);
    var wednesday = new Date(2015, 7, 19);
    var thursday = new Date(2015, 7, 20);
    var friday = new Date(2015, 7, 21);
    var saturday = new Date(2015, 7, 22);
    var sunday = new Date(2015, 7, 23);

    var data = [
        makeDatum(tuesday),
        makeDatum(wednesday),
        makeDatum(thursday),
        makeDatum(friday),
        makeDatum(saturday)
    ];

    var xExtent = fc.util.extent()
        .fields('date')(data);

    var xScale = fc.scale.dateTime()
        .domain(xExtent);

    it('should return the correct dates when the dates are within the domain with unity discontinuity', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });

    it('should return the correct dates when the lower date is within the domain with unity discontinuity', function() {
        var domain = [wednesday, sunday];
        var expected = [wednesday, saturday];

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });

    it('should return the correct dates when the upper date is within the domain with unity discontinuity', function() {
        var domain = [monday, friday];
        var expected = [tuesday, friday];

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });

    it('should return the correct dates when the neither date is within the domain with unity discontinuity', function() {
        var domain = [monday, sunday];
        var expected = [tuesday, saturday];

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the domain with skip weekends discontinuity', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];

        xScale.discontinuityProvider(skipWeekends());

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });

    it('should return the correct dates when the lower date is within the domain with skip weekends discontinuity', function() {
        var domain = [wednesday, sunday];
        var expected = [wednesday, saturday];

        xScale.discontinuityProvider(skipWeekends());

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });

    it('should return the correct dates when the upper date is within the domain with skip weekends discontinuity', function() {
        var domain = [monday, friday];
        var expected = [tuesday, friday];

        xScale.discontinuityProvider(skipWeekends());

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });

    it('should return the correct dates when the neither date is within the domain with skip weekends discontinuity', function() {
        var domain = [monday, sunday];
        var expected = [tuesday, saturday];

        xScale.discontinuityProvider(skipWeekends());

        expect(clampDomain(xScale, domain, data, xExtent).length).toEqual(domain.length);
        expect(clampDomain(xScale, domain, data, xExtent)).toEqual(expected);
    });
});
