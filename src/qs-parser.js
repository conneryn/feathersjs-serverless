
// Borrowed from express-query-parser

module.exports = function parse (target, options) {
  switch (typeof (target)) {
    case 'string':
      if (target === '') {
        return ''
      } else if (options.parseNull && target === 'null') {
        return null
      } else if (options.parseUndefined && target === 'undefined') {
        return undefined
      } else if (options.parseBoolean && (target === 'true' || target === 'false')) {
        return target === 'true'
      } else if (options.parseNumber && !isNaN(Number(target))) {
        return Number(target)
      } else {
        return target
      }
    case 'object':
      if (Array.isArray(target)) {
        return target.map(x => parse(x, options))
      } else {
        return Object.entries(target).reduce((acc, [key, value]) => {
          acc[key] = parse(value, options)
        }, {})
      }
    default:
      return target
  }
}
