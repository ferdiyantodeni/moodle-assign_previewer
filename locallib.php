<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * File Preview Assignment Submission Subplugin.
 *
 * @package    assignsubmission_filepreview
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/mod/assign/submissionplugin.php');

/**
 * File preview submission plugin class.
 */
class assign_submission_filepreview extends assign_submission_plugin {

    /** @var string File area for submission files */
    const FILEAREA = 'submission_files';

    /**
     * Get plugin name.
     *
     * @return string
     */
    public function get_name() {
        return get_string('pluginname', 'assignsubmission_filepreview');
    }

    /**
     * Get settings for assignment form.
     *
     * @param MoodleQuickForm $mform
     */
    public function get_settings(MoodleQuickForm $mform) {
        global $CFG, $COURSE;

        $defaultmaxfiles = $this->get_config('maxfiles') ?: 10;
        $options = [];
        for ($i = 1; $i <= 20; $i++) {
            $options[$i] = $i;
        }

        $mform->addElement(
            'select',
            'assignsubmission_filepreview_maxfiles',
            get_string('maxfilessubmission', 'assignsubmission_filepreview'),
            $options
        );
        $mform->addHelpButton('assignsubmission_filepreview_maxfiles', 'maxfilessubmission', 'assignsubmission_filepreview');
        $mform->setDefault('assignsubmission_filepreview_maxfiles', $defaultmaxfiles);
        $mform->hideIf('assignsubmission_filepreview_maxfiles', 'assignsubmission_filepreview_enabled', 'notchecked');

        // Max submission size bytes
        $choices = get_max_upload_sizes($CFG->maxbytes, $COURSE->maxbytes);
        $choices[0] = get_string('courseuploadlimit') . ' (' . display_size($COURSE->maxbytes) . ')';
        $mform->addElement(
            'select',
            'assignsubmission_filepreview_maxsizebytes',
            get_string('maxsubmissionsizebytes', 'assignsubmission_filepreview'),
            $choices
        );
        $mform->addHelpButton('assignsubmission_filepreview_maxsizebytes', 'maxsubmissionsizebytes', 'assignsubmission_filepreview');
        $mform->setDefault('assignsubmission_filepreview_maxsizebytes', $this->get_config('maxsubmissionsizebytes') ?: 0);
        $mform->hideIf('assignsubmission_filepreview_maxsizebytes', 'assignsubmission_filepreview_enabled', 'notchecked');

        // Accepted file types
        $filetypesutil = new \core_form\filetypes_util();
        $defaulttypes = $this->get_config('filetypes') ?: '.pdf, .docx, .doc, .pptx, .ppt, .xlsx, .xls, .csv, .txt';
        $mform->addElement(
            'text',
            'assignsubmission_filepreview_filetypes',
            get_string('acceptedfiletypes', 'assignsubmission_filepreview')
        );
        $mform->addHelpButton('assignsubmission_filepreview_filetypes', 'acceptedfiletypes', 'assignsubmission_filepreview');
        $mform->setType('assignsubmission_filepreview_filetypes', PARAM_RAW);
        $mform->setDefault('assignsubmission_filepreview_filetypes', $defaulttypes);
        $mform->hideIf('assignsubmission_filepreview_filetypes', 'assignsubmission_filepreview_enabled', 'notchecked');
    }

    /**
     * Save assignment settings.
     *
     * @param stdClass $data
     * @return bool
     */
    public function save_settings(stdClass $data) {
        $this->set_config('maxfiles', $data->assignsubmission_filepreview_maxfiles ?? 10);
        $this->set_config('maxsubmissionsizebytes', $data->assignsubmission_filepreview_maxsizebytes ?? 0);
        $this->set_config('filetypes', $data->assignsubmission_filepreview_filetypes ?? '');
        return true;
    }

    /**
     * Filemanager options.
     *
     * @return array
     */
    private function get_file_options() {
        global $COURSE;

        $maxbytes = $this->get_config('maxsubmissionsizebytes');
        if (empty($maxbytes)) {
            $maxbytes = $COURSE->maxbytes;
        }

        $filetypes = $this->get_config('filetypes');
        if (empty($filetypes)) {
            $filetypes = ['document', 'presentation', 'spreadsheet', '.pdf', '.txt'];
        }

        return [
            'subdirs' => 0,
            'maxbytes' => $maxbytes,
            'maxfiles' => (int)($this->get_config('maxfiles') ?: 10),
            'accepted_types' => $filetypes,
            'return_types' => FILE_INTERNAL
        ];
    }

