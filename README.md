# 溪花博客

三合一个人博客系统：Hexo 静态博客展示前端 + Spring Boot 3 REST API 后端 + Vue 3 管理后台。

线上地址：[http://8.136.216.143](http://8.136.216.143)

## 功能特性

- **Hexo 静态博客** — Butterfly 主题，极简风格展示，支持深色/亮色模式
- **自定义评论系统** — 自建后端，邮箱 Gravatar 头像，评论审核管理
- **管理后台** — 仪表盘统计、文章在线编辑（Markdown 实时预览）、评论审核
- **JWT 无状态认证** — Spring Security + JJWT，角色权限控制
- **API 限流** — Nginx 层限流 + 后端接口防刷，登录/评论/API 分级限流
- **安全防护** — DOMPurify XSS 过滤、参数校验、密码 BCrypt 加密

## 快速开始

### 环境要求

- Node.js 18+
- JDK 17+
- Maven 3.8+
- MySQL 8.0+

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

API 运行在 `http://localhost:8080`。默认连接 `127.0.0.1:3307`（SSH 隧道转接到云数据库），启动时自动建表并初始化管理员账号。

#### 启动管理后台

```bash
cd admin
npm install
npm run dev
```

管理后台运行在 `http://localhost:5173/admin/`。

## 配置说明

### 后端

`backend/src/main/resources/application.yml` 包含两套配置：

| 环境 | 配置文件 | 数据库 |
|------|----------|--------|
| `dev`（默认） | `--- spring.config.activate.on-profile: dev` | `127.0.0.1:3307`（SSH 隧道） |
| `prod` | `--- spring.config.activate.on-profile: prod` | `localhost:3306`（Docker MySQL） |

关键配置项：

- `jwt.secret` — JWT 签名密钥
- `jwt.expiration` — Token 过期时间（默认 86400000ms = 24h）
- `blog.source-posts` — Hexo 文章源文件目录

### Nginx

`deploy/nginx-prod.conf` 为生产环境 Nginx 配置，包含：

- 静态资源缓存
- API 反代到 Spring Boot（127.0.0.1:8080）
- 分级限流（登录 5r/m，评论 6r/m，API 60r/m）
- Vue 管理后台 SPA 路由回退

### Systemd

`deploy/xihua-blog.service` 为后端服务定义，通过 `systemctl` 管理。

## 项目结构

```
├── _config.yml              # Hexo 站点配置
├── _config.butterfly.yml    # Butterfly 主题配置
├── scaffolds/               # 文章模板
├── source/                  # Hexo 源文件
│   ├── _posts/              # 文章 Markdown 文件
│   ├── js/comment.js        # 自定义评论组件
│   └── css/comment.css      # 评论样式
├── backend/                 # Spring Boot 后端
│   └── src/main/java/com/xihua/blog/
│       ├── config/          # 安全、CORS、JWT、MyBatis-Plus 配置
│       ├── controller/      # REST 控制器
│       ├── service/         # 业务逻辑层
│       ├── mapper/          # MyBatis-Plus Mapper
│       ├── entity/          # 数据库实体
│       ├── dto/             # 请求/响应 DTO
│       └── common/          # 统一返回体、异常处理、JWT 工具
├── admin/                   # Vue 3 管理后台
│   └── src/
│       ├── views/           # 页面组件
│       ├── components/      # 布局组件
│       ├── router/          # 路由 + 导航守卫
│       ├── stores/          # Pinia 状态管理
│       └── utils/           # Axios 封装
├── deploy/                  # 部署文件
│   ├── deploy.sh            # 自动化部署脚本
│   ├── nginx-prod.conf      # Nginx 生产配置
│   ├── xihua-blog.service   # Systemd 服务
│   └── .env.production      # 环境变量模板
└── themes/butterfly/        # Butterfly 主题
```

## 技术栈

- [Hexo](https://hexo.io/) + [Butterfly](https://butterfly.js.org/) — 博客框架与主题
- [Spring Boot 3](https://spring.io/projects/spring-boot) — 后端框架
- [MyBatis-Plus](https://baomidou.com/) — ORM
- [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) + [Element Plus](https://element-plus.org/) — 管理后台
- [Pinia](https://pinia.vuejs.org/) — 状态管理
- [Spring Security](https://spring.io/projects/spring-security) + [JJWT](https://github.com/jwtk/jjwt) — 认证授权
- [MySQL 8](https://www.mysql.com/) — 数据库
- [Nginx](https://nginx.org/) — 反向代理
- [Marked](https://marked.js.org/) + [DOMPurify](https://github.com/cure53/DOMPurify) — Markdown 渲染与 XSS 过滤

## 部署

参见 `deploy/` 目录下的部署脚本和配置，或参考之前的 [部署文档](https://github.com/xinjia-ctrl/xihua-blog#readme)。

## 许可证

MIT
