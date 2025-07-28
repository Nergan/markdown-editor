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


function updateURL(text) {
    const url = new URL(window.location);
    if (text) {
        const compressed = LZString.compressToEncodedURIComponent(text);
        url.searchParams.set('text', compressed);
    } else {
        url.searchParams.delete('text');
    }
    history.replaceState(null, '', url);
}

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
        });

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
    } catch (AbortError) {
        return;
    } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}


window.addEventListener('beforeunload', function(event) {
    event.preventDefault();
    event.returnValue = '';
    return '';
});

window.addEventListener('keydown', (event) => {
    const isSave = (event.ctrlKey || event.metaKey) && event.code === 'KeyS';
    const isOpen = (event.ctrlKey || event.metaKey) && event.code === 'KeyO';

    if (isSave && textarea) {
        event.preventDefault();
        saveFile(textarea.value);
    } else if (isOpen) {
        event.preventDefault();
        fileInput?.click();
    }
});

sourceArea.addEventListener('keyup', () => {
    const newText = marked.parse(sourceArea.value);
    contentHere.innerHTML = newText;
});

fileInput?.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
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
    event.target.value = '';
});

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('source');
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('text')) {
        const compressedText = params.get('text');
        const decompressedText = LZString.decompressFromEncodedURIComponent(compressedText);
        
        if (decompressedText !== null) {
            input.value = decompressedText;
        } else {
            input.value = decodeURIComponent(compressedText);
        }
    }
    
    input.addEventListener('input', () => {
        updateURL(input.value);
    });
});
