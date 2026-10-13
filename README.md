# Larina — Research Portfolio V1

奶油白與霧藍的研究型多分頁作品集，以深灰藍標題、純白卡片與少量杏粉點綴。共用色票集中在 `static/css/brand.css`。

已依使用者提供的《公版資料.docx》與《陳彥妤_Larina_Notion_完整簡歷.md》更新實際內容：12 件作品、4 件首頁精選、學歷時間軸、研究發現與作者提供的成果連結。來源整理與尚缺項目見 `CONTENT_SOURCES.md`。Python / Flask / Jinja / JSON / Vanilla JavaScript，無 React、Bootstrap、資料庫或 npm 建置需求。

## Windows / VS Code 啟動

本機已建立 `.venv` 並安裝 Flask。PowerShell：

```powershell
cd C:\03_個人網頁\larina_portfolio
.\.venv\Scripts\Activate.ps1
python app.py
```

開啟 http://127.0.0.1:5000 。停止伺服器按 `Ctrl+C`。

若 PowerShell 不允許執行啟用腳本，可直接使用虛擬環境的 Python，不必更動執行政策：

```powershell
.\.venv\Scripts\python.exe app.py
```

VS Code 請以 `larina_portfolio` 為資料夾，透過 **Python: Select Interpreter** 選擇 `.venv\Scripts\python.exe`。

### 在新環境安裝

建議 Python 3.11 以上。本次以 Python 3.14.4、Flask 3.1.3 驗證。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

這台電腦未啟用 venv 時，`python` 指向無法啟動的 WindowsApps 別名。已找到的實際 Python 路徑為：

```powershell
& "$env:LOCALAPPDATA\Python\pythoncore-3.14-64\python.exe" -m venv .venv
```

程式只綁定 `127.0.0.1:5000`，預設關閉 debug。若 5000 被其他程式使用，先停止既有伺服器，或修改 `app.py` 的 port。

## 結構

```text
larina_portfolio/
├── app.py                 # JSON 載入、路由與 404
├── requirements.txt
├── verify.py              # 路由與資源 smoke checks
├── README.md
├── data/
│   ├── profile.json       # 聯絡方式、CV、學歷
│   ├── projects.json      # 作品卡與詳情內容
│   ├── publications.json
│   ├── research.json
│   └── timeline.json
├── templates/
│   ├── base.html          # 共用 SEO、導覽、頁尾、資源
│   ├── _components.html   # 作品卡、研究卡、流程、時間軸
│   ├── index.html
│   ├── about.html
│   ├── research.html
│   ├── projects.html
│   ├── project_detail.html
│   ├── publications.html
│   ├── journey.html
│   ├── contact.html
│   └── 404.html
└── static/
    ├── css/               # base、components、各頁、responsive
    ├── js/                # main、navbar、animations、projects、counters
    ├── icons/favicon.svg
    ├── images/            # profile、projects、research 預留
    └── files/             # 正式 CV 放置位置
```

## 頁面與互動

- `/`：手繪風全螢幕入口、手繪標題與作者提供的 `asset/icon.webp` 插畫；點擊頭像後經過左右開門轉場進入 `/home`。全站站內換頁共用此轉場，左門把使用 `asset/flower01.webp`，右門把使用 `asset/flower03.webp`。可拖曳頭像並回彈，支援鍵盤、觸控、雙語與減少動態效果；停用 JavaScript 時仍可直接點擊進入。瀏覽器返回會恢復入口畫面。
- `/home`：完整八區首頁、Human → Feedback 依序進場、研究預覽、四個精選作品、工作流程、研究發表、旅程、聯絡 CTA。站內首頁導覽直接前往此處。
- `/about`：跨域介紹、核心能力、基本動畫時間軸與待補學歷。
- `/research`：原生可鍵盤操作的 details 展開卡、相關作品、資料流程、長期變化概念 SVG。
- `/projects`：八類篩選按鈕、結果計數與柔和進場。
- `/projects/<project_id>`：共用 JSON 模板與各案例內容區塊、相關作品；含分數拆解、錯誤程度、問卷計數、生活決策示範。
- `/publications`：簡潔研究發表紀錄、論文及投影片待補狀態。
- `/journey`：桌機曲線路徑、手機直式時間軸。
- `/contact`：必填／Email 驗證、友善成功提示。純前端示範，**不寄信、不儲存資料**；未啟用 JS 時提交按鈕停用。
- 自訂 404：未知頁面與不存在的作品都回傳真正的 HTTP 404。

