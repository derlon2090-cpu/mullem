# Mullem Laravel API Scaffold

هذا المجلد يحتوي scaffold برمجي جاهز لنسخة Laravel الجديدة الخاصة بمنصة `ملم`.

الهدف من هذا المجلد:

- تجهيز هيكل `Backend` احترافي وقابل للتوسع
- فصل منطق الشات والذكاء الاصطناعي والإدارة والدفع
- تقديم نقطة انطلاق واضحة داخل Laravel بدل الاعتماد على موقع `Static` فقط

## ما الذي تم تجهيزه؟

- `routes/api.php`
- Controllers للـ authentication، chat، admin، content، payments
- Models للعلاقات الأساسية
- Migrations للجداول الرئيسية
- Services للذكاء الاصطناعي والدفع
- Seeders لقوالب الـ prompts والباقات
- Config مخصص للمنصة في `config/mullem.php`

## ملاحظات مهمة

- هذه الملفات مكتوبة وفق نمط Laravel وجاهزة للدمج داخل مشروع Laravel فعلي.
- البيئة الحالية هنا لا تحتوي `PHP` أو `Composer`، لذلك لم يتم إنشاء مشروع Laravel كامل عبر `composer create-project`.
- عند تجهيز بيئة Laravel الفعلية، يتم نسخ هذه الملفات إلى مشروع Laravel وتشغيل:

```bash
php artisan migrate
php artisan db:seed
php artisan install:api
```

## أمان الربط مع OpenAI

- لا تضع `OPENAI_API_KEY` داخل الواجهة الأمامية أو ملفات JavaScript الخاصة بالمتصفح.
- المفتاح يجب أن يكون داخل السيرفر فقط عبر `.env`.
- الشات يمر من خلال `Backend` فقط ثم يتم استدعاء OpenAI من الخادم.
- تم تجهيز الـ scaffold بحيث يعيد للمستخدم محتوى آمنًا ومنظفًا بدل إعادة الاستجابة الخام من المزود.
- تم إضافة `throttle` على المسارات الحساسة مثل تسجيل الدخول، إرسال الرسائل، وبدء الدفع.
- إذا تم إرسال مفتاح داخل محادثة أو تذكرة أو مستند عام، يجب اعتباره `exposed` واستبداله فورًا من لوحة OpenAI ثم وضع المفتاح الجديد في السيرفر فقط.

## أهم الـ Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/student/dashboard`
- `GET /api/content`
- `GET /api/chat/sessions`
- `GET /api/chat/sessions/{conversation}`
- `POST /api/chat/send`
- `POST /api/chat/stream`
- `POST /api/payments/checkout`
- `POST /api/payments/webhook/{gateway}`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{user}`
- `GET /api/admin/content`
- `POST /api/admin/content`
- `PUT /api/admin/content/{contentItem}`
- `GET /api/admin/prompt-templates`
- `PUT /api/admin/prompt-templates/{promptTemplate}`
