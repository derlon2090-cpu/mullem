const curriculumData = [
  {
    grade: "الثاني الثانوي",
    subject: "الرياضيات",
    term: "الفصل الدراسي الأول",
    lesson: "محيط الدائرة",
    unit: "الهندسة والقياس",
    concepts: ["نصف القطر", "محيط الدائرة", "التعويض في القانون"],
    content:
      "محيط الدائرة يساوي 2 × π × نصف القطر. إذا كان المعطى هو القطر فيجب قسمته على 2 أولًا للحصول على نصف القطر. يمكن تقريب π إلى 3.14 أو استخدام 22/7 عندما يكون ذلك مناسبًا.",
    commonMistakes: [
      "الخلط بين قانون المحيط وقانون المساحة",
      "استخدام القطر مكان نصف القطر مباشرة",
      "نسيان التقريب عند طلب قيمة عشرية"
    ],
    similarQuestion: "احسب محيط دائرة نصف قطرها 5 سم.",
    sampleQuestion: "احسب محيط الدائرة إذا كان نصف القطر 7"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الفيزياء",
    term: "الفصل الدراسي الأول",
    lesson: "الحركة المتسارعة",
    unit: "الحركة في بعد واحد",
    concepts: ["السرعة المتجهة", "التسارع", "المسافة والزمن"],
    content:
      "التسارع هو معدل تغير السرعة المتجهة بالنسبة للزمن. عند حل مسائل الحركة نحدد المعطيات أولًا، ثم نختار القانون المناسب مثل: التسارع = التغير في السرعة ÷ الزمن.",
    commonMistakes: [
      "الخلط بين السرعة والتسارع",
      "إهمال الوحدات",
      "اختيار قانون لا يناسب المعطيات"
    ],
    similarQuestion: "تحرك جسم من السكون حتى وصلت سرعته إلى 20 م/ث خلال 4 ثوان. احسب التسارع.",
    sampleQuestion: "ما المقصود بالتسارع وكيف نحسبه؟"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الكيمياء",
    term: "الفصل الدراسي الأول",
    lesson: "الروابط الكيميائية",
    unit: "بنية الذرة",
    concepts: ["الرابطة الأيونية", "الرابطة التساهمية", "الإلكترونات"],
    content:
      "تتكون الرابطة الأيونية من انتقال إلكترونات من ذرة إلى أخرى، بينما تتكون الرابطة التساهمية من مشاركة الإلكترونات بين الذرات. تحديد نوع الرابطة يعتمد على طبيعة العناصر الداخلة في المركب.",
    commonMistakes: [
      "الخلط بين الانتقال والمشاركة",
      "عدم ربط نوع الرابطة بنوع العناصر",
      "نسيان أثر التكافؤ"
    ],
    similarQuestion: "وضح الفرق بين الرابطة الأيونية والرابطة التساهمية مع مثال لكل منهما.",
    sampleQuestion: "ما الفرق بين الرابطة الأيونية والتساهمية؟"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة العربية",
    term: "الفصل الدراسي الأول",
    lesson: "المبتدأ والخبر",
    unit: "القواعد النحوية",
    concepts: ["الاسم المرفوع", "الجملة الاسمية", "الخبر المفرد والجملة"],
    content:
      "المبتدأ اسم مرفوع نبدأ به الجملة الاسمية، والخبر يبين المعنى الذي نخبر به عن المبتدأ. قد يكون الخبر مفردًا أو جملة أو شبه جملة حسب التركيب.",
    commonMistakes: [
      "الخلط بين الفاعل والمبتدأ",
      "اعتبار كل اسم أول الجملة مبتدأ من دون النظر إلى السياق",
      "إهمال علامة الرفع"
    ],
    similarQuestion: "استخرج المبتدأ والخبر من جملة: المدرسة نظيفة.",
    sampleQuestion: "حدد المبتدأ والخبر في جملة: العلم نور"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة الإنجليزية",
    term: "الفصل الدراسي الأول",
    lesson: "Present Simple",
    unit: "Grammar",
    concepts: ["verb agreement", "he/she/it", "daily routines"],
    content:
      "في المضارع البسيط نضيف s أو es للفعل إذا كان الفاعل he أو she أو it. يستخدم الزمن لوصف العادات والحقائق العامة.",
    commonMistakes: [
      "نسيان إضافة s مع he أو she",
      "استخدام am/is/are مع أفعال ليست في صيغة مستمرة",
      "الخلط بين الحاضر البسيط والمستمر"
    ],
    similarQuestion: "Correct the sentence: She go to school every day.",
    sampleQuestion: "صحح الجملة بالإنجليزية: He play football every day"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الأحياء",
    term: "الفصل الدراسي الثاني",
    lesson: "الخلية",
    unit: "تركيب الكائنات الحية",
    concepts: ["العضيات", "النواة", "الغشاء البلازمي"],
    content:
      "الخلية هي الوحدة الأساسية في بناء الكائن الحي. تحتوي على عضيات متعددة، ولكل عضية وظيفة محددة مثل النواة التي تتحكم في أنشطة الخلية.",
    commonMistakes: [
      "عدم التمييز بين العضية ووظيفتها",
      "الخلط بين الخلية النباتية والحيوانية",
      "إهمال مفهوم الوحدة الأساسية للحياة"
    ],
    similarQuestion: "اذكر وظيفتين للنواة في الخلية.",
    sampleQuestion: "ما أهمية النواة داخل الخلية؟"
  },
  {
    grade: "الثاني الثانوي",
    subject: "العلوم",
    term: "الفصل الدراسي الثاني",
    lesson: "النظام البيئي",
    unit: "علم البيئة",
    concepts: ["المنتجات", "المستهلكات", "السلاسل الغذائية"],
    content:
      "المنتجات تصنع غذاءها بنفسها غالبًا بعملية البناء الضوئي، أما المستهلكات فتتغذى على كائنات أخرى للحصول على الطاقة. فهم هذا الفرق أساسي في دراسة السلاسل الغذائية.",
    commonMistakes: [
      "اعتبار جميع النباتات مستهلكات",
      "عدم ربط الكائن بمصدر طاقته",
      "الخلط بين آكل الأعشاب وآكل اللحوم"
    ],
    similarQuestion: "ما الفرق بين المستهلك الأولي والمستهلك الثانوي؟",
    sampleQuestion: "اشرح الفرق بين المنتجات والمستهلكات في النظام البيئي"
  },
  {
    grade: "الثاني الثانوي",
    subject: "المهارات الرقمية",
    term: "الفصل الدراسي الثاني",
    lesson: "أمن المعلومات",
    unit: "الثقافة الرقمية",
    concepts: ["كلمات المرور", "التصيد", "الحماية"],
    content:
      "أمن المعلومات يهتم بحماية البيانات والأجهزة من الوصول غير المصرح به. من أساسياته اختيار كلمات مرور قوية وعدم مشاركة البيانات مع الروابط المشبوهة.",
    commonMistakes: [
      "استخدام كلمات مرور ضعيفة",
      "الثقة بروابط مجهولة",
      "عدم تحديث أساليب الحماية"
    ],
    similarQuestion: "اذكر خطوتين لحماية حسابك الدراسي من الاختراق.",
    sampleQuestion: "كيف أحمي حسابي من التصيد الإلكتروني؟"
  }
];

const scrollTopButton = document.querySelector("[data-scroll-top]");

function syncScrollTopButton() {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle("visible", window.scrollY > 320);
}

if (scrollTopButton) {
  window.addEventListener("scroll", syncScrollTopButton, { passive: true });
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  syncScrollTopButton();
}

const curriculumLibrary = [
  {
    grade: "الثاني الثانوي",
    subject: "الرياضيات",
    term: "الفصل الدراسي الأول",
    label: "كتاب الرياضيات 2-1 ثاني ثانوي مسارات ف1 - واجباتي",
    url: "https://www.wajibati.net/fhrh1/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الرياضيات",
    term: "الفصل الدراسي الأول",
    label: "حل كتاب الرياضيات 1-2 ثاني ثانوي مسارات - واجباتي",
    url: "https://www.wajibati.net/%D8%AD%D9%84-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA-%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D9%82%D8%B1%D8%B1%D8%A7%D8%AA-1441/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الفيزياء",
    term: "الفصل الدراسي الأول",
    label: "كتاب فيزياء 2 ثاني ثانوي مسارات ف1 - واجباتي",
    url: "https://www.wajibati.net/fez21445/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الفيزياء",
    term: "الفصل الدراسي الأول",
    label: "حل كتاب الفيزياء 2 نظام المسارات - واجباتي",
    url: "https://www.wajibati.net/fezeaa2/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الأحياء",
    term: "الفصل الدراسي الأول",
    label: "كتاب أحياء 2-1 ثاني ثانوي مسارات ف1 - واجباتي",
    url: "https://www.wajibati.net/%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D8%AD%D9%8A%D8%A7%D8%A1-2-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA-1445/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الأحياء",
    term: "الفصل الدراسي الثاني",
    label: "كتاب الأحياء 2-2 ثاني ثانوي مسارات ف2 - واجباتي",
    url: "https://www.wajibati.net/%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D8%A7%D8%AD%D9%8A%D8%A7%D8%A1-2-2-%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA-%D9%812-%D8%A7%D9%84%D9%81%D8%B5/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة العربية",
    term: "الفصل الدراسي الأول",
    label: "كتاب القراءات 1 ثاني ثانوي الفصل الأول - واجباتي",
    url: "https://www.wajibati.net/%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D8%A1%D8%A7%D8%AA-1-%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D8%A7%D9%84%D9%81%D8%B5%D9%84-%D8%A7%D9%84%D8%A7%D9%88%D9%84-1447/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة الإنجليزية",
    term: "الفصل الدراسي الأول",
    label: "كتاب الإنجليزي Mega Goal 2-1 ثاني ثانوي مسارات ف1 - واجباتي",
    url: "https://www.wajibati.net/%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D8%A7%D9%86%D8%AC%D9%84%D9%8A%D8%B2%D9%8A-mega-goal-2-%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA-%D9%811-1446/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة الإنجليزية",
    term: "الفصل الدراسي الأول",
    label: "حل Mega Goal 2-1 ثاني ثانوي مسارات ف1 - واجباتي",
    url: "https://www.wajibati.net/mega-goal-3-altaalib/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الرياضيات",
    term: "الفصل الدراسي الثاني",
    label: "كتاب الرياضيات 2-2 ثاني ثانوي مسارات ف2 - واجباتي",
    url: "https://www.wajibati.net/%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA-2-%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA-%D9%812-1445/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الرياضيات",
    term: "الفصل الدراسي الثاني",
    label: "حل كتاب الرياضيات 2-2 ثاني ثانوي مسارات ف2 - واجباتي",
    url: "https://www.wajibati.net/ry4mqrrat/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الكيمياء",
    term: "الفصل الدراسي الأول",
    label: "كتاب الكيمياء 2-1 ثاني ثانوي مسارات ف1 - واجباتي",
    url: "https://www.wajibati.net/34929/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الكيمياء",
    term: "الفصل الدراسي الثاني",
    label: "كتاب الكيمياء 2-2 ثاني ثانوي مسارات ف2 - واجباتي",
    url: "https://www.wajibati.net/%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1-2-2-%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA-%D9%812-1444/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الكيمياء",
    term: "الفصل الدراسي الثاني",
    label: "حل كتاب الكيمياء 2-2 ثاني ثانوي مسارات ف2 - واجباتي",
    url: "https://www.wajibati.net/%D8%AD%D9%84-%D9%83%D8%AA%D8%A7%D8%A8-%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1-2-2-%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA-%D9%812-1444/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة الإنجليزية",
    term: "الفصل الدراسي الثاني",
    label: "كتاب Mega Goal 2-2 ثاني ثانوي مسارات ف2 - واجباتي",
    url: "https://www.wajibati.net/k-mega2/"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة الإنجليزية",
    term: "الفصل الدراسي الثاني",
    label: "حل Mega Goal 2-2 ثاني ثانوي مسارات ف2 - واجباتي",
    url: "https://www.wajibati.net/megagoal4-altalb/"
  }
];

