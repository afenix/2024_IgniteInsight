
/**
 * This file contains the main JavaScript code for the Ignite Insight application.
 * It sets up global variables, event listeners, and functions for creating and interacting with the Leaflet map.
 * The code also includes functions for updating the displayed year, adding custom controls to the map, and setting up an Intersection Observer for scrolling events.
 * @file FILEPATH: /C:/Users/asher/Documents/UW_MAD/Geog575/Final_Project/Repo/2024_IgniteInsight/js/main.js
 * @global
 * @namespace
 */
// Set the Global variables
const mapParams = {
    'containerID': 'map-container',
    'center':  [45, -100],
    'zoom': 3
}
const dataDates = {
    'fire-history': {
        startYear: 1984,
        endYear: 2019
    },
    'drought-history': {
        startYear: 2000,
        endYear: 2022
    }
}
const geoJsonPaths = {
    'mtbs-fires-pts': 'data/mtbs_firePts84_22.geojson',
    'mtbs-fires-poly': 'data/mtbs_fire_poly.geojson'
}
let map;
let currentYear = dataDates['fire-history'].startYear;
let geoJson;

const scrollElement = document.getElementById('map-narrative');
const wildfireHistorySection = document.getElementById('wildfire-history-section');
const thresholds = Array.from({ length: 100 }, (_, index) => index * 0.01);
let isHistorySectionVisible = false;

// Add event listeners for splash screen and sidebar panel behavior
document.addEventListener('DOMContentLoaded', function () {
    const splashScreen = document.getElementById('splash-screen');
    const closeButton = document.getElementById('close-splash');
    const toggleBtn = document.getElementById('toggle-panel-btn');

    createMap(mapParams.containerID, mapParams.center, mapParams.zoom);

    // Set up Intersection Observer for sidebar panel scrolling events
    setUpIntersectionObserver();

    // Add event listener to close the splash screen when the close button is clicked
    closeButton.addEventListener('click', function () {
        // Add the fade-out class to start the animation
        splashScreen.classList.add('fade-out');
        // Wait for the animation to finish before setting display to 'none'
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500); // Duration of the fade-out animation
    });

    // Attach the event listener to the toggle button and fire the toggle function when the close button is clicked
    toggleBtn.addEventListener('click', toggleSidePanelAndAdjustMap);

    // Event listener for scrolling events
    scrollElement.addEventListener('scroll', function() {
        if (isHistorySectionVisible) {
            const sectionHeight = wildfireHistorySection.clientHeight;
            const scrollPosition = this.scrollTop; // Top of the scrollable section
            const scrollHeight = this.scrollHeight; // Total scrollable height
            const visibleHeight = this.clientHeight; // Height of the visible part of the sidebar

            // Calculate the scroll percentage
            const scrollPercentage = scrollPosition / (scrollHeight - visibleHeight);

            // Calculate the current year based on scroll percentage
            const yearRange = dataDates['fire-history'].endYear - dataDates['fire-history'].startYear;
            const scrolledYear = Math.round(dataDates['fire-history'].startYear + scrollPercentage * yearRange);

            if (scrolledYear !== currentYear) {
                currentYear = scrolledYear;
                updateYearDisplay(currentYear);
                addFireBoundariesByTime(currentYear);
            }
        }
    });
});

