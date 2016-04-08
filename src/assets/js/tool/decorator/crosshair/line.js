export default function(crosshairSelection) {
    crosshairSelection.classed('band', false)
        .selectAll('line')
        .style('stroke-width', null);
}
