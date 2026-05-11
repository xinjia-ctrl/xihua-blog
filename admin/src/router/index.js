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
  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
