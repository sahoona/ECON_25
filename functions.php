<?php
/**
 * GP Child Theme Functions
 *
 * @package    GP_Child_Theme
 * @version    22.7.16
 * @author     sh k & GP AI
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// -----------------------------------------------------------------------------
// Core Theme Setup
// -----------------------------------------------------------------------------

// Load core theme functionality
require_once get_stylesheet_directory() . '/includes/core-setup.php';
require_once get_stylesheet_directory() . '/includes/assets.php';
require_once get_stylesheet_directory() . '/includes/optimization.php';
require_once get_stylesheet_directory() . '/includes/seo.php';
require_once get_stylesheet_directory() . '/includes/layout-hooks.php';
require_once get_stylesheet_directory() . '/includes/template-tags.php';
require_once get_stylesheet_directory() . '/includes/toc.php';
require_once get_stylesheet_directory() . '/includes/post-features.php';
require_once get_stylesheet_directory() . '/includes/related-posts.php';
require_once get_stylesheet_directory() . '/includes/ajax-handlers.php';
require_once get_stylesheet_directory() . '/includes/helpers.php';
require_once get_stylesheet_directory() . '/includes/admin.php';
require_once get_stylesheet_directory() . '/includes/customizer.php';
require_once get_stylesheet_directory() . '/includes/widgets.php';

// Load components
require_once get_stylesheet_directory() . '/components/ads/ads.php';


require_once get_stylesheet_directory() . '/includes/comments.php';

require_once get_stylesheet_directory() . '/includes/posts.php';

/**
 * Force refresh in the Customizer when menu settings are changed.
 *
 * This function is hooked into 'customize_save_after', which runs after the
 * Customizer settings are saved. It checks if any menu-related settings
 * were changed and, if so, forces a full page refresh of the Customizer preview.
 *
 * @param WP_Customize_Manager $manager Customizer manager object.
 */
function gp_child_force_menu_customizer_refresh( $manager ) {
    $settings = $manager->settings();
    $menu_setting_changed = false;

    foreach ( $settings as $setting ) {
        // Check for menu-related settings (nav_menu, nav_menu_locations).
        if ( strpos( $setting->id, 'nav_menu' ) === 0 ) {
            // The 'post_value' method gets the value of the setting as it was submitted.
            // We compare it with the original value to see if it has changed.
            if ( $setting->post_value() !== $setting->value() ) {
                $menu_setting_changed = true;
                break;
            }
        }
    }

    if ( $menu_setting_changed ) {
        // Not an ideal solution, but it's a reliable way to ensure changes are reflected.
        // We add a piece of JavaScript to the 'customize_controls_print_footer_scripts' action
        // that will trigger a page reload.
        add_action( 'customize_controls_print_footer_scripts', function() {
            echo '<script> window.parent.location.reload(); </script>';
        }, 1 );
    }
}
add_action( 'customize_save_after', 'gp_child_force_menu_customizer_refresh' );
