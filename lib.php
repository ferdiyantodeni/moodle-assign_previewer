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
 * Library functions for the assignsubmission_filepreview plugin.
 *
 * @package    assignsubmission_filepreview
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Serve submission files for inline preview or download.
 *
 * @param stdClass $course Course object
 * @param stdClass $cm Course module object
 * @param context $context Context object
 * @param string $filearea File area ('submission_files')
 * @param array $args Extra arguments (itemid, filepath, filename)
 * @param bool $forcedownload Whether to force download or permit inline streaming
 * @param array $options Additional options
 * @return bool False if file not found or access denied
 */
function assignsubmission_filepreview_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    global $USER, $DB, $CFG;

    if ($context->contextlevel != CONTEXT_MODULE) {
        return false;
    }

    require_login($course, false, $cm);

    $itemid = (int)array_shift($args);
    $filename = array_pop($args);
    $filepath = '/' . implode('/', $args) . '/';
    if ($filepath !== '//') {
        $filepath = clean_param($filepath, PARAM_PATH);
    } else {
        $filepath = '/';
    }

    require_once($CFG->dirroot . '/mod/assign/locallib.php');
    $assign = new assign($context, $cm, $course);

    // Verify submission exists.
    $submission = $DB->get_record('assign_submission', ['id' => $itemid, 'assignment' => $assign->get_instance()->id], '*', MUST_EXIST);

    // Permission checks: user is owner OR user can grade.
    $canview = false;
    if ($submission->userid == $USER->id) {
        $canview = true;
    } else if (has_capability('mod/assign:grade', $context)) {
        $canview = true;
    } else if (has_capability('mod/assign:view', $context)) {
        // Blind marking or group access checks.
        $canview = $assign->can_view_submission($submission->userid);
    }

    if (!$canview) {
        return false;
    }

    $fs = get_file_storage();
    $file = $fs->get_file($context->id, 'assignsubmission_filepreview', $filearea, $itemid, $filepath, $filename);

    if (!$file || $file->is_directory()) {
        return false;
    }

    // Allow inline streaming for preview if requested or default.
    $previewparam = optional_param('preview', 0, PARAM_INT);
    if ($previewparam) {
        $forcedownload = false;
    }

    send_stored_file($file, 0, 0, $forcedownload, $options);
    return true;
}
