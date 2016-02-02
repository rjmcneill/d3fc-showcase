import domainMilliseconds from '../../../src/assets/js/util/domain/domainMilliseconds';

describe('util/domain/domainMilliseconds', function() {

    var monday = new Date(2015, 7, 17);
    var friday = new Date(2015, 7, 21);

    var monday154521 = new Date(2015, 7, 17, 15, 45, 21);
    var wednesday172301 = new Date(2015, 7, 19, 17, 23, 1);

    it('should return the correct time difference for days', function() {
        var domain = [monday, friday];
        var expected = 345600000;

        expect(domainMilliseconds(domain)).toEqual(expected);
    });

    it('should return the correct time difference for more specific times', function() {
        var domain = [monday154521, wednesday172301];
        var expected = 178660000;

        expect(domainMilliseconds(domain)).toEqual(expected);
    });
});
