# Mullem

منصة تعليمية عربية بواجهة ثابتة في الجذر، مع backend Node في نفس المشروع، ومشروع Laravel داخل [C:\mullem\laravel-api](C:\mullem\laravel-api) للتوسع.

## مهم جدًا

رفع الملفات إلى GitHub لا يعني أن الشات سيعمل.

`GitHub Pages` يشغّل الواجهة الثابتة فقط، ولا يشغّل:

- `node server.js`
- `PHP / Laravel`
- `MySQL`
- `OPENAI_API_KEY`

ولهذا إذا نُشرت الواجهة فقط على GitHub Pages فطلبات:

- `/api/chat/send`
- `/api/solve-question`

ستنتهي غالبًا إلى `The page could not be found`.

## بنية المشروع الحالية

- صفحات الموقع كلها في الجذر:
  - [C:\mullem\index.html](C:\mullem\index.html)
  - [C:\mullem\chat.html](C:\mullem\chat.html)
  - [C:\mullem\admin.html](C:\mullem\admin.html)
  - [C:\mullem\student.html](C:\mullem\student.html)
- خادم Node الفعلي:
  - [C:\mullem\server.js](C:\mullem\server.js)
- طبقة MySQL:
  - [C:\mullem\db.js](C:\mullem\db.js)
- ملف ضبط رابط الـ backend:
  - [C:\mullem\mullem-config.js](C:\mullem\mullem-config.js)
- مشروع Laravel:
  - [C:\mullem\laravel-api](C:\mullem\laravel-api)

## أسرع نشر صحيح

انشر المشروع كـ Node Web Service من الجذر.

الملفات الجاهزة للنشر:

- Railway:
  - [C:\mullem\railway.json](C:\mullem\railway.json)
- Render:
  - [C:\mullem\render.yaml](C:\mullem\render.yaml)

إذا نشرت **الخادم والواجهة معًا** من هذا الجذر، فغالبًا لا تحتاج ضبط `MULLEM_API_BASE` أصلًا، لأن الواجهة والـ API سيكونان على نفس الدومين.

## تشغيل محلي

1. انسخ [C:\mullem\.env.example](C:\mullem\.env.example) إلى `.env`
2. عبئ القيم:

```env
PORT=3000
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-5.4-mini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mullem
DB_USERNAME=root
DB_PASSWORD=
```

3. شغّل:

```bash
npm install
node server.js
```

4. افتح:

```text
http://127.0.0.1:3000
```

## إذا كانت الواجهة منفصلة عن الـ backend

إذا نشرت الواجهة static في مكان، والـ backend في مكان آخر، عدّل:

- [C:\mullem\mullem-config.js](C:\mullem\mullem-config.js)

مثال:

```js
window.MULLEM_API_BASE = "https://your-backend-domain.com";
```

## متغيرات البيئة المطلوبة على الاستضافة

```env
PORT=3000
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-5.4-mini
DB_HOST=your_mysql_host
DB_PORT=3306
DB_DATABASE=mullem
DB_USERNAME=your_mysql_user
DB_PASSWORD=your_mysql_password
```

## فحص نجاح النشر

افتح:

```text
/api/health
```

إذا رجع JSON، فالخادم يعمل.

إذا رجع HTML أو `The page could not be found`، فأنت نشرت الواجهة فقط ولم تنشر backend الحقيقي.

## ملاحظة أمنية

هذه الملفات لا يجب رفعها علنًا داخل المستودع:

- `.env`
- `mysql-data`
- `node_modules`
- `laravel-api/vendor`
- ملفات PHP/MySQL الثنائية المحلية

وهي مستبعدة من الرفع عمدًا حتى يبقى المشروع آمنًا وقابلًا للنشر الصحيح.
