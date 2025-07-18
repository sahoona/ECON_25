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
        }, 300 ); // A slightly longer delay might be safer

        // Function to bind refresh to a setting
        const bindRefresh = ( setting ) => {
            setting.bind( debouncedRefresh );
        };

        // Listen for changes in all controls within nav_menu sections
        api.control.each( function( control ) {
            if ( control.section && control.section.startsWith( 'nav_menu' ) ) {
                bindRefresh( control.setting );
            }
        } );

        // Also listen for when controls are added or removed (e.g., new menu item)
        const handleControlChange = ( control ) => {
            if ( control.section && control.section.startsWith( 'nav_menu' ) ) {
                bindRefresh( control.setting );
                // Also need to refresh when the control itself is removed
                control.container.on( 'removed', debouncedRefresh );
            }
        };

        api.control.bind( 'add', handleControlChange );
        api.control.bind( 'remove', debouncedRefresh ); // Refresh when any control is removed

        // Handle menu location changes specifically
        api( 'nav_menu_locations', ( setting ) => {
            bindRefresh( setting );
        } );
    } );
} )( jQuery, window.wp.customize );
