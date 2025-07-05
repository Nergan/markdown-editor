import './style.css';
import { marked } from 'marked';
import { convertToMarkdown } from 'mammoth';
import { init, DocxAdapter } from 'html-to-document';


const contentHere = document.getElementById('content');
const sourceArea = document.getElementById('source');
const textarea = document.getElementById('source');
const fileInput = document.getElementById('hidden-file-input');

const renderMarkdown = async () => {
    const newText = await marked.parse(sourceArea.value);
    contentHere.innerHTML = newText;
}


sourceArea.addEventListener('keyup', () => {
    const newText = marked.parse(sourceArea.value);
    contentHere.innerHTML = newText;
});


function isdocx(file) {
    if (!file || !file.name) {
        return false;
    }
    const filename = file.name.toLowerCase();
    return filename.endsWith(".docx");
}


async function saveFile(content, filename = 'name.md') {
  const blob = new Blob([content], { type: 'text/markdown, application/msword' });
  const url = URL.createObjectURL(blob);

  try {
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
                description: 'markdown',
                accept: { 'text/markdown': ['.md'] }
            },{
                description: 'word',
                accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
            }],
            excludeAcceptAllOption: true
        })
    } catch (AbortError) {
        return;
    }

    const name = handle.name;
    if (name.endsWith('.docx')) {

        const converter = init({
            adapters: {
                register: [
                    { format: 'docx', adapter: DocxAdapter },
                ],
            },
        });

        content = document.getElementById('content').innerHTML;
        content = await converter.convert(content, 'docx');
    }

    const writeble = await handle.createWritable();
    writeble.write(content);
    writeble.close();

    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}


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

fileInput?.addEventListener('change', (e) => {
    const [file] = e.target.files || [];
    const arrayBuffer = file.arrayBuffer();

    if (!file) return;

    if (isdocx(file)) {
        convertToMarkdown({ arrayBuffer }).then((result) => {
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
