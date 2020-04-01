# Twitter-Block-With-Love
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Intro
Block users who loves a specific tweet, and help you improve your experience using Twitter.

## Install
### For Chrome, Opera Users
Visit https://greasyfork.org/en/scripts/398540-twitter-block-with-love and install. You may also need to install a script manager like the Tampermonkey or Greasemonkey.

### For Firefox Users
Tampermonkey cannot work on twitter.com on Firefox with `security.csp.enable` set to true by default. So use Greasemonkey or turn off `security.csp.enable`.

## Usage

1. Go to the "Liked by" page of a tweet which shows you the list of likers.

2. Click the "Block ALL" button.

![](imgs/after.png)

## Notice

- This script has not been tested for tweets that are liked by over 1000 people.
- The block operation ***CANNOT BE UNDONE***. **Think twice** before blocking and consider whether you really need to block that group of users.
- You can only block users shown in the likers' page. There will sometimes be users who like a tweet but cannot be shown in the list. This script cannot block them.

