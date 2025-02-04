// ==UserScript==
// @name         ABC iview
// @description  Improve site usability. Watch videos in external player.
// @version      1.0.0
// @include      /https?:\/\/iview\.abc\.net\.au\/(?:[^\/]+\/)*video\/(?:[^\/?#]+)(?:[#\?\/].*)?$/
// @icon         https://iview.abc.net.au/img/ABC_iviewicon_76x76.png
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js
// @run-at       document-start
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-9now/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-9now/issues
// @downloadURL  https://github.com/warren-bank/crx-9now/raw/webmonkey-userscript/es5/webmonkey-userscript/9now.user.js
// @updateURL    https://github.com/warren-bank/crx-9now/raw/webmonkey-userscript/es5/webmonkey-userscript/9now.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- user options

var user_options = {
  "webmonkey": {
    "post_intent_redirect_to_url":  "about:blank"
  },
  "greasemonkey": {
    "redirect_to_webcast_reloaded": true,
    "force_http":                   true,
    "force_https":                  false
  }
}

// ----------------------------------------------------------------------------- state

var state = {
  videoData:          null,
  videoId:            null,
  episodeHouseNumber: null
}

// ----------------------------------------------------------------------------- helpers (xhr)

var serialize_xhr_body_object = function(data) {
  if (typeof data === 'string')
    return data

  if (!(data instanceof Object))
    return null

  var body = []
  var keys = Object.keys(data)
  var key, val
  for (var i=0; i < keys.length; i++) {
    key = keys[i]
    val = data[key]
    val = unsafeWindow.encodeURIComponent(val)

    body.push(key + '=' + val)
  }
  body = body.join('&')
  return body
}

var download_text = function(url, headers, data, callback) {
  if (data) {
    if (!headers)
      headers = {}
    if (!headers['content-type'])
      headers['content-type'] = 'application/x-www-form-urlencoded'

    switch(headers['content-type'].toLowerCase()) {
      case 'application/json':
        data = JSON.stringify(data)
        break

      case 'application/x-www-form-urlencoded':
      default:
        data = serialize_xhr_body_object(data)
        break
    }
  }

  var xhr    = new unsafeWindow.XMLHttpRequest()
  var method = data ? 'POST' : 'GET'

  xhr.open(method, url, true, null, null)

  if (headers && (typeof headers === 'object')) {
    var keys = Object.keys(headers)
    var key, val
    for (var i=0; i < keys.length; i++) {
      key = keys[i]
      val = headers[key]
      xhr.setRequestHeader(key, val)
    }
  }

  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        callback(xhr.responseText)
      }
    }
  }

  if (data)
    xhr.send(data)
  else
    xhr.send()
}

var download_json = function(url, headers, data, callback) {
  if (!headers)
    headers = {}
  if (!headers.accept)
    headers.accept = 'application/json'

  download_text(url, headers, data, function(text){
    try {
      callback(JSON.parse(text))
    }
    catch(e) {}
  })
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_data, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.greasemonkey.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.greasemonkey.force_https

  var encoded_video_url, encoded_caption_url, encoded_referer_url, encoded_drm_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url      = encodeURIComponent(encodeURIComponent(btoa(video_data.video_url)))
  encoded_caption_url    = video_data.caption_url ? encodeURIComponent(encodeURIComponent(btoa(video_data.caption_url))) : null
  video_data.referer_url = video_data.referer_url ? video_data.referer_url : unsafeWindow.location.href
  encoded_referer_url    = encodeURIComponent(encodeURIComponent(btoa(video_data.referer_url)))
  encoded_drm_url        = (video_data.drm.scheme && video_data.drm.server) ? encodeURIComponent(encodeURIComponent(btoa(video_data.drm.scheme + '|' + video_data.drm.server))) : null

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (video_data.video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base    + '#/watch/'    + encoded_video_url
                            + (encoded_caption_url ? ('/subtitle/' + encoded_caption_url) : '')
                            + (encoded_referer_url ? ('/referer/'  + encoded_referer_url) : '')
                            + (encoded_drm_url     ? ('/drm/'      + encoded_drm_url) : '')

  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL handlers

var redirect_to_url = function(url) {
  if (!url) return

  if (typeof GM_loadUrl === 'function') {
    if (typeof GM_resolveUrl === 'function')
      url = GM_resolveUrl(url, unsafeWindow.location.href) || url

    GM_loadUrl(url, 'Referer', unsafeWindow.location.href)
  }
  else {
    try {
      unsafeWindow.top.location = url
    }
    catch(e) {
      unsafeWindow.window.location = url
    }
  }
}

var process_webmonkey_post_intent_redirect_to_url = function() {
  var url = null

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'string')
    url = user_options.webmonkey.post_intent_redirect_to_url

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'function')
    url = user_options.webmonkey.post_intent_redirect_to_url()

  if (typeof url === 'string')
    redirect_to_url(url)
}

// -----------------------------------------------------------------------------

