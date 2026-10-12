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
 * Admin settings for the assignsubmission_filepreview plugin.
 *
 * @package    assignsubmission_filepreview
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    // Default enabled setting.
    $settings->add(new admin_setting_configcheckbox(
        'assignsubmission_filepreview/default',
        new lang_string('default', 'assignsubmission_filepreview'),
        new lang_string('default_help', 'assignsubmission_filepreview'),
        1
    ));

    // Maximum number of files.
    $options = [];
    for ($i = 1; $i <= 20; $i++) {
        $options[$i] = $i;
    }
    $settings->add(new admin_setting_configselect(
        'assignsubmission_filepreview/maxfiles',
        new lang_string('maxfilessubmission', 'assignsubmission_filepreview'),
        new lang_string('maxfilessubmission_help', 'assignsubmission_filepreview'),
        10,
        $options
    ));

    // Maximum submission size.
    $settings->add(new admin_setting_configselect(
        'assignsubmission_filepreview/maxbytes',
        new lang_string('maxsubmissionsizebytes', 'assignsubmission_filepreview'),
        new lang_string('maxsubmissionsizebytes_help', 'assignsubmission_filepreview'),
        0,
        get_max_upload_sizes($CFG->maxbytes)
    ));

    // Default accepted file types.
    $settings->add(new admin_setting_configtext(
        'assignsubmission_filepreview/filetypes',
        new lang_string('acceptedfiletypes', 'assignsubmission_filepreview'),
        new lang_string('acceptedfiletypes_help', 'assignsubmission_filepreview'),
        '.pdf, .docx, .doc, .pptx, .ppt, .xlsx, .xls, .csv, .txt',
        PARAM_RAW
    ));
}

