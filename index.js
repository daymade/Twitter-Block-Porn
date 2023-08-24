// ==UserScript==
// @name        Twitter Block Porn
// @homepage    https://github.com/daymade/Twitter-Block-Porn
// @icon        https://raw.githubusercontent.com/daymade/Twitter-Block-Porn/master/imgs/icon.svg
// @version     1.3.0
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
// @match       https://twitter.com/*
// @match       https://mobile.twitter.com/*
// @match       https://tweetdeck.twitter.com/*
// @exclude     https://twitter.com/account/*
// @require     https://cdn.jsdelivr.net/npm/axios@0.25.0/dist/axios.min.js
// @require     https://cdn.jsdelivr.net/npm/qs@6.10.3/dist/qs.min.js
// @require     https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// ==/UserScript==

/* global axios $ Qs */

const menu_command_list = GM_registerMenuCommand('打开共享黑名单 ①', function () {
  const url = 'https://twitter.com/i/lists/1677334530754248706/members'
  GM_openInTab(url, {active: true})
}, '');
const menu_command_member = GM_registerMenuCommand('打开共享黑名单 ②', function () {
  const url = 'https://twitter.com/i/lists/1683810394287079426/members'
  GM_openInTab(url, {active: true})
}, '');

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
    let cursor = -1;
    let allMembers = [];

    while (cursor != 0) {
      let response = await ajax.get(`/1.1/lists/members.json?list_id=${listId}&cursor=${cursor}`);
      let users = response.data.users;
      let members = users.map(u => u.id_str);
      allMembers = allMembers.concat(members);
      cursor = response.data.next_cursor;
    }

    return allMembers;
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

  function block_user (id) {
    ajax.post('/1.1/blocks/create.json', Qs.stringify({
      user_id: id
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  }

  async function block_list_test_members () {
    const listId = get_list_id()
    const members = await fetch_list_members_id(listId)

    members.slice(0, 10).forEach(block_user)
  }

  async function block_list_members () {
    const listId = get_list_id()
    const members = await fetch_list_members_id(listId)

    // 要拉黑的 id 包括: 
    // - 列表: https://twitter.com/i/lists/1677334530754248706
    // - 列表: https://twitter.com/i/lists/1683810394287079426
    // - 加急名单: 特别活跃/拉黑我/来挑衅的黄推
    const special_scammers = [
      "1006809281952403457",
      "1006809281952403500",
      "1028974736334675968",
      "1028974736334676000",
      "1030622996",
      "1041651592011739100",
      "1041651592011739141",
      "1055675184537948160",
      "1055675184537948200",
      "1056599336",
      "1070471063606153200",
      "1070471063606153216",
      "1072595030991224800",
      "1072595030991224837",
      "1082326572",
      "1084529220",
      "1084819945",
      "1084947870",
      "1095713324963123200",
      "1095713324963123202",
      "1102643170322583553",
      "1102643170322583600",
      "1113634156095762400",
      "1113634156095762432",
      "1127553297672327170",
      "1127553297672327200",
      "1136152412",
      "1157213663805263873",
      "1157213663805264000",
      "1196883788279758800",
      "1196883788279758855",
      "1205938403122012162",
      "1205938403122012200",
      "122728970",
      "1229119940105367552",
      "1229119940105367600",
      "1230857281798950917",
      "1230857281798951000",
      "123098243",
      "1237405727213391873",
      "1237405727213392000",
      "1255916735531802600",
      "1255916735531802627",
      "1259735510907486200",
      "1259735510907486209",
      "1278090573249822700",
      "1278090573249822721",
      "1278442885",
      "1279759519",
      "1331070179942440966",
      "1331070179942441000",
      "1338322802756231171",
      "1338322802756231200",
      "1349896547870367700",
      "1349896547870367747",
      "1359027938969047000",
      "1359027938969047041",
      "1359143915773857796",
      "1359143915773857800",
      "1361400627377565696",
      "1361400627377565700",
      "1371715729813352400",
      "1371715729813352450",
      "1378162942877827000",
      "1378162942877827072",
      "1380854923",
      "1380896858680164360",
      "1380896858680164400",
      "1381001119174946800",
      "1381001119174946818",
      "1389974264141336581",
      "1389974264141336600",
      "1392092690032992261",
      "1392092690032992300",
      "1401414397021417472",
      "1401414397021417500",
      "1410985098829131779",
      "1410985098829131800",
      "1412750531429158922",
      "1412750531429159000",
      "1415507651618803700",
      "1415507651618803712",
      "1445236680647057400",
      "1445236680647057409",
      "1452806833",
      "1459792864267829200",
      "1459792864267829257",
      "1463148960315371500",
      "1463148960315371524",
      "1465846849894551558",
      "1465846849894551600",
      "1473948049336459266",
      "1473948049336459300",
      "1482137949756358657",
      "1482137949756358700",
      "1483680839015833600",
      "1485243105737871366",
      "1485243105737871400",
      "1487775260741099500",
      "1487775260741099524",
      "1488736523856261000",
      "1488736523856261122",
      "1499232092693012483",
      "1499232092693012500",
      "1509442191545888769",
      "1509442191545888800",
      "1512479699313831937",
      "1512479699313832000",
      "1513578609398665200",
      "1513578609398665216",
      "1519117582112108500",
      "1519117582112108544",
      "1520257335515525000",
      "1520257335515525123",
      "1521742332894265300",
      "1521742332894265344",
      "1522387936582504400",
      "1522387936582504449",
      "1524923592957657000",
      "1524923592957657088",
      "1525904254313299968",
      "1525904254313300000",
      "1549214332143431680",
      "1549214332143431700",
      "1549711164984045568",
      "1549711164984045600",
      "1553957596632977400",
      "1553957596632977408",
      "1557004176923959298",
      "1557004176923959300",
      "1557857917205880800",
      "1557857917205880832",
      "1561988460390813696",
      "1561988460390813700",
      "1563929844898942976",
      "1563929844898943000",
      "1565182492969418753",
      "1565182492969418800",
      "156530386",
      "1567811421173596160",
      "1567811421173596200",
      "1567884283112751000",
      "1567884283112751110",
      "1579439842005422000",
      "1579439842005422081",
      "1582689543567732700",
      "1582689543567732737",
      "1583621564561432577",
      "1583621564561432600",
      "1584261717252608000",
      "1584279126759772160",
      "1584279126759772200",
      "1586610616332357600",
      "1586610616332357633",
      "1587662068672385000",
      "1587662068672385024",
      "1588032040108179500",
      "1588126745038684160",
      "1588126745038684200",
      "1588494438888013800",
      "1588494438888013824",
      "1588998522799620000",
      "1588998522799620096",
      "1589414395272396800",
      "1590272269913231361",
      "1590272269913231400",
      "1590425776389820400",
      "1590425776389820417",
      "1592749093939712000",
      "1592749093939712001",
      "1593135781203562496",
      "1593135781203562500",
      "1593310712398417922",
      "1593310712398418000",
      "1593948328483430400",
      "1594160942043918300",
      "1594160942043918338",
      "1594348069830762497",
      "1594348069830762500",
      "1594349841617854464",
      "1594349841617854500",
      "1594646652253372400",
      "1594646652253372417",
      "1594683023903326200",
      "1594683023903326210",
      "1595449263076438000",
      "1595449263076438016",
      "1595679318990110700",
      "1595679318990110725",
      "1596291639483731968",
      "1596291639483732000",
      "1596294526649368576",
      "1596294526649368600",
      "1596336603638960000",
      "1596336603638960132",
      "1596351277591851000",
      "1596351277591851008",
      "1596351809156575200",
      "1596351809156575232",
      "1596365899325272000",
      "1596365899325272065",
      "1596640616972259300",
      "1596640616972259328",
      "1597127315904819200",
      "1597127315904819201",
      "1599795139148451800",
      "1599795139148451844",
      "1600381294344429573",
      "1600381294344429600",
      "1606969046313861000",
      "1606969046313861120",
      "1607184768373821400",
      "1607184768373821441",
      "1613465054472736770",
      "1613465054472736800",
      "161486183",
      "1615022548122734594",
      "1615022548122734600",
      "1616424453310918657",
      "1616424453310918700",
      "1619102286684520400",
      "1619102286684520450",
      "1621454596433657857",
      "1621454596433657900",
      "1622205141016535000",
      "1622205141016535040",
      "1622925598808223700",
      "1622925598808223744",
      "1623164251098742784",
      "1623164251098742800",
      "1623529981044310000",
      "1623529981044310017",
      "1624732331075584000",
      "1625434682065326000",
      "1625434682065326081",
      "1625435154230677500",
      "1625435154230677507",
      "1625475004292042752",
      "1625475004292042800",
      "1625868873319989200",
      "1625868873319989250",
      "1627241292957683700",
      "1627241292957683712",
      "1627733832215719936",
      "1627733832215720000",
      "1627822649069162496",
      "1627822649069162500",
      "1627980405700984800",
      "1627980405700984832",
      "1628097113807806464",
      "1628097113807806500",
      "1628407264402108400",
      "1628407264402108418",
      "1629349000121053185",
      "1629349000121053200",
      "1629962455240650755",
      "1629962455240650800",
      "1630570991066955776",
      "1630570991066955800",
      "1632826987776704500",
      "1632826987776704512",
      "1633639619479896000",
      "1633639619479896064",
      "1633746269150773200",
      "1633746269150773248",
      "1634205836619972600",
      "1634205836619972608",
      "1635173336069308400",
      "1635173336069308416",
      "1635175763627393000",
      "1635175763627393024",
      "1635239048963825664",
      "1635239048963825700",
      "1635469768881831936",
      "1635469768881832000",
      "1636133130389311488",
      "1636133130389311500",
      "1636163498379218944",
      "1636163498379219000",
      "1636289544306966500",
      "1636289544306966528",
      "1636366957669670913",
      "1636366957669671000",
      "1636367676615557000",
      "1636367676615557121",
      "1636515210033872899",
      "1636515210033873000",
      "1636539550083461000",
      "1636539550083461120",
      "1636562589420519400",
      "1636562589420519424",
      "1637118222636908500",
      "1637118222636908544",
      "1637653471498489857",
      "1637653471498489900",
      "1639222655617314800",
      "1639222655617314816",
      "1640266734895521794",
      "1640266734895521800",
      "1642380094563049473",
      "1642380094563049500",
      "1642503707165364200",
      "1642503707165364225",
      "1644670200510554000",
      "1644670200510554112",
      "1645416982575996930",
      "1645416982575997000",
      "1645793198378463200",
      "1645793198378463238",
      "1645940317022040000",
      "1645940317022040065",
      "1648976985413267458",
      "1648976985413267500",
      "1650057579752718300",
      "1650057579752718336",
      "1650702293182951400",
      "1650702293182951429",
      "1650823160512794600",
      "1650823160512794624",
      "1651248919815532500",
      "1651248919815532544",
      "1652712382559289300",
      "1652712382559289345",
      "1654136888394121200",
      "1654136888394121217",
      "1655367412253065200",
      "1655367412253065217",
      "1655367597062520800",
      "1655367597062520834",
      "1655367614942818300",
      "1655367614942818304",
      "1655367634828038100",
      "1655367634828038145",
      "1655774802156851200",
      "1655774802156851201",
      "1655777850384072700",
      "1655777850384072704",
      "1655966818715025400",
      "1655966818715025408",
      "1656562700623962000",
      "1656562700623962113",
      "1656820138178486272",
      "1656820138178486300",
      "1657419538982420482",
      "1657419538982420500",
      "1660850802221809665",
      "1660850802221809700",
      "1661096624934862800",
      "1661096624934862848",
      "1661221121578917888",
      "1661221121578918000",
      "1662171717366865920",
      "1662171717366866000",
      "1662257575197548500",
      "1662257575197548545",
      "1663247638702227457",
      "1663247638702227500",
      "1663334803",
      "1666050299939934200",
      "1666050299939934208",
      "1667178863791685600",
      "1667178863791685635",
      "1667212881799127000",
      "1667212881799127040",
      "1668637262391951360",
      "1668637262391951400",
      "1670138989876252672",
      "1670138989876252700",
      "1670243582786281473",
      "1670243582786281500",
      "1670642644576514000",
      "1670642644576514048",
      "1670763182863028200",
      "1670763182863028224",
      "1670799377865101300",
      "1670799377865101313",
      "1672652437709295600",
      "1672652437709295617",
      "1672653537594195969",
      "1672653537594196000",
      "1672944950827438000",
      "1672944950827438080",
      "1672993829505617922",
      "1672993829505618000",
      "1674996723868131300",
      "1674996723868131328",
      "1675974659341430785",
      "1675974659341430800",
      "1681827822489452500",
      "1681827822489452544",
      "1682055876243513300",
      "1682055876243513344",
      "1682064664337825796",
      "1682064664337825800",
      "1683738213842825200",
      "1683738213842825216",
      "1686285801817026560",
      "1686285801817026600",
      "1686767825434914800",
      "1686767825434914816",
      "1691005854567272400",
      "1691005854567272448",
      "1691396614739701760",
      "1691396614739701800",
      "1691548948240994300",
      "1691548948240994304",
      "1691740695940272000",
      "1691740695940272128",
      "187000176",
      "189675757",
      "193416577",
      "2169405224",
      "2229671982",
      "2230998305",
      "2295164090",
      "2313973027",
      "2348511675",
      "240799373",
      "2418893163",
      "2422331525",
      "2429177309",
      "244342591",
      "247999913",
      "2532826655",
      "2565780797",
      "257451463",
      "259253700",
      "2592579935",
      "2614060207",
      "2687477976",
      "2697059436",
      "2697243901",
      "2697880079",
      "2699853734",
      "2777764162",
      "279121654",
      "282895030",
      "2886092383",
      "289894681",
      "2959807423",
      "2970256629",
      "2972451170",
      "2976105362",
      "2987201046",
      "300766001",
      "3012444319",
      "308025277",
      "3119532162",
      "314713909",
      "3152102494",
      "3159185881",
      "3168034086",
      "3185826676",
      "3187289986",
      "3193923902",
      "3215220645",
      "3219505345",
      "3219700285",
      "324119246",
      "3269947842",
      "3340694236",
      "3488528056",
      "3817641376",
      "3968087834",
      "406631114",
      "407561149",
      "4618689152",
      "491053241",
      "531122102",
      "532002932",
      "532015135",
      "532101363",
      "532101948",
      "532522819",
      "532575054",
      "532577613",
      "532579321",
      "541810578",
      "544324076",
      "546231012",
      "548729198",
      "562131867",
      "570141079",
      "598356085",
      "620767896",
      "707799803",
      "710494611043647488",
      "710494611043647500",
      "718476068",
      "718526295550898176",
      "718526295550898200",
      "719941638",
      "742346479",
      "758216593",
      "764311604",
      "786061291",
      "79888125",
      "839053386",
      "892492872",
      "895101902895013888",
      "895101902895013900",
      "937149576489861100",
      "937149576489861120",
      "972389473727102976",
      "972389473727103000",
      "1636303223911849986",
      "532085468",
      "1602112341134708736",
      "532605711",
      "593711290",
      "1919312204",
      "2800094641",
      "1585644302381694976",
      "1580799004983508992",
      "1578298585514668032",
      "824376009029992456"
    ]

    // 去重
    const unique_scammers = [...new Set(special_scammers)];
    
    members.concat(unique_scammers)
          .slice(0, 1000)
          .forEach(block_user)
  }

  async function export_list_members () {
    const listId = get_list_id();
    const members = await fetch_list_members_info(listId);
    
    // 创建一个 Blob 实例，包含 JSON 字符串的成员信息
    const blob = new Blob([JSON.stringify(members, null, 2)], {type : 'application/json'});
  
    // 创建一个下载链接并点击它来下载文件
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "members.json";
    link.click();
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
    const notice_block_success = get_notifier_of(`${i18n.block_success}, 为了安全起见, 每次最多拉黑 1000 个`)

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

  (function bonus () {
    // Constants for URL and SVG content
    const TWITTER_ICON_URL = `https://abs.twimg.com/favicons/twitter.ico`;
    const TWITTER_SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#1d9bf0" class="bi bi-twitter" viewBox="0 0 16 16">
        <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
    </svg>`;
    const TOOLTIP_TEXT = "已被 Twitter-Block-Porn 替换为纯净版";
    const TOOLTIP_ID = "tooltip42";

    // Function to create new SVG element
    function createTwitterSvgElement() {
      let div = document.createElement('div');
      div.innerHTML = TWITTER_SVG_CONTENT;
      return div.querySelector('svg');
    }

    // Function to create tooltip element
    function createTooltipElement() {
      let tooltip = document.createElement('div');
      tooltip.textContent = TOOLTIP_TEXT;
      tooltip.style.position = 'absolute';
      tooltip.style.background = 'white';
      tooltip.style.border = '1px solid black';
      tooltip.style.padding = '5px';
      tooltip.id = TOOLTIP_ID;
      return tooltip;
    }

    // Function to reset favicon
    function resetFavicon() {
        let favicon = document.querySelector(`head>link[rel="shortcut icon"]`);
        if (favicon !== null) {
            favicon.href = TWITTER_ICON_URL;
        }
    }

    // Function to replace Twitter logo
    function replaceTwitterLogo() {
      let twitterLogo = document.querySelector('h1[role="heading"] svg');
      if (twitterLogo === null) {
          return;
      }
      let newSvgElement = createTwitterSvgElement();
      twitterLogo.replaceWith(newSvgElement);

      // Add mouseover and mouseout events to the SVG element
      newSvgElement.parentNode.addEventListener('mouseover', function(event) {
          // Remove existing tooltip if exists
          let existingTooltip = document.getElementById(TOOLTIP_ID);
          if (existingTooltip) {
              existingTooltip.remove();
          }

          let tooltip = createTooltipElement();
          tooltip.style.top = (event.clientY + 10) + 'px';
          tooltip.style.left = (event.clientX + 10) + 'px';
          document.body.appendChild(tooltip);
      });
      newSvgElement.parentNode.addEventListener('mouseout', function() {
          let tooltip = document.getElementById(TOOLTIP_ID);
          if (tooltip) {
              tooltip.remove();
          }
      });
    }

    // Reset favicon immediately
    resetFavicon();

    setInterval(replaceTwitterLogo, 1000);
  })()

  main()
})()
