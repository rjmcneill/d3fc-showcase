import fc from 'd3fc';
import makeDatum from '../../helpers/makeDatum';
import moveToLatest from '../../../src/assets/js/util/domain/moveToLatest';
import skipWeekends from '../../../src/assets/js/scale/discontinuity/skipWeekends';

describe('util/domain/moveToLatest', function() {

    var data;
    var reversedData;
    var minimumVisiblePeriods = 0;
    var selectedPeriod = 86400;

    var friday = new Date(2015, 7, 14);
    var saturday = new Date(2015, 7, 15);
    var sunday = new Date(2015, 7, 16);
    var monday = new Date(2015, 7, 17);
    var tuesday = new Date(2015, 7, 18);
    var wednesday = new Date(2015, 7, 19);
    var thursday = new Date(2015, 7, 20);
    var friday2 = new Date(2015, 7, 21);

    beforeEach(function() {
        data = [makeDatum(1000), makeDatum(10000)];
        reversedData = [data[1], data[0]];
    });

    it('should keep the extent size the same by default with identity discontinuity', function() {
        var extent = [new Date(1000), new Date(6000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(5000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(5000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should move the extent to end at the last data point if extent ends before the data with identity discontinuity', function() {
        var extent = [new Date(1000), new Date(6000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(5000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(5000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should move the extent to end at the last data point if extent ends after the data with identity discontinuity', function() {
        var extent = [new Date(11000), new Date(16000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(5000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(5000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should scale the extent in proportion to the inputted value with identity discontinuity', function() {
        var extent = [new Date(1000), new Date(6000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), extent, data, minimumVisiblePeriods, selectedPeriod, 0.2);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(9000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod, 0.2);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(9000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should return the data extent if the domain extent is too large with identity discontinuity', function() {
        var extent = [new Date(1000), new Date(20000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(1000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(1000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should return weekend data if applicable with identity discontinuity', function() {
        var extent = [saturday, tuesday];
        var reversedExtent = [tuesday, saturday];
        data = [{ date: saturday }, { date: wednesday }];
        reversedData = [{ date: saturday }, { date: wednesday }];

        var moveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0]).toEqual(sunday);
        expect(moveToLatestExtent[1]).toEqual(wednesday);

        var reversedMoveToLatestExtent = moveToLatest(fc.scale.discontinuity.identity(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0]).toEqual(sunday);
        expect(reversedMoveToLatestExtent[1]).toEqual(wednesday);
    });

    it('should keep the extent size the same by default with skip weekends discontinuity', function() {
        var extent = [new Date(1000), new Date(6000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(5000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(5000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should move the extent to end at the last data point if extent ends before the data with skip weekends discontinuity', function() {
        var extent = [new Date(1000), new Date(6000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(5000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(5000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should move the extent to end at the last data point if extent ends after the data with skip weekends discontinuity', function() {
        var extent = [new Date(11000), new Date(16000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(5000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(5000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should scale the extent in proportion to the inputted value with skip weekends discontinuity', function() {
        var extent = [new Date(1000), new Date(6000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod, 0.2);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(9000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod, 0.2);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(9000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should return the data extent if the domain extent is too large with skip weekends discontinuity', function() {
        var extent = [new Date(1000), new Date(20000)];
        var reversedExtent = [extent[1], extent[0]];

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0].getTime()).toEqual(1000);
        expect(moveToLatestExtent[1].getTime()).toEqual(10000);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0].getTime()).toEqual(1000);
        expect(reversedMoveToLatestExtent[1].getTime()).toEqual(10000);
    });

    it('should not return weekend data if applicable with skip weekends discontinuity', function() {
        var extent = [saturday, tuesday];
        var reversedExtent = [tuesday, saturday];
        data = [{ date: saturday }, { date: wednesday }];
        reversedData = [{ date: saturday }, { date: wednesday }];

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0]).toEqual(tuesday);
        expect(moveToLatestExtent[1]).toEqual(wednesday);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0]).toEqual(tuesday);
        expect(reversedMoveToLatestExtent[1]).toEqual(wednesday);
    });

    it('should limit the zoom correctly with skip weekends discontinuity when not crossing weekends', function() {
        var extent = [wednesday, friday2];
        var reversedExtent = [friday2, wednesday];
        data = [{ date: monday }, { date: friday2 }];
        reversedData = [{ date: friday2 }, { date: monday }];
        minimumVisiblePeriods = 3;

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0]).toEqual(tuesday);
        expect(moveToLatestExtent[1]).toEqual(friday2);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0]).toEqual(tuesday);
        expect(reversedMoveToLatestExtent[1]).toEqual(friday2);
    });

    it('should limit the zoom correctly with skip weekends discontinuity when crossing weekends', function() {
        var extent = [friday, wednesday];
        var reversedExtent = [wednesday, friday];
        data = [{ date: friday }, { date: wednesday }];
        reversedData = [{ date: wednesday }, { date: friday }];
        minimumVisiblePeriods = 3;

        var moveToLatestExtent = moveToLatest(skipWeekends(), extent, data, minimumVisiblePeriods, selectedPeriod);

        expect(moveToLatestExtent.length).toEqual(extent.length);
        expect(moveToLatestExtent[0]).toEqual(friday);
        expect(moveToLatestExtent[1]).toEqual(wednesday);

        var reversedMoveToLatestExtent = moveToLatest(skipWeekends(), reversedExtent, reversedData, minimumVisiblePeriods, selectedPeriod);

        expect(reversedMoveToLatestExtent.length).toEqual(reversedExtent.length);
        expect(reversedMoveToLatestExtent[0]).toEqual(friday);
        expect(reversedMoveToLatestExtent[1]).toEqual(wednesday);
    });
});
