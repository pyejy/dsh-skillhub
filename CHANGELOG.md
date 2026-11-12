# Changelog

## 1.1.0

### 新功能：插件层级

- 面板新增第三个视图「插件」，与「技能」「MCP」并列。插件是一组技能的上级：
  - 插件行显示包名和它提供的技能数量，一个开关管整包；
  - 展开后可以单独开关这个包里的每个技能；
  - **上级插件关闭时，它的技能自动变为关闭并置灰、不可操作**，并标注「由上级插件关闭」。子项自己存的值不会被改写，插件重新打开后立即恢复原来的开关状态。
- 实现方式：SkillHub 再注册一个 rank 340 的影子 provider，按名字接管包内技能（打包技能用的是 `BUNDLED_SKILL_RANK = 600`，rank 小的赢），由它决定这些技能对模型是否可见；插件与技能闸门沿用现有三层作用域（全局 / 本项目 / 本对话），键名为 `plugin:<包名>` 与 `bundle:<包名>:<技能名>`，仍然是 version 2 文档，旧数据无需迁移。
- 供电校验：读取插件贡献时会核对 Loader 里的启用状态。在插件管理器里被停用的包不再参与接管，它的技能也不会因为磁盘上还留着文件而被重新供给；重新启用后自动恢复（缓存保留，只在实际读取时过滤）。
- 发现：启动时从技能注册表取「provider 不是本插件、且文件位于 `node_modules` 内」的技能，再按包内 `skills/`、`own-skills/` 重扫补全，结果缓存到 `$DSH_HOME/skillhub/bundles.json`；包增减技能会自动跟上。

### 新功能：组合层级

- 面板新增第四个视图「组合」，把「属于同一件事」的技能与 MCP 服务收在一个总开关下：
  - **能力组合**：技能与 MCP 服务器同名（如 `abaqus` ↔ `abaqus`）时自动成为一组；
  - **家族组合**：`<base>-*` 且 `<base>` 本身也是技能时（如 `ponytail` + `ponytail-audit/-debt/-gain/-help/-review`、`office` + `office-*`）收成一组。
- 组合关闭时，成员在组合页、技能页、MCP 页**一律显示为关、置灰、不可点击**，并标注由哪个组合关闭；成员自己存的值不变，组合重新打开即恢复。
- 闸门键 `group:<名字>`，与插件/技能/MCP 共用同一份三层作用域文档。接口 `GET /skillhub/groups`、`POST /skillhub/groups/toggle`。

### 工程

- 新增 `scripts/build-local.mjs`：不依赖 DSHX checkout，用 esbuild + lightningcss 直接产出宿主 bundle 和浏览器 bundle（`node scripts/build-local.mjs [host|client|all]`），并把 `esbuild` 加进 devDependencies。
- 新增 `tsconfig.client.json`（客户端类型检查）与 `tests/bundles.test.mjs`（包归属解析、包扫描、缓存往返、发现合并、父级闸门与置灰语义、项目层传导、影子 provider 的 rank 与可见性；以及组合的合并规则与「父关锁子」语义）。

## 1.0.10

### 适配 DeepSeek Harness 0.2.2

- 修复 0.2.2 上对话输入框上方的「技能」胶囊整个消失：0.2.2 的 `@deepseek-ai/dsh-client-ui-primitives` 移除了 `useAnchoredPosition`（官方升级指引 `v0.2.2-alpha.2/css-anchored-menus`），1.0.9 在胶囊首次渲染时调用它会抛错，插槽子树随之卸载。改为 CSS Anchor Positioning：触发器声明 `anchor-name`，弹出层用 `position-anchor` + `top: anchor(bottom)` 跟随，空间不足时靠 `flip-block` 翻到上方。不支持锚点属性的浏览器仍走原来的测量兜底（下沿对齐、越界翻转、视口内收边）。
- `engines.dsh` 放宽为 `>=0.2.1-rc.1 <0.3.0`，`peerDependencies` / `devDependencies` 同步放宽；`@deepseek-ai/cordis` 接受 4.1.0，`@deepseek-ai/schemastery` 接受 3.19.0。1.0.9 的 `<0.2.2` 上界会让 0.2.2 上的安装被判为版本不匹配。
- 设置页 `skill&mcp` 与开关数据不受影响，升级只需替换安装项。