// Function to instantiate the Leaflet map
const createMap = (containerId, center, zoom) => {
    // Create the map and set its initial view to the specified coordinates and zoom level
    map = L.map(containerId, {
        center: center, // USA
        zoom: zoom, // Initial zoom level
    });

    // Create a new control that adds the home button to the map
    L.Control.HomeButton = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom home-button');
            // Style Home button - use Font Awesome's home icon
            container.innerHTML = '<i class="fa-solid fa-house"></i>';
            container.setAttribute('data-tooltip', 'Zoom to full  extent')
            container.style.backgroundColor = 'white';
            container.style.width = '34px';
            container.style.height = '36px';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';

            // Attach the event listener to the container
            container.onclick = function() {
                map.setView(mapParams.center, mapParams.zoom); // Set this to the center and zoom level of the United States, including Alaska
            }
            return container;
        }
    });
    // Add the new home control to the map
    map.addControl(new L.Control.HomeButton({ position: 'topleft' }));

    // Create a new control for zooming to user's location
    L.Control.UserLocation = L.Control.extend({
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom zoom-user-button');
            // Style Home button - use Font Awesome's home icon
            container.innerHTML = '<i class="fa-solid fa-location-arrow"></i>';
            container.setAttribute('data-tooltip', 'Zoom to your location')
            container.style.backgroundColor = 'white';
            container.style.width = '34px';
            container.style.height = '36px';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';

            // Attach the event listener to the container
            container.onclick = function() {
                map.locate({setView: true, maxZoom: 8}); // user Leaflet location
            }
            return container;
        }
    });
    // Add the new home control to the map
    map.addControl(new L.Control.UserLocation({ position: 'topleft' }));

    // Define regions to create custom zoom control - include center coordinates and zoom levels
    const regions = {
        'us': { tooltip: 'Zoom to Continental United States', center: [39.828, -98.5], zoom: 4 }, // Continental United States
        'ak': { tooltip: 'Zoom to Alaska', center: [65.67, -151.626], zoom: 4.5 }, // Alaska
        'pnw': { tooltip: 'Zoom to Pacific Northwest', center: [39.9, -120.5], zoom: 5 }, // Pacific Northwest
        'sw': { tooltip: 'Zoom to Southwest', center: [34.0, -112.0], zoom: 5 }, // Southwest
        'mw': { tooltip: 'Zoom to Midwest', center: [41.0, -93.0], zoom: 5 }, // Midwest
        'ne': { tooltip: 'Zoom to Northeast', center: [43.0, -73.0], zoom: 5 }, // Northeast
        'se': { tooltip: 'Zoom to Southeast', center: [33.0, -85.0], zoom: 5 } // Southeast
    };

    // Create and add a custom zoom control for each region
    Object.keys(regions).forEach(function(regionKey) {
        var region = regions[regionKey];
        L.Control.RegionButton = L.Control.extend({
            onAdd: function(map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom region-button');

                // Set the inner HTML for the button, e.g., the name of the region
                container.innerHTML = regionKey.toUpperCase();
                // Add the data-tooltip attribute
                container.setAttribute('data-tooltip', region.tooltip)

                // Style region buttons
                container.style.backgroundColor = 'white';
                container.style.width = '35px';
                container.style.height = '30px';
                container.style.display = 'flex';
                container.style.justifyContent = 'center';
                container.style.alignItems = 'center';
                container.fontFamily = "Protest Revolution";

                // Attach the event listener
                container.onclick = function() {
                    map.setView(region.center, region.zoom);
                }

                return container;
            }
        });

        // Add each region zoom control to the map
        map.addControl(new L.Control.RegionButton({ position: 'topleft' }));
    });

    // Add a tile layer to the map using Stadia Maps' Alidade Smooth tiles for terrain visualization
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'png'
    }).addTo(map)

// ==================> TODO: UPDATE additional attribution on data change  <=========================================//
    map.attributionControl.addAttribution('Historical fire data &copy; <a href="https://www.mtbs.gov/">Monitoring Trends in Burn Severity</a>');

    // Add a scale bar to the map
    L.control.scale({ position: 'bottomright', metric: false }).addTo(map);

    // Initiate the retrieval and display of wildfire points
    loadFireData ();
    createCloroplethLegend();

};

// Function to update the displayed year
const updateYearDisplay = (year) => {
    const yearDisplay = document.getElementById('rangeValue');
    yearDisplay.textContent = year;
};


// Intersection Observer setup function
const setUpIntersectionObserver = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isHistorySectionVisible = true;
                // Trigger immediate update to display start year data
                //addFireBoundariesByTime(startYear);
                console.log('HI: ' + startYear);
            } else {
                isHistorySectionVisible = false;
console.log('history section is no longer visible');

                // Optional: clear data or reset state as the section exits the viewport
            }
        });
    }, {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // adjust this value based on how much of the section must be visible to trigger
    });
    observer.observe(wildfireHistorySection);
};

// Function to toggle the side panel and adjust the map
const toggleSidePanelAndAdjustMap = (event) => {
    const sidePanel = document.getElementById('side-panel-container');
    const mapContainer = document.getElementById('map-container');
    // Get the scale bar element
    const scaleBar = document.querySelector('.leaflet-control-scale');

    // Toggle the classes to resize the map and side panel
    sidePanel.classList.toggle('closed');
    scaleBar.classList.toggle('closed');
    mapContainer.classList.toggle('expanded');

    // Change the text content of the toggle button based on the current state of the side panel
    if (sidePanel.classList.contains('closed')) {
        console.log('i should be switching to open now');
        event.target.textContent = 'Open';
    } else {
        event.target.textContent = 'Close';
    }

    // Wait for the transition, then adjust the map size and re-center
    setTimeout(function () {
        map.invalidateSize(); // Adjust map size to new container size
        // Re-center the map on Redding, California
        map.setView([40.61063281856264, -122.63627755594064], map.getZoom());
    }, 300); // Adjust timeout duration
}

// Determine the min and max values for all years of data in order to scale legend
// proportional symbols to match map.
const calcMinMaxValue = (data) => {
    let allValues = [];
    for (let crime of data.features) {
        for (let year = 2015; year <= 2023; year++) {
            let value = crime.properties["Vandalism_" + String(year)];

            if (value) {
                allValues.push(value);
            }
        }
    }

    let minValue = Math.min(...allValues);
    let maxValue = Math.max(...allValues);

    return { minValue, maxValue };
}

function calcYearMinMax(data, year) {
    let values = [];
    data.features.forEach(feature => {
        if (feature.properties[`Vandalism_${year}`]) {
            values.push(feature.properties[`Vandalism_${year}`]);
        }
    });
    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);
    return { minValue, maxValue };
}

// Calculate the radius of each proportional symbol
const calcPropRadius = (attValue) => {
    // Define a minimum radius for the symbol, to ensure it's always visible
    const minRadius = 1;

    // Calculate the radius of the symbol using the Flannery Appearance Compensation formula
    // This formula is used to adjust the size of the symbol proportionally based on the attribute value
    const radius = 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRadius;

    return radius;
};

