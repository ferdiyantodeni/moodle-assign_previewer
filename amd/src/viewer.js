/**
 * Moodle assignsubmission_filepreview AMD module.
 * Provides client-side document viewing (Office docx, pptx, xlsx, PDF, TXT)
 * and Inline Split-Screen Grading integration.
 *
 * @module     assignsubmission_filepreview/viewer
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'core/notification', 'core/str'], function($, Notification, Str) {
    'use strict';

    var assetBaseUrl = '';
    var strings = {};
    var loadedScripts = {};
    var activeViewer = null;

    /**
     * Dynamically load external JS script once.
     *
     * @param {string} src
     * @returns {Promise}
     */
    function loadScript(src) {
        if (loadedScripts[src]) {
            return loadedScripts[src];
        }

        var promise = new Promise(function(resolve, reject) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.async = true;
            script.onload = function() {
                resolve();
            };
            script.onerror = function() {
                reject(new Error('Gagal memuat skrip: ' + src));
            };
            document.head.appendChild(script);
        });

        loadedScripts[src] = promise;
        return promise;
    }

    /**
     * Ensure JSZip is loaded.
     */
    function ensureJSZip() {
        if (window.JSZip) {
            return Promise.resolve(window.JSZip);
        }
        return loadScript(assetBaseUrl + '/vendor/jszip.min.js').then(function() {
            return window.JSZip;
        });
    }

    /**
     * Ensure docx-preview is loaded.
     */
    function ensureDocxPreview() {
        return ensureJSZip().then(function() {
            if (window.docx) {
                return window.docx;
            }
            return loadScript(assetBaseUrl + '/vendor/docx-preview.min.js').then(function() {
                return window.docx;
            });
        });
    }

    /**
     * Ensure SheetJS (XLSX) is loaded.
     */
    function ensureXLSX() {
        if (window.XLSX) {
            return Promise.resolve(window.XLSX);
        }
        return loadScript(assetBaseUrl + '/vendor/xlsx.full.min.js').then(function() {
            return window.XLSX;
        });
    }

    /**
     * Ensure PPTX Viewer is loaded.
     */
    function ensurePPTX() {
        return ensureJSZip().then(function() {
            if (window.PPTXViewer) {
                return window.PPTXViewer;
            }
            return loadScript(assetBaseUrl + '/vendor/pptx-viewer.js').then(function() {
                return window.PPTXViewer;
            });
        });
    }

    /**
     * Ensure PDF.js is loaded.
     */
    function ensurePDF() {
        if (window.pdfjsLib) {
            return Promise.resolve(window.pdfjsLib);
        }
        return loadScript(assetBaseUrl + '/vendor/pdf.min.js').then(function() {
            if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = assetBaseUrl + '/vendor/pdf.worker.min.js';
            }
            return window.pdfjsLib;
        });
    }

    /**
     * Document Viewer Object.
     */
    function ViewerInstance(containerEl, files, options) {
        this.container = $(containerEl);
        this.files = files || [];
        this.options = options || {};
        this.activeFileIndex = 0;
        this.currentZoom = 1.0;
        this.init();
    }

    ViewerInstance.prototype.init = function() {
        this.renderShell();
        if (this.files.length > 0) {
            this.loadFile(0);
        }
    };

    ViewerInstance.prototype.renderShell = function() {
        var self = this;
        var html = '<div class="fp-viewer-container">' +
            '<div class="fp-viewer-toolbar">' +
                '<div class="fp-toolbar-group">' +
                    '<select class="fp-file-select" aria-label="Pilih berkas">';

        self.files.forEach(function(f, idx) {
            html += '<option value="' + idx + '">' + escapeHtml(f.filename) + ' (' + f.filesize + ')</option>';
        });

        html +=     '</select>' +
                '</div>' +
                '<div class="fp-toolbar-group">' +
                    '<button type="button" class="fp-btn fp-btn-icon fp-zoom-out" title="' + (strings.zoom_out || 'Perkecil') + '"><i class="fa fa-search-minus"></i></button>' +
                    '<span class="fp-zoom-text">100%</span>' +
                    '<button type="button" class="fp-btn fp-btn-icon fp-zoom-in" title="' + (strings.zoom_in || 'Perbesar') + '"><i class="fa fa-search-plus"></i></button>' +
                    '<button type="button" class="fp-btn fp-zoom-reset" title="' + (strings.zoom_reset || 'Reset') + '"><i class="fa fa-arrows-alt"></i></button>' +
                    '<a href="#" target="_blank" class="fp-btn fp-download-btn" title="' + (strings.download || 'Unduh') + '"><i class="fa fa-download mr-1 me-1"></i> ' + (strings.download || 'Unduh') + '</a>' +
                    '<button type="button" class="fp-btn fp-btn-icon fp-fs-btn" title="' + (strings.fullscreen || 'Layar Penuh') + '"><i class="fa fa-expand"></i></button>' +
                '</div>' +
            '</div>' +
            '<div class="fp-viewer-viewport">' +
                '<div class="fp-viewer-content"></div>' +
            '</div>' +
            '<div class="fp-viewer-footer">' +
                '<span class="fp-copyright-text">Submission file previewer ver 1.0.5 developed by Ferdiyanto Deni Sanjayaya (<a href="https://gridiyans.my.id" target="_blank" rel="noopener noreferrer">gridiyans.my.id</a>) &copy; 2026</span>' +
            '</div>' +
        '</div>';

        self.container.html(html);

        // Bind events
        self.container.find('.fp-file-select').on('change', function() {
            var idx = parseInt($(this).val(), 10);
            self.loadFile(idx);
        });

        self.container.find('.fp-zoom-in').on('click', function() {
            self.setZoom(self.currentZoom + 0.15);
        });

        self.container.find('.fp-zoom-out').on('click', function() {
            self.setZoom(self.currentZoom - 0.15);
        });

        self.container.find('.fp-zoom-reset').on('click', function() {
            self.setZoom(1.0);
        });

        self.container.find('.fp-fs-btn').on('click', function() {
            var target = self.container.find('.fp-viewer-viewport')[0];
            if (!document.fullscreenElement) {
                if (target.requestFullscreen) target.requestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    };

    ViewerInstance.prototype.setZoom = function(scale) {
        if (scale < 0.4) scale = 0.4;
        if (scale > 3.0) scale = 3.0;
        this.currentZoom = scale;
        this.container.find('.fp-zoom-text').text(Math.round(scale * 100) + '%');
        this.container.find('.fp-viewer-content').css({
            'transform': 'scale(' + scale + ')',
            'transform-origin': 'top center'
        });
    };

    ViewerInstance.prototype.loadFile = function(index) {
        var self = this;
        if (!self.files[index]) return;

        self.activeFileIndex = index;
        self.setZoom(1.0);
        var file = self.files[index];

        // Update download button
        self.container.find('.fp-download-btn').attr('href', file.downloadurl || file.url);
        self.container.find('.fp-file-select').val(index);

        var viewport = self.container.find('.fp-viewer-viewport');
        var content = self.container.find('.fp-viewer-content');

        content.html('<div class="fp-loading-state"><div class="fp-spinner"></div><p>' + (strings.loading_doc || 'Memuat dokumen...') + '</p></div>');

        var ext = (file.extension || '').toLowerCase();

        // 1. PDF
        if (ext === 'pdf') {
            self.renderPDF(file.url, content);
        }
        // 2. Word (.docx, .doc)
        else if (ext === 'docx') {
            self.renderDocx(file.url, content);
        }
        // 3. Excel (.xlsx, .xls, .csv)
        else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
            self.renderExcel(file.url, content, ext);
        }
        // 4. PowerPoint (.pptx)
        else if (ext === 'pptx') {
            self.renderPPTX(file.url, content);
        }
        // 5. Plain text / code
        else if (file.is_text || ['txt', 'md', 'html', 'json', 'xml', 'log', 'py', 'java', 'sql', 'c', 'cpp', 'php'].indexOf(ext) !== -1) {
            self.renderText(file.url, content);
        }
        // 6. Image
        else if (file.is_image || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].indexOf(ext) !== -1) {
            self.renderImage(file.url, content);
        }
        // 7. Unsupported fallback
        else {
            self.renderUnsupported(file, content);
        }
    };

    ViewerInstance.prototype.renderPDF = function(url, content) {
        var self = this;
        var file = (self.files && self.files[self.activeFileIndex]) || {};
        content.html('<div class="fp-loading-state"><div class="fp-spinner"></div><p>' + (strings.loading_doc || 'Memuat dokumen PDF...') + '</p></div>');

        function fetchPDFBuffer(targetUrl) {
            return fetch(targetUrl, { credentials: 'include' })
                .then(function(res) {
                    if (!res.ok) {
                        throw new Error('HTTP ' + res.status);
                    }
                    return res.arrayBuffer();
                })
                .then(function(buffer) {
                    var bytes = new Uint8Array(buffer);
                    var headerStr = '';
                    for (var i = 0; i < Math.min(bytes.length, 8); i++) {
                        headerStr += String.fromCharCode(bytes[i]);
                    }

                    if (headerStr.indexOf('%PDF') === -1) {
                        var decoder = new TextDecoder('utf-8');
                        var snippet = decoder.decode(bytes.subarray(0, 300));
                        console.warn('Non-PDF response from:', targetUrl, snippet);
                        throw new Error('Respon server bukan file PDF valid.');
                    }

                    return { buffer: buffer, bytes: bytes };
                });
        }

        // Try primary URL, then retry with file.downloadurl if different
        fetchPDFBuffer(url)
            .catch(function(firstErr) {
                if (file.downloadurl && file.downloadurl !== url) {
                    console.info('Retrying PDF fetch using fallback downloadurl:', file.downloadurl);
                    return fetchPDFBuffer(file.downloadurl);
                }
                throw firstErr;
            })
            .then(function(result) {
                var bytes = result.bytes;
                var buffer = result.buffer;

                // 1. Primary renderer: Mozilla PDF.js on HTML5 canvas
                return ensurePDF().then(function(pdfjsLib) {
                    var loadingTask = pdfjsLib.getDocument({
                        data: bytes,
                        disableFontFace: false
                    });
                    return loadingTask.promise;
                }).then(function(pdfDoc) {
                    content.empty();
                    var pdfContainer = $('<div class="fp-pdf-container"></div>');
                    content.append(pdfContainer);

                    self.pdfDoc = pdfDoc;
                    self.pdfContainer = pdfContainer;
                    self.renderPDFPages(pdfDoc, pdfContainer);
                }).catch(function(pdfJsErr) {
                    console.warn('PDF.js rendering fallback to native embed:', pdfJsErr);
                    // 2. Fallback: Clean Blob URL without URL fragment
                    var pdfBlob = new Blob([buffer], { type: 'application/pdf' });
                    var blobUrl = URL.createObjectURL(pdfBlob);
                    if (!self.objectUrls) {
                        self.objectUrls = [];
                    }
                    self.objectUrls.push(blobUrl);

                    content.empty();
                    var iframe = $('<iframe src="' + blobUrl + '" style="width:100%; height:100%; min-height:650px; border:none; background:#ffffff; border-radius:4px;" allowfullscreen></iframe>');
                    content.append(iframe);
                });
            })
            .catch(function(err) {
                console.error('PDF preview error:', err);
                var directUrl = file.downloadurl || file.url || url;
                content.html(
                    '<div class="fp-error-state">' +
                        '<i class="fa fa-exclamation-triangle fa-2x text-warning mb-2"></i>' +
                        '<p>Gagal memuat dokumen PDF: ' + escapeHtml(err.message) + '</p>' +
                        '<div class="mt-3">' +
                            '<a href="' + directUrl + '" target="_blank" class="btn btn-outline-primary btn-sm mr-2 me-2">' +
                                '<i class="fa fa-external-link"></i> Buka di Tab Baru' +
                            '</a>' +
                            '<a href="' + directUrl + '" class="btn btn-primary btn-sm">' +
                                '<i class="fa fa-download"></i> Unduh Berkas' +
                            '</a>' +
                        '</div>' +
                    '</div>'
                );
            });
    };

    ViewerInstance.prototype.renderPDFPages = function(pdfDoc, container) {
        var numPages = pdfDoc.numPages;
        container.empty();

        for (var pageNum = 1; pageNum <= numPages; pageNum++) {
            (function(pNum) {
                var pageWrapper = $('<div class="fp-pdf-page-wrapper" id="fp-pdf-page-' + pNum + '"></div>');
                var canvas = document.createElement('canvas');
                canvas.className = 'fp-pdf-page-canvas';
                pageWrapper.append(canvas);

                var pageNumberBadge = $('<div class="fp-pdf-page-number">' + pNum + ' / ' + numPages + '</div>');
                pageWrapper.append(pageNumberBadge);

                container.append(pageWrapper);

                pdfDoc.getPage(pNum).then(function(page) {
                    var baseViewport = page.getViewport({ scale: 1.5 });
                    canvas.height = baseViewport.height;
                    canvas.width = baseViewport.width;

                    var ctx = canvas.getContext('2d');
                    var renderContext = {
                        canvasContext: ctx,
                        viewport: baseViewport
                    };
                    page.render(renderContext);
                }).catch(function(pageErr) {
                    console.error('Error rendering PDF page ' + pNum, pageErr);
                });
            })(pageNum);
        }
    };

    ViewerInstance.prototype.renderDocx = function(url, content) {
        ensureDocxPreview().then(function(docx) {
            return fetch(url, { credentials: 'include' }).then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.arrayBuffer();
            });
        }).then(function(buffer) {
            content.empty();
            var docxContainer = $('<div class="docx-render-wrapper"></div>')[0];
            content.append(docxContainer);
            return window.docx.renderAsync(buffer, docxContainer, null, {
                className: 'docx',
                inWrapper: true,
                ignoreWidth: false,
                ignoreHeight: false
            });
        }).catch(function(err) {
            content.html('<div class="fp-error-state"><i class="fa fa-exclamation-triangle fa-2x"></i><p>Gagal memuat dokumen Word: ' + escapeHtml(err.message) + '</p></div>');
        });
    };

    ViewerInstance.prototype.renderExcel = function(url, content, ext) {
        ensureXLSX().then(function(XLSX) {
            return fetch(url, { credentials: 'include' }).then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.arrayBuffer();
            });
        }).then(function(buffer) {
            content.empty();
            var wb = window.XLSX.read(new Uint8Array(buffer), { type: 'array' });
            var wrapper = $('<div class="xlsx-render-wrapper"></div>');
            var tabContainer = $('<div class="xlsx-sheet-tabs"></div>');
            var tableContainer = $('<div class="xlsx-table-container"></div>');

            wrapper.append(tabContainer).append(tableContainer);
            content.append(wrapper);

            wb.SheetNames.forEach(function(sheetName, idx) {
                var btn = $('<button type="button" class="xlsx-tab-btn ' + (idx === 0 ? 'active' : '') + '">' + escapeHtml(sheetName) + '</button>');
                btn.on('click', function() {
                    tabContainer.find('.xlsx-tab-btn').removeClass('active');
                    $(this).addClass('active');
                    renderSheet(sheetName);
                });
                tabContainer.append(btn);
            });

            function renderSheet(name) {
                var ws = wb.Sheets[name];
                var html = window.XLSX.utils.sheet_to_html(ws, { editable: false });
                tableContainer.html(html);
            }

            if (wb.SheetNames.length > 0) {
                renderSheet(wb.SheetNames[0]);
            }
        }).catch(function(err) {
            content.html('<div class="fp-error-state"><i class="fa fa-exclamation-triangle fa-2x"></i><p>Gagal memuat Excel: ' + escapeHtml(err.message) + '</p></div>');
        });
    };

    ViewerInstance.prototype.renderPPTX = function(url, content) {
        ensurePPTX().then(function() {
            return fetch(url, { credentials: 'include' }).then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.arrayBuffer();
            });
        }).then(function(buffer) {
            content.empty();
            var pptxDiv = $('<div style="width: 100%; height: 600px;"></div>')[0];
            content.append(pptxDiv);
            var viewer = new window.PPTXViewer(pptxDiv);
            return viewer.load(buffer);
        }).catch(function(err) {
            content.html('<div class="fp-error-state"><i class="fa fa-exclamation-triangle fa-2x"></i><p>Gagal memuat PowerPoint: ' + escapeHtml(err.message) + '</p></div>');
        });
    };

    ViewerInstance.prototype.renderText = function(url, content) {
        fetch(url, { credentials: 'include' }).then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        }).then(function(text) {
            content.empty();
            var textDiv = $('<div class="text-render-wrapper"></div>');
            textDiv.text(text);
            content.append(textDiv);
        }).catch(function(err) {
            content.html('<div class="fp-error-state"><i class="fa fa-exclamation-triangle fa-2x"></i><p>Gagal memuat teks: ' + escapeHtml(err.message) + '</p></div>');
        });
    };

    ViewerInstance.prototype.renderImage = function(url, content) {
        content.empty();
        var img = $('<img src="' + url + '" alt="Submission image" style="max-width: 100%; max-height: 80vh; object-fit: contain; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-radius: 4px;" />');
        content.append(img);
    };

    ViewerInstance.prototype.renderUnsupported = function(file, content) {
        var html = '<div class="fp-error-state">' +
            '<i class="fa fa-file-o fa-3x mb-2"></i>' +
            '<h5>' + escapeHtml(file.filename) + '</h5>' +
            '<p class="text-muted">' + (strings.unsupported_format || 'Format file ini tidak mendukung pratinjau langsung di peramban.') + '</p>' +
            '<a href="' + (file.downloadurl || file.url) + '" class="btn btn-primary mt-2">' +
                '<i class="fa fa-download mr-1 me-1"></i> ' + (strings.download || 'Unduh Berkas') +
            '</a>' +
        '</div>';
        content.html(html);
    };

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }

    /**
     * Launch Full-Screen Split Workspace Overlay.
     */
    function openSplitWorkspace(files, graderUrl, studentName) {
        $('.fp-split-workspace-overlay').remove();

        var overlay = $('<div class="fp-split-workspace-overlay">' +
            '<div class="fp-split-header">' +
                '<h5 class="fp-split-title">' +
                    '<i class="fa fa-columns text-info"></i> ' +
                    '<span>' + (strings.split_screen || 'Penilaian Layar Terpisah') + '</span>' +
                    (studentName ? ' - <span class="text-light">' + escapeHtml(studentName) + '</span>' : '') +
                '</h5>' +
                '<div class="fp-split-actions">' +
                    '<button type="button" class="fp-split-btn-close" title="' + (strings.close || 'Tutup') + '">' +
                        '<i class="fa fa-times"></i>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="fp-split-body">' +
                '<div class="fp-split-viewer-pane"></div>' +
                '<div class="fp-split-grading-pane">' +
                    '<div class="fp-grading-pane-header">' +
                        '<span><i class="fa fa-pencil-square-o mr-1 me-1"></i> ' + (strings.grade_panel_heading || 'Nilai & Umpan Balik') + '</span>' +
                    '</div>' +
                    '<iframe class="fp-grading-iframe" src="' + graderUrl + '"></iframe>' +
                '</div>' +
            '</div>' +
        '</div>');

        $('body').append(overlay);
        $('body').css('overflow', 'hidden');

        overlay.find('.fp-split-btn-close').on('click', function() {
            overlay.remove();
            $('body').css('overflow', '');
        });

        // Initialize viewer in left pane
        new ViewerInstance(overlay.find('.fp-split-viewer-pane'), files);
    }

    /**
     * Check if running in Moodle native Grader interface (action=grader).
     */
    function attachToMoodleGrader() {
        var reviewPanel = $('[data-region="review-panel-content"], [data-region="review-panel"]');
        if (reviewPanel.length === 0) {
            return false;
        }

        var files = [];

        // 1. Check if there are preview items from our plugin
        var summaryItem = $('.assignsubmission-filepreview-summary, .assignsubmission-filepreview-view');
        if (summaryItem.length > 0) {
            var btn = summaryItem.find('.filepreview-open-btn').first();
            var filesJson = btn.attr('data-files');
            if (filesJson) {
                try {
                    files = JSON.parse(filesJson);
                } catch (e) {}
            }
        }

        // 2. If no files from our plugin, extract from standard submission links in grading panel
        if (!files || files.length === 0) {
            $('[data-region="grade-panel"] .fileuploadsubmission a, [data-region="grade-panel"] .assignsubmission_file a, .assignsubmission_file a, .fileuploadsubmission a').each(function() {
                var a = $(this);
                // Skip icons
                if (a.find('img').length > 0 && !a.clone().children().remove().end().text().trim()) {
                    return;
                }
                var fn = a.text().trim();
                if (!fn || /\.(svg|png|jpg|jpeg|gif)$/i.test(fn)) {
                    return;
                }
                var extMatch = fn.match(/\.(pdf|docx|pptx|xlsx|xls|csv|txt|doc|ppt)$/i);
                if (extMatch) {
                    var hr = a.attr('href') || '';
                    var streamUrl = hr;
                    files.push({
                        filename: fn,
                        url: streamUrl,
                        downloadurl: hr,
                        extension: extMatch[1].toLowerCase(),
                        filesize: ''
                    });
                }
            });
        }

        if (files && files.length > 0) {
            reviewPanel.empty();
            new ViewerInstance(reviewPanel, files);
            return true;
        }

        return false;
    }

    /**
     * Enhance standard Moodle file links (assignsubmission_file) on the page.
     * Allows teachers to preview files from older assignments without re-uploading!
     */
    function enhanceStandardFileLinks() {
        $('.assignsubmission_file a, .fileuploadsubmission a, td.c4 a, td.c5 a').each(function() {
            var a = $(this);
            if (a.hasClass('fp-enhanced') || a.closest('.assignsubmission-filepreview-summary').length > 0) {
                return;
            }
            // Skip icons
            if (a.find('img').length > 0 && !a.clone().children().remove().end().text().trim()) {
                return;
            }
            var href = a.attr('href') || '';
            var filename = a.text().trim();
            if (!filename || /\.(svg|png|jpg|jpeg|gif)$/i.test(filename) || /\.(svg|png|jpg|jpeg|gif)$/i.test(href)) {
                return;
            }
            var extMatch = filename.match(/\.(pdf|docx|pptx|xlsx|xls|csv|txt|doc|ppt)$/i);
            if (extMatch) {
                var ext = extMatch[1].toLowerCase();
                var streamUrl = href;
                var btn = $('<button type="button" class="btn btn-sm btn-outline-primary py-0 px-1 ml-1 ms-1 fp-auto-preview-btn" title="' + (strings.preview || 'Preview') + '">' +
                    '<i class="fa fa-eye"></i> ' + (strings.preview || 'Preview') +
                '</button>');

                btn.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var file = {
                        filename: filename,
                        url: streamUrl,
                        downloadurl: href,
                        extension: ext,
                        filesize: ''
                    };
                    openSplitWorkspace([file], window.location.href, filename);
                });

                a.after(btn);
            }
        });
    }

    return {
        init: function(config) {
            assetBaseUrl = config.assetbase || '';
            strings = config.strings || {};

            // 1. Try mounting to native Grader review panel
            attachToMoodleGrader();

            // 2. Enhance standard Moodle file links if present
            enhanceStandardFileLinks();

            // 3. Delegate click on "Preview & Grade" button
            $(document).off('click.fp', '[data-action="open-preview"]').on('click.fp', '[data-action="open-preview"]', function(e) {
                e.preventDefault();
                var btn = $(this);
                var container = btn.closest('.assignsubmission-filepreview-summary, .assignsubmission-filepreview-view');
                var filesJson = btn.attr('data-files');
                var files = [];

                if (filesJson) {
                    try {
                        files = JSON.parse(filesJson);
                    } catch (err) {}
                }

                // If not in data attribute, extract from DOM list
                if (files.length === 0) {
                    container.find('.filepreview-quick-view').each(function() {
                        var el = $(this);
                        files.push({
                            filename: el.data('filename'),
                            url: el.data('fileurl'),
                            downloadurl: el.data('downloadurl'),
                            extension: el.data('ext'),
                            filesize: el.siblings('.text-muted').text().replace(/[()]/g, '')
                        });
                    });
                }

                var graderUrl = btn.data('graderurl') || window.location.href;
                var studentName = container.closest('tr').find('.cell.c1, .cell.c2').text().trim();

                openSplitWorkspace(files, graderUrl, studentName);
            });

            // 4. Delegate click on quick view single file
            $(document).off('click.fp', '[data-action="quick-preview"]').on('click.fp', '[data-action="quick-preview"]', function(e) {
                e.preventDefault();
                var link = $(this);
                var file = {
                    filename: link.data('filename'),
                    url: link.data('fileurl'),
                    downloadurl: link.data('downloadurl'),
                    extension: link.data('ext'),
                    filesize: ''
                };
                var graderUrl = window.location.href;
                openSplitWorkspace([file], graderUrl, link.data('filename'));
            });
        }
    };
});

