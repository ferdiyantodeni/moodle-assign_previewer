/**
 * PPTX Viewer for Moodle Submission File Preview
 * Renders PowerPoint (.pptx) presentations client-side using JSZip and DOM XML parsing.
 *
 * @license Apache-2.0 / MIT
 */
(function(window) {
    'use strict';

    function PPTXViewer(container, options) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = options || {};
        this.currentSlideIndex = 0;
        this.slides = [];
        this.slideWidth = 9144000;  // Standard 4:3 default
        this.slideHeight = 6858000;
        this.objectUrls = [];
    }

    PPTXViewer.prototype.destroy = function() {
        this.objectUrls.forEach(function(url) {
            try { URL.revokeObjectURL(url); } catch (e) {}
        });
        this.objectUrls = [];
        if (this.container) {
            this.container.innerHTML = '';
        }
    };

    PPTXViewer.prototype.load = function(arrayBuffer) {
        var self = this;
        self.destroy();

        if (typeof JSZip === 'undefined') {
            return Promise.reject(new Error('JSZip is required to load PPTX files.'));
        }

        self.container.innerHTML = '<div class="pptx-loading"><div class="pptx-spinner"></div><p>Memuat presentasi PowerPoint...</p></div>';

        return JSZip.loadAsync(arrayBuffer).then(function(zip) {
            self.zip = zip;
            return self._parsePresentation();
        }).then(function() {
            return self._renderUI();
        }).catch(function(err) {
            self.container.innerHTML = '<div class="pptx-error"><i class="fa fa-exclamation-triangle"></i> Gagal memuat PPTX: ' +
                (err.message || 'File tidak valid atau rusak') + '</div>';
            throw err;
        });
    };

    PPTXViewer.prototype._parsePresentation = function() {
        var self = this;
        return self.zip.file('ppt/presentation.xml').async('text').then(function(presXmlText) {
            var parser = new DOMParser();
            var presXml = parser.parseFromString(presXmlText, 'text/xml');

            // Slide dimensions
            var sldSz = presXml.querySelector('sldSz');
            if (sldSz) {
                self.slideWidth = parseInt(sldSz.getAttribute('cx') || '9144000', 10);
                self.slideHeight = parseInt(sldSz.getAttribute('cy') || '6858000', 10);
            }

            // Slide relationships
            var relsFile = self.zip.file('ppt/_rels/presentation.xml.rels');
            if (relsFile) {
                return relsFile.async('text').then(function(relsXmlText) {
                    var relsXml = parser.parseFromString(relsXmlText, 'text/xml');
                    var relMap = {};
                    var relNodes = relsXml.querySelectorAll('Relationship');
                    for (var i = 0; i < relNodes.length; i++) {
                        var id = relNodes[i].getAttribute('Id');
                        var target = relNodes[i].getAttribute('Target');
                        relMap[id] = target;
                    }

                    var sldIds = presXml.querySelectorAll('sldId');
                    var slideFiles = [];
                    for (var j = 0; j < sldIds.length; j++) {
                        var rId = sldIds[j].getAttribute('r:id') || sldIds[j].getAttribute('id');
                        var targetPath = relMap[rId];
                        if (targetPath) {
                            if (!targetPath.startsWith('ppt/')) {
                                targetPath = 'ppt/' + targetPath.replace(/^\//, '');
                            }
                            slideFiles.push(targetPath);
                        }
                    }

                    if (slideFiles.length === 0) {
                        return self._findSlidesFallback();
                    }
                    return slideFiles;
                });
            } else {
                return self._findSlidesFallback();
            }
        }).then(function(slideFiles) {
            return self._parseAllSlides(slideFiles);
        });
    };

    PPTXViewer.prototype._findSlidesFallback = function() {
        var files = [];
        this.zip.forEach(function(path) {
            if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) {
                files.push(path);
            }
        });
        files.sort(function(a, b) {
            var numA = parseInt(a.replace(/[^\d]/g, ''), 10) || 0;
            var numB = parseInt(b.replace(/[^\d]/g, ''), 10) || 0;
            return numA - numB;
        });
        return Promise.resolve(files);
    };

    PPTXViewer.prototype._parseAllSlides = function(slideFiles) {
        var self = this;
        var promises = slideFiles.map(function(filePath, index) {
            return self._parseSingleSlide(filePath, index + 1);
        });
        return Promise.all(promises).then(function(slides) {
            self.slides = slides.filter(function(s) { return s !== null; });
            if (self.slides.length === 0) {
                throw new Error('Tidak ada slide yang ditemukan dalam file ini.');
            }
        });
    };

    PPTXViewer.prototype._parseSingleSlide = function(filePath, slideNum) {
        var self = this;
        var file = self.zip.file(filePath);
        if (!file) return Promise.resolve(null);

        // Slide relationships for images
        var relsPath = filePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
        var relsPromise = self.zip.file(relsPath) ? self.zip.file(relsPath).async('text') : Promise.resolve(null);

        return Promise.all([file.async('text'), relsPromise]).then(function(results) {
            var slideXmlText = results[0];
            var relsXmlText = results[1];
            var parser = new DOMParser();
            var slideXml = parser.parseFromString(slideXmlText, 'text/xml');

            var imageMap = {};
            if (relsXmlText) {
                var relsXml = parser.parseFromString(relsXmlText, 'text/xml');
                var rels = relsXml.querySelectorAll('Relationship');
                for (var i = 0; i < rels.length; i++) {
                    var id = rels[i].getAttribute('Id');
                    var target = rels[i].getAttribute('Target');
                    var type = rels[i].getAttribute('Type') || '';
                    if (type.indexOf('image') !== -1 || /\.(png|jpe?g|gif|svg|webp)$/i.test(target)) {
                        var resolvedPath = target.startsWith('/') ? target.substring(1) : 'ppt/' + target.replace(/^\.\.\//, '');
                        imageMap[id] = resolvedPath;
                    }
                }
            }

            return self._extractSlideContent(slideXml, imageMap, slideNum);
        });
    };

    PPTXViewer.prototype._extractSlideContent = function(slideXml, imageMap, slideNum) {
        var self = this;
        var slideData = {
            num: slideNum,
            elements: [],
            background: '#ffffff'
        };

        // Background color
        var bgSolid = slideXml.querySelector('bg solidFill srgbClr');
        if (bgSolid) {
            slideData.background = '#' + bgSolid.getAttribute('val');
        }

        // Shapes & Textboxes
        var shapes = slideXml.querySelectorAll('sp');
        for (var i = 0; i < shapes.length; i++) {
            var sp = shapes[i];
            var bounds = self._getBounds(sp);
            var textRuns = self._getTextRuns(sp);
            var shapeFill = self._getFill(sp);

            if (textRuns.length > 0 || shapeFill) {
                slideData.elements.push({
                    type: 'shape',
                    bounds: bounds,
                    fill: shapeFill,
                    textRuns: textRuns
                });
            }
        }

        // Tables
        var tables = slideXml.querySelectorAll('tbl');
        for (var t = 0; t < tables.length; t++) {
            var tbl = tables[t];
            var tblGraphic = tbl.closest('graphicFrame') || tbl;
            var tblBounds = self._getBounds(tblGraphic);
            var tableRows = [];

            var rows = tbl.querySelectorAll('tr');
            for (var r = 0; r < rows.length; r++) {
                var cells = [];
                var rowCells = rows[r].querySelectorAll('tc');
                for (var c = 0; c < rowCells.length; c++) {
                    var cellText = [];
                    var pNodes = rowCells[c].querySelectorAll('p');
                    for (var pn = 0; pn < pNodes.length; pn++) {
                        var tNodes = pNodes[pn].querySelectorAll('t');
                        var pText = [];
                        for (var tn = 0; tn < tNodes.length; tn++) {
                            pText.push(tNodes[tn].textContent);
                        }
                        cellText.push(pText.join(' '));
                    }
                    cells.push(cellText.join('\n'));
                }
                tableRows.push(cells);
            }

            slideData.elements.push({
                type: 'table',
                bounds: tblBounds,
                rows: tableRows
            });
        }

        // Pictures
        var pics = slideXml.querySelectorAll('pic');
        var picPromises = [];

        for (var p = 0; p < pics.length; p++) {
            (function(pic) {
                var picBounds = self._getBounds(pic);
                var blip = pic.querySelector('blip');
                var embedId = blip ? (blip.getAttribute('r:embed') || blip.getAttribute('embed')) : null;
                var imgPath = embedId ? imageMap[embedId] : null;

                if (imgPath && self.zip.file(imgPath)) {
                    var promise = self.zip.file(imgPath).async('blob').then(function(blob) {
                        var objUrl = URL.createObjectURL(blob);
                        self.objectUrls.push(objUrl);
                        slideData.elements.push({
                            type: 'image',
                            bounds: picBounds,
                            src: objUrl
                        });
                    }).catch(function() {});
                    picPromises.push(promise);
                }
            })(pics[p]);
        }

        return Promise.all(picPromises).then(function() {
            return slideData;
        });
    };

    PPTXViewer.prototype._getBounds = function(element) {
        var off = element.querySelector('off');
        var ext = element.querySelector('ext');
        var x = off ? parseInt(off.getAttribute('x') || '0', 10) : 0;
        var y = off ? parseInt(off.getAttribute('y') || '0', 10) : 0;
        var cx = ext ? parseInt(ext.getAttribute('cx') || '1000', 10) : 1000;
        var cy = ext ? parseInt(ext.getAttribute('cy') || '1000', 10) : 1000;

        return {
            left: ((x / this.slideWidth) * 100).toFixed(3) + '%',
            top: ((y / this.slideHeight) * 100).toFixed(3) + '%',
            width: ((cx / this.slideWidth) * 100).toFixed(3) + '%',
            height: ((cy / this.slideHeight) * 100).toFixed(3) + '%'
        };
    };

    PPTXViewer.prototype._getFill = function(sp) {
        var solid = sp.querySelector('spPr solidFill srgbClr');
        if (solid) {
            return '#' + solid.getAttribute('val');
        }
        return null;
    };

    PPTXViewer.prototype._getTextRuns = function(sp) {
        var runs = [];
        var paragraphs = sp.querySelectorAll('txBody p');
        for (var p = 0; p < paragraphs.length; p++) {
            var para = paragraphs[p];
            var pPr = para.querySelector('pPr');
            var align = pPr ? (pPr.getAttribute('algn') || 'l') : 'l';

            var paraRuns = [];
            var rNodes = para.querySelectorAll('r');
            for (var r = 0; r < rNodes.length; r++) {
                var rNode = rNodes[r];
                var tNode = rNode.querySelector('t');
                if (!tNode) continue;

                var text = tNode.textContent;
                var rPr = rNode.querySelector('rPr');
                var bold = rPr && rPr.getAttribute('b') === '1';
                var italic = rPr && rPr.getAttribute('i') === '1';
                var underline = rPr && rPr.getAttribute('u') === 'sng';
                var sz = rPr ? parseInt(rPr.getAttribute('sz') || '1800', 10) : 1800;
                var colorNode = rPr ? rPr.querySelector('solidFill srgbClr') : null;
                var color = colorNode ? ('#' + colorNode.getAttribute('val')) : '#212529';

                paraRuns.push({
                    text: text,
                    bold: bold,
                    italic: italic,
                    underline: underline,
                    sizePt: (sz / 100).toFixed(1),
                    color: color
                });
            }

            // In case paragraph has direct text without 'r'
            if (paraRuns.length === 0) {
                var directText = para.querySelector('t');
                if (directText && directText.textContent.trim()) {
                    paraRuns.push({
                        text: directText.textContent,
                        bold: false,
                        italic: false,
                        underline: false,
                        sizePt: '18',
                        color: '#212529'
                    });
                }
            }

            if (paraRuns.length > 0) {
                runs.push({
                    align: align === 'ctr' ? 'center' : (align === 'r' ? 'right' : (align === 'just' ? 'justify' : 'left')),
                    runs: paraRuns
                });
            }
        }
        return runs;
    };

    PPTXViewer.prototype._renderUI = function() {
        var self = this;
        var totalSlides = self.slides.length;
        var aspectRatio = (self.slideWidth / self.slideHeight).toFixed(3);

        var html = '<div class="pptx-viewer-wrapper">' +
            '<div class="pptx-toolbar">' +
                '<div class="pptx-nav-group">' +
                    '<button class="pptx-btn pptx-prev" title="Slide Sebelumnya"><i class="fa fa-chevron-left"></i></button>' +
                    '<span class="pptx-counter"><span class="pptx-current">1</span> / ' + totalSlides + '</span>' +
                    '<button class="pptx-btn pptx-next" title="Slide Berikutnya"><i class="fa fa-chevron-right"></i></button>' +
                '</div>' +
                '<div class="pptx-action-group">' +
                    '<select class="pptx-slide-select">';

        for (var i = 0; i < totalSlides; i++) {
            html += '<option value="' + i + '">Slide ' + (i + 1) + '</option>';
        }

        html +=     '</select>' +
                    '<button class="pptx-btn pptx-fullscreen" title="Layar Penuh"><i class="fa fa-expand"></i></button>' +
                '</div>' +
            '</div>' +
            '<div class="pptx-viewport-container">' +
                '<div class="pptx-slide-canvas" style="aspect-ratio: ' + aspectRatio + ';"></div>' +
            '</div>' +
            '<div class="pptx-thumbnails-strip">';

        for (var j = 0; j < totalSlides; j++) {
            html += '<div class="pptx-thumb-item ' + (j === 0 ? 'active' : '') + '" data-slide-index="' + j + '">' +
                        '<div class="pptx-thumb-number">' + (j + 1) + '</div>' +
                    '</div>';
        }

        html +=     '</div>' +
        '</div>';

        self.container.innerHTML = html;
        self._attachEvents();
        self._showSlide(0);
    };

    PPTXViewer.prototype._attachEvents = function() {
        var self = this;
        var prevBtn = self.container.querySelector('.pptx-prev');
        var nextBtn = self.container.querySelector('.pptx-next');
        var select = self.container.querySelector('.pptx-slide-select');
        var fsBtn = self.container.querySelector('.pptx-fullscreen');
        var thumbs = self.container.querySelectorAll('.pptx-thumb-item');

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                self._showSlide(self.currentSlideIndex - 1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                self._showSlide(self.currentSlideIndex + 1);
            });
        }
        if (select) {
            select.addEventListener('change', function(e) {
                self._showSlide(parseInt(e.target.value, 10));
            });
        }
        if (fsBtn) {
            fsBtn.addEventListener('click', function() {
                var viewport = self.container.querySelector('.pptx-viewport-container');
                if (!document.fullscreenElement) {
                    if (viewport.requestFullscreen) viewport.requestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                }
            });
        }
        for (var i = 0; i < thumbs.length; i++) {
            thumbs[i].addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-slide-index'), 10);
                self._showSlide(idx);
            });
        }

        // Keyboard listener when container is focused/hovered
        self.container.setAttribute('tabindex', '0');
        self.container.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                e.preventDefault();
                self._showSlide(self.currentSlideIndex + 1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                self._showSlide(self.currentSlideIndex - 1);
            }
        });
    };

    PPTXViewer.prototype._showSlide = function(index) {
        var self = this;
        if (index < 0) index = 0;
        if (index >= self.slides.length) index = self.slides.length - 1;
        self.currentSlideIndex = index;

        var canvas = self.container.querySelector('.pptx-slide-canvas');
        if (!canvas) return;

        var slide = self.slides[index];
        canvas.style.backgroundColor = slide.background || '#ffffff';
        canvas.innerHTML = '';

        slide.elements.forEach(function(el) {
            var elDiv = document.createElement('div');
            elDiv.className = 'pptx-element pptx-' + el.type;
            elDiv.style.position = 'absolute';
            elDiv.style.left = el.bounds.left;
            elDiv.style.top = el.bounds.top;
            elDiv.style.width = el.bounds.width;
            elDiv.style.height = el.bounds.height;

            if (el.type === 'shape') {
                if (el.fill) elDiv.style.backgroundColor = el.fill;
                el.textRuns.forEach(function(para) {
                    var p = document.createElement('div');
                    p.className = 'pptx-paragraph';
                    p.style.textAlign = para.align;
                    p.style.margin = '2px 0';
                    para.runs.forEach(function(r) {
                        var span = document.createElement('span');
                        span.textContent = r.text;
                        if (r.bold) span.style.fontWeight = 'bold';
                        if (r.italic) span.style.fontStyle = 'italic';
                        if (r.underline) span.style.textDecoration = 'underline';
                        if (r.color) span.style.color = r.color;
                        // Relative font sizing
                        span.style.fontSize = 'clamp(10px, ' + (r.sizePt * 0.9) + 'px, 32px)';
                        p.appendChild(span);
                    });
                    elDiv.appendChild(p);
                });
            } else if (el.type === 'image') {
                var img = document.createElement('img');
                img.src = el.src;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                elDiv.appendChild(img);
            } else if (el.type === 'table') {
                var table = document.createElement('table');
                table.className = 'pptx-table';
                table.style.width = '100%';
                table.style.height = '100%';
                table.style.borderCollapse = 'collapse';
                el.rows.forEach(function(row) {
                    var tr = document.createElement('tr');
                    row.forEach(function(cell) {
                        var td = document.createElement('td');
                        td.style.border = '1px solid #ced4da';
                        td.style.padding = '4px 6px';
                        td.style.fontSize = '12px';
                        td.innerText = cell;
                        tr.appendChild(td);
                    });
                    table.appendChild(tr);
                });
                elDiv.appendChild(table);
            }

            canvas.appendChild(elDiv);
        });

        // Update counter and thumbnails
        var counter = self.container.querySelector('.pptx-current');
        if (counter) counter.innerText = (index + 1);

        var select = self.container.querySelector('.pptx-slide-select');
        if (select) select.value = index;

        var thumbs = self.container.querySelectorAll('.pptx-thumb-item');
        thumbs.forEach(function(t, i) {
            if (i === index) {
                t.classList.add('active');
                t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                t.classList.remove('active');
            }
        });

        var prevBtn = self.container.querySelector('.pptx-prev');
        var nextBtn = self.container.querySelector('.pptx-next');
        if (prevBtn) prevBtn.disabled = (index === 0);
        if (nextBtn) nextBtn.disabled = (index === self.slides.length - 1);
    };

    window.PPTXViewer = PPTXViewer;
})(window);

