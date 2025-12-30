# Yarukoto API設計書

## 1. 設計方針

### 1.1 基本方針
- **Server Actions優先**: API Routes（route.ts）は最小限にし、Server Actionsを主に使用
- **API Routes使用箇所**: Better Auth の認証エンドポイントのみ（`/api/auth/[...all]`）
- **楽観的更新**: UIの即時反映を優先し、失敗時にロールバック
- **Result型パターン**: エラーハンドリングは型安全なResult型を採用

### 1.2 Result型定義
```typescript
// 成功・失敗を明示的に扱う型
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ErrorCode };

// エラーコード
type ErrorCode =
  | "UNAUTHORIZED"      // 未認証
  | "FORBIDDEN"         // 権限なし
  | "NOT_FOUND"         // リソースが見つからない
  | "VALIDATION_ERROR"  // バリデーションエラー
  | "CONFLICT"          // 競合（重複など）
  | "INTERNAL_ERROR";   // サーバーエラー
```

### 1.3 認証
- すべてのServer Actionsで認証チェックを実施
- 未認証の場合は `{ success: false, error: "認証が必要です", code: "UNAUTHORIZED" }` を返却
- セッション取得には Better Auth の `auth.api.getSession()` を使用

---

## 2. API Routes

### 2.1 認証エンドポイント（Better Auth）

| パス | メソッド | 説明 |
|------|----------|------|
| `/api/auth/[...all]` | GET, POST | Better Auth が提供する認証エンドポイント |

Better Auth が内部的に処理するエンドポイント:
- `POST /api/auth/sign-up` - ユーザー登録
- `POST /api/auth/sign-in/email` - ログイン
- `POST /api/auth/sign-out` - ログアウト
- `POST /api/auth/forgot-password` - パスワードリセットメール送信
- `POST /api/auth/reset-password` - パスワードリセット実行
- `GET /api/auth/session` - セッション取得

---

## 3. Server Actions 一覧

### 3.1 タスク関連

| Action名 | 説明 | 使用画面 |
|----------|------|----------|
| `getTodayTasks` | 今日のタスク一覧を取得 | ホーム画面 |
| `getTasksByDate` | 指定日付のタスク一覧を取得 | 日付別タスク画面 |
| `searchTasks` | タスクを検索 | 検索画面 |
| `createTask` | 新規タスクを作成 | ホーム画面、日付別タスク画面 |
| `updateTask` | タスクを更新 | タスク編集モーダル |
| `completeTask` | タスクを完了にする | ホーム画面、日付別タスク画面 |
| `uncompleteTask` | タスクの完了を取り消す | ホーム画面、日付別タスク画面 |
| `skipTask` | タスクを「やらない」にする | ホーム画面、日付別タスク画面 |
| `unskipTask` | 「やらない」を取り消す | ホーム画面、日付別タスク画面 |
| `deleteTask` | タスクを削除 | ホーム画面、日付別タスク画面 |

### 3.2 カテゴリ関連

| Action名 | 説明 | 使用画面 |
|----------|------|----------|
| `getCategories` | カテゴリ一覧を取得 | カテゴリ管理画面、タスク編集モーダル |
| `createCategory` | 新規カテゴリを作成 | カテゴリ管理画面 |
| `updateCategory` | カテゴリを更新 | カテゴリ管理画面 |
| `deleteCategory` | カテゴリを削除 | カテゴリ管理画面 |

### 3.3 ユーザー設定関連

| Action名 | 説明 | 使用画面 |
|----------|------|----------|
| `getUserSettings` | ユーザー設定を取得 | 設定画面 |
| `updateUserSettings` | ユーザー設定を更新 | 設定画面 |
| `changeEmail` | メールアドレスを変更 | 設定画面 |
| `changePassword` | パスワードを変更 | 設定画面 |
| `deleteAccount` | アカウントを削除 | 設定画面 |

---

## 4. Server Actions 詳細仕様

### 4.1 タスク関連

#### getTodayTasks
今日表示すべきタスクを一括取得する。

**必要な理由**: ホーム画面で今日のタスク（期限超過、本日予定、日付未定、完了済み、やらない）をセクション分けして表示するため。

