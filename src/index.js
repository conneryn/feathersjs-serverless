const Proto = require('uberproto')
const qs = require('qs')

const getService = require('./get-service')
const getArgs = require('./get-args')
const { getFeathersMethod } = require('./methods')

module.exports = feathersApp => {
  const mixin = {
    set (key, value) {
      if (!this.variables) {
        this.variables = {}
      }

      Object.assign(this.variables, {
        [key]: value
      })

      return this
    },

    get (key) {
      return this.variables[key]
    },

    setup (func) {
      this.setupFunc = func
      return this
    },

    handler () {
      const self = this
      self.emit('handlerstarted')
      return async (event, context, cb) => {
        if (!self.setupPromise) {
          self.setupPromise = (typeof self.setupFunc === 'function')
            ? self.setupFunc(self)
            : Promise.resolve()
        }

        await self.setupPromise

        const {
          resource,
          path: basePath,
          rawPath,
          httpMethod: baseMethod,
          body: bodyAsString,
          requestContext,
          rawQueryString,
          queryStringParameters
        } = event

        const path = resource || basePath || rawPath || requestContext?.http?.path
        const method = baseMethod || requestContext?.http?.method

        const query = rawQueryString
          ? qs.parse(rawQueryString)
          : queryStringParameters || {}

        const body = bodyAsString
          ? JSON.parse(bodyAsString)
          : {}

        const { service: serviceName, feathersId } = getService(self, path)

        if (!serviceName || !self.service(serviceName)) {
          return cb(null, {
            statusCode: 404,
            body: JSON.stringify({ error: `Service not found: ${resource}` })
          })
        }

        const service = self.service(serviceName)
        const feathersMethod = getFeathersMethod(method, feathersId)

        if (!feathersMethod || !service[feathersMethod]) {
          return cb(null, {
            statusCode: 404,
            body: JSON.stringify({ error: `Method not allowed: ${method}` })
          })
        }

        const args = getArgs(feathersMethod, { query, feathersId, body })
        return service[feathersMethod](...args)
          .then(data => {
            return cb(null, {
              body: JSON.stringify({ data })
            })
          })
          .catch(e => {
            return cb(null, {
              statusCode: e.code || 500,
              body: JSON.stringify({ error: e.message })
            })
          })
      }
    }
  }

  return Proto.mixin(mixin, feathersApp)
}