const wajibatiDirectoryLibrary = {
  "الفصل الدراسي الأول": {
    root: {
      label: "دليل واجباتي للفصل الدراسي الأول",
      url: "https://www.wajibati.net/fsl1/"
    },
    grades: {
      "الأول الابتدائي": "https://www.wajibati.net/fsl1/saf1/",
      "الثاني الابتدائي": "https://www.wajibati.net/fsl1/saf2/",
      "الثالث الابتدائي": "https://www.wajibati.net/fsl1/saf3/",
      "الرابع الابتدائي": "https://www.wajibati.net/fsl1/saf4/",
      "الخامس الابتدائي": "https://www.wajibati.net/fsl1/saf5/",
      "السادس الابتدائي": "https://www.wajibati.net/fsl1/saf6/",
      "الأول المتوسط": "https://www.wajibati.net/fsl1/%D8%A7%D9%88%D9%84-%D9%85%D8%AA%D9%88%D8%B3%D8%B7-%D8%A7%D9%84%D9%81%D8%B5%D9%84-%D8%A7%D9%84%D8%A7%D9%88%D9%84/",
      "الثاني المتوسط": "https://www.wajibati.net/fsl1/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A-%D9%85%D8%AA%D9%88%D8%B3%D8%B7/",
      "الثالث المتوسط": "https://www.wajibati.net/fsl1/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB-%D8%A7%D9%84%D9%85%D8%AA%D9%88%D8%B3%D8%B7/",
      "الأول الثانوي": "https://www.wajibati.net/fsl1/%D8%A7%D9%84%D9%85%D8%B1%D8%AD%D9%84%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9-%D9%85%D9%82%D8%B1%D8%B1%D8%A7%D8%AA/%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA/%D8%A7%D9%84%D8%B3%D9%86%D8%A9-%D8%A7%D9%84%D8%A7%D9%88%D9%84%D9%89/",
      "الثاني الثانوي": "https://www.wajibati.net/fsl1/%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D9%81%D8%B5%D9%84-%D8%A7%D9%84%D8%A7%D9%88%D9%84/",
      "الثالث الثانوي": "https://www.wajibati.net/fsl1/%D8%A7%D9%84%D9%85%D8%B1%D8%AD%D9%84%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9-%D9%85%D9%82%D8%B1%D8%B1%D8%A7%D8%AA/%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA/%D8%A7%D9%84%D8%B3%D9%86%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB%D8%A9/"
    }
  },
  "الفصل الدراسي الثاني": {
    root: {
      label: "دليل واجباتي للفصل الدراسي الثاني",
      url: "https://www.wajibati.net/fsl22/"
    },
    grades: {
      "الأول الابتدائي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%A7%D9%88%D9%84-%D8%A7%D9%84%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/",
      "الثاني الابتدائي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A-%D8%A7%D9%84%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/",
      "الثالث الابتدائي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB-%D8%A7%D9%84%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/",
      "الرابع الابتدائي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%B1%D8%A7%D8%A8%D8%B9-%D8%A7%D9%84%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/",
      "الخامس الابتدائي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AE%D8%A7%D9%85%D8%B3-%D8%A7%D9%84%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/",
      "السادس الابتدائي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%B3%D8%A7%D8%AF%D8%B3-%D8%A7%D9%84%D8%A7%D8%A8%D8%AA%D8%AF%D8%A7%D8%A6%D9%8A/",
      "الأول المتوسط": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%A7%D9%88%D9%84-%D8%A7%D9%84%D9%85%D8%AA%D9%88%D8%B3%D8%B7/",
      "الثاني المتوسط": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%8A-%D8%A7%D9%84%D9%85%D8%AA%D9%88%D8%B3%D8%B7/",
      "الثالث المتوسط": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%AB%D8%A7%D9%84%D8%AB-%D8%A7%D9%84%D9%85%D8%AA%D9%88%D8%B3%D8%B7/",
      "الأول الثانوي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D9%85%D8%B1%D8%AD%D9%84%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9/%D8%A7%D9%88%D9%84-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA/",
      "الثاني الثانوي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D9%85%D8%B1%D8%AD%D9%84%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9/%D8%AB%D8%A7%D9%86%D9%8A-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA/",
      "الثالث الثانوي": "https://www.wajibati.net/fsl22/%D8%A7%D9%84%D9%85%D8%B1%D8%AD%D9%84%D8%A9-%D8%A7%D9%84%D8%AB%D8%A7%D9%86%D9%88%D9%8A%D8%A9/%D8%AB%D8%A7%D9%84%D8%AB-%D8%AB%D8%A7%D9%86%D9%88%D9%8A-%D9%85%D8%B3%D8%A7%D8%B1%D8%A7%D8%AA/"
    }
  }
};

const gradeSubjectCatalog = {
  "الأول الابتدائي": {
    phase: "المرحلة الابتدائية",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "الدراسات الإسلامية", "التربية الفنية", "التربية البدنية"]
  },
  "الثاني الابتدائي": {
    phase: "المرحلة الابتدائية",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "الدراسات الإسلامية", "التربية الفنية", "التربية البدنية"]
  },
  "الثالث الابتدائي": {
    phase: "المرحلة الابتدائية",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "الدراسات الإسلامية", "التربية الفنية", "التربية البدنية"]
  },
  "الرابع الابتدائي": {
    phase: "المرحلة الابتدائية",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية", "التربية الفنية", "التربية البدنية"]
  },
  "الخامس الابتدائي": {
    phase: "المرحلة الابتدائية",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية", "التربية الفنية", "التربية البدنية"]
  },
  "السادس الابتدائي": {
    phase: "المرحلة الابتدائية",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية", "التربية الفنية", "التربية البدنية"]
  },
  "الأول المتوسط": {
    phase: "المرحلة المتوسطة",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية", "التربية الفنية", "التربية البدنية"]
  },
  "الثاني المتوسط": {
    phase: "المرحلة المتوسطة",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية", "التربية الفنية", "التربية البدنية"]
  },
  "الثالث المتوسط": {
    phase: "المرحلة المتوسطة",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية", "التربية الفنية", "التربية البدنية"]
  },
  "الأول الثانوي": {
    phase: "المرحلة الثانوية",
    subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية", "التربية الفنية", "التربية البدنية"]
  },
  "الثاني الثانوي": {
    phase: "المرحلة الثانوية",
    subjects: ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية"]
  },
  "الثالث الثانوي": {
    phase: "المرحلة الثانوية",
    subjects: ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الرقمية"]
  }
};

