// vuex的实现，兼容旧版本至3.1.1
function isRegistered(path) {
  const parent = this.get(path.slice(0, -1))
  const key = path[path.length - 1]

  return key in parent._children
}

function hasModule(path) {
  return isRegistered.call(this._modules, path)
}

export default function generate(paths, modules) {
  // 初步处理
  for (let index = 0; index < modules.length; index++) {
    const module = modules[index]
    module._refs = new Set()
    module._path = paths[index].split('/')
    module.namespaced = true
  }

  return {
    beforeCreate() {
      if (!this.$store) return console.info(`[lazy-store-mixin] missing $store`)

      try {
        modules.forEach((module) => {
          if (!hasModule.call(this.$store, module._path)) {
            this.$store.registerModule(module._path, module)
          }

          module._refs.add(this)
        })
      } catch (error) {
        console.log(`[lazy-store-mixin] ${error}`)
      }
    },
    beforeDestroy() {
      if (!this.$store) return console.info(`[lazy-store-mixin] missing $store`)

      try {
        modules.forEach((module) => {
          if (!module.runtime) return

          module._refs.delete(this)

          if (!module._refs.size && hasModule.call(this.$store, module._path))
            this.$store.unregisterModule(module._path)
        })
      } catch (error) {
        console.log(`[lazy-store-mixin] ${error}`)
      }
    },
  }
}
