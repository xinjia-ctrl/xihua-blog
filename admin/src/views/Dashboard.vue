<template>
  <div>
    <h3 style="margin: 0 0 20px; font-size: 18px; color: #333;">仪表盘</h3>
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-card">
            <div class="stat-value">{{ overview.articleCount }}</div>
            <div class="stat-label">文章数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-card">
            <div class="stat-value">{{ overview.commentCount }}</div>
            <div class="stat-label">评论数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-card">
            <div class="stat-value">{{ overview.totalPV }}</div>
            <div class="stat-label">总访问量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-card">
            <div class="stat-value">{{ overview.totalUV }}</div>
            <div class="stat-label">访客数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const overview = ref({
  articleCount: 0,
  commentCount: 0,
  totalPV: 0,
  totalUV: 0
})

onMounted(async () => {
  try {
    const res = await request.get('/admin/stats/overview')
    overview.value = res.data
  } catch (e) {
    // handled by interceptor
  }
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 10px 0;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #146bb7;
}
.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}
</style>
