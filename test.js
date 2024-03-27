const loader = require('./src/index')

console.log(match(`<template>
<div class="aside-tree-panel">
  <div class="aside-tree__top">
    <el-tabs
      v-model="category"
      stretch
      :before-leave="beforeChangeTab"
      class="jqb-stretch-tabs">
      <el-tab-pane
        :label="$t('community.radio.unit')"
        :name="unitKey.UNIT"/>
      <el-tab-pane
        :label="$t('community.radio.parking')"
        :name="unitKey.PARKING"/>
      <el-tab-pane
        :label="$t('community.radio.custom')"
        :name="unitKey.CUSTOM"/>
    </el-tabs>
    <div class="aside-tree__top__input mt10">
      <el-input
        ref="searchInput"
        v-model="searchText"
        :placeholder="searchPlaceholder"
        @keydown.native.enter="handleFilter">
        <i slot="suffix"
           class="el-input__icon el-icon-search"
           @click="handleFilter"/>
      </el-input>
    </div>
  </div>
  <div class="aside-tree__content mt20">
    <!-- category=custom时，显示，其余时候不显示。 -->
    <div v-show="category === unitKey.CUSTOM"
         class="aside-tree__content__list">
      <el-row class="aside-tree__content__list__header ">
        <el-col :span="9"
                class="panel-text pl10">
          {{ $t('community.title.name') }}
        </el-col>
        <el-col :span="15"
                class="panel-text pl5 pr5">
          {{ $t('community.title.housingUnit') }}
        </el-col>
      </el-row>
      <!-- 循环显示获取的数据，获取每一个客户的名字name和房屋unit-->
      <div ref="customContent"
           class="aside-tree__content__list__body">
        <el-scrollbar ref="elscrollbar"
                      class="lf-scrollbar">
          <el-row v-for="(item,index) in userList "
                  :key="index"
                  class="body__item">
            <el-col :span="9"
                    class="panel-text pl10"
                    :class="residentNameClick ? 'body__item__text' : 'body__item__text--disable'">
              <!-- 点击用户名 -->
              <a @click="handleCustomName(item)">{{ item.name }}</a>
            </el-col>
            <el-col :span="15"
                    class="body__item__text panel-text pl5 pr15">
              <!-- 点击居住单位 -->
              <a @click="handleCustomUnit(item)">{{ item.unitName }}</a>
            </el-col>
          </el-row>
          <el-row
            v-if="userList.length === 0&&!loadingAnimate && !isSearchCustom"
            class="body--tip">
            <span class="panel-text">{{ $t('tips.noRecord') }}</span>
          </el-row>
          <!-- 锚点 -->
          <a ref="anchor" class="cmaAside-custom-anchor"/>
          <el-row v-if="isLoadingCustom" class="body--tip">
            <img :src="loadingAnimate">
          </el-row>
        </el-scrollbar>
      </div>
    </div>
    <!-- 当category为车位或者单位时，显示 -->
    <el-scrollbar
      v-show="category !== unitKey.CUSTOM"
      ref="scrollbarTree"
      class="lf-scrollbar">
      <el-tree
        ref="tree"
        class="common-el-tree"
        style="padding: 0 20px;"
        icon-class="el-icon-arrow-right"
        :indent="25"
        node-key="key"
        :empty-text="$t('tips.noRecord')"
        :default-expanded-keys="expandedList"
        :data="treeData"
        :highlight-current="true"
        @node-click="handleNodeClick">
        <span
          slot-scope="{ node, data }"
          class="tree-node">
          <span>{{ node.label }}</span>
          <svg-icon
            v-if="node.isLeaf && unitStatusIcon"
            class="svg-icon"
            :icon-class="UNIT_STATUS_ICONS[data.unitStatusCode]"/>
        </span>
      </el-tree>
    </el-scrollbar>
  </div>
</div>
</template>
<script>
import i18n from '@/i18n';
import ElementUIUtil from '@/utils/ElementUIUtil.js';
import { UNIT_KEY } from '@/enum/types/unitEnums.js';
import { mapActions, mapMutations } from 'vuex';

export default {
name: 'AsideTreePanel',
props: {
  // radio 类型
  radioCategory: {
    type: String,
  },
  // 选中的节点
  treeKey: {
    default: '',
    type: String,
  },
  // 是否点击叶子节点才emit事件
  isLeaf: {
    type: Boolean,
    default: true,
  },
  // 编辑状态
  editing: {
    type: Boolean,
    default: false,
  },
  // 控制显示的单选按钮
  showRadios: {
    type: Object,
    default: () => {
      return {
        unit: true,
        parking: true,
        resident: true,
      };
    },
  },
  // 控制客户姓名能否点击以及客户姓名样式
  residentNameClick: {
    type: Boolean,
    default: false,
  },
  // 是否显示单位状态的icon
  unitStatusIcon: {
    type: Boolean,
    default: false,
  },
  permission: {
    type: Object,
    default: () => {
      return {
        page: '',
        action: '',
      };
    },
  },
},
data() {
  return {
    // 树类型枚举对象
    unitKey: {},
    // 当前选中节点
    currentKey: '',
    // 当前选中的和记录已选中的radio 类型
    category: '',
    // 树默认展开
    expandedList: [],
    // 树结构
    treeData: [],
    // 客户列表
    userList: [],
    // 所有客户列表
    allUserlist: [],
    // 按照搜索条件过滤后的客户列表
    filterUserList: [],
    // 懒加载变量
    currentCustomPage: 0,
    currentCustomPageSize: 40,
    // 单位状态对应的icon枚举
    UNIT_STATUS_ICONS: {
      UNITS01: 'house-Non-repossessi',
      UNITS02: 'house-rent-out',
      UNITS03: 'house-self',
    },
    // 搜索内容
    searchText: '',
    // 是否在搜索客戶
    isLoadingCustom: false,
    // loading动画
    loadingAnimate: require('@/assets/dataLoading/loding_@1.gif'),
    isSearchCustom: false,
    scrollHandler: null,
  };
},
computed: {
  searchPlaceholder() {
    switch (this.category) {
      case this.unitKey.UNIT:
        return this.$t('community.placeholder.unitSearch');
      case this.unitKey.PARKING:
        return this.$t('community.placeholder.parkingSearch');
      case this.unitKey.CUSTOM:
        return this.$t('community.placeholder.customSearch');
    }
    return '';
  },
},
watch: {
  // radilo 类型双向绑定
  radioCategory(val) {
    this.category = val;
  },
  category(val) {
    this.$emit('update:radioCategory', val);
  },
  // 选中节点双向绑定
  treeKey(key) {
    this.currentKey = key;
  },
  currentKey(key) {
    this.$emit('update:treeKey', key);
  },
},
activated() {
  setTimeout(() => {
    if (this.$refs.elscrollbar && this.$refs.elscrollbar.wrap) {
      this.$refs.elscrollbar.wrap.scrollTop = 0;
    }
  }, 100);
},
deactivated() {
  setTimeout(() => {
    if (this.$refs.elscrollbar && this.$refs.elscrollbar.wrap) {
      this.$refs.elscrollbar.wrap.scrollTop = 0;
    }
    if (this.$refs.scrollbarTree && this.$refs.scrollbarTree.wrap) {
      this.$refs.scrollbarTree.wrap.scrollTop = 0;
    }
  }, 100);
},
created() {
  this.unitKey = UNIT_KEY;
  this.init();
  this.initData();
},
mounted() {
  const that = this;
  this.$refs.searchInput && this.$refs.searchInput.focus();
  const scrollContent = this.$refs['elscrollbar'];
  const scrollWrap = scrollContent && scrollContent.$refs['wrap'];
  const anchor = this.$refs.anchor;
  // 挂载懒加载
  const scrollHandler = () => {
    const distance =
        anchor.offsetTop -
        scrollWrap.scrollTop -
        212 -
        scrollWrap.clientHeight;
    if (distance < 200) {
      that.getCurrentList();
    }
  };
  this.scrollHandler = scrollHandler;
  // 挂载懒加载
  if (scrollWrap) {
    scrollWrap.addEventListener('scroll', scrollHandler);
  }
},
methods: {
  ...mapMutations(['setEditStatus']),
  ...mapActions(['getTreeList']),
  ...mapActions('unituser', ['findUserList']),
  ...mapActions('infoquery', ['filterTree']),
  // 初始化
  init() {
    if (!this.radioCategory) return;
    this.category = this.radioCategory;
    this.getList();
  },
  initData() {
    // 全局编辑状态为false
    this.searchText = '';
    this.setEditStatus(false);
    this.currentCustomPage = 0;
    this.userList = [];
  },
  // 获取客户或者是单位车位树
  getTreeOrList() {
    if (this.category !== this.unitKey.CUSTOM) {
      this.getList();
    } else {
      // this.getCustom()
    }
  },
  // 获取树
  async getList() {
    try {
      let temp = await this.getTreeList(this.category);
      temp = temp.tree;
      this.treeData = Object.freeze(temp[0].children);
      this.expandedList = [];
      if (this.currentKey) {
        this.expandedList.push(this.currentKey);
        this.$nextTick(() => {
          this.$refs.tree && this.$refs.tree.setCurrentKey(this.currentKey);
        });
      } else {
        this.expandedList.push(temp[0].key);
      }
    } catch (err) {
      this.treeData = [];
    }
  },
  // 获取客户单位列表
  async getCustom() {
    if (this.isLoadingCustom) {
      return;
    }
    try {
      this.isLoadingCustom = true;
      this.isSearchCustom = true;
      this.userList = [];
      this.currentCustomPage = 0;
      const res = await this.findUserList(this.searchText);
      this.allUserlist = res;
      this.filterUserList = res;
      this.getCurrentList();
    } catch (err) {
      this.userList = [];
      this.allUserlist = [];
      this.filterUserList = [];
    } finally {
      this.isLoadingCustom = false;
      this.allUserlist = this.allUserlist || [];
    }
  },
  getCurrentList() {
    const start = this.currentCustomPage * this.currentCustomPageSize;
    this.currentCustomPage++;
    let end = this.currentCustomPage * this.currentCustomPageSize;
    if (end > this.filterUserList.length) end = this.filterUserList.length;
    for (let i = start; i < end; i++) {
      this.userList.push(this.filterUserList[i]);
    }
  },
  // 搜索
  async handleFilter() {
    if (this.searchText.trim() === '') {
      this.resetFilter();
      return;
    }
    if (this.category !== this.unitKey.CUSTOM) {
      const params = {
        type: this.category,
        text: this.searchText,
      };
      const tree = await this.filterTree(params);
      if (tree.list[0].length === 0) {
        this.treeData = [];
        this.expandedList = [];
      } else {
        this.treeData = tree.list[0].children;
        this.expandedList = tree.ids;
      }
    } else {
      // 获取客户列表
      this.getCustom();
    }
  },
  // 重置
  resetFilter() {
    this.initData();
    if (this.category !== this.unitKey.CUSTOM) {
      this.expandedList = [];
      this.getList();
    } else {
      this.getCustom();
    }
  },
  // 点击客户楼房事件
  async handleCustomUnit(user) {
    this.checkEditing(
      () => {
        this.$emit('handle-custom-unit', user);
      });
  },
  // 点击客户姓名事件 因为客户事件存在查看权限，所以编辑状态判断放在父组件进行（权限判断优先于编辑状态）
  handleCustomName(user) {
    // residentNameClick ->是否能点击客户
    if (!this.residentNameClick) return;
    this.$emit('handle-custom-name', user);
  },
  // 点击单位树事件 变化currenId 获取房屋信息
  handleNodeClick(data, node, self) {
    if (data.key === this.currentKey) return;
    // 点击叶子节点或者isLeaf为true时
    if (!this.isLeaf || node.isLeaf) {
      this.checkEditing(() => {
        this.$emit('handle-node-click', data);
      });
    }
  },
  beforeChangeTab(act, old) {
    if (this.editing) {
      ElementUIUtil.confirmBox({ message: i18n.t('infoQuery.tips.promptBoxGetAway') + '?' },
        () => {
          this.handleCateGoryChange(act);
        },
        () => {
          this.$message({ type: 'info', message: i18n.t('infoQuery.tips.messageCancel') });
        });
      return false;
    }
    this.handleCateGoryChange(act);
    return true;
  },
  handleCateGoryChange(val) {
    this.category = val;
    this.$refs.searchInput && this.$refs.searchInput.focus();
    this.isSearchCustom = false;
    // 重置选中节点
    this.currentKey = '';
    // 重置数据和状态
    this.initData();
    // 获取单位or车位树或者客户列表
    this.getTreeOrList();
    this.$emit('update:radioCategory', val);
    this.$emit('handle-category');
  },
  // // 点击radio
  // handleCategory () {
  //   if (this.editing) {
  //     return
  //   }
  //   this.handleCateGoryChange();
  // },
  // 执行事件时编辑状态
  checkEditing(onSuccess, onError = () => {
  }) {
    if (this.editing) {
      ElementUIUtil.confirmBox({ message: i18n.t('infoQuery.tips.promptBoxGetAway') + '?' },
        () => {
          onSuccess();
        },
        () => {
          this.$message({ type: 'info', message: i18n.t('infoQuery.tips.messageCancel') });
          onError();
        });
    } else {
      onSuccess();
    }
  },
},
destroy() {
  const scrollContent = this.$refs['elscrollbar'];
  const scrollWrap = scrollContent && scrollContent.$refs['wrap'];
  if (scrollWrap) {
    scrollWrap.removeEventListener('scroll', this.scrollHandler);
  }
},
};
</script>
<style lang="scss">
@import "styles/index.scss";
</style>
`))