#!/bin/bash
# ==========================================
# 溪花博客 - 云服务器一键部署脚本
# 适用系统: Ubuntu 22.04 / Debian 12
# ==========================================

set -e

# ---------- 配置区 ----------
DOMAIN="your-domain.com"          # 改为你的域名
MYSQL_ROOT_PASSWORD="change-me"   # MySQL root 密码
MYSQL_BLOG_PASSWORD="change-me"   # 博客数据库用户密码
JWT_SECRET="change-me-to-a-random-string-at-least-32-chars"

DEPLOY_DIR="/var/www/xihua-blog"
LOG_DIR="/var/log/xihua-blog"

# ---------- 颜色输出 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

# ---------- 1. 安装依赖 ----------
install_deps() {
    log "更新系统包索引..."
    apt-get update -qq

    log "安装 JDK 17..."
    apt-get install -y -qq openjdk-17-jdk

    log "安装 Nginx..."
    apt-get install -y -qq nginx

    log "安装 MySQL 8.0..."
    apt-get install -y -qq mysql-server

    log "安装 Node.js 18+..."
    apt-get install -y -qq ca-certificates curl gnupg
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq
    apt-get install -y -qq nodejs

    log "安装 Certbot (SSL)..."
    apt-get install -y -qq certbot python3-certbot-nginx

    log "安装 Maven..."
    apt-get install -y -qq maven

    log "依赖安装完成"
}

# ---------- 2. 配置 MySQL ----------
setup_mysql() {
    log "配置 MySQL 数据库..."

    mysql <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS xihua_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'xihua'@'localhost' IDENTIFIED BY '${MYSQL_BLOG_PASSWORD}';
GRANT ALL PRIVILEGES ON xihua_blog.* TO 'xihua'@'localhost';
FLUSH PRIVILEGES;
EOF

    log "MySQL 配置完成"
    warn "请记下 MySQL root 密码: ${MYSQL_ROOT_PASSWORD}"
}

# ---------- 3. 部署项目文件 ----------
deploy_project() {
    log "创建目录..."
    mkdir -p ${DEPLOY_DIR}
    mkdir -p ${LOG_DIR}

    log "请将项目文件上传到 ${DEPLOY_DIR}"
    log "上传后执行以下命令（在本地执行）:"
    echo "  scp -r ./public root@YOUR_SERVER:${DEPLOY_DIR}/"
    echo "  scp -r ./backend root@YOUR_SERVER:${DEPLOY_DIR}/"
    echo "  scp -r ./admin/dist root@YOUR_SERVER:${DEPLOY_DIR}/admin/dist"
    echo "  scp -r ./source root@YOUR_SERVER:${DEPLOY_DIR}/"
    echo "  scp ./nginx.conf root@YOUR_SERVER:${DEPLOY_DIR}/"
    echo "  scp ./deploy/xihua-blog.service root@YOUR_SERVER:/etc/systemd/system/"
}

# ---------- 4. 构建后端 ----------
build_backend() {
    log "构建后端项目..."
    cd ${DEPLOY_DIR}/backend
    mvn clean package -DskipTests
    log "后端构建完成"
}

# ---------- 5. 构建前端 ----------
build_frontend() {
    log "构建 Hexo 静态博客..."
    cd ${DEPLOY_DIR}
    npm ci
    npx hexo clean
    npx hexo generate
    log "Hexo 构建完成"

    log "构建管理后台 (如未在本地构建)..."
    if [ -d "${DEPLOY_DIR}/admin" ]; then
        cd ${DEPLOY_DIR}/admin
        npm ci 2>/dev/null || true
        npm run build 2>/dev/null || warn "admin 构建跳过（已在本地构建）"
    fi
}

# ---------- 6. 配置 Nginx ----------
setup_nginx() {
    log "配置 Nginx..."

    # 替换 nginx.conf 中的域名占位符
    sed -i "s/server_name localhost;/server_name ${DOMAIN};/g" ${DEPLOY_DIR}/nginx.conf
    sed -i "s|D:/xihua-blog|${DEPLOY_DIR}|g" ${DEPLOY_DIR}/nginx.conf
    sed -i "s|logs/|${LOG_DIR}/|g" ${DEPLOY_DIR}/nginx.conf

    # 复制 Nginx 配置
    cp ${DEPLOY_DIR}/nginx.conf /etc/nginx/sites-available/xihua-blog
    ln -sf /etc/nginx/sites-available/xihua-blog /etc/nginx/sites-enabled/

    # 删除默认站点
    rm -f /etc/nginx/sites-enabled/default

    # 测试配置
    nginx -t

    log "Nginx 配置完成"
}

# ---------- 7. 配置 SSL ----------
setup_ssl() {
    log "申请 SSL 证书（需要域名已解析到本服务器）..."
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}
    log "SSL 配置完成"
}

# ---------- 8. 启动服务 ----------
start_services() {
    log "重启 Nginx..."
    systemctl restart nginx

    log "注册后端系统服务..."
    cp ${DEPLOY_DIR}/deploy/xihua-blog.service /etc/systemd/system/
    systemctl daemon-reload

    # 替换环境变量
    sed -i "s|MYSQL_PASSWORD=.*|MYSQL_PASSWORD=${MYSQL_BLOG_PASSWORD}|" /etc/systemd/system/xihua-blog.service
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" /etc/systemd/system/xihua-blog.service

    log "启动后端服务..."
    systemctl enable xihua-blog
    systemctl restart xihua-blog

    log "所有服务已启动"
    log "查看后端日志: journalctl -u xihua-blog -f"
}

# ---------- 主流程 ----------
main() {
    echo ""
    echo "=========================================="
    echo "   溪花博客 - 云服务器部署脚本"
    echo "=========================================="
    echo ""

    # 检查运行环境
    if [ "$(id -u)" -ne 0 ]; then
        err "请使用 root 用户运行此脚本"
        exit 1
    fi

    # 分步执行
    install_deps
    setup_mysql
    deploy_project

    echo ""
    warn "请将项目文件上传到服务器后，继续执行剩余步骤"
    warn "上传完成后运行: bash deploy.sh --continue"
    echo ""

    if [ "$1" = "--continue" ]; then
        build_backend
        build_frontend
        setup_nginx
        setup_ssl
        start_services
    fi

    log "部署完成！"
    echo ""
    echo "  博客前端: https://${DOMAIN}"
    echo "  管理后台: https://${DOMAIN}/admin/"
    echo "  默认管理员: admin / admin123"
    echo ""
}

main "$@"
