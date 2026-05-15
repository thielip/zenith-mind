import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

const categories = [
  { slug: "travel", name: "旅遊", nameEn: "Travel" },
  { slug: "quant", name: "量化交易", nameEn: "Quant Trading" },
  { slug: "real-estate", name: "房地產", nameEn: "Real Estate" },
  { slug: "education", name: "知識變現", nameEn: "Knowledge Monetization" },
  { slug: "ai-creation", name: "AI 創作", nameEn: "AI Creation" },
  { slug: "ai-tech", name: "AI 科技", nameEn: "AI Technology" },
];

const posts = [
  {
    slug: "travel-blog-monetization-start-guide",
    title: "旅遊部落格如何開始經營並賺錢？",
    excerpt: "從利基市場、長尾 SEO 到四大變現路徑的完整入門指南。",
    categorySlug: "travel",
    tags: ["seo", "affiliate", "blog"],
    content: `## 核心策略：從利基切入，建立可複製變現流程

### 1) 鎖定利基市場
- 避開「日本旅遊」這種超大詞，改做「東京親子自由行」或「廉航攻略」。

### 2) 佈局長尾關鍵字
- 例：台中飛東京機票怎麼買、河口湖大眾運輸交通指南。

### 3) 四大變現路徑
1. 聯盟行銷（Klook、KKday、Booking 等）
2. 廣告收益（AdSense / 聯播網）
3. 品牌合作（旅遊用品、住宿體驗）
4. 自有產品（電子書、線上課程）
`,
  },
  {
    slug: "what-is-quant-trading-beginner-path",
    title: "什麼是量化交易？新手可以開始嗎？",
    excerpt: "量化交易的定義、入門步驟與風險控制。",
    categorySlug: "quant",
    tags: ["quant", "python", "backtest"],
    content: `量化交易是把策略模型化，交由程式自動執行。

## 新手建議路徑
1. 先理解 MA / RSI 等基礎指標
2. 學會回測（Backtesting）
3. 先用模擬倉或小部位驗證

重點不是「立即賺大錢」，而是先建立可持續的風控紀律。`,
  },
  {
    slug: "quant-trading-stable-profit-truth",
    title: "量化交易真的可以穩定獲利嗎？",
    excerpt: "量化策略不是保證獲利，關鍵在風控與多策略分散。",
    categorySlug: "quant",
    tags: ["quant", "risk-control"],
    content: `答案：不一定。

量化交易是「在不確定性中追求正期望值」。

## 長期存活三要素
1. 嚴格風險控管（最大虧損、最大回撤）
2. 多策略分散（趨勢、均值回歸等）
3. 持續監控與停用失效策略`,
  },
  {
    slug: "real-estate-starting-capital-guide",
    title: "房地產投資要準備多少資金？",
    excerpt: "台灣市場常見資金結構：頭期款、交易成本與裝修備用金。",
    categorySlug: "real-estate",
    tags: ["real-estate", "investment"],
    content: `以台灣市場來看，常見需要準備約 200 萬至 500 萬以上。

## 資金結構
- 頭期款：約總價 20%~30%
- 交易成本：約總價 3%~5%
- 裝修/備用金：依屋況而定，並保留 3~6 個月週轉`,
  },
  {
    slug: "buy-to-live-vs-rent-out-investment",
    title: "房地產投資該選自住還是出租？",
    excerpt: "依目標分流：生活品質優先 vs 租金報酬優先。",
    categorySlug: "real-estate",
    tags: ["real-estate", "yield"],
    content: `## 自住導向
- 看生活機能、學區、通勤與貸款負擔率

## 出租導向
- 看年化租金投報率與出租穩定性
- 優先交通便利、需求穩定區域`,
  },
  {
    slug: "turn-knowledge-into-income-streams",
    title: "如何把知識分享變成收入來源？",
    excerpt: "用內容資產化打造多元收入：課程、電子書、訂閱、顧問。",
    categorySlug: "education",
    tags: ["personal-brand", "course", "monetization"],
    content: `知識變現的核心是「結構化你的專業，持續輸出價值」。

## 常見管道
1. 線上課程
2. 電子書
3. 訂閱制內容
4. 顧問/諮詢
5. 個人品牌經營`,
  },
  {
    slug: "personal-brand-core-principles",
    title: "建立個人品牌最重要的關鍵是什麼？",
    excerpt: "定位、持續輸出、社會證明三件事決定品牌變現力。",
    categorySlug: "education",
    tags: ["personal-brand", "marketing"],
    content: `## 三大核心
1. 垂直定位（Niche Positioning）
2. 穩定且可預期的內容輸出
3. 社會證明（案例、數據、見證）`,
  },
  {
    slug: "ai-art-legal-and-copyright-guide",
    title: "AI 繪圖是否合法？會有版權問題嗎？",
    excerpt: "商用前必懂三件事：平台條款、訓練資料爭議與侵權紅線。",
    categorySlug: "ai-creation",
    tags: ["ai-art", "copyright"],
    content: `AI 繪圖可用於商業，但要遵守平台授權與地方法規。

## 實務紅線
- 避免直接模仿在世藝術家風格
- 避免使用受保護 IP 角色做商用販售`,
  },
  {
    slug: "ai-art-monetization-methods",
    title: "AI 繪圖可以賺錢嗎？有哪些方式？",
    excerpt: "接案、POD、素材販售、Prompt 商品化四條路徑。",
    categorySlug: "ai-creation",
    tags: ["ai-art", "freelance", "pod"],
    content: `可以，且已經是成熟的創作生產力工具。

## 常見變現模式
1. 商用設計接案
2. POD 隨選印刷
3. 販售素材與 Prompt
4. 串接 AI 工作流服務`,
  },
  {
    slug: "ai-agent-what-and-why-hot",
    title: "什麼是 AI Agent？為什麼最近很熱門？",
    excerpt: "AI 從問答助手走向可自主拆解與執行任務的代理系統。",
    categorySlug: "ai-tech",
    tags: ["ai-agent", "automation"],
    content: `AI Agent 的特性：
- 自主性：可拆解目標並規劃步驟
- 工具調用：可搜尋、呼叫 API、操作系統
- 記憶：可保留上下文並優化流程`,
  },
  {
    slug: "n8n-use-cases-for-automation",
    title: "n8n 可以用來做什麼？",
    excerpt: "開源自動化平台，適合串 API、建 AI 工作流與資料整合。",
    categorySlug: "ai-tech",
    tags: ["n8n", "workflow", "automation"],
    content: `n8n 適合：
1. 串接 SaaS API（Sheets、Notion、Slack）
2. 建立 AI 自動化流程
3. 定時蒐集資料並產出報表`,
  },
  {
    slug: "comfyui-introduction-and-best-users",
    title: "ComfyUI 是什麼？適合誰使用？",
    excerpt: "節點式 Stable Diffusion 工作流，適合進階創作者與自動化團隊。",
    categorySlug: "ai-tech",
    tags: ["comfyui", "stable-diffusion"],
    content: `ComfyUI 是節點式圖像生成介面，可精細控制整個生成流程。

## 適合族群
- 進階 AI 創作者
- 追求效能/顯存優化者
- 需要批次生產圖像的開發團隊`,
  },
];

async function main() {
  const admin = await prisma.user.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!admin) {
    throw new Error("找不到可用作者（users）。請先建立 admin 帳號後再執行。");
  }

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, nameEn: category.nameEn, deletedAt: null },
      create: category,
    });
  }

  for (const post of posts) {
    const category = await prisma.category.findUnique({
      where: { slug: post.categorySlug },
      select: { id: true },
    });

    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        status: "PUBLISHED",
        publishedAt: new Date(),
        contentType: "markdown",
        authorId: admin.id,
        categoryId: category?.id ?? null,
        deletedAt: null,
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        status: "PUBLISHED",
        publishedAt: new Date(),
        contentType: "markdown",
        authorId: admin.id,
        categoryId: category?.id ?? null,
        readingTime: Math.max(1, Math.ceil(post.content.length / 250)),
      },
    });
  }

  console.log(`Imported ${posts.length} posts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
