( function( $, api ) {
    api.bind( 'ready', function() {
        // Force all widget areas to be visible
        api.section.each( function( section ) {
            if ( section.id.startsWith( 'sidebar-widgets-' ) ) {
                section.activate();
            }
        } );

        // Function to refresh the previewer
        const refreshPreview = () => api.previewer.refresh();

        // Listen for changes in menu-related settings
        const menuSettings = [
            'nav_menu_locations',
            'nav_menu'
        ];

        menuSettings.forEach( setting => {
            api( setting, ( value ) => {
                value.bind( refreshPreview );
            } );
        } );

        // Also listen for changes within menu sections
        api.section.each( function( section ) {
            if ( section.id.startsWith( 'nav_menu' ) ) {
                section.expanded.bind( function( isExpanded ) {
                    if ( isExpanded ) {
                        // When a menu section is opened, listen to its controls
                        section.controls.each( function( control ) {
                            control.setting.bind( refreshPreview );
                        } );
                    }
                } );
            }
        } );
    } );
} )( jQuery, window.wp.customize );