const subjectKnowledgeBase = {
  "الرياضيات": {
    aliases: ["رياضيات", "معادلة", "هندسة", "كسر", "نسبة", "مساحة", "محيط", "جبر"],
    coreConcepts: ["القوانين", "التعويض", "التحقق", "المعادلات", "الكسور", "الهندسة"],
    commonMistakes: ["نسيان ترتيب العمليات", "التعويض الخاطئ في القانون", "إهمال التحقق من الناتج"],
    sampleQuestions: ["احسب محيط دائرة نصف قطرها 7", "حل المعادلة 3س + 5 = 20", "أوجد مساحة مستطيل طوله 8 وعرضه 5"],
    overview: "تركز الرياضيات على فهم المعطيات وتحديد المطلوب ثم اختيار القانون أو القاعدة المناسبة وإجراء الحل خطوة بخطوة مع التحقق من الناتج."
  },
  "العلوم": {
    aliases: ["علوم", "تجربة", "مادة", "طاقة", "بيئة", "خلية", "كائن", "ظاهرة"],
    coreConcepts: ["المفاهيم العلمية", "التفسير", "التجارب", "الطاقة", "البيئة", "المادة"],
    commonMistakes: ["حفظ التعريف دون فهمه", "الخلط بين السبب والنتيجة", "إهمال الربط بالتجربة أو المثال"],
    sampleQuestions: ["اشرح الفرق بين المنتجات والمستهلكات", "ما المقصود بدورة الماء؟", "فسر حدوث التبخر"],
    overview: "تعتمد العلوم على فهم الظواهر والمفاهيم وربطها بأمثلة وتجارب مبسطة من المنهج مع توضيح السبب العلمي الصحيح."
  },
  "الفيزياء": {
    aliases: ["فيزياء", "تسارع", "سرعة", "قوة", "حركة", "كتلة", "زمن", "إزاحة"],
    coreConcepts: ["الحركة", "القوانين الفيزيائية", "الوحدات", "التسارع", "القوة", "الزمن"],
    commonMistakes: ["الخلط بين الكميات الفيزيائية", "نسيان الوحدات", "اختيار قانون لا يناسب المعطيات"],
    sampleQuestions: ["ما المقصود بالتسارع وكيف نحسبه؟", "احسب السرعة إذا قطع جسم 100 متر في 20 ثانية", "فسر قانون نيوتن الثاني"],
    overview: "تُحل مسائل الفيزياء بتحديد المعطيات والوحدات ثم اختيار القانون المناسب والتعويض فيه ومراجعة منطق النتيجة."
  },
  "الكيمياء": {
    aliases: ["كيمياء", "ذرة", "جزيء", "عنصر", "مركب", "رابطة", "تفاعل", "تكافؤ"],
    coreConcepts: ["الذرات", "الروابط", "العناصر", "التفاعلات", "المركبات", "التكافؤ"],
    commonMistakes: ["الخلط بين العنصر والمركب", "عدم تحديد نوع الرابطة", "إهمال التكافؤ أو الشحنة"],
    sampleQuestions: ["ما الفرق بين الرابطة الأيونية والتساهمية؟", "عرّف العنصر والمركب", "اشرح معنى التكافؤ"],
    overview: "تعتمد الكيمياء على تفسير بناء المادة وعلاقات العناصر والمركبات مع ربط المفاهيم الأساسية بالأمثلة الشائعة في الكتاب."
  },
  "الأحياء": {
    aliases: ["أحياء", "خلية", "وراثة", "نواة", "عضية", "كائن حي", "تنفس", "نبات"],
    coreConcepts: ["الخلية", "العضيات", "الكائنات الحية", "الوراثة", "الأجهزة الحيوية", "الوظائف الحيوية"],
    commonMistakes: ["الخلط بين الأعضاء والعضيات", "عدم ربط التركيب بالوظيفة", "نسيان المفاهيم الأساسية للحياة"],
    sampleQuestions: ["ما أهمية النواة داخل الخلية؟", "اذكر وظيفة الغشاء البلازمي", "اشرح الفرق بين الخلية النباتية والحيوانية"],
    overview: "تشرح الأحياء تركيب الكائنات الحية ووظائف أجزائها مع التركيز على الربط بين البنية والوظيفة والمصطلحات العلمية الدقيقة."
  },
  "اللغة العربية": {
    aliases: ["عربي", "نحو", "بلاغة", "إملاء", "تعبير", "مبتدأ", "خبر", "فاعل", "لغة عربية"],
    coreConcepts: ["النحو", "البلاغة", "الإملاء", "القراءة", "التعبير", "التحليل اللغوي"],
    commonMistakes: ["الخلط بين الوظائف النحوية", "إهمال علامات الإعراب", "ضعف الربط بين القاعدة والتطبيق"],
    sampleQuestions: ["حدد المبتدأ والخبر في جملة: العلم نور", "استخرج الفاعل من الجملة", "صحح الأخطاء الإملائية في النص"],
    overview: "تقوم اللغة العربية على تحليل المطلوب ثم تحديد القاعدة المناسبة وتطبيقها على المثال مع بيان السبب اللغوي الصحيح."
  },
  "اللغة الإنجليزية": {
    aliases: ["English", "grammar", "verb", "tense", "translate", "correct", "إنجليزي", "انجليزي"],
    coreConcepts: ["grammar", "translation", "sentence structure", "tenses", "vocabulary", "writing"],
    commonMistakes: ["الخلط بين الأزمنة", "نسيان توافق الفعل مع الفاعل", "ترجمة حرفية غير مناسبة"],
    sampleQuestions: ["صحح الجملة بالإنجليزية: He play football every day", "Translate this sentence into English", "ما الفرق بين present simple وpresent continuous؟"],
    overview: "تعتمد الإنجليزية على فهم معنى الجملة ثم تطبيق قاعدة مناسبة في الزمن أو الصياغة أو الترجمة مع تصحيح الخطأ وشرح سببه."
  },
  "الاجتماعيات": {
    aliases: ["اجتماعيات", "تاريخ", "جغرافيا", "وطنية", "مواطنة", "خريطة", "سكان"],
    coreConcepts: ["التاريخ", "الجغرافيا", "المواطنة", "الخرائط", "الأحداث", "المفاهيم الوطنية"],
    commonMistakes: ["حفظ المعلومة دون فهم سياقها", "الخلط بين الأزمنة التاريخية", "عدم الربط بين الحدث ونتيجته"],
    sampleQuestions: ["اذكر أهمية الموقع الجغرافي للمملكة", "فسر سبب قيام الدولة السعودية الأولى", "ما المقصود بالمواطنة؟"],
    overview: "تشرح الاجتماعيات الأحداث والمواقع والمفاهيم الوطنية من خلال ربط السبب بالنتيجة وتوضيح السياق التاريخي أو الجغرافي."
  },
  "المهارات الرقمية": {
    aliases: ["مهارات رقمية", "حاسب", "تقنية", "برمجة", "أمن معلومات", "شبكات", "إنترنت", "ملفات"],
    coreConcepts: ["الأمن الرقمي", "المهارات الحاسوبية", "الإنترنت", "البرمجة", "الملفات", "الحماية"],
    commonMistakes: ["استخدام مصطلحات غير دقيقة", "إهمال خطوات الأمان", "الخلط بين نوعي الأجهزة أو الشبكات"],
    sampleQuestions: ["كيف أحمي حسابي من التصيد الإلكتروني؟", "ما أهمية النسخ الاحتياطي؟", "اشرح الفرق بين الملف والمجلد"],
    overview: "تركز المهارات الرقمية على الاستخدام الآمن والفعّال للتقنية مع شرح الخطوات العملية والمفاهيم الأساسية بلغة واضحة."
  },
  "الدراسات الإسلامية": {
    aliases: ["إسلامية", "فقه", "توحيد", "حديث", "تفسير", "سيرة", "دراسات إسلامية"],
    coreConcepts: ["العبادات", "العقيدة", "الأحاديث", "الآداب", "السيرة", "الأحكام"],
    commonMistakes: ["الخلط بين الدليل والحكم", "نسيان الشرط أو الركن", "الاعتماد على صياغة غير دقيقة"],
    sampleQuestions: ["اذكر أركان الإسلام", "ما الفرق بين الشرط والركن؟", "اشرح معنى الإحسان"],
    overview: "توضح الدراسات الإسلامية الأحكام والمفاهيم الشرعية بطريقة تعليمية مبسطة مع ربطها بالدليل والمعنى الصحيح."
  },
  "التربية الفنية": {
    aliases: ["فنية", "رسم", "ألوان", "تصميم", "تشكيل", "منظور"],
    coreConcepts: ["العناصر الفنية", "الألوان", "التصميم", "التوازن", "المنظور", "التكوين"],
    commonMistakes: ["إهمال الفكرة الأساسية للعمل", "عدم التمييز بين العناصر الفنية", "الخلط بين اللون الأساسي والثانوي"],
    sampleQuestions: ["ما المقصود بالألوان الأساسية؟", "اشرح معنى التوازن في العمل الفني", "اذكر عناصر التكوين الفني"],
    overview: "تساعد التربية الفنية على فهم العناصر والأسس الجمالية للعمل الفني وربطها بأمثلة تطبيقية مبسطة."
  },
  "التربية البدنية": {
    aliases: ["بدنية", "رياضة", "لياقة", "تمرين", "إحماء", "صحة"],
    coreConcepts: ["اللياقة", "الإحماء", "المرونة", "التحمل", "السلامة", "الحركة"],
    commonMistakes: ["إهمال الإحماء", "عدم التمييز بين أنواع اللياقة", "تطبيق التمرين بطريقة غير صحيحة"],
    sampleQuestions: ["ما أهمية الإحماء قبل التمرين؟", "اذكر فوائد النشاط البدني", "ما الفرق بين المرونة والتحمل؟"],
    overview: "تشرح التربية البدنية أسس اللياقة والصحة البدنية والسلامة أثناء التمرين مع توضيح المفاهيم بشكل عملي."
  }
};

const webSourceRegistry = [
  {
    name: "بيت العلم",
    domains: ["baetiy.com"],
    category: "مرجع تعليمي مساعد",
    priority: 1,
    useCase: "أولوية أولى في المراجعة التعليمية المساندة قبل التحقق النهائي من الكتاب والمنهج."
  },
  {
    name: "عين التعليمية",
    domains: ["ien.edu.sa", "mobile.ien.edu.sa"],
    category: "مرجع رسمي",
    priority: 2,
    useCase: "مراجعة رسمية من المحتوى التعليمي الوطني والدروس الرقمية المرتبطة بالمنهج السعودي."
  },
  {
    name: "واجباتي",
    domains: ["wajibati.net"],
    category: "مرجع منهجي",
    priority: 3,
    useCase: "مراجعة الكتاب ودليل الصف وحلول المنهج بعد المقارنة مع المصادر التعليمية الأخرى."
  },
  {
    name: "ويكيبيديا العربية",
    domains: ["wikipedia.org", "ar.wikipedia.org"],
    category: "مرجع عام",
    priority: 4,
    useCase: "يستخدم لشرح المفاهيم العامة والمقارنة السريعة عند الحاجة."
  }
];

function createGeneratedCurriculumData() {
  const terms = ["الفصل الدراسي الأول", "الفصل الدراسي الثاني"];

  return Object.entries(gradeSubjectCatalog).flatMap(([grade, config]) =>
    terms.flatMap((term) =>
      config.subjects.map((subject) => {
        const profile = subjectKnowledgeBase[subject];
        if (!profile) {
          return null;
        }

        return {
          grade,
          subject,
          term,
          lesson: `${subject} - المنهج العام`,
          unit: `${config.phase} - المهارات الأساسية`,
          concepts: profile.coreConcepts,
          content: `${profile.overview} هذا الملخص محفوظ محليًا داخل ملم يحل لتقريب المادة حتى لو لم يكتب الطالب اسم الدرس بشكل صريح.`,
          commonMistakes: profile.commonMistakes,
          similarQuestion: profile.sampleQuestions[0],
          sampleQuestion: profile.sampleQuestions[1] || profile.sampleQuestions[0]
        };
      }).filter(Boolean)
    )
  );
}

const curriculumRecords = [...curriculumData, ...createGeneratedCurriculumData()];

const storageKeys = {
  runtime: "mlm_runtime",
  trainingMode: "mlm_training_mode",
  likedMemory: "mlm_liked_memory",
  dislikedMemory: "mlm_disliked_memory",
  history: "mlm_chat_history",
  analytics: "mlm_analytics",
  users: "mlm_users",
  currentUser: "mlm_current_user",
  theme: "mlm_theme"
};

const messageList = document.querySelector("[data-messages]");
const promptInput = document.querySelector("[data-prompt]");
const fileInput = document.querySelector("[data-file-input]");
const attachmentList = document.querySelector("[data-attachments]");
const form = document.querySelector("[data-chat-form]");
const gradeSelect = document.querySelector("[data-grade]");
const subjectSelect = document.querySelector("[data-subject]");
const termSelect = document.querySelector("[data-term]");
const lessonInput = document.querySelector("[data-lesson]");
const runtimeSelect = document.querySelector("[data-runtime]");
const trainingModeSelect = document.querySelector("[data-training-mode]");
const learnList = document.querySelector("[data-learned]");
const historyList = document.querySelector("[data-history]");
const insightsList = document.querySelector("[data-insights]");
const questionBank = document.querySelector("[data-question-bank]");
const wajibatiLibraryList = document.querySelector("[data-wajibati-library]");
const termCoverageList = document.querySelector("[data-term-coverage]");
const webPolicyList = document.querySelector("[data-web-policy]");
const statusChip = document.querySelector("[data-status]");
const xpBalanceNodes = document.querySelectorAll("[data-xp-balance]");
const selectionSummary = document.querySelector("[data-selection-summary]");
const runtimeSummary = document.querySelector("[data-runtime-summary]");
const startChatButton = document.querySelector("[data-start-chat]");
const quickSolveButton = document.querySelector("[data-quick-solve]");
const heroExampleButton = document.querySelector("[data-hero-example]");
const themeToggleButton = document.querySelector("[data-theme-toggle]");
const uploadButton = document.querySelector("[data-open-upload]");
const starterButtons = document.querySelectorAll("[data-starter-prompt], [data-starter-action]");
const uploadImageButton = document.querySelector("[data-upload-image]");
const uploadFileButton = document.querySelector("[data-upload-file]");
const focusSubjectButton = document.querySelector("[data-focus-subject]");
const clearChatButton = document.querySelector("[data-clear-chat]");

let attachments = [];
let lastUserQuestion = "";
let clarificationCursor = 0;
let likedMemory = loadJson(storageKeys.likedMemory, []);
let dislikedMemory = loadJson(storageKeys.dislikedMemory, []);
let chatHistory = loadJson(storageKeys.history, []);
let analytics = loadJson(storageKeys.analytics, createDefaultAnalytics());
let users = loadJson(storageKeys.users, createDefaultUsers());

analytics = { ...createDefaultAnalytics(), ...analytics };

if (!Array.isArray(users) || users.length === 0) {
  users = createDefaultUsers();
}

function getActiveUserId() {
  return localStorage.getItem(storageKeys.currentUser) || users[0]?.id || "student-demo-1";
}

function getActiveUser() {
  const activeUserId = getActiveUserId();
  return users.find((entry) => entry.id === activeUserId) || users[0] || createDefaultUsers()[0];
}

applyTheme(localStorage.getItem(storageKeys.theme) || "light");
runtimeSelect.value = localStorage.getItem(storageKeys.runtime) || "vLLM Runtime";
trainingModeSelect.value = localStorage.getItem(storageKeys.trainingMode) || "Prompt + RAG";

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createDefaultAnalytics() {
  return {
    totalMessages: 0,
    totalLikes: 0,
    totalDislikes: 0,
    xpUsed: 0,
    dailyMessages: {},
    subjects: {},
    grades: {},
    feedback: [],
    savedSessions: 0
  };
}

