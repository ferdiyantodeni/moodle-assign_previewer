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
 * Privacy Subsystem implementation for assignsubmission_filepreview.
 *
 * @package    assignsubmission_filepreview
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace assignsubmission_filepreview\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\approved_contextlist;
use mod_assign\privacy\assignsubmission_provider;
use mod_assign\privacy\submission_result;

defined('MOODLE_INTERNAL') || die();

/**
 * Privacy Subsystem for assignsubmission_filepreview.
 */
class provider implements
    \core_privacy\local\metadata\provider,
    assignsubmission_provider {

    /**
     * Return meta data for this plugin.
     *
     * @param collection $collection The initialised collection to add items to.
     * @return collection A listing of user data stored through this plugin.
     */
    public static function get_metadata(collection $collection): collection {
        $collection->link_subsystem(
            'core_files',
            'privacy:metadata:filepurpose'
        );

        $collection->add_database_table(
            'assignsubmission_filepreview',
            [
                'assignment' => 'privacy:metadata:assignment',
                'submission' => 'privacy:metadata:submission',
                'numfiles' => 'privacy:metadata:numfiles',
            ],
            'privacy:metadata:filepurpose'
        );

        return $collection;
    }

    /**
     * Export submission data for a user.
     *
     * @param submission_result $result The result object.
     */
    public static function export_submission_user_data(submission_result $result) {
        $context = $result->get_context();
        $submission = $result->get_submission();
        $user = $result->get_user();

        $fs = get_file_storage();
        $files = $fs->get_area_files(
            $context->id,
            'assignsubmission_filepreview',
            'submission_files',
            $submission->id,
            'id',
            false
        );

        foreach ($files as $file) {
            $result->export_file(
                [get_string('privacy:path', 'assignsubmission_filepreview')],
                $file
            );
        }
    }

    /**
     * Delete all data for all users in a context.
     *
     * @param \mod_assign\privacy\assign_plugin_request_data $requestdata The request data object.
     */
    public static function delete_submission_for_context(\mod_assign\privacy\assign_plugin_request_data $requestdata) {
        global $DB;

        $context = $requestdata->get_context();
        $assignmentid = $requestdata->get_assign()->get_instance()->id;

        $DB->delete_records('assignsubmission_filepreview', ['assignment' => $assignmentid]);

        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'assignsubmission_filepreview', 'submission_files');
    }

    /**
     * Delete all user data for a specific submission.
     *
     * @param \mod_assign\privacy\assign_plugin_request_data $requestdata The request data object.
     */
    public static function delete_submission_for_userid(\mod_assign\privacy\assign_plugin_request_data $requestdata) {
        global $DB;

        $submission = $requestdata->get_submission();
        $context = $requestdata->get_context();

        $DB->delete_records('assignsubmission_filepreview', ['submission' => $submission->id]);

        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'assignsubmission_filepreview', 'submission_files', $submission->id);
    }
}

