
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

// Define thresholds for fire sizes
const SMALL_FIRE_MAX_ACREAGE = 2500;    // up to 2,500 acres
const MEDIUM_FIRE_MAX_ACREAGE = 10000;  // up to 10,000 acres
const LARGE_FIRE_MAX_ACREAGE = 50000;   // up to 50,000 acres
// Any fire above 50,000 acres is considered a mega fire

// Define fixed sizes for the icons based on proportions
const BASE_FIRE_SIZE = 16; // Small fire as the visual reference
const MEDIUM_FIRE_SIZE = BASE_FIRE_SIZE * 1.4;  // 40% increase
const LARGE_FIRE_SIZE = BASE_FIRE_SIZE * 2.2;  // 80% increase
const MEGA_FIRE_SIZE = BASE_FIRE_SIZE * 3.4;  // 120% increase

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
        'ak': { tooltip: 'Zoom to Alaska', center: [60.67, -151.626], zoom: 4 }, // Alaska
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
    createProportionalLegend();
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
                addFireBoundariesByTime(dataDates['fire-history'].startYear);
                console.log('HI: ' + dataDates['fire-history'].startYear);
            } else {
                isHistorySectionVisible = false;
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

// Highlight features on the map based on their class name
// const highlightFeatures = (className) => {
//     geoJson.eachLayer((layer) => {
//         if (layer.options.className === className) {
//             //TODO: Add logic to only restyle classes that don't match so they fade to the background
//             // increasing the visual affordance for the highlighted class.
//             //layer.setStyle({ fillColor: 'purple' }); // Or a different highlight style
//         }
//     });
// }

// // Reset the style of all features on the map
// const resetFeatureStyles = () => {
//     geoJson.eachLayer((layer) => {
//         // Reset the style back to the original
//         layer.setStyle({ fillColor: '#ff7800' });
//     });
// }

// function updateLegendForYear(year) {
//     const { minValue, maxValue } = calcYearMinMax(geoJson, year);
//     const legendContainer = document.getElementById('legend');
//     // Clear existing legend items
//     legendContainer.innerHTML = '';

//     // Recreate legend items based on the current year's data
//     createProportionalLegend(minValue, maxValue); // Assuming createProportionalLegend is adaptable to dynamic ranges
// }
//====================================================================================================
//====================================================================================================
//====================================================================================================
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
        const response = await fetch(geoJsonPaths["mtbs-fires-poly"]);
        const data = await response.json();
        const filteredData = {
            type: 'FeatureCollection',
            features: data.features.filter(feature => Number(feature.properties.StartYear) === year)
        };

        if (window.geoJsonLayer) {
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
        // Initialize the slider with these years
        setupSliderAndButtons(uniqueYears);
        filterMapByYear(uniqueYears[0]); // Add the first year's data to the map on page load)
    } catch (error) {
        console.error("Failed to load or process geojson:", error);
    }
};

/**
 * Function to add and style fire data to the map
 * @param {Object} geojsonData - The GeoJSON data containing the fire incident locations and attributes
 */