## 1.0.9

### 修复

- 对话里的技能面板在 Skills 与 MCP 之间切换时，整个弹出框的高度保持不变。弹出框按视口定高（单行工具栏时列表区仍是 `min(480px, 60vh)`），Skills 的搜索行和窄屏下多出来的工具栏行都改占列表空间，不再把外框撑高或压矮。内容超出时在列表内滚动；设置页仍按内容高度排。

## 1.0.7

### 修复

- 修复 Windows/Linux 下技能面板半透明看不清：`.menu` 只画了约 50% 透明度的 `--dsw-specific-menu` 底色，macOS 靠系统毛玻璃撑着没暴露。改为独立的 `::before` 材质层承载 `backdrop-filter`（与官方 MenuSurface 同一做法），不再依赖原生 vibrancy。
- 修复 Windows 下无管理员权限安装失败：`hub.install` 的目录链接改用 junction（不需要管理员/开发者模式）。
- 测试套件 Windows 移植性：ESM 动态导入绝对路径改走 `pathToFileURL`、`pnpm` 在 win32 用 `pnpm.cmd`、probe 的 symlink 改 junction、README 断言对齐 1.0.6。

### 说明

- 插件市场（awesome-dsh-plugin 目录）中 `dsh-skillhub` 条目此前指向第三方 fork `vonweller/dsh-skillhub`（已分叉、停在 0.2.1），从市场安装拿不到本仓库代码——这是"装上后界面完全没有入口"类反馈的最可能根因。已提交目录 PR 将本仓库单独列出；市场安装请认准 `aa2246740/dsh-skillhub`。

## 1.0.6

- 发布通道切换为 npm Trusted Publishing（OIDC），推 `v*` tag 即发布；无功能变化。

## 1.0.5

- 修复 npm 包安装成功但 `skill&mcp` 页面缺失：包名、bundle 模块名和前端注册名统一为 `@aa2246740/dsh-skillhub`，GitHub 与 npm 使用同一份产物。
- 安装说明补充桌面端「立即启用」步骤，避免把已安装误认为已启用。
- 安装不再使用 npm 别名；旧用户通过插件管理器移除旧项后迁移，沿用 `$DSH_HOME/skillhub/` 中的开关数据。
- 打包前检查三处名称一致，阻止发布缺失前端入口的产物；增加官方 RC2 加载器回归。
- 客户端构建从包名生成注册 ID，并通过 DSHX 外部构建器读取目标平台模块表。

## 1.0.4 补全刷新

- 技能开关保存后，通过公开的 Loader/Fiber 生命周期重新挂载官方技能补全客户端，清除其会话目录缓存；不刷新整个页面，不重启 Host，也不修改官方代码。
- 增加“刷新 / 补全”手动入口；通过 BroadcastChannel 通知其他窗口。刷新失败时区分已保存的开关与尚未更新的补全。
- 使用 RC2 的真实 Cordis、Loader、输入触发器和官方技能客户端构建产物，验证旧缓存复现、同会话启停、多会话隔离、重复通知合并及 SkillHub 自身热加载的监听清理。

## 1.0.4

### 兼容

- 开发依赖钉在官方 `@deepseek-ai/dsh-*@0.2.0-rc.1`（tag `dsh-v0.2.0-rc.1`，SHA `4878cdabd87d4041bdaff61d04c966883b9fd07a`）。`@deepseek-ai/dsh-*` peer 范围改为 `>=0.2.0-rc.1 <0.2.1`，与 DSHX 0.9.2 对 `@deepseek-ai/dsh` 的范围相同。该范围接受 `0.2.0-rc.1` 与稳定版 `0.2.0`，拒绝 `0.2.0` alpha，也拒绝 `0.1.7-rc.2`。
- 客户端内联白名单与平台模块表与该 tag 的 `packages/client/tsdown.client.ts` `INLINE_SAFE`、`packages/client/web/src/platform.ts` 一致；表达式相对 `dsh-v0.1.7-rc.2` 没有变化。
- Cordis 仍是 `4.0.4`，Schemastery 仍是 `3.18.4`。

