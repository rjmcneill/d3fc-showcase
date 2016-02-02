import makeDatum from '../../helpers/makeDatum';
import moveToLatest from '../../../src/assets/js/util/domain/moveToLatest';

describe('util/domain/moveToLatest', function() {

    var data;
    var reversedData;
    var minimumVisiblePeriods = 5;
    var selectedPeriod = 86400;

    beforeEach(function() {
        data = [makeDatum(1437177600000), makeDatum(1454371200000)];
        reversedData = [data[1], data[0]];
    });

    it('should keep the extent size the same by default', function() {
        var extent = [new Date(2015, 7, 17), new Date(2015, 7, 25)];
        var expected = [new Date(2016, 0, 25), new Date(2016, 1, 2)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(moveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());

        var reversedMoveToLatestExtent = moveToLatest(reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());
    });

    it('should move the extent to end at the last data point if extent ends before the data', function() {
        var extent = [new Date(2015, 7, 17), new Date(2015, 7, 25)];
        var expected = [new Date(2016, 0, 25), new Date(2016, 1, 2)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(moveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());

        var reversedMoveToLatestExtent = moveToLatest(reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());
    });

    it('should move the extent to end at the last data point if extent ends after the data', function() {
        var extent = [new Date(2016, 7, 17), new Date(2016, 7, 25)];
        var expected = [new Date(2016, 0, 25), new Date(2016, 1, 2)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(moveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());

        var reversedMoveToLatestExtent = moveToLatest(reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());
    });

    it('should scale the extent in proportion to the inputted value', function() {
        var extent = [new Date(2015, 7, 17), new Date(2015, 9, 6)];
        var expected = [new Date(2016, 0, 23), new Date(2016, 1, 2)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(extent, data, minimumVisiblePeriods, selectedPeriod, 0.2);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(moveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());

        var reversedMoveToLatestExtent = moveToLatest(reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod, 0.2);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(expected[0].getTime());
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(expected[1].getTime());
    });

    it('should return the data extent if the domain extent is too large', function() {
        var extent = [new Date(2014, 7, 17), new Date(2016, 9, 6)];
        var expected = [makeDatum(1437177600000), makeDatum(1454371200000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(extent, data);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(1437177600000);
        expect(moveToLatestExtent[1].getTime()).toEqual(1454371200000);

        var reversedMoveToLatestExtent = moveToLatest(reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(1437177600000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(1454371200000);
    });

});