```typescript
// 入力
type GetTodayTasksInput = void;

// 出力
type GetTodayTasksOutput = ActionResult<{
  overdue: Task[];      // 期限超過タスク（予定日が過去で未完了）
  today: Task[];        // 今日のタスク（予定日が今日で未完了）
  undated: Task[];      // 日付未定タスク（予定日なしで未完了）
  completed: Task[];    // 今日完了したタスク
  skipped: Task[];      // 今日やらないにしたタスク
}>;
```

#### getTasksByDate
指定した日付に関連するタスクを取得する。

**必要な理由**: 日付ナビゲーションで過去・未来の日付を表示する際に、その日付に関連するタスクを取得するため。

```typescript
// 入力
type GetTasksByDateInput = {
  date: string; // ISO 8601形式 (YYYY-MM-DD)
};

// 出力（統一型）
type GetTasksByDateOutput = ActionResult<{
  isPast: boolean;       // 過去の日付かどうか
  isFuture: boolean;     // 未来の日付かどうか
  completed: Task[];     // その日に完了したタスク（過去のみ、未来は空配列）
  skipped: Task[];       // その日にやらないにしたタスク（過去のみ、未来は空配列）
  scheduled: Task[];     // その日が予定日のタスク
}>;
```

※ 未来の日付の場合、`completed` と `skipped` は空配列を返す

#### searchTasks
キーワードやフィルター条件でタスクを検索する。

**必要な理由**: 検索画面で複数日のタスクを横断的に検索・フィルタリングするため。

```typescript
// 入力
type SearchTasksInput = {
  keyword?: string;                        // 検索キーワード（タスク名、メモ）
  status?: "all" | "pending" | "completed" | "skipped";
  categoryId?: string | null;              // null = カテゴリなし
  priority?: Priority | "all" | null;      // null = 優先度なし、"all" = すべて
  dateFrom?: string;                       // 期間指定（開始）
  dateTo?: string;                         // 期間指定（終了）
};

// 出力（日付でグループ化）
type SearchTasksOutput = ActionResult<{
  groups: {
    date: string | null;  // 予定日（null = 日付未定）
    tasks: Task[];
  }[];
  total: number;
}>;
```

#### createTask
新しいタスクを作成する。

**必要な理由**: ホーム画面・日付別画面の下部入力欄から素早くタスクを作成するため。

```typescript
// 入力
type CreateTaskInput = {
  title: string;           // タスク名（必須）
  scheduledAt?: string;    // 予定日（ISO 8601形式）
  categoryId?: string;     // カテゴリID
  priority?: Priority;     // 優先度
  memo?: string;           // メモ
};

// 出力
type CreateTaskOutput = ActionResult<{
  task: Task;
}>;
```

#### updateTask
タスクの属性を更新する。

**必要な理由**: タスク編集モーダルでタスクの詳細情報を変更するため。

```typescript
// 入力
type UpdateTaskInput = {
  id: string;              // タスクID（必須）
  title?: string;          // タスク名
  scheduledAt?: string | null;  // 予定日（nullで日付未定に）
  categoryId?: string | null;   // カテゴリID（nullでカテゴリなしに）
  priority?: Priority | null;   // 優先度（nullで優先度なしに）
  memo?: string | null;         // メモ
};

// 出力
type UpdateTaskOutput = ActionResult<{
  task: Task;
}>;
```

#### completeTask
タスクを完了状態にする。

**必要な理由**: チェックボックスタップでタスクを完了にするため。楽観的更新で即座にUIに反映。

```typescript
// 入力
type CompleteTaskInput = {
  id: string;  // タスクID
};

// 出力
type CompleteTaskOutput = ActionResult<{
  task: Task;
}>;
```

#### uncompleteTask
タスクの完了状態を取り消す。

**必要な理由**: 誤って完了にしたタスクを未完了に戻すため。

```typescript
// 入力
type UncompleteTaskInput = {
  id: string;  // タスクID
};

// 出力
type UncompleteTaskOutput = ActionResult<{
  task: Task;
}>;
```

#### skipTask
タスクを「やらない」状態にする。

**必要な理由**: タスクを実行しないと決めた際に、履歴として残しつつステータスを変更するため。

