<template>
  <div>
    <h3 style="margin: 0 0 20px; font-size: 18px; color: #333;">评论管理</h3>
    <el-card shadow="never">
      <el-table :data="comments" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="articleId" label="文章" width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusType(scope.row.status)" size="small">
              {{ scope.row.status === 'approved' ? '已通过' : scope.row.status === 'pending' ? '待审核' : '已驳回' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status !== 'approved'"
              size="small"
              type="success"
              @click="approve(scope.row.id)"
            >
              通过
            </el-button>
            <el-button
              v-if="scope.row.status !== 'rejected'"
              size="small"
              type="warning"
              @click="reject(scope.row.id)"
            >
              驳回
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="remove(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchComments"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const comments = ref([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)

onMounted(fetchComments)

async function fetchComments() {
  loading.value = true
  try {
    const res = await request.get('/admin/comments', {
      params: { page: page.value, size: size.value }
    })
    comments.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function statusType(status) {
  return { approved: 'success', pending: 'info', rejected: 'danger' }[status] || 'info'
}

async function approve(id) {
  await request.put(`/admin/comments/${id}`, { status: 'approved' })
  ElMessage.success('已通过')
  fetchComments()
}

async function reject(id) {
  await request.put(`/admin/comments/${id}`, { status: 'rejected' })
  ElMessage.success('已驳回')
  fetchComments()
}

async function remove(id) {
  await ElMessageBox.confirm('确定删除该评论？')
  await request.delete(`/admin/comments/${id}`)
  ElMessage.success('已删除')
  fetchComments()
}
</script>
