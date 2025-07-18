( function( $ ) {
    wp.customize.bind( 'ready', function() {
        // Force widget areas to be visible
        wp.customize.section( 'sidebar-widgets-after_entry_content_widget_area' ).activate();

        // Force a refresh of the previewer when the Customizer is saved.
        wp.customize.bind( 'saved', function() {
            wp.customize.previewer.refresh();
        } );
    } );
} )( jQuery );
