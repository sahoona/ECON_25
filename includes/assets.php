<?php
/**
 * Enqueue assets
 *
 * @package GP_Child_Theme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Enqueue scripts and styles
function gp_child_enqueue_assets() {
    $theme_version = wp_get_theme()->get('Version');
    $theme_dir = get_stylesheet_directory();

    // Enqueue the combined and minified stylesheet
    wp_enqueue_style('gp-child-style-min', get_stylesheet_directory_uri() . '/assets/css/style.min.css', [], $theme_version);

    // --- JavaScript Files ---
    wp_enqueue_script('gp-bundle-script', get_stylesheet_directory_uri() . '/assets/js/dist/bundle.js', ['jquery'], filemtime($theme_dir . '/assets/js/dist/bundle.js'), true);


    // --- Localized Data for JS ---
    $localized_data = [
		'ajax_url'        => admin_url('admin-ajax.php'),
		'reactions_nonce' => wp_create_nonce('gp_reactions_nonce'),
		'star_rating_nonce' => wp_create_nonce('gp_star_rating_nonce'),
        'load_more_posts_nonce' => wp_create_nonce('load_more_posts_nonce'),
        'load_more_series_nonce' => wp_create_nonce('load_more_series_nonce'),
        'currentPageId' => 0,
        'currentPostType' => 'unknown',
        'isFrontPage' => is_front_page(),
        'isHome' => is_home(),
        'ads_enabled' => get_theme_mod('econarc_ads_enabled', false),
        'top_ad_enabled' => get_theme_mod('econarc_top_ad_enabled', false),
        'infeed_ad_enabled' => get_theme_mod('econarc_infeed_ad_enabled', false),
        'ad_client' => get_theme_mod('econarc_ad_client'),
        'ad_slot' => get_theme_mod('econarc_ad_slot'),
        'top_ad_slot' => get_theme_mod('econarc_top_ad_slot'),
        'infeed_ad_slot' => get_theme_mod('econarc_infeed_ad_slot')
	];

    $current_post_object = get_queried_object();
    if ( $current_post_object instanceof WP_Post ) {
        $localized_data['currentPostType'] = $current_post_object->post_type;
        if ( $localized_data['currentPostType'] === 'page' ) {
            $localized_data['currentPageId'] = $current_post_object->ID;
        }
    } elseif ( is_home() ) {
        $localized_data['currentPostType'] = 'home';
    } elseif ( is_front_page() && !is_home() ) {
        $localized_data['currentPostType'] = 'front-page';
        if ( $current_post_object instanceof WP_Post && $current_post_object->post_type === 'page' ) {
            $localized_data['currentPageId'] = $current_post_object->ID;
        }
    } elseif ( is_archive() ) {
        $localized_data['currentPostType'] = 'archive';
    } elseif ( is_search() ) {
        $localized_data['currentPostType'] = 'search';
    }

    if (is_singular('post')) {
        $post_id = get_the_ID();
        $toc_settings = [];
        $levels = ['h2', 'h3', 'h4', 'h5', 'h6'];
        $defaults = ['h2' => 'on', 'h3' => 'on', 'h4' => 'off', 'h5' => 'off', 'h6' => 'off'];

        foreach ($levels as $level) {
            $meta_key = '_gp_toc_include_' . $level;
            $saved_value = get_post_meta($post_id, $meta_key, true);
            if ($saved_value === '') {
                $toc_settings[$level] = $defaults[$level];
            } else {
                $toc_settings[$level] = $saved_value;
            }
        }
        $localized_data['toc_settings'] = $toc_settings;
    }

    wp_localize_script('gp-bundle-script', 'gp_settings', $localized_data);

    // --- Inline & Async Scripts ---
    $custom_css = ':root { --theme-version: "' . esc_attr($theme_version) . '"; }';
    wp_add_inline_style('gp-child-style-min', $custom_css);

    $ad_client = get_theme_mod('econarc_ad_client');
    if ( ! empty( trim( $ad_client ) ) ) {
        wp_enqueue_script(
            'google-adsense',
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-' . esc_attr( trim( $ad_client ) ),
            [],
            null,
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'gp_child_enqueue_assets');

// Preload fonts
function gp_child_preload_fonts() {
    ?>
    <link rel="preload" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"></noscript>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Lexend+Deca&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend+Deca&display=swap"></noscript>
    <?php
}
add_action('wp_head', 'gp_child_preload_fonts', 1);


function gp_child_dark_mode_flicker_prevention() {
    ?>
    <script>
        (function() {
            const isDarkMode = localStorage.getItem('darkMode') === 'true';
            if (isDarkMode) {
                document.documentElement.classList.add('dark-mode-active');
            }
        })();
    </script>
    <?php
}
add_action( 'wp_head', 'gp_child_dark_mode_flicker_prevention', 0 );

function gp_add_script_attributes( $tag, $handle, $src ) {
    // Add async to Google AdSense script, which should be loaded ASAP without blocking.
    if ( 'google-adsense' === $handle ) {
        return str_replace( ' src', ' async src', $tag );
    }

    // Defer other non-critical scripts like jQuery and clamp.js.
    $defer_scripts = [
        'jquery-core',
        'jquery-migrate',
        'gp-bundle-script'
    ];

    if ( in_array( $handle, $defer_scripts, true ) ) {
        return str_replace( ' src', ' defer src', $tag );
    }

    return $tag;
}
add_filter( 'script_loader_tag', 'gp_add_script_attributes', 10, 3 );
