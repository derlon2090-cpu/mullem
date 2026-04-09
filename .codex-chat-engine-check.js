const fs = require("fs");
const vm = require("vm");

const storage = new Map();
const sandbox = {
  console,
  document: {
    querySelector: () => null,
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
    location: { pathname: "/index.html" },
  },
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  navigator: { userAgent: "node-test" },
  FileReader: function FileReader() {},
  setTimeout: () => 0,
  clearTimeout: () => {},
  requestAnimationFrame: () => 0,
};

let source = fs.readFileSync("C:/mullem/app.js", "utf8");
source = source.replace(/\bbootstrap\(\);/g, "");

vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "app.js", timeout: 5000 });

function runEval(expression) {
  return vm.runInContext(expression, sandbox, { timeout: 5000 });
}

function buildResponse(question) {
  sandbox.__questionUnderTest = question;
  return runEval(`
    (function () {
      const sample = __questionUnderTest;
      const subject = detectSubjectFromContent(sample);
      const context = retrieveCurriculumContext(sample, subject || "");
      const intent = classifyIntent(sample, false);
      const response = createAcademicResponse(sample, intent, {
        preferredSubject: subject,
        detectedSubject: subject,
        route: {
          response_mode: "academic_solve",
          detected_subject: subject,
          subject_confidence: subject ? 0.95 : 0.4
        }
      });
      return {
        intent: intent.type,
        type: detectQuestionType(sample),
        subject,
        contextSubject: context.subject,
        lesson: context.lesson,
        finalAnswer: response.finalAnswer || "",
        explanation: response.explanation || ""
      };
    })()
  `);
}

const tests = [
  {
    name: "roman-civilization",
    question: "ماهي الحضارة الرومانية وتسوي بحث شامل؟",
    validate: (result) => result.contextSubject === "الاجتماعيات"
      && result.lesson === "الحضارة الرومانية"
      && !/محيط الدائرة/.test(`${result.finalAnswer} ${result.explanation}`),
  },
  {
    name: "roman-research-request",
    question: "احتاج بحث عن الحضارة الرومانية",
    validate: (result) => result.contextSubject === "الاجتماعيات"
      && result.lesson === "الحضارة الرومانية",
  },
  {
    name: "corona-definition",
    question: "ماهو مرض الكرونا ؟",
    validate: (result) => result.contextSubject === "العلوم"
      && /كورونا|كوفيد|فيروس/.test(`${result.finalAnswer} ${result.explanation}`)
      && !/محيط الدائرة|نصف القطر/.test(`${result.finalAnswer} ${result.explanation}`),
  },
  {
    name: "how-to-multiply",
    question: "كيف نضرب في الرياضات؟",
    validate: (result) => result.contextSubject === "الرياضيات"
      && result.lesson === "الضرب"
      && /الضرب|جمع متكرر/.test(`${result.finalAnswer} ${result.explanation}`),
  },
  {
    name: "matching-is-academic",
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
    validate: (result) => result.intent !== "chat" && result.type === "مطابقة",
  },
];

let failed = 0;

for (const testCase of tests) {
  const result = buildResponse(testCase.question);
  const ok = Boolean(testCase.validate(result));
  console.log(`${ok ? "PASS" : "FAIL"} ${testCase.name}`);
  if (!ok) {
    failed += 1;
    console.log(JSON.stringify(result, null, 2));
  }
}

process.exit(failed ? 1 : 0);
