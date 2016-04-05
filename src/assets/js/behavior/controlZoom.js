export default function(zoomExtent) {
    // If zooming, and about to pan off screen, do nothing
    return (zoomExtent[0] > 0 && zoomExtent[1] < 0);
}