function createDefaultUsers() {
  return [
    {
      id: "student-demo-1",
      name: "طالب تجريبي",
      email: "student@mullem.sa",
      role: "Student",
      package: "مجاني محدود",
      xp: 120,
      status: "نشط",
      activity: "بدأ استخدام الشات الأكاديمي"
    }
  ];
}

function saveSettings() {
  localStorage.setItem(storageKeys.runtime, runtimeSelect.value);
  localStorage.setItem(storageKeys.trainingMode, trainingModeSelect.value);
  updateStatus();
}

function updateStatus() {
  const runtime = runtimeSelect.value;
  const trainingMode = trainingModeSelect.value;
  statusChip.textContent = runtime === "وضع تجريبي داخل الواجهة" ? "وضع محلي تجريبي" : `AI محلي | ${runtime}`;
  runtimeSummary.textContent = `التشغيل الحالي: ${runtime} مع طبقة سلوكية ${trainingMode}. المعرفة تأتي من RAG للمنهج السعودي، أما أسلوب الرد فيمثّل سلوك ملم يحل.`;
}

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
  if (themeToggleButton) {
    themeToggleButton.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

function updateXpBalance() {
  const currentXp = getActiveUser()?.xp ?? 120;
  xpBalanceNodes.forEach((node) => {
    node.textContent = currentXp;
  });
}

function populateGradeOptions() {
  const currentGrade = gradeSelect.value || "الثاني الثانوي";
  const groupedGrades = Object.entries(gradeSubjectCatalog).reduce((bucket, [grade, config]) => {
    if (!bucket[config.phase]) {
      bucket[config.phase] = [];
    }
    bucket[config.phase].push(grade);
    return bucket;
  }, {});

  gradeSelect.innerHTML = Object.entries(groupedGrades)
    .map(
      ([phase, grades]) => `
        <optgroup label="${phase}">
          ${grades
            .map((grade) => `<option${grade === currentGrade ? " selected" : ""}>${grade}</option>`)
            .join("")}
        </optgroup>
      `
    )
    .join("");
}

function updateSubjectOptions(preferredSubject = subjectSelect.value) {
  const grade = gradeSelect.value;
  const allowedSubjects = gradeSubjectCatalog[grade]?.subjects || Object.keys(subjectKnowledgeBase);

  subjectSelect.innerHTML = allowedSubjects
    .map((subject) => `<option${subject === preferredSubject ? " selected" : ""}>${subject}</option>`)
    .join("");

  if (!allowedSubjects.includes(subjectSelect.value)) {
    subjectSelect.value = allowedSubjects[0];
  }
}

function autoGrow(element) {
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
}

function getCurrentSelection() {
  return {
    grade: gradeSelect.value,
    subject: subjectSelect.value,
    term: termSelect.value,
    lesson: lessonInput.value.trim() || "غير محدد"
  };
}

function updateSelectionSummary() {
  const selection = getCurrentSelection();
  selectionSummary.textContent = `الصف: ${selection.grade} | المادة: ${selection.subject} | الفصل: ${selection.term} | الدرس: ${selection.lesson === "غير محدد" ? "اختياري ويُستنتج من السؤال" : selection.lesson}`;
  renderQuestionBank();
  renderWajibatiLibrary();
  renderTermCoverage();
}

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function inferSubjectFromQuestion(question, grade) {
  const availableSubjects = gradeSubjectCatalog[grade]?.subjects || Object.keys(subjectKnowledgeBase);
  const normalizedQuestion = normalizeText(question);
  const questionTokens = tokenizeForModel(question);
  let bestMatch = {
    subject: availableSubjects[0] || "الرياضيات",
    score: 0
  };

  availableSubjects.forEach((subject) => {
    const profile = subjectKnowledgeBase[subject];
    if (!profile) {
      return;
    }

    const lexicon = [subject, ...profile.aliases, ...profile.coreConcepts, ...profile.sampleQuestions].join(" ");
    const lexiconTokens = tokenizeForModel(lexicon);
    let score = jaccardSimilarity(questionTokens, lexiconTokens) * 2.5;

    profile.aliases.forEach((alias) => {
      if (normalizedQuestion.includes(normalizeText(alias))) {
        score += 0.8;
      }
    });

    profile.coreConcepts.forEach((concept) => {
      if (normalizedQuestion.includes(normalizeText(concept))) {
        score += 0.45;
      }
    });

    if (score > bestMatch.score) {
      bestMatch = { subject, score };
    }
  });

  return bestMatch;
}

function findRelevantLesson(question) {
  const selection = getCurrentSelection();
  const normalizedQuestion = normalizeText(question);
  const lessonHint = normalizeText(selection.lesson);
  const inferredSubject = inferSubjectFromQuestion(question, selection.grade);
  const resolvedSubject = inferredSubject.score > 0.18 ? inferredSubject.subject : selection.subject;
  const sameStageCandidates = curriculumRecords.filter(
    (item) => item.grade === selection.grade && item.term === selection.term
  );
  const candidates = sameStageCandidates.length > 0 ? sameStageCandidates : curriculumRecords;

  const ranked = candidates
    .map((item) => {
      let score = 0;
      const lessonText = `${item.lesson} ${item.unit} ${item.content} ${item.sampleQuestion} ${item.concepts.join(" ")}`;
      const lessonTokens = tokenizeForModel(lessonText);

      if (item.subject === resolvedSubject) {
        score += 5;
      }

      if (item.subject === selection.subject) {
        score += 1.2;
      }

      if (lessonHint !== "غير محدد") {
        const itemLesson = normalizeText(item.lesson);
        if (itemLesson.includes(lessonHint) || lessonHint.includes(itemLesson)) {
          score += 4;
        }
      }

      if (normalizedQuestion.includes(normalizeText(item.lesson))) {
        score += 2.5;
      }

      if (normalizedQuestion.includes(normalizeText(item.unit))) {
        score += 1.5;
      }

      item.concepts.forEach((concept) => {
        if (normalizedQuestion.includes(normalizeText(concept))) {
          score += 1.1;
        }
      });

      score += jaccardSimilarity(tokenizeForModel(question), lessonTokens) * 6;

      return { item, score };
    })
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.item || curriculumRecords[0];
}

function buildCurriculumContext(lesson) {
  if (!lesson) {
    return "لا يوجد محتوى منهجي محلي مناسب حاليًا.";
  }

  return `
الوحدة: ${lesson.unit}
الدرس: ${lesson.lesson}
المفاهيم: ${lesson.concepts.join("، ")}
ملخص المنهج: ${lesson.content}
أخطاء شائعة في هذا الدرس: ${lesson.commonMistakes.join("، ")}
سؤال مشابه من نفس الدرس: ${lesson.similarQuestion}
  `.trim();
}

function detectQuestionType(question) {
  const normalized = normalizeText(question);

  if (extractChoiceOptions(question)?.options.length) return "اختيار من متعدد";
  if (normalized.includes("اختر") || normalized.includes("اختيار")) return "اختيار من متعدد";
  if (normalized.includes("صح") && normalized.includes("خطأ")) return "صح وخطأ";
  if (normalized.includes("اشرح") || normalized.includes("فسر")) return "سؤال تفسيري";
  if (normalized.includes("حل") || normalized.includes("احسب") || normalized.includes("معادلة")) return "مسألة حسابية";
  if (normalized.includes("صحح") || normalized.includes("correct")) return "تصحيح وصياغة";
  return "سؤال أكاديمي عام";
}

function extractChoiceOptions(question) {
  const lines = question
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const options = lines
    .map((line) => {
      const match = line.match(/^([أ-دA-D1-4])[\)\-\.:\s]+(.+)$/u);
      if (!match) {
        return null;
      }

      return {
        key: match[1],
        text: match[2].trim()
      };
    })
    .filter(Boolean);

  if (options.length >= 2) {
    const stem = lines.filter((line) => !line.match(/^([أ-دA-D1-4])[\)\-\.:\s]+/u)).join(" ");
    return { stem: stem || question, options };
  }

  return null;
}

function analyzeChoiceQuestion(question, lesson) {
  const normalized = normalizeText(question);
  const trueFalse = normalized.includes("صح") && normalized.includes("خطأ");
  const choiceBundle = extractChoiceOptions(question);
  const knowledgeText = `${lesson.lesson} ${lesson.unit} ${lesson.content} ${lesson.concepts.join(" ")} ${lesson.similarQuestion}`;

  if (trueFalse && !choiceBundle) {
    const positiveScore = jaccardSimilarity(tokenizeForModel(question), tokenizeForModel(knowledgeText));
    const verdict = positiveScore >= 0.12 ? "صح" : "خطأ";
    return {
      mode: "truefalse",
      finalAnswer: verdict,
      explanation: `بعد تحليل العبارة ومقارنتها بمفاهيم ${lesson.lesson} فالنتيجة الأقرب هي: ${verdict}.`,
      steps: [
        "تحليل نص العبارة.",
        `مقارنتها بمفاهيم ${lesson.lesson}.`,
        `ترجيح الحكم النهائي: ${verdict}.`
      ]
    };
  }

  if (!choiceBundle) {
    return null;
  }

  const rankedOptions = choiceBundle.options
    .map((option) => ({
      ...option,
      score: jaccardSimilarity(
        tokenizeForModel(`${choiceBundle.stem} ${option.text}`),
        tokenizeForModel(knowledgeText)
      )
    }))
    .sort((left, right) => right.score - left.score);

  const best = rankedOptions[0];
  return {
    mode: "mcq",
    finalAnswer: `الخيار الصحيح هو <span class="mcq-highlight">(${best.key}) ${best.text}</span>`,
    explanation: `بعد تحليل السؤال والخيارات ومقارنتها بمحتوى ${lesson.lesson} كان الخيار (${best.key}) هو الأقرب للجواب الصحيح.`,
    steps: [
      "تحديد المطلوب من السؤال.",
      "مقارنة كل خيار بالمفهوم الدراسي.",
      `ترجيح (${best.key}) لأنه الأكثر اتساقًا مع ${lesson.lesson}.`
    ]
  };
}

function trySolveStructuredQuestion(question, lesson) {
  if (!lesson) return null;

  const normalizedQuestion = normalizeText(question);
  const normalizedLesson = normalizeText(lesson.lesson);
  const numericValues = [...question.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));

  if (
    normalizedLesson.includes("محيط الدائرة") &&
    normalizedQuestion.includes("محيط") &&
    normalizedQuestion.includes("دائرة") &&
    numericValues.length
  ) {
    const rawValue = numericValues[0];
    const usesDiameter = normalizedQuestion.includes("القطر") && !normalizedQuestion.includes("نصف القطر");
    const radius = usesDiameter ? rawValue / 2 : rawValue;
    const symbolicFactor = Number((2 * radius).toFixed(2));
    const approximate = Number((2 * Math.PI * radius).toFixed(2));

    return {
      finalAnswer: `محيط الدائرة = ${symbolicFactor}π ≈ ${approximate}`,
      explanation: `نستخدم قانون محيط الدائرة: 2 × π × نصف القطر.${usesDiameter ? " بما أن المعطى هو القطر قسمناه على 2 أولًا." : ""}`,
      steps: [
        usesDiameter ? `نصف القطر = ${rawValue} ÷ 2 = ${radius}.` : `نصف القطر = ${radius}.`,
        `التعويض: 2 × π × ${radius}.`,
        `الناتج النهائي: ${symbolicFactor}π ≈ ${approximate}.`
      ],
      similar: `احسب محيط دائرة نصف قطرها ${radius === 7 ? 5 : radius + 1}.`
    };
  }

  return null;
}

