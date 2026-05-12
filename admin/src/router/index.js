import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Comments from '../views/Comments.vue'
import Articles from '../views/Articles.vue'
import ArticleEditor from '../views/ArticleEditor.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'comments', name: 'Comments', component: Comments },
      { path: 'articles', name: 'Articles', component: Articles },
      { path: 'articles/new', name: 'ArticleNew', component: ArticleEditor },
      { path: 'articles/:id/edit', name: 'ArticleEdit', component: ArticleEditor }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const clearAndGoLogin = (msg) => {
    localStorage.removeItem('token')
    next({ name: 'Login', query: msg ? { msg } : {} })
  }

  if (!token) {
    if (to.name !== 'Login') {
      next({ name: 'Login' })
    } else {
      next()
    }
    return
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // 检查 token 是否过期
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      clearAndGoLogin('登录已过期，请重新登录')
      return
    }
    if (payload.role !== 'ADMIN') {
      clearAndGoLogin('无权访问管理后台')
      return
    }
  } catch {
    clearAndGoLogin()
    return
  }

  if (to.name === 'Login') {
    next({ path: '/dashboard' })
  } else {
    next()
  }
})

export default router
