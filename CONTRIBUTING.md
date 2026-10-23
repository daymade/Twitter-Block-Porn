

## 代码贡献

在 [Twitter-Block-Porn's Roadmap](https://github.com/users/daymade/projects/3) 中的 [issue](https://github.com/daymade/Twitter-Block-Porn/issues?q=is%3Aissue+is%3Aopen+label%3AProposal) 都是待实现的，欢迎大家贡献代码，可以直接 fork 代码后提 PR 给我.

提其他 PR 时, 请简要说明 PR 的目的和改动, 以及测试方法.

## 黑名单贡献

有两种方式可以举报诈骗账号:

1. 去 github 上提 issue([示例](https://github.com/daymade/Twitter-Block-Porn/issues/4)), 附上 screen_name 或者 id_str 或者任何可以定位的链接, 我来添加, 你也可以直接 fork 代码后提 PR 给我.
2. 给我一个 List 链接, 我可以直接让用户跳转到你维护的列表.

**注意**: 为了避免重复工作, 举报前请先拉黑所有名单, 只举报漏网之鱼.

举报前请先在[账号库](https://github.com/daymade/Twitter-Block-Porn/blob/master/lists/all.json)里搜索（Ctrl+F 或 Command+F) 要举报的账号名称或 @id，看账号是否已经收录。

<img width="619" alt="image" src="https://github.com/daymade/Twitter-Block-Porn/assets/4291901/09ec7353-8c7b-4c50-ba80-db54b2d450e3">

## 公共名单维护

名单输入、记录格式、历史合并及输出合同以 [merge.sh](merge.sh) 为准；平台完整导出放入其快照目录，加急补录使用[加急名单原件](lists/block.json)。保留平台给出的字符串账号 ID，不用数字转换或猜测补齐缺失身份。

在仓库根目录使用已有 Bash、jq 和 Node.js，先验证再合并：

```sh
node --test merge.test.cjs
bash merge.sh
git diff -- lists
```

合并会修改名单文件，先保全相关未提交工作；测试只使用临时合成数据。输入或计算失败时不替换发布文件，按错误检查原导出与历史文件，不以清空历史或删掉坏记录代替完整导出。发布阶段的 I/O 错误会停止并报告，多个文件替换不保证断电原子性；先核对实际 diff 再处理。

自动运行的触发、分支及提交步骤以 [Action](.github/workflows/action.yml) 为准。没有生成变化时成功退出；有变化时仅暂存名单目录。不要手维护快照投影或汇总文件来代替合并。代码或本地合并通过，不代表远端名单已更新；贡献合入后还需从插件实际读取的远端名单核对结果。

