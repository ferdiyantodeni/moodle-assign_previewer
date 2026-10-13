# Moodle Assignment Submission File Previewer (`assignsubmission_filepreview`)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Moodle](https://img.shields.io/badge/Moodle-4.2%20to%205.x-orange.svg)](https://moodle.org)

An advanced Assignment Submission subplugin for Moodle that enables students to submit document files, while empowering teachers and graders with an **interactive inline document preview and Split-Screen Grading interface** without needing to download files one by one.

- **Moodle Plugin Component:** `assignsubmission_filepreview`
- **Plugin Type:** Assignment Submission Subplugin (`assignsubmission`)
- **Installation Path:** `mod/assign/submission/filepreview`
- **GitHub Repository:** [https://github.com/ferdiyantodeni/moodle-assign_previewer](https://github.com/ferdiyantodeni/moodle-assign_previewer)
- **Bug Tracker:** [https://github.com/ferdiyantodeni/moodle-assign_previewer/issues](https://github.com/ferdiyantodeni/moodle-assign_previewer/issues)
- **Author:** Ferdiyanto Deni Sanjaya ([gridiyans.my.id](https://gridiyans.my.id))

---

## 🌟 Key Features

1. **Client-Side Document Preview (Zero-Download):**
   - **PDF:** Rendered natively via bundled **Mozilla PDF.js** onto HTML5 Canvas with vertical scroll, page numbers, crisp vector zoom, and full device compatibility.
   - **Microsoft Word (.docx):** Rendered with native styling, tables, headings, and margins via `docx-preview`.
   - **Microsoft Excel (.xlsx, .xls, .csv):** Interactive multi-sheet spreadsheet viewer with tabbed workbook navigation via SheetJS.
   - **Microsoft PowerPoint (.pptx):** Clean slide-by-slide presentation viewer with next/previous controls, slide thumbnails, and fullscreen presentation mode.
   - **Plain Text & Source Code (.txt, .md, .py, .java, .sql, .json, .xml, .cpp, .html):** Clean monospace text display with line wrapping.
   - **Images (.png, .jpg, .jpeg, .gif, .svg, .webp):** Responsive high-resolution image preview.

2. **Inline Split-Screen Grader:**
   - **Left Pane (60-65%):** Interactive document viewer with toolbar controls (zoom in/out, reset, fullscreen, download fallback, and file switcher).
   - **Right Pane (35-40%):** Standard Moodle grading form, rubrics, marking guides, and feedback comments.
   - Streamlines the entire grading workflow without opening multiple browser tabs or desktop applications.

3. **100% Self-Contained, Secure & Intranet Ready:**
   - All vendor libraries are bundled locally in `assets/vendor/`.
   - Zero external cloud API calls: student submissions never leave your Moodle server.
   - No heavy server software dependencies required (no LibreOffice, Unoconv, or Ghostscript needed).

4. **Backward Compatibility:**
   - Supports viewing student submissions submitted under legacy assignments (`assignsubmission_file`) without requiring re-uploading.

---

## 📋 Requirements

- **Moodle:** 4.2, 4.3, 4.4, 4.5, up to Moodle 5.x
- **PHP:** 8.0, 8.1, 8.2, 8.3
- **Modern Web Browser:** Chrome, Edge, Firefox, Safari, or Opera

---

## 🚀 Installation

### Option 1: Via Git (Recommended)

1. Navigate to your Moodle assignment submission plugins directory:
   ```bash
   cd /path/to/moodle/mod/assign/submission
   ```
2. Clone the repository into a directory named `filepreview`:
   ```bash
   git clone https://github.com/ferdiyantodeni/moodle-assign_previewer.git filepreview
   ```
3. Visit **Site administration > Notifications** in your Moodle site and complete the database upgrade.

### Option 2: Via ZIP Upload

1. Download the latest release `.zip` package.
2. Log into your Moodle site as an administrator.
3. Go to **Site administration > Plugins > Install plugins**.
4. Upload the ZIP package and select plugin type **Assignment submission plugin (`assignsubmission`)**.
5. Follow the on-screen prompts to complete the installation.

---

## ⚙️ Configuration & Usage

1. **Activate the Plugin:**
   - Go to **Site administration > Plugins > Activity modules > Assignment > Submission plugins > Manage assignment submission plugins**.
   - Ensure **File submission with document preview** is enabled.

2. **Enable in an Assignment:**
   - Edit or create an **Assignment** activity in any course.
   - Under **Submission types**, check **File submission with document preview**.
   - Configure the maximum number of files and allowed file extensions as needed.
   - Click **Save and display**.

3. **Grading Submissions:**
   - In the assignment submission table (*View all submissions*), click **Preview & Grade**.
   - The interactive split-screen workspace will open: preview the document on the left, enter grades and feedback on the right, and save!

---

## 📂 Directory Structure

```text
filepreview/
├── amd/
│   ├── src/
│   │   └── viewer.js           # AMD JavaScript module (document viewer & split-screen)
│   └── build/
│       └── viewer.min.js       # Production compiled AMD module
├── assets/
│   └── vendor/
│       ├── jszip.min.js        # JSZip archive parser
│       ├── docx-preview.min.js # Word DOCX viewer
│       ├── xlsx.full.min.js    # SheetJS Excel viewer
│       ├── pdf.min.js          # Mozilla PDF.js renderer
│       ├── pdf.worker.min.js   # PDF.js Web Worker
│       └── pptx-viewer.js      # PowerPoint PPTX viewer
├── classes/
│   └── privacy/
│       └── provider.php        # Moodle Privacy API (GDPR compliance)
├── db/
│   ├── access.php              # Plugin capabilities
│   ├── install.xml             # XMLDB database schema
│   └── upgrade.php             # Upgrade steps
├── lang/
│   ├── en/
│   │   └── assignsubmission_filepreview.php # English language strings
│   └── id/
│       └── assignsubmission_filepreview.php # Indonesian language strings
├── pix/
│   └── icon.svg                # Plugin icon
├── templates/
│   ├── summary.mustache        # Mustache template for grading table
│   └── view.mustache           # Mustache template for submission view
├── .gitignore                  # Git ignore rules
├── LICENSE                     # GNU General Public License v3
├── lib.php                     # Moodle file serving callback (pluginfile)
├── locallib.php                # Core plugin class implementation
├── settings.php                # Administrative settings
├── styles.css                  # Responsive split-screen styles
└── version.php                 # Plugin version & metadata
```

---

## 🔒 Privacy & GDPR

This plugin implements the Moodle Privacy API (`\core_privacy\local\metadata\null_provider`). All submission files are stored using the Moodle core File API and are linked to student assignment submissions. No personal data is stored in separate unmanaged tables or transmitted to external services.

---

## 📄 License & Copyright

- **License:** [GNU General Public License v3 or later](LICENSE)
- **Copyright:** &copy; 2026 Ferdiyanto Deni Sanjaya ([gridiyans.my.id](https://gridiyans.my.id))
