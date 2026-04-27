# Exponent 面经功能参考方案

## Summary

参考 Exponent 的 `Interview Experiences`、公司页和题库页，我们下一阶段应把当前产品从“个人 AI 面试训练台”升级为“公司定向备考系统”：围绕目标公司和岗位沉淀真实面经、题库、轮次情报、训练任务和复盘闭环。

本方案不做实时面试 Copilot，不做现场辅助作弊；定位是面试前的公司情报整理、训练计划生成和复盘学习系统。

## Reference

- Exponent Interview Experiences：展示真实候选人分享的面试经历，支持公司、角色、是否 verified 等筛选，并引导用户贡献面经解锁内容。
- Exponent Google Company Hub：公司页聚合面试指南、课程、面试题、教练、内推、博客和新增面经入口。
- Exponent Google Questions：公司题库按角色、类别、热门/最新等维度筛选，题目带答案、视频答案、被问过标记、保存入口和公司/角色/类别元信息。

参考链接：
- https://www.tryexponent.com/experiences?src=banner
- https://www.tryexponent.com/companies/google
- https://www.tryexponent.com/questions?company=google

## Product Positioning

我们的差异化：

- 本地优先：用户可以录入自己的面经、朋友分享和公开整理，不依赖云端社区。
- AI 结构化：把非结构化面经自动拆成轮次、问题、题型、准备建议和复习任务。
- 训练闭环：面经不只是阅读材料，可以一键转成八股卡、模拟面试、每日任务和复盘卡。
- 公司定向：从“我会什么”升级为“这家公司最近可能问什么，我还差什么”。

## Core Modules

### 1. 面经库

新增 `ExperienceReport`，用于保存真实或整理过的面试经历。

核心字段：

- 公司：companyId / companyName
- 岗位：roleName
- 级别：level，如实习、校招、社招、L4、P6
- 地点/形式：location、onsite/remote/phone/video
- 面试日期：interviewDate
- 结果：offer/reject/pending/unknown
- 难度：easy/medium/hard
- 来源：self/friend/public/manual
- 可信度：low/medium/high
- 是否验证：verified
- 总时长：durationMinutes
- 原文：rawText
- AI 摘要：summary
- 标签：tags

新增 `ExperienceRound`：

- reportId
- roundType：HR、一面、二面、系统设计、coding、主管面、交叉面
- order
- durationMinutes
- interviewerStyle
- focusAreas
- questionsJson
- notes

### 2. 公司情报页升级

当前公司备考页可以升级为公司 Hub。

页面区块：

- 准备度：JD 匹配、八股覆盖、模拟完成、错题清理、面经覆盖
- 最近面经：按时间倒序展示
- 高频题：从面经和八股卡聚合
- 轮次分布：coding/系统设计/项目深挖/HR 占比
- 岗位差异：前端、后端、AI 应用、产品等角色的题型差异
- 训练入口：一键开始该公司的混合模拟
- 内容入口：八股卡、复盘卡、冲刺计划、实验室练习

### 3. 面经到训练任务

每条面经提供三个动作：

- 生成八股卡：把题目和标准答案保存到 KnowledgeCard
- 生成模拟面试：按面经轮次创建 InterviewSession
- 生成今日任务：把高风险题加入 Daily Training

AI 拆解规则：

- 从 rawText 中提取公司、岗位、轮次、题目、追问、难点、结果。
- 题目按类型归类：八股、项目追问、系统设计、coding、行为面试。
- 低置信度字段必须标记，不自动冒充 verified。
- 所有 AI 建议只做草稿，用户确认后保存。

### 4. 题库/面经统一检索

把 KnowledgeCard、ExperienceReport、ReviewCard 统一到一个公司检索体验里。

筛选维度：

- 公司
- 岗位
- 轮次
- 题型
- 技术主题
- 难度
- 时间范围
- 来源
- 可信度
- 掌握度
- 是否已复习

排序方式：

- 最新
- 高频
- 高优先级
- 低掌握度
- 与当前 JD 最相关

### 5. 贡献机制，本地版

第一版不做公开社区，但可以做本地贡献流。

功能：

- 新增“录入面经”入口
- 支持粘贴整段面经
- AI 结构化预览
- 用户确认保存
- 标记来源和可信度
- 可选择是否生成训练任务

未来如果做云端：

- 匿名分享
- 贡献换解锁
- 版本审核
- 举报和纠错
- verified 认证

## Data Model Draft

