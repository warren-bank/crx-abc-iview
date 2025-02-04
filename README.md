### [ABC iview](https://github.com/warren-bank/crx-abc-iview/tree/webmonkey-userscript/es5)

[Userscript](https://github.com/warren-bank/crx-abc-iview/raw/webmonkey-userscript/es5/webmonkey-userscript/abc-iview.user.js) to run in:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application
  - for Android
* the [Tampermonkey](https://www.tampermonkey.net/) web browser extension
  - for [Firefox/Fenix](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
  - for [Chrome/Chromium](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* the [Violentmonkey](https://violentmonkey.github.io/) web browser extension
  - for [Firefox/Fenix](https://addons.mozilla.org/firefox/addon/violentmonkey/)
  - for [Chrome/Chromium](https://chrome.google.com/webstore/detail/violent-monkey/jinjaccalgkegednnccohejagnlnfdag)

Its purpose is to:
* redirect embedded videos from [iview.abc.net.au](https://iview.abc.net.au/) to an external player

#### Notes:

* the data API endoint to obtain the URL for video streams can only be accessed from within Australia
  - a VPN is required from elsewhere to query the data API endoint
  - login is _not_ required
* the URL for video streams can only be accessed from within Australia
  - a VPN is required from elsewhere to watch the video streams
  - login is _not_ required
  - _Referer_ request header is _not_ required

#### Credits:

* [yt-dlp extractor](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/abc.py)
  - provided a roadmap for the needed methodology

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
