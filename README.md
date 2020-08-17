# Twitter-Block-With-Love
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Intro
Improve your Twitter experience by mass blocking or muting all the Twitter users who like or RT a specific tweet, with love.

## Install
Visit https://greasyfork.org/en/scripts/398540-twitter-block-with-love and install. You may also need to install a script manager like [**Tampermonkey**](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=zh-CN) for Chrome or [**Greasemonkey**](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) for Firefox, or [Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/) for Firefox Android.

If you are using Tampermonkey on Firefox and run into unexcepted problems, please refer to [this issue](https://github.com/E011011101001/Twitter-Block-With-Love/issues/1#issuecomment-606785462). Turning off `security.csp.enable` on [about:config](about:config) may help.

## Usage

1. Block or mute Likers
  - Go to the "Liked by" page of a tweet which shows you the list of likers.
  - Click the "Block all" or "Mute all" button.
  - If you selected "Include the original Tweeter", you may need to refresh the page to see the effects.
 ![](https://raw.githubusercontent.com/E011011101001/Twitter-Block-With-Love/master/imgs/after.png)

2. Block or mute Retweeters
   - Go to the "Retweets" page, and click "Block all".
   - **Notice: **Only blocking users who have retweeted without comments.

## Notice

- Blocking too many users in a 15-minute interval may cause you automatically logged out. For More details please [click here](https://developer.twitter.com/en/docs/basics/rate-limiting).
- This userscript cannot block users who have blocked you or whose account is set private.
- This userscript does not support leaving out your followings or followers when blocking.
- The blocking operation ***CANNOT BE UNDONE***. **Think twice** before blocking and consider whether you really need to block that group of users.

## Feedback

- If you like this script, you can recommend it to your friends, rate it on [Greasyfork](https://greasyfork.org/en/scripts/398540-twitter-block-with-love/feedback), or go to the [Github repo page](https://github.com/E011011101001/Twitter-Block-With-Love) and give me a star!
- Feel free to open an issue on Github if you find any bugs or have any questions or suggestions.