// Function to capitalize the first letter of each word
const capitalizeFirstLetter = (string) => {
    return string
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Function to create a circle marker with popup content for each point feature in the data
const pointToLayer = (feature, latlng, attributes) => {
    // Assign the current attribute based on the first index of the attributes array
    const attribute = attributes[0];
    // Get the count of the vandalism by point and make sure it's a number
    const attValue = Number(feature.properties[attribute]);
    // Calculate the radius of the circle marker based on the attribute value
    const radius = calcPropRadius(attValue);

    // Create the circleMarker
    let layer = L.circleMarker(latlng, {
        radius: radius,
        fillColor: "#ff7800",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    });

    // Construct popup content
    const year = attributes[0].split("_")[1];
    const name = capitalizeFirstLetter(feature.properties.NAME);
    const vandalisms = feature.properties[attributes[0]];
    let popupContent = "<h1>Year: " + year + "</h1><p><b>Neighborhood:</b> </br>" + name + "</p>" +
        "<p><b>Number of vandalisms:</b> </br>" + vandalisms + "</p>";

    // Attach event listener for displaying custom popup content
    layer.on('click', function (e) {
        L.DomEvent.stopPropagation(e); // Prevent event from propagating to lower layers
        showPopupContent(popupContent);
    });

    return layer;
}

// Create proportional symbols for features in the data and add them to the map.
const createPropSymbols = (data, attributes) => {
    // Create a Leaflet GeoJSON layer and add it to the map
    geoJson = L.geoJson(data, {
        // For each feature, create a point using the provided attributes
        pointToLayer: (feature, latlng) => pointToLayer(feature, latlng, attributes),
        // For each feature, determine and assign the corresponding class range
        onEachFeature: (feature, layer) => {
            if (feature.properties) {
                const attValue = Number(feature.properties[attributes[0]]);
                const rangeClass = getClassRange(attValue, classRanges);
                // add the range class name to the layer's options
                layer.options.className = rangeClass;
            }
        }
    }).addTo(map);

    // Change the style of the layer if it has the class name "No Vandalism"
    geoJson.eachLayer((layer) => {
        if (layer.options.className === 'No Vandalism') {
            layer.setStyle({
                fillOpacity: 1, // Highlight
                radius: 5, // Change the size of the layer
                color: 'white', // Change the outline color of the layer
                fillColor: 'gray' // Change the fill color of the layer
            });
        }
    });
};

// Function to create sequence controls (e.g., sliders, buttons) based on the extracted column names
const createSequenceControls = (attributes) => {
    // Attach input event listener to the range slider to update the map symbols and displayed year.
    document.querySelector('.range').addEventListener('input', function () {
        updateSliderDisplayAndSymbols(this.value, attributes);
        // Hide the popup-content when the slider value changes
        document.getElementById('popup-content').style.display = 'none';
    });

    // Attach click event listeners to forward and reverse buttons to navigate through the years.
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener("click", function () {
            navigateThroughYears(button.id, attributes);
            console.log(this.value);
            // Hide the popup-content when the slider value due to a click event on the buttons
            document.getElementById('popup-content').style.display = 'none';
        });
    });
};

// Update the display and map symbols based on the slider value.
const updateSliderDisplayAndSymbols = (index, attributes) => {
    // Get the attribute name for the current index
    let key = attributes[index];
    // Extract the year part from the attribute to display in the slider
    let year = key.slice(-4);

    updateLegendForYear(year);
    document.getElementById('rangeValue').textContent = `Year: ${year}`;

    // Update the proportional symbols on the map to reflect the current year
    updatePropSymbols(attributes[index]);

    // Update the total vandalism count display
    updateTotalVandalismCountDisplay(year);

    const legendCircles = document.querySelectorAll('.legendCircle');
    legendCircles.forEach(circle => {
        circle.addEventListener('mouseover', (event) => {
            const className = event.target.classList[1]; // Get the class name (e.g., "low")
            highlightFeatures(className);
            // Remove any potential highlight styles
            circle.style.backgroundColor = ''; // Or reset other styles as needed

            // Re-apply the original class
            circle.className = `legendCircle ${className}`;
        });

        circle.addEventListener('mouseout', () => {
            resetFeatureStyles();  // Call a function to reset styles
        });
    });

    // Calculate the percentage of the slider's value relative to its total range
    const percentage = (index / (attributes.length - 1)) * 100;

    // Update the slider's background to reflect the percentage
    // Red for the 'filled' part, grey for the 'unfilled' part
    rangeSlider.style.background = `linear-gradient(to right, red ${percentage}%, grey ${percentage}%)`;

    // Determine the period based on the year
    let period;
    if (year >= 2015 && year <= 2019) {
        period = "2015-2019: <br>Pre-COVID Relative 'Stability'";
    } else if (year == 2020) {
        period = "2020: <br>Early COVID-19 Impact and Social Unrest:";
    } else if (year == 2021) {
        period = "2021: <br>Rising Graffiti Incidents Amidst COVID-19";
    } else if (year == 2022) {
        period = "2022: <br>Adaptive Responses and Persistent Challenges";
    } else {
        period = "2023: <br>Stabilization and Continued Vigilance";
    }

    // Update side panel content
    // const mapDescriptionContainer = document.getElementById('map-description');
    // mapDescriptionContainer.innerHTML = `
    // <h3 class="map-title">${period}</h3>
    // <p>${periodDescriptions[period]}</p>`;
}

