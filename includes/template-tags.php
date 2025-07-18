<?php
/**
 * Custom template tags for this theme
 *
 * @package GP_Child_Theme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

function gp_entry_header_start_wrap() { echo '<div class="entry-header-wrapper">'; }
function gp_entry_header_end_wrap() { echo '</div>'; }
