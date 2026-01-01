# Notion 数据库设置指南

要使用 Noreply Sender Mail 应用程序，您需要在 Notion 中设置两个数据库。

## Notion AI 提示词 (Prompt)
您可以复制以下文本并发送给 Notion AI，让它自动为您创建数据库和示例数据：

> 请创建两个内联数据库（Inline Databases），包含以下规格和示例数据：
>
> **1. Recipients DB (收件人数据库)**
> *   **属性 (Properties)**:
>     *   `Name` (标题 Title)
>     *   `mail` (邮箱 Email)
>     *   `role` (多选 Multi-select)
>     *   `Company` (文本 Text)
> *   **示例数据**:
>     | Name | mail | role | Company |
>     | :--- | :--- | :--- | :--- |
>     | Alice Admin | alice@example.com | Admin, User | TechCorp |
>     | Bob User | bob@example.com | User | DesignStudio |
>     | Charlie Guest | charlie@example.com | Guest | Freelance |
>
> **2. Templates DB (模板数据库)**
> *   **属性 (Properties)**:
>     *   `Name` (标题 Title)
>     *   `Subject` (文本 Text)
>     *   `Body` (文本 Text)
>     *   `Type` (单选 Select)
> *   **示例数据**:
>     | Name | Subject | Body | Type |
>     | :--- | :--- | :--- | :--- |
>     | Welcome Email | 欢迎使用我们的服务！ | 嗨 {{name}}，<br><br>欢迎来到 **{{Company}}**！很高兴见到你。<br><br>祝好，<br>团队 | Onboarding |
>     | Password Reset | 重置您的密码 | 您好 {{name}}，<br><br>点击此处重置您的密码。<br><br>谢谢 | System |
>     | Monthly Newsletter | 一月更新 | 嗨 {{name}}，<br><br>这是本月的更新内容... | Marketing |

---

## 手动设置说明

### 1. Recipients Database (收件人数据库)
此数据库存储您的邮件收件人及其角色。

**属性:**
*   **Name** (`Title`): 收件人姓名。
*   **mail** (`Email`): 收件人邮箱地址。
*   **role** (`Multi-select`): 用于分类用户的标签（例如 `Admin`, `User`）。
*   *(可选)*: 其他属性（例如 `Company`）可以在模板中通过 `{{Company}}` 引用。

### 2. Templates Database (模板数据库)
此数据库存储您的邮件模板。

**属性:**
*   **Name** (`Title`): 模板名称。
*   **Subject** (`Text`): 邮件主题行。
*   **Body** (`Text`): Markdown 格式的邮件内容。
*   **Type** (`Select`): 模板分类（例如 `Marketing`, `System`）。

## 3. 集成设置 (Integration Setup)
1. 前往 [My Integrations](https://www.notion.so/my-integrations) 并创建一个新的集成。
2. 复制 **Internal Integration Token**（以 `secret_` 开头）。
3. 前往您创建的这两个数据库。
4. 点击右上角的 `...` 菜单 -> `Connections` (连接) -> `Connect to` (连接到) -> 选择您的集成。
5. 从 URL 中复制每个数据库的 **Database ID**。
   - URL 格式: `https://www.notion.so/myworkspace/DATABASE_ID?v=...`
   - 它是 `?` 之前的 32 个字符的字符串。

## 4. 环境变量 (Environment Variables)
使用这些值更新您的 `.env.local` 文件：

```env
NOTION_API_KEY=secret_your_integration_token
NOTION_DATABASE_ID=your_recipients_database_id
NOTION_TEMPLATE_DATABASE_ID=your_templates_database_id
```
