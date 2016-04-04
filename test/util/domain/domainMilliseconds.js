import fc from 'd3fc';
import domainMilliseconds from '../../../src/assets/js/util/domain/domainMilliseconds';
import skipWeekends from '../../../src/assets/js/scale/discontinuity/skipWeekends';

describe('util/domain/domainMilliseconds', function() {

    var monday = new Date(2015, 7, 17);
    var friday = new Date(2015, 7, 21);
    var monday2 = new Date(2015, 7, 24);

    var monday154521 = new Date(2015, 7, 17, 15, 45, 21);
    var wednesday172301 = new Date(2015, 7, 19, 17, 23, 1);
    var monday172301 = new Date(2015, 7, 24, 17, 23, 1);

    it('should return the correct time difference for days with unity discontinuity', function() {
        var domain = [monday, friday];
        var expected = 345600000;

        expect(domainMilliseconds(domain, fc.scale.discontinuity.identity())).toEqual(expected);
    });

    it('should return the correct time difference for more specific times with unity discontinuity', function() {
        var domain = [monday154521, wednesday172301];
        var expected = 178660000;

        expect(domainMilliseconds(domain, fc.scale.discontinuity.identity())).toEqual(expected);
    });

    it('should return the correct time difference for days with skip weekends discontinuity', function() {
        var domain = [friday, monday2];
        var expected = 86400000;

        expect(domainMilliseconds(domain, skipWeekends())).toEqual(expected);
    });

    it('should return the correct time difference for more specific times with skip weekends discontinuity', function() {
        var domain = [wednesday172301, monday172301];
        var expected = 259200000;

        expect(domainMilliseconds(domain, skipWeekends())).toEqual(expected);
    });
});
