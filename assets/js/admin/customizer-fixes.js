( function( $, api ) {
    // Simple debounce function
    function debounce( func, wait ) {
        let timeout;
        return function( ...args ) {
            const context = this;
            clearTimeout( timeout );
            timeout = setTimeout( () => func.apply( context, args ), wait );
        };
    }

    api.bind( 'ready', function() {
        // Force all widget areas to be visible
        api.section.each( function( section ) {
            if ( section.id.startsWith( 'sidebar-widgets-' ) ) {
                section.activate();
            }
        } );

        // Debounced refresh function
        const debouncedRefresh = debounce( () => {
            api.previewer.refresh();
        }, 250 ); // 250ms delay

        // Function to bind refresh to a setting
        const bindRefresh = ( setting ) => {
            // Only act on settings that require a refresh
            if ( setting.transport === 'refresh' ) {
                setting.bind( debouncedRefresh );
            }
        };

        // Listen for changes in menu-related settings and controls
        api.control.each( function( control ) {
            if ( control.section && control.section.startsWith( 'nav_menu' ) ) {
                bindRefresh( control.setting );
            }
        } );

        // Also listen for when controls are added (e.g., new menu item)
        api.control.bind( 'add', function( control ) {
            if ( control.section && control.section.startsWith( 'nav_menu' ) ) {
                bindRefresh( control.setting );
            }
        } );

        // Handle menu location changes specifically
        api( 'nav_menu_locations', ( setting ) => {
            bindRefresh( setting );
        } );
    } );
} )( jQuery, window.wp.customize );