    /**
     * Add form elements for student submission.
     *
     * @param stdClass|null $submission
     * @param MoodleQuickForm $mform
     * @param stdClass $data
     * @return bool
     */
    public function get_form_elements_for_user($submission, MoodleQuickForm $mform, stdClass $data) {
        $data = file_prepare_standard_filemanager(
            $data,
            'files',
            $this->get_file_options(),
            $this->assignment->get_context(),
            'assignsubmission_filepreview',
            self::FILEAREA,
            $submission ? $submission->id : null
        );

        $mform->addElement('filemanager', 'files_filemanager', $this->get_name(), null, $this->get_file_options());
        return true;
    }

    /**
     * Save submission data from student form.
     *
     * @param stdClass $submission
     * @param stdClass $data
     * @return bool
     */
    public function save(stdClass $submission, stdClass $data) {
        global $DB;

        $data = file_postupdate_standard_filemanager(
            $data,
            'files',
            $this->get_file_options(),
            $this->assignment->get_context(),
            'assignsubmission_filepreview',
            self::FILEAREA,
            $submission->id
        );

        $files = $this->get_files($submission, new stdClass());
        $numfiles = count($files);

        $record = $DB->get_record('assignsubmission_filepreview', ['submission' => $submission->id]);
        if ($record) {
            $record->numfiles = $numfiles;
            $DB->update_record('assignsubmission_filepreview', $record);
        } else {
            $record = new stdClass();
            $record->assignment = $this->assignment->get_instance()->id;
            $record->submission = $submission->id;
            $record->numfiles = $numfiles;
            $DB->insert_record('assignsubmission_filepreview', $record);
        }

        return true;
    }

    /**
     * Check if submission is empty.
     *
     * @param stdClass $submission
     * @return bool
     */
    public function is_empty(stdClass $submission) {
        return $this->submission_is_empty($submission);
    }

    /**
     * Check if submission has no files.
     *
     * @param stdClass $submission
     * @return bool
     */
    public function submission_is_empty(stdClass $submission) {
        global $DB;
        $record = $DB->get_record('assignsubmission_filepreview', ['submission' => $submission->id]);
        if ($record) {
            return $record->numfiles == 0;
        }
        return count($this->get_files($submission, new stdClass())) == 0;
    }

    /**
     * Retrieve files attached to submission.
     *
     * @param stdClass $submission
     * @param stdClass $user
     * @return array
     */
    public function get_files(stdClass $submission, stdClass $user) {
        $fs = get_file_storage();
        $files = $fs->get_area_files(
            $this->assignment->get_context()->id,
            'assignsubmission_filepreview',
            self::FILEAREA,
            $submission->id,
            'timemodified',
            false
        );

        // Fallback: If no files found, check if student submitted via standard Moodle assignsubmission_file.
        if (empty($files)) {
            $files = $fs->get_area_files(
                $this->assignment->get_context()->id,
                'assignsubmission_file',
                'submission_files',
                $submission->id,
                'timemodified',
                false
            );
        }

        return $files;
    }

    /**
     * Format submission files into structured array for preview.
     *
     * @param stdClass $submission
     * @return array
     */
    public function get_preview_files_data(stdClass $submission) {
        global $CFG;

        $files = $this->get_files($submission, new stdClass());
        $result = [];
        $contextid = $this->assignment->get_context()->id;

        foreach ($files as $file) {
            $filename = $file->get_filename();
            $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $component = $file->get_component();
            $filearea = $file->get_filearea();

            // Generate clean inline stream URL with preview=1.
            $fileurl = moodle_url::make_pluginfile_url(
                $contextid,
                $component,
                $filearea,
                $submission->id,
                $file->get_filepath(),
                $filename,
                false
            )->out(false);

            $downloadurl = moodle_url::make_pluginfile_url(
                $contextid,
                $component,
                $filearea,
                $submission->id,
                $file->get_filepath(),
                $filename,
                true
            )->out(false);

            $result[] = [
                'filename' => $filename,
                'filesize' => display_size($file->get_filesize()),
                'extension' => $ext,
                'url' => $fileurl . (strpos($fileurl, '?') !== false ? '&preview=1' : '?preview=1'),
                'downloadurl' => $downloadurl,
                'is_pdf' => ($ext === 'pdf'),
                'is_word' => in_array($ext, ['docx', 'doc']),
                'is_excel' => in_array($ext, ['xlsx', 'xls', 'csv']),
                'is_pptx' => in_array($ext, ['pptx', 'ppt']),
                'is_text' => in_array($ext, ['txt', 'md', 'html', 'json', 'xml', 'log', 'py', 'java', 'sql', 'c', 'cpp', 'php']),
                'is_image' => in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'])
            ];
        }

        return $result;
    }