// Handle navigation through years with forward and reverse buttons.
const navigateThroughYears = (buttonId, attributes) => {
    let slider = document.querySelector('.range');
    let index = parseInt(slider.value, 10);
    if (buttonId === 'forward') {
        index = Math.min(index + 1, attributes.length - 1);
    } else if (buttonId === 'reverse') {
        index = Math.max(index - 1, 0);
    }

    slider.value = index;
    updateSliderDisplayAndSymbols(index, attributes);
}

// Initialize the slider with the first year (assumed to be 2015) on page load.
const initializeSlider = (attributes) => {
    let initialIndex = attributes.findIndex(attribute => attribute.endsWith('2015'));
    let slider = document.querySelector('.range');
    if (initialIndex !== -1) {
        slider.value = initialIndex;
        updateSliderDisplayAndSymbols(initialIndex, attributes);
    } else {
        console.error('Year 2015 not found in attributes.');
    }
}

// Function to update the size of the proportional symbols on the map and the content of their associated popups
const updatePropSymbols = (attribute) => {
    // Iterate over each layer on the map
    map.eachLayer((layer) => {
        // Check if the layer has a feature and if that feature has a property that matches the attribute
        if (layer.feature && layer.feature.properties[attribute]) {
            // Access the properties of the feature
            const props = layer.feature.properties;

            // Calculate a new radius for the layer's symbol based on the value of the feature's attribute
            const radius = calcPropRadius(props[attribute]);

            // Update the layer's radius
            layer.setRadius(radius);

            // Calculate the new class range based on the updated attribute value
            // const classRanges = calculateClassRanges(props[attribute]);
            let newRangeClass = getClassRange(props[attribute], classRanges);
            // Get the old class range of the layer
            const oldRangeClass = layer.options.className;

            // Compare the old class range with the new class range
            if (oldRangeClass !== newRangeClass) {
                // Remove the old layer from the map
                map.removeLayer(layer);

                // Create a new layer with the updated class
                const newLayer = L.circleMarker(layer.getLatLng(), {
                    radius: radius,
                    fillColor: "#ff7800",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8,
                    className: `feature ${newRangeClass}`
                });

                // Add the new layer to the map
                newLayer.addTo(map);

                // Transfer the feature properties to the new layer
                newLayer.feature = layer.feature;

                // Add the click event listener to the new layer
                newLayer.on('click', function (e) {
                    L.DomEvent.stopPropagation(e); // Prevent event from propagating to lower layers
                    showPopupContent(popupContent);
                });
            }

            // Construct HTML to be used as the content of the layer's popup
            const year = attribute.split("_")[1];
            let popupContent = "<h1>Year: " + year + "</h1>" + "<p><b>Neighborhood:</b> </br>" + props.NAME + "</p>";
            popupContent += "<p><b>Number of vandalisms:</b> </br>" + props[attribute] + "</p>";

            // Add a click event listener to the layer to display the popup content in the popup container
            layer.on('click', function (e) {
                L.DomEvent.stopPropagation(e); // Prevent event from propagating to lower layers
                showPopupContent(popupContent);
            });
        };
    });
};

// Function to process GeoJSON data and extract relevant column names
const getColumnNames = (data) => {
    // Initialize an array to store column names that meet our criteria
    let columnNames = [];

    // Extract properties from the first feature in the GeoJSON data
    let properties = data.features[0].properties;

    // Iterate over each property (column) in the properties object
    for (let column in properties) {
        // Check if the column name starts with "Vandalism_" and the year (last part of the column name) is 2015 or later
        // This is done to filter out columns that don't represent vandalism data or represent data from before 2015
        if (column.startsWith("Vandalism_") && parseInt(column.split("_").pop(), 10) >= 2015) {
            // If the column passes the check, add its name to the columnNames array
            columnNames.push(column);
        }
    };
    return columnNames;
};

