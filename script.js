// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global variables
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let canvas = document.getElementById('pdfCanvas');
let ctx = canvas.getContext('2d');

// DOM elements
const prevButton = document.getElementById('prevPage');
const nextButton = document.getElementById('nextPage');
const pageNumInput = document.getElementById('pageNum');
const pageCountSpan = document.getElementById('pageCount');
const zoomInButton = document.getElementById('zoomIn');
const zoomOutButton = document.getElementById('zoomOut');
const fitWidthButton = document.getElementById('fitWidth');
const zoomLevelSpan = document.getElementById('zoomLevel');
const downloadButton = document.getElementById('downloadBtn');
const fullscreenButton = document.getElementById('fullscreenBtn');
const loadingSpinner = document.querySelector('.loading-spinner');
const pdfContainer = document.getElementById('pdfContainer');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadPDF();
    setupEventListeners();
});

// Load the PDF
async function loadPDF() {
    try {
        showLoading(true);
        const url = 'Md Zaid Sutar Resume updated.pdf';
        const loadingTask = pdfjsLib.getDocument(url);
        
        loadingTask.onProgress = function(progress) {
            console.log('Loading progress: ' + progress.loaded + '/' + progress.total);
        };
        
        pdfDoc = await loadingTask.promise;
        pageCountSpan.textContent = pdfDoc.numPages;
        pageNumInput.max = pdfDoc.numPages;
        
        // Render first page
        await renderPage(pageNum);
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        showError('Failed to load PDF. Please make sure the file exists.');
        showLoading(false);
    }
}

// Render page
function renderPage(num) {
    pageRendering = true;
    
    return pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({scale: scale});
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);

        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            updatePageInfo();
        });
    });
}

// Queue render page
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Update page information
function updatePageInfo() {
    pageNumInput.value = pageNum;
    prevButton.disabled = pageNum <= 1;
    nextButton.disabled = pageNum >= pdfDoc.numPages;
}

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.style.display = 'flex';
        canvas.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
        canvas.style.display = 'block';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
    `;
    errorDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #fee;
        border: 1px solid #fcc;
        border-radius: 0.5rem;
        color: #c33;
        margin-bottom: 1rem;
    `;
    pdfContainer.insertBefore(errorDiv, pdfContainer.firstChild);
}

// Setup event listeners
function setupEventListeners() {
    // Page navigation
    prevButton.addEventListener('click', onPrevPage);
    nextButton.addEventListener('click', onNextPage);
    pageNumInput.addEventListener('change', onPageNumChange);
    
    // Zoom controls
    zoomInButton.addEventListener('click', onZoomIn);
    zoomOutButton.addEventListener('click', onZoomOut);
    fitWidthButton.addEventListener('click', onFitWidth);
    
    // Action buttons
    downloadButton.addEventListener('click', onDownload);
    fullscreenButton.addEventListener('click', onFullscreen);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', onKeyDown);
    
    // Mouse wheel zoom
    canvas.addEventListener('wheel', onMouseWheel);
}

// Page navigation handlers
function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

function onPageNumChange() {
    const newPageNum = parseInt(pageNumInput.value);
    if (newPageNum >= 1 && newPageNum <= pdfDoc.numPages) {
        pageNum = newPageNum;
        queueRenderPage(pageNum);
    } else {
        pageNumInput.value = pageNum;
    }
}

// Zoom handlers
function onZoomIn() {
    scale = Math.min(scale * 1.2, 3.0);
    updateZoomLevel();
    queueRenderPage(pageNum);
}

function onZoomOut() {
    scale = Math.max(scale / 1.2, 0.5);
    updateZoomLevel();
    queueRenderPage(pageNum);
}

function onFitWidth() {
    if (!pdfDoc) return;
    
    pdfDoc.getPage(pageNum).then(function(page) {
        const containerWidth = pdfContainer.clientWidth - 40; // Account for padding
        const viewport = page.getViewport({scale: 1});
        scale = containerWidth / viewport.width;
        updateZoomLevel();
        queueRenderPage(pageNum);
    });
}

function updateZoomLevel() {
    zoomLevelSpan.textContent = Math.round(scale * 100) + '%';
}

// Download handler
function onDownload() {
    const link = document.createElement('a');
    link.href = 'Md Zaid Sutar Resume updated.pdf';
    link.download = 'Md Zaid Sutar Resume.pdf';
    link.click();
}

// Fullscreen handler
function onFullscreen() {
    if (!document.fullscreenElement) {
        pdfContainer.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Keyboard shortcuts
function onKeyDown(e) {
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            onPrevPage();
            break;
        case 'ArrowRight':
            e.preventDefault();
            onNextPage();
            break;
        case '+':
        case '=':
            e.preventDefault();
            onZoomIn();
            break;
        case '-':
        case '_':
            e.preventDefault();
            onZoomOut();
            break;
        case '0':
            e.preventDefault();
            scale = 1.0;
            updateZoomLevel();
            queueRenderPage(pageNum);
            break;
        case 'f':
        case 'F':
            e.preventDefault();
            onFullscreen();
            break;
        case 'd':
        case 'D':
            e.preventDefault();
            onDownload();
            break;
    }
}

// Mouse wheel zoom
function onMouseWheel(e) {
    if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
            onZoomIn();
        } else {
            onZoomOut();
        }
    }
}

// Handle fullscreen changes
document.addEventListener('fullscreenchange', function() {
    if (document.fullscreenElement) {
        fullscreenButton.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
        pdfContainer.style.background = 'var(--surface-color)';
    } else {
        fullscreenButton.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (pdfDoc) {
        queueRenderPage(pageNum);
    }
});

// Touch gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', function(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Swipe detection
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
            onPrevPage(); // Swipe right - previous page
        } else {
            onNextPage(); // Swipe left - next page
        }
    }
});

// Pinch to zoom for mobile
let initialDistance = 0;

canvas.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );
        
        if (initialDistance === 0) {
            initialDistance = currentDistance;
        } else {
            const scaleChange = currentDistance / initialDistance;
            scale = Math.max(0.5, Math.min(3.0, scale * scaleChange));
            updateZoomLevel();
            queueRenderPage(pageNum);
            initialDistance = currentDistance;
        }
    }
});

canvas.addEventListener('touchend', function() {
    initialDistance = 0;
});
