<template>
  <el-input
  v-model="searchValue"
  :placeholder="placeholder"
  class="search-input"
  >
    <template #suffix>
      <el-icon>
        <Search />
      </el-icon>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { ref } from 'vue'

// 定义接收的属性
defineProps({
  placeholder: {
    type: String,
    default: '请输入搜索内容'
  }
})

const searchValue = ref('')

</script>

<style scoped>
.search-input {
  width: 100%;
  height: 30px;
}

</style>
