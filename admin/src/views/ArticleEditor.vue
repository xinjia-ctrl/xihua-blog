<template>
  <div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <h3 style="margin:0;font-size:18px;color:#333;">{{ isEdit ? '编辑文章' : '写文章' }}</h3>
      <div style="display:flex;gap:10px;">
        <el-button @click="$router.push('/articles')">取消</el-button>
        <el-button type="primary" @click="saveArticle" :loading="saving">保存</el-button>
      </div>
    </div>

    <el-form label-position="top" style="max-width:100%;">
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <el-form-item label="标题" style="flex:1;min-width:300px;">
          <el-input v-model="form.title" placeholder="文章标题" @input="autoSlug" />
        </el-form-item>
        <el-form-item label="链接标识 (slug)" style="flex:1;min-width:200px;">
          <el-input v-model="form.slug" placeholder="article-slug" />
        </el-form-item>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <el-form-item label="分类" style="width:200px;">
          <el-input v-model="form.category" placeholder="分类" />
        </el-form-item>
        <el-form-item label="标签" style="flex:1;min-width:200px;">
          <el-input v-model="form.tags" placeholder="标签1,标签2" />
        </el-form-item>
        <el-form-item label="状态" style="width:150px;">
          <el-select v-model="form.status">
            <el-option label="发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="摘要">
        <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="文章摘要（可选）" />
      </el-form-item>
      <el-form-item label="内容 (Markdown)">
        <div style="display:flex;gap:16px;width:100%;">
          <textarea
            v-model="form.content"
            placeholder="在此编写 Markdown 内容..."
            style="flex:1;min-height:500px;padding:12px;border:1px solid #dcdfe6;border-radius:4px;font-family:Consolas,Menlo,monospace;font-size:14px;line-height:1.6;resize:vertical;outline:none;"
          ></textarea>
          <div
            class="markdown-preview"
            style="flex:1;min-height:500px;padding:12px;border:1px solid #dcdfe6;border-radius:4px;overflow-y:auto;background:#fff;line-height:1.8;font-size:14px;"
            v-html="previewHtml"
          ></div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const isEdit = ref(false)
const saving = ref(false)

const form = ref({
  title: '',
  slug: '',
  category: '',
  tags: '',
  summary: '',
  content: '',
  status: 'published'
})

const previewHtml = computed(() => {
  if (!form.value.content) return '<div style="color:#ccc;padding:40px;text-align:center;">预览区域</div>'
  try {
    return marked(form.value.content)
  } catch {
    return '<div style="color:#f56c6c;">渲染失败</div>'
  }
})

function autoSlug() {
  if (isEdit.value) return
  form.value.slug = form.value.title
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function saveArticle() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!form.value.slug.trim()) {
    ElMessage.warning('请输入链接标识')
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await request.put('/admin/articles/' + route.params.id, form.value)
      ElMessage.success('文章已更新')
    } else {
      await request.post('/admin/articles', form.value)
      ElMessage.success('文章已创建')
    }
    router.push('/articles')
  } catch (e) {
    // 错误已在拦截器中处理
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (route.params.id) {
    isEdit.value = true
    try {
      const res = await request.get('/admin/articles/' + route.params.id)
      form.value = res.data
    } catch {
      ElMessage.error('加载文章失败')
      router.push('/articles')
    }
  }
})
</script>

<style scoped>
.markdown-preview :deep(h1) { font-size: 1.6em; margin: 0.6em 0 0.3em; }
.markdown-preview :deep(h2) { font-size: 1.3em; margin: 0.5em 0 0.3em; }
.markdown-preview :deep(h3) { font-size: 1.1em; margin: 0.4em 0 0.2em; }
.markdown-preview :deep(p) { margin: 0.5em 0; }
.markdown-preview :deep(code) { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
.markdown-preview :deep(pre) { background: #f5f5f5; padding: 12px; overflow-x: auto; border-radius: 4px; }
.markdown-preview :deep(pre code) { background: none; padding: 0; }
.markdown-preview :deep(blockquote) { border-left: 3px solid #146bb7; padding-left: 12px; color: #666; margin: 0.5em 0; }
.markdown-preview :deep(img) { max-width: 100%; }
.markdown-preview :deep(table) { border-collapse: collapse; width: 100%; }
.markdown-preview :deep(th), .markdown-preview :deep(td) { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
.markdown-preview :deep(a) { color: #146bb7; }
</style>
