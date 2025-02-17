// encapsulates the logic to decide the service and feathersId
module.exports = function getService (feathersApp, path) {
  const pathArray = path
    .replace(/^\//, '') // removes the first / character
    .split(/\//g)

  let feathersId = null
  let service = pathArray.join('/')
  if (!feathersApp.service(service)) {
    feathersId = pathArray.pop()
    if (!isNaN(feathersId)) {
      // Test for a number for ids that are numbers.
      feathersId = parseInt(feathersId)
    } else if (feathersId.match(/^["'].*["']$/)) {
      // For ids that are type string but look like numbers, a workaround is to quote them in the path.
      feathersId = feathersId.slice(1, -1) // Remove quotes from quoted path ids.
    }
    service = pathArray.join('/')
  }

  if (!feathersApp.service(service)) {
    service = null
    feathersId = null
  }

  return { service, feathersId }
}