const intentModel = {
  academic: [
    "احسب محيط دائرة نصف قطرها 7",
    "اشرح الفرق بين المنتجات والمستهلكات",
    "صحح الجملة بالانجليزي",
    "ما المقصود بالتسارع وكيف نحسبه",
    "حدد المبتدأ والخبر في الجملة"
  ],
  chat: [
    "كيف حالك",
    "هلا",
    "شكرا",
    "صباح الخير",
    "وش اخبارك"
  ],
  help: [
    "كيف استخدم المنصة",
    "اشرح لي طريقة استخدام ملم يحل",
    "وش تسوي",
    "كيف ارفع صورة",
    "ما الذي تقدمه المنصة"
  ]
};

function tokenizeForModel(message) {
  return normalizeText(message)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccardSimilarity(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) {
      intersection += 1;
    }
  });

  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function getIntentScores(message) {
  const tokens = tokenizeForModel(message);
  const scores = {
    academic: 0,
    chat: 0,
    help: 0
  };

  Object.entries(intentModel).forEach(([label, examples]) => {
    const exampleScores = examples.map((example) =>
      jaccardSimilarity(tokens, tokenizeForModel(example))
    );
    const averageScore =
      exampleScores.reduce((sum, value) => sum + value, 0) / Math.max(exampleScores.length, 1);
    scores[label] = averageScore;
  });

  if (/\d/.test(message) || message.includes("=") || message.includes("؟")) {
    scores.academic += 0.18;
  }

  if (message.includes("كيف") && message.includes("استخدم")) {
    scores.help += 0.28;
  }

  if (message.includes("كيف حالك") || message.includes("شكرا")) {
    scores.chat += 0.32;
  }

  return scores;
}

function classifyIntent(message, hasAttachments = false) {
  if (hasAttachments) {
    return {
      label: "academic",
      confidence: 0.99,
      scores: { academic: 0.99, chat: 0.01, help: 0.01 },
      model: "attachment-priority"
    };
  }

  const scores = getIntentScores(message);
  const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestLabel, bestScore] = ranking[0];
  const secondScore = ranking[1]?.[1] ?? 0;
  const confidence = Math.max(0.35, Math.min(0.99, bestScore + (bestScore - secondScore)));

  return {
    label: bestLabel,
    confidence,
    scores,
    model: "local-intent-model-v2"
  };
}

function needsClarification(message, intentResult, hasAttachments = false) {
  if (hasAttachments) {
    return false;
  }

  const normalized = normalizeText(message);
  const unclearAcademicTerms = ["حلها", "اشرح", "ساعد", "سؤال", "مسألة", "هذا", "ذي", "حل", "وضح"];
  const tokens = tokenizeForModel(message);

  if (intentResult.label !== "academic") {
    return false;
  }

  if (/\d/.test(normalized) && tokens.length >= 3) {
    return false;
  }

  if (lessonInput.value.trim() && tokens.length >= 3) {
    return false;
  }

  if (tokens.length >= 4) {
    return false;
  }

  if (intentResult.confidence < 0.42 && tokens.length <= 3) {
    return true;
  }

  if (normalized.length <= 4) {
    return true;
  }

  if (unclearAcademicTerms.includes(normalized)) {
    return true;
  }

  return normalized.split(/\s+/).length <= 2 && !/\d/.test(normalized);
}

function formatSimpleReply(text) {
  return `
    <div class="simple-reply">
      <p>${text}</p>
    </div>
  `;
}

function createCasualResponse(message) {
  const normalized = normalizeText(message);

  if (normalized.includes("كيف حالك") || normalized.includes("شلونك")) {
    return "تمام! كيف أقدر أساعدك؟";
  }

  if (normalized.includes("شكرا") || normalized.includes("يعطيك العافية")) {
    return "العفو، أنا حاضر. إذا عندك سؤال دراسي أو تحتاج شرح استخدام المنصة فأنا معك.";
  }

  if (normalized.includes("السلام عليكم") || normalized.includes("مرحبا") || normalized.includes("هلا")) {
    return "وعليكم السلام، أهلًا بك. كيف أقدر أساعدك اليوم؟";
  }

  return "أنا معك. إذا عندك سؤال دراسي أكتبه لي، وإذا تريد فقط دردشة أو مساعدة في استخدام المنصة فأقدر أساعدك أيضًا.";
}

function createHelpResponse() {
  return "تقدر تبدأ باختيار الصف والمادة والفصل، والدرس هنا اختياري لأن ملم يحل يحاول استنتاجه من السؤال نفسه. بعد ذلك اكتب سؤالك أو ارفع صورة من زر +، وإذا كان السؤال أكاديميًا سأعطيك الحل والشرح والخطوات.";
}

function createClarificationResponse(message) {
  const normalized = normalizeText(message);
  const variants = [
    "أحتاج جزءًا أوضح من السؤال حتى أجيب بدقة.",
    "أقدر أساعدك، لكن أحتاج تفاصيل أكثر قليلًا.",
    "حتى أعطيك جوابًا صحيحًا، وضّح المقصود أكثر."
  ];
  const intro = variants[clarificationCursor % variants.length];
  clarificationCursor += 1;

  let prompt = "اكتب السؤال كاملًا أو اختر أحد الخيارات السريعة التالية:";
  const actions = [];

  if (normalized.includes("هذا") || normalized.includes("ذي") || normalized.includes("وش الحل")) {
    prompt = "أرسل نص السؤال كاملًا أو ارفع صورة واضحة للسؤال حتى أتمكن من الحل.";
    actions.push(
      { label: "ارفع صورة السؤال", action: "upload-image" },
      { label: "اكتب السؤال كاملًا", fill: "اكتب السؤال كاملًا هنا مع المعطيات والمطلوب." }
    );
  } else if (normalized.includes("اشرح")) {
    prompt = "ما الدرس أو المفهوم الذي تريد شرحه؟ اكتب اسم الدرس أو اختر المادة أولًا.";
    actions.push(
      { label: "اختيار المادة", action: "focus-subject" },
      { label: "اشرح درس الانقسام المتساوي", fill: "اشرح الفرق بين الانقسام المتساوي والانقسام المنصف." }
    );
  } else {
    actions.push(
      { label: "اكتب السؤال كاملًا", fill: "اكتب السؤال كاملًا مع المطلوب." },
      { label: "ارفع صورة السؤال", action: "upload-image" },
      { label: "اختيار المادة", action: "focus-subject" }
    );
  }

  return { intro, prompt, actions };
}