共用導覽在向下捲動时縮小、向上捲動時展開；手機選單可透過 Escape、點外側或選擇連結關閉。鍵盤 focus、skip link、語意標籤、目前頁面狀態與 `prefers-reduced-motion` 已加入。

動畫使用瀏覽器原生 Web Animations、IntersectionObserver 與 CSS，不需要外部 CDN 或 Python 動畫套件。包含首頁依序進場、研究循環流動線條與節點光暈、桌面指標微幅位移、捲動顯示與流程線條推進、SVG 曲線／時間軸描繪、卡片與鍵盤焦點回饋、作品篩選切換、研究面板展開及統計數字計數。支援 `prefers-reduced-motion` 即時切換，切到背景分頁時暫停裝飾動畫；停用 JavaScript 時內容仍可閱讀。字型採 Inter / Noto Sans TC / 系統 fallback，不另外下載字型。所有視覺皆由 CSS / SVG 製作，沒有抓取外部圖片。

## 如何更新內容

視覺採暖紙色研究筆記風格：`static/css/design.css` 統一導覽、手繪線條、立體便條、研究卡片、交錯作品排版、深色流程章節及內頁樣式。`static/js/interactions.js` 提供桌面按鈕的微幅磁吸互動，首頁研究圖也會隨指標輕微傾斜；觸控與減少動態效果模式停用位移。美編已檢查 320、375、430、768、1024、1440px 六種尺寸，並檢視桌面與手機截圖。

### 一鍵切換中文／英文

導覽列右側的 `EN`／`中文` 按鈕會即時切換全站文字，不重新載入頁面，並使用 localStorage 記住選擇。首次開啟預設繁體中文；手機版按鈕不收進選單。切換保留捲動位置、篩選狀態與表單內容。瀏覽器禁用儲存時，本頁仍可切換。

翻譯由 `static/js/i18n.js` 與 `static/i18n/translations.json` 提供，不連接第三方翻譯服務。字典每筆格式為 `["English", "繁體中文", "選填的原文別名"]`。新增作品文字時也請補字典；未收錄文字會保留原文。人名、品牌與技術名稱可保持原樣。動態篩選結果、表單成功訊息、placeholder、無障礙標籤與網頁語言標記會同步更新；輸入欄位值不翻譯。

若正在執行舊版 Flask，請 `Ctrl+C` 後重新執行 `python app.py`，再用 `Ctrl+F5` 重新整理，以更新快取中的模板與資源。

驗證指令：

```powershell
.\.venv\Scripts\python.exe translation_audit.py
node test_i18n.cjs
```

前者檢查所有頁面的翻譯覆蓋；後者以最小 DOM 測試語言切換、持久化、儲存不可用、動態內容与輸入值保留，不取代真實瀏覽器的視覺驗收。翻譯功能需要 JavaScript；停用時顯示原始雙語內容。

所有 JSON 檔案使用 UTF-8。每次請求重新載入，修改文字後重新整理即可。

### 新增作品

在 `data/projects.json` 複製一筆作品，修改以下欄位，**不需要修改 HTML 或路由**：

| 欄位 | 用途 |
| --- | --- |
| `id` | 唯一網址代號，建議小寫英數與連字號 |
| `title`, `type`, `year`, `role`, `summary` | 作品基本資料 |
| `tags` | 陣列，可使用 Research、AI、HCI、Learning、Health、Data、System |
| `featured` | 首頁只取前四筆為 true 的作品 |
| `visual` | 既有 CSS 視覺：assessment、errors、survey、life、study |
| `visual_label` | 圖卡上的小標 |
| `process` | 流程文字陣列 |
| `sections` | 內容陣列，每筆含 `id`、`title`、`body`，選填 `paragraphs`（額外段落）與 `items` |
| `gallery` | 照片陣列，含 `src`、`alt`、`caption`、`width`、`height` |
| `paper_file` | `static` 下的論文 PDF 路徑，可閱讀、下載與預覽 |

每一個 section 的 `id` 請保持唯一，作為頁內跳轉 anchor。新作品沿用其中一種視覺即可；全新客製故事視覺才需要擴充模板。作品日期未知時以研究原型／課程專題標示，避免推定年份。

### 其他資料

