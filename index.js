// ==UserScript==
// @name        Twitter Block With Love
// @namespace   https://www.eolstudy.com
// @version     2.3
// @description Block or mute all the Twitter users who like or RT a specific tweet, with love.
// @author      Eol, OverflowCat
// @run-at      document-end
// @grant       GM_registerMenuCommand
// @match       https://twitter.com/*
// @match       https://mobile.twitter.com/*
// @match       https://tweetdeck.twitter.com/*
// @exclude     https://twitter.com/account/*
// @require     https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @require     https://cdn.jsdelivr.net/npm/qs/dist/qs.min.js
// @require     https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @require     https://greasyfork.org/scripts/2199-waitforkeyelements/code/waitForKeyElements.js?version=6349
// @require     https://cdnjs.cloudflare.com/ajax/libs/nedb/1.8.0/nedb.min.js
// ==/UserScript==

/* global axios $ Qs waitForKeyElements Nedb*/

(_ => {
  let lang = document.documentElement.lang
  if (lang == 'en-US') {
    lang = 'en' // TweetDeck
  }
  const translations = {
    // Please submit a feedback on Greasyfork.com if your language is not in the list bellow
    'en': {
      lang_name: 'English',
      like_title: 'Liked by',
      like_list_identifier: 'Timeline: Liked by',
      retweet_title: 'Retweets',
      mini_retweet_title: 'Retweeted by',
      retweet_list_identifier: 'Timeline: Retweeted by',
      block_btn: 'Block all',
      block_success: 'All users blocked!',
      mute_btn: 'Mute all',
      mute_success: 'All users muted!',
      include_original_tweeter: 'Include the original Tweeter',
      logs: 'Logs',
      list_members: 'List members',
      list_members_identifier: 'Timeline: List members'
    },
    'en-GB': {
      lang_name: 'British English',
      like_title: 'Liked by',
      like_list_identifier: 'Timeline: Liked by',
      retweet_title: 'Retweets',
      mini_retweet_title: 'Retweeted by',
      retweet_list_identifier: 'Timeline: Retweeted by',
      block_btn: 'Block all',
      block_success: 'All users blocked!',
      mute_btn: 'Mute all',
      mute_btn: 'Mute all',
      mute_success: 'All users muted!',
      mute_success: 'All users muted!',
      include_original_tweeter: 'Include the original Tweeter',
      logs: 'Logs',
      list_members: 'List members',
      list_members_identifier: 'Timeline: List members'
    },
    'zh': {
      lang_name: '简体中文',
      like_title: '喜欢者',
      like_list_identifier: '时间线：喜欢者',
      retweet_title: '转推',
      retweet_list_identifier: '时间线：转推者',
      block_btn: '全部屏蔽',
      mute_btn: '全部隐藏',
      block_success: '列表用户已全部屏蔽！',
      mute_success: '列表用户已全部隐藏！',
      include_original_tweeter: '包括推主',
      logs: '操作记录',
      list_members: '列表成员',
      list_members_identifier: '时间线：列表成员'
    },
    'zh-Hant': {
      lang_name: '正體中文',
      like_title: '已被喜歡',
      like_list_identifier: '時間軸：已被喜歡',
      retweet_title: '轉推',
      retweet_list_identifier: '時間軸：已被轉推',
      block_btn: '全部封鎖',
      mute_btn: '全部靜音',
      block_success: '列表用戶已全部封鎖！',
      mute_success: '列表用戶已全部靜音！',
      include_original_tweeter: '包括推主',
      logs: '活動記錄',
      list_members: '列表成員',
      list_members_identifier: '時間軸：列表成員'
    },
    'ja': {
      lang_name: '日本語',
      like_list_identifier: 'タイムライン: いいねしたユーザー',
      like_title: 'いいねしたユーザー',
      retweet_list_identifier: 'タイムライン: リツイートしたユーザー',
      retweet_title: 'リツイート',
      block_btn: '全部ブロック',
      mute_btn: '全部ミュート',
      block_success: '全てブロックしました！',
      mute_success: '全てミュートしました！',
      include_original_tweeter: 'スレ主',
      logs: '操作履歴を表示',
      list_members: 'リストに追加されているユーザー',
      list_members_identifier: 'タイムライン: リストに追加されているユーザー'
    },
    'vi': {
      // translation by Ly Hương
      lang_name: 'Tiếng Việt',
      like_list_identifier: 'Dòng thời gian: Được thích bởi',
      like_title: 'Được thích bởi',
      retweet_list_identifier: 'Dòng thời gian: Được Tweet lại bởi',
      retweet_title: 'Được Tweet lại bởi',
      block_btn: 'Tắt tiếng tất cả',
      mute_btn: 'Chặn tất cả',
      block_success: 'Tất cả tài khoản đã bị chặn!',
      mute_success: 'Tất cả tài khoản đã bị tắt tiếng!',
      include_original_tweeter: 'Tweeter gốc',
      logs: 'Lịch sử',
      list_members: 'Thành viên trong danh sách',
      list_members_identifier: 'Dòng thời gian: Thành viên trong danh sách'
    },
    'ko': {
      // translation by hellojo011
      lang_name: '한국어',
      like_list_identifier: '타임라인: 마음에 들어 함',
      like_title: '마음에 들어 함',
      retweet_list_identifier: '타임라인: 리트윗함',
      retweet_title: '리트윗',
      block_btn: '모두 차단',
      mute_btn: '모두 뮤트',
      block_success: '모두 차단했습니다!',
      mute_success: '모두 뮤트했습니다!',
      include_original_tweeter: '글쓴이',
      logs: '활동',
      list_members: '리스트 멤버',
      list_members_identifier: '타임라인: 리스트 멤버'
    }
  }
  let i18n = translations[lang]
  // lang is empty in some error pages, so check lang first
  if (lang && !i18n) {
    let langnames = []
    Object.values(translations).forEach(language => langnames.push(language.lang_name))
    langnames = langnames.join(', ')
    let issue = confirm(
      'Twitter Block With Love userscript does not support your language (language code: "' + lang + '").\n' +
      'Please send feedback at Greasyfork.com or open an issue at Github.com.\n' +
      'Before that, you can edit the userscript yourself or just switch the language of Twitter Web App to any of the following languages: ' +
      langnames + '.\n\nDo you want to open an issue?'
    )
    if (issue) {
      window.location.replace("https://github.com/E011011101001/Twitter-Block-With-Love/issues/new/")
    }
  }

  const db = new Nedb()
  db.insert({
    type: 'START',
    ua: navigator.userAgent,
    time: new Date().getTime()
  })

  function open_logs () {
    db.find().sort({ firstField: 'Date' }).exec((err, docs) => {
      let logs = JSON.stringify(docs.reverse())
      alert(logs)
    })
  }
  GM_registerMenuCommand(i18n.logs, open_logs, 'L')

  function get_theme_color (){
    const close_icon = $('div[aria-label] > div[dir="auto"] > svg[viewBox="0 0 24 24"]')[0]
    return window.getComputedStyle(close_icon).color
  }

  function component_to_hex (c) {
    if (typeof(c) === 'string') c = Number(c)
    const hex = c.toString(16);
    return hex.length === 1 ? ("0" + hex) : hex;
  }

  function rgb_to_hex (r, g, b) {
    return "#" + component_to_hex(r) + component_to_hex(g) + component_to_hex(b);
  }

  function get_cookie (cname) {
    let name = cname + '='
    let ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; ++i) {
      let c = ca[i].trim()
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length)
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

  function get_list_id () {
    // https://twitter.com/any/thing/lists/1234567/anything => 1234567/anything => 1234567
    return location.href.split('lists/')[1].split('/')[0]
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
    const users = (await ajax.get(`/2/timeline/retweeted_by.json?tweet_id=${tweetId}`)).data.globalObjects.users

    let targets = []
    Object.keys(users).forEach(user => targets.push(user))
    return targets
  }

  async function fetch_list_members (listId) {
    const users = (await ajax.get(`/1.1/lists/members.json?list_id=${listId}`)).data.users
    let members = []
    members = users.map(u => u.id_str)
    return members
  }

  function block_user (id) {
    ajax.post('/1.1/blocks/create.json', Qs.stringify({
      user_id: id
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    db.insert({
      type: 'B',
      uid: id,
      time: new Date().getTime()
    })
  }

  function mute_user (id) {
    ajax.post('/1.1/mutes/users/create.json', Qs.stringify({
      user_id: id
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    db.insert({
      type: 'M',
      uid: id,
      time: new Date().getTime()
    })
  }

  // block_all_liker and block_no_comment_retweeters need to be merged
  async function block_all_likers () {
    const screen_name = location.href.split('twitter.com/')[1].split('/')[0]
    const tweetId = get_tweet_id()
    const tweetData = (await ajax.get(`/2/timeline/conversation/${tweetId}.json`)).data

    // Find the tweeter by username
    const users = tweetData.globalObjects.users
    let tweeterID
    for (let key in users) {
      if (users[key].screen_name === screen_name) {
        tweeterID = key
        break
      }
    }
    const likers = await fetch_likers(tweetId)
    likers.forEach(id => block_user(id))
  }

  async function mute_all_likers () {
    const tweetId = get_tweet_id()
    const likers = await fetch_likers(tweetId)
    likers.forEach(id => mute_user(id))
  }

  async function block_no_comment_retweeters () {
    const tweetId = get_tweet_id()
    const retweeters = await fetch_no_comment_retweeters(tweetId)
    retweeters.forEach(id => block_user(id))
    const tabName = location.href.split('retweets/')[1]
    if (tabName === 'with_comments') {
      if (!block_no_comment_retweeters.hasAlerted) {
        block_no_comment_retweeters.hasAlerted = true
        alert('TBWL has only blocked users that retweeted without comments.\n Please block users retweeting with comments manually.')
      }
    }
  }

  async function mute_no_comment_retweeters () {
    const tweetId = get_tweet_id()
    const retweeters = await fetch_no_comment_retweeters(tweetId)
    retweeters.forEach(id => mute_user(id))
    const tabName = location.href.split('retweets/')[1]
    if (tabName === 'with_comments') {
      if (!block_no_comment_retweeters.hasAlerted) {
        block_no_comment_retweeters.hasAlerted = true
        alert(
          'TBWL has only muted users that retweeted without comments.\n Please mute users retweeting with comments manually.'
        )
      }
    }
  }

  async function block_list_members () {
      const listId = get_list_id()
      const members = await fetch_list_members(listId)
      members.forEach(id => block_user(id))
  }
  async function mute_list_members () {
      const listId = get_list_id()
      const members = await fetch_list_members(listId)
      console.log(members)
      members.forEach(id => mute_user(id))
  }
  function success_notice (identifier, success_msg) {
    return _ => {
      const alertColor = 'rgb(224, 36, 94)'
      const container = $('div[aria-label="' + identifier + '"]')
      container.children().fadeOut(400, _ => {
        const notice = $(`
          <div style="
            color: ${alertColor};
            text-align: center;
            margin-top: 3em;
            font-size: x-large;
          ">
            <span>${success_msg}</span>
          </div>
        `)
        container.append(notice)
      })
    }
  }

  function mount_switch (parentDom, name) {
    const backgroundColor = $('body').css('background-color')
    const textColors = {
      'rgb(255, 255, 255)': '#000000',
      'rgb(21, 32, 43)': '#ffffff',
      'rgb(0, 0, 0)': '#ffffff'
    }
    const textColor = textColors[backgroundColor] || '#000000'
    let themeColor = get_theme_color()
    let _rgb = themeColor.replace('rgb(', '').replace(')', '').split(', ')
    let themeColor_hex = rgb_to_hex(_rgb[0], _rgb[1], _rgb[2])
    $('head').append(`
      <style>
        .container {
            margin-top: 0px;
            margin-left: 0px;
            margin-right: 5px;
        }
        .checkbox {
            width: 100%;
            margin: 0px auto;
            position: relative;
            display: block;
        }

        .checkbox input[type="checkbox"] {
            width: auto;
            opacity: 0.00000001;
            position: absolute;
            left: 0;
            margin-left: 0px;
        }
        .checkbox label:before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            margin: 0px;
            width: 22px;
            height: 22px;
            transition: transform 0.2s ease;
            border-radius: 3px;
            border: 2px solid ${themeColor_hex};
        }
        .checkbox label:after {
          content: '';
            display: block;
            width: 10px;
            height: 5px;
            border-bottom: 2px solid ${themeColor_hex};
            border-left: 2px solid ${themeColor_hex};
            -webkit-transform: rotate(-45deg) scale(0);
            transform: rotate(-45deg) scale(0);
            transition: transform ease 0.2s;
            will-change: transform;
            position: absolute;
            top: 8px;
            left: 6px;
        }
        .checkbox input[type="checkbox"]:checked ~ label::before {
            color: ${themeColor_hex};
        }

        .checkbox input[type="checkbox"]:checked ~ label::after {
            -webkit-transform: rotate(-45deg) scale(1);
            transform: rotate(-45deg) scale(1);
        }

        .checkbox label {
            position: relative;
            display: block;
            padding-left: 31px;
            margin-bottom: 0;
            font-weight: normal;
            cursor: pointer;
            vertical-align: sub;
            width:fit-content;
            width:-webkit-fit-content;
            width:-moz-fit-content;
        }
        .checkbox label span {
            position: relative;
            top: 50%;
            color: ${textColor};
            -webkit-transform: translateY(-50%);
            transform: translateY(-50%);
        }
        .checkbox input[type="checkbox"]:focus + label::before {
            outline: 0;
        }
      </style>`)
    const button = $(`
      <div class="container">
        <div class="checkbox">
          <input type="checkbox" id="includeTweeter" name="" value="">
          <label for="includeTweeter"><span>${name}</span></label>
        </div>
      </div>
    `)

    parentDom.append(button)
  }

  function mount_button (parentDom, name, executer, success_notifier) {
    let themeColor = get_theme_color()
    const hoverColor = themeColor.replace(/rgb/i, "rgba").replace(/\)/, ', 0.1)')
    const mousedownColor = themeColor.replace(/rgb/i, "rgba").replace(/\)/, ', 0.2)')
    const btn_mousedown = 'bwl-btn-mousedown'
    const btn_hover = 'bwl-btn-hover'

    $('head').append(`
      <style>
        .bwl-btn-base {
          min-height: 30px;
          padding-left: 1em;
          padding-right: 1em;
          border: 1px solid ${themeColor} !important;
          border-radius: 9999px;
        }
        .${btn_mousedown} {
          background-color: ${mousedownColor};
          cursor: pointer;
        }
        .${btn_hover} {
          background-color: ${hoverColor};
          cursor: pointer;
        }
        .bwl-btn-inner-wrapper {
          font-weight: bold;
          -webkit-box-align: center;
          align-items: center;
          -webkit-box-flex: 1;
          flex-grow: 1;
          color: ${themeColor};
          display: flex;
        }
        .bwl-text-font {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif;
          color: ${themeColor};
        }
      </style>
    `)

    const button = $(`
      <div
        aria-haspopup="true"
        role="button"
        data-focusable="true"
        class="bwl-btn-base"
        style="margin:3px"
      >
        <div class="bwl-btn-inner-wrapper">
          <span>
            <span class="bwl-text-font">${name}</span>
          </span>
        </div>
      </div>
    `)
    .addClass(parentDom.prop('classList')[0])
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

    parentDom.append(button)
  }

  function main () {
    waitForKeyElements('h2:has(> span:contains(' + i18n.like_title + '))', dom => {
      const ancestor = get_ancestor(dom, 3)
      mount_button(ancestor, i18n.mute_btn, mute_all_likers, success_notice(i18n.like_list_identifier, i18n.mute_success))
      mount_button(ancestor, i18n.block_btn, block_all_likers, success_notice(i18n.like_list_identifier, i18n.block_success))
    })

    waitForKeyElements('h2:has(> span:contains(' + i18n.retweet_title + '))', dom => {
      const ancestor = get_ancestor(dom, 3)
      mount_button(ancestor, i18n.mute_btn, mute_no_comment_retweeters, success_notice(i18n.retweet_list_identifier, i18n.mute_success))
      mount_button(ancestor, i18n.block_btn, block_no_comment_retweeters, success_notice(i18n.retweet_list_identifier, i18n.block_success))
    })

    waitForKeyElements('h2:has(> span:contains(' + i18n.list_members + '))', dom => {
      const ancestor = get_ancestor(dom, 3)
      mount_button(ancestor, i18n.mute_btn, mute_list_members, success_notice(i18n.list_members_identifier, i18n.mute_success))
      mount_button(ancestor, i18n.block_btn, block_list_members, success_notice(i18n.list_members_identifier, i18n.block_success))
    })
    // some languages do not need the 'mini' version
    if (i18n.mini_retweet_title) {
      waitForKeyElements('h2:has(> span:contains(' + i18n.mini_retweet_title + '))', dom => {
        mount_button(get_ancestor(dom, 3), i18n.block_btn, block_no_comment_retweeters, success_notice(i18n.retweet_list_identifier, i18n.block_success))
      })
    }
  }

  main()
})()
