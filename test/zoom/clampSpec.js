import clamp from '../../src/assets/js/behavior/zoom/clamp';

describe('behavior/zoom/clamp', function() {
    it('should return the correct value with 3 different integers', function() {
        var value = 3;
        var min = 5;
        var max = 10;

        expect(clamp(value, min, max)).toEqual(5);
    });

    it('should return the correct value with 2 different integers', function() {
        var value = 3;
        var min = 3;
        var max = 10;

        expect(clamp(value, min, max)).toEqual(3);
    });

    it('should return the correct value with 3 of the same integers', function() {
        var value = 5;
        var min = 5;
        var max = 5;

        expect(clamp(value, min, max)).toEqual(5);
    });

    it('should return the correct value with 3 different floats', function() {
        var value = 3.9;
        var min = 5.5;
        var max = 10.1;

        expect(clamp(value, min, max)).toEqual(5.5);
    });
});