- `research.json` 的 `related` 填作品 id。
- `publications.json` 的 `paper_url`、`slides_url` 補上正式 HTTPS 網址即可啟用連結。
- `profile.json`：填入 `email`、`github`、`linkedin`、`education`。未提供時為 null，顯示「待提供」。
- 將真實履歷放入 `static/files/CV.pdf`，並設定 `"cv": "files/CV.pdf"`。目前刻意不建立空白／虛構 PDF。
- `timeline.json` 維護年份與跨域故事。

**內容狀態：**個人分工、研究方法、結果及限制已依兩份提供資料整理。已加入個人照片、两張福井研討會照片與本機論文 PDF。Email、LinkedIn、正式 CV 與投影片仍待提供。外部報告、影片與 GitHub 入口沿用資料中的連結；未驗證其分享權限。

## 驗證

```powershell
.\.venv\Scripts\python.exe verify.py
```

檢查 20 個主要頁面、站內連結與靜態資源、入口／主頁路由、頭像圖片回應、兩種 404、JSON 格式、新增作品的共用模板，以及聯絡頁不接受後端 POST。JavaScript 檔案已以 `node --check` 通過語法檢查；Node 不是網站執行依賴。

入口已實測 320×568、375×812、430×932、768×1024、1024×768、1440×900 與 812×375 七種視窗尺寸。桌面點擊、拖曳回彈、鍵盤 Enter、手機單次點擊、瀏覽器返回、雙語與減少動態效果皆通過；停用 JavaScript 時原生頭像連結仍可進入 `/home`。

已用本機 Chrome 無視窗模式檢查 1440px 桌面與 375px 手機尺寸，並檢視首頁、研究卡片與圖表截圖。首頁指標位移、離開畫面後暫停、鍵盤焦點、快速作品篩選、面板展開、捲動描線、數字計數、雙語切換、即時減少動態效果與停用 JavaScript 的內容可讀性皆通過，沒有未捕捉的 JavaScript 例外。其他尺寸與實機操作可依下列清單檢查：

1. 在 1440、1024、768、430、375px 檢查排版與橫向溢出。
2. 手機開關選單、Tab 導覽、Escape 關閉與目前頁面標記。
3. Projects 切換每個分類，再切回 All。
4. 研究頁由首頁 anchor 進入時，對應內容是否展開。
5. 聯絡表單的空白、Email 格式與成功提示；確認 Network 沒有送出資料。
6. 捲動檢查 Hero、timeline、計數器與 SVG；啟用 reduced motion 後再檢查閱讀。
7. 停用外部網路或 JavaScript，確認主要內容仍可閱讀。

## 下一階段

優先補 CV、聯絡方式與尚缺的日期／投影片，以及正式出版卷期／DOI；完成各尺寸的瀏覽器視覺验收，再深化四個案例的敘事與動畫。確定寄件服務與部署方式後，才接上真正的表單後端與正式公開網站。

## 執行功能案例的擴充內容

`/projects/executive-function` 已依作者提供的 EF Game README 與 RACE 技術說明整合四種角色、六項森林遊戲、正式測驗與訓練、逐題資料、UCB1、RAG、ML／XAI、統計、長期追蹤及功能限制。保留團隊與個人分工、使用者觀察及原有研究定位。來源與處理原則見 `CONTENT_SOURCES.md`。

共用案例模板支援選填的 `sections[].table`（caption、headers、rows）、`games`（六項任務卡片）、`steps`、`formula` 與 `diagrams`（title、caption、alt、src、src_en、width、height）。圖表位於 `static/images/projects/executive-function/`；繁體中文保留原 SVG，英文版翻譯圖中文字。`static/js/projects.js` 隨語言切換更新圖表及下載入口。大型表格與圖表在各自區域水平捲動，不擴張整頁寬度。
# GitHub Pages 公開部署

公開網站：https://larinastudy01-lab.github.io/larina_portfolio/

GitHub 儲存庫：https://github.com/larinastudy01-lab/larina_portfolio

推送到 `main` 後，`.github/workflows/pages.yml` 會檢查 Flask 頁面、執行 `build_pages.py` 匯出 HTML，再部署到 GitHub Pages。網站的資料、模板與互動腳本仍由原有檔案維護；公開網站不需要執行 Python 伺服器。

本機匯出與預覽（從專案根目錄執行）：

```powershell
.\.venv\Scripts\python.exe build_pages.py --base-url http://127.0.0.1:8000
.\.venv\Scripts\python.exe -m http.server 8000 --directory _site
```

開啟 http://127.0.0.1:8000/。`_site/` 為產生的部署檔案，不加入版本控制。
