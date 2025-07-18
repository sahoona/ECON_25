<?php
/**
 * AJAX handlers
 *
 * @package GP_Child_Theme
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

function gp_load_more_series_posts_ajax_handler() {
    check_ajax_referer('load_more_series_nonce', 'nonce');

    $current_post_id = isset($_POST['current_post_id']) ? intval($_POST['current_post_id']) : 0;
    $offset = isset($_POST['offset']) ? intval($_POST['offset']) : 0;
    $posts_per_page = isset($_POST['posts_per_page']) ? intval($_POST['posts_per_page']) : 12;
    $initial_posts_count = isset($_POST['initial_posts_count']) ? intval($_POST['initial_posts_count']) : 12;
    $max_clicks = 3;

    if (!$current_post_id) {
        wp_send_json_error(['message' => 'Current post ID is missing.']);
        return;
    }

    $all_related_post_ids = get_custom_related_series_posts($current_post_id, $initial_posts_count + ($posts_per_page * $max_clicks));

    if (empty($all_related_post_ids)) {
        wp_send_json_success(['html' => '', 'has_more' => false, 'message' => 'No more series posts.']);
        return;
    }

    $post_ids_to_load = array_slice($all_related_post_ids, $offset, $posts_per_page);

    if (empty($post_ids_to_load)) {
        wp_send_json_success(['html' => '', 'has_more' => false, 'message' => 'No more series posts.']);
        return;
    }

    $args = array(
        'post__in' => $post_ids_to_load,
        'posts_per_page' => count($post_ids_to_load),
        'orderby' => 'post__in',
        'ignore_sticky_posts' => 1,
    );

    $query = new WP_Query($args);
    $html_output = '';
    global $placeholder_src; // 전역 변수로 placeholder_src 사용
    $placeholder_src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";


    if ($query->have_posts()) {
        ob_start();
        while ($query->have_posts()) : $query->the_post();
            $post_id = get_the_ID();
            $thumb_html = '';
            if (has_post_thumbnail($post_id)) {
                $thumbnail_id = get_post_thumbnail_id($post_id);
                $image_attributes = wp_get_attachment_image_src($thumbnail_id, 'medium_large');
                $actual_width = $image_attributes ? $image_attributes[1] : '';
                $actual_height = $image_attributes ? $image_attributes[2] : '';
                $image_alt_ajax = get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true);
                if (empty($image_alt_ajax)) {
                    $image_alt_ajax = get_the_title($post_id);
                }

                $image_src_ajax = wp_get_attachment_image_src($thumbnail_id, 'medium_large');
                if ($image_src_ajax) {
                    $image_url_ajax = $image_src_ajax[0];
                    $thumb_html = sprintf(
                        '<img src="%s" data-src="%s" alt="%s" width="%s" height="%s" class="lazy-load">',
                        esc_url($placeholder_src),
                        esc_url($image_url_ajax),
                        esc_attr($image_alt_ajax),
                        esc_attr($actual_width),
                        esc_attr($actual_height)
                    );
                } else {
                    $thumb_html = '<div class="no-thumb-series"></div>';
                }
            } else {
                $thumb_html = '<div class="no-thumb-series"></div>';
            }
            ?>
            <a href="<?php echo esc_url(get_permalink()); ?>" rel="bookmark" class="series-post-item">
                <div class="series-post-thumbnail"><?php echo $thumb_html; ?></div>
                <div class="series-post-content">
                    <h3 class="series-post-title"><?php echo esc_html(get_the_title()); ?></h3>
                </div>
            </a>
            <?php
        endwhile;
        $html_output = ob_get_clean();
        error_log('GP Theme AJAX: Generated HTML for series more: ' . $html_output);
        wp_reset_postdata();
    }

    $new_offset = $offset + count($post_ids_to_load);
    $has_more = $new_offset < count($all_related_post_ids);

    wp_send_json_success(['html' => $html_output, 'has_more' => $has_more, 'new_offset' => $new_offset, 'loaded_count' => count($post_ids_to_load)]);
}
add_action('wp_ajax_load_more_series_posts', 'gp_load_more_series_posts_ajax_handler');
add_action('wp_ajax_nopriv_load_more_series_posts', 'gp_load_more_series_posts_ajax_handler');

function gp_handle_reaction_callback() {
	check_ajax_referer('gp_reactions_nonce', 'nonce');
	if (isset($_POST['post_id']) && isset($_POST['reaction'])) {
		$post_id = intval($_POST['post_id']);
		$reaction = sanitize_key($_POST['reaction']);
		$count = get_post_meta($post_id, '_gp_reaction_' . $reaction, true);
		$new_count = ($count ? intval($count) : 0) + 1;
		update_post_meta($post_id, '_gp_reaction_' . $reaction, $new_count);
		wp_send_json_success(['count' => $new_count]);
	}
	wp_send_json_error();
}
add_action('wp_ajax_nopriv_gp_handle_reaction', 'gp_handle_reaction_callback');
add_action('wp_ajax_gp_handle_reaction', 'gp_handle_reaction_callback');

function gp_handle_star_rating_callback() {
	check_ajax_referer('gp_star_rating_nonce', 'nonce');
	if ( !isset($_POST['post_id']) || !isset($_POST['new_rating']) ) {
		wp_send_json_error('Missing parameters.');
	}

	$post_id = intval($_POST['post_id']);
	$new_rating = floatval($_POST['new_rating']);
	$old_rating = isset($_POST['old_rating']) ? floatval($_POST['old_rating']) : 0;

	if ($new_rating < 0.5 || $new_rating > 5) {
		wp_send_json_error('Invalid rating.');
	}

	$total_score = get_post_meta($post_id, '_gp_star_rating_total_score', true) ?: 0;
	$vote_count = get_post_meta($post_id, '_gp_star_rating_vote_count', true) ?: 0;

	if ( $old_rating > 0 ) {
		$new_total_score = $total_score - $old_rating + $new_rating;
		$new_vote_count = $vote_count;
	} else {
		$new_total_score = $total_score + $new_rating;
		$new_vote_count = $vote_count + 1;
	}

	update_post_meta($post_id, '_gp_star_rating_total_score', $new_total_score);
	update_post_meta($post_id, '_gp_star_rating_vote_count', $new_vote_count);
	$new_average = ($new_vote_count > 0) ? round($new_total_score / $new_vote_count, 1) : 0;
	wp_send_json_success([
		'average' => $new_average,
		'votes'   => $new_vote_count
	]);
}
add_action('wp_ajax_nopriv_gp_handle_star_rating', 'gp_handle_star_rating_callback');
add_action('wp_ajax_gp_handle_star_rating', 'gp_handle_star_rating_callback');

function gp_load_more_posts_ajax_handler() {
    error_log('GP Theme AJAX: gp_load_more_posts_ajax_handler invoked.');
    error_log('GP Theme AJAX: Received page number: ' . (isset($_POST['page']) ? sanitize_text_field($_POST['page']) : 'Not set'));
    error_log('GP Theme AJAX: Received nonce: ' . (isset($_POST['nonce']) ? sanitize_text_field($_POST['nonce']) : 'Not set'));

    if (check_ajax_referer('load_more_posts_nonce', 'nonce', false)) {
        error_log('GP Theme AJAX: Nonce verified successfully.');
    } else {
        error_log('GP Theme AJAX: Nonce verification failed.');
        wp_send_json_error(['message' => 'Nonce verification failed.']);
        return;
    }

    if ( !isset($_POST['page']) ) {
        error_log('GP Theme AJAX: Sending JSON error response - Page parameter missing.');
        wp_send_json_error(['message' => 'Page parameter missing.']);
        return;
    }
    $page = isset($_POST['page']) ? absint($_POST['page']) : 1;

    $args = [
        'post_type'      => 'post',
        'posts_per_page' => 5,
        'paged'          => $page,
        'post_status'    => 'publish',
    ];
    error_log('GP Theme AJAX: WP_Query arguments: ' . print_r($args, true));

    $query = new WP_Query($args);
    error_log('GP Theme AJAX: Posts found: ' . $query->post_count);
    if (!$query->have_posts()) {
        error_log('GP Theme AJAX: No posts found for page ' . $page);
    }

    if ($query->have_posts()) {
        ob_start();
        while ($query->have_posts()) : $query->the_post();
            ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('ajax-loaded-card'); ?>>
                <div class="inside-article">
                    <?php
                    echo '<header class="entry-header">';
                    $categories_list = get_the_category_list(', ');
                    if (!empty($categories_list)) {
                        echo '<div class="gp-post-category">' . wp_kses_post($categories_list) . '</div>';
                    }
                    the_title(sprintf('<h2 class="entry-title" itemprop="headline"><a href="%s" rel="bookmark">', esc_url(get_permalink())), '</a></h2>');
                    echo '</header>';
                    if (function_exists('gp_featured_image_output')) {
                        // gp_featured_image_output 함수를 직접 호출하는 대신,
                        // 해당 함수 내부 로직을 가져와 AJAX 핸들러에 맞게 수정합니다.
                        if (has_post_thumbnail()) {
                            $post_id = get_the_ID();
                            $thumbnail_id = get_post_thumbnail_id($post_id);
                            $image_alt = get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true) ?: get_the_title($post_id);
                            $image_src_data = wp_get_attachment_image_src($thumbnail_id, 'medium_large');

                            if ($image_src_data) {
                                $image_url = $image_src_data[0];
                                $width = $image_src_data[1];
                                $height = $image_src_data[2];
                                $placeholder_src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

                                $image_html = sprintf(
                                    '<img src="%s" data-src="%s" alt="%s" width="%d" height="%d" class="lazy-load">',
                                    esc_url($placeholder_src),
                                    esc_url($image_url),
                                    esc_attr($image_alt),
                                    esc_attr($width),
                                    esc_attr($height)
                                );

                                echo '<div class="post-image"><a href="' . esc_url(get_permalink()) . '" rel="bookmark">' . $image_html . '</a></div>';
                            }
                        }
                    }
                    echo '<div class="entry-summary" itemprop="text">';
                    echo wp_kses_post(wp_trim_words(get_the_excerpt(), 60, '...'));
                    echo '</div>';
                    if (function_exists('gp_read_more_btn_output')) {
                        gp_read_more_btn_output();
                    }
                    if (function_exists('gp_add_tags_to_list')) {
                        gp_add_tags_to_list();
                    }
                    if (function_exists('gp_add_star_rating_to_list')) {
                        gp_add_star_rating_to_list();
                    }
                    echo '<footer class="entry-meta">';
                    echo '</footer>';
                    ?>
                </div>
            </article>
            <?php
            if (function_exists('econarc_homepage_in_feed_ad')) {
                econarc_homepage_in_feed_ad();
            }
        endwhile;
        wp_reset_postdata();
        $html_output = ob_get_clean();
        error_log('GP Theme AJAX: Generated HTML for load more: ' . $html_output);
        error_log('GP Theme AJAX: HTML output length: ' . strlen($html_output));

        $load_more_button_html = '';
        if ($query->max_num_pages > $page) {
            $load_more_button_html = '<div class="load-more-container"><button id="load-more-btn" class="gp-load-more-btn">Load More</button></div>';
        }

        error_log('GP Theme AJAX: Sending success response with HTML and button.');
        wp_send_json_success(['html' => $html_output, 'button_html' => $load_more_button_html, 'max_pages' => $query->max_num_pages]);
    } else {
        error_log('GP Theme AJAX: Sending success response with no more posts message.');
        wp_send_json_success(['html' => '', 'message' => 'No more posts', 'max_pages' => $query->max_num_pages]);
    }
}
add_action('wp_ajax_load_more_posts', 'gp_load_more_posts_ajax_handler');
add_action('wp_ajax_nopriv_load_more_posts', 'gp_load_more_posts_ajax_handler');