    /**
     * Render summary in the submissions grading table.
     *
     * @param stdClass $submission
     * @param bool $showviewlink
     * @return string
     */
    public function view_summary(stdClass $submission, &$showviewlink) {
        global $OUTPUT, $PAGE;

        $files = $this->get_preview_files_data($submission);
        if (empty($files)) {
            return get_string('nofiles', 'assignsubmission_filepreview');
        }

        // Initialize JavaScript viewer for quick preview or split screen.
        $this->require_viewer_js();

        $graderurl = (new moodle_url('/mod/assign/view.php', [
            'id' => $this->assignment->get_course_module()->id,
            'action' => 'grader',
            'userid' => $submission->userid
        ]))->out(false);

        $data = [
            'submissionid' => $submission->id,
            'userid' => $submission->userid,
            'files' => $files,
            'count' => count($files),
            'graderurl' => $graderurl,
            'firstfile' => $files[0]
        ];

        return $OUTPUT->render_from_template('assignsubmission_filepreview/summary', $data);
    }

    /**
     * Render full view on grading / single submission page.
     *
     * @param stdClass $submission
     * @return string
     */
    public function view(stdClass $submission) {
        global $OUTPUT, $PAGE;

        $files = $this->get_preview_files_data($submission);
        if (empty($files)) {
            return get_string('nofiles', 'assignsubmission_filepreview');
        }

        $this->require_viewer_js();

        $data = [
            'submissionid' => $submission->id,
            'userid' => $submission->userid,
            'files' => $files,
            'count' => count($files),
            'json_files' => json_encode($files)
        ];

        return $OUTPUT->render_from_template('assignsubmission_filepreview/view', $data);
    }

    /**
     * Include JavaScript AMD viewer module and pass necessary configurations.
     */
    private function require_viewer_js() {
        global $PAGE, $CFG;

        $assetbase = $CFG->wwwroot . '/mod/assign/submission/filepreview/assets';
        $config = [
            'assetbase' => $assetbase,
            'strings' => [
                'preview' => get_string('preview', 'assignsubmission_filepreview'),
                'split_screen' => get_string('split_screen', 'assignsubmission_filepreview'),
                'loading_doc' => get_string('loading_doc', 'assignsubmission_filepreview'),
                'close' => get_string('close', 'assignsubmission_filepreview'),
                'zoom_in' => get_string('zoom_in', 'assignsubmission_filepreview'),
                'zoom_out' => get_string('zoom_out', 'assignsubmission_filepreview'),
                'zoom_reset' => get_string('zoom_reset', 'assignsubmission_filepreview'),
                'fullscreen' => get_string('fullscreen', 'assignsubmission_filepreview'),
                'download' => get_string('download_fallback', 'assignsubmission_filepreview'),
                'page' => get_string('page', 'assignsubmission_filepreview'),
                'slide' => get_string('slide', 'assignsubmission_filepreview'),
                'sheet' => get_string('sheet', 'assignsubmission_filepreview'),
                'unsupported_format' => get_string('unsupported_format', 'assignsubmission_filepreview')
            ]
        ];

        $PAGE->requires->js_call_amd('assignsubmission_filepreview/viewer', 'init', [$config]);
    }

    /**
     * Clean up records on assignment deletion.
     *
     * @return bool
     */
    public function delete_instance() {
        global $DB;
        $DB->delete_records('assignsubmission_filepreview', ['assignment' => $this->assignment->get_instance()->id]);
        return true;
    }
}

