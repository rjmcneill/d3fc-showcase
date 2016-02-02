import roundTimestampDown from '../../../src/assets/js/util/domain/roundTimestampDown';

describe('util/domain/roundTimestampDown', function() {
    var dayInSeconds = 86400;
    var hourInSeconds = 3600;

    it('should round the timestamp down to the nearest day', function() {
        var timestamp = 1453731563;         // Mon, 25 Jan 2016 14:19:23 GMT
        var expectedTimstamp = 1453680000;   // Mon, 25 Jan 2016 00:00:00 GMT

        var roundedTimestamp = roundTimestampDown(timestamp, dayInSeconds);

        expect(roundedTimestamp).toEqual(expectedTimstamp);
    });

    it('should round the timestamp down to the nearest hour', function() {
        var timestamp = 1453731563;         // Mon, 25 Jan 2016 14:19:23 GMT
        var expectedTimstamp = 1453730400;   // Mon, 25 Jan 2016 14:00:00 GMT

        var roundedTimestamp = roundTimestampDown(timestamp, hourInSeconds);

        expect(roundedTimestamp).toEqual(expectedTimstamp);
    });
});
