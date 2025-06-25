<template>
  <el-container class="layout-container">
    <!-- <el-aside style="background-color: #1A2333; color: #E5E7EB;"></el-aside> -->
    <app-sidebar style="background-color: #1A2333; color: #E5E7EB;"/>
    <el-container>
      <el-header style="background-color: #1A2333;"><app-header /> </el-header>
      <dashboard-main />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import AppHeader from '../components/layout/AppHeader.vue'
import AppSidebar from '../components/layout/AppSidebar.vue'
import DashboardMain from '../components/dashboard/DashboardMain.vue'
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}
</style>
