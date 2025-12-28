# slack-search-result-exporter

Exports Slack messages as TSV from Search results.

[ages/demo.mp4](https://github.com/user-attachments/assets/95238129-c958-40c7-8fb0-63a151d1d45b)


# How to use

* Register bookmarklet
  1. Open https://github.com/xshoji/slack-search-result-exporter/blob/main/slack-search-result-exporter.js
  1. Copy script
  1. Edit any bookmark
  1. Set copied script with `javascript:` prefix to URL form.
  1. Set bookmark name e.g. `slack-search-result-exporter`

* Run bookmarklet 
  1. Open slack.com
  1. Search messages and wait results
  1. Click bookmarklet

\* Please allow the popup.

# Tips for Searching in Slack

```
# Search for messages containing my name between 2025/01/01 and 2025/01/31
xshoji -from:me after:2024-12-31 before:2025-02-01

# Search for messages from myself between 2025/01/01 and 2025/01/31
from:me after:2024-12-31 before:2025-02-01

# Search for messages from @example to me (excluding DMs)
from:@example xshoji -is:dm
```
