// ==UserScript==
// @name        Twitter Block Porn
// @homepage    https://github.com/daymade/Twitter-Block-Porn
// @icon        https://raw.githubusercontent.com/daymade/Twitter-Block-Porn/master/imgs/icon.svg
// @version     1.4.0
// @description One-click block all the yellow scammers in the comment area.
// @description:zh-CN 共享黑名单, 一键拉黑所有黄推诈骗犯
// @description:zh-TW 一鍵封鎖評論區的黃色詐騙犯
// @description:ja コメントエリアのイエロースキャマーを一括ブロック
// @description:ko 댓글 영역의 노란색 사기꾼을 한 번에 차단
// @description:de Alle gelben Betrüger im Kommentarbereich mit einem Klick blockieren.
// @author      daymade
// @source      forked from https://github.com/E011011101001/Twitter-Block-With-Love
// @license     MIT
// @run-at      document-end
// @grant       GM_registerMenuCommand
// @grant       GM_openInTab
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_log
// @match       https://twitter.com/*
// @match       https://mobile.twitter.com/*
// @match       https://tweetdeck.twitter.com/*
// @exclude     https://twitter.com/account/*
// @require     https://cdn.jsdelivr.net/npm/axios@0.25.0/dist/axios.min.js
// @require     https://cdn.jsdelivr.net/npm/qs@6.10.3/dist/qs.min.js
// @require     https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// ==/UserScript==

/* global axios $ Qs */
const menu_command_list1 = GM_registerMenuCommand('打开共享黑名单 ①', function () {
  const url = 'https://twitter.com/i/lists/1677334530754248706/members'
  GM_openInTab(url, {active: true})
}, '');

const menu_command_list2 = GM_registerMenuCommand('打开共享黑名单 ②', function () {
  const url = 'https://twitter.com/i/lists/1683810394287079426/members'
  GM_openInTab(url, {active: true})
}, '');

const menu_command_list3 = GM_registerMenuCommand('打开共享黑名单 ③', function () {
  const url = 'https://twitter.com/i/lists/1699049983159259593/members'
  GM_openInTab(url, {active: true})
}, '');

const menu_command_special_list = GM_registerMenuCommand('拉黑加急名单(点击即生效)', function () {
  block_special_list()
}, '');

const ChangeLogo = GM_getValue('change_logo', true)
GM_registerMenuCommand(`${ChangeLogo?'已将 Logo 还原为小蓝鸟, 点击可使用 \uD835\uDD4F':'点击唤回小蓝鸟'}`, function () {
  GM_setValue('change_logo', !ChangeLogo)
  location.reload()
});

