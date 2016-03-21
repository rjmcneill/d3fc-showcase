export default function(number, requiredRounding) {
    return number - (number % requiredRounding) + requiredRounding;
}