// Function to create a legend for a map
const createLegend = (minValue, maxValue) => {
    // Ensure minimum value is at least 10
    min = (minValue < 10) ? 10 : minValue;

    // Find the legend container in the HTML
    let legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = ''; // Clear existing content
    let symbolsContainer = document.createElement("div");
    symbolsContainer.className = "symbols-container";

    // Define classes for the legend based on min, max, and midpoint values (rounded to the nearest 10)
    let classes = [Math.round(maxValue), Math.round((maxValue - min) / 2), Math.round(min)];

    // Define your class range logic (assuming it's already defined elsewhere)
    let classRanges = calculateClassRanges(minValue, maxValue);

    for (let i = 0; i < classes.length; i++) {
        let currentRadius = calcPropRadius(classes[i]);
        let legendCircle = document.createElement('div');
        legendCircle.className = 'legendCircle';
        legendCircle.style.width = currentRadius * 2 + 'px';
        legendCircle.style.height = currentRadius * 2 + 'px';
        legendCircle.style.bottom = '0'; // Align the bottom edge of all circles
        legendCircle.style.marginBottom = '25px';

        // Assign the corresponding class name from classRanges
        legendCircle.className = 'legendCircle ' + classRanges[i].className;

        // Create the legendValue and position it above the circle
        let legendValue = document.createElement('span');
        legendValue.className = 'legendValue';
        legendValue.textContent = classes[i].toLocaleString();
        // Position the legendValue 2px above the upper edge of the legendCircle
        legendValue.style.bottom = `${currentRadius * 2 + 2}px`;

        // Create a new legend set
        let legendSet = document.createElement('div');
        legendSet.className = 'legend-set';

        // Append the legend circle and legend value to the legend set
        legendSet.appendChild(legendCircle);
        legendSet.appendChild(legendValue);

        // Append the legend set to the symbols container
        symbolsContainer.appendChild(legendSet);
    }

    // Append the symbols container to the legend container
    legendContainer.appendChild(symbolsContainer);

    // Attach event listeners to the legend circles on mouseover and mouseout
    const legendCircles = document.getElementsByClassName('legendCircle');

    for (let i = 0; i < legendCircles.length; i++) {
        // Add event listeners to the legend circles
        legendCircles[i].addEventListener('mouseover', function () {
            const className = legendCircles[i].classList[1];
            highlightFeatures(className);

            // Change the color to yellow
            legendCircles[i].style.backgroundColor = 'red';
        });
        legendCircles[i].addEventListener('mouseout', function () {
            resetFeatureStyles();  // Call a function to reset styles
        });
    }
};

// Function to display popup content in the side-panel-container to the left of the map.
const showPopupContent = (content) => {
    const popupContent = document.getElementById('popup-content');
    popupContent.innerHTML = content;
    popupContent.style.display = 'block'; // Show the content
}

// Update the year and total vandalism count in slider legend each time the slider is moved
const updateTotalVandalismCountDisplay = (year) => {
    const totalCountElement = document.getElementById('total-count');
    const selectedYearElement = document.getElementById('selected-year');
    selectedYearElement.textContent = year;
    totalCountElement.textContent = vandalismCountsByYear[year].toLocaleString() || '0';
};

// Summarize all vandalism counts by year from the GeoJSON data
const sumYearCounts = (data) => {
    // Initialize an object to hold our year sums.
    const vandalismCountsByYear = {};

    // Iterate over each feature in the GeoJSON data.
    data.features.forEach(feature => {
        // Go through each property of the feature.
        for (const key in feature.properties) {
            // Check if the property key starts with "Vandalism_" and is followed by a year between 2015 and 2023.
            if (/Vandalism_20(1[5-9]|2[0-3])$/.test(key)) {
                // Extract the year from the key.
                const year = key.split('_')[1];
                // If the year doesn't exist in our object, initialize it with 0.
                if (!vandalismCountsByYear[year]) {
                    vandalismCountsByYear[year] = 0;
                }
                // Add the count for this feature to the total for the year.
                vandalismCountsByYear[year] += feature.properties[key];
            }
        }
    });
    // Return the accumulated counts.
    return vandalismCountsByYear;
}

// Define class ranges for the proportional symbols
const calculateClassRanges = (minValue, maxValue) => {
    const range = maxValue - minValue;
    const classWidth = range / 2; // Divide the total range into two classes
    const minLimit = 10;
    return [
        { min: classWidth + 1, max: maxValue, className: "high" },
        { min: minLimit + 1, max: classWidth, className: "mid" },
        { min: minValue, max: minLimit, className: "low" }
    ];
}

// Determine the class range for each feature based on its value
const getClassRange = (value, classRanges) => {
    for (const range of classRanges) {
        if (value >= range.min && value <= range.max) {
            return range.className;
        }
    }
    return 'No Vandalism';
};

// Highlight features on the map based on their class name
const highlightFeatures = (className) => {
    geoJson.eachLayer((layer) => {
        if (layer.options.className === className) {
            //TODO: Add logic to only restyle classes that don't match so they fade to the background
            // increasing the visual affordance for the highlighted class.
            //layer.setStyle({ fillColor: 'purple' }); // Or a different highlight style
        }
    });
}

// Reset the style of all features on the map
const resetFeatureStyles = () => {
    geoJson.eachLayer((layer) => {
        // Reset the style back to the original
        layer.setStyle({ fillColor: '#ff7800' });
    });
}

function updateLegendForYear(year) {
    const { minValue, maxValue } = calcYearMinMax(jsonData, year);
    const legendContainer = document.getElementById('legend');
    // Clear existing legend items
    legendContainer.innerHTML = '';

    // Recreate legend items based on the current year's data
    createLegend(minValue, maxValue); // Assuming createLegend is adaptable to dynamic ranges
}

// TODO: Consolidate functions to update symbols and display
// const updateMapDisplay = (year) => {
//     updatePropSymbols(geoJson, "Vandalism_" + year); // Assuming attribute format
//     updateSliderDisplay(year);
//     updateTotalVandalismCountDisplay(year);
//     updateMapDescription(year);
// }

