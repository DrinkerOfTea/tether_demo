/**
 * Created by jjillians on 11/09/2016.
 */

/**
 * Main homepage for the demo
 */
import React from 'react';

class Homepage extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.state = {};
    }

    render() {
        return (
            <div>
                <h1>Tethering demo</h1>
                <p>Please select a page to begin</p>
            </div>
        );
    }
}

export default Homepage;