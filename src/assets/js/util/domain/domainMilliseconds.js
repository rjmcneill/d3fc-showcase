export default function(domain, discontinuityProvider) {
    return discontinuityProvider.distance(domain[0], domain[1]);
    // return domain[1].getTime() - domain[0].getTime();
}
