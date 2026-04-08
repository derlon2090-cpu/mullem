const fs = require("fs");
const vm = require("vm");

const storage = new Map();
storage.set("mlm_current_user", "student-demo-1");
const formNode = { addEventListener: () => {}, dataset: {} };
const messageNode = { children: { length: 1 }, innerHTML: "", dataset: {} };
const promptNode = { value: "", blur: () => {}, style: {}, addEventListener: () => {} };

const sandbox = {
  console,
  document: {
    activeElement: null,
    querySelector: (selector) => {
      if (selector === "[data-chat-form]") return formNode;
      if (selector === "[data-messages]") return messageNode;
      if (selector === "[data-prompt]") return promptNode;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    documentElement: { setAttribute: () => {}, dataset: {} },
    body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} } },
  },
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: () => 0,
    __codexRuntimeTestEnabled: true,
    history: { scrollRestoration: "manual" },
    location: { hostname: "localhost", pathname: "/index.html", search: "", hash: "" },
  },
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  navigator: { userAgent: "node-test" },
  FileReader: function FileReader() {},
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  setTimeout: () => 0,
  clearTimeout: () => {},
  requestAnimationFrame: () => 0,
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.fetch = sandbox.fetch;
sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;

const appSource = fs.readFileSync("C:/mullem/assets/js/app.js", "utf8").replace(/\bbootstrap\(\);/g, "");
const runtimeSource = fs.readFileSync("C:/mullem/assets/js/app.runtime.js", "utf8");

vm.createContext(sandbox);
vm.runInContext(appSource, sandbox, { filename: "assets/js/app.js", timeout: 5000 });
vm.runInContext(runtimeSource, sandbox, { filename: "assets/js/app.runtime.js", timeout: 5000 });

async function run() {
  const tests = [
    {
      name: "runtime-roman",
      question: "ماهي الحضارة الرومانية وتسوي بحث شامل؟",
      validate: (result) => result.intentType === "solve"
        && result.routeMode === "academic_solve"
        && result.routeSubject === "الاجتماعيات"
        && /الرومانية|روما/.test(`${result.finalAnswer} ${result.explanation}`)
        && !/تعذر تحديد الإجابة النهائية|محيط الدائرة/.test(`${result.finalAnswer} ${result.explanation} ${result.preRenderedBody}`),
    },
    {
      name: "runtime-corona",
      question: "ماهو مرض الكرونا ؟",
      validate: (result) => result.intentType === "solve"
        && result.routeMode === "academic_solve"
        && ["العلوم", "الأحياء"].includes(result.routeSubject)
        && /كورونا|كوفيد|فيروس/.test(`${result.finalAnswer} ${result.explanation}`)
        && !/محيط الدائرة|نصف القطر|تعذر تحديد الإجابة النهائية/.test(`${result.finalAnswer} ${result.explanation} ${result.preRenderedBody}`),
    },
    {
      name: "runtime-multiplication",
      question: "كيف نضرب في الرياضات؟",
      validate: (result) => result.intentType === "solve"
        && result.routeMode === "academic_solve"
        && result.routeSubject === "الرياضيات"
        && /الضرب|جمع متكرر/.test(`${result.finalAnswer} ${result.explanation}`),
    },
    {
      name: "runtime-match-question",
      question: `https://en.wikipedia.org/wiki/Hannah_Montana Match the information about the sitcom in the link:
(أ)
The main characters are..
اختر
The final season.
اختر
(ب)
- Miley continues to Paris, only to come back, joining Lilly in Stanford.
- Hannah Montana who is first introduced as Miley Stewart, lives a double life as an average schoolgirl by day and a famous recording artist Hannah Montana by night.
- Miley Stewart, Lilly Truscott , Oliver Oken , Jackson Stewart, and Robby Stewart .`,
      validate: (result) => result.intentType === "solve"
        && result.routeMode === "academic_solve"
        && result.questionType === "مطابقة"
        && !/أرسل السؤال الكامل أو اختر المادة/.test(`${result.finalAnswer} ${result.explanation} ${result.preRenderedBody}`),
    },
  ];

  let failed = 0;
  for (const testCase of tests) {
    const result = await sandbox.window.__mullemRuntimeDebug.answer(testCase.question);
    const ok = Boolean(testCase.validate(result));
    console.log(`${ok ? "PASS" : "FAIL"} ${testCase.name}`);
    if (!ok) {
      failed += 1;
      console.log(JSON.stringify(result, null, 2));
    }
  }

  process.exit(failed ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