function formatClarificationReply(payload) {
  return `
    <div class="clarify-card">
      <p>${payload.intro}</p>
      <p>${payload.prompt}</p>
      <div class="inline-actions">
        ${payload.actions
          .map((action) => {
            if (action.fill) {
              return `<button class="inline-action-btn" type="button" data-fill-prompt="${action.fill}">${action.label}</button>`;
            }

            return `<button class="inline-action-btn" type="button" data-action="${action.action}">${action.label}</button>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function setPromptValue(value, nextSubject = "") {
  promptInput.value = value;
  if (nextSubject) {
    updateSubjectOptions(nextSubject);
    const allowedSubjects = gradeSubjectCatalog[gradeSelect.value]?.subjects || [];
    if (allowedSubjects.includes(nextSubject)) {
      subjectSelect.value = nextSubject;
    }
  }
  autoGrow(promptInput);
  updateSelectionSummary();
  promptInput.focus();
}

function openImageUpload() {
  fileInput.setAttribute("accept", ".png,.jpg,.jpeg,.webp");
  fileInput.click();
}

function openGenericUpload() {
  fileInput.setAttribute("accept", ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md");
  fileInput.click();
}

function createLoadingCopy() {
  const loadingVariants = [
    "جاري تحليل السؤال واستخراج المطلوب...",
    "جاري مطابقة السؤال مع الدرس والمفاهيم المرتبطة...",
    "جاري تجهيز الحل بصيغة تعليمية واضحة..."
  ];

  const first = loadingVariants[analytics.totalMessages % loadingVariants.length];
  const second = loadingVariants[(analytics.totalMessages + 1) % loadingVariants.length];

  return `
    <div class="clarify-card">
      <p>${first}</p>
      <p class="muted-inline">${second}</p>
    </div>
  `;
}

function renderWelcomeMessage() {
  addMessage(
    "assistant",
    "ملم يحل",
    `<div class="answer-grid">
      <section class="answer-section answer-section-wide">
        <h4>كيف أقدر أساعدك اليوم؟</h4>
        <p>أنا مساعد أكاديمي للمنهج السعودي. أستطيع حل الأسئلة، شرح الدروس، تحليل الأخطاء، واختيار الإجابة الصحيحة إذا كان السؤال بنمط صح وخطأ أو متعدد الخيارات.</p>
        <p class="logic-note">أمثلة سريعة: احسب محيط دائرة نصف قطرها 7 | اشرح قانون نيوتن الثاني | حل هذا السؤال (مع صورة) | س: ما نوع الرابطة في NaCl؟ أ) تساهمية ب) أيونية ج) فلزية د) هيدروجينية</p>
      </section>
    </div>`
  );
}

function resetConversationView() {
  messageList.innerHTML = "";
  attachments = [];
  if (fileInput) {
    fileInput.value = "";
  }
  renderAttachments();
  renderWelcomeMessage();
}

const academicPromptRule =
  'If the user message is not an academic question, respond in a normal conversational way without using the academic response format.';

const academicSystemPrompt = [
  "أنت ملم يحل، مساعد أكاديمي.",
  "إذا كانت الرسالة أكاديمية فاعرض الإجابة النهائية والشرح والخطوات والأخطاء الشائعة والسؤال المشابه والربط بالمنهج.",
  "إذا كانت الرسالة غير أكاديمية فاردد بشكل طبيعي ومختصر.",
  academicPromptRule
].join(" ");

const chatSystemPrompt =
  "رد بشكل طبيعي ومختصر ولطيف، ومن دون أي تنسيق أكاديمي أو خطوات حل أو ربط بالمنهج.";

function formatAssistantSections(response) {
  if (response.answerMode === "mcq" || response.answerMode === "truefalse") {
    return `
      <div class="answer-grid">
        <section class="answer-section answer-section-wide">
          <h4>${response.answerMode === "truefalse" ? "✅ الحكم النهائي" : "✅ الخيار الصحيح"}</h4>
          <p>${response.finalAnswer}</p>
        </section>
        <section class="answer-section">
          <h4>📘 التحليل المختصر</h4>
          <p>${response.explanation}</p>
        </section>
      </div>
    `;
  }

  return `
    <div class="answer-grid">
      <section class="answer-section">
        <h4>✅ الإجابة النهائية</h4>
        <p>${response.finalAnswer}</p>
      </section>
      <section class="answer-section">
        <h4>📘 الشرح</h4>
        <p>${response.explanation}</p>
      </section>
      <section class="answer-section">
        <h4>🧮 خطوات الحل</h4>
        <ul>${response.steps.map((step) => `<li>${step}</li>`).join("")}</ul>
      </section>
      <section class="answer-section">
        <h4>⚠️ أخطاء شائعة</h4>
        <ul>${response.mistakes.map((mistake) => `<li>${mistake}</li>`).join("")}</ul>
      </section>
      <section class="answer-section answer-section-wide">
        <h4>🔁 سؤال مشابه</h4>
        <p>${response.similar}</p>
      </section>
      <section class="answer-section answer-section-wide">
        <h4>📚 الربط بالمنهج</h4>
        <p>${response.curriculumLink}</p>
      </section>
    </div>
  `;
}

function getCurriculumSources(subject, term, grade) {
  return curriculumLibrary.filter(
    (item) => item.grade === grade && item.subject === subject && item.term === term
  );
}

function getWajibatiDirectorySources(grade, term) {
  const termBucket = wajibatiDirectoryLibrary[term];
  if (!termBucket) {
    return [];
  }

  const sources = [
    {
      url: termBucket.root.url,
      label: termBucket.root.label,
      type: "دليل واجباتي"
    }
  ];

  const gradeUrl = termBucket.grades[grade];
  if (gradeUrl) {
    sources.push({
      url: gradeUrl,
      label: `كتب ${grade} - ${term}`,
      type: "دليل الصف"
    });
  }

  return sources;
}

function getGradeTermCoverage(grade, subject) {
  const terms = ["الفصل الدراسي الأول", "الفصل الدراسي الثاني"];
  return terms.map((term) => {
    const directBooks = getCurriculumSources(subject, term, grade);
    const directorySources = getWajibatiDirectorySources(grade, term);

    return {
      term,
      directBooks,
      directorySources,
      hasCoverage: directorySources.length > 0
    };
  });
}

function getSourceProfile(url = "") {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return (
      webSourceRegistry.find((source) =>
        source.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
      ) || {
        name: hostname || "مصدر غير مصنف",
        category: "مصدر غير مصنف",
        priority: 5,
        useCase: "يحتاج مراجعة قبل اعتماده كمصدر متكرر."
      }
    );
  } catch (error) {
    return {
      name: "مصدر غير معروف",
      category: "مصدر غير مصنف",
      priority: 5,
      useCase: "الرابط غير واضح أو غير مكتمل."
    };
  }
}

function buildPrioritySearchLinks(question, selection) {
  const query = encodeURIComponent(
    `${selection.grade} ${selection.subject} ${selection.term} ${question}`.trim()
  );

  return [
    {
      url: `https://www.google.com/search?q=site%3Abaetiy.com+${query}`,
      label: `بحث بيت العلم: ${selection.subject} - ${question}`,
      type: "مراجعة تعليمية"
    },
    {
      url: `https://www.google.com/search?q=site%3Aien.edu.sa+${query}`,
      label: `بحث عين التعليمية: ${selection.subject} - ${question}`,
      type: "مراجعة رسمية"
    },
    {
      url: `https://www.google.com/search?q=site%3Awajibati.net+${query}`,
      label: `بحث واجباتي: ${selection.subject} - ${question}`,
      type: "مراجعة من الكتاب"
    }
  ];
}

function createSourcesMarkup(sources) {
  if (!sources || sources.length === 0) {
    return "";
  }

  return `
    <div class="sources-list">
      ${sources
        .map((source) => {
          const sourceMeta =
            typeof source === "string"
              ? { url: source, label: source, type: "مرجع" }
              : {
                  url: source.url,
                  label: source.label || source.url,
                  type: source.type || "مرجع"
                };
          const profile = getSourceProfile(sourceMeta.url);

          return `<a class="source-link" href="${sourceMeta.url}" target="_blank" rel="noreferrer">${sourceMeta.type} | ${profile.category}: ${sourceMeta.label}</a>`;
        })
        .join("")}
    </div>
  `;
}

function renderWajibatiLibrary() {
  if (!wajibatiLibraryList) {
    return;
  }

  const selection = getCurrentSelection();
  const directBookSources = getCurriculumSources(selection.subject, selection.term, selection.grade).map(
    (item) => ({
      url: item.url,
      label: item.label,
      type: "كتاب مباشر"
    })
  );
  const directorySources = getWajibatiDirectorySources(selection.grade, selection.term);
  const references = [...directBookSources, ...directorySources];

  if (references.length === 0) {
    wajibatiLibraryList.innerHTML = `
      <div class="memory-item">
        <strong>لا توجد مراجع جاهزة لهذا الاختيار بعد</strong>
        <span>يمكنك تغيير الصف أو المادة أو الفصل لعرض أقرب مراجع من واجباتي.</span>
      </div>
    `;
    return;
  }

  wajibatiLibraryList.innerHTML = references
    .map(
      (item) => `
        <a class="memory-item" href="${item.url}" target="_blank" rel="noreferrer">
          <strong>${item.type}</strong>
          <span>${item.label}</span>
        </a>
      `
    )
    .join("");
}

function renderTermCoverage() {
  if (!termCoverageList) {
    return;
  }

  const selection = getCurrentSelection();
  const coverage = getGradeTermCoverage(selection.grade, selection.subject);

  termCoverageList.innerHTML = coverage
    .map((entry) => {
      const directCount = entry.directBooks.length;
      const summary = directCount > 0
        ? `مرجع مباشر للمادة: ${directCount} | دليل الصف والكتب متوفر.`
        : "دليل الصف والكتب متوفر من واجباتي، والتحليل يعتمد أيضًا على المخزون المحلي للمادة.";

      return `
        <div class="memory-item">
          <strong>${entry.term}</strong>
          <span>${summary}</span>
        </div>
      `;
    })
    .join("");
}

function renderWebPolicy() {
  if (!webPolicyList) {
    return;
  }

  webPolicyList.innerHTML = webSourceRegistry
    .sort((left, right) => left.priority - right.priority)
    .map(
      (source) => `
        <div class="memory-item">
          <strong>${source.name} | ${source.category}</strong>
          <span>${source.useCase}</span>
        </div>
      `
    )
    .join("");
}

function addMessage(role, title, content, options = {}) {
  const { likeable = false, messagePayload = null, sources = [] } = options;
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const heading = document.createElement("div");
  heading.className = "message-title";
  heading.textContent = title;

  const body = document.createElement("div");
  body.className = "message-body";
  if (typeof content === "string") {
    body.innerHTML = content;
  }

  article.append(heading, body);

  if (sources.length > 0) {
    const sourcesWrap = document.createElement("div");
    sourcesWrap.innerHTML = createSourcesMarkup(sources);
    article.appendChild(sourcesWrap);
  }

  if (likeable && messagePayload) {
    const tools = document.createElement("div");
    tools.className = "message-tools";

    const likeButton = document.createElement("button");
    likeButton.type = "button";
    likeButton.className = "mini-btn";
    likeButton.textContent = "👍 أعجبني";

    const dislikeButton = document.createElement("button");
    dislikeButton.type = "button";
    dislikeButton.className = "mini-btn disliked";
    dislikeButton.textContent = "👎 لم يعجبني";

    likeButton.addEventListener("click", () => {
      if (likeButton.classList.contains("active")) return;
      likeButton.classList.add("active");
      dislikeButton.disabled = true;
      rememberFeedback("like", messagePayload);
    });

    dislikeButton.addEventListener("click", () => {
      if (dislikeButton.classList.contains("active")) return;
      dislikeButton.classList.add("active");
      likeButton.disabled = true;
      rememberFeedback("dislike", messagePayload);
    });

    tools.append(likeButton, dislikeButton);
    article.appendChild(tools);
  }

  messageList.appendChild(article);
  messageList.scrollTop = messageList.scrollHeight;
}

function renderAttachments() {
  attachmentList.innerHTML = "";

  attachments.forEach((file) => {
    const item = document.createElement("div");
    item.className = "attachment";
    item.textContent = file.name;
    attachmentList.appendChild(item);
  });
}

function renderLearnedMemory() {
  learnList.innerHTML = "";

  if (likedMemory.length === 0) {
    learnList.innerHTML = `
      <div class="memory-item">
        <strong>لا يوجد تفضيل محفوظ بعد</strong>
        <span>عندما تضغط إعجابًا على إجابة مناسبة سيعرضها ملم يحل هنا ليتعلم من النمط الذي فضّلته.</span>
      </div>
    `;
    return;
  }

  likedMemory.slice(0, 4).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `<strong>${entry.question}</strong><span>${entry.summary}</span>`;
    learnList.appendChild(item);
  });
}

