import fc from 'd3fc';
import makeDatum from '../helpers/makeDatum';
import calculateDomain from '../../src/assets/js/behavior/zoom/calculateDomain';
import skipWeekends from '../../src/assets/js/scale/discontinuity/skipWeekends';

describe('behavior/zoom/calculateDomain', function() {

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

    it('should return the correct dates when the dates are within the extent with skip weekends discontinuity, not zoomed, not trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];
        var zoomed = false;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the extent with skip weekends discontinuity, zoomed, not trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the extent with skip weekends discontinuity, not zoomed, trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];
        var zoomed = false;
        var trackingLatest = true;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the extent with skip weekends discontinuity, zoomed, trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [thursday, saturday];
        var zoomed = true;
        var trackingLatest = true;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the lower date is within the extent with skip weekends discontinuity, zoomed, not trackingLatest', function() {
        var domain = [thursday, sunday];
        var expected = [thursday, saturday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the upper date is within the extent with skip weekends discontinuity, zoomed, not trackingLatest', function() {
        var domain = [monday, thursday];
        var expected = [tuesday, thursday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, skipWeekends(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when neither is within the extent with identity discontinuity, zoomed, not trackingLatest', function() {
        var domain = [monday, sunday];
        var expected = [tuesday, saturday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the extent with identity discontinuity, not zoomed, not trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];
        var zoomed = false;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the extent with identity discontinuity, zoomed, not trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the extent with identity discontinuity, not zoomed, trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [wednesday, friday];
        var zoomed = false;
        var trackingLatest = true;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the dates are within the extent with identity discontinuity, zoomed, trackingLatest', function() {
        var domain = [wednesday, friday];
        var expected = [thursday, saturday];
        var zoomed = true;
        var trackingLatest = true;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the lower date is within the extent with identity discontinuity, zoomed, not trackingLatest', function() {
        var domain = [thursday, sunday];
        var expected = [thursday, saturday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when the upper date is within the extent with skip weekends discontinuity, zoomed, not trackingLatest', function() {
        var domain = [monday, thursday];
        var expected = [tuesday, thursday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });

    it('should return the correct dates when neither is within the extent with identity discontinuity, zoomed, not trackingLatest', function() {
        var domain = [monday, sunday];
        var expected = [tuesday, saturday];
        var zoomed = true;
        var trackingLatest = false;

        xScale.domain(domain);

        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest).length).toEqual(domain.length);
        expect(calculateDomain(xScale, data, fc.scale.discontinuity.identity(), xExtent, zoomed, trackingLatest)).toEqual(expected);
    });
});
