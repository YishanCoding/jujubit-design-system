# 工具页模板

这是完整页面配方，独立于 playground 组件目录。入口为 [index.html](index.html)，新增组件样式全部在 [tool-page.css](tool-page.css)。组件及相关 token 均为 **[待设计]**，不是已发布页面或已验证的 Shopify 集成。

## 使用

仓库或线上目录依次加载 `../../../../tokens.css`、`../../../../components.css`、`tool-page.css`。图标从 `../../../../assets/icons/` 读取。通过 HTTP 服务打开模板，以便浏览器读取外链 SVG sprite。

skill 下载包会包含整个模板目录，共享资源位于包内 `kit/`。**解压后独立使用时**，把 `index.html` 中的 `../../../../` 统一替换为 `../../kit/`；`tool-page.css` 路径不变。无需改 token 定义。

顶部说明条只用于模板。可见文案槽位带虚线框；仅出现在属性中的 URL、表单值和事件标识另列在页尾。替换所有 `{{…}}`，再去掉 `.jjb-template-notice`、`.jjb-template-attributes` 和 `.jjb-template-slot` 包装。这里的槽位不是可直接执行的 Liquid 表达式，尤其是 `{{fact:rating}}`。

## 区块顺序与组件状态

| 顺序 | 区块 / 类 | 状态及交互 |
|---|---|---|
| 1 | Announcement / `.jjb-announce` | 复用基础组件；公告文字为槽位。 |
| 2 | Header / `.jjb-nav` | 复用基础组件；主题集成时只保留一份导航。 |
| 3 | Breadcrumb / `.jjb-breadcrumb` | 待设计；窄屏折叠中间层级，保留首页与当前页。 |
| 4 | Hero / `.jjb-tool-hero` | 待设计；单 h1、主动作、下一步说明、Sample image。 |
| 4a | Style picker / `.jjb-tool-picker` | 待设计；default、hover、checked、focus-visible、disabled；无可用风格时移除整个 picker。 |
| 5 | Evidence / `.jjb-proof-pair` | 待设计；原图、AI 预览、实物照分别标注，分别使用普通、虚线、加粗边框；当前均为图标占位。 |
| 6 | How it works / `.jjb-steps` | 复用基础组件；静态展开，无加载态或 JS 依赖。 |
| 7 | Examples / `.jjb-tool-examples` | 待设计；2/3/4 列；链接打开图片，图片标签及 alt 为 Sample image。 |
| 8 | Trust / `.jjb-trust` | 复用基础组件；数据为槽位。 |
| 9 | Reviews / `.jjb-review` | 复用基础组件；引用、作者和评分为槽位。 |
| 10 | Guide / `.jjb-prose` | 待设计；标题、列表、引用、链接、配图说明。 |
| 11 | Comparison / `.jjb-table`、`.jjb-compare-table`、`.jjb-table-scroll` | 待设计；条纹可选，局部键盘横滚，首列 sticky，图标搭配文字。 |
| 12 | FAQ / `.jjb-faq` | 复用基础组件；原生 details 的展开、折叠状态。 |
| 13 | Related / `.jjb-related` | 待设计；复用分类卡，链接地址与标题为槽位。 |
| 14 | Closing CTA / `.jjb-cta-band` | 待设计；提交 Hero 的同一个表单，保留风格选择。 |
| 15 | Footer / `.jjb-footer` | 复用基础组件；主题集成时只保留一份页脚。 |

静态模板不模拟上传、生成、加载或错误恢复；这些状态属于目标页。证据卡与相关卡的占位图标居中，最大尺寸为 `calc(var(--jjb-tool-thumb) * 2)`，目前为 96px；替换为真实照片时移除 `.jjb-template-icon` 和 `.jjb-template-icon-frame`。

## 设计与交互规则

- 不放文件输入、假上传框或生成接口调用。按钮下明确说明下一页上传。
- 一个主动作：原生 GET 表单跳转到 `/products/customize-your-own`。页尾按钮通过 `form="tool-form"` 提交同一表单。
- **跳转表单的参数名待开发确认**：示例使用 `style`、`utm_source`、`utm_content`。目标页是否读取及保留这些值未验证。
- 原图、AI 预览、产品渲染图和实物照分开标注。未确认素材类型时使用中性 “Sample image”；MINI_Pop.png 不作为真实产品证据。
- 证据必须为获准使用的匹配素材组；没有则省略该区块。图标占位不代表证据。
- 数字不硬编码。替换为已验证内容，无法验证就省略。
- 保留原生键盘交互和可见焦点；表格仅在内部横滚，页面不得横向溢出。

## 搬进 Shopify

按 [Web 集成规范](../../platforms/web.md) 将 body 中的区块映射到 section/block，复用主题公告、导航和页脚。依次加载 token、基础组件和工具页 CSS；沿用主题字体。把槽位映射成 section settings/metafields，移除模板提示与槽位包装，确认参数名后再接目标页。主题修改及发布另行确认。

验收见 [acceptance.md](../../references/acceptance.md)。使用前须在 390/768/1440/1600 检查布局、无 JS 操作和目标页行为；静态检查不能替代浏览器验收。