```typescript
// 入力
type SkipTaskInput = {
  id: string;         // タスクID
  reason?: string;    // やらない理由（任意）
};

// 出力
type SkipTaskOutput = ActionResult<{
  task: Task;
}>;
```

#### unskipTask
「やらない」状態を取り消して未完了に戻す。

**必要な理由**: やらないにしたタスクを復活させるため。

```typescript
// 入力
type UnskipTaskInput = {
  id: string;  // タスクID
};

// 出力
type UnskipTaskOutput = ActionResult<{
  task: Task;
}>;
```

#### deleteTask
タスクを完全に削除する。

**必要な理由**: 不要なタスクを削除するため。論理削除ではなく物理削除。

```typescript
// 入力
type DeleteTaskInput = {
  id: string;  // タスクID
};

// 出力
type DeleteTaskOutput = ActionResult<{
  id: string;  // 削除したタスクID
}>;
```

---

### 4.2 カテゴリ関連

#### getCategories
ユーザーのカテゴリ一覧を取得する。

**必要な理由**: カテゴリ管理画面での一覧表示、タスク編集時のカテゴリ選択に使用。

```typescript
// 入力
type GetCategoriesInput = void;

// 出力
type GetCategoriesOutput = ActionResult<{
  categories: Category[];
}>;
```

#### createCategory
新しいカテゴリを作成する。

**必要な理由**: カテゴリ管理画面で新規カテゴリを追加するため。

```typescript
// 入力
type CreateCategoryInput = {
  name: string;   // カテゴリ名（必須）
  color: string;  // カラーコード（必須）
};

// 出力
type CreateCategoryOutput = ActionResult<{
  category: Category;
}>;
```

#### updateCategory
カテゴリを更新する。

**必要な理由**: カテゴリ名やカラーを変更するため。

```typescript
// 入力
type UpdateCategoryInput = {
  id: string;      // カテゴリID（必須）
  name?: string;   // カテゴリ名
  color?: string;  // カラーコード
};

// 出力
type UpdateCategoryOutput = ActionResult<{
  category: Category;
}>;
```

#### deleteCategory
カテゴリを削除する。

**必要な理由**: 不要なカテゴリを削除するため。紐づくタスクのcategoryIdはnullになる。

```typescript
// 入力
type DeleteCategoryInput = {
  id: string;  // カテゴリID
};

// 出力
type DeleteCategoryOutput = ActionResult<{
  id: string;  // 削除したカテゴリID
}>;
```

---

### 4.3 ユーザー設定関連

#### getUserSettings
ユーザーの設定を取得する。

**必要な理由**: 設定画面でユーザーの現在の設定値を表示するため。

```typescript
// 入力
type GetUserSettingsInput = void;

// 出力
type GetUserSettingsOutput = ActionResult<{
  settings: UserSettings;
}>;
```

#### updateUserSettings
ユーザーの設定を更新する。

**必要な理由**: 設定画面で表示設定などを変更するため。

```typescript
// 入力
type UpdateUserSettingsInput = {
  autoCollapseCompleted?: boolean;  // 完了タスクを自動で折りたたむ
  autoCollapseSkipped?: boolean;    // やらないタスクを自動で折りたたむ
};

// 出力
type UpdateUserSettingsOutput = ActionResult<{
  settings: UserSettings;
}>;
```

#### changeEmail
メールアドレスを変更する。

**必要な理由**: 設定画面からメールアドレスを変更するため。

```typescript
// 入力
type ChangeEmailInput = {
  newEmail: string;      // 新しいメールアドレス
  currentPassword: string;  // 現在のパスワード（本人確認）
};

// 出力
type ChangeEmailOutput = ActionResult<{
  email: string;  // 変更後のメールアドレス
}>;
```

※ Better Auth の `changeEmail` API を内部で使用

#### changePassword
パスワードを変更する。

**必要な理由**: 設定画面からパスワードを変更するため。

```typescript
// 入力
type ChangePasswordInput = {
  currentPassword: string;  // 現在のパスワード
  newPassword: string;      // 新しいパスワード
};

// 出力
type ChangePasswordOutput = ActionResult<{
  updated: true;
}>;
```