var process_video_data = function(data) {
  if (!data.video_url) return

  if (!data.referer_url)
    data.referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    if (!data.video_type)
      data.video_type = determine_video_type(data.video_url)

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ data.video_url,
      /* type   = */ data.video_type
    ]

    // extras:
    if (data.caption_url) {
      args.push('textUrl')
      args.push(data.caption_url)
    }
    if (data.referer_url) {
      args.push('referUrl')
      args.push(data.referer_url)
    }
    if (data.drm.scheme) {
      args.push('drmScheme')
      args.push(data.drm.scheme)
    }
    if (data.drm.server) {
      args.push('drmUrl')
      args.push(data.drm.server)
    }
    if (data.drm.headers && (typeof data.drm.headers === 'object')) {
      var drm_header_keys, drm_header_key, drm_header_val

      drm_header_keys = Object.keys(data.drm.headers)
      for (var i=0; i < drm_header_keys.length; i++) {
        drm_header_key = drm_header_keys[i]
        drm_header_val = data.drm.headers[drm_header_key]

        args.push('drmHeader')
        args.push(drm_header_key + ': ' + drm_header_val)
      }
    }

    GM_startIntent.apply(this, args)
    process_webmonkey_post_intent_redirect_to_url()
    return true
  }
  else if (user_options.greasemonkey.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(
      get_webcast_reloaded_url(data)
    )
    return true
  }
  else {
    return false
  }
}

var process_hls_data = function(data) {
  data.video_type = 'application/x-mpegurl'
  process_video_data(data)
}

var process_dash_data = function(data) {
  data.video_type = 'application/dash+xml'
  process_video_data(data)
}

// -----------------------------------------------------------------------------

var process_video_url = function(video_url, video_type, caption_url, referer_url, drm_scheme, drm_server) {
  var data = {
    video_url:   video_url   || null,
    video_type:  video_type  || null,
    caption_url: caption_url || null,
    referer_url: referer_url || null,
    drm: {
      scheme:    drm_scheme,
      server:    drm_server,
      headers:   null
    }
  }

  process_video_data(data)
}

var process_hls_url = function(hls_url, caption_url, referer_url, drm_scheme, drm_server) {
  process_video_url(/* video_url= */ hls_url, /* video_type= */ 'application/x-mpegurl', caption_url, referer_url, drm_scheme, drm_server)
}

var process_dash_url = function(dash_url, caption_url, referer_url, drm_scheme, drm_server) {
  process_video_url(/* video_url= */ dash_url, /* video_type= */ 'application/dash+xml', caption_url, referer_url, drm_scheme, drm_server)
}

// ----------------------------------------------------------------------------- API: extract video data

var extract_video_data = function(rawData) {
  var videoData = {
    video_url:   null,
    video_type:  null,
    caption_url: null,
    referer_url: null,
    drm: {
      scheme:  null,
      server:  null,
      headers: null
    }
  }

  if (!rawData || (typeof rawData !== 'object') || !Array.isArray(rawData.playlist) || !rawData.playlist.length) return

  var type_whitelist   = ['program', 'livestream']
  var stream_whitelist = ['1080', '720', 'sd', 'sd-low']
  var item, quality
  for (var i=0; i < rawData.playlist.length; i++) {
    item = rawData.playlist[i]

    if (!item || (typeof item !== 'object') || !item.type || (type_whitelist.indexOf(item.type) === -1)) continue

    if (!item.streams || !item.streams.hls) continue

    for (var j=0; j < stream_whitelist.length; j++) {
      quality = stream_whitelist[j]

      if (!item.streams.hls[quality]) continue

      videoData.video_url  = item.streams.hls[quality]
      videoData.video_type = 'application/x-mpegurl'
      break
    }
    if (videoData.video_url) {
      if (item.captions && item.captions['src-vtt']) {
        videoData.caption_url = item.captions['src-vtt']
      }

      break
    }
  }
  if (!videoData.video_url || !videoData.video_type) return

  state.videoData = videoData
}

// ----------------------------------------------------------------------------- bootstrap

var page_init = function() {
  var url_regex = /https?:\/\/iview\.abc\.net\.au\/(?:[^\/]+\/)*video\/([^\/?#]+)(?:[#\?\/].*)?$/
  var url       = unsafeWindow.location.href

  var url_match = url_regex.exec(url)
  if (!url_match) return
  state.videoId = url_match[1]

  download_json(
    'https://iview.abc.net.au/api/programs/' + state.videoId,
    null,
    null,
    function(data) {
      extract_video_data(data)
      if (!state.videoData) return

      state.episodeHouseNumber = data.episodeHouseNumber
      data = null

      var time_seconds = Math.floor( Date.now() / 1000 )

      var path = '/auth/hls/sign?ts=' + time_seconds + '&hn=' + (state.episodeHouseNumber || state.videoId) + '&d=android-tablet'
      var sig  = CryptoJS.HmacSHA256(path, 'android.content.res.Resources').toString(CryptoJS.enc.Hex)

      var url = unsafeWindow.location.protocol + '//iview.abc.net.au' + path + '&sig=' + sig
      console.log(url)

      download_text(
        url,
        null,
        null,
        function(token) {
          var qs_sep = (state.videoData.video_url.indexOf('?') === -1) ? '?' : '&'

          state.videoData.video_url += qs_sep + 'hdnea=' + token

          process_video_data(state.videoData)
        }
      )
    }
  )
}

page_init()
