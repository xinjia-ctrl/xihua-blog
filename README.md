# 溪花博客

个人技术博客，基于 Hexo 构建，使用 Butterfly 主题。

## 功能特性

- 深色/亮色模式切换
- 标签与分类管理
- 全文搜索
- RSS 订阅
- 评论系统（Twikoo）
- 代码高亮

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
git clone https://github.com/xinjia-ctrl/xihua-blog.git
cd xihua-blog
npm install
```

### 本地开发

```bash
# 启动本地预览服务
npx hexo server
# 或指定端口
npx hexo server -p 4000
```

访问 `http://localhost:4000` 查看博客。

### 新建文章

```bash
npx hexo new "文章标题"
```

### 生成静态文件

```bash
npx hexo generate
```

## 配置说明

### 站点配置

编辑 `_config.yml`，修改站点标题、描述、作者等信息。

### 主题配置

编辑 `_config.butterfly.yml`，调整主题外观、导航菜单、侧边栏等。

### 评论系统

本博客使用 Twikoo 评论系统。如需启用：

1. 前往 [Twikoo 文档](https://twikoo.js.org/) 获取环境 ID
2. 在 `_config.butterfly.yml` 中填写 `twikoo.envId`

## 项目结构

```
├── _config.yml              # 站点配置文件
├── _config.butterfly.yml    # 主题配置文件
├── scaffolds/               # 文章模板
├── source/
│   ├── _posts/              # 文章目录
│   ├── tags/                # 标签页
│   ├── categories/          # 分类页
│   └── about/               # 关于页
└── themes/butterfly/        # Butterfly 主题
```

## 技术栈

- [Hexo](https://hexo.io/) — 博客框架
- [Butterfly](https://butterfly.js.org/) — 博客主题
- Node.js

## 许可证

MIT
