# lazy-store-loader

用于 vue 动态注册 store 模块的自定义块 loader

使用直接看下边的v2就好

### 问题背景

接手公司旧项目，大量模块用了`store`存储数据，导致`store`庞大且不能动态加载`chunk`文件，首屏加载了全部`store`代码。于是想通过`vuex`的注册模块方法实现动态注册，但是要手动写`import`，还要借助`mixin`，步骤繁琐。

1. `store`所在代码`chunk`庞大，不能进一步分割和动态加载。
2. 实现动态加载需要手动`import`并实现相关代码。

### 解决方案

借助[vue-loader 自定义块](https://vue-loader.vuejs.org/zh/guide/custom-blocks.html)，编译时生成相关代码。

### 快速使用

```javascript
npm install --save-dev lazy-store-loader@1.0.3
```

```javascript
// webpack.config.js
{
  module: {
    rules: [
      {
        resourceQuery: /blockType=foo/,
        loader: 'lazy-store-loader',
      },
    ]
  }
}
```

```vue
<!--Component.vue-->
<template></template>

<store path="xxx" url="@/store/module/xxx" />

<script></script>
<style></style>
```

### v2

以上是 v1.0.3 的使用方式，v2 以后采用代码静态分析，获取 mapState,mapActions,mapMutations 等 store 引用，获取使用到的模块，根据 loader 参数提供的映射文件获取路径实现动态加载。

```javascript
// webpack.config.js
  {
    module: {
      rules: [
        {
          resourceQuery: /vue&type=script/,
          loader: 'lazy-store-loader',
          options: {
            map: './src/store/map.json',
            log: true
          },
        },
      ],
    },
  }
```
```json
// map.json
{
  "test": "@/src/store/test"
}
```
```vue
// vue组件
export default {
  // ...
  methods: {
    ...mapActions('test', []),
    // ...
  }
}
```
loader会自动引入注册test模块
