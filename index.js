// ==UserScript==
// @name        Twitter Block With Love
// @namespace   https://www.eolstudy.com
// @version     2.0
// @description Block all users who love a certain tweet
// @author      Eol
// @run-at      document-end
// @match       https://twitter.com/*
// @match       https://mobile.twitter.com/*
// @require     https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @require     https://cdn.jsdelivr.net/npm/qs/dist/qs.min.js
// @require     https://code.jquery.com/jquery-3.4.1.min.js
// @require     https://greasyfork.org/scripts/2199-waitforkeyelements/code/waitForKeyElements.js?version=6349
// ==/UserScript==

/* global axios $ Qs waitForKeyElements*/

(_ => {
  var lang = document.documentElement.lang
  const translations = {
    // Please submit a feedback on Greasyfork.com if your language is not in the list bellow
    'en': {
      lang_name: 'English',
      like_title: 'Liked by',
      like_list_identifier: 'Timeline: Liked by', // aria-label
      retweet_title: 'Retweets',
      mini_retweet_title: 'Retweeted by',
      retweet_list_identifier: 'Timeline: Retweeted by',
      btn: 'Block All',
      success: 'All Users Blocked!'
    },
    'en-GB': {
      lang_name: 'British English',
      like_title: 'Liked by',
      like_list_identifier: 'Timeline: Liked by',
      retweet_title: 'Retweets',
      mini_retweet_title: 'Retweeted by',
      retweet_list_identifier: 'Timeline: Retweeted by',
      btn: 'Block All',
      success: 'All Users Blocked!'
    },
    'zh': {
      lang_name: '简体中文',
      like_title: '喜欢者',
      like_list_identifier: '时间线：喜欢者',
      retweet_title: '转推',
      retweet_list_identifier: '时间线：转推者',
      btn: '全部屏蔽',
      success: '列表用户已全部屏蔽！'
    },
    'zh-Hant': {
      lang_name: '正體中文',
      like_title: '已被喜歡',
      like_list_identifier: '時間軸：已被喜歡',
      retweet_title: '轉推',
      retweet_list_identifier: '時間軸：已被轉推',
      btn: '全部封鎖',
      success: '列表用戶已全部封鎖！'
    },
    'ja': {
      lang_name: '日本語',
      like_list_identifier: 'タイムライン: いいねしたユーザー',
      like_title: 'いいねしたユーザー',
      retweet_list_identifier: 'タイムライン: リツイートしたユーザー',
      retweet_title: 'リツイート',
      btn: '<span style="font-size: small">全部ブロックする<span>',
      success: '全てブロックしました！'
      }
  }
  var i18n = translations[lang]

  // lang is empty in some error pages, so check lang first
  if (lang && !i18n) {
    var langnames = []
    Object.values(translations).forEach(language => langnames.push(language.lang_name))
    langnames = langnames.join(', ')
    alert(
      'Twitter Block With Love userscript does not support your language.\n' +
      'Please submit a feedback at Greasyfork.com or a issue at Github.com.\n' +
      'Before that, you can edit the userscript yourself or just switch the language of the Twitter Web App to any of the following languages: ' +
      langnames + '.'
    )
  }

  function get_cookie (cname) {
    var name = cname + '='
    var ca = document.cookie.split(';')
    for(var i=0; i<ca.length; i++) {
      var c = ca[i].trim()
      if (c.indexOf(name)==0) {
        return c.substring(name.length,c.length)
      }
    }
    return ''
  }

  function get_ancestor (dom, level) {
    for (let i = 0; i < level; ++i) {
      dom = dom.parent()
    }
    return dom
  }

  const ajax = axios.create({
    baseURL: 'https://api.twitter.com',
    withCredentials: true,
    headers: {
      'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      'X-Twitter-Auth-Type': 'OAuth2Session',
      'X-Twitter-Active-User': 'yes',
      'X-Csrf-Token': get_cookie('ct0')
    }
  })

  function get_tweet_id () {
    // https://twitter.com/any/thing/status/1234567/anything => 1234567/anything => 1234567
    return location.href.split('status/')[1].split('/')[0]
  }

  // fetch_likers and fetch_no_comment_retweeters need to be merged into one function
  async function fetch_likers (tweetId) {
    const users = await ajax.get(`/2/timeline/liked_by.json?tweet_id=${tweetId}`).then(
      res => res.data.globalObjects.users
    )

    let likers = []
    Object.keys(users).forEach(user => likers.push(user)) // keys of users are id strings
    return likers
  }

  async function fetch_no_comment_retweeters (tweetId) {
    const users = await ajax.get(`/2/timeline/retweeted_by.json?tweet_id=${tweetId}`).then(
      res => res.data.globalObjects.users
    )

    let targets = []
    Object.keys(users).forEach(user => targets.push(user))
    return targets
  }

  function block_user (id) {
    ajax.post('/1.1/blocks/create.json', Qs.stringify({
      user_id: id
    }), {
      headers: {
        'Content-Type':'application/x-www-form-urlencoded'
      }
    })
  }

  // block_all_liker and block_no_comment_retweeters need to be merged
  async function block_all_likers () {
    const tweetId = get_tweet_id()
    const likers = await fetch_likers(tweetId)
    likers.forEach(id => block_user(id))
  }

  async function block_no_comment_retweeters () {
    const tweetId = get_tweet_id()
    const retweeters = await fetch_no_comment_retweeters(tweetId)
    retweeters.forEach(id => block_user(id))

    const tabName = location.href.split('retweets/')[1]
    if (tabName === 'with_comments') {
      if (!block_no_comment_retweeters.hasAlerted) {
        block_no_comment_retweeters.hasAlerted = true
        alert('TBWL has only blocked users that retweeted without comments.\n Please block users with comments manually.')
      }
    }
  }

  function success_notice (identifier) {
    return _ => {
      const container = $('div[aria-label="'+ identifier + '"]')
      container.children().fadeOut(400, _ => {
        const notice = $(`
          <div style="
            color: rgb(224, 36, 94);
            text-align: center;
            margin-top: 3em;
            font-size: x-large;
          ">
            <span>${i18n.success}</span>
          </div>
        `)
        container.append(notice)
      })
    }
  }

  function mount_block_button (dom, executer, success_notifier) {
    const btn_mousedown = 'bwl-btn-mousedown'
    const btn_hover = 'bwl-btn-hover'

    $('head').append(`
      <style>
        .bwl-btn-base {
          min-height: 30px;
          padding-left: 1em;
          padding-right: 1em;
          border: 1px solid rgb(29, 161, 242) !important;
          border-radius: 9999px;
        }
        .${btn_mousedown} {
          background-color: rgba(29, 161, 242, 0.2);
          cursor: pointer;
        }
        .${btn_hover} {
          background-color: rgba(29, 161, 242, 0.1);
          cursor: pointer;
        }
        .bwl-btn-inner-wrapper {
          font-weight: bold;
          -webkit-box-align: center;
          align-items: center;
          -webkit-box-flex: 1;
          flex-grow: 1;
          color: rgba(29,161,242,1.00);
          display: flex;
        }
        .bwl-text-font {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif;
        }
      </style>
    `)

    const button = $(`
      <div
        aria-haspopup="true"
        role="button"
        data-focusable="true"
        class="bwl-btn-base"
      >
        <div class="bwl-btn-inner-wrapper">
          <span>
            <span class="bwl-text-font">${i18n.btn}</span>
          </span>
        </div>
      </div>
    `)
    .addClass(dom.prop('classList')[0])
    .hover(function () {
      $(this).addClass(btn_hover)
    }, function () {
      $(this).removeClass(btn_hover)
      $(this).removeClass(btn_mousedown)
    })
    .on('selectstart', function () {
      return false
    })
    .mousedown(function () {
      $(this).removeClass(btn_hover)
      $(this).addClass(btn_mousedown)
    })
    .mouseup(function () {
      $(this).removeClass(btn_mousedown)
      if ($(this).is(':hover')) {
        $(this).addClass(btn_hover)
      }
    })
    .click(executer)
    .click(success_notifier)

    dom.append(button)
  }

  function main () {
    waitForKeyElements('h2:has(> span:contains(' + i18n.like_title + '))', dom => {
      mount_block_button(get_ancestor(dom, 3), block_all_likers, success_notice(i18n.like_list_identifier))
    })

    waitForKeyElements('h2:has(> span:contains(' + i18n.retweet_title + '))', dom => {
      mount_block_button(get_ancestor(dom, 3), block_no_comment_retweeters, success_notice(i18n.retweet_list_identifier))
    })

    // some languages do not need the 'mini' version
    if (i18n.mini_retweet_title) {
      waitForKeyElements('h2:has(> span:contains(' + i18n.mini_retweet_title + '))', dom => {
        mount_block_button(get_ancestor(dom, 3), block_no_comment_retweeters, success_notice(i18n.retweet_list_identifier))
      })
    }
  }

  main()
})()
