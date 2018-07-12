/**
 * Creates GeoJSON object for currently selected sites.
 * @param {array} sites Array of selected site objects.
 */
function toGeoJSON(sites) {
  let features = [];
  sites.forEach((site) => {
    features.push({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [site.lng, site.lat],
      },
      "properties": {
        "Type": site.type,
        "Organization": site.organization,
        "Name": site.name,
        "Site Number": site.siteNo,
        "Description": site.description,
        "Parameter Type": site.parameterType,
        "Parameter": site.parameter,
        "Frequency": site.frequency,
        "Publicly Available": site.publiclyAvailible,
        "Start Date": site.startDate,
        "End Date": site.endDate,
        "Contact URL": site.contactURL,
        "Quality": site.quality,
        "Email": site.email,
        "HUC8": site.huc8,
        "HUC10": site.huc10,
        "HUC12": site.huc12,
        "Latitude": site.lat,
        "Longitude": site.lng
      }
    });
  });

  return {
    "type": "FeatureCollection",
    "features": features
  }
}