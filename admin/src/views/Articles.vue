<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <h3 style="margin:0;font-size:18px;color:#333;">文章管理</h3>
      <div style="display:flex;gap:10px;">
        <el-button @click="handleRegenerate" :loading="regenerating">重新生成</el-button>
        <el-button type="primary" @click="$router.push('/articles/new')">写文章</el-button>
      </div>
    </div>
    <el-card shadow="never">
      <el-table :data="articles" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="250" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'published' ? 'success' : 'info'" size="small">
              {{ scope.row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="170">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="$router.push('/articles/' + scope.row.id + '/edit')">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchArticles"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const articles = ref([])
const loading = ref(false)
const regenerating = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)

onMounted(fetchArticles)

async function fetchArticles() {
  loading.value = true
  try {
    const res = await request.get('/admin/articles', {
      params: { page: page.value, size: size.value }
    })
    articles.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

async function handleRegenerate() {
  regenerating.value = true
  try {
    await request.post('/admin/articles/regenerate')
    ElMessage.success('已重新生成')
  } catch {
    // 错误已在拦截器中处理
  } finally {
    regenerating.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除「' + row.title + '」吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await request.delete('/admin/articles/' + row.id)
    ElMessage.success('已删除')
    fetchArticles()
  } catch {
    // 取消则不操作
  }
}
</script>
