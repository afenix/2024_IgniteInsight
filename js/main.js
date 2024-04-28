
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