# 溪花博客

个人技术博客，基于 Hexo + Butterfly 构建前端展示，Spring Boot 3 提供 REST API，Vue 3 管理后台。

## 系统架构

```
用户请求
    │
    ▼
Nginx (反向代理)
  ├── /           → Hexo 静态博客（前端展示，Cenote 极简风格）
  ├── /api/*      → Spring Boot REST API（评论、认证、管理）
  └── /admin/*    → Vue 3 管理后台 SPA（文章编辑、评论管理、统计）
```

| 层 | 技术 | 说明 |
|---|---|---|
| 反向代理 | Nginx | 路由分发，静态资源服务 |
| 前端展示 | Hexo + Butterfly | 静态博客，Cenote 风格 |
| 后端 API | Spring Boot 3 + MyBatis-Plus | REST API |
| 数据库 | H2（开发）/ MySQL 8（生产） | 文件数据库 / Docker |
| 认证 | Spring Security + JWT | 无状态登录 |
| 管理后台 | Vue 3 + Vite + Element Plus | 在线 Markdown 编辑器 |

## 功能特性

- Cenote 风格极简博客展示（三列网格、无封面、文字优先）
- 自定义评论系统（自建后端，登录后才能评论，支持审核管理）
- 导航栏登录/注册（模态弹窗，全站通用）
- 管理后台（数据统计、评论管理、文章在线编辑）
- Markdown 在线编辑器（左右分栏实时预览）
- 深色/亮色模式切换
- 标签与分类管理
- 全文搜索
- RSS 订阅

## 快速开始

### 环境要求

- Node.js 18+
- JDK 17+
- Maven 3.8+
- MySQL 8.0+（生产环境，开发使用 H2）

### 安装

```bash
git clone https://github.com/xinjia-ctrl/xihua-blog.git
cd xihua-blog
npm install
```

### 本地开发

#### 启动博客前端

```bash
npx hexo server -p 4001
```

访问 `http://localhost:4001` 查看博客。

#### 启动后端 API

```bash
cd backend
mvn spring-boot:run
```

API 运行在 `http://localhost:8080`。
开发环境使用 H2 文件数据库，自动建表并初始化管理员账号。

#### 启动管理后台

```bash
cd admin
npm install
npm run dev
```

管理后台运行在 `http://localhost:5173/admin/`。

**默认管理员账号**：`admin` / `admin123`

### 写文章

**方式一：管理后台在线编辑（推荐）**
1. 打开 `http://localhost:5173/admin/` 登录
2. 进入「文章管理」→ 点击「写文章」
3. 输入标题、分类、标签，用 Markdown 编写内容（右侧实时预览）
4. 保存后，点击「重新生成」即可在博客上看到新文章

**方式二：本地 Markdown 文件**
```bash
npx hexo new "文章标题"
npx hexo generate
```

### 构建生产版本

```bash
# 构建 Hexo 静态文件
npx hexo generate

# 构建 Spring Boot 后端
cd backend && mvn package -DskipTests

# 构建 Vue 管理后台
cd admin && npm run build
```

## 项目结构

```
├── _config.yml              # Hexo 站点配置
├── _config.butterfly.yml    # Butterfly 主题配置
├── nginx.conf               # Nginx 反向代理配置
├── scaffolds/               # 文章模板
├── source/                  # Hexo 源文件
│   ├── _posts/              # 文章 Markdown 文件
│   ├── js/comment.js        # 自定义评论组件
│   └── css/comment.css      # 评论样式
├── backend/                 # Spring Boot 后端
│   ├── src/main/java/com/xihua/blog/
│   │   ├── config/          # 安全、CORS、JWT、MyBatis-Plus 配置
│   │   ├── controller/      # REST 控制器
│   │   ├── service/         # 业务逻辑层
│   │   ├── mapper/          # MyBatis-Plus Mapper
│   │   ├── entity/          # 数据库实体
│   │   ├── dto/             # 请求/响应 DTO
│   │   └── common/          # 统一返回体、异常处理、JWT 工具
│   └── pom.xml
├── admin/                   # Vue 3 管理后台
│   ├── src/
│   │   ├── views/           # 页面组件（Dashboard, Comments, Articles, ArticleEditor, Login）
│   │   ├── components/      # 布局组件（AdminLayout）
│   │   ├── router/          # 路由配置 + 守卫
│   │   ├── stores/          # Pinia 状态管理
│   │   └── utils/           # Axios HTTP 封装
│   └── package.json
└── themes/butterfly/        # Butterfly 主题（含自定义 nav.pug 修改）
```

## API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录，返回 JWT |
| GET | `/api/auth/me` | 获取当前用户信息 |
| GET | `/api/comments?article=:slug` | 获取文章评论 |

### 管理接口（需 JWT + ADMIN 角色）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/admin/comments` | 评论列表（分页、状态筛选） |
| PUT | `/api/admin/comments/:id` | 审核/编辑评论 |
| DELETE | `/api/admin/comments/:id` | 删除评论 |
| GET | `/api/admin/articles` | 文章列表（分页） |
| GET | `/api/admin/articles/:id` | 获取单篇文章（含内容） |
| POST | `/api/admin/articles` | 创建文章 |
| PUT | `/api/admin/articles/:id` | 更新文章 |
| DELETE | `/api/admin/articles/:id` | 删除文章 |
| POST | `/api/admin/articles/sync` | 从 Hexo source 同步文章元数据 |
| POST | `/api/admin/articles/regenerate` | 触发 hexo generate 重新生成 |
| GET | `/api/admin/stats/overview` | 数据总览 |
| GET | `/api/admin/stats/daily` | 每日趋势 |

## 技术栈

- [Hexo](https://hexo.io/) — 博客框架
- [Butterfly](https://butterfly.js.org/) — 博客主题
- [Spring Boot 3](https://spring.io/projects/spring-boot) — 后端框架
- [MyBatis-Plus](https://baomidou.com/) — ORM 框架
- [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) — 管理后台
- [Element Plus](https://element-plus.org/) — UI 组件库
- [Pinia](https://pinia.vuejs.org/) — 状态管理
- [Axios](https://axios-http.com/) — HTTP 客户端
- [Marked](https://marked.js.org/) — Markdown 渲染
- [JJWT](https://github.com/jwtk/jjwt) — JWT 令牌
- MySQL / H2 Database
- Nginx

## 许可证

MIT
