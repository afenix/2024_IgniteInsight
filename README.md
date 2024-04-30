# Ignite Insights

**Author:** Alister Fenix @AFenix

## Project Description
Ignite Insights is a dynamic web-based application designed to visualize and analyze historical wildfire data across the United States. This tool enables users to interactively explore data related to wildfire occurrences, trends, and impacts from 1984 to the present. By providing a comprehensive platform, Ignite Insights aims to inform community members, researchers, and policymakers about fire patterns to enhance preparedness and mitigation strategies.

### **Feedback & Contributions**
I welcome your insights and suggestions to improve this project. Specifically, I'm interested in feedback on:
1. Improvements in data representation, operator use, and styling.
2. Suggestions for additional features or user interactions.
3. Ideas on how to better implement UX/UI design principles.


## Features
- Interactive Mapping: Zoom and pan through a detailed map of the U.S. to discover wildfire data specific to various regions.
- Dynamic Data Visualization: View a stacked bar chart that updates based on the selected year, showing acres burned by fire type.
- Detailed Fire Information: Click on map points to get detailed information about specific fire events, including the name, date, type, and size of each fire.
- Educational Resources: Access background information, usage instructions, and data sources through an integrated side panel.

## Dependencies

- [Leaflet 1.9.4](https://leafletjs.com/2022/09/21/leaflet-1.9.0.html) for map creation and interaction.
- [d3 v7](https://d3js.org/) for creating dynamic, interactive data visualizations in the web browser.

This repository is organized as follows:

- `index.html`: Serves as the entry point, incorporating the map along with its interactive functionalities.
- `js/main.js`: Contains the JavaScript logic for generating the interactive map, chart, and includes data loading and visual effects.
- `css/style.css`: Defines custom styles for the map and other webpage elements to improve aesthetics and user experience.
- `data/mtbs_firesPts84_22.geojson`: GeoJSON dataset detailing wildfires across the U.S. from 1984 through 2022.
- `lib/`: Folder containing Leaflet, D3.js library, and  other dependencies.
- `img/`: Directory for storing image files used in the project.

## Getting Started

1. Clone or download this repository to your local system.
2. Open the project in a code editor or IDE (e.g., Visual Studio Code, Atom, Sublime Text).
3. **Launch a Local Server**:
   - **Using Python**:
     - Ensure Python is installed on your system. If not, download it [here](https://www.python.org/downloads/).
     - Open a terminal or command prompt and navigate to the project directory.
     - Execute `python3 -m http.server` (or `python -m SimpleHTTPServer` for Python 2.x).
     - Access `http://localhost:8000/index.html` in your web browser (adjust the port number if necessary).
   - **Using an IDE Extension**:
     - Many IDEs provide server extensions (e.g., "Live Server" for Visual Studio Code).
     - Install the relevant extension, then follow its instructions to start the server and view the project in your browser.


