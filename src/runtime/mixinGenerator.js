// vuex的实现，兼容旧版本至3.1.1
function isRegistered(path) {
  const parent = this.get(path.slice(0, -1))
  const key = path[path.length - 1]

  return key in parent._children
}

function hasModule(path) {
  if (typeof path === 'string') path = [path]

  return isRegistered.call(this._modules, path)
}

export default function generate(path, module) {
  if (!path || !module) return {}

  module._refs = new Set()

  return {
    beforeCreate() {
      if (!this.$store) return console.info(`[lazy-store-mixin] missing $store`)

      try {
        if (!hasModule.call(this.$store, path)) {
          this.$store.registerModule(path, module)
        }

        module._refs.add(this)
      } catch (error) {
        console.log(`[lazy-store-mixin] ${error}`)
      }
    },
    beforeDestroy() {
      if (!this.$store) return console.info(`[lazy-store-mixin] missing $store`)

      try {
        module._refs.delete(this)

        if (!module._refs.size && hasModule.call(this.$store, path))
          this.$store.unregisterModule(module)
      } catch (error) {
        console.log(`[lazy-store-mixin] ${error}`)
      }
    },
  }
}
