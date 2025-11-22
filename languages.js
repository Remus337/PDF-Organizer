/* * languages.js
 * handles translation logic
 */

const translations = {
    en: {
        appTitle: "PDF Organizer",
        appSubtitle: "Drag to reorder. Tap + to insert pages.",
        selectPdf: "Select PDF file",
        dragDrop: "Drag & drop or click to upload",
        processing: "Processing pages...",
        newPdf: "Start Over",
        saveDownload: "Save & Download PDF",
        addPage: "Add Page",
        page: "Page",
        blank: "Blank",
        orig: "Orig",
        blankPlaceholder: "(Blank A4)",
        insertTitle: "Insert Blank Page Here",
        addEndTitle: "Add page at the end",
        alertValid: "Please upload a valid PDF file.",
        alertError: "Error reading PDF. Check console."
    },
    pl: {
        appTitle: "Organizer PDF",
        appSubtitle: "Przeciągnij, aby zmienić kolejność. Kliknij +, aby dodać strony.",
        selectPdf: "Wybierz plik PDF",
        dragDrop: "Przeciągnij i upuść lub kliknij",
        processing: "Przetwarzanie stron...",
        newPdf: "Zacznij od nowa",
        saveDownload: "Zapisz i pobierz PDF",
        addPage: "Dodaj stronę",
        page: "Strona",
        blank: "Pusta",
        orig: "Oryg",
        blankPlaceholder: "(Pusta A4)",
        insertTitle: "Wstaw pustą stronę tutaj",
        addEndTitle: "Dodaj stronę na końcu",
        alertValid: "Proszę wgrać poprawny plik PDF.",
        alertError: "Błąd odczytu PDF. Sprawdź konsolę."
    }
};

let currentLang = 'en'; 

/**
 * switches the application language
 * @param {string} lang - 'en' or 'pl'
 */
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${lang}`);
    if(activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (t[key]) el.innerText = t[key];
    });

    document.querySelectorAll('.blank-placeholder').forEach(el => {
        el.innerText = t.blankPlaceholder;
    });

    document.querySelectorAll('.insert-before-btn').forEach(btn => {
        btn.title = t.insertTitle;
    });
    
    const addEndBtn = document.getElementById('add-end-btn');
    if(addEndBtn) addEndBtn.title = t.addEndTitle;

    if (typeof updatePageNumbers === 'function') {
        updatePageNumbers();
    }
}