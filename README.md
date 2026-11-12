# mai-finder

舞萌DX收藏品与静态资源的非官方查询 wiki。

> 本项目与 SEGA、华立无关。资源版权归原权利方所有，详见 [NOTICE](./NOTICE)。

## 功能

- 全文搜索：名称 / 数据名 / ID，支持多关键词与结果排序
- 详情面板：预览图、Kind ID、解锁条件、稀有度、复制字段、下载原图 / JSON、复制链接
- 最近浏览 / 最近搜索（localStorage）

## 技术栈

- Next.js 16 App Router + React 19，纯静态导出
- Tailwind CSS v4 + shadcn/ui
- Bun
- Cloudflare Worker

## 本地开发

要求 Node.js >= 20.9，推荐 Bun。

```bash
bun install
bun run dev
```

> 新克隆的仓库没有 `.next/types`，直接运行 `tsc --noEmit` 会报类型缺失；先执行一次 `bun run build` 或 `bun run dev`。

## 构建与部署

```bash
bun run build
bun run preview
bun run deploy
```

`wrangler.jsonc` 已配置 `assets.directory = ./out`、自定义 404 和 HTML 路由，缓存头在 `public/_headers`

## 数据
游戏原始文件不包含在本仓库中


## 贡献

欢迎 issue 和 PR

## 许可证

源代码采用 [MIT License](./LICENSE)。

`public/assets` 与 `public/data` 中的游戏素材和数据不适用 MIT 协议，版权归原权利方所有，详见 [NOTICE](./NOTICE)。