function get_cookie (cname) {
  const name = cname + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; ++i) {
    const c = ca[i].trim()
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

const ajax = axios.create({
  baseURL: 'https://api.twitter.com',
  withCredentials: true,
  headers: {
    Authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
    'X-Twitter-Auth-Type': 'OAuth2Session',
    'X-Twitter-Active-User': 'yes',
    'X-Csrf-Token': get_cookie('ct0')
  }
})

function get_list_id () {
  // https://twitter.com/any/thing/lists/1234567/anything => 1234567/anything => 1234567
  return location.href.split('lists/')[1].split('/')[0]
}

async function fetch_list_members_id(listId) {
  let users = await fetch_list_members_info(listId)
  
  return users.map(u => u.id_str);
}

async function fetch_list_members_info(listId) {
  let cursor = -1;
  let allMembers = [];
  
  while (cursor != 0) {
    let response = await ajax.get(`/1.1/lists/members.json?list_id=${listId}&cursor=${cursor}`);
    let users = response.data.users;
    allMembers = allMembers.concat(users);
    cursor = response.data.next_cursor;
  }
  
  return allMembers;
}

async function block_user (id, listId) {
  try {
    await ajax.post('/1.1/blocks/create.json', Qs.stringify({
      user_id: id
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    // Update blocked IDs list in GM storage
    let blocked = GM_getValue('blockedIds', {});
    if (!blocked[listId]) {
      blocked[listId] = [];
    }
    blocked[listId].push(id);
    GM_setValue('blockedIds', blocked);
  } catch (err) {
    // Handle errors as needed
  }
}


async function block_by_ids (member_ids, listId) {
  let blocked = GM_getValue('blockedIds', {});
  GM_log(`blockedIds: ${JSON.stringify(blocked)}`)

  let toBlock = member_ids.filter(id => !blocked[listId] || !blocked[listId].includes(id));

  const ids = [...new Set(toBlock)];

  GM_log(`block_by_ids: ${ids.length} users, detail: ${ids}`)

  // Number of requests per batch
  const batchSize = 10;
  // 1000ms delay between batches
  const delay = 1000;

  let failedIds = [];

  for (let i = 0; i < Math.ceil(ids.length / batchSize); i++) {
    const batch = ids.slice(i * batchSize, (i + 1) * batchSize);
    const results = await Promise.allSettled(batch.map(id => block_user(id, listId)));

    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        // Keep track of failed IDs
        failedIds.push(batch[index]);
      }
    }

    if (i < Math.ceil(ids.length / batchSize) - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  if (failedIds.length > 0) {
    GM_log(`Failed to block these IDs: ${failedIds.join(', ')}`)
  }
}

async function block_list_test_members () {
  const listId = get_list_id()
  const members = await fetch_list_members_id(listId)

  block_by_ids(members.slice(0, 10), listId)
}

async function block_list_members () {
  const listId = get_list_id()
  const members = await fetch_list_members_id(listId)

  block_by_ids(members, listId)
}

async function block_special_list () {
  // 加急名单: 特别活跃/拉黑我/来挑衅的黄推
  const special_scammers = [
    "1626262000547377153",
    "1083844806",
    "1191513095774048256",
    "1240432468995473411",
    "1260746375010177033",
    "1287994653388623875",
    "1356533851250548737",
    "1367769524657786883",
    "1371653074217963522",
    "1413745607466885121",
    "1428063931130646531",
    "1450954075084713986",
    "1455789588392202241",
    "1484792482357338113",
    "1489964205310570498",
    "1511380196",
    "1559311298986393603",
    "1562212902207033345",
    "1572580165900767234",
    "1578298585514668032",
    "1580799004983508992",
    "1583905468178567168",
    "1585644302381694976",
    "1589228466658250752",
    "1592249768771977216",
    "1592260043490983936",
    "1592573920905166849",
    "1592691909805604870",
    "1593155334742618112",
    "1593157357059837954",
    "1593620049704628224",
    "1593948516594102272",
    "1602373747344048128",
    "1616646252",
    "1616785364462743553",
    "1622437704159100929",
    "1623320122978099201",
    "1624527915663896576",
    "1626772507910082562",
    "1639847615981568001",
    "1650736618293133313",
    "1655041846790467585",
    "1655821795272937472",
    "1656797676820725761",
    "1658357788249321472",
    "1660685299930759168",
    "1665333981951172608",
    "1670444198586363904",
    "1671941042776702976",
    "1672954423663038466",
    "1673741619634241536",
    "1675179645870768128",
    "1676435725942661121",
    "1676489900021915648",
    "1679909362335354880",
    "1683326796488671232",
    "1683330763167780864",
    "1684583392665550850",
    "1684659885726916609",
    "1684743661853229056",
    "1684859751119847424",
    "1685367331013476352",
    "1685884844885295104",
    "1686221264023957504",
    "1687807818831986688",
    "1687816807766523905",
    "1688494198331420672",
    "1689943762531753985",
    "1690427325001904128",
    "175911002",
    "2802758389",
    "310749736",
    "3183558127",
    "532085468",
    "593711290",
    "769695361656991744",
    "824376009029992456",
    "976566332111179778",
    "769695361656991744",
    "3183558127",
    "1690427325001904128",
    "1675179645870768128",
    "1572106376",
    "1695160338780409856",
    "1637733191673950208",
    "1683682718863724544",
    "1399167832001241088",
    "1401414397021417472",
    "1387838616202788865",
    "1687365559355121665",
    "1399167832001241088",
    "1689962125169680384",
    "1387838616202788865",
    "1459187911329345538",
    "771777233878933504",
    "732529176805318661",
    "1593953486592303104",
    "1269873849568382981",
    "1631995677742907393",
    "837242544",
    "1642503707165364225",
    "1626262000547377153"
  ]

  block_by_ids(special_scammers, "special_scammers_list")
}

async function export_list_members () {
  const listId = get_list_id();
  const members = await fetch_list_members_info(listId);
  
  // 创建一个 Blob 实例，包含 JSON 字符串的成员信息
  const blob = new Blob([JSON.stringify(members, null, 2)], {type : 'application/json'});

  // 创建一个下载链接并点击它来下载文件
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${listId}-${Date.now()}.json`;
  link.click();
}

(_ => {
  /* Begin of Dependencies */
  /* eslint-disable */

  // https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
  /*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
      that detects and handles AJAXed content.

      Usage example:

          waitForKeyElements (
              "div.comments"
              , commentCallbackFunction
          );

          //--- Page-specific function to do what we want when the node is found.
          function commentCallbackFunction (jNode) {
              jNode.text ("This comment changed by waitForKeyElements().");
          }

      IMPORTANT: This function requires your script to have loaded jQuery.
  */
  function waitForKeyElements (
      selectorTxt,    /* Required: The jQuery selector string that
                          specifies the desired element(s).
                      */
      actionFunction, /* Required: The code to run when elements are
                          found. It is passed a jNode to the matched
                          element.
                      */
      bWaitOnce,      /* Optional: If false, will continue to scan for
                          new elements even after the first match is
                          found.
                      */
      iframeSelector  /* Optional: If set, identifies the iframe to
                          search.
                      */
  ) {
      var targetNodes, btargetsFound;

      if (typeof iframeSelector == "undefined")
          targetNodes     = $(selectorTxt);
      else
          targetNodes     = $(iframeSelector).contents ()
                                            .find (selectorTxt);

      if (targetNodes  &&  targetNodes.length > 0) {
          btargetsFound   = true;
          /*--- Found target node(s).  Go through each and act if they
              are new.
          */
          targetNodes.each ( function () {
              var jThis        = $(this);
              var alreadyFound = jThis.data ('alreadyFound')  ||  false;

              if (!alreadyFound) {
                  //--- Call the payload function.
                  var cancelFound     = actionFunction (jThis);
                  if (cancelFound)
                      btargetsFound   = false;
                  else
                      jThis.data ('alreadyFound', true);
              }
          } );
      }
      else {
          btargetsFound   = false;
      }

      //--- Get the timer-control variable for this selector.
      var controlObj      = waitForKeyElements.controlObj  ||  {};
      var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
      var timeControl     = controlObj [controlKey];

      //--- Now set or clear the timer as appropriate.
      if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
          //--- The only condition where we need to clear the timer.
          clearInterval (timeControl);
          delete controlObj [controlKey]
      }
      else {
          //--- Set a timer, if needed.
          if ( ! timeControl) {
              timeControl = setInterval ( function () {
                      waitForKeyElements (    selectorTxt,
                                              actionFunction,
                                              bWaitOnce,
                                              iframeSelector
                                          );
                  },
                  300
              );
              controlObj [controlKey] = timeControl;
          }
      }
      waitForKeyElements.controlObj   = controlObj;
  }
  /* eslint-enable */
  /* End of Dependencies */

  let lang = document.documentElement.lang
  if (lang == 'en-US') {
    lang = 'en' // TweetDeck
  }
  if (lang == 'zh-CN') {
    lang = 'zh'
  }
  
  const translations = {
    en: {
      lang_name: 'English',
      block_btn: 'Block all Scammers',
      block_test_btn: 'Test block top 10 Scammers',
      block_success: 'All scammers blocked!',
      block_test_success: 'Top 10 scammers test blocked successfully!',
      export_btn: 'Export',
      export_success: 'Export successful!',
    },
    'en-GB': {
      lang_name: 'British English',
      block_btn: 'Block all Scammers',
      block_test_btn: 'Test block top 10 Scammers',
      block_success: 'All scammers blocked!',
      block_test_success: 'Top 10 scammers test blocked successfully!',
      export_btn: 'Export',
      export_success: 'Export successful!',
    },
    zh: {
      lang_name: '简体中文',
      block_btn: '屏蔽所有诈骗犯',
      block_test_btn: '屏蔽前10名',
      block_success: '诈骗犯已全部被屏蔽！',
      block_test_success: '前10名诈骗犯测试屏蔽成功！',
      export_btn: '导出',
      export_success: '导出成功！',
    },
    'zh-Hant': {
      lang_name: '正體中文',
      block_btn: '封鎖所有詐騙犯',
      block_test_btn: '測試封鎖前10名詐騙犯',
      block_success: '詐騙犯已全部被封鎖！',
      block_test_success: '前10名詐騙犯測試封鎖成功！',
      export_btn: '導出',
      export_success: '導出成功！',
    },
    ja: {
      lang_name: '日本語',
      block_btn: 'すべての詐欺師をブロック',
      block_test_btn: 'トップ10詐欺師をテストブロック',
      block_success: 'すべての詐欺師がブロックされました！',
      block_test_success: 'トップ10の詐欺師がテストブロックされました！',
      export_btn: 'エクスポート',
      export_success: 'エクスポート成功！',
    },
    vi: {
      lang_name: 'Tiếng Việt',
      block_btn: 'Chặn tất cả scammers',
      block_test_btn: 'Thử chặn top 10 scammers',
      block_success: 'Tất cả scammers đã bị chặn!',
      block_test_success: 'Đã thành công chặn thử top 10 scammers!',
      export_btn: 'Xuất',
      export_success: 'Xuất thành công!',
    },
    ko: {
      lang_name: '한국어',
      block_btn: '모든 사기꾼을 차단',
      block_test_btn: '테스트 차단 사기꾼 상위 10',
      block_success: '모든 사기꾼이 차단되었습니다!',
      block_test_success: '상위 10 사기꾼 테스트 차단 성공!',
      export_btn: '내보내기',
      export_success: '내보내기 성공!',
    },
    de: {
      lang_name: 'Deutsch',
      block_btn: 'Alle Betrüger blockieren',
      block_test_btn: 'Testblock Top 10 Betrüger',
      block_success: 'Alle Betrüger wurden blockiert!',
      block_test_success: 'Top 10 Betrüger erfolgreich getestet und blockiert!',
      export_btn: 'Exportieren',
      export_success: 'Export erfolgreich!',
    },
    fr: {
      lang_name: 'French',
      block_btn: 'Bloquer tous les escrocs',
      block_test_btn: 'Test de blocage top 10 escrocs',
      block_success: 'Tous les escrocs sont bloqués !',
      block_test_success: 'Test de blocage des 10 premiers escrocs réussi !',
      export_btn: 'Exporter',
      export_success: 'Exportation réussie !',
    },
  }

  let i18n = translations[lang]

  function rgba_to_hex (rgba_str, force_remove_alpha) {
    return '#' + rgba_str.replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
      .split(',') // splits them at ","
      .filter((_, index) => !force_remove_alpha || index !== 3)
      .map(string => parseFloat(string)) // Converts them to numbers
      .map((number, index) => index === 3 ? Math.round(number * 255) : number) // Converts alpha to 255 number
      .map(number => number.toString(16)) // Converts numbers to hex
      .map(string => string.length === 1 ? '0' + string : string) // Adds 0 when length of one number is 1
      .join('')
      .toUpperCase()
  }

  function hex_to_rgb (hex_str) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex_str)
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : ''
  }

  function invert_hex (hex) {
    return '#' + (Number(`0x1${hex.substring(1)}`) ^ 0xFFFFFF).toString(16).substring(1).toUpperCase()
  }

  function get_theme_color () {
    const FALLBACK_COLOR = 'rgb(128, 128, 128)'
    let bgColor = getComputedStyle(document.querySelector('#modal-header > span')).color || FALLBACK_COLOR
    let buttonTextColor = hex_to_rgb(invert_hex(rgba_to_hex(bgColor)))
    for (const ele of document.querySelectorAll('div[role=\'button\']')) {
      const color = ele?.style?.backgroundColor
      if (color != '') {
        bgColor = color
        const span = ele.querySelector('span')
        buttonTextColor = getComputedStyle(span)?.color || buttonTextColor
      }
    }

    return {
      bgColor,
      buttonTextColor,
      plainTextColor: $('span').css('color'),
      hoverColor: bgColor.replace(/rgb/i, 'rgba').replace(/\)/, ', 0.9)'),
      mousedownColor: bgColor.replace(/rgb/i, 'rgba').replace(/\)/, ', 0.8)')
    }
  }

  function get_ancestor (dom, level) {
    for (let i = 0; i < level; ++i) {
      dom = dom.parent()
    }
    return dom
  }

  function get_notifier_of (msg) {
    return _ => {
      const banner = $(`
        <div id="bwl-notice" style="right:0px; position:fixed; left:0px; bottom:0px; display:flex; flex-direction:column;">
          <div class="tbwl-notice">
            <span>${msg}</span>
          </div>
        </div>
      `)
      const closeButton = $(`
        <span id="bwl-close-button" style="font-weight:700; margin-left:12px; margin-right:12px; cursor:pointer;">
          Close
        </span>
      `)
      closeButton.click(_ => banner.remove())
      $(banner).children('.tbwl-notice').append(closeButton)

      $('#layers').append(banner)
      setTimeout(() => banner.remove(), 5000)
      $('div[data-testid="app-bar-close"]').click()
    }
  }

  function mount_button (parentDom, name, executer, success_notifier) {
    const btn_mousedown = 'bwl-btn-mousedown'
    const btn_hover = 'bwl-btn-hover'

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
    `).addClass(parentDom.prop('classList')[0])
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

  function insert_css () {
    const FALLBACK_FONT_FAMILY = 'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans CJK JP", Arial, sans-serif;'
    function get_font_family () {
      for (const ele of document.querySelectorAll('div[role=\'button\']')) {
        const font_family = getComputedStyle(ele).fontFamily
        if (font_family) {
          return font_family + ', ' + FALLBACK_FONT_FAMILY
        }
      }
      return FALLBACK_FONT_FAMILY
    }

    const colors = get_theme_color()

    // switch related
    $('head').append(`<style>
    </style>`)

    // TODO: reduce repeated styles
    $('head').append(`<style>
      .tbwl-notice {
        align-self: center;
        display: flex;
        flex-direction: row;
        padding: 12px;
        margin-bottom: 32px;
        border-radius: 4px;
        color:rgb(255, 255, 255);
        background-color: rgb(29, 155, 240);
        font-family: ${FALLBACK_FONT_FAMILY};
        font-size:15px;
        line-height:20px;
        overflow-wrap: break-word;
      }
      .bwl-btn-base {
        min-height: 30px;
        padding-left: 1em;
        padding-right: 1em;
        border: 1px solid ${colors.bgColor} !important;
        border-radius: 9999px;
        background-color: ${colors.bgColor};
      }
      .bwl-btn-mousedown {
        background-color: ${colors.mousedownColor};
        cursor: pointer;
      }
      .bwl-btn-hover {
        background-color: ${colors.hoverColor};
        cursor: pointer;
      }
      .bwl-btn-inner-wrapper {
        font-weight: bold;
        -webkit-box-align: center;
        align-items: center;
        -webkit-box-flex: 1;
        flex-grow: 1;
        color: ${colors.bgColor};
        display: flex;
      }
      .bwl-text-font {
        font-family: ${get_font_family()};
        color: ${colors.buttonTextColor};
      }
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
        color: ${colors.plainTextColor};
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
        border: 2px solid ${colors.bgColor};
      }
      .checkbox label:after {
        content: '';
        display: block;
        width: 10px;
        height: 5px;
        border-bottom: 2px solid ${colors.bgColor};
        border-left: 2px solid ${colors.bgColor};
        -webkit-transform: rotate(-45deg) scale(0);
        transform: rotate(-45deg) scale(0);
        transition: transform ease 0.2s;
        will-change: transform;
        position: absolute;
        top: 8px;
        left: 6px;
      }
      .checkbox input[type="checkbox"]:checked ~ label::before {
        color: ${colors.bgColor};
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
        -webkit-transform: translateY(-50%);
        transform: translateY(-50%);
      }
      .checkbox input[type="checkbox"]:focus + label::before {
        outline: 0;
      }
    </style>`)
  }

  function main () {
    let inited = false

    const notice_export_success = get_notifier_of(i18n.export_success)
    const notice_block_test_success = get_notifier_of(i18n.block_test_success)
    const notice_block_success = get_notifier_of(`${i18n.block_success}, 为了安全起见, 每次最多拉黑 300 个`)

    waitForKeyElements('h2#modal-header[aria-level="2"][role="heading"]', ele => {
      if (!inited) {
        insert_css()
        inited = true
      }
      const ancestor = get_ancestor(ele, 3)
      const currentURL = window.location.href
      if (/\/lists\/[0-9]+\/members$/.test(currentURL)) {
        mount_button(ancestor, i18n.export_btn, export_list_members, notice_export_success)
        mount_button(ancestor, i18n.block_test_btn, block_list_test_members, notice_block_test_success)
        mount_button(ancestor, i18n.block_btn, block_list_members, notice_block_success)
      }
    })
  }


  (function bonus() {
    if(!ChangeLogo) return;

    // Twitter logo
    const SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 335 276' fill='%233ba9ee'%3E%3Cpath d='m302 70a195 195 0 0 1 -299 175 142 142 0 0 0 97 -30 70 70 0 0 1 -58 -47 70 70 0 0 0 31 -2 70 70 0 0 1 -57 -66 70 70 0 0 0 28 5 70 70 0 0 1 -18 -90 195 195 0 0 0 141 72 67 67 0 0 1 116 -62 117 117 0 0 0 43 -17 65 65 0 0 1 -31 38 117 117 0 0 0 39 -11 65 65 0 0 1 -32 35'/%3E%3C/svg%3E"

    // Function to reset favicon
    document.querySelector(`head>link[rel="shortcut icon"]`).href = `//abs.twimg.com/favicons/twitter.ico`

    // Add style
    GM_addStyle(
      `header h1 a[href="/home"] {
        margin: 6px 4px 2px;
      }
      header h1 a[href="/home"] div {
          background-image: url("${SVG}");
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          margin: 4px;
      }
      header h1 a[href="/home"] div svg {
          display: none;
      }
      header h1 a[href="/home"] :hover :after {
          content: "已被 Twitter-Block-Porn 替换";
          font: message-box;
          color: gray;
          position: absolute;
          left: 48px;
      }`
    )
  })()

  main()
})()
