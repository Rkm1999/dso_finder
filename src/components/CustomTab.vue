<!-- CustomTab.vue -->
<template>
  <div v-if="isActive">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'CustomTab',
  props: ['title'],
  inject: ['registerTab'],
  mounted() {
    this.registerTab(this);
  },
  computed: {
    isActive() {
      return this.$parent.activeTab === this.title;
    }
  }
};
</script>

<style scoped>
</style>
