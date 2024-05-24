<template>
  <div :class="['tabs', { dark: darkMode }]">
    <div class="tab-titles">
      <button
        v-for="tab in tabs"
        :key="tab.title"
        :class="{ active: tab.title === activeTab, dark: darkMode }"
        @click="selectTab(tab.title)"
      >
        {{ tab.title }}
      </button>
    </div>
    <div class="tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomTabs',
  props: ['darkMode'],
  data() {
    return {
      tabs: [],
      activeTab: null
    };
  },
  methods: {
    selectTab(title) {
      this.activeTab = title;
    },
    registerTab(tab) {
      this.tabs.push(tab);
      if (!this.activeTab) {
        this.activeTab = tab.title;
      }
    }
  },
  provide() {
    return {
      registerTab: this.registerTab
    };
  }
};
</script>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
}
.tabs.dark {
  background-color: #000;
  color: #ff0000;
}
.tab-titles {
  display: flex;
}
.tab-titles button {
  padding: 10px;
  cursor: pointer;
  background: none;
  border: none;
}
.tab-titles button.active {
  font-weight: bold;
  border-bottom: 2px solid;
  color: #007BFF;
}
.tab-titles button.dark {
  background-color: #000;
  color: #ff0000;
}
.tab-content {
  margin-top: 10px;
}
</style>
