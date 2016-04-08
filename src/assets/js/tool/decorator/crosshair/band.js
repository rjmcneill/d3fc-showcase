export default function(crosshairSelection, width) {
    crosshairSelection.classed('band', true);

    crosshairSelection.selectAll('.vertical > line')
      .style('stroke-width', width);
}