```prisma
model ExperienceReport {
  id              Int      @id @default(autoincrement())
  companyId       Int?
  roleName        String
  level           String?
  location        String?
  interviewDate   DateTime?
  result          String   @default("unknown")
  difficulty      String   @default("medium")
  sourceType      String   @default("self")
  confidence      String   @default("medium")
  verified        Boolean  @default(false)
  durationMinutes Int?
  rawText         String
  summary         String?
  tagsJson        String   @default("[]")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  company         Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  rounds          ExperienceRound[]

  @@index([companyId])
  @@index([roleName])
  @@index([interviewDate])
  @@index([verified])
  @@index([confidence])
}

model ExperienceRound {
  id                Int              @id @default(autoincrement())
  reportId          Int
  order             Int
  roundType         String
  durationMinutes   Int?
  interviewerStyle  String?
  focusAreasJson    String           @default("[]")
  questionsJson     String           @default("[]")
  notes             String?
  report            ExperienceReport @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
  @@index([roundType])
}
```

## API Draft

- `POST /api/experiences/parse`
  - 输入：rawText、companyName、roleName 可选
  - 输出：结构化面经草稿

- `POST /api/experiences`
  - 保存用户确认后的面经

- `GET /api/experiences`
  - 支持公司、岗位、轮次、时间、可信度、关键词筛选

- `GET /api/companies/:id/intel`
  - 返回公司情报聚合：面经、轮次分布、高频题、准备建议、训练入口

- `POST /api/experiences/:id/generate-cards`
  - 从面经问题生成八股卡

- `POST /api/experiences/:id/start-interview`
  - 用面经轮次创建模拟面试

- `POST /api/experiences/:id/create-daily-tasks`
  - 把面经高频题生成今日任务

## UI Draft

一级导航建议仍保持简洁：

- 准备
- 八股
- 简历
- 模拟
- 复盘
- 实验室
- 公司

新增“公司”页：

- 顶部：公司选择 + 岗位选择
- 第一屏：准备度、最近面经、今日重点
- 第二屏：高频题和轮次分布
- 第三屏：面经列表
- 右侧/底部：一键生成模拟、一键生成复习任务

新增“录入面经”交互：

1. 粘贴面经原文
2. AI 结构化
3. 用户确认字段
4. 保存
5. 选择生成八股卡/模拟/每日任务

## AI Behavior

Prompt 优先级：

1. 用户录入的面经原文
2. 目标公司和岗位
3. 当前 JD
4. 用户简历
5. 现有八股卡
6. 历史复盘

AI 输出必须是 JSON：

- 不自动标记 verified
- 不猜测具体公司内部机密
- 不把公开整理内容伪装成真实经历
- 对不确定字段输出 confidence
- 所有生成内容都需要用户确认

## Priority Plan

### P1：面经库 MVP

- 新增 ExperienceReport / ExperienceRound
- 粘贴面经并 AI 结构化
- 面经列表和详情页
- 从面经生成八股卡

价值：补齐 Exponent experiences 页的核心能力。

### P2：公司情报页

- 公司页展示最近面经、高频题、轮次分布
- 结合 JD、简历和八股卡生成准备建议
- 支持按岗位筛选公司面经

价值：把当前公司备考页升级为公司 Hub。

### P3：训练转化

- 面经一键生成模拟面试
- 面经一键生成今日任务
- 低掌握题自动进入间隔重复
- 面经题目和复盘卡互相关联

价值：形成“看面经 -> 练题 -> 模拟 -> 复盘”的闭环。

### P4：社区/商业化预留

- 匿名分享
- verified 机制
- 教练/同伴 mock 排期
- 简历 review
- 内推/求职资源入口

价值：对应 Exponent 的社区与商业闭环，但不作为本地 MVP 首要目标。

## Success Metrics

- 用户能在 3 分钟内录入一条完整面经
- AI 结构化字段可用率超过 80%
- 每条面经至少能生成 3 张八股卡或 1 次模拟面试
- 公司页能回答三个问题：
  - 这家公司最近问什么？
  - 我最该补什么？
  - 今天该练什么？

## Test Plan

- 单元测试：
  - 面经解析 JSON schema
  - 轮次分布统计
  - 高频题聚合
  - 面经生成八股卡

- API 测试：
  - `POST /api/experiences/parse`
  - `POST /api/experiences`
  - `GET /api/experiences`
  - `GET /api/companies/:id/intel`
  - `POST /api/experiences/:id/generate-cards`

- E2E：
  - 粘贴 Google SWE 面经
  - AI 结构化
  - 保存面经
  - 查看公司页
  - 生成八股卡
  - 开始模拟面试
  - 生成复盘和今日任务

## Risks

- 面经真实性难验证：第一版只做 source/confidence，不做 verified 自动判定。
- 数据来源版权风险：只保存用户手动录入或授权内容，不抓取第三方内容。
- 社区内容质量不稳定：云端分享前必须有审核和举报机制。
- UI 容易变复杂：公司页必须先展示决策信息，再隐藏低频筛选。
