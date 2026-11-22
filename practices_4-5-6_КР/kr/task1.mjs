import { validateTaskDraft } from "../practice-04/src/form-validation.js";

const tasks = [];
const draft = { id: "20", priority: "high" };

const good = validateTaskDraft({ ...draft, title: " Изучить localStorage " }, tasks);
console.log('title = " Изучить localStorage "');
console.log(good);

const bad = validateTaskDraft({ ...draft, title: " " }, tasks);
console.log('title = " "');
console.log(bad);
