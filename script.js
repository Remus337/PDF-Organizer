let originalPdfDoc = null;
let sortableInstance = null;

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const loader = document.getElementById('loader');
const editorArea = document.getElementById('editor-area');
const gridContainer = document.getElementById('grid-container');
const addEndBtn = document.getElementById('add-end-btn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');

//drag and drop + file input
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
});

//toolbar actions
resetBtn.addEventListener('click', resetApp);
saveBtn.addEventListener('click', saveAndDownload);
addEndBtn.addEventListener('click', () => addBlankPage(null));

//core functions

async function handleFile(file) {
    const t = translations[currentLang];
    
    if (file.type !== 'application/pdf') {
        alert(t.alertValid);
        return;
    }

    dropzone.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        originalPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;

        //render pages as tiles
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            await renderPageTile(pdf, pageNum);
        }

        loader.classList.add('hidden');
        editorArea.classList.remove('hidden');

        initSortable();

    } catch (err) {
        console.error(err);
        alert(t.alertError);
        resetApp();
    }
}

async function renderPageTile(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.3 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    createTileElement(canvas, pageNum - 1, false);
}

function createTileElement(contentNode, originalIndex, isBlank, insertBeforeNode = null) {
    const t = translations[currentLang];

    const wrapper = document.createElement('div');
    wrapper.className = 'tile-wrapper';
    wrapper.dataset.type = isBlank ? 'blank' : 'original';
    if (!isBlank) wrapper.dataset.originalIndex = originalIndex;

    const insertBtn = document.createElement('div');
    insertBtn.className = 'insert-before-btn';
    insertBtn.innerHTML = '+';
    insertBtn.title = t.insertTitle;
    
    insertBtn.onmousedown = (e) => e.stopPropagation();
    insertBtn.ontouchstart = (e) => e.stopPropagation();
    
    insertBtn.onclick = (e) => {
        e.stopPropagation();
        addBlankPage(wrapper);
    };

    const card = document.createElement('div');
    card.className = 'pdf-card';

    const delBtn = document.createElement('div');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '&times;';
    delBtn.onmousedown = (e) => e.stopPropagation();
    delBtn.onclick = (e) => {
        e.stopPropagation();
        wrapper.remove();
        updatePageNumbers();
    };

    const label = document.createElement('div');
    label.className = 'page-number';
    
    card.appendChild(delBtn);
    card.appendChild(contentNode);
    card.appendChild(label);
    
    wrapper.appendChild(insertBtn);
    wrapper.appendChild(card);

    if (insertBeforeNode) {
        gridContainer.insertBefore(wrapper, insertBeforeNode);
    } else {
        gridContainer.insertBefore(wrapper, addEndBtn);
    }

    updatePageNumbers();
}

//dynamic updates of page numbers now made global
window.updatePageNumbers = function() {
    const t = translations[currentLang];
    const wrappers = document.querySelectorAll('.tile-wrapper');
    
    wrappers.forEach((wrapper, index) => {
        const label = wrapper.querySelector('.page-number');
        const currentPos = index + 1;

        if (wrapper.dataset.type === 'blank') {
            label.innerText = `${t.page} ${currentPos} (${t.blank})`;
        } else {
            const originalPos = parseInt(wrapper.dataset.originalIndex) + 1;
            label.innerText = `${t.page} ${currentPos} (${t.orig}: ${originalPos})`;
        }
    });
}

function addBlankPage(referenceNode) {
    const t = translations[currentLang];
    const blankVisual = document.createElement('div');
    blankVisual.className = 'blank-placeholder';
    blankVisual.innerText = t.blankPlaceholder;
    
    createTileElement(blankVisual, -1, true, referenceNode);
}

function initSortable() {
    if (sortableInstance) sortableInstance.destroy();
    
    sortableInstance = new Sortable(gridContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        draggable: '.tile-wrapper',
        filter: '#add-end-btn',
        delay: 100,
        delayOnTouchOnly: true, 
        onMove: function (evt) {
            return evt.related.id !== 'add-end-btn';
        },
        onEnd: function() {
            updatePageNumbers();
        }
    });
}

function resetApp() {
    originalPdfDoc = null;
    fileInput.value = '';
    
    const tiles = document.querySelectorAll('.tile-wrapper');
    tiles.forEach(t => t.remove());

    editorArea.classList.add('hidden');
    dropzone.classList.remove('hidden');
    loader.classList.add('hidden');
}

async function saveAndDownload() {
    if (!originalPdfDoc && document.querySelectorAll('.tile-wrapper').length === 0) return;

    const newPdf = await PDFLib.PDFDocument.create();
    const tiles = document.querySelectorAll('.tile-wrapper');

    const indicesToCopy = [];
    tiles.forEach(tile => {
        if (tile.dataset.type === 'original') {
            indicesToCopy.push(parseInt(tile.dataset.originalIndex));
        }
    });

    let copiedPages = [];
    if (indicesToCopy.length > 0 && originalPdfDoc) {
        copiedPages = await newPdf.copyPages(originalPdfDoc, indicesToCopy);
    }

    let copyPointer = 0;
    for (const tile of tiles) {
        if (tile.dataset.type === 'original') {
            newPdf.addPage(copiedPages[copyPointer]);
            copyPointer++;
        } else {
            newPdf.addPage([595.28, 841.89]); // A4
        }
    }

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'edited_document.pdf';
    link.click();
}