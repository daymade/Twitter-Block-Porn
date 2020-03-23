// ==UserScript==
// @name        Twitter Block With Love
// @namespace   https://www.eolstudy.com
// @version     1.0
// @description Block all users who love a certain tweet
// @author      Eol
// @run-at      document-end
// @match       https://twitter.com/*
// @require     https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @require     https://cdn.jsdelivr.net/npm/qs/dist/qs.min.js
// @require     https://code.jquery.com/jquery-3.4.1.min.js
// @require     https://greasyfork.org/scripts/2199-waitforkeyelements/code/waitForKeyElements.js?version=6349
// ==/UserScript==

/* global axios $ Qs waitForKeyElements*/

(_ => {
  function get_cookie (cname) {
    var name = cname + "="
    var ca = document.cookie.split(';')
    for(var i=0; i<ca.length; i++)
    {
      var c = ca[i].trim()
      if (c.indexOf(name)==0) {
        return c.substring(name.length,c.length)
      }
    }
    return ""
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

  async function fetch_likers (tweetId) {
    const users = await ajax.get(`/2/timeline/liked_by.json?tweet_id=${tweetId}`).then(
      res => res.data.globalObjects.users
    )

    let likers = []
    for (let user in users) {
      likers.push(users[user].id_str)
    }
    return likers
  }

  function block_user (id) {
    ajax.post('/1.1/blocks/create.json', Qs.stringify({
      user_id: id
    }), {
      headers: {
        "Content-Type":'application/x-www-form-urlencoded'
      }
    })
  }

  async function block_all_likers () {
    const tweet_id = get_tweet_id()
    const likers = await fetch_likers(tweet_id)
    likers.forEach(id => block_user(id))
  }

  function clear_view () {
    const container = $('div[aria-label="Timeline: Liked by"]')
    container.children().fadeOut(400, _ => {
      const notice = $(`
        <div style="
          color: rgb(224, 36, 94);
          text-align: center;
          margin-top: 3em;
          font-size: x-large;
        ">
          <span>All Users Blocked!</span>
        </div>
      `)
      container.append(notice)
    })
  }

  function mount_block_button (dom) {
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
            <span class="bwl-text-font">Block All</span>
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
    .click(block_all_likers)
    .click(clear_view)

    dom.append(button)
  }

  function main () {
    waitForKeyElements('h2:has(> span:contains(Liked by))', dom => {
      mount_block_button(dom.parent().parent().parent())
    })
  }

  main()
})()

