# lazy-store-loader
用于vue动态注册store模块的自定义块loader

### 问题背景

接手公司旧项目，大量模块用了`store`存储数据，导致`store`庞大且不能动态加载`chunk`文件，首屏加载了全部`store`代码。于是想通过`vuex`的注册模块方法实现动态注册，但是要手动写`import`，还要借助`mixin`，步骤繁琐。

  1. `store`所在代码`chunk`庞大，不能进一步分割和动态加载。
  2. 实现动态加载需要手动`import`并实现相关代码。

## 解决方案
借助[vue-loader 自定义块](https://vue-loader.vuejs.org/zh/guide/custom-blocks.html)，编译时生成相关代码。

## 快速使用

```javascript
npm install --save-dev lazy-store-loader
```
```javascript
// webpack.config.js
{
  module: {
    rules: [
      {
        resourceQuery: /blockType=foo/,
        loader: 'lazy-store-loader'
      }
    ]
  }
}
```
```vue
<!--Component.vue-->
<template>
</template>

<store path="xxx" url="@/store/module/xxx"/>

<script>
</script>
<style>
</style>
```
### v2
以上是v1.0.3的使用方式，v2以后采用代码静态分析，获取mapState,mapActions,mapMutations等store引用，获取使用到的模块，根据loader参数提供的映射文件获取路径实现动态加载。
