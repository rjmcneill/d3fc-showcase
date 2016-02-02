import roundTimestampUp from '../../../src/assets/js/util/domain/roundTimestampUp';

describe('util/domain/roundTimestampUp', function() {

    var dayInSeconds = 86400;
    var hourInSeconds = 3600;

    it('should round the timestamp up to the nearest day', function() {
        var timestamp = 1453731563;         // Mon, 25 Jan 2016 14:19:23 GMT
        var expectedTimstamp = 1453766400;   // Mon, 26 Jan 2016 00:00:00 GMT

        var roundedTimestamp = roundTimestampUp(timestamp, dayInSeconds);

        expect(roundedTimestamp).toEqual(expectedTimstamp);
    });

    it('should round the timestamp up to the nearest hour', function() {
        var timestamp = 1453731563;         // Mon, 25 Jan 2016 14:19:23 GMT
        var expectedTimstamp = 1453734000;   // Mon, 25 Jan 2016 15:00:00 GMT

        var roundedTimestamp = roundTimestampUp(timestamp, hourInSeconds);

        expect(roundedTimestamp).toEqual(expectedTimstamp);
    });
});
