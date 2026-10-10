# Twitter-Block-Porn 工程入口

本仓继续承载油猴脚本、名单处理与社区贡献实现，不另建插件仓。共享黑名单的业务决定只读 [业务背景](../blocklist-cloud/docs/业务背景与目标.md)，验收、冻结版本与私有证据读 [工程入口](../blocklist-cloud/CLAUDE.md)；真人感游戏归 [shiaime](../shiaime/AGENTS.md)。

个人反馈模块位于 `personal-feedback/`，构建入口为 `personal-feedback/build.mjs`。开发 worktree 与本仓共享 Git 对象，但主 checkout 和原生已安装版本可能不同。动手前核对当前 HEAD、工作树及相关验收的 source_commit，从不可变 ref 读取基线；不覆盖已有 `index.js` 或未跟踪模块，不因“复用本仓”自动合并其他会话分支。

主 checkout 的早期 `personal-feedback/README.md` 不定义当前 Jev 接入或原生验收状态；当前操作以工程入口所链的已验收源码 README 为准。更新仍沿用同一 Tampermonkey 条目以保留个人数据；公开发布与 X 账号动作遵守业务入口的授权。