## 1.0.3

### 兼容

- 开发依赖钉在官方 `@deepseek-ai/dsh-*@0.1.7-rc.2`（tag `dsh-v0.1.7-rc.2`，SHA `477b4f420553e8a52c2fbccc464d7561b239c443`）。peer 范围仍是 `>=0.1.7-rc.1 <0.1.8`：接受 `0.1.7-rc.2`，拒绝 `0.1.7` alpha。
- 客户端内联白名单与该 tag 的 `packages/client/tsdown.client.ts` `INLINE_SAFE` 对齐，补上 `@deepseek-ai/dsh-api-workspace-controller/default-workspace`。平台模块表没有变化。
- Skill 注册、设置页 `settings.section`、composer `conversation.input.left` 的 `sessionId` / `useSessions`，以及现用图标名在 rc.2 上保持可用。rc.2 的 Button 改为 forwardRef、Menu/Tooltip 增加可选 shortcut，现有调用不需要改参数。

## 1.0.2

### 兼容

- 官方 DeepSeek Harness 依赖范围改为 `>=0.1.7-rc.1 <0.1.8`（tag `dsh-v0.1.7-rc.1`）。npm 默认 semver 不会让 `^0.1.5-rc.3` 接受 `0.1.7-rc.1`。同一范围拒绝 `0.1.7-alpha`。
- 设置页不再调用已删除的 `settings.installSection`。`enabled` 是 profile 里的 volatile 字段，设置里改完立刻落盘，下次 Host 加载时生效。
- 客户端图标改用 rc.1 的字重命名（`IconSkillOutlineRegular` 等），尺寸仍由 `size` 指定。
- `settings.section` 与 composer 的 `sessionId` / `useSessions` 改由 `@deepseek-ai/dsh-client-ui-settings` 和 `@deepseek-ai/dsh-client-ui-session` 声明，并加入 `dsh.client.inject`。
- 开发依赖里的 Cordis 钉在 `4.0.4`，Schemastery 钉在 `3.18.4`，与 rc.1 宿主一致。

## 1.0.1

### 兼容

- 官方 DeepSeek Harness 依赖范围改为 `^0.1.5-rc.2`。npm 会接受 `0.1.5-rc.3`，不会接受 `^0.1.2-rc.1` 下的 `0.1.5-rc.3`。
- 开发依赖钉在 `@deepseek-ai/dsh-*@0.1.5-rc.3`（tag `dsh-v0.1.5-rc.3`）。不面向 `0.1.7-alpha`。

## 1.0.0

首个正式版。

### 功能

- 列出磁盘上已有的 Skills：`~/.agents/skills`（Agent 目录）与 `$DSH_HOME/skills`（DSH 目录）。
- 三层作用范围开关：全局 / 本项目 / 本对话；设置页管全局，composer 面板管项目与对话。
- 开关传导语义：
  - 全局操作同步该技能到所有项目和对话，覆盖旧值（重复设同值也同步）。
  - 项目操作只同步本项目内的对话，不影响其他项目。
  - 对话操作只改自己；之后相关的上层操作会再次传导。
  - 新建项目、对话继承上层当前状态。
- 不安装、不复制、不删除 skill 文件；关闭只是不进目录，文件保留。
- 插件自己注册的技能（含 Resume 斜杠命令）不受 SkillHub 管理。
- MCP 页签：按服务控制模型可见的 MCP 工具，与技能共用同一套传导规则。
- 界面只显示当前开关：无覆盖徽标、无恢复继承控件。
- 切换作用范围时保持列表渲染，无骨架屏闪烁。
- 开关提示 toast：开启时提示 `/` 自动补全需刷新页面；关闭时说明本会话已载入内容不受影响，新开对话彻底生效。
- 中英文文案；页面与弹层两种界面。

### 存储

- `$DSH_HOME/skillhub/`：`global.json`、`projects/<hash>.json`、`sessions/<id>.json`，MCP 另存 `mcp-*.json`；`propagation-clock.json` 分配持久递增操作顺序。
- 可见性文档兼容 version 2，增加可选 `defaultRevision`、`gateRevisions`；旧配置保持原值，下一次上层操作自然传导。

### 许可

MIT
