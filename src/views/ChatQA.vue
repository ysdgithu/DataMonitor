<template>
  <main-layout>
    <el-container style="height: 100%; overflow: hidden;">
      <el-aside width="200px" style="height: 100%; overflow-y: auto;" class="hide-scrollbar">
        <!-- 历史记录 -->
        <el-col class="history">
          <!-- 侧边栏头部小标题 -->
         <div style="padding: 10px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">问答历史记录</h3>
          <p class="small-title">最近与智能助手的对话记录</p>
          <el-divider />
         </div>
         <!-- 日期分组 -->
         <!-- 按日期分组渲染 -->
         <template v-for="date in ['today', 'yesterday', 'earlier']" :key="date">
          <p class="aside-small-title">{{ date === 'today' ? '今天' : date === 'yesterday' ? '昨天' : '更早' }}</p>
          <ul>
            <li v-for="item in historyList.filter(h => h.date === date)" :key="item.id">
            <p>{{ item.question }}</p>
            <p>{{ item.time }}</p>
            </li>
          </ul>
        </template>

        </el-col>
      </el-aside>
      <el-container style="display: flex; height: 100%; overflow: hidden;">
        <el-header height="100px">
          <h3>智能运维问答助手</h3>
          <p>基于RAG技术的工业设备智能诊断与问答系统</p>
        </el-header>
        <el-main :class="{ 'state-chat': !viweState, 'state-original': viweState }">
        <!-- 初始状态 -->
        <div v-if="viweState" class="original">
          <!-- 欢迎语 -->
          <div>
            <h2>有什么我能帮你的吗？</h2>
          </div>
          <!-- 猜你想了解 -->
          <div>
            <p class="small-title" style="margin: 20px 0;">猜你想了解：</p>
            <ul>
              <li>第一个想了解的问题？</li>
              <li>第二个想了解的问题wewq？</li>
              <li>第三个想了解的问题啥的嘎完成酒吧和技术？</li>
            </ul>
          </div>
        </div>
        <!-- 对话状态 -->
        <div v-else>
          <!-- 用户问题 -->
          <div style="display: flex; justify-content: flex-end;">
          <p class="user-q">111</p>
          </div>
          <!-- ai回答 -->
          <div class="ai-answer">
          <el-space direction="vertical" alignment="flex-start">
            <el-row class="search">
              <el-icon :size="14"><Search /></el-icon>
              <p>搜索：<span>资料a 资料b</span></p>
            </el-row>
            <!-- 问题回答 -->
            <p>这个问题答案是，先xxx后xxx</p>
            <!-- 引用链接 -->
            <div class="href">
              <p>参考来源：</p>
              <ul>
              <li>资料a</li>
               <li>资料b</li>
              </ul>
            </div>
            <!-- 小按钮等 -->
              <el-space >
                <el-icon color="#6f6f6f"><Refresh /></el-icon>
                <el-icon color="#6f6f6f"><CopyDocument /></el-icon>
              </el-space>
          </el-space>
          </div>
        </div>
        <!-- 输入框 -->
         <div class="input-wrapper">
           <el-input
          class="ai-input"
          placeholder="请输入您的问题"
          v-model="userQValue"
          @keyup.enter="handleUserQuestion">
          <template #suffix>
            <el-icon><Position /></el-icon>
          </template>
           </el-input>
         </div>
        </el-main>
      </el-container>
    </el-container>
  </main-layout>
</template>
<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import MainLayout from '../components/layout/MainLayout.vue'
import { Position, Search, Refresh, CopyDocument } from '@element-plus/icons-vue'
const circleUrl=ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')
// 初始态对话态切换
const viweState = ref(false)
// 历史记录数据
const historyList = ref([
  { id: 1, question: '历史问题1', time: '18:00', date: 'today' },
  { id: 2, question: '历史问题2', time: '17:00', date: 'today' },
  { id: 3, question: '历史问题3', time: '10:00', date: 'yesterday' },
  { id: 4, question: '历史问题4', time: '10:00', date: 'yesterday' },
  { id: 5, question: '历史问题1', time: '18:00', date: 'today' },
  { id: 6, question: '历史问题2', time: '17:00', date: 'today' },
  { id: 7, question: '历史问题3', time: '10:00', date: 'earlier' },
  { id: 8, question: '历史问题4', time: '10:00', date: 'earlier' },
])
// 按日期分组
// 下拉刷新
const handleScroll = (e: any) => {
  if (e.target.scrollTop === 0) {
    console.log('触发刷新')
    // 这里调用接口获取新数据
  }
}
// 用户输入
const userQValue = ref('')
//const userQ=ref('') // 回显
const handleUserQuestion = () => {
  console.log(userQValue.value)
  viweState.value = false
}


</script>
<style scoped>
  /* 公共卡片样式 */
  .card {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #f0f0f0;
  }
  /* 效果样式 */
  .hide-scrollbar::-webkit-scrollbar {
    width: 0;
  }
  .hide-scrollbar {
    scrollbar-width: none;
  }
  /* 私有样式 */
  .aside-header {
    height: 100px;
    background-color: #fafafa;
  }
  .history {
    background-color: #fff;
    margin: 10px;

  }
  .know {
    background-color: #fff;
    margin: 10px;
  }
  .history .aside-small-title {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
    margin: 10px;
  }
  .history ul {
    padding: 10px;
  }
  .history li {
    list-style: none;
    /* 想让撑满父元素宽度来着，但是没成功 */
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #f0f0f0;
    margin-bottom: 10px;

  }
  .history li p:last-child {
    font-size: 14px;
    color: #a8acb2;
    margin-left: 8px;
  }
  .el-header {
    background-color: #fff;
    padding: 20px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }
  .state-original {
    margin-right: 10px;
    margin-bottom: 10px;
    flex: 1;
    overflow: hidden;
    background-color: #fff;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 80px;
  }
  .state-chat {
    margin-right: 10px;
    margin-bottom: 10px;
    flex: 1;
    overflow-y: auto;
    background-color: #fff;
    position: relative;
    display: flex;
    flex-direction: column;
    padding-bottom: 80px;
  }
  .original {
    width: 500px;
    height: 400px;
  }
  .original ul {
    border-radius: 5px;
    border: 1px solid #f0f0f0;
  }
  .original li {
    height: 40px;
    background-color: #fafafa;
    border-radius: 5px;
    margin-bottom: 10px;
    padding: 10px;

  }
  .user-q {
    height: 50px;
    padding: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
    border: 1px solid #f0f0f0;
  }
  .ai-answer {
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #f0f0f0;
  }
  .ai-answer .search {
    height: 40px;
    width: 400px;
    padding: 10px;
    color: #6f6f6f;
    font-size: 16px;
    border-radius: 5px;
    background-color: #f6f6f6;
  }
  .ai-answer .search .el-icon{
    margin-right: 5px;
    margin-top: 5px;
  }
  .ai-answer .href {
    width: 300px;
    height: 200px;
    padding: 10px;
    border-radius: 5px;
    background-color: #f6f6f6;

  }
  .input-wrapper {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px;
  }
  .ai-input {
    width: 100%;
  }
  .small-title {
    font-size: 14px;
    color: #a8acb2;
    margin-right: 8px;
  }
</style>