※ Better Auth の `changePassword` API を内部で使用

#### deleteAccount
アカウントを削除する。

**必要な理由**: 設定画面からアカウントを完全に削除するため。関連データもすべて削除。

```typescript
// 入力
type DeleteAccountInput = {
  confirmEmail: string;  // 確認用メールアドレス
};

// 出力
type DeleteAccountOutput = ActionResult<{
  deleted: true;
}>;
```

---

## 5. 型定義

### 5.1 エンティティ型

```typescript
// タスク
type Task = {
  id: string;
  title: string;
  memo: string | null;
  status: TaskStatus;
  priority: Priority | null;
  scheduledAt: string | null;  // ISO 8601 (YYYY-MM-DD)
  completedAt: string | null;  // ISO 8601
  skippedAt: string | null;    // ISO 8601
  skipReason: string | null;
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  categoryId: string | null;
  category: CategorySummary | null;
};

// タスクステータス
type TaskStatus = "PENDING" | "COMPLETED" | "SKIPPED";

// 優先度
type Priority = "HIGH" | "MEDIUM" | "LOW";

// カテゴリ
type Category = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

// タスクに埋め込むカテゴリ情報（軽量版）
type CategorySummary = {
  id: string;
  name: string;
  color: string;
};

// ユーザー設定
type UserSettings = {
  autoCollapseCompleted: boolean;
  autoCollapseSkipped: boolean;
};
```

### 5.2 カテゴリカラー定数

```typescript
const CATEGORY_COLORS = [
  { name: "red", value: "#EF4444" },
  { name: "orange", value: "#F97316" },
  { name: "yellow", value: "#EAB308" },
  { name: "green", value: "#22C55E" },
  { name: "blue", value: "#3B82F6" },
  { name: "purple", value: "#A855F7" },
  { name: "gray", value: "#6B7280" },
] as const;
```

---

## 6. バリデーションルール

### 6.1 タスク

| フィールド | ルール |
|-----------|--------|
| title | 必須、1〜500文字、空白のみ不可 |
| memo | 任意、最大10000文字 |
| scheduledAt | 任意、有効な日付形式 |
| priority | 任意、HIGH/MEDIUM/LOW のいずれか |
| skipReason | 任意、最大1000文字 |

### 6.2 カテゴリ

| フィールド | ルール |
|-----------|--------|
| name | 必須、1〜50文字、同一ユーザー内で重複不可 |
| color | 必須、有効なカラーコード（#RRGGBB形式） |

---

## 7. 楽観的更新の実装方針

### 7.1 基本フロー

```
1. ユーザー操作
2. UIを即座に更新（楽観的更新）
3. Server Action を実行
4. 成功 → そのまま維持
5. 失敗 → UIをロールバック + エラー通知
```

### 7.2 対象アクション

| Action | 楽観的更新内容 |
|--------|---------------|
| completeTask | チェックボックスON、完了セクションに移動 |
| uncompleteTask | チェックボックスOFF、未完了セクションに移動 |
| skipTask | やらないセクションに移動 |
| unskipTask | 未完了セクションに移動 |
| deleteTask | リストから即座に削除 |
| createTask | リストに即座に追加（仮ID使用） |

### 7.3 状態管理

- React Query（TanStack Query）または SWR を使用
- `useMutation` の `onMutate` で楽観的更新
- `onError` でロールバック
- `onSettled` でキャッシュ再検証

---

## 8. ファイル構成

```
src/
├── actions/
│   ├── task.ts          # タスク関連 Server Actions
│   ├── category.ts      # カテゴリ関連 Server Actions
│   └── settings.ts      # ユーザー設定関連 Server Actions
├── types/
│   ├── task.ts          # タスク関連の型定義
│   ├── category.ts      # カテゴリ関連の型定義
│   ├── settings.ts      # 設定関連の型定義
│   └── action-result.ts # ActionResult 型定義
└── lib/
    └── validations/
        ├── task.ts      # タスクのバリデーションスキーマ
        └── category.ts  # カテゴリのバリデーションスキーマ
```

---

## 9. 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2024/01/XX | 1.0 | 初版作成 |