// Function to fetch and display the historical wildfire data by year
const addFireBoundariesByTime = async (year) => {
    try {
        const response = await fetch("data/MTBS_CAOR.geojson");
        const data = await response.json();
        const filteredData = {
            type: 'FeatureCollection',
            features: data.features.filter(feature => Number(feature.properties.StartYear) === year)
        };
console.log('in the addFireBoundaries', filteredData.features);
// TODO: VERIFY THAT THIS IS NEEDED and not adding bugs -  Clear existing layers if needed
        if (window.geoJsonLayer) {
console.log('in the window.geoJsonLayer, removing layer... ', window.geoJsonLayer[0]);
            map.removeLayer(window.geoJsonLayer);
        }

        // Create a new GeoJSON layer with filtered data
        window.geoJsonLayer = L.geoJSON(filteredData, {
            style: {
                color: "#ff7800",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.1,
                fillColor: "#87CEFA"
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties) {
                    // Create an HTML string for the popup content
                    let popupContent = '<div class="popup-content">';
                    // Check if FireName exists and add it to the popup
                    if (feature.properties.FireName) {
                        popupContent += `<h3>${feature.properties.FireName}</h3>`;
                    }
                    // Check if StartYear exists and add it to the popup
                    if (feature.properties.StartYear) {
                        popupContent += `<p><strong>Start Year:</strong> ${feature.properties.StartYear}</p>`;
                    }

                    if (feature.properties.Acres) {
                        let formattedAcres = Number(feature.properties.Acres).toLocaleString();
                        popupContent += `<p><strong>Acres Burned:</strong> ${formattedAcres}</p>`;
                    }
                    // Close the HTML div tag
                    popupContent += '</div>';
                    // Bind the HTML content to the popup
                    layer.bindPopup(popupContent);
                }
            }
        }).addTo(map);
        updateYearDisplay(currentYear);

    } catch (error) {
        console.error('Error loading GeoJSON data:', error);
    }
};

// Extract All Unique Years from the MBTS GeoJSON
const extractUniqueYears = (features) => {
    const years = new Set();
    features.forEach(feature => {
        const igDate = feature.properties.Ig_Date;
        if (igDate) {
            const year = igDate.substring(0, 4);
            years.add(year);
        }
    });
    return Array.from(years).sort();
};

const loadFireData  = async () => {
    try {
        const response = await fetch(geoJsonPaths["mtbs-fires-pts"]);
        const data = await response.json();
        const uniqueYears = extractUniqueYears(data.features);
        let [minValue, maxValue] = determineMinMax(data.features); // Calculate minimum and maximum burned acres
        // Initialize the slider with these years
        setupSliderAndButtons(uniqueYears);
        filterMapByYear(uniqueYears[0]); // Add the first year's data to the map on page load)
    } catch (error) {
        console.error("Failed to load or process geojson:", error);
    }
};

