/**
 * 溪花博客 - 评论组件 + 导航栏登录
 */
;(function () {
  'use strict'

  var port = window.location.port
  var API = (port === '4001' || port === '4000' ? 'http://localhost:8080' : '') + '/api'
  var TOKEN_KEY = 'token'
  var USER_KEY = 'xihua_user'

  function getSlug() {
    var path = window.location.pathname.replace(/\/+$/, '')
    return path.split('/').pop() || ''
  }

  function esc(t) {
    var d = document.createElement('div')
    d.appendChild(document.createTextNode(t))
    return d.innerHTML
  }

  function api(path, method, body, token) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest()
      xhr.open(method, API + path)
      xhr.setRequestHeader('Accept', 'application/json')
      if (body) xhr.setRequestHeader('Content-Type', 'application/json')
      if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token)
      xhr.onload = function () {
        try {
          var res = JSON.parse(xhr.responseText)
          if (res.code === 200) resolve(res.data)
          else reject(res.msg || '请求失败')
        } catch (e) {
          reject('响应解析失败')
        }
      }
      xhr.onerror = function () { reject('网络错误') }
      xhr.send(body ? JSON.stringify(body) : null)
    })
  }

  // ---------- 登录状态 ----------
  function getToken() { return localStorage.getItem(TOKEN_KEY) }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) }
    catch (e) { return null }
  }

  function saveAuth(data) {
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify({
      username: data.username,
      nickname: data.nickname || data.username
    }))
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // ---------- 导航栏认证状态 ----------
  function updateNavAuth() {
    var user = getUser()
    var loginLink = document.getElementById('nav-login-link')
    var registerLink = document.getElementById('nav-register-link')
    var sep = document.querySelector('.nav-auth-sep')
    var userInfo = document.getElementById('nav-user-info')
    if (!loginLink || !userInfo) return

    if (user) {
      loginLink.style.display = 'none'
      if (registerLink) registerLink.style.display = 'none'
      if (sep) sep.style.display = 'none'
      userInfo.style.display = 'inline'
      userInfo.innerHTML = '<strong>' + esc(user.nickname) + '</strong>' +
        ' <a href="#" id="nav-logout-link" style="color:#999;text-decoration:none;margin-left:6px;">退出</a>'
      document.getElementById('nav-logout-link').onclick = function (e) {
        e.preventDefault()
        clearAuth()
        updateNavAuth()
        // 如果评论区域打开，刷新其状态
        refreshCommentAuth()
      }
    } else {
      loginLink.style.display = 'inline'
      if (registerLink) registerLink.style.display = 'inline'
      if (sep) sep.style.display = 'inline'
      userInfo.style.display = 'none'
    }
  }

  function refreshCommentAuth() {
    var wrap = document.getElementById('xihua-comments-wrap')
    if (wrap) {
      var slug = getSlug()
      var listEl = wrap.querySelector('.xh-comment-list')
      var formArea = wrap.querySelector('.xh-comment-form-area')
      if (formArea) renderAuth(wrap, slug, listEl, formArea)
    }
  }

  // ---------- 模态弹窗 ----------
  var modalCreated = false

  function createModal() {
    if (modalCreated) return
    modalCreated = true
    var div = document.createElement('div')
    div.id = 'xh-modal-overlay'
    div.innerHTML =
      '<div class="xh-modal-mask"></div>' +
      '<div class="xh-modal-box">' +
        '<div class="xh-modal-close">&times;</div>' +
        '<div class="xh-modal-body"></div>' +
      '</div>'
    document.body.appendChild(div)

    div.querySelector('.xh-modal-mask').onclick = closeModal
    div.querySelector('.xh-modal-close').onclick = closeModal
  }

  function openModal(html) {
    createModal()
    var overlay = document.getElementById('xh-modal-overlay')
    overlay.querySelector('.xh-modal-body').innerHTML = html
    overlay.style.display = 'block'
  }

  function closeModal() {
    var overlay = document.getElementById('xh-modal-overlay')
    if (overlay) overlay.style.display = 'none'
  }

  function showAuthModal(mode) {
    var html =
      '<div class="xh-modal-auth">' +
        '<h3 style="margin:0 0 16px;font-size:1.1em;color:#333;">' + (mode === 'login' ? '登录' : '注册') + '</h3>' +
        '<div class="form-row" style="margin-bottom:12px;">' +
          '<input type="text" id="xh-modal-user" placeholder="用户名" style="width:100%;padding:8px 12px;border:1px solid #ddd;font-size:0.88em;box-sizing:border-box;outline:none;" />' +
        '</div>' +
        '<div class="form-row" style="margin-bottom:16px;">' +
          '<input type="password" id="xh-modal-pass" placeholder="密码" style="width:100%;padding:8px 12px;border:1px solid #ddd;font-size:0.88em;box-sizing:border-box;outline:none;" />' +
        '</div>' +
        '<div class="form-row" style="display:flex;gap:12px;">' +
          '<button id="xh-modal-submit" style="flex:1;padding:8px 24px;background:#146bb7;color:#fff;border:none;font-size:0.88em;cursor:pointer;">' + (mode === 'login' ? '登录' : '注册') + '</button>' +
        '</div>' +
        '<div class="xh-modal-auth-switch" style="margin-top:12px;font-size:0.82em;color:#999;text-align:center;">' +
          (mode === 'login'
            ? '没有账号？<a href="#" id="xh-switch-to-reg" style="color:#146bb7;text-decoration:none;">去注册</a>'
            : '已有账号？<a href="#" id="xh-switch-to-login" style="color:#146bb7;text-decoration:none;">去登录</a>') +
        '</div>' +
        '<div class="xh-modal-msg" style="margin-top:10px;font-size:0.85em;"></div>' +
      '</div>'

    openModal(html)

    var body = document.querySelector('.xh-modal-body')
    body.querySelector('#xh-modal-submit').onclick = function () {
      var u = body.querySelector('#xh-modal-user').value.trim()
      var p = body.querySelector('#xh-modal-pass').value.trim()
      if (!u || !p) { showModalMsg('请填写用户名和密码', 'error'); return }
      if (mode === 'register' && p.length < 6) { showModalMsg('密码至少6位', 'error'); return }

      var endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      var payload = mode === 'login' ? { username: u, password: p } : { username: u, password: p, nickname: u }

      api(endpoint, 'POST', payload)
        .then(function (data) {
          saveAuth(data)
          closeModal()
          updateNavAuth()
          refreshCommentAuth()
        })
        .catch(function (e) { showModalMsg(e, 'error') })
    }

    var switchLink = body.querySelector('#xh-switch-to-reg') || body.querySelector('#xh-switch-to-login')
    if (switchLink) {
      switchLink.onclick = function (e) {
        e.preventDefault()
        showAuthModal(mode === 'login' ? 'register' : 'login')
      }
    }

    function showModalMsg(text, type) {
      var el = body.querySelector('.xh-modal-msg')
      if (el) {
        el.textContent = text
        el.style.color = type === 'error' ? '#f56c6c' : '#67c23a'
      }
    }
  }

  // ---------- 导航栏事件绑定 ----------
  function initNavAuth() {
    var loginLink = document.getElementById('nav-login-link')
    var registerLink = document.getElementById('nav-register-link')

    if (loginLink) {
      loginLink.onclick = function (e) {
        e.preventDefault()
        showAuthModal('login')
      }
    }
    if (registerLink) {
      registerLink.onclick = function (e) {
        e.preventDefault()
        showAuthModal('register')
      }
    }

    updateNavAuth()
  }

  // ---------- 评论组件 ----------

  function renderComments(items) {
    if (!items || items.length === 0) return '<div class="xh-comment-empty">暂无评论</div>'
    return items.map(function (c) {
      var d = c.createdAt ? new Date(c.createdAt).toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : ''
      return '<div class="xh-comment">' +
        '<div class="xh-comment-author">' + esc(c.author) + '</div>' +
        '<div class="xh-comment-meta">' + d + '</div>' +
        '<div class="xh-comment-content">' + esc(c.content) + '</div>' +
        '</div>'
    }).join('')
  }

  function fetchComments(slug, el) {
    el.innerHTML = '<div class="xh-comment-loading">加载评论中...</div>'
    api('/comments?article=' + encodeURIComponent(slug) + '&page=1&size=50', 'GET')
      .then(function (data) { el.innerHTML = renderComments(data.items) })
      .catch(function (e) { el.innerHTML = '<div class="xh-comment-error">' + esc(e) + '</div>' })
  }

  function submitComment(slug, input, emailEl, btn, listEl, formEl) {
    var content = input.value.trim()
    var email = emailEl ? emailEl.value.trim() : ''
    btn.disabled = true
    btn.textContent = '提交中...'
    api('/comments', 'POST', { articleId: slug, email: email, content: content }, getToken())
      .then(function () {
        input.value = ''
        fetchComments(slug, listEl)
        btn.disabled = false
        btn.textContent = '发表评论'
        msg(formEl, '评论发表成功', 'success')
      })
      .catch(function (e) {
        btn.disabled = false
        btn.textContent = '发表评论'
        msg(formEl, e, 'error')
      })
  }

  function msg(parent, text, type) {
    var old = parent.querySelector('.xh-msg')
    if (old) old.remove()
    var el = document.createElement('div')
    el.className = 'xh-msg ' + (type === 'success' ? 'xh-comment-success' : 'xh-comment-error')
    el.textContent = text
    parent.appendChild(el)
    if (type === 'success') setTimeout(function () { el.remove() }, 5000)
  }

  // ---------- 登录/注册面板 ----------
  function renderAuth(container, slug, listEl, formArea) {
    var user = getUser()
    if (user) {
      renderCommentForm(container, slug, listEl, user)
      return
    }

    formArea.innerHTML =
      '<div class="xh-auth-box">' +
        '<p class="xh-auth-tip">请登录后发表评论</p>' +
        '<div class="form-row form-row-inline">' +
          '<input type="text" class="xh-login-user" placeholder="用户名" />' +
          '<input type="password" class="xh-login-pass" placeholder="密码" />' +
        '</div>' +
        '<div class="form-row" style="display:flex;gap:12px;">' +
          '<button class="xh-login-btn">登录</button>' +
          '<button class="xh-register-btn">注册</button>' +
        '</div>' +
      '</div>'

    var box = formArea.querySelector('.xh-auth-box')

    box.querySelector('.xh-login-btn').onclick = function () {
      var u = box.querySelector('.xh-login-user').value.trim()
      var p = box.querySelector('.xh-login-pass').value.trim()
      if (!u || !p) { msg(box, '请填写用户名和密码', 'error'); return }
      api('/auth/login', 'POST', { username: u, password: p })
        .then(function (data) {
          saveAuth(data)
          updateNavAuth()
          renderCommentForm(container, slug, listEl, getUser())
        })
        .catch(function (e) { msg(box, e, 'error') })
    }

    box.querySelector('.xh-register-btn').onclick = function () {
      var u = box.querySelector('.xh-login-user').value.trim()
      var p = box.querySelector('.xh-login-pass').value.trim()
      if (!u || !p) { msg(box, '请填写用户名和密码', 'error'); return }
      if (p.length < 6) { msg(box, '密码至少6位', 'error'); return }
      api('/auth/register', 'POST', { username: u, password: p, nickname: u })
        .then(function (data) {
          saveAuth(data)
          updateNavAuth()
          renderCommentForm(container, slug, listEl, getUser())
        })
        .catch(function (e) { msg(box, e, 'error') })
    }
  }

  // ---------- 评论表单 ----------
  function renderCommentForm(container, slug, listEl, user) {
    var formArea = container.querySelector('.xh-comment-form-area')
    formArea.innerHTML =
      '<div class="xh-comment-form">' +
        '<div class="xh-auth-info">' +
          '已登录：<strong>' + esc(user.nickname) + '</strong>' +
          ' <a href="#" class="xh-logout-link">退出</a>' +
        '</div>' +
        '<div class="form-row">' +
          '<textarea class="xh-comment-input" placeholder="写下你的评论..." rows="4"></textarea>' +
        '</div>' +
        '<div class="form-row">' +
          '<input type="email" class="xh-comment-email" placeholder="邮箱（可选）" />' +
        '</div>' +
        '<div class="form-row">' +
          '<button class="xh-comment-submit-btn">发表评论</button>' +
        '</div>' +
      '</div>'

    var form = formArea.querySelector('.xh-comment-form')

    form.querySelector('.xh-logout-link').onclick = function (e) {
      e.preventDefault()
      clearAuth()
      updateNavAuth()
      renderAuth(container, slug, listEl, formArea)
    }

    form.querySelector('.xh-comment-submit-btn').onclick = function () {
      var input = form.querySelector('.xh-comment-input')
      var email = form.querySelector('.xh-comment-email')
      if (!input.value.trim()) { input.focus(); return }
      submitComment(slug, input, email, this, listEl, form)
    }
  }

  // ---------- 初始化 ----------
  function init() {
    // 初始化导航栏认证
    initNavAuth()

    // 初始化评论区域（仅在文章页面）
    var slug = getSlug()
    if (!slug) return

    // 检查是否有文章内容区域（只在文章页显示评论）
    var postEl = document.querySelector('#post')
    if (!postEl) return

    var wrap = document.getElementById('xihua-comments-wrap')
    if (!wrap) {
      wrap = document.createElement('div')
      wrap.id = 'xihua-comments-wrap'
      postEl.appendChild(wrap)
    }

    wrap.innerHTML =
      '<h3 style="font-size:1.1em;font-weight:600;color:#333;margin:0 0 20px;">评论</h3>' +
      '<div class="xh-comment-list"></div>' +
      '<div class="xh-comment-form-area"></div>'

    var listEl = wrap.querySelector('.xh-comment-list')
    var formArea = wrap.querySelector('.xh-comment-form-area')

    fetchComments(slug, listEl)
    renderAuth(wrap, slug, listEl, formArea)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