function renderHistory() {
  historyList.innerHTML = "";

  if (chatHistory.length === 0) {
    historyList.innerHTML = `
      <div class="history-item">
        <strong>لا توجد مراجعات محفوظة بعد</strong>
        <span>ستظهر هنا آخر الجلسات لتتمكن من العودة إليها ومراجعة تطورك الدراسي.</span>
      </div>
    `;
    return;
  }

  chatHistory.slice(0, 5).forEach((session) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <strong>${session.subject} | ${session.lesson}</strong>
      <span>${session.question}</span>
    `;
    item.addEventListener("click", () => {
      promptInput.value = session.question;
      autoGrow(promptInput);
      gradeSelect.value = session.grade;
      updateSubjectOptions(session.subject);
      subjectSelect.value = session.subject;
      termSelect.value = session.term;
      lessonInput.value = session.lesson === "غير محدد" ? "" : session.lesson;
      updateSelectionSummary();
      promptInput.focus();
    });
    historyList.appendChild(item);
  });
}

function renderInsights() {
  insightsList.innerHTML = "";

  const subjectRanking = Object.entries(analytics.subjects).sort((a, b) => b[1] - a[1]);
  const weakSubject = subjectRanking.length ? subjectRanking[subjectRanking.length - 1][0] : null;
  const strongSubject = subjectRanking.length ? subjectRanking[0][0] : null;
  const dislikedTopics = dislikedMemory.slice(0, 2).map((entry) => entry.lesson).filter(Boolean);

  const items = [
    strongSubject
      ? `أفضل نشاط حاليًا في مادة ${strongSubject}.`
      : "ابدأ أول سؤال لك لتظهر قراءة أولية لمستواك.",
    weakSubject
      ? `تحتاج مراجعة إضافية في ${weakSubject} إذا استمرت قلة التفاعل فيه.`
      : "لا توجد مادة ضعيفة واضحة حتى الآن.",
    dislikedTopics.length
      ? `لاحظنا صعوبة في: ${[...new Set(dislikedTopics)].join("، ")}.`
      : "لا توجد أخطاء متكررة كافية لاستخراج تنبيه دقيق بعد.",
    analytics.totalMessages > 0
      ? `أرسلت ${analytics.totalMessages} رسالة تعليمية حتى الآن، وهذا يساعد على تحليل أدق لمستواك.`
      : "تحليل الطالب يظهر هنا بعد أول استخدام فعلي."
  ];

  items.forEach((text) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `<strong>مؤشر ذكي</strong><span>${text}</span>`;
    insightsList.appendChild(item);
  });
}

function renderQuestionBank() {
  questionBank.innerHTML = "";

  const selection = getCurrentSelection();
  const filtered = curriculumRecords.filter(
    (item) =>
      item.grade === selection.grade &&
      item.subject === selection.subject &&
      item.term === selection.term
  );

  const profile = subjectKnowledgeBase[selection.subject];
  const bank = filtered.length > 0
    ? filtered
    : (profile?.sampleQuestions || []).map((sampleQuestion) => ({
        lesson: `${selection.subject} - المنهج العام`,
        sampleQuestion
      }));

  bank.slice(0, 4).forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-btn";
    button.textContent = entry.sampleQuestion;
    button.addEventListener("click", () => {
      lessonInput.value = entry.lesson;
      promptInput.value = entry.sampleQuestion;
      updateSelectionSummary();
      autoGrow(promptInput);
      promptInput.focus();
    });
    questionBank.appendChild(button);
  });
}

function rememberFeedback(type, messagePayload) {
  const summary = messagePayload.finalAnswer.slice(0, 180);
  const entry = {
    question: messagePayload.question,
    summary,
    subject: messagePayload.subject,
    grade: messagePayload.grade,
    term: messagePayload.term,
    lesson: messagePayload.lesson,
    savedAt: Date.now()
  };

  if (type === "like") {
    likedMemory.unshift(entry);
    likedMemory = likedMemory.slice(0, 10);
    analytics.totalLikes += 1;
    saveJson(storageKeys.likedMemory, likedMemory);
  } else {
    dislikedMemory.unshift(entry);
    dislikedMemory = dislikedMemory.slice(0, 10);
    analytics.totalDislikes += 1;
    saveJson(storageKeys.dislikedMemory, dislikedMemory);
  }

  analytics.feedback.unshift({
    type,
    question: entry.question,
    subject: entry.subject,
    grade: entry.grade,
    savedAt: entry.savedAt
  });
  analytics.feedback = analytics.feedback.slice(0, 20);
  saveAnalytics();
  renderLearnedMemory();
  renderInsights();
}

function saveAnalytics() {
  saveJson(storageKeys.analytics, analytics);
  saveJson(storageKeys.users, users);
  updateXpBalance();
}

function trackUsage(selection) {
  analytics.totalMessages += 1;
  analytics.xpUsed += selection.intent === "academic" ? 7 : 1;

  if (selection.intent === "academic") {
    analytics.subjects[selection.subject] = (analytics.subjects[selection.subject] || 0) + 1;
    analytics.grades[selection.grade] = (analytics.grades[selection.grade] || 0) + 1;
  }

  const dayKey = new Date().toISOString().slice(0, 10);
  analytics.dailyMessages[dayKey] = (analytics.dailyMessages[dayKey] || 0) + 1;
  const activeUser = getActiveUser();
  activeUser.xp = Math.max(0, activeUser.xp - (selection.intent === "academic" ? 7 : 1));
  activeUser.activity =
    selection.intent === "academic"
      ? `آخر نشاط في ${selection.subject} - ${selection.lesson}`
      : `آخر نشاط: ${selection.intent === "help" ? "طلب مساعدة" : "محادثة عادية"}`;
  saveAnalytics();
}

function saveSession(question, response) {
  const session = {
    question,
    grade: response.grade,
    subject: response.subject,
    term: response.term,
    lesson: response.lesson,
    finalAnswer: response.finalAnswer,
    savedAt: Date.now()
  };

  chatHistory.unshift(session);
  chatHistory = chatHistory.slice(0, 15);
  analytics.savedSessions = chatHistory.length;
  saveJson(storageKeys.history, chatHistory);
  saveAnalytics();
  renderHistory();
}

function scoreEvidenceSnippet(snippet, question, lesson) {
  const snippetTokens = tokenizeForModel(snippet);
  const questionTokens = tokenizeForModel(question);
  const conceptTokens = lesson ? lesson.concepts.flatMap((concept) => tokenizeForModel(concept)) : [];

  return (
    jaccardSimilarity(snippetTokens, questionTokens) * 0.7 +
    jaccardSimilarity(snippetTokens, conceptTokens) * 0.3
  );
}

async function fetchWikipediaCandidates(query, language = "ar", limit = 3) {
  const searchUrl = `https://${language}.wikipedia.org/w/api.php?origin=*&action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&srlimit=${limit}`;

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error("تعذر الوصول إلى نتائج الويب.");
  }

  const data = await response.json();
  const results = data?.query?.search || [];

  const summaries = await Promise.all(
    results.slice(0, limit).map(async (result) => {
      const title = result.title;
      const summaryResponse = await fetch(
        `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );

      if (!summaryResponse.ok) {
        return null;
      }

      const summary = await summaryResponse.json();
      return {
        title: summary.title || title,
        snippet: summary.extract || "",
        url: summary.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        source: `${language}.wikipedia.org`
      };
    })
  );

  return summaries.filter(Boolean);
}

async function collectWebEvidence(question, lesson, subject) {
  const queries = [
    question,
    `${subject} ${lesson.lesson}`,
    `${subject} ${lesson.unit} ${question}`.trim()
  ];

  const collected = [];
  const seenUrls = new Set();

  for (const query of queries) {
    try {
      const candidates = await fetchWikipediaCandidates(query, "ar", 2);
      candidates.forEach((candidate) => {
        if (!seenUrls.has(candidate.url)) {
          seenUrls.add(candidate.url);
          collected.push(candidate);
        }
      });
    } catch (error) {
      continue;
    }
  }

  const ranked = collected
    .map((item) => ({
      ...item,
      sourceProfile: getSourceProfile(item.url),
      score: scoreEvidenceSnippet(item.snippet, question, lesson)
    }))
    .sort((a, b) => {
      const priorityDelta = (a.sourceProfile?.priority || 5) - (b.sourceProfile?.priority || 5);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }
      return b.score - a.score;
    })
    .slice(0, 3);

  if (ranked.length === 0) {
    return {
      evidence: [],
      summary: "لم أتمكن من جلب مصادر ويب مباشرة الآن، لذلك تم اعتماد المنهج المحلي أولًا.",
      decision: "تم ترجيح محتوى المنهج المحلي لعدم توفر أدلة ويب كافية."
    };
  }

  const strongest = ranked[0];
  const classes = [...new Set(ranked.map((item) => item.sourceProfile?.category || "مرجع عام"))].join("، ");
  return {
    evidence: ranked,
    summary: `تمت مراجعة ${ranked.length} مصادر ويب ومقارنتها مع المنهج. التصنيف المستخدم: ${classes}. الأقرب كان: ${strongest.title}.`,
    decision: `جرى ترجيح الإجابة التي تتوافق أكثر مع مفاهيم درس ${lesson.lesson} ومع أولوية نوع المصدر ثم تكرار الفكرة الأساسية داخل المصادر المجمعة.`
  };
}

function createLocalResponse(question, lesson) {
  const questionType = detectQuestionType(question);
  const selection = getCurrentSelection();
  const choiceAnalysis = lesson ? analyzeChoiceQuestion(question, lesson) : null;
  const structuredSolution = lesson ? trySolveStructuredQuestion(question, lesson) : null;
  const finalAnswer = choiceAnalysis
    ? choiceAnalysis.finalAnswer
    : lesson && question
      ? `اعتمادًا على درس ${lesson.lesson} في ${selection.subject}، الحل الأقرب هو: ${lesson.content.split(" ").slice(0, 16).join(" ")}...`
      : `تم تحليل سؤالك في ${selection.subject}، لكن يفضّل تحديد الدرس بدقة لرفع جودة الإجابة.`;

  const explanation = choiceAnalysis
    ? choiceAnalysis.explanation
    : lesson
      ? `ربطت السؤال بدرس ${lesson.lesson} من وحدة ${lesson.unit}، ثم استخرجت المفاهيم الأساسية: ${lesson.concepts.join("، ")}.`
      : `لم أجد درسًا مطابقًا بشكل كامل، لذلك اعتمدت على المادة والسياق العام لتقديم شرح تدريجي.`;

  const steps = choiceAnalysis
    ? choiceAnalysis.steps
    : lesson
      ? [
          `تحديد نوع السؤال: ${questionType}.`,
          `الرجوع إلى محتوى المنهج المحلي في درس ${lesson.lesson}.`,
          `استخراج الفكرة الأساسية: ${lesson.concepts[0]}.`,
          `بناء حل مبسط يناسب ${selection.grade} مع ربطه بالسياق الدراسي.`
        ]
      : [
          "قراءة صيغة السؤال وتحديد المطلوب.",
          "تجهيز شرح مبسط بناءً على المادة المختارة.",
          "اقتراح الدرس الأقرب لمراجعة الطالب."
        ];

  return {
    question,
    grade: selection.grade,
    subject: selection.subject,
    term: selection.term,
    answerMode: choiceAnalysis?.mode || "full",
    lesson: lesson ? lesson.lesson : selection.lesson,
    finalAnswer,
    explanation,
    steps,
    mistakes: lesson ? lesson.commonMistakes : ["عدم تحديد الدرس بدقة", "القفز إلى النتيجة قبل فهم المطلوب"],
    similar: lesson ? lesson.similarQuestion : "اكتب سؤالًا آخر من نفس الدرس وسأولده لك بصيغة مشابهة.",
    curriculumLink: lesson
      ? `${selection.grade} > ${selection.subject} > ${selection.term} > ${lesson.unit} > ${lesson.lesson}`
      : `${selection.grade} > ${selection.subject} > ${selection.term}`
  };
}

function createImprovedLocalResponse(question, lesson) {
  const questionType = detectQuestionType(question);
  const selection = getCurrentSelection();
  const choiceAnalysis = lesson ? analyzeChoiceQuestion(question, lesson) : null;
  const structuredSolution = lesson ? trySolveStructuredQuestion(question, lesson) : null;

  const finalAnswer = choiceAnalysis
    ? choiceAnalysis.finalAnswer
    : structuredSolution
      ? structuredSolution.finalAnswer
      : lesson && question
        ? lesson.content.split(" ").slice(0, 18).join(" ")
        : `تم تحليل سؤالك في ${selection.subject}، لكن يُفضّل تحديد الدرس بدقة لرفع جودة الإجابة.`;

  const explanation = choiceAnalysis
    ? choiceAnalysis.explanation
    : structuredSolution
      ? structuredSolution.explanation
      : lesson
        ? lesson.content
        : "لم أجد درسًا مطابقًا بشكل كامل، لذلك اعتمدت على المادة والسياق العام لتقديم شرح مبسط.";

  const steps = choiceAnalysis
    ? choiceAnalysis.steps
    : structuredSolution
      ? structuredSolution.steps
      : lesson
        ? [
            `تحديد نوع السؤال: ${questionType}.`,
            `الرجوع إلى محتوى درس ${lesson.lesson}.`,
            `استخراج الفكرة الأساسية: ${lesson.concepts[0]}.`,
            "تقديم الحل بشكل مباشر ومبسط."
          ]
        : [
            "قراءة صيغة السؤال وتحديد المطلوب.",
            "تجهيز شرح مبسط بناءً على المادة المختارة.",
            "اقتراح الدرس الأقرب للمراجعة."
          ];

  return {
    question,
    grade: selection.grade,
    subject: selection.subject,
    term: selection.term,
    answerMode: choiceAnalysis?.mode || "full",
    lesson: lesson ? lesson.lesson : selection.lesson,
    finalAnswer,
    explanation,
    steps,
    mistakes: lesson ? lesson.commonMistakes : ["عدم تحديد الدرس بدقة", "القفز إلى النتيجة قبل فهم المطلوب"],
    similar: structuredSolution?.similar || (lesson ? lesson.similarQuestion : "اكتب سؤالًا آخر من نفس الدرس وسأولده لك بصيغة مشابهة."),
    curriculumLink: lesson
      ? `${selection.grade} > ${selection.subject} > ${selection.term} > ${lesson.unit} > ${lesson.lesson}`
      : `${selection.grade} > ${selection.subject} > ${selection.term}`
  };
}

async function toAttachmentInputs(files) {
  const inputs = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const dataUrl = await fileToDataUrl(file);
      inputs.push({
        type: "input_image",
        image_url: dataUrl,
        detail: "auto"
      });
      continue;
    }

    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      inputs.push({
        type: "input_text",
        text: `محتوى الملف (${file.name}):\n${text.slice(0, 10000)}`
      });
      continue;
    }

    inputs.push({
      type: "input_text",
      text: `تم إرفاق ملف باسم ${file.name}. إذا تعذر قراءة محتواه مباشرة فاعتمد على وصف السؤال والمرفقات المصاحبة.`
    });
  }

  return inputs;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractUrls(value, bucket = new Set()) {
  if (!value) return bucket;

  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/[^\s)"]+/g);
    if (matches) {
      matches.forEach((match) => bucket.add(match));
    }
    return bucket;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => extractUrls(item, bucket));
    return bucket;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => extractUrls(item, bucket));
  }

  return bucket;
}

function parseAiText(rawText, lesson) {
  const cleaned = rawText.trim();
  const paragraphs = cleaned.split(/\n+/).filter(Boolean);
  const finalAnswer = paragraphs[0] || "تمت معالجة السؤال بنجاح.";
  const explanation = paragraphs.slice(1, 3).join(" ") || lesson.content;
  const steps = paragraphs.length > 3
    ? paragraphs.slice(3, 7)
    : [
        `الرجوع إلى درس ${lesson.lesson}.`,
        "استخراج المفاهيم الأساسية من المنهج.",
        "بناء شرح مبسط ومباشر للطالب."
      ];

  return {
    question: lastUserQuestion,
    grade: gradeSelect.value,
    subject: subjectSelect.value,
    term: termSelect.value,
    lesson: lesson.lesson,
    finalAnswer,
    explanation,
    steps,
    mistakes: lesson.commonMistakes,
    similar: lesson.similarQuestion,
    curriculumLink: `${gradeSelect.value} > ${subjectSelect.value} > ${termSelect.value} > ${lesson.unit} > ${lesson.lesson}`
  };
}

async function requestAI(question, lesson) {
  const localResponse = createImprovedLocalResponse(question, lesson);
  const runtime = runtimeSelect.value;
  const trainingMode = trainingModeSelect.value;
  const selection = getCurrentSelection();
  const attachmentsInput = await toAttachmentInputs(attachments);
  const hasFiles = attachmentsInput.length > 0;
  const selectedPrompt = academicSystemPrompt;
  void selectedPrompt;
  const webConsensus = await collectWebEvidence(question, lesson, subjectSelect.value);
  const curriculumSources = getCurriculumSources(
    subjectSelect.value,
    termSelect.value,
    gradeSelect.value
  );
  const directorySources = getWajibatiDirectorySources(gradeSelect.value, termSelect.value);

  const normalizedCurriculumSources = curriculumSources.map((item) => ({
    url: item.url,
    label: item.label,
    type: "مرجع المنهج"
  }));
  const normalizedDirectorySources = directorySources.map((item) => ({
    url: item.url,
    label: item.label,
    type: item.type
  }));
  const prioritizedSearchSources = buildPrioritySearchLinks(question, selection).map((item) => ({
    ...item,
    type: item.type
  }));
  const normalizedWebSources = webConsensus.evidence.map((item) => ({
    url: item.url,
    label: item.title || item.url,
    type: "مرجع ويب"
  }));
  const allSources = [
    ...prioritizedSearchSources,
    ...normalizedCurriculumSources,
    ...normalizedDirectorySources,
    ...normalizedWebSources
  ].filter(
    (item, index, array) => item.url && array.findIndex((entry) => entry.url === item.url) === index
  );
  const curriculumReferenceNote = normalizedCurriculumSources.length
    ? `تمت مطابقة السؤال أيضًا مع مراجع محفوظة من واجباتي مثل ${normalizedCurriculumSources
        .slice(0, 2)
        .map((item) => item.label)
        .join("، ")}.`
    : normalizedDirectorySources.length
      ? `تم دعم الإجابة أيضًا بدليل واجباتي الخاص بـ${gradeSelect.value} في ${termSelect.value} حتى مع عدم توفر كتاب مباشر محفوظ لهذه المادة بعد.`
      : "لا توجد مراجع واجباتي محفوظة لهذا الاختيار بعد، لذلك تم الاعتماد أكثر على محتوى الدرس المحلي ومراجعة الويب.";
  const allTermCoverage = getGradeTermCoverage(gradeSelect.value, subjectSelect.value);
  const termsCoverageNote = `التغطية الحالية لهذا الصف تشمل ${allTermCoverage
    .map((entry) => `${entry.term} (${entry.directBooks.length > 0 ? `${entry.directBooks.length} كتاب/حل مباشر` : "دليل الصف والكتب"})`)
    .join("، ")}.`;
  const priorityPolicyNote =
    "ترتيب التحقق الخارجي المعتمد هنا هو: بيت العلم أولًا، ثم عين التعليمية، ثم واجباتي لمراجعة الكتاب والمنهج، ثم المراجع العامة للمقارنة النهائية.";

  void runtime;
  void trainingMode;
  void hasFiles;
  void webConsensus;
  void normalizedCurriculumSources;
  void priorityPolicyNote;
  void curriculumReferenceNote;
  void termsCoverageNote;

  const response = {
    ...localResponse,
    curriculumLink: localResponse.curriculumLink
  };

  return {
    response,
    sources: allSources
  };
}

function addPendingMessage() {
  addMessage(
    "assistant",
    "ملم يحل",
    createLoadingCopy()
  );
}

async function handleSubmit(event) {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  if (!prompt && attachments.length === 0) return;

  const hasAttachments = attachments.length > 0;
  const intentResult = classifyIntent(prompt, hasAttachments);
  const selection = getCurrentSelection();
  const lesson = findRelevantLesson(prompt || selection.lesson);

  if (lesson?.subject && lesson.subject !== subjectSelect.value) {
    updateSubjectOptions(lesson.subject);
    subjectSelect.value = lesson.subject;
  }

  const resolvedSelection = getCurrentSelection();
  lastUserQuestion = prompt || "سؤال مرفوع عبر ملفات مرفقة";

  const userText = attachments.length
    ? `${prompt || "أرفقت ملفًا أو صورة مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments
        .map((file) => file.name)
        .join("، ")}</span>`
    : prompt;

  addMessage("user", "أنت", userText);
  trackUsage({
    intent: intentResult.label,
    grade: resolvedSelection.grade,
    subject: resolvedSelection.subject,
    lesson: lesson.lesson
  });

  if (needsClarification(prompt, intentResult, hasAttachments)) {
    const clarification = createClarificationResponse(prompt);
    addMessage(
      "assistant",
      "ملم يحل",
      formatClarificationReply(clarification)
    );
    promptInput.value = "";
    attachments = [];
    if (fileInput) {
      fileInput.value = "";
    }
    renderAttachments();
    autoGrow(promptInput);
    return;
  }

  if (intentResult.label === "chat") {
    addMessage("assistant", "ملم يحل", formatSimpleReply(createCasualResponse(prompt)));
    promptInput.value = "";
    attachments = [];
    if (fileInput) {
      fileInput.value = "";
    }
    renderAttachments();
    autoGrow(promptInput);
    return;
  }

  if (intentResult.label === "help") {
    addMessage("assistant", "ملم يحل", formatSimpleReply(createHelpResponse()));
    promptInput.value = "";
    attachments = [];
    if (fileInput) {
      fileInput.value = "";
    }
    renderAttachments();
    autoGrow(promptInput);
    return;
  }

  addPendingMessage();

  try {
    const pendingMessage = messageList.lastElementChild;
    const { response, sources } = await requestAI(prompt || "حل السؤال من الملفات المرفقة", lesson);

    if (pendingMessage) {
      pendingMessage.remove();
    }

    addMessage("assistant", "ملم يحل", formatAssistantSections(response), {
      likeable: true,
      messagePayload: response,
      sources
    });

    saveSession(lastUserQuestion, response);
    renderInsights();
  } catch (error) {
    const pendingMessage = messageList.lastElementChild;
    if (pendingMessage) {
      pendingMessage.remove();
    }

    addMessage(
      "assistant",
      "ملم يحل",
      `<div class="answer-grid">
        <section class="answer-section answer-section-wide">
          <h4>⚠️ تعذر الاتصال</h4>
          <p>${error instanceof Error ? error.message : "حدث خطأ غير معروف"}.</p>
          <p>يمكنك المتابعة في الوضع المحلي التجريبي، ثم ربط الواجهة لاحقًا بسيرفر vLLM أو Ollama داخل المنصة عند تجهيز البنية الخلفية.</p>
        </section>
      </div>`
    );
  }

  promptInput.value = "";
  attachments = [];
  if (fileInput) {
    fileInput.value = "";
  }
  renderAttachments();
  autoGrow(promptInput);
}

function startChat() {
  updateSelectionSummary();
  promptInput.focus();
  addMessage(
    "assistant",
    "ملم يحل",
    `<div class="answer-grid">
      <section class="answer-section answer-section-wide">
        <h4>🚀 تم تجهيز الجلسة</h4>
        <p>تم تثبيت السياق الدراسي على ${gradeSelect.value} - ${subjectSelect.value} - ${termSelect.value} - ${lessonInput.value.trim() || "الدرس غير المحدد"}.</p>
        <p>يمكنك الآن كتابة السؤال، أو الضغط على + لرفع صورة من الكتاب أو ملف ملاحظات.</p>
      </section>
    </div>`
  );
}

function quickSolve() {
  promptInput.value = "ابدأ بحل سؤال من هذا الدرس مع شرح مبسط وخطوات وأخطاء شائعة.";
  autoGrow(promptInput);
  startChat();
}

promptInput.addEventListener("input", () => autoGrow(promptInput));
runtimeSelect.addEventListener("change", saveSettings);
trainingModeSelect.addEventListener("change", saveSettings);
gradeSelect.addEventListener("change", () => {
  updateSubjectOptions();
  updateSelectionSummary();
});
subjectSelect.addEventListener("change", updateSelectionSummary);
termSelect.addEventListener("change", updateSelectionSummary);
lessonInput.addEventListener("input", updateSelectionSummary);
startChatButton.addEventListener("click", startChat);
quickSolveButton.addEventListener("click", quickSolve);
if (heroExampleButton) {
  heroExampleButton.addEventListener("click", () => {
    setPromptValue("احسب محيط دائرة نصف قطرها 7", "الرياضيات");
    document.querySelector("#chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
uploadButton.addEventListener("click", openGenericUpload);
uploadImageButton.addEventListener("click", openImageUpload);
uploadFileButton.addEventListener("click", openGenericUpload);
focusSubjectButton.addEventListener("click", () => subjectSelect.focus());
clearChatButton.addEventListener("click", resetConversationView);
if (themeToggleButton) {
  themeToggleButton.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
    localStorage.setItem(storageKeys.theme, nextTheme);
    applyTheme(nextTheme);
  });
}

starterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const starterAction = button.getAttribute("data-starter-action");
    const starterPrompt = button.getAttribute("data-starter-prompt") || "";
    const starterSubject = button.getAttribute("data-starter-subject") || "";

    if (starterAction === "upload-image") {
      openImageUpload();
      return;
    }

    setPromptValue(starterPrompt, starterSubject);
  });
});

messageList.addEventListener("click", (event) => {
  const target = event.target.closest("[data-fill-prompt], [data-action]");
  if (!target) return;

  const fillPrompt = target.getAttribute("data-fill-prompt");
  const action = target.getAttribute("data-action");

  if (fillPrompt) {
    setPromptValue(fillPrompt);
    return;
  }

  if (action === "upload-image") {
    openImageUpload();
    return;
  }

  if (action === "focus-subject") {
    subjectSelect.focus();
  }
});

fileInput.addEventListener("change", (event) => {
  attachments = Array.from(event.target.files || []);
  renderAttachments();
});
form.addEventListener("submit", handleSubmit);

populateGradeOptions();
updateSubjectOptions();
renderLearnedMemory();
renderHistory();
renderInsights();
renderWebPolicy();
updateSelectionSummary();
updateStatus();
updateXpBalance();
saveJson(storageKeys.users, users);
renderWelcomeMessage();