// Function to add fire data to the map
const addFireDataToMap = (geojsonData) => {
    if (window.geoJsonLayer) {
        map.removeLayer(window.geoJsonLayer); // Remove existing layer if it exists
    }
    let [minValue, maxValue] = determineMinMax(geojsonData.features);

    // create the legend using the min and max values from the filtered year data
    createProportionalLegend(minValue, maxValue);

    window.geoJsonLayer = L.geoJSON(geojsonData, {
        pointToLayer: function (feature, latlng) {
            // Determine fill color based on fire incident type
            let fillColor;
            switch (feature.properties.Incid_Type) {
                case 'Wildfire':
                    fillColor = '#E85D04'; // Red Orange for Wildfire
                    break;
                case 'Prescribed Fire':
                    fillColor = '#FF9A8C'; // Soft Coral for Prescribed Fire
                    break;
                case 'Unknown':
                        fillColor = '#787878'; // Gray for Unknown
                        break;
                case 'Wildland Fire Use':
                        fillColor = '#82c785'; // Light Green for Beneficial Wildfire/Managed Wildfire
                        break;
                default:
                    fillColor = '#ff7800'; // Gray if type is Unknown
            }
            return L.circleMarker(latlng, {
                radius: calcPropRadius(minValue, feature.properties.BurnBndAc),
                fillColor: fillColor,
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: (feature, layer) => {
            if (feature.properties) {
                // Convert string to Date object
                const dateString = feature.properties.Ig_Date;
                const date = new Date(dateString);
                const formattedDate = date.toLocaleDateString("en-US");  // Output: "7/14/1984"
                const popupContent = `<h3>Fire Name: ${feature.properties.Incid_Name || 'No Name'}</h3>
                                      <p>Ignition Date: ${formattedDate}</p>
                                      <p>Acres Burned: ${feature.properties.BurnBndAc?.toLocaleString()}</p>
                                      <p>Type of Fire: ${feature.properties.Incid_Type}</p>`;
                layer.bindPopup(popupContent);
            }
        }
    }).addTo(map);
};

// Function to calculate the radius of the circle marker
const calcPropRadius = (minValue, burnedAcres) => {
    // Define a minimum radius for the symbol, to ensure it's always visible
    const minRadius = 1;
    // Calculate the radius of the symbol using the Flannery Appearance Compensation formula
    // This formula is used to adjust the size of the symbol proportionally based on the attribute value
    const radius = 1.0083 * Math.pow(burnedAcres / minValue, 0.5715) * minRadius;
    return radius;
};

const setupSliderAndButtons = (years) => {
    const slider = document.getElementById('yearSlider');
    const rangeValueDisplay = document.getElementById('rangeValue');
    const reverseButton = document.getElementById('reverse');
    const forwardButton = document.getElementById('forward');

    // Set the slider properties based on the years array
    slider.min = 0;  // Start index at 0 for simplicity in indexing
    slider.max = years.length - 1;  // Max index is the last index in the years array
    slider.value = 0;  // Default to the first year
    rangeValueDisplay.textContent = years[0];

    // Function to update the slider appearance and value
    function updateSliderAppearance(index) {
        const percentage = (index / (years.length - 1)) * 100;
        slider.style.background = `linear-gradient(to right, red ${percentage}%, grey ${percentage}%)`;
        rangeValueDisplay.textContent = years[index];
        filterMapByYear(years[index]);
    }

    // Initial map load with the first year
    updateSliderAppearance(0);

    // Event listener for manual slider adjustments
    slider.oninput = () => {
        updateSliderAppearance(parseInt(slider.value, 10));
    };

    // Setup button functionalities to adjust slider
    reverseButton.addEventListener('click', function() {
        if (parseInt(slider.value, 10) > 0) {
            slider.value = parseInt(slider.value, 10) - 1;
            updateSliderAppearance(slider.value);
        }
    });

    forwardButton.addEventListener('click', function() {
        if (parseInt(slider.value, 10) < years.length - 1) {
            slider.value = parseInt(slider.value, 10) + 1;
            updateSliderAppearance(slider.value);
        }
    });
};

const filterMapByYear = (year) => {
    fetch(geoJsonPaths["mtbs-fires-pts"])
        .then(response => response.json())
        .then(data => {
            const filteredData = {
                type: 'FeatureCollection',
                features: data.features.filter(feature => feature.properties.Ig_Date?.substring(0, 4) === year)
            };
            addFireDataToMap(filteredData);
        })
        .catch(error => {
            console.error("Error filtering data:", error);
        });
};

const calculateClassRanges = (minValue, maxValue) => {
    const range = maxValue - minValue;
    const classWidth = range / 3;  // Creating three classes
    // Return an array of objects, each defining a class range and a label
    return [
        { min: minValue, max: minValue + classWidth, label: `${minValue.toLocaleString()} - ${Math.round(minValue + classWidth).toLocaleString()} acres` },
        { min: minValue + classWidth, max: minValue + 2 * classWidth, label: `${Math.round(minValue + classWidth).toLocaleString()} - ${Math.round(minValue + 2 * classWidth).toLocaleString()} acres`},
        { min: minValue + 2 * classWidth, max: maxValue, label: `${Math.round(minValue + 2 * classWidth).toLocaleString()} - ${maxValue.toLocaleString()} acres` },
    ];
};

/**
 * Function to calculate the minimum and maximum values of a given attribute in a set of GeoJSON features.
 * @param {Array} features - An array of GeoJSON features.
 * @param {string} attribute - The attribute to calculate the minimum and maximum values for.
 * @returns {Array} An array containing the minimum and maximum values of the specified attribute.
 */
const determineMinMax = (features) => {
    // Initialize minimum and maximum values to infinity and negative infinity respectively
    let min = Infinity, max = -Infinity;
    // Iterate over each feature in the array of GeoJSON features and update the minimum and maximum values accordingly
    features.forEach(feature => {
        // Get the value of the specified attribute for the current feature
        const acres = feature.properties.BurnBndAc;
        // Update the minimum value if the current value is smaller
        min = Math.min(min, acres);
        // Update the maximum value if the current value is larger
        max = Math.max(max, acres);
    });
    // Return an array containing the minimum and maximum values of the specified attribute
    return [min, max];
};

/**
 * Function to create a dynamic map legend
 * @param {number} minValue - The minimum value for the legend
 * @param {number} maxValue - The maximum value for the legend
 * @returns {void} - This function does not return any value, it creates a dynamic map legend
 */
function createProportionalLegend(minValue, maxValue) {
    const legendContainer = document.getElementById('proportional-container');
    legendContainer.innerHTML = '';  // Clear existing content
    // Calculate the class ranges based on the minimum and maximum values
    const range = maxValue - minValue;
    const classWidth = range / 3;  // Creating three classes
    const classes = [
        { min: minValue, max: minValue + classWidth, label: `${minValue.toLocaleString()} - ${Math.round(minValue + classWidth).toLocaleString()} acres` },
        { min: minValue + classWidth, max: minValue + 2 * classWidth, label: `${Math.round(minValue + classWidth).toLocaleString()} - ${Math.round(minValue + 2 * classWidth).toLocaleString()} acres`},
        { min: minValue + 2 * classWidth, max: maxValue, label: `${Math.round(minValue + 2 * classWidth).toLocaleString()} - ${maxValue.toLocaleString()} acres` },
    ];

    // Reverse the order of the classes array so the legend will be displayed in the correct order
    classes.reverse();

    // Create the legend-item container
    classes.forEach(cls => {
        const radius = calcPropRadius(minValue, (cls.max + cls.min) / 2);
        // Create the legend-item container
        const itemContainer = document.createElement("div");
        itemContainer.className = "legend-item-proportional";

        // Create the circle and value elements
        const legendCircle = document.createElement('div');
        legendCircle.className = 'legendCircle-proportional';
        legendCircle.style.width = legendCircle.style.height = `${radius * 2}px`;
        let legendValue = document.createElement('div');
        legendValue.className = 'legendValue-proportional';
        legendValue.textContent = cls.label;
        //legendCircle.append(legendValue);

        // Append elements in the correct hierarchy
        itemContainer.appendChild(legendCircle);
        itemContainer.appendChild(legendValue);
        legendContainer.appendChild(itemContainer);
    });
}

const createCloroplethLegend = () => {
    const legendContainer = document.getElementById('cloropleth-container');
    legendContainer.innerHTML = ''; // Clear existing content

    const classes = [
        { label: 'Wildfire', color: '#E85D04' },
        { label: 'Prescribed Fire', color: 'yellow' },
        { label: 'Wildland Fire Use', color: '#82c785' },
        { label: 'Unknown', color: '#787878' },
    ];

    classes.forEach(cls => {
        const itemContainer = document.createElement("div");
        itemContainer.className = "legend-item-cloropleth";

        const legendCircle = document.createElement('div');
        legendCircle.className = 'legendCircle-cloropleth';
        legendCircle.style.width = legendCircle.style.height = '30px';
        legendCircle.style.backgroundColor = cls.color;

        const legendValue = document.createElement('div');
        legendValue.className = 'legendValue-cloropleth';
        legendValue.textContent = cls.label;

        itemContainer.appendChild(legendCircle);
        itemContainer.appendChild(legendValue);
        legendContainer.appendChild(itemContainer);
    });
};


//TODO _ THIS IS NOT CURRENTLY SETUP
// Function to update the search control with new data
function updateSearchControl(layer) {
    if (map.hasControl(window.searchControl)) {
        map.removeControl(window.searchControl);
    }
    window.searchControl = new L.Control.Search({
        layer: layer,
        propertyName: 'FireName',
        position: 'topleft',
        initial: false,
        zoom: 12,
        marker: false,
        moveToLocation: (latlng, title, map) => {
            map.fitBounds(latlng.layer.getBounds());
            latlng.layer.fire('click'); // Open the popup
        },
        filter: (text, layer) => {
            return layer.feature.properties.FireName.toLowerCase().includes(text.toLowerCase());
        }
    });
    map.addControl(window.searchControl);
}


// Make sure that the slider the default click propagation behavior on the map is disabled (e.g., when user clicks on slider, map won't zoom)
const slider = L.DomUtil.get('slider');
if (slider) {
    L.DomEvent.disableClickPropagation(slider);
    L.DomEvent.on(slider, 'mousewheel', L.DomEvent.stopPropagation);
}

// --------------------------------------------------------------------------------------
// Sidebar Logic
// Special Appreciation goes to Grzegorz Tomicki for providing
// implementation logic for the clickable sidebar:
// https://github.com/tomickigrzegorz/leaflet-examples/blob/master/docs/56.sidebar/style.css
// ---------------------------------------------------------------------------------------

// Selectors
const menuItems = document.querySelectorAll(".menu-item");
const sidebar = document.querySelector(".sidebar");
const buttonClose = document.querySelector(".close-button");

// Add event handlers for the menu items
menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
        const target = e.target;

        if (
            target.classList.contains("active-item") ||
            !document.querySelector(".active-sidebar")
        ) {
            document.body.classList.toggle("active-sidebar");
        }

        // show content
        showContent(target.dataset.item);
        // add active class to menu item
        addRemoveActiveItem(target, "active-item");
    });
});

// Remove active class from menu item and content
const addRemoveActiveItem = (target, className) => {
    const element = document.querySelector(`.${className}`);
    target.classList.add(className);
    if (!element) return;
    element.classList.remove(className);
}

// show specific content
const showContent = (dataContent) => {
    const idItem = document.querySelector(`#${dataContent}`);
    addRemoveActiveItem(idItem, "active-content");
}

// Close sidebar when click on close button
buttonClose.addEventListener("click", () => {
    closeSidebar();
});

// Close the sidebar when user clicks escape key
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSidebar();
    }
});

// Close sidebar when click near it
document.addEventListener("click", (e) => {
    if (!e.target.closest(".sidebar")) {
        closeSidebar();
    }
});

// Close sidebar when user clicks on close button
const closeSidebar = () => {
    document.body.classList.remove("active-sidebar");
    const element = document.querySelector(".active-item");
    const activeContent = document.querySelector(".active-content");
    if (!element) return;
    element.classList.remove("active-item");
    activeContent.classList.remove("active-content");
}

// Ensures the map initialization happens after the DOM is fully loaded
//document.addEventListener('DOMContentLoaded', createMap(mapParams.containerID, mapParams.center, mapParams.zoom));