const addFireDataToMap = (geojsonData) => {
    if (window.geoJsonLayer) {
        map.removeLayer(window.geoJsonLayer); // Remove existing layer if it exists
    }

    window.geoJsonLayer = L.geoJSON(geojsonData, {
        pointToLayer: function (feature, latlng) {
            // Determine fill color based on fire incident type
            const fireType = feature.properties.Incid_Type;
            const iconUrl = getIconUrlForFireType(fireType);
            const iconSize = calcPropRadius(feature.properties.BurnBndAc);
            // const iconSize = radius * 3;  // Scale icon size based on radius

            const fireIcon = L.icon({
                iconUrl: iconUrl,
                iconSize: [iconSize, iconSize],
                className: 'fire-icon'
            });

            return L.marker(latlng, {
                icon: fireIcon
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

// Helper function to determine icon URL based on fire type
function getIconUrlForFireType(fireType) {
    switch (fireType) {
        case 'Wildfire':
            return '/img/wildfire_igType2.svg';
        case 'Prescribed':
            return '/img/prescribed_igType2.svg';
        case 'Unknown':
            return '/img/unknown_igType2.svg';
        case 'Wildland Fire Use':
            return '/img/beneficialFire_igType2.svg';
        case 'Outline':
            return '/img/fire_outline.svg';
        default:
            return '/img/unknown_igType2.svg';
    }
}

/**
 * Calculates the proportional radius of a symbol based on the attribute value.
 *
 * @param {number} minValue - The minimum attribute value.
 * @param {number} burnedAcres - The attribute value for which the radius is calculated.
 * @returns {number} The calculated radius of the symbol.
 */
// const calcPropRadius = (minValue, burnedAcres) => {
//     // Define a minimum radius for the symbol, to ensure it's always visible
//     const minRadius = 2;
//     // Calculate the radius of the symbol using the Flannery Appearance Compensation formula
//     // This formula is used to adjust the size of the symbol proportionally based on the attribute value
//     const radius = 1.0083 * Math.pow(burnedAcres / minValue, 0.5715) * minRadius;
//     return radius;
// };

const calcPropRadius = (burnedAcres) => {
    if (burnedAcres <= SMALL_FIRE_MAX_ACREAGE) {
        return BASE_FIRE_SIZE;
    } else if (burnedAcres <= MEDIUM_FIRE_MAX_ACREAGE) {
        return MEDIUM_FIRE_SIZE;
    } else if (burnedAcres <= LARGE_FIRE_MAX_ACREAGE) {
        return LARGE_FIRE_SIZE;
    } else {
        return MEGA_FIRE_SIZE;
    }
};

/**
 * Sets up the slider and buttons for controlling the years.
 *
 * @param {Array} years - An array of years.
 */
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

/**
 * Filters the map data by year.
 * @param {string} year - The year to filter the data by.
 */
const filterMapByYear = (year) => {
    fetch(geoJsonPaths["mtbs-fires-pts"])
        .then(response => response.json())
        .then(data => {
            const filteredData = {
                type: 'FeatureCollection',
                features: data.features.filter(feature => feature.properties.Ig_Date?.substring(0, 4) === year)
            };
            addFireDataToMap(filteredData);
            // Calculate total acres burned for the year
            let yearSumAcres = calculateTotalAcresByYear(filteredData);

            // Update the map title with the total acres burned for the year
            updateMapTitle(yearSumAcres, year);
        })
        .catch(error => {
            console.error("Error filtering data:", error);
        });
};

/**
 * Function to create a proportional map legend.
 * @param {number} minValue - The minimum value for the legend.
 * @param {number} maxValue - The maximum value for the legend.
 * @returns {void} - This function does not return any value, it creates a proportional map legend.
 */
const createProportionalLegend = () => {
    const legendContainer = document.getElementById('proportional-container');
    legendContainer.innerHTML = '';  // Clear existing content

    // Create and append the header for the Proportional Legend
    const header = document.createElement('div');
    header.className = 'column-header-proportional';
    header.textContent = 'Acres Burned:';
    legendContainer.appendChild(header);  // Append the header to the container

    // Create icon and label containers
    const iconContainer = document.createElement("div");
    iconContainer.className = "icon-container";

    const labelContainer = document.createElement("div");
    labelContainer.className = "label-container";

    // Define the categories and their labels and sizes
    const categories = [
        { label: 'Small: 500-2,5k', size: BASE_FIRE_SIZE },
        { label: 'Medium: 2.5k-10k', size: MEDIUM_FIRE_SIZE },
        { label: 'Large: 10k-50k', size: LARGE_FIRE_SIZE },
        { label: 'Mega: 50k+', size: MEGA_FIRE_SIZE }
    ];

    // Create the legend items for each category
    categories.forEach(category => {
        // Use the outline fire icon as the default
        const defaultFireType = 'Outline'; // Replace with actual default type if different
        const iconUrl = getIconUrlForFireType(defaultFireType);

        // Create an img element for the fire icon
        const legendIcon = document.createElement('img');
        legendIcon.src = iconUrl;
        legendIcon.style.width = legendIcon.style.height = `${category.size}px`; // Fixed size for each category
        iconContainer.appendChild(legendIcon);  // Append the icon to the icon container

        // Create a div for the label
        const legendLabel = document.createElement('div');
        legendLabel.className = 'legendLabel-proportional';
        legendLabel.textContent = category.label;
        labelContainer.appendChild(legendLabel);  // Append the label to the label container
    });

    // Append icon and label containers to the legend container
    legendContainer.appendChild(iconContainer);
    legendContainer.appendChild(labelContainer);
};

/**
 * Function to create a cloropleth map legend.
 * @returns {void} - This function does not return any value, it creates a proportional map legend.
 */
const createCloroplethLegend = () => {
    const legendContainer = document.getElementById('cloropleth-container');
    // Create and append the header for the Cloropleth Legend
    const header = document.createElement('div');
    header.className = 'column-header-cloropleth';
    header.textContent = 'Ignition Types:';
    legendContainer.appendChild(header);  // Append the header to the container

    const classes = [
        { label: 'Wildfire', iconUrl: '/img/wildfire_igType2.svg' },
        { label: 'Prescribed Fire', iconUrl: '/img/prescribedFire_igType2.svg' },
        { label: 'Wildland Fire Use', iconUrl: '/img/beneficialFire_igType2.svg' },
        { label: 'Unknown', iconUrl: '/img/unknown_igType2.svg' },
    ];

    classes.forEach(cls => {
        const itemContainer = document.createElement("div");
        itemContainer.className = "legend-item-cloropleth";

        // Use an SVG image instead of a colored circle
        const legendIcon = document.createElement('img');
        legendIcon.src = cls.iconUrl;
        legendIcon.style.width = legendIcon.style.height = '40px';  // Adjust size as necessary

        const legendValue = document.createElement('div');
        legendValue.className = 'legendValue-cloropleth';
        legendValue.textContent = cls.label;

        // Append the icon and label to the container
        itemContainer.appendChild(legendIcon);
        itemContainer.appendChild(legendValue);
        legendContainer.appendChild(itemContainer);
    });
};

/**
 * Calculates the total acres burned by year from the given geojsonData.
 *
 * @param {Object} geojsonData - The geoJSON data containing the features with burn data.
 * @returns {Object} - An object with the total acres burned by year.
 */
const calculateTotalAcresByYear = (geojsonData) => {
    const summary = {};

    geojsonData.features.forEach(feature => {
        const year = feature.properties.Ig_Date.substring(0, 4);
        const incType = feature.properties.Incid_Type; // 'Incid_Type' is the property for ignition type
        const acres = feature.properties.BurnBndAc || 0;

        if (!summary[year]) {
            summary[year] = {
                totalAcres: 0 // Initialize total acres for all fire types
            };
        }
        if (!summary[year][incType]) {
            summary[year][incType] = 0;
        }

        summary[year][incType] += acres;
        summary[year].totalAcres += acres; // Increment total acres for the year
    });

    return summary;
};

/**
 * Updates the map title with the given number of acres.
 * @param {number} acres - The number of acres to display in the map title.
 * @returns {void}
 */
const updateMapTitle = (yearData, year) => {
    console.log('yearData:', yearData);
    // Check if data for the specific year is available
    if (!yearData[year]) {
        console.error('Data for year', year, 'is not available.');
        return;
    }

    // Directly retrieve values from the yearData
    const totalFireAcres = yearData[year]['totalAcres'] || 0;  // Use a default of 0 if no data
    const prescribedFireAcres = yearData[year]["Prescribed Fire"] || 0;  // Use a default of 0 if no data
    const unknownAcres = yearData[year]['Unknown'] || 0;
    const wildfireAcres = yearData[year]['Wildfire'] || 0;
    const wildLandFireUseAcres = yearData[year]["Wildland Fire Use"] || 0;

    // Update the DOM elements with the new values
    const fireYearElements = document.getElementsByClassName('fire-year');
    Array.from(fireYearElements).forEach(element => {
        element.textContent = year;
    });

    const fireTotalElements = document.getElementsByClassName('total-fire-acres');
    Array.from(fireTotalElements).forEach(element => {
        element.textContent = totalFireAcres.toLocaleString();
    });
    document.getElementById('wildfire-acres').textContent = wildfireAcres.toLocaleString(); // Format numbers with commas
    document.getElementById('prescribed-acres').textContent = prescribedFireAcres.toLocaleString();
    document.getElementById('wildland-fire-use-acres').textContent = wildLandFireUseAcres.toLocaleString();  // Assuming 'Wildfire' is equivalent to 'Wildland Fire Use'
    document.getElementById('unknown-acres').textContent = unknownAcres.toLocaleString();
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