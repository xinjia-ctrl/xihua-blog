/**
 * 溪花博客 - 评论组件 + 导航栏登录注册
 * 无内联样式，纯 CSS 类控制
 */
;(function () {
  'use strict'

  var API = (function () {
    var p = window.location.port
    return (p === '4000' || p === '4001' ? 'http://localhost:8080' : '') + '/api'
  })()

  var TOKEN_KEY = 'token'
  var USER_KEY = 'xihua_user'

  // -- 工具函数 --
  function getSlug() {
    return window.location.pathname.replace(/\/+$/, '').split('/').pop() || ''
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
        } catch (e) { reject('响应解析失败') }
      }
      xhr.onerror = function () { reject('网络错误') }
      xhr.send(body ? JSON.stringify(body) : null)
    })
  }

  // -- 认证持久化 --
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

  // -- 导航栏认证状态 --
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
        ' <a href="#" id="nav-logout-link" style="margin-left:6px;">退出</a>'
      document.getElementById('nav-logout-link').onclick = function (e) {
        e.preventDefault()
        clearAuth()
        updateNavAuth()
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

  // -- 模态弹窗 --
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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal()
    })
  }

  function openModal(html) {
    createModal()
    var overlay = document.getElementById('xh-modal-overlay')
    overlay.querySelector('.xh-modal-body').innerHTML = html
    overlay.style.display = 'block'
    // 自动聚焦第一个输入框
    var firstInput = overlay.querySelector('input:not([type="hidden"])')
    if (firstInput) setTimeout(function () { firstInput.focus() }, 100)
  }

  function closeModal() {
    var overlay = document.getElementById('xh-modal-overlay')
    if (overlay) overlay.style.display = 'none'
  }

  // -- 认证弹窗 --
  function showAuthModal(mode) {
    var isLogin = mode === 'login'
    var html =
      '<div class="xh-modal-auth">' +
        '<h3>' + (isLogin ? '登录' : '注册') + '</h3>' +
        '<div class="xh-modal-subtitle">' + (isLogin ? '欢迎回来' : '创建一个新账号') + '</div>' +

        '<div class="xh-form-group">' +
          '<label>用户名</label>' +
          '<input type="text" id="xh-modal-user" placeholder="请输入用户名" autocomplete="username" />' +
        '</div>' +

        '<div class="xh-form-group">' +
          '<label>密码</label>' +
          '<input type="password" id="xh-modal-pass" placeholder="' + (isLogin ? '请输入密码' : '至少 6 位密码') + '" autocomplete="' + (isLogin ? 'current-password' : 'new-password') + '" />' +
        '</div>' +

        (!isLogin ? '<div class="xh-form-group">' +
          '<label>昵称（可选）</label>' +
          '<input type="text" id="xh-modal-nickname" placeholder="显示名称，默认为用户名" autocomplete="nickname" />' +
        '</div>' : '') +

        '<button class="xh-btn-primary" id="xh-modal-submit">' + (isLogin ? '登录' : '注册') + '</button>' +

        '<div class="xh-modal-msg" id="xh-modal-msg"></div>' +

        '<div class="xh-modal-footer">' +
          (isLogin
            ? '没有账号？<a id="xh-switch-auth">去注册</a>'
            : '已有账号？<a id="xh-switch-auth">去登录</a>') +
        '</div>' +
      '</div>'

    openModal(html)

    var body = document.querySelector('.xh-modal-body')
    var msgEl = body.querySelector('#xh-modal-msg')
    var submitBtn = body.querySelector('#xh-modal-submit')

    // 回车提交
    body.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitBtn.click()
      })
    })

    submitBtn.onclick = function () {
      var u = body.querySelector('#xh-modal-user').value.trim()
      var p = body.querySelector('#xh-modal-pass').value.trim()
      if (!u || !p) { showMsg('请填写用户名和密码', 'error'); return }
      if (!isLogin && p.length < 6) { showMsg('密码至少 6 位', 'error'); return }

      submitBtn.disabled = true
      submitBtn.textContent = isLogin ? '登录中...' : '注册中...'

      var endpoint = isLogin ? '/auth/login' : '/auth/register'
      var payload = { username: u, password: p }
      if (!isLogin) {
        var nn = body.querySelector('#xh-modal-nickname')
        payload.nickname = nn ? nn.value.trim() || u : u
      }

      api(endpoint, 'POST', payload)
        .then(function (data) {
          saveAuth(data)
          closeModal()
          updateNavAuth()
          refreshCommentAuth()
        })
        .catch(function (e) {
          showMsg(e, 'error')
          submitBtn.disabled = false
          submitBtn.textContent = isLogin ? '登录' : '注册'
        })
    }

    body.querySelector('#xh-switch-auth').onclick = function (e) {
      e.preventDefault()
      showAuthModal(isLogin ? 'register' : 'login')
    }

    function showMsg(text, type) {
      msgEl.textContent = text
      msgEl.className = 'xh-modal-msg ' + type
    }
  }

  // -- 导航栏事件 --
  function initNavAuth() {
    var loginLink = document.getElementById('nav-login-link')
    var registerLink = document.getElementById('nav-register-link')

    if (loginLink) loginLink.onclick = function (e) { e.preventDefault(); showAuthModal('login') }
    if (registerLink) registerLink.onclick = function (e) { e.preventDefault(); showAuthModal('register') }

    updateNavAuth()
  }

  // -- 评论渲染 --
  function renderComments(items) {
    if (!items || items.length === 0) return '<div class="xh-comment-empty">暂无评论，来说两句吧</div>'
    return items.map(function (c) {
      var d = c.createdAt
        ? new Date(c.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : ''
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
    if (!content) return
    var email = emailEl ? emailEl.value.trim() : ''
    btn.disabled = true
    btn.textContent = '提交中...'
    api('/comments', 'POST', { articleId: slug, email: email, content: content }, getToken())
      .then(function () {
        input.value = ''
        fetchComments(slug, listEl)
        btn.disabled = false
        btn.textContent = '发表评论'
        setMsg(formEl, '评论发表成功', 'success')
      })
      .catch(function (e) {
        btn.disabled = false
        btn.textContent = '发表评论'
        setMsg(formEl, e, 'error')
      })
  }

  function setMsg(parent, text, type) {
    var old = parent.querySelector('.xh-msg')
    if (old) old.remove()
    var el = document.createElement('div')
    el.className = 'xh-msg ' + (type === 'success' ? 'xh-comment-success' : 'xh-comment-error')
    el.textContent = text
    parent.appendChild(el)
    if (type === 'success') setTimeout(function () { el.remove() }, 5000)
  }

  // -- 评论区认证面板 --
  function renderAuth(container, slug, listEl, formArea) {
    var user = getUser()
    if (user) {
      renderCommentForm(container, slug, listEl, user)
      return
    }

    formArea.innerHTML =
      '<div class="xh-auth-box">' +
        '<p class="xh-auth-tip">登录后即可评论</p>' +
        '<div class="xh-form-inline">' +
          '<input type="text" class="xh-login-user" placeholder="用户名" />' +
          '<input type="password" class="xh-login-pass" placeholder="密码" />' +
        '</div>' +
        '<div class="xh-btn-group">' +
          '<button class="xh-btn xh-btn-login">登录</button>' +
          '<button class="xh-btn xh-btn-secondary xh-btn-register">注册</button>' +
        '</div>' +
        '<div class="xh-msg" style="margin-top:10px;"></div>' +
      '</div>'

    var box = formArea.querySelector('.xh-auth-box')

    // 回车提交
    box.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') box.querySelector('.xh-btn-login').click()
      })
    })

    box.querySelector('.xh-btn-login').onclick = function () {
      var u = box.querySelector('.xh-login-user').value.trim()
      var p = box.querySelector('.xh-login-pass').value.trim()
      if (!u || !p) { setMsg(box, '请填写用户名和密码', 'error'); return }
      api('/auth/login', 'POST', { username: u, password: p })
        .then(function (data) {
          saveAuth(data)
          updateNavAuth()
          renderCommentForm(container, slug, listEl, getUser())
        })
        .catch(function (e) { setMsg(box, e, 'error') })
    }

    box.querySelector('.xh-btn-register').onclick = function () {
      var u = box.querySelector('.xh-login-user').value.trim()
      var p = box.querySelector('.xh-login-pass').value.trim()
      if (!u || !p) { setMsg(box, '请填写用户名和密码', 'error'); return }
      if (p.length < 6) { setMsg(box, '密码至少 6 位', 'error'); return }
      api('/auth/register', 'POST', { username: u, password: p, nickname: u })
        .then(function (data) {
          saveAuth(data)
          updateNavAuth()
          renderCommentForm(container, slug, listEl, getUser())
        })
        .catch(function (e) { setMsg(box, e, 'error') })
    }
  }

  // -- 评论表单 --
  function renderCommentForm(container, slug, listEl, user) {
    var formArea = container.querySelector('.xh-comment-form-area')
    formArea.innerHTML =
      '<div class="xh-comment-form">' +
        '<div class="xh-auth-info">' +
          '已登录：<strong>' + esc(user.nickname) + '</strong>' +
          ' <a href="#" class="xh-logout-link">退出</a>' +
        '</div>' +
        '<div class="xh-form-row">' +
          '<textarea class="xh-comment-input" placeholder="写下你的评论..." rows="4"></textarea>' +
        '</div>' +
        '<div class="xh-form-row">' +
          '<input type="email" class="xh-comment-email" placeholder="邮箱（选填，用于 Gravatar 头像）" />' +
        '</div>' +
        '<div class="xh-form-row">' +
          '<button class="xh-btn xh-btn-submit">发表评论</button>' +
        '</div>' +
      '</div>'

    var form = formArea.querySelector('.xh-comment-form')

    form.querySelector('.xh-logout-link').onclick = function (e) {
      e.preventDefault()
      clearAuth()
      updateNavAuth()
      renderAuth(container, slug, listEl, formArea)
    }

    form.querySelector('.xh-btn-submit').onclick = function () {
      var input = form.querySelector('.xh-comment-input')
      var email = form.querySelector('.xh-comment-email')
      if (!input.value.trim()) { input.focus(); return }
      submitComment(slug, input, email, this, listEl, form)
    }

    // Ctrl+Enter 提交
    form.querySelector('.xh-comment-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        form.querySelector('.xh-btn-submit').click()
      }
    })
  }

  // -- 初始化 --
  function init() {
    initNavAuth()

    var slug = getSlug()
    if (!slug) return

    var postEl = document.querySelector('#post')
    if (!postEl) return

    var wrap = document.getElementById('xihua-comments-wrap')
    if (!wrap) {
      wrap = document.createElement('div')
      wrap.id = 'xihua-comments-wrap'
      postEl.appendChild(wrap)
    }

    wrap.innerHTML =
      '<h3 class="xh-comments-title">评论</h3>' +
      '<div class="xh-comment-list"></div>' +
      '<div class="xh-comment-form-area"></div>'

    var listEl = wrap.querySelector('.xh-comment-list')
    var formArea = wrap.querySelector('.xh-comment-form-area')

    fetchComments(slug, listEl)
    renderAuth(wrap, slug, listEl, formArea)
  }

  function onInit() { init() }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onInit)
  } else {
    onInit()
  }

  document.addEventListener('pjax:complete', onInit)

  // -- PJAX: 把导航栏移到 #body-wrap 外部 --
  function fixNavOutsideBodyWrap() {
    var bodyWrap = document.getElementById('body-wrap')
    if (!bodyWrap) return
    var innerNav = bodyWrap.querySelector('#nav')
    if (!innerNav) return
    var outerNav = document.getElementById('nav')
    if (outerNav === innerNav) {
      bodyWrap.parentNode.insertBefore(innerNav, bodyWrap)
    } else {
      innerNav.remove()
    }
  }

  fixNavOutsideBodyWrap()
  document.addEventListener('pjax:complete', fixNavOutsideBodyWrap)
})()
