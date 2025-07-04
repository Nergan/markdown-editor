import './style.css';
import { marked } from "marked";
import * as mammoth from "mammoth";
import HtmlToDocx from "@turbodocx/html-to-docx"

const container = document.getElementById('container');
const contentHere = document.getElementById('content');
const sourceArea = document.getElementById('source');
const devider = document.getElementById('devider');


const renderMarkdown = async () => {
    const newText = await marked.parse(sourceArea.value);
    contentHere.innerHTML = newText;
}


function isdocx(file) {
    if (!file || !file.name) {
        return false; // Обработка случая, когда file не является объектом File или у него нет имени
    }
    const filename = file.name.toLowerCase();
    return filename.endsWith(".docx");
}
 

sourceArea.addEventListener('keyup', () => {
    const newText = marked.parse(sourceArea.value);
    contentHere.innerHTML = newText;
});


// Кэшируем элементы DOM
const textarea = document.getElementById('source');
const fileInput = document.getElementById('hidden-file-input');

// Функция сохранения файла
async function saveFile(content, filename = 'name.md') {
  const blob = new Blob([content], { type: 'text/markdown, application/msword' });
  const url = URL.createObjectURL(blob);
  try {

    const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
            description: 'markdown',
            accept: { 'text/markdown': ['.md'] }
        },{
            description: 'word',
            accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
        }]
    })

    const name = handle.name;
    if (name.endsWith('.docx')) {
        content = document.getElementById('content').innerHTML;
        content = await HtmlToDocx(content);
    }

    const writeble = await handle.createWritable();
    writeble.write(content);
    writeble.close();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Обработчик горячих клавиш
window.addEventListener('keydown', (e) => {
    const isSave = (e.ctrlKey || e.metaKey) && e.code === 'KeyS';
    const isOpen = (e.ctrlKey || e.metaKey) && e.code === 'KeyO';

    if (isSave && textarea) {
        e.preventDefault();
        saveFile(textarea.value);
    } else if (isOpen) {
        e.preventDefault();
        fileInput?.click();
    }
});

// Обработчик выбора файла
fileInput?.addEventListener('change', (e) => {
    const [file] = e.target.files || [];
    const arrayBuffer = file.arrayBuffer();

    if (!file) return;

    if (isdocx(file)) {
        mammoth.convertToMarkdown({ arrayBuffer }).then((result) => {
            textarea.value = result.value;
            renderMarkdown();
        })
    } else {
        const reader = new FileReader();
        reader.onload = () => {
            if (textarea) {
                textarea.value = reader.result;
                renderMarkdown();
            }
        }
        reader.readAsText(file);
    }
    e.target.value = '';
});