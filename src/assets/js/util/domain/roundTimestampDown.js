export default function(timeStamp, requiredRounding) {
    return timeStamp - (timeStamp % requiredRounding);
}
