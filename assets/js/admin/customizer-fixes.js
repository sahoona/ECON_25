( function( api ) {
    api.bind( 'ready', function() {
        // Force all widget areas to be visible
        api.section.each( function( section ) {
            if ( section.id.startsWith( 'sidebar-widgets-' ) ) {
                section.activate();
            }
        } );
    } );
} )( window.wp.customize );
