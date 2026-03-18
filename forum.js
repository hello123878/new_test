(function () {
  const USER_KEY = 'forum_user';
  const POSTS_KEY = 'forum_posts';

  const currentUser = localStorage.getItem(USER_KEY);
  if (!currentUser) {
    window.location.href = './index.html';
    return;
  }

  const currentUserEl = document.getElementById('currentUser');
  const postTitleEl = document.getElementById('postTitle');
  const postContentEl = document.getElementById('postContent');
  const publishPostBtn = document.getElementById('publishPost');
  const postMsgEl = document.getElementById('postMsg');
  const postListEl = document.getElementById('postList');
  const logoutBtn = document.getElementById('logoutBtn');

  currentUserEl.textContent = currentUser;

  function getDefaultPosts() {
    return [
      {
        id: makeId(),
        title: '初学者第一支毛笔该怎么选？',
        content: '最近想系统学习书法，大家建议先从兼毫还是狼毫开始？纸张和墨汁也欢迎推荐。',
        author: '版主小墨',
        createdAt: new Date().toLocaleString('zh-CN'),
        comments: [
          {
            id: makeId(),
            content: '建议先买中号兼毫，容错更高，配普通练习纸就够用了。',
            author: '清风',
            createdAt: new Date().toLocaleString('zh-CN'),
            replies: [
              {
                id: makeId(),
                content: '赞同，我也是这样入门的，压力小很多。',
                author: '墨池新手',
                createdAt: new Date().toLocaleString('zh-CN')
              }
            ]
          }
        ]
      }
    ];
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadPosts() {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) {
      const defaults = getDefaultPosts();
      localStorage.setItem(POSTS_KEY, JSON.stringify(defaults));
      return defaults;
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function savePosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }

  function setMessage(text, isOk) {
    postMsgEl.textContent = text;
    postMsgEl.style.color = isOk ? 'var(--ok)' : 'var(--danger)';
  }

  function escapeHtml(text) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function render() {
    const posts = loadPosts();

    if (!posts.length) {
      postListEl.innerHTML = '<p class="muted">还没有帖子，来发布第一条吧。</p>';
      return;
    }

    const html = posts
      .map(function (post) {
        const commentsHtml = post.comments.length
          ? post.comments
              .map(function (comment) {
                const repliesHtml = comment.replies.length
                  ? '<div class="replies">' +
                    comment.replies
                      .map(function (reply) {
                        return (
                          '<div class="reply-item"><strong>' +
                          escapeHtml(reply.author) +
                          '</strong>：' +
                          escapeHtml(reply.content) +
                          ' <span class="meta">(' +
                          escapeHtml(reply.createdAt) +
                          ')</span></div>'
                        );
                      })
                      .join('') +
                    '</div>'
                  : '';

                return (
                  '<div class="comment">' +
                  '<p class="comment-main"><strong>' +
                  escapeHtml(comment.author) +
                  '</strong>：' +
                  escapeHtml(comment.content) +
                  '</p>' +
                  '<div class="meta">评论于 ' +
                  escapeHtml(comment.createdAt) +
                  '</div>' +
                  repliesHtml +
                  '<form class="inline-form reply-form" data-post-id="' +
                  post.id +
                  '" data-comment-id="' +
                  comment.id +
                  '">' +
                  '<input type="text" name="replyContent" placeholder="回复这条评论..." />' +
                  '<button class="tiny-btn" type="submit">回复</button>' +
                  '</form>' +
                  '</div>'
                );
              })
              .join('')
          : '<p class="muted">暂无评论，欢迎第一个发言。</p>';

        return (
          '<article class="post">' +
          '<h3 class="post-title">' +
          escapeHtml(post.title) +
          '</h3>' +
          '<div class="meta">发布者：' +
          escapeHtml(post.author) +
          ' | ' +
          escapeHtml(post.createdAt) +
          '</div>' +
          '<p class="post-content">' +
          escapeHtml(post.content) +
          '</p>' +
          '<hr class="divider" />' +
          '<div><strong>评论区</strong></div>' +
          commentsHtml +
          '<form class="inline-form comment-form" data-post-id="' +
          post.id +
          '">' +
          '<input type="text" name="commentContent" placeholder="写下你的评论..." />' +
          '<button class="tiny-btn" type="submit">评论</button>' +
          '</form>' +
          '</article>'
        );
      })
      .join('');

    postListEl.innerHTML = html;
  }

  publishPostBtn.addEventListener('click', function () {
    const title = postTitleEl.value.trim();
    const content = postContentEl.value.trim();

    if (!title) {
      setMessage('请填写帖子标题', false);
      return;
    }

    if (!content) {
      setMessage('请填写帖子内容', false);
      return;
    }

    const posts = loadPosts();
    posts.unshift({
      id: makeId(),
      title: title,
      content: content,
      author: currentUser,
      createdAt: new Date().toLocaleString('zh-CN'),
      comments: []
    });

    savePosts(posts);
    postTitleEl.value = '';
    postContentEl.value = '';
    setMessage('帖子发布成功', true);
    render();
  });

  postListEl.addEventListener('submit', function (event) {
    event.preventDefault();

    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const postId = form.dataset.postId;
    const posts = loadPosts();
    const post = posts.find(function (item) { return item.id === postId; });

    if (!post) {
      setMessage('未找到对应帖子，请刷新后重试', false);
      return;
    }

    if (form.classList.contains('comment-form')) {
      const input = form.elements.namedItem('commentContent');
      const content = input && typeof input.value === 'string' ? input.value.trim() : '';

      if (!content) {
        setMessage('评论内容不能为空', false);
        return;
      }

      post.comments.push({
        id: makeId(),
        content: content,
        author: currentUser,
        createdAt: new Date().toLocaleString('zh-CN'),
        replies: []
      });

      savePosts(posts);
      setMessage('评论已发布', true);
      render();
      return;
    }

    if (form.classList.contains('reply-form')) {
      const commentId = form.dataset.commentId;
      const comment = post.comments.find(function (item) { return item.id === commentId; });

      if (!comment) {
        setMessage('未找到对应评论，请刷新后重试', false);
        return;
      }

      const input = form.elements.namedItem('replyContent');
      const content = input && typeof input.value === 'string' ? input.value.trim() : '';

      if (!content) {
        setMessage('回复内容不能为空', false);
        return;
      }

      comment.replies.push({
        id: makeId(),
        content: content,
        author: currentUser,
        createdAt: new Date().toLocaleString('zh-CN')
      });

      savePosts(posts);
      setMessage('回复已发布', true);
      render();
    }
  });

  logoutBtn.addEventListener('click', function () {
    localStorage.removeItem(USER_KEY);
    window.location.href = './index.html';
  });

  render();
})();
